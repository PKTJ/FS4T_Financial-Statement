const express = require('express');
const { google } = require('googleapis');
const open = require('open');
const db = require('../db/db');

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function startOAuthServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.get('/auth', (req, res) => {
    const { discord_user_id } = req.query;
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: discord_user_id,
    });
    res.redirect(url);
  });

  app.get('/oauth2callback', async (req, res) => {
    const { code, state } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    await db.saveUserToken(state, tokens);
    res.send('Autentikasi berhasil! Kamu bisa kembali ke Discord.');
  });

  app.listen(port, () => {
    console.log(`OAuth server berjalan di http://localhost:${port}`);
  });
}

module.exports = { startOAuthServer, oauth2Client };
