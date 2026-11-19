'use client';

import { useEffect, useState } from 'react';

export function NetworkStatusBanner({ stale = false }: { stale?: boolean }) {
  const [online,setOnline]=useState(()=>typeof navigator==='undefined' ? true : navigator.onLine);
  useEffect(()=>{
    const update=()=>setOnline(navigator.onLine);
    window.addEventListener('online',update);
    window.addEventListener('offline',update);
    return ()=>{
      window.removeEventListener('online',update);
      window.removeEventListener('offline',update);
    };
  },[]);
  if(online && !stale)return null;
  return <div role="status" aria-live="polite" className="rounded-[10px] border border-[#E8D7B8] bg-[#FFF9EF] px-3 py-2 text-xs text-[#76551F]">
    {!online
      ? 'Offline — data yang tampil adalah snapshot halaman terakhir. Perubahan baru akan dikirim setelah koneksi pulih.'
      : 'Refresh API gagal — data yang tampil mungkin sudah stale. Gunakan Refresh untuk mengambil kondisi terbaru.'}
  </div>;
}
