import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabaseClient.js';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user came from password reset email
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (type !== 'recovery') {
      setError('Invalid or expired reset link. Please request a new password reset.');
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setResetComplete(true);
    setLoading(false);

    // Redirect to sign in after 3 seconds
    setTimeout(() => {
      navigate('/signin');
    }, 3000);
  }

  if (resetComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-vine-green-50/40 to-white px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src="/VinePioneerLongV1.png"
              alt="Vine Pioneer"
              className="h-12 mx-auto mb-6"
            />
          </div>

          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Password reset successful</h1>
              <p className="text-gray-600 mb-6">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Redirecting to sign in...
              </p>
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                Go to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-vine-green-50/40 to-white px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/VinePioneerLongV1.png"
            alt="Vine Pioneer"
            className="h-12 mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create new password</h1>
          <p className="text-gray-600">Enter your new password below</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {error && (
            <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm new password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-vine-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-teal-500 hover:to-vine-green-500 shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting password…' : 'Reset password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/signin"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
