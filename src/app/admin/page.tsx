"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

interface Guest {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  car_number: string;
  is_checked_in: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search'); // URLから検索IDを取得

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
  }, [router, searchQuery]); // searchQueryが変わったら再実行

  const fetchGuests = async () => {
    setLoading(true);
    let query = supabase.from('guest_list').select('*');

    // もしURLに検索IDがあれば、その人だけに絞り込む
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
      setGuests(guests.map(g => g.id === id ? { ...g, is_checked_in: !currentStatus } : g));
    }
  };

  const deleteGuest = async (id: string) => {
    if (!confirm("削除しますか？")) return;
    const { error } = await supabase.from('guest_list').delete().eq('id', id);
    if (!error) setGuests(guests.filter(g => g.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">宿泊者名簿</h1>
          <div className="space-x-4">
            {searchQuery && (
              <button onClick={() => router.push('/admin')} className="text-blue-600 underline">全リストを表示</button>
            )}
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="text-red-500">ログアウト</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b">
                <th className="p-4 font-bold">お名前 / 車両</th>
                <th className="p-4 font-bold text-center">受付</th>
                <th className="p-4 font-bold text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => (
                <tr key={guest.id} className={`${guest.is_checked_in ? "bg-green-50" : "hover:bg-blue-50"}`}>
                  <td className="p-4">
                    <div className="font-bold">{guest.name}</div>
                    <div className="text-xs text-gray-500">{guest.car_number}</div>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => toggleCheckIn(guest.id, guest.is_checked_in)} className={`px-6 py-2 rounded-full font-bold text-sm ${guest.is_checked_in ? "bg-green-200 text-green-800" : "bg-blue-600 text-white"}`}>
                      {guest.is_checked_in ? "完了" : "チェックイン"}
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => deleteGuest(guest.id)} className="text-gray-300 hover:text-red-500">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}