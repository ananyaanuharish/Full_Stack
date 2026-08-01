require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const matchRoutes = require('./routes/match');
const summaryRoutes = require('./routes/summary');
const masterRoutes = require('./routes/masters');

const app = express();
const PORT = process.env.PORT || 4000;

connectDB();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/documents', documentRoutes);
app.use('/match', matchRoutes);
app.use('/summary', summaryRoutes);
app.use('/masters', masterRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
