import React, { useState, useEffect } from 'react';
import { Camera, Upload, X, Download, Trash2, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { SkeletonGrid } from '@/shared/components/ui/skeleton';
import { supabase } from '@/shared/lib/supabaseClient';
import { useToast } from '@/shared/components/Toast';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import {
  listFieldAttachments,
  createFieldAttachment,
  deleteFieldAttachment
} from '@/shared/lib/vineyardApi';

export function FieldPhotos({ fieldId, fieldName }) {
  const toast = useToast();
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (fieldId) {
      loadAttachments();
    }
  }, [fieldId]);

  const loadAttachments = async () => {
    setLoading(true);
    const { data, error } = await listFieldAttachments(fieldId);
    if (!error && data) {
      setAttachments(data);
    }
    setLoading(false);
  };

  const validateFiles = (files) => {
    const validFiles = [];
    const errors = [];

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: Not an image file`);
      } else if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name}: File size must be less than 5MB`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    return validFiles;
  };

  const handleFileSelect = (e) => {
    const files = validateFiles(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      toast.success(`${files.length} file(s) selected`);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const files = validateFiles(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      toast.success(`${files.length} file(s) added`);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setUploading(true);
    const newProgress = {};
    selectedFiles.forEach((_, index) => {
      newProgress[index] = 0;
    });
    setUploadProgress(newProgress);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        try {
          setUploadProgress(prev => ({ ...prev, [i]: 50 }));

          // Create unique file path
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${fieldId}/${Date.now()}_${i}.${fileExt}`;

          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('field-attachments')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          setUploadProgress(prev => ({ ...prev, [i]: 75 }));

          // Create database record
          const attachmentData = {
            field_id: fieldId,
            file_name: file.name,
            file_type: 'photo',
            file_size_bytes: file.size,
            storage_path: fileName,
            mime_type: file.type,
            title: file.name,
            capture_date: new Date().toISOString().split('T')[0]
          };

          const { error: dbError } = await createFieldAttachment(attachmentData);
          if (dbError) throw dbError;

          setUploadProgress(prev => ({ ...prev, [i]: 100 }));
          successCount++;
        } catch (error) {
          console.error(`Upload error for ${file.name}:`, error);
          errorCount++;
        }
      }

      // Reset form
      setSelectedFiles([]);
      setUploadProgress({});
      document.getElementById('file-input').value = '';

      // Reload attachments
      await loadAttachments();

      if (successCount > 0) {
        toast.success(`${successCount} photo(s) uploaded successfully!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} photo(s) failed to upload`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = (attachment) => {
    setDeleteConfirm(attachment);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    const { error } = await deleteFieldAttachment(deleteConfirm.id);
    if (!error) {
      await loadAttachments();
      toast.success('Photo deleted successfully');
    } else {
      toast.error(`Delete failed: ${error.message}`);
    }
    setDeleteConfirm(null);
  };

  const getImageUrl = (storagePath) => {
    const { data } = supabase.storage
      .from('field-attachments')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Field Photos</h2>
        <Button
          onClick={() => setShowUploadSection(!showUploadSection)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="w-4 h-4" />
          {showUploadSection ? 'Cancel Upload' : 'Upload Photos'}
        </Button>
      </div>

      <div>
        {/* Upload Section */}
        {showUploadSection && (
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Drag & Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  dragOver
                    ? 'border-slate-800 bg-slate-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <Upload className={`w-12 h-12 mx-auto mb-3 ${dragOver ? 'text-slate-800' : 'text-gray-400'}`} />
                <p className="text-lg font-medium text-gray-700 mb-1">
                  {dragOver ? 'Drop files here' : 'Drag & drop photos here'}
                </p>
                <p className="text-sm text-gray-500 mb-3">or</p>
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg inline-flex items-center justify-center transition-colors">
                    <Upload className="w-4 h-4 mr-2" />
                    Browse Files
                  </span>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-3">Max 5MB per file • Multiple files supported</p>
              </div>

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Selected Files ({selectedFiles.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                          {uploadProgress[index] !== undefined && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <div className="text-white text-center">
                                <div className="text-lg font-bold">{uploadProgress[index]}%</div>
                                <div className="w-20 h-1.5 bg-gray-300 rounded-full mt-2 overflow-hidden">
                                  <div
                                    className="h-full bg-white transition-all"
                                    style={{ width: `${uploadProgress[index]}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          disabled={uploading}
                          className="absolute -top-2 -right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {selectedFiles.length > 0 && (
                <Button
                  onClick={handleUploadAll}
                  disabled={uploading}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center py-6"
                >
                  {uploading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Uploading {selectedFiles.length} photo(s)...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload {selectedFiles.length} photo(s)
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Photos Grid */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <Camera className="w-5 h-5 text-gray-600" />
                </div>
                Photo Gallery
                <span className="text-sm font-normal text-gray-500">({attachments.length})</span>
              </h3>
            </div>

            {loading ? (
              <SkeletonGrid items={6} columns={3} />
            ) : attachments.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                <div className="inline-block p-4 bg-white rounded-full shadow-sm mb-4">
                  <Camera className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-700 font-semibold text-lg">No photos yet</p>
                <p className="text-sm text-gray-500 mt-2">Upload your first field photo above to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="group relative rounded-xl overflow-hidden border-2 border-gray-200 hover:border-gray-400 shadow-md hover:shadow-xl transition-all cursor-pointer" onClick={() => setSelectedImage(attachment)}>
                    <img
                      src={getImageUrl(attachment.storage_path)}
                      alt={attachment.title || attachment.file_name}
                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <p className="font-semibold text-sm truncate">
                          {attachment.title || attachment.file_name}
                        </p>
                        {attachment.capture_date && (
                          <p className="text-xs flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(attachment.capture_date).toLocaleDateString()}
                          </p>
                        )}
                        {attachment.description && (
                          <p className="text-xs mt-1 line-clamp-2">{attachment.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(attachment);
                      }}
                      className="absolute top-3 right-3 p-2 bg-red-600 hover:bg-red-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg z-10"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div
            className="max-w-7xl max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(selectedImage.storage_path)}
              alt={selectedImage.title || selectedImage.file_name}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
              <h3 className="text-xl font-bold text-white mb-2">
                {selectedImage.title || selectedImage.file_name}
              </h3>
              {selectedImage.capture_date && (
                <p className="text-sm text-gray-300 flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedImage.capture_date).toLocaleDateString()}
                </p>
              )}
              {selectedImage.description && (
                <p className="text-sm text-gray-300">{selectedImage.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Photo"
        message={`Are you sure you want to delete "${deleteConfirm?.title || deleteConfirm?.file_name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
