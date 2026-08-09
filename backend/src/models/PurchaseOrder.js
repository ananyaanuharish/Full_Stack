const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
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

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, trim: true },
  poDate: { type: String, trim: true },
  vendorName: { type: String, trim: true },
  vendorCode: { type: String, trim: true },
  warehouseCode: { type: String, trim: true },
  totalAmount: { type: Number, default: 0 },
  items: [poItemSchema],
  rawParsed: { type: mongoose.Schema.Types.Mixed },
  filePath: { type: String },
  originalFilename: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
