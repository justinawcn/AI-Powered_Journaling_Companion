'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useViewportHeight } from '@/lib/useViewportHeight';

export default function HomePage() {
  const router = useRouter();
  
  // Fix viewport height for mobile devices
  useViewportHeight();

  useEffect(() => {
    // Redirect to chat page by default
    router.push('/chat');
  }, [router]);

  return (
    <div className="h-screen mobile-viewport-fix tablet-viewport-fix desktop-viewport-fix flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Vibe Journal</h1>
        <p className="text-gray-600">Redirecting to your journal companion...</p>
      </div>
    </div>
  );
}
