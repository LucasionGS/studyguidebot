import { addCommand } from "./commandHandler";

//#region Command Definitions

// Ping test command
addCommand("ping", [], (interaction) => {
  interaction.reply("Pong!");
});

//#endregion