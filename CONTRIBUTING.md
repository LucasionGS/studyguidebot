# Contributing to [Your Bot Name]

Thank you for considering contributing to [Your Bot Name]! We welcome all levels of programming experience. Here's how you can contribute:

## Getting Started

1. **Join our Discord Server** for updates and discussions.
2. **Clone the Repository**:
   ```bash
   git clone https://github.com/LucasionGS/studyguidebot.git
   cd studyguidebot
   ```

## Setting Up
This app is designed to run using Bun. It should work perfectly fine using Node.js (With some tweaking), but it is recommended to use Bun for the best out-of-the-box experience.
1. **Install Bun**:
  Using instructions from [Bun.sh](https://bun.sh/)
  Linux/MacOS:
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```
  Windows (Powershell):
  ```powershell
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```
2. **Install Dependencies**:
   ```bash
   bun install
   ```
3. **Run the Bot**:
   ```bash
    bun run index.ts
    ```
4. **Invite the Bot to Your Server**:
    - Create a new Discord application and bot. [Discord Developer Applications](https://discord.com/developers/applications)
    - Copy the bot token and paste it in the `.env` file.
    - Use the following link to invite the bot to your server:
      ```
      https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot&permissions=8
      ```
      Replace `YOUR_CLIENT_ID` with your bot's client ID.

## Making Changes

1. **Create a Branch**:
   ```bash
   git checkout -b your-branch-name
   ```
2. **Make Your Changes**.

## Submitting Changes

1. **Commit Your Changes**:
   ```bash
   git commit -m "Description of changes"
   ```
2. **Push Your Branch**:
   ```bash
   git push origin your-branch-name
   ```
3. **Open a Pull Request** on GitHub.

## Contribution Guidelines

- **Be Respectful**: Maintain a welcoming environment.
- **Write Clear Commit Messages**.
- **Stay Consistent**: Follow existing coding styles.

## Ideas for Contribution

- **Fix Bugs**
- **Implement New Features**
- **Improve Documentation**
- **Review Code**

## Resources

- [Discord.js Documentation](https://discord.js.org/#/docs/main/stable/general/welcome)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [GitHub Guides](https://guides.github.com/)

If you have any questions, ask in our Discord server.

Happy coding!

\- Lucasion
