const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware');

router.get('/', authMiddleware, (req, res) => {
  res.json(db.prepare("SELECT id, username FROM users WHERE role='doctor'").all());
});

router.get('/:id/patients', authMiddleware, (req, res) => {
  const rows = db.prepare(`SELECT DISTINCT p.* FROM patients p JOIN appointments a ON a.patient_id=p.id WHERE a.doctor_id=?`).all(req.params.id);
  res.json(rows);
});

module.exports = router;
