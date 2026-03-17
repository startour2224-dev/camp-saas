"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

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

  // 1. データを取得する関数
  const fetchGuests = async () => {
    let query = supabase.from('guest_list').select('*');
    if (searchQuery) {
      query = query.eq('id', searchQuery);
    } else {
      query = query.order('created_at', { ascending: false });
    }
    const { data, error } = await query;
    if (!error) setGuests(data || []);
    setLoading(false);
  };

  // 2. ログインチェック ＆ リアルタイム監視の設定
  useEffect(() => {
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      // 初回データ読み込み
      await fetchGuests();

      // 【重要】Supabaseのリアルタイム監視を開始
      const channel = supabase
        .channel('guest_changes') // 任意のチャンネル名
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'guest_list' }, // すべての変更（追加・更新・削除）を監視
          () => {
            // 何か変化があったらデータを再取得する
            fetchGuests();
          }
        )
        .subscribe();

      // クリーンアップ（画面を閉じる時に監視を止める）
      return () => {
        supabase.removeChannel(channel);
      };
    };

    setup();
  }, [searchQuery]);

  const toggleCheckIn = async (id: string, currentStatus: boolean) => {
    await supabase.from('guest_list').update({ is_checked_in: !currentStatus }).eq('id', id);
    // fetchGuests()がリアルタイムで動くので、ここでは何もしなくてOK（自動で反映される）
  };

  const deleteGuest = async (id: string) => {
    if (!confirm("この宿泊者データを完全に削除しますか？")) return;
    await supabase.from('guest_list').delete().eq('id', id);
    // 同様にリアルタイムで検知される
  };

  if (loading) return <div className="p-8 text-center text-black">同期中...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 text-black">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">
            {searchQuery ? "🔍 照合モード" : "📋 宿泊者名簿（リアルタイム更新中）"}
          </h1>
          <button onClick={() => router.push('/admin')} className="text-xs bg-white border px-3 py-1 rounded">全表示</button>
        </header>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {guests.length === 0 ? (
            <div className="p-12 text-center text-gray-400">データがありません</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {guests.map((guest) => (
                <div key={guest.id} className={`p-4 flex items-center justify-between ${guest.is_checked_in ? "bg-green-50" : ""}`}>
                  <div>
                    <div className="font-bold text-lg">{guest.name} 様</div>
                    <div className="text-sm text-gray-500">{guest.car_number}</div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => toggleCheckIn(guest.id, guest.is_checked_in)} 
                      className={`px-4 py-2 rounded-lg font-bold text-sm ${guest.is_checked_in ? "bg-green-200 text-green-800" : "bg-blue-600 text-white"}`}
                    >
                      {guest.is_checked_in ? "完了" : "受付"}
                    </button>
                    <button onClick={() => deleteGuest(guest.id)} className="text-gray-300 hover:text-red-500">🗑️</button>
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
    <Suspense fallback={<div>Loading...</div>}>
      <AdminDashboard />
    </Suspense>
  );
}