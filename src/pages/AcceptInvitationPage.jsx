import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader, UserPlus, Mail, Building2 } from 'lucide-react';
import { supabase } from '@/shared/lib/supabaseClient';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';

export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Signup form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setError('Invalid invitation link - missing token');
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    setLoading(true);
    setError(null);

    try {
      // Look up invitation by token
      const { data, error: fetchError } = await supabase
        .from('organization_members')
        .select('*, organization:organizations(name, logo_url)')
        .eq('invitation_token', token)
        .single();

      if (fetchError || !data) {
        setError('Invitation not found or has expired');
        setLoading(false);
        return;
      }

      // Check if already accepted
      if (data.invitation_accepted_at) {
        setError('This invitation has already been accepted');
        setLoading(false);
        return;
      }

      // Check if expired
      const expiresAt = new Date(data.invitation_expires_at);
      if (expiresAt < new Date()) {
        setError('This invitation has expired');
        setLoading(false);
        return;
      }

      setInvitation(data);
      setEmail(data.email); // Pre-fill email
      setLoading(false);
    } catch (err) {
      console.error('Error verifying invitation:', err);
      setError(err.message || 'Failed to verify invitation');
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (e) => {
    e.preventDefault();

    // Validate
    if (!password || password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setAccepting(true);

    try {
      // Create user account with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: invitation.full_name,
          }
        }
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Update invitation record to mark as accepted
      const { error: updateError } = await supabase
        .from('organization_members')
        .update({
          invitation_accepted_at: new Date().toISOString(),
          user_id: authData.user.id,
          joined_at: new Date().toISOString()
        })
        .eq('invitation_token', token);

      if (updateError) {
        console.error('Error updating invitation:', updateError);
        // Don't throw - the account was created successfully
      }

      setSuccess(true);

      // Redirect to app after a delay
      setTimeout(() => {
        navigate('/vineyard');
      }, 2000);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      alert(`Error: ${err.message}`);
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Verifying invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-red-300">
          <CardContent className="py-12">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Invitation Invalid
            </h2>
            <p className="text-gray-600 text-center mb-6">{error}</p>
            <div className="flex justify-center">
              <Button
                onClick={() => navigate('/signin')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Go to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-green-300">
          <CardContent className="py-12">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Welcome Aboard!
            </h2>
            <p className="text-gray-600 text-center mb-2">
              Your account has been created successfully.
            </p>
            <p className="text-sm text-gray-500 text-center">
              Redirecting you to the app...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-emerald-500 mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Accept Invitation
            </h1>
            <p className="text-gray-600 text-sm">
              You're invited to join {invitation.organization?.name || 'the team'}
            </p>
          </div>

          {/* Invitation Details */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6 border border-purple-200">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {invitation.organization?.name || 'Organization'}
                </p>
                <p className="text-xs text-gray-600">
                  Role: <span className="font-medium">{invitation.role}</span>
                </p>
                {invitation.job_title && (
                  <p className="text-xs text-gray-600">
                    Position: <span className="font-medium">{invitation.job_title}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Create Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a secure password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 6 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={accepting}
                className="w-full bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 text-white py-3"
              >
                {accepting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Accept & Create Account
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Expiration Notice */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              This invitation expires on{' '}
              <span className="font-medium text-gray-700">
                {new Date(invitation.invitation_expires_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
