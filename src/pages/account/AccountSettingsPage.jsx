import { useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useSubscription } from "@/shared/hooks/useSubscription";
import { useUsageLimits } from "@/shared/hooks/useUsageLimits";
import { supabase } from "@/shared/lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, CreditCard, Bell, LogOut, Trash2, CheckCircle } from "lucide-react";
import { PRICING_TIERS } from "@/shared/config/pricing";

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tier, status } = useSubscription();
  const { usage, limits } = useUsageLimits();
  const [activeSection, setActiveSection] = useState("account");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    planReminders: false,
    productNews: true
  });

  const currentTier = PRICING_TIERS[tier] || PRICING_TIERS.free;

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      email: formData.email
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Check your new email for a confirmation link.");
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage("New passwords don't match.");
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: formData.newPassword
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Password updated successfully.");
      setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" });
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/signin');
  };

  const handleDeleteAccount = async () => {
    // TODO: Implement account deletion logic
    setMessage("Account deletion not yet implemented");
    setShowDeleteConfirm(false);
  };

  const sections = [
    { id: "account", label: "Account", icon: User },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.includes("Error") ? "bg-red-50 text-red-800 border border-red-200" : "bg-green-50 text-green-800 border border-green-200"}`}>
          {!message.includes("Error") && <CheckCircle className="w-5 h-5" />}
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? "bg-vine-green-50 text-vine-green-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {section.label}
                </button>
              );
            })}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-4 border-t pt-4"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Account Section */}
          {activeSection === "account" && (
            <>
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-vine-green-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-vine-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
                    <p className="text-sm text-gray-600">Update your email address</p>
                  </div>
                </div>
                <form onSubmit={handleUpdateEmail} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vine-green-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      You'll receive a confirmation email to verify your new address
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account ID
                    </label>
                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-mono">
                      {user?.id.substring(0, 24)}...
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || formData.email === user?.email}
                    className="px-6 py-2 bg-vine-green-600 text-white rounded-lg hover:bg-vine-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Updating..." : "Update Email"}
                  </button>
                </form>
              </section>
            </>
          )}

          {/* Subscription Section */}
          {activeSection === "subscription" && (
            <>
              <section className="bg-gradient-to-br from-vine-green-50 to-white rounded-lg shadow-sm border border-vine-green-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-vine-green-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-vine-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
                      <p className="text-sm text-gray-600">Manage your subscription</p>
                    </div>
                  </div>
                  <Link
                    to="/pricing"
                    className="px-4 py-2 bg-vine-green-600 text-white rounded-lg hover:bg-vine-green-700 text-sm font-medium transition-colors"
                  >
                    Upgrade Plan
                  </Link>
                </div>

                <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
                  <div className="flex items-baseline gap-3 mb-4">
                    <h3 className="text-3xl font-bold text-gray-900">{currentTier.name}</h3>
                    <div className="text-2xl font-semibold text-vine-green-600">
                      ${currentTier.price}
                      <span className="text-sm text-gray-600 font-normal">/{currentTier.billingPeriod}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {currentTier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-vine-green-500" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Status: <span className="font-medium text-gray-900">{status === 'active' ? 'Active' : status}</span>
                    </p>
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage This Month</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Vineyard Plans</span>
                        <span className="font-medium text-gray-900">
                          {usage.plansCount} / {limits.plans === -1 ? '∞' : limits.plans}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-vine-green-500 h-2 rounded-full transition-all"
                          style={{ width: limits.plans === -1 ? '10%' : `${Math.min((usage.plansCount / limits.plans) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {limits.pdfExportsPerMonth > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">PDF Exports</span>
                          <span className="font-medium text-gray-900">
                            {usage.pdfExportsThisMonth} / {limits.pdfExportsPerMonth === -1 ? '∞' : limits.pdfExportsPerMonth}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: limits.pdfExportsPerMonth === -1 ? '10%' : `${Math.min((usage.pdfExportsThisMonth / limits.pdfExportsPerMonth) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Security Section */}
          {activeSection === "security" && (
            <>
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Security</h2>
                    <p className="text-sm text-gray-600">Manage your password and security settings</p>
                  </div>
                </div>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vine-green-500 focus:border-transparent"
                      minLength={6}
                      placeholder="Enter new password"
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vine-green-500 focus:border-transparent"
                      minLength={6}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !formData.newPassword || !formData.confirmPassword}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </section>

              {/* Danger Zone */}
              <section className="bg-red-50 rounded-lg border border-red-200 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-red-900 mb-2">Delete Account</h2>
                    <p className="text-sm text-red-700 mb-4">
                      Once you delete your account, there is no going back. All your plans and data will be permanently deleted.
                    </p>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Notifications Section */}
          {activeSection === "notifications" && (
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Bell className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
                  <p className="text-sm text-gray-600">Manage how you receive updates</p>
                </div>
              </div>
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">
                        {key === 'emailUpdates' && 'Email Updates'}
                        {key === 'planReminders' && 'Plan Reminders'}
                        {key === 'productNews' && 'Product News'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {key === 'emailUpdates' && 'Receive important account updates'}
                        {key === 'planReminders' && 'Get reminders to save and update your plans'}
                        {key === 'productNews' && 'Stay updated on new features and improvements'}
                      </p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [key]: !value })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        value ? 'bg-vine-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account?</h3>
                <p className="text-gray-600">
                  Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
