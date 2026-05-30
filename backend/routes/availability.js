const router = require('express').Router();
const db = require('../db');
const { authMiddleware, roleGuard } = require('../middleware');

// Public: get available dates/sessions with remaining slots
router.get('/', (req, res) => {
  const rows = db.prepare("SELECT da.*, u.username as doctor_name FROM doctor_availability da JOIN users u ON da.doctor_id=u.id WHERE da.available_date >= date('now') ORDER BY da.available_date").all();
  const result = rows.map(r => {
    const morningBooked = db.prepare("SELECT COUNT(*) as cnt FROM appointments WHERE doctor_id=? AND appointment_date=? AND time_slot='morning' AND status!='Cancelled'").get(r.doctor_id, r.available_date).cnt;
    const afternoonBooked = db.prepare("SELECT COUNT(*) as cnt FROM appointments WHERE doctor_id=? AND appointment_date=? AND time_slot='afternoon' AND status!='Cancelled'").get(r.doctor_id, r.available_date).cnt;
    return {
      id: r.id,
      doctor_id: r.doctor_id,
      doctor_name: r.doctor_name,
      available_date: r.available_date,
      morning_start: r.morning_start,
      morning_end: r.morning_end,
      morning_max: r.morning_max || 0,
      morning_remaining: Math.max(0, (r.morning_max || 0) - morningBooked),
      afternoon_start: r.afternoon_start,
      afternoon_end: r.afternoon_end,
      afternoon_max: r.afternoon_max || 0,
      afternoon_remaining: Math.max(0, (r.afternoon_max || 0) - afternoonBooked)
    };
  });
  res.json(result);
});

// Staff: set availability
router.post('/', authMiddleware, roleGuard('staff'), (req, res) => {
  const { doctor_id, available_date, morning_start, morning_end, morning_max, afternoon_start, afternoon_end, afternoon_max } = req.body;
  const existing = db.prepare('SELECT id FROM doctor_availability WHERE doctor_id=? AND available_date=?').get(doctor_id, available_date);
  if (existing) {
    db.prepare('UPDATE doctor_availability SET morning_start=?, morning_end=?, morning_max=?, afternoon_start=?, afternoon_end=?, afternoon_max=?, time_slots=? WHERE id=?')
      .run(morning_start || null, morning_end || null, morning_max || 0, afternoon_start || null, afternoon_end || null, afternoon_max || 0, '[]', existing.id);
  } else {
    db.prepare('INSERT INTO doctor_availability (doctor_id, available_date, time_slots, morning_start, morning_end, morning_max, afternoon_start, afternoon_end, afternoon_max) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(doctor_id, available_date, '[]', morning_start || null, morning_end || null, morning_max || 0, afternoon_start || null, afternoon_end || null, afternoon_max || 0);
  }
  res.json({ message: 'Saved' });
});

router.delete('/:id', authMiddleware, roleGuard('staff'), (req, res) => {
  db.prepare('DELETE FROM doctor_availability WHERE id=?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
