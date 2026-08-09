'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { uploadDocument } from '@/lib/api';
import { useRouter } from 'next/navigation';

type FileState = { file: File | null; status: 'idle' | 'uploading' | 'done' | 'error'; message: string };
const EMPTY: FileState = { file: null, status: 'idle', message: '' };

function FileRow({
  label, state, onChange,
}: { label: string; state: FileState; onChange: (f: File | null) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input type="file" accept=".pdf" className="flex-1 text-sm"
          onChange={e => onChange(e.target.files?.[0] ?? null)} required />
        {state.status === 'uploading' && (
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        )}
        {state.status === 'done' && <span className="text-green-600 text-lg flex-shrink-0">✓</span>}
        {state.status === 'error' && <span className="text-red-500 text-lg flex-shrink-0">✗</span>}
      </div>
      {state.status === 'error' && (
        <p className="text-xs text-red-600 mt-1">{state.message}</p>
      )}
    </div>
  );
}

export default function UploadModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [po, setPo] = useState<FileState>({ ...EMPTY });
  const [grn, setGrn] = useState<FileState>({ ...EMPTY });
  const [inv, setInv] = useState<FileState>({ ...EMPTY });
  const [uploading, setUploading] = useState(false);
  const [poNumber, setPoNumber] = useState<string | null>(null);

  const allDone = po.status === 'done' && grn.status === 'done' && inv.status === 'done';
  const anyError = po.status === 'error' || grn.status === 'error' || inv.status === 'error';

  const uploadOne = async (setter: React.Dispatch<React.SetStateAction<FileState>>, file: File, type: string) => {
    setter(s => ({ ...s, status: 'uploading', message: '' }));
    try {
      const { data } = await uploadDocument(file, type);
      setter(s => ({ ...s, status: 'done', message: `PO: ${data.poNumber}` }));
      return data.poNumber as string;
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : 'Upload failed';
      setter(s => ({ ...s, status: 'error', message: msg || 'Upload failed' }));
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!po.file || !grn.file || !inv.file) return;
    setUploading(true);
    const [poNum] = await Promise.all([
      uploadOne(setPo, po.file, 'po'),
      uploadOne(setGrn, grn.file, 'grn'),
      uploadOne(setInv, inv.file, 'invoice'),
    ]);
    setUploading(false);
    if (poNum) {
      setPoNumber(poNum);
      qc.invalidateQueries({ queryKey: ['match', poNum] });
      qc.invalidateQueries({ queryKey: ['documents'] });
    }
  };

  const goToResults = () => {
    if (poNumber) { onClose(); router.push(`/po/${poNumber}`); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Upload Documents</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FileRow label="Purchase Order (PO) *" state={po} onChange={f => setPo(s => ({ ...s, file: f }))} />
          <FileRow label="GRN / Delivery *" state={grn} onChange={f => setGrn(s => ({ ...s, file: f }))} />
          <FileRow label="Invoice / Fulfillment *" state={inv} onChange={f => setInv(s => ({ ...s, file: f }))} />

          {uploading && (
            <p className="text-sm text-blue-600">Uploading and parsing all 3 documents…</p>
          )}

          {allDone && (
            <div className="text-sm text-green-700 bg-green-50 rounded p-2">
              All 3 documents parsed successfully!
            </div>
          )}

          {anyError && !uploading && (
            <p className="text-xs text-red-500">Fix the errors above and try again.</p>
          )}

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
              {allDone ? 'Close' : 'Cancel'}
            </button>
            {!allDone && (
              <button type="submit"
                disabled={!po.file || !grn.file || !inv.file || uploading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {uploading ? 'Uploading…' : 'Upload All'}
              </button>
            )}
            {allDone && (
              <button type="button" onClick={goToResults}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                View Match Results →
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
