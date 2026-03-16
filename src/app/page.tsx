import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl text-center">
        <h1 className="text-3xl font-bold text-green-800 mb-4">キャンプ場受付へようこそ</h1>
        <Link href="/form">
          <button className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-700 transition">
            受付を開始する
          </button>
        </Link>
      </div>
    </div>
  );
}