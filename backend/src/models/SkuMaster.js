// SkuMaster.js is the schema for storing the main product or SKU information. 
// It stores things like the SKU code, product name, EAN code, HSN, agreed price and MRP. 
// The price tolerance is also stored here, which is later used when checking price mismatches.

const mongoose = require('mongoose');

const skuMasterSchema = new mongoose.Schema({
  skuErpCode: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  eanCode: { type: String, trim: true, default: '' },
  altCodes: { type: [String], default: [] },
  hsnCode: { type: String, trim: true, default: '' },
  uom: { type: String, trim: true, default: 'PKT' },
  agreedRate: { type: Number, default: null },
  mrp: { type: Number, default: null },
  priceTolerance: { type: Number, default: 0.05 },
}, { timestamps: true });

skuMasterSchema.index({ eanCode: 1 });

module.exports = mongoose.model('SkuMaster', skuMasterSchema);
