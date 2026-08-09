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

async function checkDuplicate(docType, poNumber, uniqueField, uniqueValue) {
  const Model = { po: PurchaseOrder, grn: Grn, invoice: Invoice }[docType];
  const filter = docType === 'po' ? { poNumber } : { poNumber, [uniqueField]: uniqueValue };
  const existing = await Model.findOne(filter);
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

  // 5. Check duplicate (store anyway — never overwrite; conflict surfaces in match results)
  const isDuplicate = await checkDuplicate(documentType, poNumber, uniqueField, uniqueValue);

  // 6. Persist document
  const Model = { po: PurchaseOrder, grn: Grn, invoice: Invoice }[documentType];
  const doc = await Model.create({ ...validated, filePath, originalFilename, rawParsed: raw });

  if (isDuplicate) {
    const label = { po: 'PO', grn: 'GRN', invoice: 'Invoice' }[documentType];
    warnings.push(`Duplicate ${label} — stored as a separate record; conflict will surface in match results`);
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
