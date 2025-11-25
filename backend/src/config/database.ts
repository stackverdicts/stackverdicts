import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// Parse DATABASE_URL or use individual components
let poolConfig: any;

if (process.env.DATABASE_URL.startsWith('mysql://')) {
  // Use connection string
  poolConfig = {
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };
} else {
  // Use individual components for local MAMP
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '8889'),
    user: process.env.DB_USER || 'automated-affiliate-hub',
    password: process.env.DB_PASSWORD || 'automated-affiliate-hub',
    database: process.env.DB_NAME || 'automated-affiliate-hub',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };
}

// Create connection pool
export const pool = mysql.createPool(poolConfig);

// Helper function for executing queries with error handling
export async function query<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper for single row queries
export async function queryOne<T = any>(
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results[0] || null;
}

// Helper for insert queries that return inserted ID
export async function insert(
  sql: string,
  params: any[] = []
): Promise<string> {
  try {
    const [result] = await pool.execute(sql, params) as any;
    return result.insertId ? result.insertId.toString() : '';
  } catch (error) {
    console.error('Database insert error:', error);
    throw error;
  }
}

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    console.log('✅ MySQL database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MySQL database connection failed:', error);
    return false;
  }
}

// For backward compatibility
export const db = pool;

export default pool;
