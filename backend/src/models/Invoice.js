const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  itemCode: { type: String, trim: true },
  description: { type: String, trim: true },
  hsnCode: { type: String, trim: true },
  quantity: { type: Number, default: 0 },
  unitRate: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  uom: { type: String, trim: true },
  grossAmount: { type: Number, default: 0 },
  skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
  flags: [{ type: String }],
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, trim: true },
  poNumber: { type: String, required: true, trim: true },
  invoiceDate: { type: String, trim: true },
  vendorName: { type: String, trim: true },
  vendorGstin: { type: String, trim: true },
  buyerGstin: { type: String, trim: true },
  totalAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  items: [invoiceItemSchema],
  rawParsed: { type: mongoose.Schema.Types.Mixed },
  filePath: { type: String },
  originalFilename: { type: String },
}, { timestamps: true });

invoiceSchema.index({ poNumber: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
