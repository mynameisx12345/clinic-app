const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware');

router.get('/', authMiddleware, (req, res) => {
  res.json(db.prepare('SELECT * FROM patients ORDER BY created_at DESC').all());
});

router.get('/me', authMiddleware, (req, res) => {
  const patient = db.prepare('SELECT p.*, u.address FROM patients p JOIN users u ON p.user_id=u.id WHERE p.user_id=?').get(req.user.id);
  if (!patient) return res.status(404).json({ error: 'Not found' });
  res.json(patient);
});

router.put('/me', authMiddleware, (req, res) => {
  const { first_name, last_name, middle_name, birthday, age, gender, contact_number, email, civil_status, blood_type, allergies, address } = req.body;
  db.prepare('UPDATE patients SET first_name=?, last_name=?, middle_name=?, birthday=?, age=?, gender=?, contact_number=?, email=?, civil_status=?, blood_type=?, allergies=? WHERE user_id=?')
    .run(first_name, last_name, middle_name, birthday, age, gender, contact_number, email, civil_status, blood_type, allergies, req.user.id);
  db.prepare('UPDATE users SET first_name=?, last_name=?, middle_name=?, contact_number=?, address=? WHERE id=?')
    .run(first_name, last_name, middle_name, contact_number, address, req.user.id);
  res.json({ message: 'Profile updated' });
});

router.get('/:id', authMiddleware, (req, res) => {
  const patient = db.prepare('SELECT * FROM patients WHERE id=?').get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Not found' });
  res.json(patient);
});

router.get('/:id/appointments', authMiddleware, (req, res) => {
  res.json(db.prepare('SELECT a.*, u.username as doctor_name FROM appointments a LEFT JOIN users u ON a.doctor_id=u.id WHERE a.patient_id=? ORDER BY a.appointment_date DESC').all(req.params.id));
});

router.get('/:id/medical-records', authMiddleware, (req, res) => {
  res.json(db.prepare('SELECT * FROM medical_records WHERE patient_id=? ORDER BY created_at DESC').all(req.params.id));
});

module.exports = router;
