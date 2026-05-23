const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const generateToken = require('../utils/generateToken');

// Lazy initialize students table columns if they don't exist
(async () => {
  try {
    await db.execute('ALTER TABLE students ADD COLUMN IF NOT EXISTS section VARCHAR(10);');
    await db.execute('ALTER TABLE students ADD COLUMN IF NOT EXISTS subsection VARCHAR(10);');
  } catch (err) {
    console.warn("Optional student columns section/subsection might already exist or error:", err.message);
  }
})();

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const { full_name, email, password, roll_number, branch_id, section, subsection } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    console.log('Registration attempt for:', email);
    const [existingEmail] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
      console.log('Email already exists:', email);
      return res.status(409).json({ message: 'Email already registered' });
    }

    if (roll_number) {
      const [existingStudent] = await db.execute('SELECT user_id FROM students WHERE roll_number = ?', [roll_number]);
      if (existingStudent.length > 0) {
        console.log('Roll Number already exists:', roll_number);
        return res.status(409).json({ message: 'Roll Number already registered' });
      }
    }

    console.log('Hashing password...');
    const password_hash = await bcrypt.hash(password, 10);

    console.log('Inserting into users table...');
    const [result] = await db.execute(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [full_name, email, password_hash, 'student']
    );

    const userId = result.insertId;
    console.log('User created with ID:', userId);

    // Add student record (branch_id defaults to 1 if not provided)
    console.log('Attempting to create student record for roll_number:', roll_number);
    await db.execute(
      'INSERT INTO students (user_id, roll_number, branch_id, semester, academic_year, section, subsection) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (user_id) DO NOTHING',
      [userId, roll_number || `STU${userId}`, branch_id || 1, 1, '2024-25', section || '1', subsection || '1']
    ).then(() => console.log('Student record created successfully'))
    .catch((err) => console.error('Student record creation failed:', err.message));

    const token = generateToken(userId);
    console.log('Registration successful, token generated');

    res.status(201).json({
      success: true,
      token,
      user: { id: userId, full_name, email, role: 'student' }
    });
  } catch (error) {
    console.error('Register error details:', error);
    if (error.code === '23505') {
      if (error.constraint === 'users_email_unique') {
        return res.status(409).json({ message: 'Email already registered' });
      } else if (error.constraint === 'students_roll_number_unique') {
        return res.status(409).json({ message: 'Roll Number already registered' });
      }
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration', 
      error: error.message 
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [users] = await db.execute(
      'SELECT id, full_name, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );
    const user = users[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, full_name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    const user = users[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
