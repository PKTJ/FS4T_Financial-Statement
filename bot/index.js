require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const { startOAuthServer } = require('./config/auth');
const { getUserToken } = require('./db/db');
const setSpreadsheet = require('./commands/setspreadsheet');
const catat = require('./commands/notes');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
  console.log(`Bot aktif sebagai ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!setspreadsheet')) {
    await setSpreadsheet(message);
  } else if (message.content.startsWith('!catat')) {
    await catat(message);
  } else if (message.content.startsWith('!auth')) {
    const port = process.env.PORT || 3000;
    const authUrl = `http://localhost:${port}/auth?discord_user_id=${message.author.id}`;
    message.reply(`Klik link ini untuk autentikasi: ${authUrl}`);
  }
});

client.login(process.env.DISCORD_TOKEN);

// Mulai OAuth server
startOAuthServer();