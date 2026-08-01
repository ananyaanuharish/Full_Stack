'use client';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getMatch, listDocuments } from '@/lib/api';
import { MatchResult, PurchaseOrder, Grn, Invoice } from '@/lib/types';
import Nav from '@/components/Nav';
import ItemGrid from '@/components/ItemGrid';
import Link from 'next/link';
import { useState } from 'react';

const STATUS_COLORS: Record<string, string> = {
  matched: 'bg-green-100 text-green-800 border-green-200',
  mismatch: 'bg-red-100 text-red-800 border-red-200',
  insufficient_documents: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const STATUS_ICONS: Record<string, string> = {
  matched: '✓',
  mismatch: '✗',
  insufficient_documents: '⚠',
};

function FieldRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value ?? '—'}</span>
    </div>
  );
}

function DocPanel({ title, fields, fileId }: { title: string; fields: { label: string; value?: string | number | null }[]; fileId?: string }) {
  const [zoom, setZoom] = useState(100);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const fileUrl = fileId ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/documents/${fileId}/file?token=${token}` : null;

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Panel header */}
      <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {fileUrl && (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
            Open PDF ↗
          </a>
        )}
      </div>

      {/* Two-column layout: metadata left, PDF right */}
      <div className="flex min-h-[560px]">
        {/* Left: metadata fields */}
        <div className="w-72 flex-shrink-0 border-r p-6 space-y-5 overflow-y-auto">
          {fields.map(f => <FieldRow key={f.label} {...f} />)}
        </div>

        {/* Right: PDF preview */}
        <div className="flex-1 flex flex-col">
          {/* Zoom toolbar */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b text-xs">
            <button onClick={() => setZoom(z => Math.max(50, z - 25))}
              className="w-6 h-6 border rounded hover:bg-white flex items-center justify-center font-medium">−</button>
            <span className="w-10 text-center text-gray-600">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 25))}
              className="w-6 h-6 border rounded hover:bg-white flex items-center justify-center font-medium">+</button>
            <button onClick={() => setZoom(100)}
              className="px-2 py-0.5 border rounded hover:bg-white text-gray-500">Reset</button>
          </div>

          {/* PDF iframe */}
          <div className="flex-1 relative overflow-hidden bg-gray-100">
            {fileUrl ? (
              <iframe
                src={fileUrl}
                title="Document preview"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top left',
                  width: `${10000 / zoom}%`,
                  height: `${10000 / zoom}%`,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
                <span className="text-4xl">📄</span>
                <span className="text-sm">No PDF available</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PoMatchPage() {
  const { poNumber } = useParams<{ poNumber: string }>();
  const [tab, setTab] = useState<'po' | 'delivery' | 'fulfillment' | 'summary'>('po');
  const [grnIdx, setGrnIdx] = useState(0);
  const [invIdx, setInvIdx] = useState(0);

  const { data: match, isLoading: matchLoading } = useQuery<MatchResult>({
    queryKey: ['match', poNumber],
    queryFn: () => getMatch(poNumber).then(r => r.data),
  });

  const { data: docs } = useQuery({
    queryKey: ['documents', poNumber],
    queryFn: () => listDocuments({ poNumber }).then(r => r.data as { pos: PurchaseOrder[]; grns: Grn[]; invoices: Invoice[] }),
  });

  const po = docs?.pos?.[0];
  const grns = docs?.grns ?? [];
  const invoices = docs?.invoices ?? [];
  const grn = grns[grnIdx];
  const inv = invoices[invIdx];

  if (matchLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading match results…</span>
          </div>
        </div>
      </div>
    );
  }

  const statusClass = match ? STATUS_COLORS[match.status] ?? 'bg-gray-100 text-gray-700 border-gray-200' : '';
  const statusIcon = match ? STATUS_ICONS[match.status] ?? '?' : '';
  const uniqueReasons = match ? [...new Set(match.reasons)] : [];

  const tabs = [
    { key: 'po', label: 'Purchase Order', count: 1 },
    { key: 'delivery', label: 'Delivery', count: grns.length },
    { key: 'fulfillment', label: 'Fulfillment', count: invoices.length },
    { key: 'summary', label: 'Summary', count: null },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{poNumber}</span>
        </div>

        {/* Header card */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PO {poNumber}</h1>
              {po?.vendorName && (
                <p className="text-sm text-gray-500 mt-0.5">Vendor: {po.vendorName}</p>
              )}
            </div>
            {match && (
              <div className="flex flex-col items-end gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${statusClass}`}>
                  <span>{statusIcon}</span>
                  {match.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Reason pills */}
          {uniqueReasons.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Mismatch Reasons</p>
              <div className="flex gap-2 flex-wrap">
                {uniqueReasons.map(r => (
                  <span key={r} className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full font-medium">
                    {r.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="border-b border-gray-200 flex gap-0">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              {t.label}
              {t.count !== null && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* PO tab */}
        {tab === 'po' && (
          <div className="space-y-5">
            <DocPanel
              title="Purchase Order Details"
              fileId={po?._id}
              fields={[
                { label: 'PO Number', value: po?.poNumber },
                { label: 'PO Date', value: po?.poDate },
                { label: 'Vendor Name', value: po?.vendorName },
                { label: 'Vendor Code', value: po?.vendorCode },
                { label: 'Warehouse', value: po?.warehouseCode },
                { label: 'Total Amount', value: po?.totalAmount != null ? `₹${po.totalAmount.toLocaleString('en-IN')}` : undefined },
                { label: 'Line Items', value: po?.items?.length },
              ]}
            />
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-800">Line Items</h3>
              </div>
              <div className="overflow-x-auto">
                <ItemGrid lines={match?.lineDetails ?? []} />
              </div>
            </div>
          </div>
        )}

        {/* Delivery (GRN) tab */}
        {tab === 'delivery' && (
          <div className="space-y-5">
            {grns.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
                <p className="text-lg font-medium mb-1">No GRNs uploaded</p>
                <p className="text-sm">Upload a GRN PDF to see delivery details.</p>
              </div>
            ) : (
              <>
                {grns.length > 1 && (
                  <div className="flex gap-2 flex-wrap">
                    {grns.map((g, i) => (
                      <button key={g._id} onClick={() => setGrnIdx(i)}
                        className={`px-4 py-1.5 text-sm rounded-full border font-medium transition-colors ${
                          grnIdx === i ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100 text-gray-600'
                        }`}>
                        {g.grnNumber}
                      </button>
                    ))}
                  </div>
                )}
                <DocPanel
                  title={`GRN: ${grn?.grnNumber}`}
                  fileId={grn?._id}
                  fields={[
                    { label: 'GRN Number', value: grn?.grnNumber },
                    { label: 'PO Number', value: grn?.poNumber },
                    { label: 'GRN Date', value: grn?.grnDate },
                    { label: 'Vendor Name', value: grn?.vendorName },
                    { label: 'Warehouse', value: grn?.warehouseCode },
                    { label: 'Line Items', value: grn?.items?.length },
                  ]}
                />
                <div className="bg-white rounded-xl border overflow-hidden">
                  <div className="px-6 py-4 border-b bg-gray-50">
                    <h3 className="font-semibold text-gray-800">Line Items</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <ItemGrid lines={match?.lineDetails ?? []} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Fulfillment (Invoice) tab */}
        {tab === 'fulfillment' && (
          <div className="space-y-5">
            {invoices.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
                <p className="text-lg font-medium mb-1">No invoices uploaded</p>
                <p className="text-sm">Upload an Invoice PDF to see fulfillment details.</p>
              </div>
            ) : (
              <>
                {invoices.length > 1 && (
                  <div className="flex gap-2 flex-wrap">
                    {invoices.map((invoice, i) => (
                      <button key={invoice._id} onClick={() => setInvIdx(i)}
                        className={`px-4 py-1.5 text-sm rounded-full border font-medium transition-colors ${
                          invIdx === i ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100 text-gray-600'
                        }`}>
                        {invoice.invoiceNumber}
                      </button>
                    ))}
                  </div>
                )}
                <DocPanel
                  title={`Invoice: ${inv?.invoiceNumber}`}
                  fileId={inv?._id}
                  fields={[
                    { label: 'Invoice Number', value: inv?.invoiceNumber },
                    { label: 'PO Number', value: inv?.poNumber },
                    { label: 'Invoice Date', value: inv?.invoiceDate },
                    { label: 'Vendor Name', value: inv?.vendorName },
                    { label: 'Vendor GSTIN', value: inv?.vendorGstin },
                    { label: 'Buyer GSTIN', value: inv?.buyerGstin },
                    { label: 'Total Amount', value: inv?.totalAmount != null ? `₹${inv.totalAmount.toLocaleString('en-IN')}` : undefined },
                    { label: 'Tax Amount', value: inv?.taxAmount != null ? `₹${inv.taxAmount.toLocaleString('en-IN')}` : undefined },
                    { label: 'Line Items', value: inv?.items?.length },
                  ]}
                />
                <div className="bg-white rounded-xl border overflow-hidden">
                  <div className="px-6 py-4 border-b bg-gray-50">
                    <h3 className="font-semibold text-gray-800">Line Items</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <ItemGrid lines={match?.lineDetails ?? []} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Summary tab */}
        {tab === 'summary' && match && (
          <div className="space-y-5">
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'PO Amount', value: `₹${(match.summary.poAmount ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, color: 'border-l-blue-500' },
                { label: 'Total Invoiced', value: `₹${(match.summary.totalInvoiced ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, color: 'border-l-purple-500' },
                { label: 'Units Received', value: (match.summary.totalReceived ?? 0).toLocaleString('en-IN'), color: 'border-l-green-500' },
              ].map(card => (
                <div key={card.label} className={`bg-white rounded-xl border border-l-4 ${card.color} p-5`}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>
                  <p className="text-2xl font-bold mt-1.5 text-gray-900">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Documents table */}
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-800">Documents</h3>
              </div>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b">
                  <tr>
                    <th className="px-6 py-3 text-left">Type</th>
                    <th className="px-6 py-3 text-left">Number</th>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-right">Amount / Items</th>
                    <th className="px-6 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {match.summary.grns.map(g => (
                    <tr key={g.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-500 font-medium">GRN</td>
                      <td className="px-6 py-3 font-medium font-mono">{g.grnNumber}</td>
                      <td className="px-6 py-3 text-gray-600">{g.grnDate || '—'}</td>
                      <td className="px-6 py-3 text-right text-gray-600">{g.itemCount} items</td>
                      <td className="px-6 py-3">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">Received</span>
                      </td>
                    </tr>
                  ))}
                  {match.summary.invoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-500 font-medium">Invoice</td>
                      <td className="px-6 py-3 font-medium font-mono">{invoice.invoiceNumber}</td>
                      <td className="px-6 py-3 text-gray-600">{invoice.invoiceDate || '—'}</td>
                      <td className="px-6 py-3 text-right font-medium">₹{(invoice.totalAmount ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">Invoiced</span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-6 py-4" colSpan={3}>Current Match Status</td>
                    <td colSpan={2} className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-lg border ${statusClass}`}>
                        {statusIcon} {match.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
