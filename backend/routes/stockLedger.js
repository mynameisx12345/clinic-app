const router = require('express').Router();
const db = require('../db');
const { authMiddleware, roleGuard } = require('../middleware');

router.get('/', authMiddleware, (req, res) => {
  res.json(db.prepare('SELECT sl.*, mi.medicine_name FROM stock_ledger sl JOIN medicine_inventory mi ON sl.medicine_id=mi.id ORDER BY sl.transaction_date DESC, sl.id DESC').all());
});

router.post('/', authMiddleware, roleGuard('pharmacist', 'staff'), (req, res) => {
  const { medicine_id, transaction_type, quantity: rawQty, price_per_unit, total_price, transaction_date, remarks } = req.body;
  const quantity = parseInt(rawQty, 10);
  if (transaction_type !== 'Adjust' && quantity <= 0) return res.status(400).json({ error: 'Quantity must be positive' });
  db.prepare('INSERT INTO stock_ledger (medicine_id, transaction_type, quantity, price_per_unit, total_price, transaction_date, remarks) VALUES (?,?,?,?,?,?,?)')
    .run(medicine_id, transaction_type, quantity, price_per_unit, total_price, transaction_date, remarks || '');

  // Update inventory quantity
  if (['Purchase'].includes(transaction_type)) {
    db.prepare('UPDATE medicine_inventory SET quantity = quantity + ? WHERE id=?').run(quantity, medicine_id);
  } else if (['Sales', 'Dispose', 'Return'].includes(transaction_type)) {
    db.prepare('UPDATE medicine_inventory SET quantity = quantity - ? WHERE id=?').run(quantity, medicine_id);
  }
  // Adjust: use signed quantity
  if (transaction_type === 'Adjust') {
    db.prepare('UPDATE medicine_inventory SET quantity = quantity + ? WHERE id=?').run(quantity, medicine_id);
  }

  // Check if medicine is now low stock
  const med = db.prepare('SELECT * FROM medicine_inventory WHERE id=?').get(medicine_id);
  if (med && med.quantity <= 20) {
    const broadcast = req.app.get('broadcast');
    if (broadcast) {
      broadcast({ type: 'low_stock', data: { id: med.id, medicine_name: med.medicine_name, quantity: med.quantity } });
    }
  }

  res.json({ message: 'Transaction recorded' });
});

module.exports = router;
