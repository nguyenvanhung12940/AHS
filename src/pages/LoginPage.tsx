import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, School } from 'lucide-react';
import { signInWithGoogle } from '../firebase';

export const LoginPage: React.FC = () => {
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      // Don't show error if user just closed the popup
      if (err.code === 'auth/popup-closed-by-user') {
        setIsLoggingIn(false);
        return;
      }
      setError('Đăng nhập thất bại. Vui lòng thử lại.');
      console.error('Login error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
            <School className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">KTX Thông minh</h1>
          <p className="text-slate-500 text-sm">Hệ thống Quản lý Sinh viên Nội trú</p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}
          
          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 border border-slate-200 rounded-lg transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            <img src="https://www.gstatic.com/firebase/builtjs/src/resources/google-logo.svg" alt="Google" className="w-5 h-5" />
            {isLoggingIn ? 'Đang đăng nhập...' : 'Đăng nhập với Google'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Sử dụng email của trường để đăng nhập vào hệ thống.
          </p>
        </div>
      </div>
    </div>
  );
};
