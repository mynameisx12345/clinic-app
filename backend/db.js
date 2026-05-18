const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'clinic.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('patient','staff','doctor','pharmacist')) NOT NULL,
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  contact_number TEXT,
  address TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  is_registered INTEGER DEFAULT 0,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  birthday TEXT,
  age INTEGER,
  gender TEXT,
  contact_number TEXT,
  email TEXT,
  civil_status TEXT,
  blood_type TEXT,
  allergies TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  doctor_id INTEGER,
  appointment_date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  reason_for_visit TEXT,
  status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending','Confirmed','Completed','Cancelled')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(patient_id) REFERENCES patients(id),
  FOREIGN KEY(doctor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS medical_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  appointment_id INTEGER NOT NULL,
  patient_id INTEGER NOT NULL,
  signs_symptoms TEXT,
  diagnosis TEXT,
  treatment TEXT,
  prescriptions TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(appointment_id) REFERENCES appointments(id),
  FOREIGN KEY(patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS medicine_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medicine_name TEXT NOT NULL,
  category TEXT,
  batch_number TEXT,
  dosage_form TEXT,
  strength TEXT,
  unit TEXT,
  quantity INTEGER DEFAULT 0,
  unit_price REAL DEFAULT 0,
  expiration_date TEXT
);

CREATE TABLE IF NOT EXISTS stock_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medicine_id INTEGER NOT NULL,
  transaction_type TEXT CHECK(transaction_type IN ('Sales','Return','Dispose','Purchase','Adjust')) NOT NULL,
  quantity INTEGER NOT NULL,
  price_per_unit REAL,
  total_price REAL,
  transaction_date TEXT DEFAULT (date('now')),
  remarks TEXT DEFAULT '',
  FOREIGN KEY(medicine_id) REFERENCES medicine_inventory(id)
);

CREATE TABLE IF NOT EXISTS doctor_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id INTEGER NOT NULL,
  available_date TEXT NOT NULL,
  time_slots TEXT NOT NULL,
  FOREIGN KEY(doctor_id) REFERENCES users(id)
);
`);

try { db.prepare("ALTER TABLE stock_ledger ADD COLUMN remarks TEXT DEFAULT ''").run(); } catch(e) {}

module.exports = db;
