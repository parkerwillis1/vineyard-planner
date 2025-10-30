import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/auth/AuthContext';
import {
  Plus,
  ListTodo,
  LayoutGrid,
  Filter,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  Pause,
  Archive,
  Ban,
  Loader,
  TrendingUp,
  GripVertical,
  X,
  Users,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
  listTasks,
  getTaskStatistics,
  listSeasons,
  listVineyardBlocks,
  updateTaskStatus,
  createTask
} from '@/shared/lib/vineyardApi';
import { TaskDrawer } from './TaskDrawer';

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

const TASK_STATUSES = [
  { value: 'draft', label: 'Draft', icon: Circle, color: 'gray' },
  { value: 'scheduled', label: 'Scheduled', icon: Calendar, color: 'blue' },
  { value: 'in_progress', label: 'In Progress', icon: Loader, color: 'yellow' },
  { value: 'needs_review', label: 'Needs Review', icon: AlertCircle, color: 'orange' },
  { value: 'done', label: 'Done', icon: CheckCircle2, color: 'green' },
  { value: 'blocked', label: 'Blocked', icon: Ban, color: 'red' },
  { value: 'archived', label: 'Archived', icon: Archive, color: 'gray' }
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'normal', label: 'Normal', color: 'blue' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'urgent', label: 'Urgent', color: 'red' }
];

export function TaskManagement() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [blocks, setBlocks] = useState([]);

  // Drag and drop state
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    seasonId: null,
    status: '',
    type: '',
    priority: '',
    blockId: '',
    search: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [tasksRes, statsRes, seasonsRes, blocksRes] = await Promise.all([
      listTasks(),
      getTaskStatistics(),
      listSeasons(),
      listVineyardBlocks()
    ]);

    if (!tasksRes.error && tasksRes.data) {
      setTasks(tasksRes.data);
    }
    if (!statsRes.error && statsRes.data) {
      setStatistics(statsRes.data);
    }
    if (!seasonsRes.error && seasonsRes.data) {
      setSeasons(seasonsRes.data);
    }
    if (!blocksRes.error && blocksRes.data) {
      setBlocks(blocksRes.data);
    }
    setLoading(false);
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filters.status && task.status !== filters.status) return false;
      if (filters.type && task.type !== filters.type) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.seasonId && task.season_id !== filters.seasonId) return false;
      if (filters.blockId && !task.blocks?.includes(filters.blockId)) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (
          task.title?.toLowerCase().includes(search) ||
          task.instructions?.toLowerCase().includes(search) ||
          task.notes?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [tasks, filters]);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskDrawer(true);
  };

  const handleTaskUpdate = async () => {
    await loadData();
  };

  const getStatusConfig = (status) => {
    return TASK_STATUSES.find(s => s.value === status) || TASK_STATUSES[0];
  };

  const getPriorityColor = (priority) => {
    return PRIORITIES.find(p => p.value === priority)?.color || 'gray';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isOverdue = (task) => {
    if (!task.due_date || task.status === 'done' || task.status === 'archived') return false;
    return new Date(task.due_date) < new Date();
  };

  // Drag and drop handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (status) => {
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    // Optimistically update UI
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === draggedTask.id ? { ...t, status: newStatus } : t
      )
    );

    // Update in database
    const { error } = await updateTaskStatus(draggedTask.id, newStatus);
    if (error) {
      alert(`Error updating task: ${error.message}`);
      // Revert on error
      await loadData();
    } else {
      // Reload to get fresh statistics
      await loadData();
    }

    setDraggedTask(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <p className="text-sm text-gray-600 mt-1">
            Plan, assign, and track all vineyard work
          </p>
        </div>
        <div className="flex gap-3">
          {/* View Toggle */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-1 flex gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </button>
          </div>

          <Button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                </div>
                <ListTodo className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{statistics.overdue}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Due This Week</p>
                  <p className="text-2xl font-bold text-orange-600">{statistics.dueThisWeek}</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Cost</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${statistics.totalCost.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
              <select
                value={filters.seasonId || ''}
                onChange={(e) => setFilters({ ...filters, seasonId: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Seasons</option>
                {seasons.map(season => (
                  <option key={season.id} value={season.id}>{season.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {TASK_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {TASK_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                {PRIORITIES.map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search tasks..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Display */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading tasks...</p>
          </CardContent>
        </Card>
      ) : filteredTasks.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="py-12 text-center">
            <ListTodo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No tasks found</p>
            <p className="text-sm text-gray-500">
              {filters.status || filters.type || filters.search
                ? 'Try adjusting your filters'
                : 'Create your first task to get started'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const statusConfig = getStatusConfig(task.status);
            const StatusIcon = statusConfig.icon;
            const priorityColor = getPriorityColor(task.priority);
            const overdue = isOverdue(task);

            return (
              <Card
                key={task.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusIcon className={`w-5 h-5 text-${statusConfig.color}-600`} />
                        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                        {overdue && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                            OVERDUE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 ml-8">
                        <span className={`px-2 py-1 bg-${statusConfig.color}-100 text-${statusConfig.color}-700 text-xs font-medium rounded`}>
                          {statusConfig.label}
                        </span>
                        <span className={`px-2 py-1 bg-${priorityColor}-100 text-${priorityColor}-700 text-xs font-medium rounded`}>
                          {task.priority}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {formatDate(task.due_date) || 'No date'}
                        </span>
                        {task.blocks && task.blocks.length > 0 && (
                          <span>
                            {task.blocks.length} field{task.blocks.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {task.instructions && (
                        <p className="text-sm text-gray-600 mt-2 ml-8 line-clamp-2">
                          {task.instructions}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskClick(task);
                        }}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                        title="Edit task"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this task?')) {
                            // TODO: Add delete handler
                            console.log('Delete task:', task.id);
                          }
                        }}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {task.total_cost > 0 && (
                      <div className="text-right ml-4">
                        <p className="text-sm text-gray-600">Cost</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${task.total_cost.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Kanban View with Drag & Drop */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {TASK_STATUSES.filter(s => s.value !== 'archived').map(statusConfig => {
            const StatusIcon = statusConfig.icon;
            const statusTasks = filteredTasks.filter(t => t.status === statusConfig.value);
            const isDropTarget = dragOverColumn === statusConfig.value;

            return (
              <div
                key={statusConfig.value}
                className={`flex-shrink-0 w-[320px] bg-gray-50 rounded-lg transition-all ${
                  isDropTarget ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(statusConfig.value)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, statusConfig.value)}
              >
                {/* Column Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-lg p-4 z-10">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-5 h-5 text-${statusConfig.color}-600`} />
                    <h3 className="font-semibold text-gray-900">{statusConfig.label}</h3>
                    <span className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${
                      statusTasks.length > 0
                        ? `bg-${statusConfig.color}-100 text-${statusConfig.color}-700`
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {statusTasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Content */}
                <div className="p-3 space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {statusTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      {draggedTask && draggedTask.status !== statusConfig.value ? (
                        <p>Drop here to move to {statusConfig.label}</p>
                      ) : (
                        <p>No tasks</p>
                      )}
                    </div>
                  ) : (
                    statusTasks.map(task => {
                      const priorityColor = getPriorityColor(task.priority);
                      const overdue = isOverdue(task);
                      const isDragging = draggedTask?.id === task.id;

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          className={`group cursor-move ${isDragging ? 'opacity-50' : ''}`}
                        >
                          <Card
                            className="hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200"
                            onClick={() => handleTaskClick(task)}
                          >
                            <CardContent className="pt-4 pb-3 px-3">
                              {/* Drag Handle */}
                              <div className="flex items-start gap-2 mb-2">
                                <GripVertical className="w-4 h-4 text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                <h4 className="font-semibold text-gray-900 text-sm leading-tight flex-1">
                                  {task.title}
                                </h4>
                              </div>

                              {/* Task Info */}
                              <div className="space-y-2 ml-6">
                                {/* Priority & Overdue */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2 py-0.5 bg-${priorityColor}-100 text-${priorityColor}-700 text-xs font-medium rounded`}>
                                    {task.priority}
                                  </span>
                                  {overdue && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                      OVERDUE
                                    </span>
                                  )}
                                </div>

                                {/* Due Date */}
                                {task.due_date && (
                                  <p className={`text-xs flex items-center gap-1 ${
                                    overdue ? 'text-red-600 font-semibold' : 'text-gray-600'
                                  }`}>
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(task.due_date)}
                                  </p>
                                )}

                                {/* Fields */}
                                {task.blocks && task.blocks.length > 0 && (
                                  <p className="text-xs text-gray-600">
                                    {task.blocks.length} field{task.blocks.length !== 1 ? 's' : ''}
                                  </p>
                                )}

                                {/* Cost */}
                                {task.total_cost > 0 && (
                                  <p className="text-xs font-bold text-green-700">
                                    ${task.total_cost.toLocaleString()}
                                  </p>
                                )}

                                {/* Type Badge */}
                                <div className="pt-1 border-t border-gray-100">
                                  <span className="text-xs text-gray-500">
                                    {TASK_TYPES.find(t => t.value === task.type)?.label || task.type}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Drawer */}
      {showTaskDrawer && selectedTask && (
        <TaskDrawer
          task={selectedTask}
          blocks={blocks}
          onClose={() => {
            setShowTaskDrawer(false);
            setSelectedTask(null);
          }}
          onUpdate={handleTaskUpdate}
        />
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <NewTaskModal
          seasons={seasons}
          blocks={blocks}
          onClose={() => setShowNewTaskModal(false)}
          onCreated={handleTaskUpdate}
        />
      )}
    </div>
  );
}

// New Task Modal Component
function NewTaskModal({ seasons, blocks, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'vine_ops',
    status: 'scheduled',
    priority: 'normal',
    season_id: seasons[0]?.id || null,
    blocks: [],
    assignees: [],
    start_date: '',
    due_date: '',
    instructions: '',
    safety_notes: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    const { listTeamMembers } = await import('@/shared/lib/vineyardApi');
    const { data, error } = await listTeamMembers();
    if (!error && data) {
      setTeamMembers(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    setSaving(true);

    // Clean up the data - convert empty strings to null for dates
    const cleanedData = {
      ...formData,
      start_date: formData.start_date || null,
      due_date: formData.due_date || null,
      season_id: formData.season_id || null
    };

    const { error } = await createTask(cleanedData);

    if (error) {
      alert(`Error creating task: ${error.message}`);
      setSaving(false);
    } else {
      onCreated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white">Create New Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Prune North Block"
              autoFocus
            />
          </div>

          {/* Type, Status, Priority */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TASK_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TASK_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRIORITIES.map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Season */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Season</label>
            <select
              value={formData.season_id || ''}
              onChange={(e) => setFormData({ ...formData, season_id: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Season</option>
              {seasons.map(season => (
                <option key={season.id} value={season.id}>{season.name}</option>
              ))}
            </select>
          </div>

          {/* Fields */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fields (select multiple)
            </label>
            <select
              multiple
              value={formData.blocks}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFormData({ ...formData, blocks: selected });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            >
              {blocks.map(block => (
                <option key={block.id} value={block.id}>
                  {block.name} ({block.acres} acres)
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple fields</p>
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Assign To (select multiple)
            </label>
            <select
              multiple
              value={formData.assignees}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFormData({ ...formData, assignees: selected });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            >
              {teamMembers.filter(m => m.is_active).map(member => (
                <option key={member.user_id} value={member.user_id}>
                  {member.full_name} - {member.role}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {teamMembers.length === 0
                ? 'No team members yet. Add team members in settings.'
                : 'Hold Ctrl/Cmd to select multiple people'}
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Instructions</label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What needs to be done?"
            />
          </div>

          {/* Safety Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Safety Notes</label>
            <textarea
              value={formData.safety_notes}
              onChange={(e) => setFormData({ ...formData, safety_notes: e.target.value })}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any safety considerations?"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? 'Creating...' : 'Create Task'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
