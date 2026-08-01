'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import UploadModal from './UploadModal';

export default function Nav() {
  const { logout } = useAuth();
  const [showUpload, setShowUpload] = useState(false);

  return (
    <>
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-blue-700">3-Way Match</Link>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-blue-600">Dashboard</Link>
          <Link href="/masters/sku" className="text-sm text-gray-600 hover:text-blue-600">SKU Master</Link>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowUpload(true)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            + Upload
          </button>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600">Logout</button>
        </div>
      </nav>
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </>
  );
}
