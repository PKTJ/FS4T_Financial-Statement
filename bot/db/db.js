const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function saveUserToken(discordUserId, tokens, spreadsheetId = null) {
  const expiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
  await pool.query(`
    INSERT INTO user_tokens (discord_user_id, access_token, refresh_token, expiry_date, spreadsheet_id)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (discord_user_id)
    DO UPDATE SET access_token = $2, refresh_token = $3, expiry_date = $4, spreadsheet_id = $5
  `, [discordUserId, tokens.access_token, tokens.refresh_token, expiry, spreadsheetId]);
}

async function getUserToken(discordUserId) {
  const res = await pool.query(
    'SELECT * FROM user_tokens WHERE discord_user_id = $1',
    [discordUserId]
  );
  return res.rows[0];
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  saveUserToken,
  getUserToken,
};