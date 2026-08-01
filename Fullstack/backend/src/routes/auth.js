const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (
    username !== (process.env.ADMIN_USERNAME || 'admin') ||
    password !== (process.env.ADMIN_PASSWORD || 'password123')
  ) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { username },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '7d' }
  );
  res.json({ token });
});

module.exports = router;
