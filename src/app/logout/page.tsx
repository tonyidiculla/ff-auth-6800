'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear all auth-related data from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');

    // Redirect to login after 2 seconds
    const timeout = setTimeout(() => {
      router.push('/login');
    }, 2000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          {/* Logo and Title */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Image 
                src="/images/Furfield-icon.png" 
                alt="FURFIELD Logo" 
                width={64} 
                height={64}
              />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FURFIELD
            </h1>
            <p className="text-gray-600 mt-2">Healthcare Management System</p>
          </div>

          {/* Logout Message */}
          <div className="text-center py-8">
            <div className="mb-4">
              <svg 
                className="mx-auto h-16 w-16 text-green-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Logged Out Successfully
            </h2>
            <p className="text-gray-600">
              You have been securely logged out of all services.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to login page...
            </p>
          </div>

          {/* Manual Login Link */}
          <div className="text-center mt-6">
            <a
              href="/login"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Go to login now →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
