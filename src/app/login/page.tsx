"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("ログイン失敗: " + error.message);
    } else {
      router.push('/admin'); // ログイン成功で管理画面へ
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border-t-8 border-blue-600">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">管理者ログイン</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">メールアドレス</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-black outline-none focus:ring-2 focus:ring-blue-500" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">パスワード</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-black outline-none focus:ring-2 focus:ring-blue-500" 
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-4 rounded-xl text-white font-bold transition-all ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "認証中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}