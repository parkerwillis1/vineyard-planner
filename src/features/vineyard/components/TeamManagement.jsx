import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Network,
  X,
  Grape
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { LoadingSpinner } from './LoadingSpinner';
import {
  listOrganizationMembers,
  createOrganizationMember,
  updateOrganizationMember,
  deleteOrganizationMember,
  getOrCreateOrganization,
  updateOrganization,
  sendMemberInvitation
} from '@/shared/lib/vineyardApi';
import { DocLink } from '@/shared/components/DocLink';

const ROLES = [
  {
    value: 'admin',
    label: 'Admin',
    icon: Crown,
    description: 'Full access - can manage team, view costs, and access all features',
    color: 'wine'
  },
  {
    value: 'manager',
    label: 'Manager',
    icon: Shield,
    description: 'Can manage operations, create tasks, and view reports',
    color: 'slate'
  },
  {
    value: 'member',
    label: 'Member',
    icon: User,
    description: 'Can view and complete assigned tasks',
    color: 'stone'
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
  const [viewingHierarchy, setViewingHierarchy] = useState(null);

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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-semibold text-gray-900">My Vineyard</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your vineyard organization and team members. <DocLink docId="operations/my-vineyard" /></p>
      </div>

      {/* Organization Header */}
      {!error && organization && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="px-6 py-6">
            <div className="flex items-start justify-between gap-4">
              {/* Left side - Logo and Info */}
              <div className="flex items-start gap-6 min-w-0">
                {/* Logo/Avatar */}
                <div className="flex-shrink-0">
                  {organization.logo_url ? (
                    <div className="h-20 w-auto max-w-[160px] rounded-lg overflow-hidden border border-gray-100">
                      <img
                        src={organization.logo_url}
                        alt={organization.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-center">
                      <Grape className="w-8 h-8 text-[#1C2739]" />
                    </div>
                  )}
                </div>

                {/* Organization Details */}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    {organization.name}
                  </h2>

                  {/* Contact info - simple inline list */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                    {organization.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{organization.email}</span>
                      </div>
                    )}
                    {organization.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{organization.phone}</span>
                      </div>
                    )}
                    {(organization.city || organization.state) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{[organization.city, organization.state].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side - Edit button */}
              <Button
                onClick={() => setEditingMember({ type: 'org', data: organization })}
                variant="outline"
                className="text-gray-700 border-gray-300 hover:bg-gray-50 whitespace-nowrap flex-shrink-0 !flex-row"
              >
                <span className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </span>
              </Button>
            </div>

            {/* Stats bar at bottom */}
            <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-8">
              <div>
                <div className="text-2xl font-semibold text-gray-900">{members.length}</div>
                <div className="text-xs text-gray-500 mt-0.5">Team Members</div>
              </div>
              <div className="w-px h-10 bg-gray-200"></div>
              <div>
                <div className="text-2xl font-semibold text-emerald-600">
                  {members.filter(m => m.is_active).length}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">Active</div>
              </div>
              <div className="w-px h-10 bg-gray-200"></div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">
                  {new Date().getFullYear()}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">Season</div>
              </div>
              <div className="ml-auto text-right text-sm text-gray-500">
                Est. {new Date(organization.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="bg-white border border-red-200">
          <CardContent className="py-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Setup Required</h3>
                <p className="text-sm text-gray-600 mb-3">{error.message || error}</p>

                {error.type === 'rls_recursion' ? (
                  <div className="bg-gray-50 rounded-lg p-4 text-sm border border-gray-200">
                    <p className="font-medium text-gray-900 mb-2">Quick Fix:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 text-xs">
                      <li>Go to your Supabase Dashboard</li>
                      <li>Click SQL Editor in the left sidebar</li>
                      <li>Run the contents of: <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 text-xs">supabase/migrations/009_fix_rls_recursion_complete.sql</code></li>
                      <li>Refresh this page</li>
                    </ol>
                  </div>
                ) : error.type === 'missing_table' ? (
                  <div className="bg-gray-50 rounded-lg p-4 text-sm border border-gray-200">
                    <p className="font-medium text-gray-900 mb-2">Initial Setup:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 text-xs">
                      <li>Go to your Supabase Dashboard</li>
                      <li>Click SQL Editor in the left sidebar</li>
                      <li>Run the contents of: <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 text-xs">supabase/migrations/008_add_organizations.sql</code></li>
                      <li>Refresh this page</li>
                    </ol>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border border-gray-200">
                    <p>{error.message || error}</p>
                    <p className="mt-1 text-gray-400">Check the browser console for more details.</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members Section */}
      {!error && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
            {organization && (
              <Button
                onClick={() => setShowInviteModal(true)}
                className="bg-[#1C2739] hover:bg-[#151d2b] text-white whitespace-nowrap !flex-row"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Invite Member
                </span>
              </Button>
            )}
          </div>

          {loading ? (
            <LoadingSpinner message="Loading team..." />
          ) : members.length === 0 ? (
            <Card className="bg-white border border-dashed border-gray-300">
              <CardContent className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-stone-400" />
                </div>
                <p className="text-gray-900 font-medium mb-1">No team members yet</p>
                <p className="text-sm text-gray-500 mb-4">
                  Invite your first team member to get started
                </p>
                <Button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-[#1C2739] hover:bg-[#151d2b] text-white whitespace-nowrap !flex-row"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Invite Member
                  </span>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => {
                const roleConfig = getRoleConfig(member.role);
                const RoleIcon = roleConfig.icon;

                return (
                  <Card
                    key={member.id}
                    className="bg-white border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <CardContent className="p-5">
                      {/* Avatar & Name */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-medium text-sm">
                            {member.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{member.full_name}</h3>
                            <p className="text-xs text-gray-500">{member.job_title || 'Team Member'}</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          <button
                            onClick={() => setViewingHierarchy(member)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="View reporting hierarchy"
                          >
                            <Network className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingMember({ type: 'member', data: member })}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Role Badge */}
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium mb-3 ${
                        roleConfig.value === 'admin'
                          ? 'bg-[#1C2739]/10 text-[#1C2739]'
                          : roleConfig.value === 'manager'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        <RoleIcon className="w-3 h-3" />
                        {roleConfig.label}
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        {member.hourly_rate && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                            <span>${member.hourly_rate}/hr</span>
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          {member.is_active ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span className="text-emerald-600">Active</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                              <span className="text-gray-500">Inactive</span>
                            </>
                          )}
                        </div>
                        {member.joined_at && (
                          <span className="text-gray-400">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

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

      {/* Hierarchy Modal */}
      {viewingHierarchy && (
        <HierarchyModal
          member={viewingHierarchy}
          allMembers={members}
          onClose={() => setViewingHierarchy(null)}
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
      manager_id: null,
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
  const [potentialManagers, setPotentialManagers] = useState([]);

  // Load potential managers (admins and managers only)
  useEffect(() => {
    const loadPotentialManagers = async () => {
      const { data: allMembers, error } = await listOrganizationMembers();
      if (!error && allMembers) {
        // Filter to only admins and managers, exclude current member being edited
        const managers = allMembers.filter(m =>
          (m.role === 'admin' || m.role === 'manager') &&
          m.is_active &&
          m.id !== member?.id
        );
        setPotentialManagers(managers);
      }
    };
    loadPotentialManagers();
  }, [member?.id]);

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
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      manager_id: formData.manager_id || null // Convert empty string to null
    };

    if (member) {
      // Update existing member
      const { error } = await updateOrganizationMember(member.id, dataToSave);
      if (error) {
        alert(`Error updating member: ${error.message}`);
        setSaving(false);
      } else {
        onSaved();
        onClose();
      }
    } else {
      // Create new member
      const { data: newMember, error: createError } = await createOrganizationMember(dataToSave);

      if (createError) {
        alert(`Error creating member: ${createError.message}`);
        setSaving(false);
        return;
      }

      // Send invitation email
      const { error: emailError } = await sendMemberInvitation(newMember.id);

      if (emailError) {
        console.error('Error sending invitation email:', emailError);

        // Development fallback: Show invitation link directly
        const appUrl = window.location.origin;
        const invitationUrl = `${appUrl}/accept-invitation?token=${newMember.invitation_token}`;

        // Copy to clipboard
        navigator.clipboard.writeText(invitationUrl).catch(() => {});

        alert(
          `Member created! Email service not configured yet.\n\n` +
          `Share this invitation link with ${newMember.email}:\n\n` +
          `${invitationUrl}\n\n` +
          `(Link copied to clipboard)\n\n` +
          `To enable automatic emails, see EMAIL_INVITATION_SETUP.md`
        );
      } else {
        alert(`Invitation sent to ${newMember.email}!`);
      }

      onSaved();
      onClose();
    }
  };

  if (isOrg) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Vineyard Details</h2>
              <p className="text-sm text-gray-500 mt-0.5">Update your vineyard's information</p>
            </div>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Branding Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Vineyard Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2739]/20 focus:border-[#1C2739] transition-colors"
                placeholder="Your Vineyard Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo</label>
              <div className="flex items-start gap-4">
                {logoPreview && (
                  <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 bg-gray-50">
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-colors"
                  />
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, or GIF</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2739]/20 focus:border-[#1C2739] transition-colors"
                  placeholder="contact@vineyard.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2739]/20 focus:border-[#1C2739] transition-colors"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2739]/20 focus:border-[#1C2739] transition-colors"
                placeholder="123 Vineyard Lane"
              />
            </div>

            <div className="grid grid-cols-6 gap-4">
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2739]/20 focus:border-[#1C2739] transition-colors"
                  placeholder="Napa"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2739]/20 focus:border-[#1C2739] transition-colors"
                  placeholder="CA"
                  maxLength="2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ZIP</label>
                <input
                  type="text"
                  value={formData.zip || ''}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2739]/20 focus:border-[#1C2739] transition-colors"
                  placeholder="94558"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button type="button" onClick={onClose} variant="outline" className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 bg-[#1C2739] hover:bg-[#151d2b] text-white">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {member ? 'Edit Team Member' : 'Invite Team Member'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2739]/20 focus:border-[#1C2739] transition-colors"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2739]/20 focus:border-[#1C2739] transition-colors"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2739]/20 focus:border-[#1C2739] transition-colors"
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title</label>
              <input
                type="text"
                value={formData.job_title || ''}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2739]/20 focus:border-[#1C2739] transition-colors"
                placeholder="Field Manager"
              />
            </div>
          </div>

          {/* Manager Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reports To</label>
            <select
              value={formData.manager_id || ''}
              onChange={(e) => setFormData({ ...formData, manager_id: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2739]/20 focus:border-[#1C2739] transition-colors"
            >
              <option value="">None (reports directly to owner)</option>
              {potentialManagers.map(mgr => (
                <option key={mgr.id} value={mgr.id}>
                  {mgr.full_name} ({mgr.role === 'admin' ? 'Admin' : 'Manager'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2739]/20 focus:border-[#1C2739] transition-colors"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Hourly Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate || ''}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2739]/20 focus:border-[#1C2739] transition-colors"
                  placeholder="25.00"
                />
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Permissions</h3>
            <div className="space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.can_view_costs}
                  onChange={(e) => setFormData({ ...formData, can_view_costs: e.target.checked })}
                  className="rounded border-gray-300 text-[#1C2739] focus:ring-[#1C2739]/20"
                />
                <span className="text-sm text-gray-700">Can view costs and financial data</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.can_manage_team}
                  onChange={(e) => setFormData({ ...formData, can_manage_team: e.target.checked })}
                  className="rounded border-gray-300 text-[#1C2739] focus:ring-[#1C2739]/20"
                />
                <span className="text-sm text-gray-700">Can manage team members</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.can_manage_blocks}
                  onChange={(e) => setFormData({ ...formData, can_manage_blocks: e.target.checked })}
                  className="rounded border-gray-300 text-[#1C2739] focus:ring-[#1C2739]/20"
                />
                <span className="text-sm text-gray-700">Can manage vineyard blocks</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.can_manage_tasks}
                  onChange={(e) => setFormData({ ...formData, can_manage_tasks: e.target.checked })}
                  className="rounded border-gray-300 text-[#1C2739] focus:ring-[#1C2739]/20"
                />
                <span className="text-sm text-gray-700">Can create and manage tasks</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.can_approve_tasks}
                  onChange={(e) => setFormData({ ...formData, can_approve_tasks: e.target.checked })}
                  className="rounded border-gray-300 text-[#1C2739] focus:ring-[#1C2739]/20"
                />
                <span className="text-sm text-gray-700">Can approve and review tasks</span>
              </label>
            </div>
          </div>

          {/* Active Status */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300 text-[#1C2739] focus:ring-[#1C2739]/20"
            />
            <span className="text-sm font-medium text-gray-900">Active (can log in)</span>
          </label>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-[#1C2739] hover:bg-[#151d2b] text-white">
              {saving ? 'Saving...' : member ? 'Save Changes' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Hierarchy Modal - Shows reporting structure
function HierarchyModal({ member, allMembers, onClose }) {
  // Find manager
  const manager = allMembers.find(m => m.id === member.manager_id);

  // Find direct reports
  const directReports = allMembers.filter(m => m.manager_id === member.id);

  // Find manager's manager (grandparent)
  const managersManager = manager ? allMembers.find(m => m.id === manager.manager_id) : null;

  // Find peers (people who report to the same manager)
  const peers = member.manager_id
    ? allMembers.filter(m => m.manager_id === member.manager_id && m.id !== member.id)
    : [];

  const getRoleConfig = (role) => {
    return ROLES.find(r => r.value === role) || ROLES[2];
  };

  const MemberCard = ({ person, isCurrent = false, showLine = false }) => {
    const roleConfig = getRoleConfig(person.role);
    const RoleIcon = roleConfig.icon;

    return (
      <div className="flex flex-col items-center">
        {/* Connecting line from above */}
        {showLine && (
          <div className="w-px h-6 bg-gray-300"></div>
        )}

        {/* Card */}
        <div className={`
          relative rounded-lg p-4 transition-all min-w-[200px] border
          ${isCurrent
            ? 'bg-[#1C2739]/5 border-[#1C2739] shadow-sm'
            : 'bg-white border-gray-200 hover:border-gray-300'
          }
        `}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
              isCurrent ? 'bg-[#1C2739] text-white' : 'bg-stone-100 text-stone-600'
            }`}>
              {person.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm truncate">{person.full_name}</h4>
              <p className="text-xs text-gray-500 truncate">
                {person.job_title || 'Team Member'}
              </p>
            </div>
          </div>
          <div className={`mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
            roleConfig.value === 'admin'
              ? 'bg-[#1C2739]/10 text-[#1C2739]'
              : roleConfig.value === 'manager'
              ? 'bg-slate-100 text-slate-700'
              : 'bg-stone-100 text-stone-600'
          }`}>
            <RoleIcon className="w-3 h-3" />
            {roleConfig.label}
          </div>

          {isCurrent && (
            <div className="absolute -top-2 -right-2 bg-[#1C2739] text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
              Selected
            </div>
          )}
        </div>
      </div>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Organization Hierarchy</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Reporting structure for {member.full_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Tree Structure */}
          <div className="flex flex-col items-center space-y-0">

            {/* Manager's Manager (Top of tree) */}
            {managersManager && (
              <div className="flex flex-col items-center">
                <MemberCard person={managersManager} />
              </div>
            )}

            {/* Direct Manager */}
            {manager ? (
              <MemberCard person={manager} showLine={!!managersManager} />
            ) : !managersManager && (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg px-4 py-3 mb-4">
                <p className="text-sm text-gray-500 text-center">
                  Reports directly to owner
                </p>
              </div>
            )}

            {/* Current Member (highlighted) */}
            <MemberCard person={member} isCurrent={true} showLine={!!manager} />

            {/* Direct Reports - branching structure */}
            {directReports.length > 0 && (
              <div className="flex flex-col items-center w-full">
                {/* Vertical line down */}
                <div className="w-px h-6 bg-gray-300"></div>

                {/* Horizontal branching line */}
                {directReports.length > 1 && (
                  <div className="relative w-full max-w-3xl h-px bg-gray-300"></div>
                )}

                {/* Direct Reports Grid */}
                <div className={`grid ${
                  directReports.length === 1
                    ? 'grid-cols-1'
                    : directReports.length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-3'
                } gap-4 mt-0 w-full max-w-3xl`}>
                  {directReports.map((report) => (
                    <div key={report.id} className="flex flex-col items-center">
                      {directReports.length > 1 && (
                        <div className="w-px h-6 bg-gray-300"></div>
                      )}
                      <MemberCard person={report} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Peers Section (if any) */}
          {peers.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-4 text-center">
                Peers ({peers.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {peers.map(peer => (
                  <div key={peer.id} className="flex justify-center">
                    <MemberCard person={peer} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-semibold text-gray-900">{manager ? 1 : 0}</div>
                <div className="text-xs text-gray-500 mt-0.5">Manager</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-900">{peers.length}</div>
                <div className="text-xs text-gray-500 mt-0.5">Peers</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-900">{directReports.length}</div>
                <div className="text-xs text-gray-500 mt-0.5">Direct Reports</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
