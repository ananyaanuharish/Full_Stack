const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { runMatch } = require('../services/matchEngine');
const PurchaseOrder = require('../models/PurchaseOrder');
const MatchAudit = require('../models/MatchAudit');

router.use(auth);

// GET /summary/:poNumber — slim status + audit view
router.get('/:poNumber', async (req, res) => {
  try {
    const { poNumber } = req.params;
    const [po, audit] = await Promise.all([
      PurchaseOrder.findOne({ poNumber }),
      MatchAudit.findOne({ poNumber }),
    ]);
    if (!po) return res.status(404).json({ error: 'PO not found' });
    const matchResult = await runMatch(poNumber);
    res.json({
      poNumber,
      status: matchResult.status,
      reasons: matchResult.reasons,
      summary: matchResult.summary,
      audit: audit ? audit.steps : [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
