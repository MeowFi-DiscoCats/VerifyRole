import { Router } from "express";
import asyncWrapper from "../utils/asyncWrapper";
import passport from "passport";
import { IUser } from "../models/user";
import { CustomError } from "../utils/errorMiddleware";
import jwt from "jsonwebtoken";

const router = Router();

router.get("/discord", passport.authenticate("discord", { session: false }));

router.get(
  "/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/error",
    session: false,
  }),
  asyncWrapper(async (req, res) => {
    const user = req.user as IUser;
    if (!user) throw new CustomError("User not authorized", 403);
    const token = jwt.sign(
      { id: user.username, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "10m" },
    );
    res.redirect(`${process.env.REDIRECT_URL}?token=${token}`);
  }),
);

export default router;
