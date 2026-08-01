const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const auth = require('../middleware/auth');
const { runUploadPipeline } = require('../services/uploadPipeline');
const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');

const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${ts}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  },
});

router.use(auth);

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { documentType } = req.body;
  if (!['po', 'grn', 'invoice'].includes(documentType)) {
    return res.status(400).json({ error: 'documentType must be po, grn, or invoice' });
  }

  try {
    const result = await runUploadPipeline(req.file.path, req.file.originalname, documentType);
    res.status(201).json(result);
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
});

router.get('/:id/file', async (req, res) => {
  let doc = await PurchaseOrder.findById(req.params.id).catch(() => null)
    || await Grn.findById(req.params.id).catch(() => null)
    || await Invoice.findById(req.params.id).catch(() => null);
  if (!doc || !doc.filePath) return res.status(404).json({ error: 'File not found' });
  if (!fs.existsSync(doc.filePath)) return res.status(404).json({ error: 'File missing on disk' });
  res.sendFile(path.resolve(doc.filePath));
});

router.get('/:id', async (req, res) => {
  const doc = await PurchaseOrder.findById(req.params.id).catch(() => null)
    || await Grn.findById(req.params.id).catch(() => null)
    || await Invoice.findById(req.params.id).catch(() => null);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});

router.get('/', async (req, res) => {
  const { type, poNumber } = req.query;
  const filter = poNumber ? { poNumber } : {};
  try {
    if (type === 'po') return res.json(await PurchaseOrder.find(filter).sort({ createdAt: -1 }));
    if (type === 'grn') return res.json(await Grn.find(filter).sort({ createdAt: -1 }));
    if (type === 'invoice') return res.json(await Invoice.find(filter).sort({ createdAt: -1 }));
    const [pos, grns, invs] = await Promise.all([
      PurchaseOrder.find(filter).sort({ createdAt: -1 }),
      Grn.find(filter).sort({ createdAt: -1 }),
      Invoice.find(filter).sort({ createdAt: -1 }),
    ]);
    res.json({ pos, grns, invoices: invs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
