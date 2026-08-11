const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');
const SkuMaster = require('../models/SkuMaster');

const REASON_CODES = {
  GRN_QTY_EXCEEDS_PO: 'grn_qty_exceeds_po_qty',
  INVOICE_QTY_EXCEEDS_GRN: 'invoice_qty_exceeds_grn_qty',
  INVOICE_QTY_EXCEEDS_PO: 'invoice_qty_exceeds_po_qty',
  INVOICE_DATE_AFTER_PO: 'invoice_date_after_po_date',
  ITEM_MISSING_IN_PO: 'item_missing_in_po',
  PRICE_MISMATCH: 'price_mismatch',
  MRP_MISMATCH: 'mrp_mismatch',
  UNMAPPED_SKU: 'unmapped_master_sku',
  DUPLICATE_PO: 'duplicate_po',
  DUPLICATE_DOCUMENT: 'duplicate_document',
  INSUFFICIENT_DOCUMENTS: 'insufficient_documents',
};

const HARD_REASONS = new Set([
  REASON_CODES.GRN_QTY_EXCEEDS_PO,
  REASON_CODES.INVOICE_QTY_EXCEEDS_GRN,
  REASON_CODES.INVOICE_QTY_EXCEEDS_PO,
  REASON_CODES.INVOICE_DATE_AFTER_PO,
  REASON_CODES.ITEM_MISSING_IN_PO,
  REASON_CODES.DUPLICATE_PO,
  REASON_CODES.DUPLICATE_DOCUMENT,
]);

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function buildSkuKey(item) {
  if (item.skuMaster) {
    const id = item.skuMaster._id || item.skuMaster;
    return `sku:${id.toString()}`;
  }
  return `code:${(item.itemCode || '').trim().toLowerCase()}`;
}

function rollupStatus(reasons) {
  if (reasons.includes(REASON_CODES.INSUFFICIENT_DOCUMENTS)) return 'insufficient_documents';
  if (reasons.length === 0) return 'matched';
  const hasHard = reasons.some(r => HARD_REASONS.has(r));
  if (hasHard) return 'mismatch';
  return 'partially_matched';
}

async function runMatch(poNumber) {
  const reasons = [];
  const lineDetails = [];

  // Load documents
  const po = await PurchaseOrder.findOne({ poNumber }).populate('items.skuMaster');
  const grns = await Grn.find({ poNumber }).populate('items.skuMaster');
  const invoices = await Invoice.find({ poNumber }).populate('items.skuMaster');

  if (!po) {
    reasons.push(REASON_CODES.INSUFFICIENT_DOCUMENTS);
    return { poNumber, status: 'insufficient_documents', reasons, lineDetails, summary: buildSummary(po, grns, invoices) };
  }
  if (grns.length === 0 || invoices.length === 0) {
    reasons.push(REASON_CODES.INSUFFICIENT_DOCUMENTS);
    return { poNumber, status: 'insufficient_documents', reasons, lineDetails, summary: buildSummary(po, grns, invoices) };
  }

  // Build maps keyed by SKU key
  const poMap = new Map();
  for (const item of po.items) {
    const key = buildSkuKey(item);
    poMap.set(key, { ...item.toObject ? item.toObject() : item, key });
  }

  const grnMap = new Map();
  for (const grn of grns) {
    for (const item of grn.items) {
      const key = buildSkuKey(item);
      const existing = grnMap.get(key) || { receivedQuantity: 0, mrp: item.mrp, key, itemCode: item.itemCode, description: item.description };
      existing.receivedQuantity += item.receivedQuantity || 0;
      grnMap.set(key, existing);
    }
  }

  const invMap = new Map();
  for (const inv of invoices) {
    for (const item of inv.items) {
      const key = buildSkuKey(item);
      const existing = invMap.get(key) || { quantity: 0, unitRate: item.unitRate, mrp: item.mrp, key, itemCode: item.itemCode, description: item.description, grossAmount: 0 };
      existing.quantity += item.quantity || 0;
      existing.grossAmount += item.grossAmount || 0;
      if (!existing.unitRate && item.unitRate) existing.unitRate = item.unitRate;
      invMap.set(key, existing);
    }
  }

  // Check each PO line
  for (const [key, poItem] of poMap) {
    const grnItem = grnMap.get(key);
    const invItem = invMap.get(key);
    const lineReasons = [];

    const poQty = poItem.quantity || 0;
    const grnQty = grnItem ? grnItem.receivedQuantity : 0;
    const invQty = invItem ? invItem.quantity : 0;
    const poRate = poItem.unitRate || 0;
    const invRate = invItem ? (invItem.unitRate || 0) : 0;
    const poMrp = poItem.mrp || 0;
    const grnMrp = grnItem ? (grnItem.mrp || 0) : 0;
    const invMrp = invItem ? (invItem.mrp || 0) : 0;

    // Fetch agreed rate from SKU master if available
    let agreedRate = poRate;
    let priceTolerance = 0.05;
    if (poItem.skuMaster) {
      const skuDoc = await SkuMaster.findById(poItem.skuMaster._id || poItem.skuMaster);
      if (skuDoc) {
        if (skuDoc.agreedRate != null && skuDoc.agreedRate > 0) agreedRate = skuDoc.agreedRate;
        priceTolerance = skuDoc.priceTolerance || 0.05;
      }
    }
    //If we received more than what was ordered, I flag grn_qty_exceeds_po_qty
    if (grnQty > poQty) lineReasons.push(REASON_CODES.GRN_QTY_EXCEEDS_PO);
    //If the vendor is billing for more quantity than we received, I flag invoice_qty_exceeds_grn_qty
    if (invQty > grnQty && grnQty > 0) lineReasons.push(REASON_CODES.INVOICE_QTY_EXCEEDS_GRN);
    if (invQty > poQty) lineReasons.push(REASON_CODES.INVOICE_QTY_EXCEEDS_PO);

    // Price check: only if agreed rate is known and non-zero
    if (agreedRate > 0 && invRate > 0) {
      const priceDiff = Math.abs(invRate - agreedRate) / agreedRate;
      if (priceDiff > priceTolerance) lineReasons.push(REASON_CODES.PRICE_MISMATCH);
    }

    // MRP check: GRN/Invoice mrp vs SkuMaster.mrp, within ~1%
    let masterMrp = null;
    if (poItem.skuMaster) {
      const skuDoc = await SkuMaster.findById(poItem.skuMaster._id || poItem.skuMaster);
      if (skuDoc && skuDoc.mrp != null && skuDoc.mrp > 0) masterMrp = skuDoc.mrp;
    }
    if (masterMrp) {
      const grnMrpMismatch = grnMrp > 0 && Math.abs(grnMrp - masterMrp) / masterMrp > 0.01;
      const invMrpMismatch = invMrp > 0 && Math.abs(invMrp - masterMrp) / masterMrp > 0.01;
      if ((grnMrpMismatch || invMrpMismatch) && !lineReasons.includes(REASON_CODES.MRP_MISMATCH)) {
        lineReasons.push(REASON_CODES.MRP_MISMATCH);
      }
    }

    if (poItem.flags && poItem.flags.includes('unmapped_master_sku')) {
      lineReasons.push(REASON_CODES.UNMAPPED_SKU);
    }

    for (const r of lineReasons) {
      if (!reasons.includes(r)) reasons.push(r);
    }

    lineDetails.push({
      key,
      itemCode: poItem.itemCode,
      description: poItem.description,
      grnDescription: grnItem ? grnItem.description : undefined,
      invDescription: invItem ? invItem.description : undefined,
      skuMaster: poItem.skuMaster,
      poQty,
      grnQty,
      invQty,
      poRate,
      invRate,
      agreedRate,
      poMrp,
      grnMrp,
      invMrp,
      poGrossAmount: poItem.grossAmount || 0,
      invGrossAmount: invItem ? (invItem.grossAmount || 0) : 0,
      reasons: lineReasons,
    });
  }

  // Check items in invoices not in PO
  for (const [key, invItem] of invMap) {
    if (!poMap.has(key)) {
      reasons.push(REASON_CODES.ITEM_MISSING_IN_PO);
      lineDetails.push({
        key,
        itemCode: invItem.itemCode,
        description: invItem.description,
        invDescription: invItem.description,
        poQty: 0,
        grnQty: grnMap.get(key) ? grnMap.get(key).receivedQuantity : 0,
        invQty: invItem.quantity,
        invGrossAmount: invItem.grossAmount || 0,
        reasons: [REASON_CODES.ITEM_MISSING_IN_PO],
      });
    }
  }

  // Date check: no Invoice date may be after the PO date
  //validate the invoice date against the PO date. If the invoice date is after the PO date, I add invoice_date_after_po_date
  if (po.poDate && invoices.length > 0) {
    const poDateObj = parseDate(po.poDate);
    for (const inv of invoices) {
      const invDate = parseDate(inv.invoiceDate);
      if (poDateObj && invDate && invDate > poDateObj) {
        if (!reasons.includes(REASON_CODES.INVOICE_DATE_AFTER_PO)) {
          reasons.push(REASON_CODES.INVOICE_DATE_AFTER_PO);
        }
      }
    }
  }

  // check for duplicate POs and duplicate GRN or invoice numbers. If duplicates are found, I add the corresponding duplicate reason code
  const poCount = await PurchaseOrder.countDocuments({ poNumber });
  if (poCount > 1) reasons.push(REASON_CODES.DUPLICATE_PO);

  const grnNumberCounts = new Map();
  for (const grn of grns) {
    grnNumberCounts.set(grn.grnNumber, (grnNumberCounts.get(grn.grnNumber) || 0) + 1);
  }
  const invoiceNumberCounts = new Map();
  for (const inv of invoices) {
    invoiceNumberCounts.set(inv.invoiceNumber, (invoiceNumberCounts.get(inv.invoiceNumber) || 0) + 1);
  }
  const hasDuplicateDocument = [...grnNumberCounts.values(), ...invoiceNumberCounts.values()].some(c => c > 1);
  if (hasDuplicateDocument) reasons.push(REASON_CODES.DUPLICATE_DOCUMENT);

  const status = rollupStatus(reasons);

  return {
    poNumber,
    status,
    reasons,
    lineDetails,
    summary: buildSummary(po, grns, invoices),
  };
}

function buildSummary(po, grns, invoices) {
  const poAmount = po ? po.totalAmount || 0 : 0;
  const totalInvoiced = invoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0);
  const totalReceived = grns.reduce((s, grn) => {
    const qty = grn.items.reduce((q, i) => q + (i.receivedQuantity || 0), 0);
    return s + qty;
  }, 0);

  return {
    poAmount,
    totalInvoiced,
    totalReceived,
    grns: grns.map(g => ({ id: g._id, grnNumber: g.grnNumber, grnDate: g.grnDate, itemCount: g.items.length })),
    invoices: invoices.map(i => ({ id: i._id, invoiceNumber: i.invoiceNumber, invoiceDate: i.invoiceDate, totalAmount: i.totalAmount })),
  };
}

module.exports = { runMatch };
