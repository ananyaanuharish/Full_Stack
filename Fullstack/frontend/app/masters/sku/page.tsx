'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listSkus, deleteSku } from '@/lib/api';
import { SkuMaster } from '@/lib/types';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SkuListPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['skus', q, page],
    queryFn: () => listSkus({ q, page, limit: 50 }).then(r => r.data as { items: SkuMaster[]; total: number }),
  });

  const del = useMutation({
    mutationFn: deleteSku,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skus'] }),
  });

  return (
    <div>
      <Nav />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold">SKU Master</h1>
          <div className="flex gap-2">
            <input placeholder="Search name / ERP / EAN…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <Link href="/masters/sku/new"
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              + New SKU
            </Link>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  {['ERP Code','Name','EAN','HSN','UOM','Agreed Rate','MRP','Tolerance',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.items.map(sku => (
                  <tr key={sku._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono">{sku.skuErpCode}</td>
                    <td className="px-4 py-2 font-medium">{sku.name}</td>
                    <td className="px-4 py-2 text-gray-500">{sku.eanCode || '—'}</td>
                    <td className="px-4 py-2 text-gray-500">{sku.hsnCode || '—'}</td>
                    <td className="px-4 py-2">{sku.uom || '—'}</td>
                    <td className="px-4 py-2 text-right">{sku.agreedRate != null ? `₹${sku.agreedRate}` : '—'}</td>
                    <td className="px-4 py-2 text-right">{sku.mrp != null ? `₹${sku.mrp}` : '—'}</td>
                    <td className="px-4 py-2 text-right">{sku.priceTolerance != null ? `${(sku.priceTolerance * 100).toFixed(0)}%` : '—'}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button onClick={() => router.push(`/masters/sku/${sku._id}/edit`)}
                          className="text-xs text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => { if (confirm('Delete this SKU?')) del.mutate(sku._id); }}
                          className="text-xs text-red-500 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!data?.items.length && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No SKUs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > 50 && (
          <div className="flex gap-2 justify-center text-sm">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-40">Prev</button>
            <span className="px-3 py-1">{page} / {Math.ceil(data.total / 50)}</span>
            <button disabled={page >= Math.ceil(data.total / 50)} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
