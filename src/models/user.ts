import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  discordId: string;
  username: string;
  avatar?: string;
  walletAddress?: string;
  roles: string[];
  email: string;
}

const UserSchema = new Schema<IUser>(
  {
    discordId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    avatar: { type: String },
    walletAddress: { type: String },
    email: { type: String, required: true, unique: true },
    roles: [String],
  },
  {
    timestamps: true,
  },
);

export const User = model<IUser>("User", UserSchema);
