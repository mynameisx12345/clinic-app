const router = require('express').Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMiddleware, roleGuard, SECRET } = require('../middleware');

router.get('/users', authMiddleware, roleGuard('staff'), (req, res) => {
  res.json(db.prepare('SELECT id, username, role, first_name, last_name, middle_name, contact_number, address, created_at FROM users ORDER BY created_at DESC').all());
});

router.post('/login', (req, res) => {
  const expiry = db.prepare("SELECT value FROM settings WHERE key='system_expiry_date'").get();
  if (expiry && new Date() > new Date(expiry.value))
    return res.status(403).json({ error: 'System access has expired. Contact administrator.' });

  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '12h' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

router.post('/register', (req, res) => {
  const { username, password, role, first_name, last_name, middle_name, contact_number, address, birthday, age, gender, email, civil_status, blood_type, allergies } = req.body;
  const existing = db.prepare('SELECT id FROM users WHERE username=?').get(username);
  if (existing) return res.status(409).json({ error: 'Username taken' });

  const userRole = role || 'patient';
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password_hash, role, first_name, last_name, middle_name, contact_number, address) VALUES (?,?,?,?,?,?,?,?)')
    .run(username, hash, userRole, first_name, last_name, middle_name, contact_number, address);
  const userId = result.lastInsertRowid;

  if (userRole === 'patient') {
    const existingPatient = db.prepare('SELECT id FROM patients WHERE first_name=? AND last_name=? AND is_registered=0 ORDER BY created_at DESC LIMIT 1').get(first_name, last_name);
    if (existingPatient) {
      db.prepare('UPDATE patients SET user_id=?, is_registered=1, middle_name=?, birthday=?, age=?, gender=?, contact_number=?, email=?, civil_status=?, blood_type=?, allergies=? WHERE id=?')
        .run(userId, middle_name, birthday, age, gender, contact_number, email, civil_status, blood_type, allergies, existingPatient.id);
    } else {
      db.prepare('INSERT INTO patients (user_id, is_registered, first_name, last_name, middle_name, birthday, age, gender, contact_number, email, civil_status, blood_type, allergies) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
        .run(userId, 1, first_name, last_name, middle_name, birthday, age, gender, contact_number, email, civil_status, blood_type, allergies);
    }
  }
  res.json({ message: 'Registered successfully' });
});

router.put('/credentials', authMiddleware, (req, res) => {
  const { username, password } = req.body;
  if (username !== req.user.username) {
    const existing = db.prepare('SELECT id FROM users WHERE username=? AND id!=?').get(username, req.user.id);
    if (existing) return res.status(409).json({ error: 'Username already taken' });
    db.prepare('UPDATE users SET username=? WHERE id=?').run(username, req.user.id);
  }
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash, req.user.id);
  }
  res.json({ message: 'Credentials updated' });
});

router.put('/users/:id', authMiddleware, roleGuard('staff'), (req, res) => {
  const { username, password, role, first_name, last_name, middle_name, contact_number, address } = req.body;
  const existing = db.prepare('SELECT id FROM users WHERE username=? AND id!=?').get(username, req.params.id);
  if (existing) return res.status(409).json({ error: 'Username already taken' });
  db.prepare('UPDATE users SET username=?, role=?, first_name=?, last_name=?, middle_name=?, contact_number=?, address=? WHERE id=?')
    .run(username, role, first_name, last_name, middle_name, contact_number, address, req.params.id);
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash, req.params.id);
  }
  // Also update patients table if this user is a patient
  db.prepare('UPDATE patients SET first_name=?, last_name=?, middle_name=?, contact_number=? WHERE user_id=?')
    .run(first_name, last_name, middle_name, contact_number, req.params.id);
  res.json({ message: 'User updated' });
});

module.exports = router;
