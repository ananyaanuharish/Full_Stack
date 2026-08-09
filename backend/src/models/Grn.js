const mongoose = require('mongoose');

const grnItemSchema = new mongoose.Schema({
  itemCode: { type: String, trim: true },
  description: { type: String, trim: true },
  hsnCode: { type: String, trim: true },
  expectedQuantity: { type: Number, default: 0 },
  receivedQuantity: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  uom: { type: String, trim: true },
  skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
  flags: [{ type: String }],
}, { _id: false });

const grnSchema = new mongoose.Schema({
  grnNumber: { type: String, required: true, trim: true },
  poNumber: { type: String, required: true, trim: true },
  grnDate: { type: String, trim: true },
  vendorName: { type: String, trim: true },
  warehouseCode: { type: String, trim: true },
  items: [grnItemSchema],
  rawParsed: { type: mongoose.Schema.Types.Mixed },
  filePath: { type: String },
  originalFilename: { type: String },
}, { timestamps: true });

grnSchema.index({ poNumber: 1 });

module.exports = mongoose.model('Grn', grnSchema);
