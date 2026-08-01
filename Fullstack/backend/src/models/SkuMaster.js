const mongoose = require('mongoose');

const skuMasterSchema = new mongoose.Schema({
  skuErpCode: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  eanCode: { type: String, trim: true, default: '' },
  hsnCode: { type: String, trim: true, default: '' },
  uom: { type: String, trim: true, default: 'PKT' },
  agreedRate: { type: Number, default: null },
  mrp: { type: Number, default: null },
  priceTolerance: { type: Number, default: 0.05 },
}, { timestamps: true });

skuMasterSchema.index({ eanCode: 1 });

module.exports = mongoose.model('SkuMaster', skuMasterSchema);
