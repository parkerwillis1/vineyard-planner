-- Create field_attachments table for photos and other field attachments
CREATE TABLE IF NOT EXISTS field_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES vineyard_blocks(id) ON DELETE CASCADE,

  -- File metadata
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes INTEGER,
  storage_path TEXT NOT NULL,
  mime_type TEXT,

  -- Attachment details
  title TEXT,
  description TEXT,
  capture_date DATE,
  tags TEXT[],

  -- Soft delete support
  archived_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_field_attachments_field_id ON field_attachments(field_id);
CREATE INDEX idx_field_attachments_user_id ON field_attachments(user_id);
CREATE INDEX idx_field_attachments_archived_at ON field_attachments(archived_at);

-- Enable RLS
ALTER TABLE field_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own attachments"
  ON field_attachments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attachments"
  ON field_attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attachments"
  ON field_attachments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attachments"
  ON field_attachments FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for field attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('field-attachments', 'field-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Users can upload their own field attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'field-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own field attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'field-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own field attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'field-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
