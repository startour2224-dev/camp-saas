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
  const searchQuery = searchParams.get('search'); // QRから渡されたID

  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        fetchGuests();
      }
    };
    checkUser();
  }, [router, searchQuery]);

  const fetchGuests = async () => {
    setLoading(true);
    let query = supabase.from('guest_list').select('*');

    // 【ここを修正】検索パラメータがある場合は、そのIDで完全に絞り込む
    if (searchQuery) {
      query = query.eq('id', searchQuery);
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      alert("エラー: " + error.message);
    } else {
      setGuests(data || []);
    }
    setLoading(false);
  };

  const toggleCheckIn = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('guest_list').update({ is_checked_in: !currentStatus }).eq('id', id);
    if (!error) {
      // 状態を更新
      setGuests(guests.map(g => g.id === id ? { ...g, is_checked_in: !currentStatus } : g));
    }
  };

  const deleteGuest = async (id: string) => {
    if (!confirm("このデータを削除しますか？")) return;
    const { error } = await supabase.from('guest_list').delete().eq('id', id);
    if (!error) setGuests(guests.filter(g => g.id !== id));
  };

  if (loading) return <div className="p-8 text-center text-black">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 text-black font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {searchQuery ? "チェックイン照合" : "宿泊者名簿一覧"}
          </h1>
          <div className="space-x-3">
            {searchQuery && (
              <button 
                onClick={() => router.push('/admin')} 
                className="text-sm bg-gray-200 px-3 py-1 rounded-lg"
              >
                全員表示に戻る
              </button>
            )}
            <button 
              onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} 
              className="text-sm text-red-500"
            >
              ログアウト
            </button>
          </div>
        </div>

        {searchQuery && guests.length > 0 && (
          <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-6 text-blue-700 text-sm">
            QRコードから特定の宿泊者を表示しています。
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b">
                <th className="p-4 font-bold">宿泊者情報</th>
                <th className="p-4 font-bold text-center">受付状況</th>
                <th className="p-4 font-bold text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {guests.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-gray-400">
                    該当するデータが見つかりません
                  </td>
                </tr>
              ) : (
                guests.map((guest) => (
                  <tr key={guest.id} className={`border-b ${guest.is_checked_in ? "bg-green-50" : "hover:bg-gray-50"}`}>
                    <td className="p-4">
                      <div className="font-bold text-lg">{guest.name} 様</div>
                      <div className="text-sm text-gray-500">車両: {guest.car_number}</div>
                      <div className="text-xs text-gray-400">電話: {guest.phone}</div>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => toggleCheckIn(guest.id, guest.is_checked_in)} 
                        className={`w-full max-w-[140px] py-3 rounded-xl font-bold text-sm transition-all ${
                          guest.is_checked_in 
                            ? "bg-green-200 text-green-800 border-2 border-green-300" 
                            : "bg-blue-600 text-white shadow-md active:scale-95"
                        }`}
                      >
                        {guest.is_checked_in ? "✓ 受付済" : "チェックイン"}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => deleteGuest(guest.id)} 
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-black">管理画面を準備中...</div>}>
      <AdminDashboard />
    </Suspense>
  );
}