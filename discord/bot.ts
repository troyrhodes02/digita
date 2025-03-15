import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { handleCommand } from './commands.js';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent 
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on('messageCreate', async (message) => {
  console.log(`Received message: ${message.content}`);
  if (message.author.bot) return;
  if (message.content.startsWith('/')) {
    await handleCommand(message);
  }
});

client.login(process.env.DISCORD_TOKEN);
