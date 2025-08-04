// Simple database connection test
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Database URL:', process.env.DATABASE_URL);
    
    const client = await pool.connect();
    console.log('✓ Connected to database successfully!');
    
    const result = await client.query('SELECT version()');
    console.log('✓ Database version:', result.rows[0].version);
    
    // Test if the table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_tokens'
      );
    `);
    console.log('✓ user_tokens table exists:', tableCheck.rows[0].exists);
    
    client.release();
    console.log('✓ Database connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

testConnection();
