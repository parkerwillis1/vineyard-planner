import React, { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import {
  Archive,
  RotateCcw,
  Trash2,
  Beaker,
  Camera,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import {
  listArchivedHarvestSamples,
  restoreHarvestSample,
  permanentlyDeleteHarvestSample,
  listArchivedFieldAttachments,
  restoreFieldAttachment,
  permanentlyDeleteFieldAttachment,
  listArchivedTasks,
  restoreTask,
  permanentlyDeleteTask
} from '@/shared/lib/vineyardApi';

export function ArchivedItems() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    samples: true,
    photos: false,
    tasks: false
  });

  const [archivedItems, setArchivedItems] = useState({
    samples: [],
    photos: [],
    tasks: []
  });
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToRestore, setItemToRestore] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    if (user) {
      loadArchivedItems();
    }
  }, [user]);

  const loadArchivedItems = async () => {
    setLoading(true);

    // Fetch archived samples
    const { data: samples, error: samplesError } = await listArchivedHarvestSamples();
    if (!samplesError && samples) {
      setArchivedItems(prev => ({ ...prev, samples }));
    }

    // Fetch archived photos/attachments
    const { data: photos, error: photosError } = await listArchivedFieldAttachments();
    if (!photosError && photos) {
      setArchivedItems(prev => ({ ...prev, photos }));
    }

    // Fetch archived tasks
    const { data: tasks, error: tasksError } = await listArchivedTasks();
    if (!tasksError && tasks) {
      setArchivedItems(prev => ({ ...prev, tasks }));
    }

    setLoading(false);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleRestore = (itemType, itemId) => {
    setItemToRestore({ type: itemType, id: itemId });
    setShowRestoreConfirm(true);
  };

  const confirmRestore = async () => {
    if (!itemToRestore) return;

    let error;

    if (itemToRestore.type === 'samples') {
      const result = await restoreHarvestSample(itemToRestore.id);
      error = result.error;
    } else if (itemToRestore.type === 'photos') {
      const result = await restoreFieldAttachment(itemToRestore.id);
      error = result.error;
    } else if (itemToRestore.type === 'tasks') {
      const result = await restoreTask(itemToRestore.id);
      error = result.error;
    }

    if (error) {
      alert(`Error restoring item: ${error.message}`);
    } else {
      // Reload archived items
      await loadArchivedItems();
    }
    setItemToRestore(null);
  };

  const handlePermanentDelete = (itemType, itemId) => {
    setItemToDelete({ type: itemType, id: itemId });
    setShowDeleteConfirm(true);
  };

  const confirmPermanentDelete = async () => {
    if (!itemToDelete) return;

    let error;

    if (itemToDelete.type === 'samples') {
      const result = await permanentlyDeleteHarvestSample(itemToDelete.id);
      error = result.error;
    } else if (itemToDelete.type === 'photos') {
      const result = await permanentlyDeleteFieldAttachment(itemToDelete.id);
      error = result.error;
    } else if (itemToDelete.type === 'tasks') {
      const result = await permanentlyDeleteTask(itemToDelete.id);
      error = result.error;
    }

    if (error) {
      alert(`Error deleting item: ${error.message}`);
    } else {
      // Reload archived items
      await loadArchivedItems();
    }
    setItemToDelete(null);
  };

  const sections = [
    {
      id: 'samples',
      title: 'Field Samples',
      icon: Beaker,
      color: 'blue',
      items: archivedItems.samples
    },
    {
      id: 'photos',
      title: 'Photos',
      icon: Camera,
      color: 'purple',
      items: archivedItems.photos
    },
    {
      id: 'tasks',
      title: 'Tasks',
      icon: ClipboardList,
      color: 'indigo',
      items: archivedItems.tasks
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading archived items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mt-4">
            <Archive className="w-8 h-8 text-slate-600" />
            Archived Items
          </h1>
          <p className="text-gray-600 mt-2">
            View and manage archived field samples, photos, tasks, and more
          </p>
        </div>
      </div>

      {/* Archived Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSections[section.id];
          const itemCount = section.items.length;

          return (
            <Card key={section.id} className="overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <div className={`p-2 rounded-lg bg-${section.color}-100`}>
                    <Icon className={`w-5 h-5 text-${section.color}-600`} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                    <p className="text-sm text-gray-500">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'} archived
                    </p>
                  </div>
                </div>
                {itemCount > 0 && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${section.color}-100 text-${section.color}-700`}>
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Section Content */}
              {isExpanded && (
                <CardContent className="pt-0 pb-6">
                  {itemCount === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>No archived {section.title.toLowerCase()} yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {section.items.map((item) => {
                        // Determine the display name based on item type
                        let displayName = '';
                        let displaySubtext = '';

                        if (section.id === 'samples') {
                          displayName = `Sample from ${item.vineyard_blocks?.name || 'Unknown Field'}`;
                          displaySubtext = `Date: ${new Date(item.sample_date).toLocaleDateString()}`;
                          if (item.brix) displaySubtext += ` • Brix: ${item.brix.toFixed(1)}`;
                        } else if (section.id === 'photos') {
                          displayName = item.file_name || item.caption || 'Photo';
                          displaySubtext = item.description || '';
                        } else if (section.id === 'tasks') {
                          displayName = item.title || 'Task';
                          displaySubtext = item.description || '';
                        }

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{displayName}</h4>
                              {displaySubtext && (
                                <p className="text-sm text-gray-600 mt-1">{displaySubtext}</p>
                              )}
                              <p className="text-sm text-gray-500 mt-1">
                                Archived on {new Date(item.archived_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                onClick={() => handleRestore(section.id, item.id)}
                                variant="outline"
                                className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Restore
                              </Button>
                              <Button
                                onClick={() => handlePermanentDelete(section.id, item.id)}
                                variant="outline"
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRestoreConfirm}
        onClose={() => {
          setShowRestoreConfirm(false);
          setItemToRestore(null);
        }}
        onConfirm={confirmRestore}
        title="Restore Item"
        message="Restore this item? It will be moved back to its original location."
        confirmText="Restore"
        cancelText="Cancel"
        variant="default"
        icon={RotateCcw}
      />

      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmPermanentDelete}
        title="Permanently Delete"
        message="Permanently delete this item? This action cannot be undone."
        confirmText="Delete Forever"
        cancelText="Cancel"
        variant="danger"
        icon={Trash2}
      />
    </div>
  );
}
