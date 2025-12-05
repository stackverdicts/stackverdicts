import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { query, queryOne } from './src/config/database';

const SALT_ROUNDS = 10;

async function seedAdminUser() {
  try {
    console.log('🌱 Creating admin user...');

    const email = 'stackverdicts@gmail.com';
    const password = 'Beaverbank96!';
    const name = 'Admin';

    // Check if user already exists
    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      console.log('⚠️  Admin user already exists with this email.');
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create admin user
    const userId = randomUUID();
    await query(
      `INSERT INTO users (id, email, password_hash, name, role)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, email, passwordHash, name, 'admin']
    );

    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   Role: admin`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

seedAdminUser();
