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
  const { full_name, email, password, roll_number, branch_id, section, subsection, semester } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const parsedSemester = Number(semester || 6);
  if (!Number.isInteger(parsedSemester) || parsedSemester < 5 || parsedSemester > 8) {
    return res.status(400).json({
      success: false,
      message: 'Only semester 5 to 8 students are allowed'
    });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    // Use normalized email for uniqueness check
    const [existingEmail] = await db.execute('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [normalizedEmail]);
    if (existingEmail.length > 0) {
      console.log('Email already exists (normalized):', normalizedEmail);
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
      [full_name, normalizedEmail, password_hash, 'student']
    );

    const userId = result.insertId;
    console.log('User created with ID:', userId);

    // Add student record (branch_id defaults to 1 if not provided)
    console.log('Attempting to create student record for roll_number:', roll_number);
    await db.execute(
      'INSERT INTO students (user_id, roll_number, branch_id, semester, academic_year, section, subsection) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (user_id) DO NOTHING',
      [userId, roll_number || `STU${userId}`, branch_id || 1, parsedSemester, '2024-25', section || '1', subsection || '1']
    ).then(() => console.log('Student record created successfully'))
    .catch((err) => console.error('Student record creation failed:', err.message));

    const token = generateToken(userId);
    console.log('Registration successful, token generated');

    res.status(201).json({
      success: true,
      token,
      user: { id: userId, full_name, email: normalizedEmail, role: 'student' }
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
    // Standardized error response for register failures
    res.status(500).json({
      success: false,
      message: 'Register failed',
      error: error.message,
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
    const normalizedEmail = String(email).trim().toLowerCase();
    const [users] = await db.execute(
      'SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
      [normalizedEmail]
    );
    const user = users[0];

    // If no user found, respond early
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Determine if stored password_hash is bcrypt (starts with $2) or legacy plain text
    let bcryptMatch = false;
    if (user.password_hash && user.password_hash.startsWith('$2')) {
      bcryptMatch = await bcrypt.compare(password, user.password_hash);
    } else if (user.password_hash) {
      // Legacy plain text comparison
      bcryptMatch = password === user.password_hash;
      // If match, rehash the password and update the record for future logins
      if (bcryptMatch) {
        const newHash = await bcrypt.hash(password, 10);
        await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);
      }
    }

    if (process.env.AUTH_DEBUG === 'true') {
      console.log('USER_FOUND:', !!user);
      console.log('USER_ROLE:', user.role);
      console.log('USER_ACTIVE:', user.is_active);
      console.log('HASH_EXISTS:', !!user.password_hash);
      console.log('BCRYPT_MATCH:', bcryptMatch);
    }

    if (!['student', 'mentor', 'hod'].includes(user.role)) {
      return res.status(403).json({ message: 'This role is no longer supported.' });
    }

    if (user.is_active === false) {
      return res.status(403).json({ message: 'Account is inactive. Please contact support.' });
    }

    if (!bcryptMatch) {
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
