const db = require('../db/db');

module.exports = async function setSpreadsheet(message) {
  try {
    const parts = message.content.split(' ');
    if (parts.length !== 2) {
      return message.reply('Format: `!setspreadsheet SPREADSHEET_ID`');
    }

    const spreadsheetId = parts[1];
    
    // Basic validation for Google Sheets ID format
    if (!/^[a-zA-Z0-9-_]{20,}$/.test(spreadsheetId)) {
      return message.reply('Spreadsheet ID tidak valid. Pastikan format ID benar.');
    }

    const result = await db.query(
      'UPDATE user_tokens SET spreadsheet_id = $1 WHERE discord_user_id = $2',
      [spreadsheetId, message.author.id]
    );

    if (result.rowCount === 0) {
      return message.reply('Kamu belum terhubung ke Google. Ketik `!auth` untuk mulai.');
    }

    message.reply(`Spreadsheet ID diatur ke: ${spreadsheetId}`);
  } catch (error) {
    console.error('Error in setspreadsheet command:', error);
    message.reply('Terjadi kesalahan saat mengatur spreadsheet.');
  }
};
