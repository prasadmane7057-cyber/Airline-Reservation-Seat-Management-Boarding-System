const fs = require('node:fs/promises');
const path = require('node:path');

const columns = [
  'id',
  'name',
  'email',
  'password_hash',
  'role',
  'phone',
  'address',
  'dob',
  'status',
  'created_at'
];
const defaultFilePath = path.resolve(__dirname, '../../data/users.csv');
const filePath = path.resolve(process.env.CSV_USERS_PATH || defaultFilePath);

let initialization;
let writeQueue = Promise.resolve();
let knownEmails = new Set();

function encodeRow(values) {
  return values.map(value => {
    const text = value == null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  }).join(',');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some(value => value !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error('The user CSV contains an unterminated quoted field.');
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some(value => value !== '')) rows.push(row);
  }
  return rows;
}

function toUser(row, columnIndexes) {
  const value = column => row[columnIndexes.get(column)] || '';
  const id = Number(value('id'));
  if (!Number.isSafeInteger(id) || id < 1 || !value('email') || !value('password_hash')) {
    throw new Error('The user CSV contains a row with missing or invalid required fields.');
  }

  return {
    id,
    name: value('name'),
    email: value('email').toLowerCase().trim(),
    password_hash: value('password_hash'),
    role: value('role') || 'passenger',
    phone: value('phone'),
    address: value('address'),
    dob: value('dob') || null,
    status: value('status') || 'ACTIVE',
    created_at: value('created_at') ? new Date(value('created_at')) : new Date()
  };
}

async function initialize(memoryDB) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  let contents;
  try {
    contents = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    contents = '';
  }

  const rows = parseCsv(contents);
  if (rows.length === 0) {
    await fs.writeFile(filePath, `${encodeRow(columns)}\n`, 'utf8');
    contents = await fs.readFile(filePath, 'utf8');
  }

  const [header, ...records] = parseCsv(contents);
  const indexes = new Map(header.map((column, index) => [column, index]));
  for (const column of columns) {
    if (!indexes.has(column)) {
      throw new Error(`The user CSV is missing the required "${column}" column.`);
    }
  }

  const loadedUsers = records.map(row => toUser(row, indexes));
  const emails = new Set();
  for (const user of loadedUsers) {
    if (emails.has(user.email)) throw new Error(`The user CSV contains duplicate email "${user.email}".`);
    emails.add(user.email);
  }

  knownEmails = emails;
  for (const user of loadedUsers) {
    if (memoryDB.users.some(existing => existing.email.toLowerCase() === user.email)) continue;
    memoryDB.users.push(user);
    memoryDB.passengers.push({
      id: memoryDB.passengers.length + 1,
      user_id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      preferred_class: 'Economy'
    });
  }
}

function initializeUserCsvStore(memoryDB) {
  if (!initialization) {
    initialization = initialize(memoryDB).catch(error => {
      initialization = null;
      throw error;
    });
  }
  return initialization;
}

async function saveUser(user) {
  await initialization;
  const write = writeQueue.then(async () => {
    const email = user.email.toLowerCase().trim();
    if (knownEmails.has(email)) return false;

    const row = columns.map(column => user[column]);
    await fs.appendFile(filePath, `${encodeRow(row)}\n`, 'utf8');
    knownEmails.add(email);
    return true;
  });
  writeQueue = write.catch(() => {});
  return write;
}

module.exports = { initializeUserCsvStore, saveUser };
