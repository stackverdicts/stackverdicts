// Quick test to verify MySQL connection
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('Testing MySQL connection...\n');
  console.log('Config:');
  console.log('  Host:', process.env.DB_HOST);
  console.log('  Port:', process.env.DB_PORT);
  console.log('  User:', process.env.DB_USER);
  console.log('  Database:', process.env.DB_NAME);
  console.log('');

  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('Connecting...');
    await pool.query('SELECT 1');
    console.log('✅ Connection successful!\n');

    console.log('Checking tables...');
    const [tables] = await pool.query('SHOW TABLES');
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach((table) => {
      console.log('  -', Object.values(table)[0]);
    });

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
