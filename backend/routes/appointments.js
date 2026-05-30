const router = require('express').Router();
const db = require('../db');
const { authMiddleware, roleGuard } = require('../middleware');

// Public: book appointment (guest or logged-in patient)
router.post('/', (req, res) => {
  const { patient_id, doctor_id, appointment_date, time_slot, reason_for_visit, patient_info } = req.body;
  let pId = patient_id;

  // If token present, resolve patient from logged-in user
  const token = req.headers.authorization?.split(' ')[1];
  if (token && !pId) {
    try {
      const jwt = require('jsonwebtoken');
      const { SECRET } = require('../middleware');
      const decoded = jwt.verify(token, SECRET);
      const patient = db.prepare('SELECT id FROM patients WHERE user_id=?').get(decoded.id);
      if (patient) pId = patient.id;
    } catch(e) {}
  }

  // If no patient_id, create a guest patient record
  if (!pId && patient_info) {
    const r = db.prepare('INSERT INTO patients (is_registered, first_name, last_name, middle_name, birthday, age, gender, contact_number, email, civil_status, blood_type, allergies) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(0, patient_info.first_name, patient_info.last_name, patient_info.middle_name, patient_info.birthday, patient_info.age, patient_info.gender, patient_info.contact_number, patient_info.email, patient_info.civil_status, patient_info.blood_type, patient_info.allergies);
    pId = r.lastInsertRowid;
  }

  // Check session capacity
  if (doctor_id && (time_slot === 'morning' || time_slot === 'afternoon')) {
    const avail = db.prepare('SELECT * FROM doctor_availability WHERE doctor_id=? AND available_date=?').get(doctor_id, appointment_date);
    if (avail) {
      const max = time_slot === 'morning' ? (avail.morning_max || 0) : (avail.afternoon_max || 0);
      const booked = db.prepare("SELECT COUNT(*) as cnt FROM appointments WHERE doctor_id=? AND appointment_date=? AND time_slot=? AND status!='Cancelled'").get(doctor_id, appointment_date, time_slot).cnt;
      if (max > 0 && booked >= max) return res.status(400).json({ error: 'Session is fully booked' });
    }
  }

  const result = db.prepare('INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, reason_for_visit) VALUES (?,?,?,?,?)')
    .run(pId, doctor_id || null, appointment_date, time_slot, reason_for_visit);

  // Broadcast new appointment via WebSocket
  const patient = db.prepare('SELECT first_name, last_name FROM patients WHERE id=?').get(pId);
  const broadcast = req.app.get('broadcast');
  if (broadcast) {
    broadcast({ type: 'new_appointment', data: { id: result.lastInsertRowid, patient_id: pId, first_name: patient.first_name, last_name: patient.last_name, appointment_date, time_slot } });
  }

  res.json({ id: result.lastInsertRowid, patient_id: pId });
});

// Get notifications (recent pending appointments)
router.get('/notifications', authMiddleware, (req, res) => {
  const rows = db.prepare(`SELECT a.id, a.appointment_date, a.time_slot, a.created_at, p.first_name, p.last_name 
    FROM appointments a JOIN patients p ON a.patient_id=p.id 
    WHERE a.status='Pending' ORDER BY a.created_at DESC LIMIT 10`).all();
  res.json(rows);
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
  const patients = db.prepare('SELECT id FROM patients WHERE user_id=?').all(req.user.id);
  if (!patients.length) return res.json([]);
  const ids = patients.map(r => r.id);
  const rows = db.prepare(`SELECT a.*, u.username as doctor_name FROM appointments a LEFT JOIN users u ON a.doctor_id=u.id WHERE a.patient_id IN (${ids.join(',')}) ORDER BY a.appointment_date DESC`).all();
  const result = rows.map(a => {
    if (a.time_slot === 'morning' || a.time_slot === 'afternoon') {
      const avail = db.prepare('SELECT morning_start, morning_end, afternoon_start, afternoon_end FROM doctor_availability WHERE doctor_id=? AND available_date=?').get(a.doctor_id, a.appointment_date);
      if (avail) {
        a.session_time = a.time_slot === 'morning' ? `Morning (${avail.morning_start}–${avail.morning_end})` : `Afternoon (${avail.afternoon_start}–${avail.afternoon_end})`;
      }
    }
    return a;
  });
  res.json(result);
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

  if (status === 'Confirmed' || status === 'Completed' || status === 'Cancelled') {
    const appt = db.prepare('SELECT a.*, p.user_id, p.first_name, p.last_name FROM appointments a JOIN patients p ON a.patient_id=p.id WHERE a.id=?').get(req.params.id);
    const broadcast = req.app.get('broadcast');
    if (broadcast && appt) {
      broadcast({ type: 'appointment_status', data: { id: appt.id, patient_user_id: appt.user_id, status, appointment_date: appt.appointment_date, first_name: appt.first_name, last_name: appt.last_name } });
    }
  }

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

  const newStatus = saveOnly ? (appt.status === 'Pending' ? 'Confirmed' : null) : 'Completed';
  if (newStatus) {
    const patient = db.prepare('SELECT user_id FROM patients WHERE id=?').get(appt.patient_id);
    const broadcast = req.app.get('broadcast');
    if (broadcast && patient) {
      broadcast({ type: 'appointment_status', data: { id: appt.id, patient_user_id: patient.user_id, status: newStatus, appointment_date: appt.appointment_date } });
    }
  }

  res.json({ message: saveOnly ? 'Record saved' : 'Record saved and appointment completed' });
});

// Get medical record for an appointment
router.get('/:id/medical-record', authMiddleware, (req, res) => {
  const record = db.prepare('SELECT * FROM medical_records WHERE appointment_id=?').get(req.params.id);
  res.json(record || null);
});

module.exports = router;
