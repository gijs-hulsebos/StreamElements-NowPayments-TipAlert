import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], weight: ['400', '600'] });

export default function OverlayPage() {
  return (
    <main className={`${inter.className} min-h-screen bg-gray-950 flex items-center justify-center p-8`}>
      <div className="max-w-xl w-full bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl text-center">
        <h1 className="text-2xl font-bold text-white mb-4">StreamElements Integration Active</h1>
        <p className="text-gray-400 mb-6 font-medium">
          The NOWPayments webhook bridge is now configured to send alerts directly to StreamElements.
        </p>
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6 text-left border border-gray-700/50">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">How it works now:</h2>
          <ol className="list-decimal list-inside text-gray-400 space-y-2 text-sm">
            <li>A viewer pays via <strong>NOWPayments</strong></li>
            <li>This app receives the secure webhook (IPN)</li>
            <li>The webhook forwards a Tip request to the <strong>StreamElements Custom Tips API</strong></li>
            <li>The alert appears on your standard <strong>StreamElements widget in OBS!</strong></li>
          </ol>
        </div>
        <p className="text-sm text-yellow-500 font-medium">
          Note: You no longer need a custom HTML overlay. 
          StreamElements handles the visual alert!
        </p>
      </div>
    </main>
  );
}
