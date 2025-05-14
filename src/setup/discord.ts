import { ethers } from "ethers";
import { Contract } from "ethers";
import { Client, GatewayIntentBits } from "discord.js";
import { IUser, User } from "../models/user";

export const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
export const ERC721_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
];

export const ROLE_MAP: Record<string, Record<string, string>> = {
  "1292804244763709470": {
    "0x34AF03074B7F72CFd1B1b0226d088A1E28c7405D": "1367487915097063514",
  },
  "1329933800125235260": {
    "0x34AF03074B7F72CFd1B1b0226d088A1E28c7405D": "999999999999999999",
  },
};

export const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

discordClient.login(process.env.DISCORD_TOKEN);

discordClient.once("ready", () => {
  console.log(`Discord client logged in as ${discordClient.user?.tag}`);
  setInterval(checkAndRemoveRoles, 60 * 60 * 1000);
});

export const giveRole = async (
  user: IUser,
  roleId: string,
  guildId: string,
) => {
  const guild = await discordClient.guilds.fetch(guildId);
  const member = await guild.members.fetch(user.discordId!);
  await member.roles.add(roleId);
};

export const removeRole = async (
  user: IUser,
  roleId: string,
  guildId: string,
) => {
  const guild = await discordClient.guilds.fetch(guildId);
  const member = await guild.members.fetch(user.discordId!);
  await member.roles.remove(roleId);
};

export const checkAndRemoveRoles = async () => {
  const users = await User.find({ walletAddress: { $exists: true } });

  for (const user of users) {
    for (const guildId of Object.keys(ROLE_MAP)) {
      for (const nftAddress of Object.keys(ROLE_MAP[guildId])) {
        const roleId = ROLE_MAP[guildId][nftAddress];
        const nft = new Contract(nftAddress, ERC721_ABI, provider);

        try {
          const balance = await nft.balanceOf(user.walletAddress!);
          if (Number(balance) === 0 && user.roles.includes(roleId)) {
            await removeRole(user, roleId, guildId);
            user.roles = user.roles.filter((r) => r !== roleId);
            await user.save();
            console.log(
              `Removed role ${roleId} from ${user.username} in guild ${guildId}`,
            );
          }
        } catch (err) {
          console.error(
            `Error checking/removing role for ${user.walletAddress}: ${err}`,
          );
        }
      }
    }
  }
};
