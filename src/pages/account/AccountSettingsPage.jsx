import { useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useSubscription } from "@/shared/hooks/useSubscription";
import { supabase } from "@/shared/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { DocLink } from '@/shared/components/DocLink';

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tier, status } = useSubscription();
  const [activeSection, setActiveSection] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    displayName: "",
    email: user?.email || "",
    birthday: "",
    timezone: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    planReminders: false,
    productNews: true
  });

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage("Passwords don't match.");
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
      setFormData({ ...formData, newPassword: "", confirmPassword: "" });
    }
    setLoading(false);
  };

  const menuSections = [
    {
      title: "Account",
      items: [
        { id: "profile", label: "Profile" },
        { id: "display", label: "Display" },
        { id: "notifications", label: "Notifications" },
        { id: "security", label: "Security" }
      ]
    },
    {
      title: "Vineyard",
      items: [
        { id: "general", label: "General" },
        { id: "preferences", label: "Preferences" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-8">
              {menuSections.map((section, idx) => (
                <div key={section.title}>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
                  </div>
                  <nav className="py-2">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full text-left px-6 py-2.5 text-sm transition-colors ${
                          activeSection === item.id
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </nav>
                  {idx < menuSections.length - 1 && <div className="border-b border-gray-200 my-2"></div>}
                </div>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-200">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {activeSection === "profile" && "Profile"}
                  {activeSection === "display" && "Display"}
                  {activeSection === "notifications" && "Notifications"}
                  {activeSection === "security" && "Security"}
                  {activeSection === "general" && "General"}
                  {activeSection === "preferences" && "Preferences"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your account settings and preferences. <DocLink docId="account/settings" />
                </p>
              </div>

              {/* Content */}
              <div className="px-8 py-6">
                {message && (
                  <div className={`mb-6 p-4 rounded-lg text-sm ${
                    message.includes("Error") || message.includes("don't match")
                      ? "bg-red-50 text-red-800 border border-red-200"
                      : "bg-green-50 text-green-800 border border-green-200"
                  }`}>
                    {message}
                  </div>
                )}

                {/* Profile Section */}
                {activeSection === "profile" && (
                  <div className="max-w-2xl space-y-6">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-20 h-20 rounded-full bg-vine-green-100 flex items-center justify-center">
                        <span className="text-2xl font-semibold text-vine-green-700">
                          {user?.email?.[0].toUpperCase() || 'U'}
                        </span>
                      </div>
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Choose picture
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Parker Willis"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Parker"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        We'll address you by this name in the app and emails
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Birthday
                      </label>
                      <input
                        type="date"
                        value={formData.birthday}
                        onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Timezone
                      </label>
                      <select
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      className="w-full px-6 py-3 bg-orange-400 text-white rounded-lg hover:bg-orange-500 font-medium transition-colors"
                    >
                      Update Profile
                    </button>
                  </div>
                )}

                {/* Display Section */}
                {activeSection === "display" && (
                  <div className="max-w-2xl space-y-6">
                    <p className="text-gray-600">Customize how your vineyard data is displayed.</p>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Date Format
                      </label>
                      <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>MM/DD/YYYY</option>
                        <option>DD/MM/YYYY</option>
                        <option>YYYY-MM-DD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Currency
                      </label>
                      <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>USD - US Dollar ($)</option>
                        <option>EUR - Euro (€)</option>
                        <option>GBP - British Pound (£)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Unit System
                      </label>
                      <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>Imperial (acres, feet, gallons)</option>
                        <option>Metric (hectares, meters, liters)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Notifications Section */}
                {activeSection === "notifications" && (
                  <div className="max-w-2xl space-y-6">
                    <p className="text-gray-600">Manage your notification preferences.</p>

                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0">
                        <div>
                          <p className="font-medium text-gray-900">
                            {key === 'emailUpdates' && 'Email Updates'}
                            {key === 'planReminders' && 'Plan Reminders'}
                            {key === 'productNews' && 'Product News'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {key === 'emailUpdates' && 'Receive important account updates'}
                            {key === 'planReminders' && 'Get reminders to save and update your plans'}
                            {key === 'productNews' && 'Stay updated on new features and improvements'}
                          </p>
                        </div>
                        <button
                          onClick={() => setNotifications({ ...notifications, [key]: !value })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            value ? 'bg-blue-600' : 'bg-gray-200'
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
                )}

                {/* Security Section */}
                {activeSection === "security" && (
                  <div className="max-w-2xl space-y-6">
                    <p className="text-gray-600">Update your password and security settings.</p>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Contact support to change your email address
                      </p>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          minLength={6}
                          placeholder="Enter new password"
                        />
                        <p className="text-sm text-gray-500 mt-2">Must be at least 6 characters</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          minLength={6}
                          placeholder="Confirm new password"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !formData.newPassword || !formData.confirmPassword}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? "Updating..." : "Update Password"}
                      </button>
                    </form>
                  </div>
                )}

                {/* General Section */}
                {activeSection === "general" && (
                  <div className="max-w-2xl space-y-6">
                    <p className="text-gray-600">General vineyard settings and preferences.</p>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Vineyard Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="My Vineyard"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Default Grape Variety
                      </label>
                      <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>Cabernet Sauvignon</option>
                        <option>Pinot Noir</option>
                        <option>Chardonnay</option>
                        <option>Merlot</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Preferences Section */}
                {activeSection === "preferences" && (
                  <div className="max-w-2xl space-y-6">
                    <p className="text-gray-600">Customize your experience.</p>

                    <div className="flex items-center justify-between py-4 border-b border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Auto-save plans</p>
                        <p className="text-sm text-gray-600 mt-1">Automatically save changes to your plans</p>
                      </div>
                      <button
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600"
                      >
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Show tips</p>
                        <p className="text-sm text-gray-600 mt-1">Display helpful tips throughout the app</p>
                      </div>
                      <button
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200"
                      >
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
