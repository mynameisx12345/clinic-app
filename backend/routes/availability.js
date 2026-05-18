const router = require('express').Router();
const db = require('../db');
const { authMiddleware, roleGuard } = require('../middleware');

// Public: get available dates/slots
router.get('/', (req, res) => {
  const rows = db.prepare("SELECT * FROM doctor_availability WHERE available_date >= date('now') ORDER BY available_date").all();
  // Filter out fully booked slots
  const result = rows.map(r => {
    const slots = JSON.parse(r.time_slots);
    const booked = db.prepare('SELECT time_slot FROM appointments WHERE doctor_id=? AND appointment_date=? AND status != ?').all(r.doctor_id, r.available_date, 'Cancelled');
    const bookedSlots = booked.map(b => b.time_slot);
    return { ...r, time_slots: slots.filter(s => !bookedSlots.includes(s)) };
  }).filter(r => r.time_slots.length > 0);
  res.json(result);
});

// Staff: set availability
router.post('/', authMiddleware, roleGuard('staff'), (req, res) => {
  const { doctor_id, available_date, time_slots } = req.body;
  const existing = db.prepare('SELECT id FROM doctor_availability WHERE doctor_id=? AND available_date=?').get(doctor_id, available_date);
  if (existing) {
    db.prepare('UPDATE doctor_availability SET time_slots=? WHERE id=?').run(JSON.stringify(time_slots), existing.id);
  } else {
    db.prepare('INSERT INTO doctor_availability (doctor_id, available_date, time_slots) VALUES (?,?,?)').run(doctor_id, available_date, JSON.stringify(time_slots));
  }
  res.json({ message: 'Saved' });
});

router.delete('/:id', authMiddleware, roleGuard('staff'), (req, res) => {
  db.prepare('DELETE FROM doctor_availability WHERE id=?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
