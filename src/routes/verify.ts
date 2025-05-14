import { Router } from "express";
import passport from "passport";
import asyncWrapper from "../utils/asyncWrapper";
import { z } from "zod";
import { ethers } from "ethers";
import { User, IUser } from "../models/user";
import { CustomError } from "../utils/errorMiddleware";
import { provider, ERC721_ABI, ROLE_MAP, giveRole } from "../setup/discord";

const router = Router();

const verifySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  signature: z.string(),
  nftAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid NFT address"),
  nftName: z.string(),
  guildId: z.string(),
});

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  asyncWrapper(async (req, res) => {
    const user = req.user as IUser;
    const { address, signature, nftAddress, nftName, guildId } =
      verifySchema.parse(req.body);

    const recovered = ethers.verifyMessage(nftName, signature);
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      throw new CustomError("Signature verification failed", 401);
    }

    const dbUser = await User.findOne({ email: user.email });
    if (!dbUser) throw new CustomError("User not found", 404);

    if (!dbUser.walletAddress) {
      dbUser.walletAddress = address;
      await dbUser.save();
    }

    if (dbUser.walletAddress.toLowerCase() !== address.toLowerCase()) {
      throw new CustomError("Wallet already bound to another user", 400);
    }

    const nft = new ethers.Contract(nftAddress, ERC721_ABI, provider);
    const balance = await nft.balanceOf(address);
    if (Number(balance) === 0) {
      throw new CustomError("User does not own the required NFT", 400);
    }

    const guildRoles = ROLE_MAP[guildId];
    if (!guildRoles)
      throw new CustomError("No roles configured for this guild", 500);

    const roleId = guildRoles[nftAddress];
    if (!roleId) {
      throw new CustomError(
        "No Discord role mapped for this NFT in this guild",
        500,
      );
    }

    if (dbUser.roles.includes(roleId)) {
      throw new CustomError("User already has this role", 400);
    }

    await giveRole(dbUser, roleId, guildId);
    dbUser.roles.push(roleId);
    await dbUser.save();

    res.json({ message: "Role assigned successfully" });
  }),
);

export default router;
