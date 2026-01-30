import { useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/shared/lib/supabaseClient";

export function SettingsView({ onClose }) {
  const { user } = useAuth();
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
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            ← Back
          </button>
        )}
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-6">
            {menuSections.map((section, idx) => (
              <div key={section.title}>
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{section.title}</h3>
                </div>
                <nav className="py-1">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        activeSection === item.id
                          ? "bg-teal-50 text-teal-700 font-medium border-l-2 border-teal-600"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
                {idx < menuSections.length - 1 && <div className="border-b border-gray-100"></div>}
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-lg border border-gray-200">
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {activeSection === "profile" && "Profile"}
                {activeSection === "display" && "Display"}
                {activeSection === "notifications" && "Notifications"}
                {activeSection === "security" && "Security"}
                {activeSection === "general" && "General"}
                {activeSection === "preferences" && "Preferences"}
              </h2>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {message && (
                <div className={`mb-6 p-3 rounded-lg text-sm ${
                  message.includes("Error") || message.includes("don't match")
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : "bg-green-50 text-green-800 border border-green-200"
                }`}>
                  {message}
                </div>
              )}

              {/* Profile Section */}
              {activeSection === "profile" && (
                <div className="max-w-lg space-y-5">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                      <span className="text-xl font-semibold text-white">
                        {user?.email?.[0].toUpperCase() || 'U'}
                      </span>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Choose picture
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Name</label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="How you'd like to be called"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">We'll address you by this name in the app</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Birthday</label>
                    <input
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
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
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg hover:from-teal-600 hover:to-emerald-600 font-medium text-sm transition-all"
                  >
                    Update Profile
                  </button>
                </div>
              )}

              {/* Display Section */}
              {activeSection === "display" && (
                <div className="max-w-lg space-y-5">
                  <p className="text-sm text-gray-600 mb-4">Customize how your data is displayed.</p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Date Format</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm">
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm">
                      <option>USD - US Dollar ($)</option>
                      <option>EUR - Euro (€)</option>
                      <option>GBP - British Pound (£)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit System</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm">
                      <option>Imperial (acres, feet, gallons)</option>
                      <option>Metric (hectares, meters, liters)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === "notifications" && (
                <div className="max-w-lg space-y-4">
                  <p className="text-sm text-gray-600 mb-4">Manage your notification preferences.</p>

                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {key === 'emailUpdates' && 'Email Updates'}
                          {key === 'planReminders' && 'Plan Reminders'}
                          {key === 'productNews' && 'Product News'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {key === 'emailUpdates' && 'Receive important account updates'}
                          {key === 'planReminders' && 'Get reminders to save and update your plans'}
                          {key === 'productNews' && 'Stay updated on new features'}
                        </p>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, [key]: !value })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          value ? 'bg-teal-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            value ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Security Section */}
              {activeSection === "security" && (
                <div className="max-w-lg space-y-5">
                  <p className="text-sm text-gray-600 mb-4">Update your password and security settings.</p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">Contact support to change your email</p>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                      <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        minLength={6}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        minLength={6}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !formData.newPassword || !formData.confirmPassword}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    >
                      {loading ? "Updating..." : "Update Password"}
                    </button>
                  </form>
                </div>
              )}

              {/* General Section */}
              {activeSection === "general" && (
                <div className="max-w-lg space-y-5">
                  <p className="text-sm text-gray-600 mb-4">General vineyard settings.</p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Vineyard Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="My Vineyard"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Grape Variety</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm">
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
                <div className="max-w-lg space-y-4">
                  <p className="text-sm text-gray-600 mb-4">Customize your experience.</p>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Auto-save plans</p>
                      <p className="text-xs text-gray-500 mt-0.5">Automatically save changes</p>
                    </div>
                    <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-teal-600">
                      <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white translate-x-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Show tips</p>
                      <p className="text-xs text-gray-500 mt-0.5">Display helpful tips</p>
                    </div>
                    <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-200">
                      <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white translate-x-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
