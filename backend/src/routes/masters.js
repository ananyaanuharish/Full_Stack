const express = require('express');
const router = express.Router();
const SkuMaster = require('../models/SkuMaster');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/sku', async (req, res) => {
  try {
    const { q, page = 1, limit = 50 } = req.query;
    const filter = q
      ? { $or: [
          { name: { $regex: q, $options: 'i' } },
          { skuErpCode: { $regex: q, $options: 'i' } },
          { eanCode: { $regex: q, $options: 'i' } },
        ] }
      : {};
    const [items, total] = await Promise.all([
      SkuMaster.find(filter).sort({ skuErpCode: 1 }).skip((+page - 1) * +limit).limit(+limit),
      SkuMaster.countDocuments(filter),
    ]);
    res.json({ items, total, page: +page, limit: +limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sku', async (req, res) => {
  try {
    const sku = await SkuMaster.create(req.body);
    res.status(201).json(sku);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/sku/:id', async (req, res) => {
  try {
    const sku = await SkuMaster.findById(req.params.id);
    if (!sku) return res.status(404).json({ error: 'Not found' });
    res.json(sku);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/sku/:id', async (req, res) => {
  try {
    const sku = await SkuMaster.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!sku) return res.status(404).json({ error: 'Not found' });
    res.json(sku);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/sku/:id', async (req, res) => {
  try {
    const sku = await SkuMaster.findByIdAndDelete(req.params.id);
    if (!sku) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
