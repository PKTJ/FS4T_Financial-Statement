require('dotenv').config();
const fs = require('fs');
const { google } = require('googleapis');
const { Client, GatewayIntentBits } = require('discord.js');

// === Konfigurasi Spreadsheet ===
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const auth = new google.auth.GoogleAuth({
  keyFile: 'FS4T-consol-credentials.json',
  scopes: SCOPES,
});
const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = 'FILL_WITH_YOUR_ID';

// === Bot Discord ===
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
  console.log(`Bot active as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (message.content.startsWith('!note')) {
    const args = message.content.split(' ').slice(1);
    const [jumlah, ...deskripsi] = args;
    const deskripsiText = deskripsi.join(' ');

    if (!jumlah || isNaN(jumlah) || !deskripsiText) {
      return message.reply('Incorrect format. Example: `!note 10000 lunches`');
    }

    const tanggal = new Date().toLocaleDateString('id-ID');

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A:C',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[tanggal, jumlah, deskripsiText]],
        },
      });

      message.reply(`Noted: Rp${jumlah} for "${deskripsiText}"`);
    } catch (err) {
      console.error('Invalid:', err);
      message.reply('❌ invalid respon spreadsheet.');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
