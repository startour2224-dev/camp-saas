"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VideoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestId = searchParams.get('id'); // URLからIDを取得
  const [isVideoFinished, setIsVideoFinished] = useState(false);

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-black">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border-t-8 border-green-600 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">ルール動画の視聴</h2>
        <div 
          className={`aspect-video w-full rounded-2xl flex flex-col items-center justify-center mb-8 border-2 border-dashed cursor-pointer transition-all ${
            isVideoFinished ? "bg-green-100 border-green-500" : "bg-gray-100 border-gray-300"
          }`}
          onClick={() => setIsVideoFinished(true)}
        >
          <p className="text-4xl mb-2">📺</p>
          <p className="text-sm font-bold">{isVideoFinished ? "視聴完了！" : "ここをタップして視聴"}</p>
        </div>
        <button
          disabled={!isVideoFinished}
          onClick={() => router.push(`/qr?id=${guestId}`)} // IDを渡してQRページへ
          className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg ${
            isVideoFinished ? "bg-green-600 text-white" : "bg-gray-300 text-gray-500"
          }`}
        >
          理解しました（QR発行へ）
        </button>
      </div>
    </div>
  );
}