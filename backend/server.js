const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/stock-ledger', require('./routes/stockLedger'));
app.use('/api/availability', require('./routes/availability'));

// Serve built frontend
app.use(express.static(path.join(__dirname, '../frontend/dist/clinic-frontend/browser')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dist/clinic-frontend/browser/index.html')));

const PORT = 3000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => console.log(`Clinic API running on http://${HOST}:${PORT}`));
