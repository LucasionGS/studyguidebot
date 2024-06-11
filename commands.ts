import Helper from "./Helper";
import yaml from "js-yaml";
import { addCommand, addMessageComponentCallback, getGuildUser, type CommandArgument, type CommandCallback } from "./commandHandler";
import { ActionRow, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentBuilder, EmbedBuilder, StringSelectMenuBuilder, type APIActionRowComponent, type APIMessageActionRowComponent, type Message } from "discord.js";

//#region Command Definitions

// Moderation Commands
// Mute command
addCommand("mute", [
  { name: "user", description: "The user to mute", required: true, type: "USER" },
  { name: "time", description: "Duration to mute the user", required: true, type: "STRING" }
], async (int) => {

  const sender = await getGuildUser(int);
  if (sender.permissions.has("MuteMembers")) {
    int.reply("You do not have permission to use this command.");
    return;
  }
  
  const user = int.options.getUser("user", true);
  const time = int.options.getString("time", true);

  if (!user || !time) {
    int.reply("Usage: /mute <user> <time>");
    return;
  }

  try {
    const guildUser = await getGuildUser(int, user.id);
    guildUser.edit({ mute: true });
    setTimeout(() => {
      guildUser.edit({ mute: false });
    }, Helper.resolveTimeString(time));
  
    // Implement mute logic here
    int.reply(`User ${user.username} has been muted for ${time}.`);
  } catch (error) {
    int.reply("An error occurred while trying to mute the user.");
  }
});

// Ban command
addCommand("ban", [
  { name: "user", description: "The user to ban", required: true, type: "USER" },
  { name: "reason", description: "Reason for the ban", required: true, type: "STRING" }
], async (int) => {

  const sender = await getGuildUser(int);
  if (sender.permissions.has("BanMembers")) {
    int.reply("You do not have permission to use this command.");
    return;
  }
  
  const user = int.options.getUser("user");
  const reason = int.options.getString("reason");

  if (!user || !reason) {
    int.reply("Usage: /ban <user> <reason>");
    return;
  }

  try {
    const guildUser = await getGuildUser(int, user.id);
    await guildUser.ban({ reason: reason });
  
    // Implement ban logic here
    int.reply(`User ${user.username} has been banned for ${reason}.`);
  } catch (error) {
    int.reply("An error occurred while trying to ban the user.");
  }
});

// Helpful Commands

// Resource command
addCommand("resources", [
  { name: "topic", description: "The topic to get resources for", required: true, type: "STRING" }
], (int) => {
  const topic = int.options.getString("topic");
  
  // Provide resources based on the topic
  const resources: Record<string, string[]> = {
    javascript: ["https://developer.mozilla.org/en-US/docs/Web/JavaScript"],
    typescript: ["https://www.typescriptlang.org/docs/"],
    // Add more resources here
  };

  if (!topic) {
    int.reply("Usage: /resources <topic>");
    return;
  }


  const resourceLinks = resources[topic.toLowerCase()] || null;
  if (!resourceLinks) {
    int.reply(`No resources found for ${topic}`);
    return;
  }
  int.reply(`Here are some resources for ${topic}: \n  ${resourceLinks.join("\n  ")}`);
});

// Fun Commands

interface Question {
  question: string;
  answers: { answer: string; correct?: boolean }[];
}

interface AnsweredQuestion extends Question {
  response: {
    userId: string;
    answer: string;
  }[]
}

// Questionaire
addCommand("questions", [
  { name: "config", description: "YAML-formatted questions", required: false, type: "ATTACHMENT" }
], async (int) => {
  const config = int.options.getAttachment("config");

  if (!config) {
    int.reply(
      "Usage: /questions\n"
      + "You will need to upload a YAML file that follows the format below.\n"
      + "```yaml\n"
      + yaml.dump([
        {
          question: "Single choice question: What is the best programming language?",
          answers: [
            { answer: "JavaScript" },
            { answer: "TypeScript", correct: true },
            { answer: "CoffeeScript" },
          ]
        },

        {
          question: "Multiple choice question: What are the best programming languages?",
          answers: [
            { answer: "JavaScript", correct: true },
            { answer: "TypeScript", correct: true },
            { answer: "CoffeeScript" },
          ]
        },

        {
          question: "Poll question: What is the best programming language?",
          answers: [
            { answer: "TypeScript" },
            { answer: "JavaScript" },
            { answer: "CoffeeScript" },
          ]
        }
      ])
      + "```"
    );
    return;
  }

  const questionMessages: Record<string, {
    message: Message,
    question: AnsweredQuestion
  }> = {};
  
  try {
    const content = await fetch(config.url).then(res => res.text());
    // Parse the YAML config
    let questions: Question | Question[] = yaml.load(content) as any;
    if (!Array.isArray(questions)) {
      questions = [questions];
    }
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const isPoll = question.answers.filter(answer => answer.correct == true).length == 0;
      const isSingleChoice = question.answers.filter(answer => answer.correct == true).length == 1;
      // const isMultipleChoice = !isPoll && !isSingleChoice;

      const questionMessage = await int.channel!.send("Loading question...") as Message;
      
      let buttons: StringSelectMenuBuilder;

      const customId = `question_${questionMessage.id}_${i}`;
      
      if (isPoll || isSingleChoice) {
        // buttons = new StringSelectMenuBuilder()
        buttons = new StringSelectMenuBuilder()
          .setCustomId(customId)
          .setPlaceholder("Select an answer")
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(question.answers.map(answer => ({
            label: answer.answer,
            value: answer.answer
          })));
      }
      else { // isMultipleChoice
        buttons = new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder("Select an answer")
        .setMinValues(1)
        .setMaxValues(question.answers.length)
        .addOptions(question.answers.map(answer => ({
          label: answer.answer,
          value: answer.answer
        })));
      }

      addMessageComponentCallback(customId, async (interaction) => {
        const user = interaction.user;
        await interaction.reply(`${user.username} selected!`);
      });
      
      const actionRow = new ActionRowBuilder().addComponents(buttons);

      questionMessage.edit({
        content: "",
        embeds: [
          new EmbedBuilder()
            .setTitle(`Question ${i + 1}`)
            .setDescription(question.question)
        ],
        components: [
          actionRow as any // Discord.js typings are incorrect it seems, or I'm using it wrong, but this works lol
        ]
      });

      const answeredQuestion: AnsweredQuestion = { ...question, response: [] };
      
      questionMessages[questionMessage.id] = { message: questionMessage, question: answeredQuestion };
    }

    int.reply("Questions have been posted!");

  } catch (e: any) {
    int.reply(`Failed to parse YAML: ${e.message}`);
  }
});

//#endregion