'use client';
import { useQuery } from '@tanstack/react-query';
import { listDocuments } from '@/lib/api';
import Nav from '@/components/Nav';
import Link from 'next/link';
import { PurchaseOrder } from '@/lib/types';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['documents', 'po'],
    queryFn: () => listDocuments({ type: 'po' }).then(r => r.data as PurchaseOrder[]),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {data?.length ?? 0} order{(data?.length ?? 0) !== 1 ? 's' : ''} — click a row to view match results
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading orders…</span>
          </div>
        ) : !data?.length ? (
          <div className="bg-white border-2 border-dashed rounded-xl p-16 text-center text-gray-400">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-lg font-medium text-gray-600 mb-1">No purchase orders yet</p>
            <p className="text-sm">Click <strong className="text-blue-600">+ Upload</strong> in the top bar to get started</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b">
                <tr>
                  <th className="px-6 py-3 text-left">PO Number</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Vendor</th>
                  <th className="px-6 py-3 text-center">Items</th>
                  <th className="px-6 py-3 text-right">Total Amount</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map(po => (
                  <tr key={po._id} className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => window.location.href = `/po/${po.poNumber}`}>
                    <td className="px-6 py-4 font-mono font-semibold text-blue-600">
                      {po.poNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{po.poDate ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-800">{po.vendorName ?? '—'}</td>
                    <td className="px-6 py-4 text-center text-gray-600">{po.items?.length ?? 0}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {po.totalAmount ? `₹${po.totalAmount.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/po/${po.poNumber}`}
                        onClick={e => e.stopPropagation()}
                        className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap">
                        View Match →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
