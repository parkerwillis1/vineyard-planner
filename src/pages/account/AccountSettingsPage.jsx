import { useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/shared/lib/supabaseClient";

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

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

  const handleDeleteAccount = async () => {
    // TODO: Implement account deletion logic
    setMessage("Account deletion not yet implemented");
    setShowDeleteConfirm(false);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes("Error") ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
          {message}
        </div>
      )}

      {/* Account Information */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vine-green-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading || formData.email === user?.email}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Email"}
          </button>
        </form>
      </section>

      {/* Change Password */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>
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
            />
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
            />
          </div>
          <button
            type="submit"
            disabled={loading || !formData.newPassword || !formData.confirmPassword}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Change Password"}
          </button>
        </form>
      </section>

      {/* Danger Zone */}
      <section className="bg-red-50 rounded-lg border border-red-200 p-6">
        <h2 className="text-xl font-semibold text-red-900 mb-4">Danger Zone</h2>
        <p className="text-sm text-red-700 mb-4">
          Once you delete your account, there is no going back. All your plans and data will be permanently deleted.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Delete Account
        </button>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Account?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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