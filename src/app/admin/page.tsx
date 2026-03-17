"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

// 動的レンダリングを強制し、キャッシュによる「全員表示」を防止
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  
  // URLの ?search=... または ?id=... 両方に対応できるようにします
  const searchQuery = searchParams.get('search') || searchParams.get('id');

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
    // searchQueryが変わるたびに再取得を実行
  }, [searchQuery]);

  const fetchGuests = async () => {
    setLoading(true);
    try {
      let query = supabase.from('guest_list').select('*');

      if (searchQuery && searchQuery !== "") {
        // IDで完全に一致するものを探す
        query = query.eq('id', searchQuery);
      } else {
        // 検索条件がない時だけ、新しい順に並べる
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Supabase Error:", error);
      } else {
        setGuests(data || []);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCheckIn = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('guest_list').update({ is_checked_in: !currentStatus }).eq('id', id);
    if (!error) {
      setGuests(prev => prev.map(g => g.id === id ? { ...g, is_checked_in: !currentStatus } : g));
    }
  };

  if (loading) return <div className="p-8 text-center text-black">データを照合中...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 text-black font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">
            {searchQuery ? "🔍 QR照合結果" : "📋 宿泊者名簿一覧"}
          </h1>
          <button 
            onClick={() => router.push('/admin')} 
            className="text-xs bg-white border border-gray-300 px-3 py-1 rounded shadow-sm"
          >
            全リスト表示
          </button>
        </header>

        {/* 検索中のIDを表示（デバッグ用） */}
        {searchQuery && (
          <div className="bg-yellow-50 border border-yellow-200 p-2 mb-4 rounded text-xs text-yellow-700">
            検索対象ID: {searchQuery}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {guests.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">該当する宿泊者が見つかりません</p>
              <button onClick={() => router.push('/admin')} className="text-blue-600 underline text-sm">
                名簿一覧に戻る
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {guests.map((guest) => (
                <div key={guest.id} className={`p-4 flex items-center justify-between ${guest.is_checked_in ? "bg-green-50" : ""}`}>
                  <div>
                    <div className="font-bold text-lg">{guest.name} 様</div>
                    <div className="text-sm text-gray-500">{guest.car_number}</div>
                  </div>
                  <button 
                    onClick={() => toggleCheckIn(guest.id, guest.is_checked_in)} 
                    className={`px-6 py-3 rounded-xl font-bold text-sm ${
                      guest.is_checked_in ? "bg-gray-200 text-gray-600" : "bg-blue-600 text-white shadow-lg"
                    }`}
                  >
                    {guest.is_checked_in ? "受付済み" : "チェックイン"}
                  </button>
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