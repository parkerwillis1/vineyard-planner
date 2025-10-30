import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, Trash2, Users } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { updateTask, deleteTask, updateTaskStatus, listTeamMembers } from '@/shared/lib/vineyardApi';

const TASK_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'needs_review', label: 'Needs Review' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'archived', label: 'Archived' }
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const TASK_TYPES = [
  { value: 'vine_ops', label: 'Vine Operations' },
  { value: 'spray_prep', label: 'Spray Prep' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'harvest_prep', label: 'Harvest Prep' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'admin', label: 'Admin' },
  { value: 'scouting', label: 'Scouting' },
  { value: 'pruning', label: 'Pruning' },
  { value: 'canopy_management', label: 'Canopy Management' },
  { value: 'weed_control', label: 'Weed Control' },
  { value: 'fertilization', label: 'Fertilization' },
  { value: 'other', label: 'Other' }
];

export function TaskDrawer({ task, blocks, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    const { data, error } = await listTeamMembers();
    if (!error && data) {
      setTeamMembers(data);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateTask(task.id, editedTask);
    if (!error) {
      setIsEditing(false);
      onUpdate();
    } else {
      alert(`Error updating task: ${error.message}`);
    }
    setSaving(false);
  };

  const handleStatusChange = async (newStatus) => {
    const { error } = await updateTaskStatus(task.id, newStatus);
    if (!error) {
      onUpdate();
    } else {
      alert(`Error updating status: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      const { error } = await deleteTask(task.id);
      if (!error) {
        onClose();
        onUpdate();
      } else {
        alert(`Error deleting task: ${error.message}`);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-end z-50">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl overflow-y-auto hide-scrollbar">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Task Details</h2>
            <p className="text-sm text-blue-100">
              {isEditing ? 'Editing task' : 'View task details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Quick Actions */}
          {!isEditing && (
            <div className="flex flex-wrap gap-2">
              {TASK_STATUSES.map(status => (
                <button
                  key={status.value}
                  onClick={() => handleStatusChange(status.value)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    task.status === status.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          )}

          {/* Edit/Save Buttons */}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedTask(task);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Task
                </Button>
                <Button
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </>
            )}
          </div>

          {/* Task Form */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTask.title}
                    onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 text-lg font-semibold">{task.title}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type
                  </label>
                  {isEditing ? (
                    <select
                      value={editedTask.type}
                      onChange={(e) => setEditedTask({ ...editedTask, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {TASK_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {TASK_TYPES.find(t => t.value === task.type)?.label || task.type}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority
                  </label>
                  {isEditing ? (
                    <select
                      value={editedTask.priority}
                      onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {PRIORITIES.map(priority => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900 capitalize">{task.priority}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedTask.start_date || ''}
                      onChange={(e) => setEditedTask({ ...editedTask, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{formatDate(task.start_date) || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Due Date
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedTask.due_date || ''}
                      onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{formatDate(task.due_date) || 'Not set'}</p>
                  )}
                </div>
              </div>

              {/* Assignees */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Assigned To
                </label>
                {isEditing ? (
                  <select
                    multiple
                    value={editedTask.assignees || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setEditedTask({ ...editedTask, assignees: selected });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  >
                    {teamMembers.filter(m => m.is_active).map(member => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.full_name} ({member.role})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    {task.assignees && task.assignees.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {task.assignees.map(assigneeId => {
                          const member = teamMembers.find(m => m.user_id === assigneeId);
                          return (
                            <span key={assigneeId} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                              {member ? member.full_name : 'Unknown'}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No one assigned</p>
                    )}
                  </div>
                )}
                {isEditing && (
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple people</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Instructions
                </label>
                {isEditing ? (
                  <textarea
                    value={editedTask.instructions || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, instructions: e.target.value })}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">{task.instructions || 'No instructions'}</p>
                )}
              </div>

              {task.safety_notes && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Safety Notes
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editedTask.safety_notes || ''}
                      onChange={(e) => setEditedTask({ ...editedTask, safety_notes: e.target.value })}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-orange-900 whitespace-pre-wrap">{task.safety_notes}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                {isEditing ? (
                  <textarea
                    value={editedTask.notes || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, notes: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">{task.notes || 'No notes'}</p>
                )}
              </div>

              {/* Cost Information */}
              {task.total_cost > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Cost Breakdown</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Labor Cost</p>
                      <p className="font-semibold text-gray-900">${task.labor_cost?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Materials Cost</p>
                      <p className="font-semibold text-gray-900">${task.materials_cost?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Equipment Cost</p>
                      <p className="font-semibold text-gray-900">${task.equipment_cost?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Cost</p>
                      <p className="font-bold text-blue-600 text-lg">${task.total_cost?.toLocaleString() || '0'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-4 border-t border-gray-200 text-sm text-gray-600">
                <p>Created: {new Date(task.created_at).toLocaleString()}</p>
                {task.completed_at && (
                  <p>Completed: {new Date(task.completed_at).toLocaleString()}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
