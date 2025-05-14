import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as DiscordStrategy } from "passport-discord";
import { User } from "../models/user";

import dotenv from "dotenv";
dotenv.config();

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET as string,
};

const adminJwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.ADMIN_SECRET as string,
};

interface AuthenticationError extends Error {
  code?: string;
  statusCode?: number;
}

passport.use(
  "adminjwt",
  new JWTStrategy(adminJwtOptions, (payload: { username: string }, done) => {
    return done(null, payload);
  }),
);

passport.use(
  "jwt",
  new JWTStrategy(
    jwtOptions,
    (payload: { username: string; email: string }, done) => {
      return done(null, payload);
    },
  ),
);

const attemptTracker = new Map<
  string,
  { count: number; firstAttempt: number }
>();

passport.use(
  new LocalStrategy((username: string, password: string, done) => {
    const now = Date.now();
    const attemptData = attemptTracker.get(username) || {
      count: 0,
      firstAttempt: now,
    };

    if (now - attemptData.firstAttempt > 60000) {
      attemptData.count = 0;
      attemptData.firstAttempt = now;
    }

    if (attemptData.count >= 5) {
      return done(null, false, {
        message: "Too many failed attempts. Try again later.",
      });
    }

    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      attemptTracker.delete(username);
      return done(null, { username: process.env.ADMIN_USERNAME });
    }

    attemptData.count += 1;
    attemptTracker.set(username, attemptData);
    return done(null, false, { message: "Invalid credentials" });
  }),
);

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
      callbackURL: process.env.DISCORD_CALLBACK_URL as string,
      scope: ["identify", "email", "guilds"],
    },
    async function (_accessToken, _refreshToken, profile, cb) {
      try {
        const user = await User.findOne({ email: profile.email });

        if (user) {
          return cb(null, user);
        }

        const newUser = new User({
          discordId: profile.id,
          email: profile.email,
          avatar: profile.avatar,
          username: profile.username,
        });

        const savedUser = await newUser.save();
        return cb(null, savedUser);
      } catch (err) {
        console.error("Authentication error:", err);
        const authError: AuthenticationError =
          err instanceof Error
            ? err
            : new Error("Unknown authentication error");
        authError.statusCode = 500;
        return cb(authError, undefined);
      }
    },
  ),
);

export default passport;
