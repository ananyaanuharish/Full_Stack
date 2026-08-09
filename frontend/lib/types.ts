export interface SkuMaster {
  _id: string;
  skuErpCode: string;
  name: string;
  eanCode?: string;
  hsnCode?: string;
  uom?: string;
  agreedRate?: number;
  mrp?: number;
  priceTolerance?: number;
}

export interface DocItem {
  itemCode?: string;
  description?: string;
  hsnCode?: string;
  quantity?: number;
  receivedQuantity?: number;
  expectedQuantity?: number;
  unitRate?: number;
  mrp?: number;
  uom?: string;
  grossAmount?: number;
  skuMaster?: SkuMaster | string | null;
  flags?: string[];
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  poDate?: string;
  vendorName?: string;
  vendorCode?: string;
  warehouseCode?: string;
  totalAmount?: number;
  items: DocItem[];
  originalFilename?: string;
}

export interface Grn {
  _id: string;
  grnNumber: string;
  poNumber: string;
  grnDate?: string;
  vendorName?: string;
  warehouseCode?: string;
  items: DocItem[];
  originalFilename?: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  poNumber: string;
  invoiceDate?: string;
  vendorName?: string;
  vendorGstin?: string;
  buyerGstin?: string;
  totalAmount?: number;
  taxAmount?: number;
  items: DocItem[];
  originalFilename?: string;
}

export interface LineDetail {
  key: string;
  itemCode?: string;
  description?: string;
  grnDescription?: string;
  invDescription?: string;
  skuMaster?: SkuMaster | string | null;
  poQty: number;
  grnQty: number;
  invQty: number;
  poRate?: number;
  invRate?: number;
  agreedRate?: number;
  poMrp?: number;
  grnMrp?: number;
  invMrp?: number;
  poGrossAmount?: number;
  invGrossAmount?: number;
  reasons: string[];
}

export interface MatchResult {
  poNumber: string;
  status: 'matched' | 'mismatch' | 'insufficient_documents';
  reasons: string[];
  lineDetails: LineDetail[];
  summary: {
    poAmount: number;
    totalInvoiced: number;
    totalReceived: number;
    grns: { id: string; grnNumber: string; grnDate?: string; itemCount: number }[];
    invoices: { id: string; invoiceNumber: string; invoiceDate?: string; totalAmount: number }[];
  };
}
