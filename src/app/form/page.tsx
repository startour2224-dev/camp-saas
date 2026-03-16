"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function FormPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', carNumber: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 挿入したデータの情報を .select() で受け取る
      const { data, error } = await supabase
        .from('guest_list')
        .insert([{ 
          name: formData.name, 
          phone: formData.phone, 
          car_number: formData.carNumber 
        }])
        .select();

      if (error) throw error;

      // 作成されたIDをURLパラメータに乗せて動画ページへ送る
      const newId = data[0].id;
      router.push(`/video?id=${newId}`);
      
    } catch (error: any) {
      alert("エラー: " + error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border-t-8 border-green-600">
        <h2 className="text-2xl font-bold text-green-800 mb-6 text-center">宿泊名簿の入力</h2>
        <form onSubmit={handleSubmit} className="space-y-5 text-black">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">お名前</label>
            <input required name="name" className="w-full p-4 bg-gray-50 rounded-2xl border outline-none focus:ring-2 focus:ring-green-500" onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">電話番号</label>
            <input required name="phone" type="tel" className="w-full p-4 bg-gray-50 rounded-2xl border outline-none focus:ring-2 focus:ring-green-500" onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">車両番号</label>
            <input required name="carNumber" className="w-full p-4 bg-gray-50 rounded-2xl border outline-none focus:ring-2 focus:ring-green-500" onChange={handleChange} />
          </div>
          <button type="submit" disabled={isSubmitting} className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg ${isSubmitting ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}>
            {isSubmitting ? "登録中..." : "登録して動画視聴へ"}
          </button>
        </form>
      </div>
    </div>
  );
}