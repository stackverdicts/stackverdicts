import { authService } from './src/services/auth';

// Create default admin user
async function createAdmin() {
  try {
    const result = await authService.register({
      email: 'admin@stackverdicts.com',
      password: 'admin123',  // Change this in production!
      name: 'Admin User',
      role: 'admin',
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email:', result.user.email);
    console.log('Password: admin123');
    console.log('\nPlease change the password after first login!');
  } catch (error: any) {
    if (error.message === 'User with this email already exists') {
      console.log('ℹ️  Admin user already exists');
    } else {
      console.error('Error creating admin:', error.message);
    }
  }
  process.exit(0);
}

createAdmin();
