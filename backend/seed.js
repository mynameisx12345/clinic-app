const db = require('./db');
const bcrypt = require('bcryptjs');

const hash = (pw) => bcrypt.hashSync(pw, 10);

db.exec(`DELETE FROM users; DELETE FROM patients; DELETE FROM medicine_inventory; DELETE FROM doctor_availability;`);

const insertUser = db.prepare('INSERT INTO users (username, password_hash, role, first_name, last_name) VALUES (?,?,?,?,?)');
insertUser.run('staff1', hash('password'), 'staff', 'Admin', 'Staff');
insertUser.run('doctor1', hash('password'), 'doctor', 'John', 'Doctor');
insertUser.run('pharmacist1', hash('password'), 'pharmacist', 'Maria', 'Pharmacist');
insertUser.run('patient1', hash('password'), 'patient', 'Juan', 'Dela Cruz');

// Create patient profile for patient1
const patientUser = db.prepare('SELECT id FROM users WHERE username=?').get('patient1');
db.prepare('INSERT INTO patients (user_id, is_registered, first_name, last_name, birthday, age, gender, contact_number, email) VALUES (?,?,?,?,?,?,?,?,?)')
  .run(patientUser.id, 1, 'Juan', 'Dela Cruz', '1990-05-15', 36, 'Male', '09171234567', 'juan@email.com');

// Seed medicines
const insertMed = db.prepare('INSERT INTO medicine_inventory (medicine_name, category, batch_number, dosage_form, strength, unit, quantity, unit_price, expiration_date) VALUES (?,?,?,?,?,?,?,?,?)');
insertMed.run('Paracetamol', 'Analgesic', 'B001', 'Tablet', '500mg', 'pcs', 100, 5.00, '2027-12-01');
insertMed.run('Amoxicillin', 'Antibiotic', 'B002', 'Capsule', '500mg', 'pcs', 15, 12.00, '2026-08-15');
insertMed.run('Losartan', 'Antihypertensive', 'B003', 'Tablet', '50mg', 'pcs', 3, 8.50, '2026-06-01');

// Seed doctor availability
const doctor = db.prepare('SELECT id FROM users WHERE username=?').get('doctor1');
db.prepare('INSERT INTO doctor_availability (doctor_id, available_date, time_slots) VALUES (?,?,?)')
  .run(doctor.id, '2026-05-19', JSON.stringify(['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00']));
db.prepare('INSERT INTO doctor_availability (doctor_id, available_date, time_slots) VALUES (?,?,?)')
  .run(doctor.id, '2026-05-20', JSON.stringify(['09:00','09:30','10:00','10:30','11:00']));

console.log('Database seeded successfully.');
