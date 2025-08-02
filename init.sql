CREATE TABLE IF NOT EXISTS user_tokens (
  id SERIAL PRIMARY KEY,
  discord_user_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date TIMESTAMP,
  spreadsheet_id TEXT
);