const { google } = require('googleapis');
const db = require('../db/db');
const { oauth2Client } = require('../config/auth');

module.exports = async function catat(message) {
  try {
    const parts = message.content.split(' ');
    if (parts.length < 3) {
      return message.reply('Format: `!catat pengeluaran jumlah`');
    }

    const [_, keterangan, jumlah] = parts;
    
    // Validate amount is a number
    if (isNaN(jumlah)) {
      return message.reply('Jumlah harus berupa angka!');
    }

    const userData = await db.getUserToken(message.author.id);

    if (!userData) {
      return message.reply('Kamu belum terhubung ke Google. Ketik `!auth` untuk mulai.');
    }

    if (!userData.spreadsheet_id) {
      return message.reply('Kamu belum mengatur spreadsheet. Ketik `!setspreadsheet SPREADSHEET_ID`');
    }

    oauth2Client.setCredentials({
      access_token: userData.access_token,
      refresh_token: userData.refresh_token,
      expiry_date: userData.expiry_date,
    });

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const range = 'Sheet1!A:C';

    await sheets.spreadsheets.values.append({
      spreadsheetId: userData.spreadsheet_id,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[new Date().toISOString().split('T')[0], keterangan, parseFloat(jumlah)]],
      },
    });

    message.reply(`Pengeluaran tercatat! ${keterangan}: Rp ${jumlah}`);
  } catch (error) {
    console.error('Error in catat command:', error);
    if (error.code === 401) {
      message.reply('Token sudah expired. Silakan lakukan autentikasi ulang dengan `!auth`');
    } else if (error.code === 404) {
      message.reply('Spreadsheet tidak ditemukan. Periksa kembali Spreadsheet ID.');
    } else {
      message.reply('Terjadi kesalahan saat mencatat pengeluaran.');
    }
  }
};