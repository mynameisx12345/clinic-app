const router = require('express').Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMiddleware, roleGuard, SECRET } = require('../middleware');

router.get('/users', authMiddleware, roleGuard('staff'), (req, res) => {
  res.json(db.prepare('SELECT id, username, role, first_name, last_name, middle_name, contact_number, address, created_at FROM users ORDER BY created_at DESC').all());
});

router.post('/login', (req, res) => {
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
    const existingPatient = db.prepare('SELECT id FROM patients WHERE email=? AND is_registered=0').get(email);
    if (existingPatient) {
      db.prepare('UPDATE patients SET user_id=?, is_registered=1, first_name=?, last_name=?, middle_name=?, birthday=?, age=?, gender=?, contact_number=?, civil_status=?, blood_type=?, allergies=? WHERE id=?')
        .run(userId, first_name, last_name, middle_name, birthday, age, gender, contact_number, civil_status, blood_type, allergies, existingPatient.id);
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

module.exports = router;
