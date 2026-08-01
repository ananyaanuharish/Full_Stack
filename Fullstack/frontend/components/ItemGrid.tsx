'use client';
import { LineDetail, SkuMaster } from '@/lib/types';

function skuName(s: SkuMaster | string | null | undefined): string {
  if (!s) return '—';
  if (typeof s === 'string') return s;
  return s.name || s.skuErpCode || '—';
}
function skuErp(s: SkuMaster | string | null | undefined): string {
  if (!s || typeof s === 'string') return '—';
  return s.skuErpCode || '—';
}
function skuEan(s: SkuMaster | string | null | undefined): string {
  if (!s || typeof s === 'string') return '—';
  return s.eanCode || '—';
}
function skuHsn(s: SkuMaster | string | null | undefined): string {
  if (!s || typeof s === 'string') return '—';
  return s.hsnCode || '—';
}
function skuUom(s: SkuMaster | string | null | undefined): string {
  if (!s || typeof s === 'string') return '—';
  return s.uom || '—';
}

function fmt(n?: number) { return n != null ? n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'; }

export default function ItemGrid({ lines }: { lines: LineDetail[] }) {
  if (!lines.length) return <p className="text-sm text-gray-500 p-4">No line items.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs border-collapse">
        <thead className="bg-gray-100 text-gray-600 uppercase tracking-wide">
          <tr>
            {['SKU Name','ERP Code','EAN','HSN','UOM','PO Qty','GRN Qty','Inv Qty','PO Rate','Inv Rate','PO MRP','GRN MRP','Inv MRP','Flags'].map(h => (
              <th key={h} className="px-3 py-2 text-left whitespace-nowrap border-b">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => {
            const hasPrice = line.reasons.includes('price_mismatch');
            const hasMrp = line.reasons.includes('mrp_mismatch');
            const unmapped = line.reasons.includes('unmapped_master_sku');
            return (
              <tr key={i} className={`border-b ${unmapped ? 'bg-red-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-3 py-2 whitespace-nowrap font-medium">{skuName(line.skuMaster)}</td>
                <td className="px-3 py-2">{skuErp(line.skuMaster)}</td>
                <td className="px-3 py-2">{skuEan(line.skuMaster)}</td>
                <td className="px-3 py-2">{skuHsn(line.skuMaster)}</td>
                <td className="px-3 py-2">{skuUom(line.skuMaster)}</td>
                <td className="px-3 py-2 text-right">{fmt(line.poQty)}</td>
                <td className={`px-3 py-2 text-right ${line.reasons.includes('grn_qty_exceeds_po_qty') ? 'bg-orange-100' : ''}`}>{fmt(line.grnQty)}</td>
                <td className={`px-3 py-2 text-right ${line.reasons.includes('invoice_qty_exceeds_grn_qty') || line.reasons.includes('invoice_qty_exceeds_po_qty') ? 'bg-orange-100' : ''}`}>{fmt(line.invQty)}</td>
                <td className="px-3 py-2 text-right">{fmt(line.poRate)}</td>
                <td className={`px-3 py-2 text-right ${hasPrice ? 'bg-orange-100' : ''}`}>{fmt(line.invRate)}</td>
                <td className="px-3 py-2 text-right">{fmt(line.poMrp)}</td>
                <td className={`px-3 py-2 text-right ${hasMrp ? 'bg-orange-100' : ''}`}>{fmt(line.grnMrp)}</td>
                <td className={`px-3 py-2 text-right ${hasMrp ? 'bg-orange-100' : ''}`}>{fmt(line.invMrp)}</td>
                <td className="px-3 py-2">
                  {unmapped && <span className="text-red-600 font-bold mr-1" title="Unmapped SKU">⚠</span>}
                  {line.reasons.filter(r => r !== 'unmapped_master_sku').map(r => (
                    <span key={r} className="inline-block bg-orange-100 text-orange-800 rounded px-1 mr-1 text-xs">{r.replace(/_/g, ' ')}</span>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
