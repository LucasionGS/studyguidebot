import Discord from "discord.js";
import { setupCommandHandler } from "./commandHandler";
import "./commands";
import "./sequelize";
import * as users from './users';
import { checkSpamLink } from "./spamlink";
import { updateUserRole } from "./roles";

//require('dotenv').config();

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


// Event listener for each new messages
client.on('messageCreate', async (message) => {
  if (message.author.bot) return; // Ignore bot messages
  await checkSpamLink(message);
  
  const channel = client.channels.cache.get(message.channel.id);
  if(channel && channel.isTextBased() && channel instanceof Discord.TextChannel) {
  await updateUserRole(message, channel, message.author.id);
  }
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
  setupCommandHandler(client); // Set up the commands on the bot
});