const { z } = require('zod');

const numStr = z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).default(0);

const poItemSchema = z.object({
  itemCode: z.string().nullish().default('').transform(v => (v || '').replace(/\s+/g, '')),
  description: z.string().nullish().default(''),
  hsnCode: z.string().nullish().default(''),
  quantity: numStr,
  unitRate: numStr,
  mrp: numStr,
  uom: z.string().nullish().default(''),
  grossAmount: numStr,
});

const poSchema = z.object({
  poNumber: z.string().min(1, 'poNumber required'),
  poDate: z.string().nullish().default(''),
  vendorName: z.string().nullish().default(''),
  vendorCode: z.string().nullish().default(''),
  warehouseCode: z.string().nullish().default(''),
  totalAmount: numStr,
  items: z.array(poItemSchema).default([]),
});

const grnItemSchema = z.object({
  itemCode: z.string().nullish().default('').transform(v => (v || '').replace(/\s+/g, '')),
  description: z.string().nullish().default(''),
  hsnCode: z.string().nullish().default(''),
  expectedQuantity: numStr,
  receivedQuantity: numStr,
  mrp: numStr,
  uom: z.string().nullish().default(''),
});

const grnSchema = z.object({
  grnNumber: z.string().min(1, 'grnNumber required'),
  poNumber: z.string().min(1, 'poNumber required'),
  grnDate: z.string().nullish().default(''),
  vendorName: z.string().nullish().default(''),
  warehouseCode: z.string().nullish().default(''),
  items: z.array(grnItemSchema).default([]),
});

const invoiceItemSchema = z.object({
  itemCode: z.string().nullish().default('').transform(v => (v || '').replace(/\s+/g, '')),
  description: z.string().nullish().default(''),
  hsnCode: z.string().nullish().default(''),
  quantity: numStr,
  unitRate: numStr,
  mrp: numStr,
  uom: z.string().nullish().default(''),
  grossAmount: numStr,
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'invoiceNumber required'),
  poNumber: z.string().min(1, 'poNumber required'),
  invoiceDate: z.string().nullish().default(''),
  vendorName: z.string().nullish().default(''),
  vendorGstin: z.string().nullish().default(''),
  buyerGstin: z.string().nullish().default(''),
  totalAmount: numStr,
  taxAmount: numStr,
  items: z.array(invoiceItemSchema).default([]),
});

const SCHEMAS = { po: poSchema, grn: grnSchema, invoice: invoiceSchema };

function validateParsedOutput(raw, documentType) {
  const schema = SCHEMAS[documentType];
  if (!schema) throw new Error(`No schema for document type: ${documentType}`);
  return schema.parse(raw);
}

module.exports = { validateParsedOutput };
