import { signToken, verifyPassword } from '../../lib/auth';
import { pool } from '../../lib/db_connection';
import cookie from 'cookie';

export default async function handler(req, res) {
  // Only accept POST requests 
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    // Check if database connection status
    if (!pool) {
      console.error('Database pool is not initialized');
      return res.status(500).json({ message: 'Database connection error' });
    }

    // Fetch user 
    const [rows] = await pool.execute(
      'SELECT ID, user_email, user_pass, user_nicename FROM users WHERE user_email = ? LIMIT 1',
      [email]
    );

    // Reject if no user
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    // Verify password against hashed password
    const isValid = await verifyPassword(password, user.user_pass);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token 
    const token = signToken({ userId: user.ID, email: user.user_email, user_nicename: user.user_nicename });

    // Set token 
    res.setHeader(
      'Set-Cookie',
      cookie.serialize('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, 
        path: '/',
        sameSite: 'lax',
      })
    );

    
    return res.status(200).json({ message: 'Logged in' });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
