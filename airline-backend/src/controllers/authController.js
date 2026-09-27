const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, memoryDB, isConnectedToMySQL } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * Register a new passenger account
 */
async function register(req, res, next) {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    // Basic Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(password, 10);

    if (isConnectedToMySQL() && pool) {
      // Check existing email
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists.'
        });
      }

      // Insert user
      const [userResult] = await pool.query(
        'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
        [name.trim(), normalizedEmail, hashedPassword, 'passenger', phone || '']
      );

      const userId = userResult.insertId;

      // Insert passenger profile
      await pool.query(
        'INSERT INTO passengers (user_id, name, email, phone) VALUES (?, ?, ?, ?)',
        [userId, name.trim(), normalizedEmail, phone || '']
      );

      const token = jwt.sign(
        { id: userId, email: normalizedEmail, role: 'passenger', name: name.trim() },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        message: 'Registration successful! Welcome aboard.',
        token,
        user: {
          id: userId,
          name: name.trim(),
          email: normalizedEmail,
          role: 'passenger',
          phone: phone || ''
        }
      });
    } else {
      // Memory DB fallback
      const exists = memoryDB.users.some(u => u.email === normalizedEmail);
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists.'
        });
      }

      const newId = memoryDB.users.length + 1;
      const newUser = {
        id: newId,
        name: name.trim(),
        email: normalizedEmail,
        password_hash: hashedPassword,
        role: 'passenger',
        phone: phone || '',
        status: 'ACTIVE',
        created_at: new Date()
      };
      memoryDB.users.push(newUser);
      memoryDB.passengers.push({
        id: memoryDB.passengers.length + 1,
        user_id: newId,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone || '',
        preferred_class: 'Economy'
      });

      const token = jwt.sign(
        { id: newId, email: normalizedEmail, role: 'passenger', name: name.trim() },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        message: 'Registration successful! Welcome aboard.',
        token,
        user: {
          id: newId,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone
        }
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * User Login (Passenger, Admin, or Staff)
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = null;

    if (isConnectedToMySQL() && pool) {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
      if (rows.length > 0) {
        user = rows[0];
      }
    } else {
      user = memoryDB.users.find(u => u.email.toLowerCase() === normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (user.status && user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact customer support.'
      });
    }

    // Verify Password Hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        address: user.address || '',
        dob: user.dob || null
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current authenticated user profile
 */
async function getMe(req, res, next) {
  try {
    const userId = req.user.id;
    let user = null;

    if (isConnectedToMySQL() && pool) {
      const [rows] = await pool.query(
        'SELECT id, name, email, role, phone, address, dob, status, created_at FROM users WHERE id = ?',
        [userId]
      );
      if (rows.length > 0) user = rows[0];
    } else {
      const found = memoryDB.users.find(u => u.id === userId);
      if (found) {
        user = {
          id: found.id,
          name: found.name,
          email: found.email,
          role: found.role,
          phone: found.phone || '',
          address: found.address || '',
          dob: found.dob || null,
          status: found.status,
          created_at: found.created_at
        };
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update Profile
 */
async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, phone, address, dob } = req.body;

    if (isConnectedToMySQL() && pool) {
      await pool.query(
        'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), address = COALESCE(?, address), dob = COALESCE(?, dob) WHERE id = ?',
        [name, phone, address, dob, userId]
      );
    } else {
      const u = memoryDB.users.find(usr => usr.id === userId);
      if (u) {
        if (name) u.name = name;
        if (phone) u.phone = phone;
        if (address) u.address = address;
        if (dob) u.dob = dob;
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Change Password
 */
async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both current password and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    let user = null;
    if (isConnectedToMySQL() && pool) {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
      if (rows.length > 0) user = rows[0];
    } else {
      user = memoryDB.users.find(u => u.id === userId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.'
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    if (isConnectedToMySQL() && pool) {
      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
    } else {
      user.password_hash = newHash;
    }

    res.json({
      success: true,
      message: 'Password changed successfully!'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
};
