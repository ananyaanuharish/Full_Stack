const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  step: { type: String, required: true },
  status: { type: String, enum: ['ok', 'warn', 'error'], default: 'ok' },
  message: { type: String },
  at: { type: Date, default: Date.now },
}, { _id: false });

const matchAuditSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, trim: true },
  steps: [stepSchema],
}, { timestamps: true });

matchAuditSchema.index({ poNumber: 1 });

module.exports = mongoose.model('MatchAudit', matchAuditSchema);
