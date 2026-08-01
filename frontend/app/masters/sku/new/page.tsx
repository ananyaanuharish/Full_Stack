'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { createSku } from '@/lib/api';
import Nav from '@/components/Nav';

export default function NewSkuPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({ skuErpCode: '', name: '', eanCode: '', hsnCode: '', uom: 'PKT', agreedRate: '', mrp: '', priceTolerance: '0.05' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createSku({
        ...form,
        agreedRate: form.agreedRate ? parseFloat(form.agreedRate) : null,
        mrp: form.mrp ? parseFloat(form.mrp) : null,
        priceTolerance: parseFloat(form.priceTolerance) || 0.05,
      });
      qc.invalidateQueries({ queryKey: ['skus'] });
      router.push('/masters/sku');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : 'Save failed';
      setError(msg || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Nav />
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold mb-6">New SKU</h1>
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
          {[
            { label: 'ERP Code *', key: 'skuErpCode', required: true },
            { label: 'Name *', key: 'name', required: true },
            { label: 'EAN Code', key: 'eanCode' },
            { label: 'HSN Code', key: 'hsnCode' },
            { label: 'UOM', key: 'uom' },
            { label: 'Agreed Rate', key: 'agreedRate', type: 'number' },
            { label: 'MRP', key: 'mrp', type: 'number' },
            { label: 'Price Tolerance (e.g. 0.05 = 5%)', key: 'priceTolerance', type: 'number' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1">{f.label}</label>
              <input type={f.type || 'text'} required={f.required}
                value={form[f.key as keyof typeof form]} onChange={set(f.key)} step="any"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save SKU'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
