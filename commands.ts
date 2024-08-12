import Helper from "./Helper";
import yaml from "js-yaml";
import { addCommand, addMessageComponentCallback, commands, getGuildUserByInteraction, type CommandArgument, type CommandCallback } from "./commandHandler";
import { ActionRow, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentBuilder, EmbedBuilder, StringSelectMenuBuilder, type APIActionRowComponent, type APIMessageActionRowComponent, type Message } from "discord.js";
import * as users from './users';
import { checkSpamLink } from "./spamlink";
import { updateUserRole } from "./roles";

const resourcesFilePath: string = path.join(__dirname, 'resources.json');


//#region Command Definitions

// Moderation Commands
// Mute command
// addCommand("mute", [
//   { name: "user", description: "The user to mute", required: true, type: "USER" },
//   { name: "time", description: "Duration to mute the user", required: true, type: "STRING" }
// ], async (int) => {

//   const sender = await getGuildUser(int);
//   if (!sender.permissions.has("MuteMembers", true)) {
//     int.reply("You do not have permission to use this command.");
//     return;
//   }
  
//   const user = int.options.getUser("user", true);
//   const time = int.options.getString("time", true);

//   if (!user || !time) {
//     int.reply("Usage: /mute <user> <time>");
//     return;
//   }

//   try {
//     const guildUser = await getGuildUser(int, user.id);
//     guildUser.edit({ mute: true });
//     setTimeout(() => {
//       guildUser.edit({ mute: false });
//     }, Helper.resolveTimeString(time));
  
//     // Implement mute logic here
//     int.reply(`User ${user.username} has been muted for ${time}.`);
//   } catch (error) {
//     int.reply("An error occurred while trying to mute the user.");
//   }
// });

addCommand("help", [
  { name: "command", description: "The command to get help for", required: false, type: "STRING" }
], (int) => {
  const command = int.options.getString("command");
  if (!command) {
    const commandList = Array.from(commands.keys()).map(a => `**${a}**`).join(", ");
    int.reply(`Available commands: ${commandList}`);
    return;
  }

  const commandData = commands.get(command);
  if (!commandData) {
    int.reply(`Command ${command} not found.`);
    return;
  }

  const args = commandData.options.map(arg => `${arg.name}: ${arg.description}`).join("\n");
  int.reply(`Command ${command}:\n${args}`);
});

// Ban command
addCommand("ban", [
  { name: "user", description: "The user to ban", required: true, type: "USER" },
  { name: "reason", description: "Reason for the ban", required: true, type: "STRING" }
], async (int) => {
  try {
      const sender = await getGuildUserByInteraction(int);
      if (!sender.permissions.has("BanMembers",true)) {
         await int.reply("You do not have permission to use this command.");
         return;
      }

      const user = int.options.getUser("user");
      const reason = int.options.getString("reason");
      if (!user || !reason) {
         await int.reply("Usage: /ban <user> <reason>");
         return;
      }

      // Check if the user to be banned has a role higher than the bot's role
      const guildUser = await getGuildUserByInteraction(int, user.id);
      if (guildUser.roles.highest.position >= sender.roles.highest.position) {
         await int.reply("You cannot ban this user because their role is higher or equal to yours.");
         return;
      }

      await guildUser.ban({
         reason
      });
    await int.reply(`User ${user.username} has been banned for ${reason}.`);
   } catch (error) {
      console.error(error);
      await int.reply("An error occurred while trying to ban the user.");
   }
});

// Kick command
addCommand("kick", [{
   name: "user",
   description: "The user to kick",
   required: true,
   type: "USER"
}, {
   name: "reason",
   description: "Reason for the kick",
   required: false,
   type: "STRING"
}], async (int) => {
   try {
      const sender = await getGuildUserByInteraction(int);
      if (!sender.permissions.has("KickMembers", true)) {
         await int.reply("You do not have permission to use this command.");
         return;
      }

      const user = int.options.getUser("user");
      const reason = int.options.getString("reason") || "No reason provided";
      if (!user) {
         await int.reply("Usage: /kick <user> [reason]");
         return;
      }

      // Check if the user to be kicked has a role higher than the bot's role
      const guildUser = await getGuildUserByInteraction(int, user.id);
      if (guildUser.roles.highest.position >= sender.roles.highest.position) {
         await int.reply("You cannot kick this user because their role is higher or equal to yours.");
         return;
      }

      await guildUser.kick(reason);
      await int.reply(`User ${user.username} has been kicked for ${reason}.`);
   } catch (error) {
      console.error("An error occurred in the kick command:", error);

      // This message ensures the server continues running even if there is an error.
      await int.reply("An error occurred while trying to kick the user. Please try again later.");
   }
});

// Helpful Commands

// # please improve `interface` if aren't added

// Simple URL validation function using regex
function isValidUrl(url: string): boolean {
   const urlPattern: RegExp = /^(https?:\/\/)?([\w\d\-_]+\.)+[a-z]{2,6}(\/[\w\d\-_\.]*)*$/i;
   return urlPattern.test(url);
}

// Simple sanitization function
function sanitizeInput(input: string): string {
   return input.trim().toLowerCase();
}

// profile command 

addCommand("profile", [], async (int) => {
   const userId = int.user.id; // Get the Discord user ID
   const username = int.user.username; // Get the username of the person requesting the profile

   try {
      // Load user data
      let userData = users.loadUserData(userId);
      
      // Create an embed with the user's profile information
      const embed = new EmbedBuilder()
      .setTitle(`💫  @**${username}'s Profile**  💫`)
      .setColor(0xFFD700)
      .setDescription(
         `◉⁠ **Submissions:** ${userData.submission}\n` +
         `◉⁠ **Level:** ${userData.level}\n` +
         `◉⁠ **Pending Submissions:** ${userData.submissionPending}\n` +
         `◉⁠ **Roles:** ${userData.roles[0] || 'None'}\n` +
         `◉⁠ **Tokens:** ✪ ${userData.tokens || 0} \n`
      );

      // Send the embed as a reply
      await int.reply({
         embeds: [embed]
      });
      return;

   } catch (error) {
      // Log the error to a file or console for debugging
      console.error(error);

      // Check if the error is due to Discord API/network issues
      if (error.name === 'DiscordAPIError') {
         await int.reply("⚠️ There was an issue connecting to Discord's servers. Please try again later.");
         return;
      }

      // Handle file system errors (e.g., issues with reading or writing user data)
      if (error.code === 'ENOENT') {
         await int.reply("⚠️ An issue occurred while accessing your profile data. Please try again later.");
         return;
      }

      // Generic error message for any other issues
      await int.reply("⚠️ An unexpected error occurred while retrieving your profile. Please try again later.");
      return;
   }
});

// dailyReward command 

addCommand("dailyreward", [], async (int) => {
   const userId = int.user.id; // Get the Discord user ID
   const username = int.user.username; // Get the username of the person claiming the reward
   try {
      // Load user data
      let userData = users.loadUserData(userId);

      // Check if the user has already claimed the daily reward
      if (userData.dailyRewardClaimed && Helper.isToday(userData.lastClaimed)) {
         await int.reply("You have already claimed your daily reward today. Come back tomorrow!");
         return;
      }

      // Add 20 tokens to the user's account
      if (!userData.tokens) {
         userData.tokens = 0; // Initialize tokens if not present
      }
      userData.tokens += 20;

      // Update the user's last claimed date and dailyRewardClaimed status
      userData.dailyRewardClaimed = true;
      userData.lastClaimed = Helper.getCurrentDate();

      // Save the updated user data
      users.saveUserData(userId, userData);

      // Reply with a confirmation message
      await int.reply(`🎁  ${username}, you have successfully claimed ✪ 20 tokens! 🎉 \nYou now have ✪ ${userData.tokens} tokens.`);
      return;
   } catch (error) {
      console.error(error);
      await int.reply("An error occurred while claiming your daily reward.");
      return;
   }
});

// SubmitResources command 

addCommand("submitresource", [{
   name: "subject",
   description: "The subject of the resource (i.e. css)",
   required: true,
   type: "STRING"
},
   {
      name: "link",
      description: "The link to the resource",
      required: true,
      type: "STRING"
   },
   {
      name: "topic",
      description: "A topic related to the resource (max 25 characters, i.e. grid)",
      required: false,
      type: "STRING"
   },
   {
      name: "description",
      description: "A brief description of the resource (max 150 characters)",
      required: false,
      type: "STRING"
   }], async (int) => {
   await int.deferReply(); // Acknowledge the interaction immediately

   const subject = sanitizeInput(int.options.getString("subject"));
   const topic = sanitizeInput(int.options.getString("topic") || "");
   const link = sanitizeInput(int.options.getString("link"));
   const description = sanitizeInput(int.options.getString("description") || "");
   const addedBy = int.user.username; // Username of the person who added the resource
   const userId = int.user.id; // User ID of the person who added the resource

   // Validate URL
   if (!isValidUrl(link)) {
      return int.editReply("The provided link is not a valid URL. Please ensure it starts with http:// or https://.");
   }
   // Validate description if provided
   if (description && !Helper.isValidDescription(description)) {
      return int.editReply("The description is invalid. It should only contain alphanumeric characters and specific symbols and be at most 150 characters long.");
   }
   // Validate topic if provided
   if (topic.length > 25) {
      return int.editReply("The topic is too long. It should be at most 25 characters.");
   }

   try {
      // Read existing data from the JSON file
      let resources = [];
      if (fs.existsSync(resourcesFilePath)) {
         const data = fs.readFileSync(resourcesFilePath, 'utf8');
         resources = JSON.parse(data);
      }

      // Add the new entry (include contributer name — create a new key)
      resources.push({
         subject: subject,
         link: link,
         description: description || null, // Store as null if not provided
         topic: topic || null, // Store as null if not provided
         addedBy: userId, // Include user ID
         approved: false, // Default value for approved field
         approver: null
      });

      // Write the updated data back to the JSON file
      fs.writeFileSync(resourcesFilePath, JSON.stringify(resources, null, 2), 'utf8');

      // Update user data to increment submissionPending
      let userData = users.loadUserData(userId);
      userData.submissionPending = (userData.submissionPending || 0) + 1; // Initialize if undefined
      users.saveUserData(userId, userData);

      // Reply with a confirmation message
      return int.editReply(`Resource successfully added! 🎉\n\n**subject:** ${subject}\n**topic:** ${topic || "N/A"}\n**Link:** \`${link}\`\n\nThank you for your contribution! Once your submission is approved, you will be awarded ✪ 20 points and will level up. Your pending submissions count is now ${userData.submissionPending}. Keep up the great work! 🚀`);

   } catch (error) {
      console.error("Error adding resource:", error);

      if (error instanceof SyntaxError) {
         return int.editReply("There was an error processing the data. Please try again.");
      } else if (error.code === 'ENOENT') {
         return int.editReply("The resources file is missing. Please contact support.");
      } else if (error.code === 'EACCES') {
         return int.editReply("Permission denied. Unable to write to the resources file.");
      } else {
         return int.editReply("An unexpected error occurred. Please try again later.");
      }
   }
});

// Resource command
addCommand("resources", [{
   name: "subject",
   description: "The subject to get resources for",
   required: true,
   type: "STRING"
}, {
   name: "topic",
   description: "The topic to get resources for",
   required: false,
   type: "STRING"
}], async (int) => {
   try {
      // Acknowledge the interaction to avoid timeout
      await int.deferReply({
         ephemeral: true
      });

      // Retrieve and trim input options
      const subject = int.options.getString("subject")?.trim().toLowerCase();
      const topic = int.options.getString("topic")?.trim().toLowerCase() || "";

      // Load resources from the file
      let resources = [];
      if (fs.existsSync(resourcesFilePath)) {
         const data = fs.readFileSync(resourcesFilePath, 'utf8');
         resources = JSON.parse(data);
      }

      // Filter resources based on subject and topic not very very efficient but okay
      let filteredResources = resources.filter(resource => {
         const matchessubject = resource.subject.toLowerCase().includes(subject);
         const matchestopic = !topic || resource.topic?.toLowerCase().includes(topic) || resource.description?.toLowerCase().includes(topic);
         return matchessubject && matchestopic && resource.approved
      }).sort((a, b) => {
         const asubjectMatch = a.subject.toLowerCase().includes(subject);
         const atopicMatch = topic && (a.topic?.toLowerCase().includes(topic) || a.description?.toLowerCase().includes(topic));

         const bsubjectMatch = b.subject.toLowerCase().includes(subject);
         const btopicMatch = topic && (b.topic?.toLowerCase().includes(topic) || b.description?.toLowerCase().includes(topic));

         // Prioritize resources where both subject and topic match
         if (asubjectMatch && atopicMatch && !(bsubjectMatch && btopicMatch)) {
            return -1; // a moves above b
         }
         if (!(asubjectMatch && atopicMatch) && bsubjectMatch && btopicMatch) {
            return 1; // b moves above a
         }
         return 0; // no change in order
      }).slice(0,
         5); // Limit the results to a maximum of 5 resources

      // Handle case with no matching resources
      if (filteredResources.length === 0) {
         await int.editReply({
            content: `🔍 No resources found for subject **"${subject}"** and topic **"${topic || "any"}"**. Would you like to contribute? Use the command \`/submitresource\` to add a new resource.`,
         });
         return;
      }

      const embed = new EmbedBuilder()
      .setTitle(`📚 Resources Found`)
      .setDescription(`Here are some resources for the **subject**: **"${subject}"**${topic ? ` and **topic**: **"${topic}"**`: ''}.`)
      .setColor('#423eef') // Customize the color
      .setTimestamp();

      filteredResources.forEach(resource => {

         //addedBy gives UID not name (modify this)

         embed.addFields(
            {
               name: '📒 ~☆ subject ☆~', value: resource.subject.toUpperCase() +'\n', inline: true
            },
            {
               name: '📑  topic', value: resource.topic || "N/A", inline: true
            },
            {
               name: '🔗  LINK', value: `${resource.link}`, inline: false
            },
            {
               name: '📄  DESCRIPTION', value: resource.description || "No description provided", inline: false
            },
            {
               name: '👤  ADDED BY', value: `@${resource.addedBy}`, inline: false
            },
            {
               name: '\u200b', value: '\u200b', inline: false
            }
         );
      })

      // Send the embed
      await int.editReply({
         embeds: [embed]
      });
   } catch (error) {
      console.error('Error handling interaction:', error);
      await int.editReply({
         content: "⚠️ An unexpected error occurred while processing your request. Please try again later.",
      });
   }
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

const questionMessages: Record<string, {
  message: Message,
  question: AnsweredQuestion
}> = {};

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

      const answeredQuestion: AnsweredQuestion = { ...question, response: [] };

      addMessageComponentCallback(customId, async (interaction) => {
        if (interaction.isStringSelectMenu()) {
          // Get selected answer
          const selectedAnswer = interaction.values;
          const user = interaction.user;
          answeredQuestion.response = answeredQuestion.response.filter(response => response.userId !== user.id);
          selectedAnswer.forEach(answer => {
            answeredQuestion.response.push({ userId: user.id, answer: answer });
          });
          const users = [...new Set(answeredQuestion.response.map(response => response.userId))];
          questionMessage.edit({
            content: "Responses: " + users.length,
          });
          interaction.reply({
            content: "Answer submitted!",

            ephemeral: true
          });
        }
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
      
      questionMessages[questionMessage.id] = { message: questionMessage, question: answeredQuestion };
    }

    int.reply("Questions have been posted!");

  } catch (e: any) {
    int.reply(`Failed to parse YAML: ${e.message}`);
  }
});

// Get question responses
addCommand("responses", [
  { name: "question_message_id", description: "The ID of the question message", required: true, type: "STRING" }
], async (int) => {
  const questionId = int.options.getString("question_message_id");
  const questionMessage = questionId && questionMessages[questionId];
  if (!questionMessage) {
    int.reply("Invalid question ID.");
    return;
  }

  const responses = questionMessage.question.response;
  if (responses.length == 0) {
    int.reply("No responses yet.");
    return;
  }

  const groupByUser = responses.reduce((acc, response) => {
    if (!acc[response.userId]) {
      acc[response.userId] = [];
    }
    acc[response.userId].push(response.answer);
    return acc;
  }, {} as Record<string, string[]>);

  const responseString = Object.entries(groupByUser).map(([userId, answers]) => {
    return `User <@${userId}> answered: ${answers.join(", ")}`;
  }).join("\n");
  int.reply({
    content: `Responses:\n${responseString}`,
    ephemeral: true
  });
});

// 

//#endregion