require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');
const { resolveSkuMaster } = require('../services/resolveSkuMaster');
const { runMatch } = require('../services/matchEngine');

async function rerun(poNumber) {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/three-way-match');

  const models = [
    ['PO', PurchaseOrder, { poNumber }],
    ['GRN', Grn, { poNumber }],
    ['Invoice', Invoice, { poNumber }],
  ];
  for (const [label, Model, filter] of models) {
    const docs = await Model.find(filter);
    for (const doc of docs) {
      doc.items.forEach(i => { i.itemCode = (i.itemCode || '').replace(/\s+/g, ''); });
      const resolvedItems = await resolveSkuMaster(doc.items.map(i => i.toObject()));
      doc.items = resolvedItems;
      await doc.save();
      console.log(`${label} ${doc._id.toString()}: ${resolvedItems.length} items re-resolved`);
    }
  }

  const result = await runMatch(poNumber);
  console.log('\n--- Match result ---');
  console.log('status:', result.status);
  console.log('reasons:', JSON.stringify(result.reasons));
  console.log('lineCount:', result.lineDetails.length);
  const flagged = result.lineDetails.filter(l => l.reasons.length > 0);
  if (flagged.length) {
    console.log(`\n${flagged.length} flagged line(s):`);
    flagged.forEach(l => console.log(' -', l.itemCode, l.description, JSON.stringify(l.reasons)));
  }

  await mongoose.disconnect();
}

const poNumber = process.argv[2] || 'CI4PO05788';
rerun(poNumber).catch(err => { console.error(err); process.exit(1); });
