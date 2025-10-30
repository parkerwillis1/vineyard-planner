import React, { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Crown,
  Shield,
  User,
  CheckCircle2,
  XCircle,
  DollarSign,
  MapPin,
  Building2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
  listOrganizationMembers,
  createOrganizationMember,
  updateOrganizationMember,
  deleteOrganizationMember,
  getOrCreateOrganization,
  updateOrganization
} from '@/shared/lib/vineyardApi';

const ROLES = [
  {
    value: 'admin',
    label: 'Admin',
    icon: Crown,
    description: 'Full access - can manage team, view costs, and access all features',
    color: 'purple'
  },
  {
    value: 'manager',
    label: 'Manager',
    icon: Shield,
    description: 'Can manage operations, create tasks, and view reports',
    color: 'blue'
  },
  {
    value: 'member',
    label: 'Member',
    icon: User,
    description: 'Can view and complete assigned tasks',
    color: 'green'
  }
];

export function TeamManagement() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    // First, get or create organization
    const orgRes = await getOrCreateOrganization();

    if (orgRes.error) {
      console.error('Organization error:', orgRes.error);

      // Detect specific error types for better user guidance
      const errorMsg = orgRes.error.message;
      if (errorMsg.includes('infinite recursion') || errorMsg.includes('42P17')) {
        setError({
          type: 'rls_recursion',
          message: 'Database policy error detected (infinite recursion). This needs to be fixed in Supabase.'
        });
      } else if (errorMsg.includes('organizations') && errorMsg.includes('does not exist')) {
        setError({
          type: 'missing_table',
          message: 'The organizations table has not been set up yet in your database.'
        });
      } else {
        setError({
          type: 'generic',
          message: errorMsg
        });
      }

      setLoading(false);
      return;
    }

    if (orgRes.data) {
      setOrganization(orgRes.data);
      console.log('Organization loaded:', orgRes.data);
    }

    // Then load members
    const membersRes = await listOrganizationMembers();
    if (!membersRes.error && membersRes.data) {
      setMembers(membersRes.data);
    } else if (membersRes.error) {
      console.error('Members error:', membersRes.error);
    }

    setLoading(false);
  };

  const handleDeleteMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    const { error } = await deleteOrganizationMember(memberId);
    if (!error) {
      await loadData();
    } else {
      alert(`Error removing member: ${error.message}`);
    }
  };

  const getRoleConfig = (role) => {
    return ROLES.find(r => r.value === role) || ROLES[2];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-vine-green-600" />
            My Vineyard
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Your vineyard profile and team management
          </p>
        </div>
        {!error && organization && (
          <Button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Organization Header */}
      {!error && organization && (
        <Card className="border-2 border-gray-200">
          <CardContent className="px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              {/* Left side - Logo and Info */}
              <div className="flex items-center gap-8">
                {/* Logo/Avatar */}
                <div className="relative flex-shrink-0">
                  {organization.logo_url ? (
                    <img
                      src={organization.logo_url}
                      alt={organization.name}
                      className="h-24 w-auto max-w-xs object-contain"
                    />
                  ) : (
                    <div className="h-24 w-48 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-1" />
                        <div className="text-sm font-bold text-gray-500">
                          {organization.name?.substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Organization Details */}
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    {organization.name}
                  </h2>

                  {/* Contact grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {organization.email && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="w-4 h-4 flex-shrink-0 text-gray-400" />
                        <span className="text-sm truncate">{organization.email}</span>
                      </div>
                    )}
                    {organization.phone && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-4 h-4 flex-shrink-0 text-gray-400" />
                        <span className="text-sm">{organization.phone}</span>
                      </div>
                    )}
                    {(organization.city || organization.state) && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400" />
                        <span className="text-sm">
                          {[organization.city, organization.state].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side - Edit button */}
              <Button
                onClick={() => setEditingMember({ type: 'org', data: organization })}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Details
              </Button>
            </div>

            {/* Stats bar at bottom */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{members.length}</div>
                  <div className="text-xs text-gray-600 font-medium">Team Members</div>
                </div>
                <div className="w-px h-10 bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {members.filter(m => m.is_active).length}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Active</div>
                </div>
                <div className="w-px h-10 bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {new Date().getFullYear()}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Season</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-gray-500 font-medium mb-1">Established</div>
                <div className="text-sm text-gray-700">
                  {new Date(organization.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-2 border-red-300 bg-red-50">
          <CardContent className="py-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Setup Required</h3>
                <p className="text-sm text-red-800 mb-3">{error.message || error}</p>

                {error.type === 'rls_recursion' ? (
                  <div className="bg-white rounded-lg p-4 text-sm space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">🔧 Quick Fix - Run RLS Fix Script:</p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-700">
                        <li>Go to your <strong>Supabase Dashboard</strong></li>
                        <li>Click <strong>SQL Editor</strong> in the left sidebar</li>
                        <li>Click <strong>New Query</strong></li>
                        <li>Copy the contents of: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">supabase/migrations/009_fix_rls_recursion_complete.sql</code></li>
                        <li>Paste into the SQL Editor and click <strong>Run</strong></li>
                        <li>Refresh this page</li>
                      </ol>
                    </div>
                    <div className="border-t pt-3">
                      <p className="font-semibold text-gray-900 mb-2">📝 What this fixes:</p>
                      <p className="text-gray-700 text-xs">
                        The organization_members table had Row Level Security policies that referenced itself,
                        creating infinite recursion. The fix script uses security definer functions to bypass
                        RLS when checking membership, eliminating the circular dependency.
                      </p>
                    </div>
                  </div>
                ) : error.type === 'missing_table' ? (
                  <div className="bg-white rounded-lg p-4 text-sm">
                    <p className="font-semibold text-gray-900 mb-2">🚀 Initial Setup:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-700">
                      <li>Go to your <strong>Supabase Dashboard</strong></li>
                      <li>Click <strong>SQL Editor</strong> in the left sidebar</li>
                      <li>Click <strong>New Query</strong></li>
                      <li>Copy the contents of: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">supabase/migrations/008_add_organizations.sql</code></li>
                      <li>Paste into the SQL Editor and click <strong>Run</strong></li>
                      <li>Refresh this page</li>
                    </ol>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-4 text-sm">
                    <p className="font-semibold text-gray-900 mb-2">⚠️ Error Details:</p>
                    <p className="text-gray-700 text-xs">{error.message || error}</p>
                    <p className="text-gray-600 text-xs mt-2">
                      Check the browser console for more details.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members List */}
      {!error && loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading team...</p>
          </CardContent>
        </Card>
      ) : !error && members.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No team members yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Invite your first team member to get started
            </p>
            <Button
              onClick={() => setShowInviteModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </CardContent>
        </Card>
      ) : !error ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => {
            const roleConfig = getRoleConfig(member.role);
            const RoleIcon = roleConfig.icon;

            return (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  {/* Avatar & Name */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {member.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{member.full_name}</h3>
                        <p className="text-xs text-gray-500">{member.job_title || 'Team Member'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingMember({ type: 'member', data: member })}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-${roleConfig.color}-100 text-${roleConfig.color}-700 mb-3`}>
                    <RoleIcon className="w-3.5 h-3.5" />
                    {roleConfig.label}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    {member.hourly_rate && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span>${member.hourly_rate}/hour</span>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {member.is_active ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-green-700 font-medium">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-red-700 font-medium">Inactive</span>
                        </>
                      )}
                    </div>
                    {member.joined_at && (
                      <span className="text-gray-500">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      {/* Invite/Edit Modal */}
      {(showInviteModal || editingMember) && (
        <MemberModal
          member={editingMember?.data}
          isOrg={editingMember?.type === 'org'}
          onClose={() => {
            setShowInviteModal(false);
            setEditingMember(null);
          }}
          onSaved={loadData}
        />
      )}
    </div>
  );
}

// Member Invite/Edit Modal
function MemberModal({ member, isOrg, onClose, onSaved }) {
  const [formData, setFormData] = useState(
    member || {
      full_name: '',
      email: '',
      role: 'member',
      job_title: '',
      phone: '',
      hourly_rate: '',
      is_active: true,
      can_view_costs: false,
      can_manage_team: false,
      can_manage_blocks: false,
      can_manage_tasks: true,
      can_approve_tasks: false
    }
  );
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(member?.logo_url || null);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isOrg) {
      // Update organization
      setSaving(true);
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip
      };

      // If a new logo was uploaded, include it as base64
      if (logoFile) {
        updateData.logo_url = logoPreview;
      }

      const { error } = await updateOrganization(formData.id, updateData);

      if (error) {
        alert(`Error updating organization: ${error.message}`);
        setSaving(false);
      } else {
        onSaved();
        onClose();
      }
      return;
    }

    // Validate
    if (!formData.full_name.trim() || !formData.email.trim()) {
      alert('Please enter a name and email');
      return;
    }

    setSaving(true);

    // Update or create member
    const dataToSave = {
      ...formData,
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null
    };

    const { error } = member
      ? await updateOrganizationMember(member.id, dataToSave)
      : await createOrganizationMember(dataToSave);

    if (error) {
      alert(`Error ${member ? 'updating' : 'inviting'} member: ${error.message}`);
      setSaving(false);
    } else {
      onSaved();
      onClose();
    }
  };

  if (isOrg) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Edit Vineyard Details</h2>
            <p className="text-sm text-white/80 mt-1">Update your vineyard's information and branding</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Branding Section */}
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-600" />
                Branding
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vineyard Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your Vineyard Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Logo
                  </label>
                  <div className="flex items-start gap-4">
                    {/* Logo preview */}
                    {logoPreview && (
                      <div className="w-20 h-20 rounded-lg border-2 border-gray-200 overflow-hidden flex-shrink-0">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* File input */}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Upload your vineyard logo (JPG, PNG, or GIF)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="contact@vineyard.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">Location</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Vineyard Lane"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Napa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={formData.state || ''}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="CA"
                      maxLength="2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.zip || ''}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="94558"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">
            {member ? 'Edit Team Member' : 'Invite Team Member'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {ROLES.find(r => r.value === formData.role)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title</label>
              <input
                type="text"
                value={formData.job_title || ''}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Field Manager"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.hourly_rate || ''}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="25.00"
              />
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Permissions</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.can_view_costs}
                  onChange={(e) => setFormData({ ...formData, can_view_costs: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Can view costs and financial data</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.can_manage_team}
                  onChange={(e) => setFormData({ ...formData, can_manage_team: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Can manage team members</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.can_manage_blocks}
                  onChange={(e) => setFormData({ ...formData, can_manage_blocks: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Can manage vineyard blocks</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.can_manage_tasks}
                  onChange={(e) => setFormData({ ...formData, can_manage_tasks: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Can create and manage tasks</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.can_approve_tasks}
                  onChange={(e) => setFormData({ ...formData, can_approve_tasks: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Can approve and review tasks</span>
              </label>
            </div>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Active (can log in)</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? 'Saving...' : member ? 'Save Changes' : 'Send Invitation'}
            </Button>
            <Button type="button" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
