"use client";

import React, { Suspense } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export const dynamic = "force-dynamic";

function QrContent() {
  const searchParams = useSearchParams();
  const guestId = searchParams.get('id');

  // 【最重要】ここを現在の本番URLに書き換えてください
  const baseUrl = "https://camp-saas-ecru.vercel.app"; 
  const adminUrl = `${baseUrl}/admin?search=${guestId}`;

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-black">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border-t-8 border-green-600">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">受付準備完了！</h2>
        <p className="text-gray-500 mb-8 text-sm">このQRコードをスタッフに見せてください。</p>

        <div className="flex justify-center mb-8">
          <div className="bg-white p-4 border-2 border-gray-100 rounded-2xl shadow-inner">
            {guestId ? (
              <QRCodeSVG value={adminUrl} size={200} />
            ) : (
              <p className="text-red-500">IDが見つかりません</p>
            )}
          </div>
        </div>
        
        <Link href="/">
          <button className="text-green-600 font-bold hover:underline">トップへ戻る</button>
        </Link>
      </div>
    </div>
  );
}

export default function QrPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-black">生成中...</div>}>
      <QrContent />
    </Suspense>
  );
}