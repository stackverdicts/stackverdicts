import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../config/database';
import { env } from '../config/env';

const SALT_ROUNDS = 10;
const JWT_SECRET = env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

interface RegisterData {
  email: string;
  password: string;
  name?: string;
  role?: 'admin' | 'editor' | 'viewer';
}

interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const { email, password, name, role = 'viewer' } = data;

    // Check if user already exists
    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const userId = randomUUID();
    await query(
      `INSERT INTO users (id, email, password_hash, name, role)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, email, passwordHash, name || null, role]
    );

    // Get created user
    const user = await queryOne<User>(
      `SELECT id, email, name, role, created_at, updated_at, last_login_at
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (!user) {
      throw new Error('Failed to create user');
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return { user, token };
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<{ user: User; token: string }> {
    const { email, password } = data;

    // Get user by email
    const user = await queryOne<User & { password_hash: string }>(
      `SELECT id, email, name, role, password_hash, created_at, updated_at, last_login_at
       FROM users
       WHERE email = ?`,
      [email]
    );

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return { user: userWithoutPassword, token };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const user = await queryOne<User>(
      `SELECT id, email, name, role, created_at, updated_at, last_login_at
       FROM users
       WHERE id = ?`,
      [userId]
    );

    return user || null;
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

export const authService = new AuthService();
