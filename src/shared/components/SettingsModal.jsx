import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/shared/lib/supabaseClient";
import { UserAvatar } from "@/shared/components/UserAvatar";

export function SettingsModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  // Profile data
  const [profileData, setProfileData] = useState({
    fullName: "",
    displayName: "",
    birthday: "",
    timezone: "",
    profilePictureUrl: ""
  });

  // Display preferences
  const [displayPrefs, setDisplayPrefs] = useState({
    dateFormat: "MM/DD/YYYY",
    currency: "USD",
    unitSystem: "imperial"
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    planReminders: false,
    productNews: true
  });

  // Password
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  // Load user settings on mount
  useEffect(() => {
    if (user && isOpen) {
      loadUserSettings();
    }
  }, [user, isOpen]);

  const loadUserSettings = async () => {
    try {
      // Load from user_settings table
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        // Load profile data
        if (data.profile_data) {
          setProfileData({
            fullName: data.profile_data.fullName || "",
            displayName: data.profile_data.displayName || "",
            birthday: data.profile_data.birthday || "",
            timezone: data.profile_data.timezone || "",
            profilePictureUrl: data.profile_data.profilePictureUrl || ""
          });
        }

        // Load display preferences
        if (data.display_preferences) {
          setDisplayPrefs({
            dateFormat: data.display_preferences.dateFormat || "MM/DD/YYYY",
            currency: data.display_preferences.currency || "USD",
            unitSystem: data.display_preferences.unitSystem || "imperial"
          });
        }

        // Load notification preferences
        if (data.notification_preferences) {
          setNotifications(data.notification_preferences);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (settingsType, data) => {
    setLoading(true);
    setMessage("");

    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let result;
      if (existing) {
        // Update existing settings
        result = await supabase
          .from('user_settings')
          .update({
            [settingsType]: data,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // Create new settings
        result = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            [settingsType]: data
          });
      }

      if (result.error) {
        throw result.error;
      }

      setMessage("Settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    await saveSettings('profile_data', profileData);
  };

  const handleUpdateDisplay = async (e) => {
    e.preventDefault();
    await saveSettings('display_preferences', displayPrefs);
  };

  const handleUpdateNotifications = async () => {
    await saveSettings('notification_preferences', notifications);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage("Passwords don't match.");
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setMessage("Password updated successfully!");
      setPasswordData({ newPassword: "", confirmPassword: "" });
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage("Please select an image file (JPG, PNG, or GIF)");
      return;
    }

    // Validate file size (800KB = 819200 bytes)
    if (file.size > 819200) {
      setMessage("Image must be less than 800KB");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage (no subfolder, just user-id-timestamp.ext)
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      // Update profile data with new URL
      const updatedProfileData = { ...profileData, profilePictureUrl: publicUrl };
      setProfileData(updatedProfileData);

      // Save to database
      await saveSettings('profile_data', updatedProfileData);
      setMessage("Profile picture updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "⚠️ WARNING: This will permanently delete your account and all data.\n\n" +
      "This includes:\n" +
      "• All vineyard plans\n" +
      "• All tasks and schedules\n" +
      "• All production data\n" +
      "• All field data and attachments\n\n" +
      "This action CANNOT be undone.\n\n" +
      "Type 'DELETE' in the next prompt to confirm."
    );

    if (!confirmed) return;

    const confirmText = window.prompt("Type DELETE to confirm account deletion:");
    if (confirmText !== "DELETE") {
      setMessage("Account deletion cancelled.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Delete user account (this will cascade delete related data via RLS)
      const { error } = await supabase.auth.admin.deleteUser(user.id);

      if (error) {
        // If admin API not available, use regular delete
        const { error: deleteError } = await supabase.rpc('delete_user');
        if (deleteError) throw deleteError;
      }

      setMessage("Account deleted successfully. Redirecting...");
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage(`Error: ${error.message}. Please contact support for assistance.`);
    } finally {
      setLoading(false);
    }
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
    }
  ];

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Settings Panel */}
      <div className="relative flex bg-white w-full max-w-5xl shadow-2xl animate-slideInRight ml-auto">
        <div className="flex w-full">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Settings</h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
                  aria-label="Close settings"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {menuSections.map((section) => (
                <div key={section.title} className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                    {section.title}
                  </h3>
                  <nav className="space-y-1">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                          activeSection === item.id
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </nav>
                </div>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {activeSection === "profile" && "Profile"}
                  {activeSection === "display" && "Display"}
                  {activeSection === "notifications" && "Notifications"}
                  {activeSection === "security" && "Security"}
                </h1>
              </div>

              {/* Content */}
              <div>
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
                  <form onSubmit={handleUpdateProfile} className="max-w-2xl space-y-6">
                    <div className="flex items-center gap-4 mb-8">
                      <UserAvatar size="w-20 h-20" textSize="text-2xl" />
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={loading}
                          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          {loading ? "Uploading..." : "Choose picture"}
                        </button>
                        <p className="text-xs text-gray-500 mt-1">JPG, GIF or PNG. Max size of 800K</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="How you'd like to be addressed"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        We'll address you by this name in the app and emails
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Contact support to change your email address
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Birthday
                      </label>
                      <input
                        type="date"
                        value={profileData.birthday}
                        onChange={(e) => setProfileData({ ...profileData, birthday: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Timezone
                      </label>
                      <select
                        value={profileData.timezone}
                        onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select timezone...</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-6 py-3 bg-orange-400 text-white rounded-lg hover:bg-orange-500 font-medium transition-colors disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Update Profile"}
                    </button>
                  </form>
                )}

                {/* Display Section */}
                {activeSection === "display" && (
                  <form onSubmit={handleUpdateDisplay} className="max-w-2xl space-y-6">
                    <p className="text-gray-600">Customize how your vineyard data is displayed.</p>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Date Format
                      </label>
                      <select
                        value={displayPrefs.dateFormat}
                        onChange={(e) => setDisplayPrefs({ ...displayPrefs, dateFormat: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Currency
                      </label>
                      <select
                        value={displayPrefs.currency}
                        onChange={(e) => setDisplayPrefs({ ...displayPrefs, currency: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="USD">USD - US Dollar ($)</option>
                        <option value="EUR">EUR - Euro (€)</option>
                        <option value="GBP">GBP - British Pound (£)</option>
                        <option value="CAD">CAD - Canadian Dollar ($)</option>
                        <option value="AUD">AUD - Australian Dollar ($)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Unit System
                      </label>
                      <select
                        value={displayPrefs.unitSystem}
                        onChange={(e) => setDisplayPrefs({ ...displayPrefs, unitSystem: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="imperial">Imperial (acres, feet, gallons)</option>
                        <option value="metric">Metric (hectares, meters, liters)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save Display Preferences"}
                    </button>
                  </form>
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
                            {key === 'emailUpdates' && 'Receive important account updates and notifications'}
                            {key === 'planReminders' && 'Get reminders to save and update your vineyard plans'}
                            {key === 'productNews' && 'Stay updated on new features and improvements'}
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            const newNotifications = { ...notifications, [key]: !value };
                            setNotifications(newNotifications);
                            await saveSettings('notification_preferences', newNotifications);
                          }}
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
                  <div className="max-w-2xl space-y-8">
                    {/* Email & Password Section */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900">Email & Password</h3>

                      {/* Email Display */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-700">{user?.email || ""}</span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                              Verified
                            </span>
                          </div>
                          <a
                            href={`mailto:support@trellisvineyard.com?subject=Email Change Request&body=Current email: ${user?.email}%0A%0APlease change my email to:%0A%0A`}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Edit email
                          </a>
                        </div>
                      </div>

                      {/* Google Connection (placeholder for future OAuth integration) */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span className="text-sm text-gray-700">Google</span>
                          </div>
                          <span className="text-sm text-gray-500">Not connected</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Connect your Google account for easier sign-in
                        </p>
                      </div>

                      {/* Create/Change Password */}
                      <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4 border-t border-gray-200">
                        <div>
                          <p className="text-sm text-gray-700 mb-4">
                            Create a password to enable password-based login
                          </p>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-2">
                                New Password
                              </label>
                              <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
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
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                minLength={6}
                                placeholder="Confirm new password"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
                              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {loading ? "Creating..." : "Create Password"}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>

                    {/* Customer Support Section */}
                    <div className="space-y-4 pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Customer Support</h3>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-700">
                          Grant temporary access to your account for customer support
                        </p>
                        <button
                          type="button"
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                          onClick={() => setMessage("Support access feature coming soon")}
                        >
                          Grant Access
                        </button>
                        <p className="text-xs text-gray-500">
                          Need help? <a href="mailto:support@trellisvineyard.com" className="text-blue-600 hover:text-blue-700">Create a support ticket</a>
                        </p>
                      </div>
                    </div>

                    {/* Account Data Section */}
                    <div className="space-y-4 pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Account Data</h3>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-700">
                          Permanently delete your account and all associated data
                        </p>
                        <button
                          type="button"
                          disabled={loading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleDeleteAccount}
                        >
                          {loading ? "Deleting..." : "Delete Account"}
                        </button>
                        <p className="text-xs text-gray-500">
                          Warning: This action is irreversible. All your vineyard plans, tasks, and data will be permanently deleted.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>,
    document.body
  );
}
