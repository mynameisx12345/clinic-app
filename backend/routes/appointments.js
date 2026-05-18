const router = require('express').Router();
const db = require('../db');
const { authMiddleware, roleGuard } = require('../middleware');

// Public: book appointment (guest or logged-in patient)
router.post('/', (req, res) => {
  const { patient_id, doctor_id, appointment_date, time_slot, reason_for_visit, patient_info } = req.body;
  let pId = patient_id;

  // If no patient_id, create a guest patient record
  if (!pId && patient_info) {
    const r = db.prepare('INSERT INTO patients (is_registered, first_name, last_name, middle_name, birthday, age, gender, contact_number, email, civil_status, blood_type, allergies) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(0, patient_info.first_name, patient_info.last_name, patient_info.middle_name, patient_info.birthday, patient_info.age, patient_info.gender, patient_info.contact_number, patient_info.email, patient_info.civil_status, patient_info.blood_type, patient_info.allergies);
    pId = r.lastInsertRowid;
  }

  const result = db.prepare('INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, reason_for_visit) VALUES (?,?,?,?,?)')
    .run(pId, doctor_id || null, appointment_date, time_slot, reason_for_visit);
  res.json({ id: result.lastInsertRowid, patient_id: pId });
});

// Get all appointments
router.get('/', authMiddleware, (req, res) => {
  const rows = db.prepare(`SELECT a.*, p.first_name, p.last_name, p.contact_number, p.email, p.is_registered, u.username as doctor_name
    FROM appointments a JOIN patients p ON a.patient_id=p.id LEFT JOIN users u ON a.doctor_id=u.id
    ORDER BY a.created_at DESC`).all();
  res.json(rows);
});

// Get appointments for logged-in patient
router.get('/my', authMiddleware, (req, res) => {
  const patient = db.prepare('SELECT id FROM patients WHERE user_id=?').get(req.user.id);
  if (!patient) return res.json([]);
  const rows = db.prepare(`SELECT a.*, u.username as doctor_name FROM appointments a LEFT JOIN users u ON a.doctor_id=u.id WHERE a.patient_id=? ORDER BY a.appointment_date DESC`).all(patient.id);
  res.json(rows);
});

// Get appointments for a specific doctor
router.get('/doctor', authMiddleware, roleGuard('doctor'), (req, res) => {
  const rows = db.prepare(`SELECT a.*, p.first_name, p.last_name, p.contact_number, p.email
    FROM appointments a JOIN patients p ON a.patient_id=p.id WHERE a.doctor_id=? ORDER BY a.appointment_date DESC`).all(req.user.id);
  res.json(rows);
});

// Update appointment status
router.patch('/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE appointments SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ message: 'Updated' });
});

// Save medical record for appointment
router.post('/:id/medical-record', authMiddleware, roleGuard('doctor'), (req, res) => {
  const appt = db.prepare('SELECT * FROM appointments WHERE id=?').get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Not found' });
  const { signs_symptoms, diagnosis, treatment, prescriptions, saveOnly } = req.body;
  const existing = db.prepare('SELECT id FROM medical_records WHERE appointment_id=?').get(appt.id);
  if (existing) {
    db.prepare('UPDATE medical_records SET signs_symptoms=?, diagnosis=?, treatment=?, prescriptions=? WHERE appointment_id=?')
      .run(signs_symptoms, diagnosis, treatment, JSON.stringify(prescriptions), appt.id);
  } else {
    db.prepare('INSERT INTO medical_records (appointment_id, patient_id, signs_symptoms, diagnosis, treatment, prescriptions) VALUES (?,?,?,?,?,?)')
      .run(appt.id, appt.patient_id, signs_symptoms, diagnosis, treatment, JSON.stringify(prescriptions));
  }
  if (saveOnly) {
    if (appt.status === 'Pending') db.prepare('UPDATE appointments SET status=? WHERE id=?').run('Confirmed', appt.id);
  } else {
    db.prepare('UPDATE appointments SET status=? WHERE id=?').run('Completed', appt.id);
  }
  res.json({ message: saveOnly ? 'Record saved' : 'Record saved and appointment completed' });
});

// Get medical record for an appointment
router.get('/:id/medical-record', authMiddleware, (req, res) => {
  const record = db.prepare('SELECT * FROM medical_records WHERE appointment_id=?').get(req.params.id);
  res.json(record || null);
});

module.exports = router;
