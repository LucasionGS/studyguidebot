import { type APIApplicationCommandOptionChoice, REST, Routes, SlashCommandBuilder, InteractionType } from "discord.js"
import type { ApplicationCommandOptionBase, CacheType, ChatInputCommandInteraction, Client, CommandInteraction, MessageComponentInteraction, User } from "discord.js";

/**
 * A map of MessageComponent callbacks with their ID as the key
 */
const messageComponentCallbacks = new Map<string, (interaction: MessageComponentInteraction<CacheType>) => void>();

export function addMessageComponentCallback(id: string, callback: (interaction: MessageComponentInteraction<CacheType>) => void) {
  messageComponentCallbacks.set(id, callback);
}

export function removeMessageComponentCallback(id: string): void;
export function removeMessageComponentCallback(func: (interaction: MessageComponentInteraction<CacheType>) => void): void;
export function removeMessageComponentCallback(id: string | ((interaction: MessageComponentInteraction<CacheType>) => void)) {
  if (typeof id === "function") {
    for (const [key, value] of messageComponentCallbacks) {
      if (value === id) {
        messageComponentCallbacks.delete(key);
      }
    }
    return;
  }
  messageComponentCallbacks.delete(id);
}

/**
 * A map of commands and their respective callbacks
 */
export const commands = new Map<string, Command>();
export type CommandCallback = (interaction: ChatInputCommandInteraction) => void;

export interface CommandArgument {
  name: string;
  description: string;
  required: boolean;
  type?: "STRING" | "INTEGER" | "BOOLEAN" | "USER" | "CHANNEL" | "ROLE" | "ATTACHMENT";
}

export interface Command {
  name: string;
  description: string;
  options: CommandArgument[];
  callback: CommandCallback;
}

/**
 * Add a new command to the list of commands
 */
export function addCommand(command: string, args: CommandArgument[], callback: CommandCallback): Command {
  const newCommand: Command = {
    name: command,
    description: "No description provided",
    options: args,
    callback
  };
  commands.set(command, newCommand);
  return newCommand;
}

/**
 * Setup the command handler for the bot.
 * This should be called after the commands have all been added, as it also sets up the command info with Discord.
 * @param client The Discord client
 */
export function setupCommandHandler(client: Client) {
  client.on("interactionCreate", (interaction) => {

    console.log(InteractionType[interaction.type]);
    
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;
  
      const command = commands.get(commandName);
      if (!command) return;
  
      command.callback(interaction);
    }
    else if (interaction.isMessageComponent()) {
      const callback = messageComponentCallbacks.get(interaction.customId);
      if (callback) {
        callback(interaction);
      }
    }
  });

  // Set up the commands with Discord
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!); // DISCORD_TOKEN is guaranteed to be defined here, checked in index.ts

  (async () => {
    try {
      console.log("Started refreshing application (/) commands.");

      const commandsToRegister = Array.from(commands.values()).map((command) => {
        const builder = new SlashCommandBuilder()
          .setName(command.name)
          .setDescription(command.description);

        
        function setBasics<SlashCommandOption extends ApplicationCommandOptionBase>(option: SlashCommandOption, cOption: CommandArgument): SlashCommandOption {
          return option
            .setName(cOption.name)
            .setDescription(cOption.description)
            .setRequired(cOption.required);
        }
          
        for (const cOption of command.options) {
          const type = cOption.type || "STRING";
          
          if (type === "STRING") {
            builder.addStringOption(o => setBasics(o, cOption));
          }
          else if (type === "BOOLEAN") {
            builder.addBooleanOption(o => setBasics(o, cOption));
          }
          else if (type === "INTEGER") {
            builder.addIntegerOption(o => setBasics(o, cOption));
          }
          else if (type === "CHANNEL") {
            builder.addChannelOption(o => setBasics(o, cOption));
          }
          else if (type === "ROLE") {
            builder.addRoleOption(o => setBasics(o, cOption));
          }
          else if (type === "USER") {
            builder.addUserOption(o => setBasics(o, cOption));
          }
          else if (type === "ATTACHMENT") {
            builder.addAttachmentOption(o => setBasics(o, cOption));
          }
          else {
            builder.addStringOption(o => setBasics(o, cOption));
          }
          
        }

        return builder.toJSON();
      });

      await rest.put(
        Routes.applicationCommands(client.user!.id),
        { body: commandsToRegister },
      );

      console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
      console.error(error);
    }
  })();
}

export async function getGuildUserByInteraction(interaction: ChatInputCommandInteraction, userId?: string) {
  userId ??= interaction.user.id;
  return interaction.guild!.members.cache.get(userId) || interaction.guild!.members.fetch(userId);
}