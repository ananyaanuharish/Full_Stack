const Groq = require('groq-sdk');
const PDF2Json = require('pdf2json');
const fs = require('fs');

const PO_PROMPT = `Extract the following fields from this Purchase Order text and return ONLY valid JSON (no markdown, no explanation).

IMPORTANT field definitions:
- "itemCode": the NUMERIC product/SKU/item code (e.g. "11423", "12100"). This is a short number, NOT the product name. Look for columns labelled "Item Code", "SKU", "Product Code", "Code", "Material No". If you see a number like 11423 next to a product name, that number is the itemCode.
- "description": the product name/description text (e.g. "Mentos Mint 100pcs Jar")

{
  "poNumber": "string",
  "poDate": "string",
  "vendorName": "string",
  "vendorCode": "string",
  "warehouseCode": "string",
  "totalAmount": number,
  "items": [
    {
      "itemCode": "string",
      "description": "string",
      "hsnCode": "string",
      "quantity": number,
      "unitRate": number,
      "mrp": number,
      "uom": "string",
      "grossAmount": number
    }
  ]
}
All numbers must be actual numbers, not strings. If a field is missing, use null for strings and 0 for numbers.`;

const GRN_PROMPT = `Extract the following fields from this Goods Receipt Note (GRN) text and return ONLY valid JSON (no markdown, no explanation):
{
  "grnNumber": "string",
  "poNumber": "string",
  "grnDate": "string",
  "vendorName": "string",
  "warehouseCode": "string",
  "items": [
    {
      "itemCode": "string",
      "description": "string",
      "hsnCode": "string",
      "expectedQuantity": number,
      "receivedQuantity": number,
      "mrp": number,
      "uom": "string"
    }
  ]
}
All numbers must be actual numbers, not strings. If a field is missing, use null for strings and 0 for numbers.`;

const INVOICE_PROMPT = `Extract the following fields from this Invoice text and return ONLY valid JSON (no markdown, no explanation).

IMPORTANT field definitions:
- "invoiceNumber": the invoice's own unique ID (e.g. "IN25MH2504251", "INV-001"). This is the seller's invoice reference, NOT a PO number.
- "poNumber": the Purchase Order number this invoice is billed against (e.g. "CI4PO05788"). Look for labels like "PO No", "PO Number", "Purchase Order", "Order Ref". This will look like "CI4PO..." or similar.

{
  "invoiceNumber": "string",
  "poNumber": "string",
  "invoiceDate": "string",
  "vendorName": "string",
  "vendorGstin": "string",
  "buyerGstin": "string",
  "totalAmount": number,
  "taxAmount": number,
  "items": [
    {
      "itemCode": "string",
      "description": "string",
      "hsnCode": "string",
      "quantity": number,
      "unitRate": number,
      "mrp": number,
      "uom": "string",
      "grossAmount": number
    }
  ]
}
All numbers must be actual numbers, not strings. If a field is missing, use null for strings and 0 for numbers.`;

const PROMPTS = { po: PO_PROMPT, grn: GRN_PROMPT, invoice: INVOICE_PROMPT };

function cleanJsonResponse(text) {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  return text.trim();
}

async function parseDocumentWithGemini(filePath, documentType) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const prompt = PROMPTS[documentType];
  if (!prompt) throw new Error(`Unknown document type: ${documentType}`);

  const pdfText = await new Promise((resolve, reject) => {
    const parser = new PDF2Json();
    parser.on('pdfParser_dataReady', (data) => {
      const safeDecode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
      const text = data.Pages.map(page =>
        page.Texts.map(t => safeDecode(t.R.map(r => r.T).join(''))).join(' ')
      ).join('\n');
      resolve(text.slice(0, 12000));
    });
    parser.on('pdfParser_dataError', (e) => reject(new Error(e.parserError)));
    parser.loadPDF(filePath);
  }); // Groq context limit guard

  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are a document parser. Return ONLY valid JSON, no markdown, no explanation.' },
      { role: 'user', content: `${prompt}\n\nDocument text:\n${pdfText}` },
    ],
    temperature: 0,
    max_tokens: 4096,
  });

  const text = completion.choices[0]?.message?.content || '';
  const cleaned = cleanJsonResponse(text);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Groq returned invalid JSON: ${cleaned.substring(0, 200)}`);
  }

  return parsed;
}

module.exports = { parseDocumentWithGemini };
