const { google } = require("googleapis");
require("dotenv").config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Simpan token user ke dalam memory (nanti bisa ke DB)
const userTokens = new Map();

// Mendapatkan URL agar user mengizinkan akses
function getAuthUrl(discordUserId) {
  const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: discordUserId // nanti dikembalikan saat redirect
  });
  return url;
}

// Simpan token hasil dari kode
async function setCredentialsFromCode(code, discordUserId) {
  const { tokens } = await oauth2Client.getToken(code);
  userTokens.set(discordUserId, tokens);
}

// Buat koneksi Google Sheets untuk user tertentu
function getSheetsClient(discordUserId) {
  const tokens = userTokens.get(discordUserId);
  if (!tokens) throw new Error("Token belum diset");
  oauth2Client.setCredentials(tokens);
  return google.sheets({ version: 'v4', auth: oauth2Client });
}

module.exports = {
  getAuthUrl,
  setCredentialsFromCode,
  getSheetsClient
};
