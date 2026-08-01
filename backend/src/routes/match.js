const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { runMatch } = require('../services/matchEngine');

router.use(auth);

// GET /match/:poNumber — always recomputes the full match result
router.get('/:poNumber', async (req, res) => {
  try {
    const result = await runMatch(req.params.poNumber);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
