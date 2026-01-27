import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          TrailReady
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Know before you go.
        </p>
        <p className="text-gray-700 mb-8">
          Real-time trail condition reports from the off-road community.
          Check current trail status before you head out.
        </p>
        <Link
          href="/trails"
          className="inline-block px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          Browse Trails
        </Link>
      </div>
    </div>
  );
}