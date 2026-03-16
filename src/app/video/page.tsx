"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ビルドエラーを防ぐための合図（動的処理の強制）
export const dynamic = "force-dynamic";

function VideoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestId = searchParams.get('id');
  const [isVideoFinished, setIsVideoFinished] = useState(false);

  // 本番環境のURLをここに固定します
  const baseUrl = "https://camp-saas-ecru.vercel.app";

  const handleNext = () => {
    // 正しいURL構成でQRページへ遷移させる
    router.push(`${baseUrl}/qr?id=${guestId}`);
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-black">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border-t-8 border-green-600 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">ルール動画の視聴</h2>
        
        {/* 動画視聴エリアのダミー */}
        <div 
          className={`aspect-video w-full rounded-2xl flex flex-col items-center justify-center mb-8 border-2 border-dashed cursor-pointer transition-all ${
            isVideoFinished ? "bg-green-100 border-green-500" : "bg-gray-100 border-gray-300"
          }`}
          onClick={() => setIsVideoFinished(true)}
        >
          <p className="text-4xl mb-2">📺</p>
          <p className="text-sm font-bold">
            {isVideoFinished ? "視聴完了！" : "ここをタップして視聴（完了）"}
          </p>
        </div>

        {/* 次へ進むボタン */}
        <button
          disabled={!isVideoFinished}
          onClick={handleNext}
          className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg ${
            isVideoFinished ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          理解しました（QR発行へ）
        </button>
      </div>
    </div>
  );
}

// Suspenseで囲むことでビルドエラーを回避
export default function VideoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-black">Loading...</div>}>
      <VideoContent />
    </Suspense>
  );
}