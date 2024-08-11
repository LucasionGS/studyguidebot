import Discord from "discord.js";
import { setupCommandHandler } from "./commandHandler";
import "./commands";
import "./sequelize";

const client = new Discord.Client({
  intents: [
    Discord.IntentsBitField.Flags.Guilds,
    Discord.IntentsBitField.Flags.GuildMessages,
    Discord.IntentsBitField.Flags.MessageContent,
  ]
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
if (!DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN is not provided");
}

client.login(DISCORD_TOKEN);

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
  setupCommandHandler(client); // Set up the commands on the bot
});