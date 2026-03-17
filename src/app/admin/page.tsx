"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

// キャッシュを無効化し、常に最新のリアルタイムデータを反映させる
export const dynamic = "force-dynamic";

interface Guest {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  car_number: string;
  is_checked_in: boolean;
}

function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || searchParams.get('id');

  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  // データを取得する関数（初期表示と、リアルタイム検知時に呼び出す）
  const fetchGuests = async () => {
    let query = supabase.from('guest_list').select('*');
    
    if (searchQuery) {
      query = query.eq('id', searchQuery);
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      console.error("データ取得エラー:", error.message);
    } else {
      setGuests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const initialize = async () => {
      // 1. ログインチェック
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // 2. 初回データ読み込み
      await fetchGuests();

      // 3. リアルタイム監視の設定
      const channel = supabase
        .channel('realtime-guest-list') // 任意のチャンネル名
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE すべてを監視
            schema: 'public',
            table: 'guest_list',
          },
          (payload) => {
            console.log('DBに変更がありました:', payload);
            // 何か変更があったら即座に再取得して画面を更新
            fetchGuests();
          }
        )
        .subscribe();

      // クリーンアップ：画面を離れる時に接続を切る
      return () => {
        supabase.removeChannel(channel);
      };
    };

    initialize();
  }, [searchQuery, router]);

  // チェックイン切り替え
  const toggleCheckIn = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('guest_list')
      .update({ is_checked_in: !currentStatus })
      .eq('id', id);
    
    if (error) alert("更新に失敗しました");
    // リアルタイム通信がONなら、ここでfetchGuestsを呼ばなくても自動で更新されます
  };

  // データ削除
  const deleteGuest = async (id: string) => {
    if (!confirm("この宿泊者データを完全に削除しますか？\n（この操作は取り消せません）")) return;
    
    const { error } = await supabase
      .from('guest_list')
      .delete()
      .eq('id', id);

    if (error) alert("削除に失敗しました");
    // リアルタイム通信がONなら、ここでfetchGuestsを呼ばなくても自動で更新されます
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 font-bold animate-pulse">データを同期中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 text-black">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              {searchQuery ? "🔍 照合モード" : "📋 宿泊者名簿一覧"}
            </h1>
            <p className="text-xs text-green-600 font-medium">● リアルタイム同期中</p>
          </div>
          <div className="flex gap-2">
            {searchQuery && (
              <button 
                onClick={() => router.push('/admin')} 
                className="text-xs bg-white border border-gray-300 px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50"
              >
                全リスト表示
              </button>
            )}
            <button 
              onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
              className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100"
            >
              ログアウト
            </button>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          {guests.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-gray-400">表示できるデータがありません</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {guests.map((guest) => (
                <div 
                  key={guest.id} 
                  className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    guest.is_checked_in ? "bg-green-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-gray-900">{guest.name} 様</span>
                      {guest.is_checked_in && (
                        <span className="bg-green-200 text-green-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          CHECKED IN
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      🚗 {guest.car_number} <span className="mx-2 text-gray-300">|</span> 📞 {guest.phone}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleCheckIn(guest.id, guest.is_checked_in)} 
                      className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 ${
                        guest.is_checked_in 
                          ? "bg-white border-2 border-green-500 text-green-600" 
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {guest.is_checked_in ? "✓ 受付完了" : "チェックイン"}
                    </button>
                    <button 
                      onClick={() => deleteGuest(guest.id)} 
                      className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                      title="削除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-black">Loading...</div>}>
      <AdminDashboard />
    </Suspense>
  );
}