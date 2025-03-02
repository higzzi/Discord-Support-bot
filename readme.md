# Discord Support Bot

## Description
This project is a Discord bot designed to provide support functionality within Discord servers. It plays a specific audio message when a user joins a designated support voice channel and sends notifications to the support team.

## Features
- Joins a specified voice channel and plays an audio file when a user joins.
- Sends a notification to a specified text channel when someone needs support.
- Direct messages users with an interactive embed message containing support details.
- Cooldown mechanism for support requests to prevent spamming.

## Requirements
- [Node.js](https://nodejs.org/)
- [Discord.js](https://discord.js.org/#/)
- A Discord Bot Token

## Installation
1. Clone the repository :
   ```
   git clone https://github.com/higzzi/Support-Bot.git
   ```
2. Navigate to the project directory:
   ```
   cd Support-Bot
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage
To start the bot, run :
```
node --dns-result-order=ipv4first index.js
```

## License
Distributed under the MIT License. See `LICENSE` for more information.




