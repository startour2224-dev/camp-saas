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

  // データを取得する関数
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

  useEffect(() => {
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      await fetchGuests();

      // リアルタイム監視
      const channel = supabase
        .channel('admin-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'guest_list' },
          () => {
            fetchGuests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setup();
  }, [searchQuery, router]);

  // チェックイン切り替え
  const toggleCheckIn = async (id: string, currentStatus: boolean) => {
    // 画面上の表示を先に変える（体感速度アップ）
    setGuests(prev => prev.map(g => g.id === id ? { ...g, is_checked_in: !currentStatus } : g));

    const { error } = await supabase
      .from('guest_list')
      .update({ is_checked_in: !currentStatus })
      .eq('id', id);

    if (error) {
      alert("更新に失敗しました: " + error.message);
      fetchGuests(); // 失敗したら元に戻す
    }
  };

  // 削除処理（ここを強化）
  const deleteGuest = async (id: string) => {
    if (!confirm("この宿泊者データを完全に削除しますか？\nこの操作は取り消せません。")) return;
    
    // 1. サーバーへ削除リクエスト
    const { error } = await supabase
      .from('guest_list')
      .delete()
      .eq('id', id);

    if (error) {
      // もしここでエラーが出るなら、RLSポリシーの設定が必要です
      console.error("削除エラー:", error);
      alert("削除に失敗しました。SupabaseのPolicy設定を確認してください。\nエラー内容: " + error.message);
    } else {
      // 2. 成功したら即座に画面から消す
      setGuests(prev => prev.filter(g => g.id !== id));
    }
  };

  if (loading) return <div className="p-8 text-center text-black font-bold">同期中...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 text-black">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">
            {searchQuery ? "🔍 照合モード" : "📋 宿泊者名簿一覧"}
          </h1>
          <div className="flex gap-2">
            {searchQuery && (
              <button onClick={() => router.push('/admin')} className="text-xs bg-white border px-3 py-2 rounded-lg">全表示</button>
            )}
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="text-xs text-red-500 px-2">ログアウト</button>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          {guests.length === 0 ? (
            <div className="p-12 text-center text-gray-400">データがありません</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {guests.map((guest) => (
                <div key={guest.id} className={`p-4 flex items-center justify-between ${guest.is_checked_in ? "bg-green-50" : ""}`}>
                  <div>
                    <div className="font-bold text-lg">{guest.name} 様</div>
                    <div className="text-xs text-gray-500">{guest.car_number} | {guest.phone}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleCheckIn(guest.id, guest.is_checked_in)} 
                      className={`px-4 py-2 rounded-xl font-bold text-sm shadow-sm ${
                        guest.is_checked_in ? "bg-green-200 text-green-800" : "bg-blue-600 text-white"
                      }`}
                    >
                      {guest.is_checked_in ? "完了" : "受付"}
                    </button>
                    <button 
                      onClick={() => deleteGuest(guest.id)} 
                      className="text-gray-300 hover:text-red-500 p-2 transition-colors"
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
    <Suspense fallback={<div className="p-8 text-center text-black">読み込み中...</div>}>
      <AdminDashboard />
    </Suspense>
  );
}