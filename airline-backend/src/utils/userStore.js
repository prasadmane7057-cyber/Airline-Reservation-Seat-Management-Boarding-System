const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const DATA_DIR = path.resolve(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'skywings-airline-secret-key-2026-prod';

const SEED_USERS = [
  {
    id: 'usr-admin-001',
    name: 'System Administrator',
    email: 'admin@skywings.com',
    password_hash: '$2a$10$jr.63tTLkeBHwCQ/6ZMWEe1VZqLczJgSNTM1pFoifNrWe9JG246Ka', // admin123
    role: 'admin',
    phone: '+91-9876543210',
    address: 'Chhatrapati Shivaji Maharaj International Airport, Mumbai',
    dob: '1985-05-15',
    status: 'ACTIVE',
    created_at: new Date('2026-10-15T00:00:00.000Z').toISOString()
  },
  {
    id: 'usr-passenger-001',
    name: 'Aarav Sharma',
    email: 'passenger@skywings.com',
    password_hash: '$2a$10$rgGsXWRCL7/FtDx8DuqX1eOrjSHGKJBtfdWlolUyfpAszBfa.JNWG', // password123
    role: 'passenger',
    phone: '+91-9876543211',
    address: 'Bandra West, Mumbai',
    dob: '1995-08-20',
    status: 'ACTIVE',
    created_at: new Date('2026-10-15T00:00:00.000Z').toISOString()
  }
];

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(SEED_USERS, null, 2), 'utf8');
  }
}

function getAllUsers() {
  ensureFile();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading users file:', err.message);
    return [...SEED_USERS];
  }
}

function saveUsers(users) {
  ensureFile();
  const tmp = USERS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(users, null, 2), 'utf8');
  fs.renameSync(tmp, USERS_FILE);
}

function getUserByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const users = getAllUsers();
  return users.find(u => u.email.toLowerCase() === cleanEmail) || null;
}

function getUserById(id) {
  if (!id) return null;
  const users = getAllUsers();
  return users.find(u => String(u.id) === String(id)) || null;
}

function createUser({ name, email, password, phone, role = 'passenger', address = '', dob = null }) {
  const cleanEmail = email.trim().toLowerCase();
  const existing = getUserByEmail(cleanEmail);
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);

  const newUser = {
    id: 'usr-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    name: name.trim(),
    email: cleanEmail,
    password_hash,
    role,
    phone: phone || '',
    address,
    dob,
    status: 'ACTIVE',
    created_at: new Date().toISOString()
  };

  const users = getAllUsers();
  users.push(newUser);
  saveUsers(users);

  return toPublicUser(newUser);
}

function updateUser(id, updates) {
  const users = getAllUsers();
  const idx = users.findIndex(u => String(u.id) === String(id));
  if (idx === -1) return null;

  const allowed = ['name', 'phone', 'address', 'dob'];
  for (const k of allowed) {
    if (updates[k] !== undefined) {
      users[idx][k] = updates[k];
    }
  }
  if (updates.password) {
    users[idx].password_hash = bcrypt.hashSync(updates.password, 10);
  }
  saveUsers(users);
  return toPublicUser(users[idx]);
}

function verifyPassword(plainPassword, passwordHash) {
  if (!plainPassword || !passwordHash) return false;
  return bcrypt.compareSync(plainPassword, passwordHash);
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function toPublicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone || '',
    address: u.address || '',
    dob: u.dob || null,
    status: u.status || 'ACTIVE',
    created_at: u.created_at
  };
}

module.exports = {
  getAllUsers,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  verifyPassword,
  generateToken,
  verifyToken,
  toPublicUser
};
