const { parseDocumentWithGemini } = require('./geminiParser');
const { validateParsedOutput } = require('./zodValidators');
const { resolveSkuMaster } = require('./resolveSkuMaster');
const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');
const MatchAudit = require('../models/MatchAudit');

async function appendAudit(poNumber, step, status, message) {
  await MatchAudit.findOneAndUpdate(
    { poNumber },
    { $push: { steps: { step, status, message, at: new Date() } } },
    { upsert: true, new: true }
  );
}

async function checkDuplicate(docType, uniqueField, uniqueValue) {
  const Model = { po: PurchaseOrder, grn: Grn, invoice: Invoice }[docType];
  const existing = await Model.findOne({ [uniqueField]: uniqueValue });
  return !!existing;
}

async function runUploadPipeline(filePath, originalFilename, documentType) {
  const warnings = [];

  // 1. Parse with Gemini
  let raw;
  try {
    raw = await parseDocumentWithGemini(filePath, documentType);
  } catch (err) {
    throw new Error(`Gemini parsing failed: ${err.message}`);
  }

  // 2. Validate (retry once on failure)
  let validated;
  try {
    validated = validateParsedOutput(raw, documentType);
  } catch {
    // retry: re-parse once more
    try {
      raw = await parseDocumentWithGemini(filePath, documentType);
      validated = validateParsedOutput(raw, documentType);
    } catch (err2) {
      throw new Error(`Validation failed after retry: ${err2.message}`);
    }
  }

  // 3. Resolve SKU master
  validated.items = await resolveSkuMaster(validated.items);
  const unmapped = validated.items.filter(i => i.flags && i.flags.includes('unmapped_master_sku'));
  if (unmapped.length > 0) {
    warnings.push(`${unmapped.length} item(s) could not be mapped to SKU master`);
  }

  // 4. Determine poNumber and unique key
  const poNumber = validated.poNumber;
  const uniqueFields = { po: ['poNumber', poNumber], grn: ['grnNumber', validated.grnNumber], invoice: ['invoiceNumber', validated.invoiceNumber] };
  const [uniqueField, uniqueValue] = uniqueFields[documentType];

  // 5. Check duplicate
  const isDuplicate = await checkDuplicate(documentType, uniqueField, uniqueValue);

  // 6. Persist document
  let doc;
  if (documentType === 'po') {
    if (isDuplicate) {
      doc = await PurchaseOrder.findOneAndUpdate(
        { poNumber },
        { ...validated, filePath, originalFilename, rawParsed: raw },
        { new: true }
      );
      warnings.push('Duplicate PO — existing record updated');
    } else {
      doc = await PurchaseOrder.create({ ...validated, filePath, originalFilename, rawParsed: raw });
    }
  } else if (documentType === 'grn') {
    if (isDuplicate) {
      doc = await Grn.findOneAndUpdate(
        { grnNumber: validated.grnNumber },
        { ...validated, filePath, originalFilename, rawParsed: raw },
        { new: true }
      );
      warnings.push('Duplicate GRN — existing record updated');
    } else {
      doc = await Grn.create({ ...validated, filePath, originalFilename, rawParsed: raw });
    }
  } else {
    if (isDuplicate) {
      doc = await Invoice.findOneAndUpdate(
        { invoiceNumber: validated.invoiceNumber },
        { ...validated, filePath, originalFilename, rawParsed: raw },
        { new: true }
      );
      warnings.push('Duplicate Invoice — existing record updated');
    } else {
      doc = await Invoice.create({ ...validated, filePath, originalFilename, rawParsed: raw });
    }
  }

  // 7. Append audit
  await appendAudit(
    poNumber || validated.poNumber,
    `upload:${documentType}`,
    isDuplicate ? 'warn' : 'ok',
    isDuplicate ? `Duplicate ${documentType} uploaded` : `${documentType} uploaded successfully`
  );

  return { documentId: doc._id.toString(), documentType, poNumber: validated.poNumber || poNumber, warnings };
}

module.exports = { runUploadPipeline };
