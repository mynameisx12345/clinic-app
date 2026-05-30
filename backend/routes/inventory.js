const router = require('express').Router();
const db = require('../db');
const { authMiddleware, roleGuard } = require('../middleware');

router.get('/', authMiddleware, (req, res) => {
  res.json(db.prepare('SELECT * FROM medicine_inventory ORDER BY medicine_name').all());
});

router.post('/', authMiddleware, roleGuard('pharmacist', 'staff'), (req, res) => {
  const { medicine_name, category, batch_number, dosage_form, strength, unit, quantity, unit_price, expiration_date } = req.body;
  const r = db.prepare('INSERT INTO medicine_inventory (medicine_name, category, batch_number, dosage_form, strength, unit, quantity, unit_price, expiration_date) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(medicine_name, category, batch_number, dosage_form, strength, unit, quantity, unit_price, expiration_date);

  if (quantity <= 20) {
    const broadcast = req.app.get('broadcast');
    if (broadcast) {
      broadcast({ type: 'low_stock', data: { id: r.lastInsertRowid, medicine_name, quantity } });
    }
  }

  res.json({ id: r.lastInsertRowid });
});

module.exports = router;
