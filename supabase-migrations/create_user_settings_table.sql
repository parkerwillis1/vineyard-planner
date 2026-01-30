-- Create user_settings table to store user preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile data
  profile_data JSONB DEFAULT '{}'::jsonb,

  -- Display preferences
  display_preferences JSONB DEFAULT '{"dateFormat": "MM/DD/YYYY", "currency": "USD", "unitSystem": "imperial"}'::jsonb,

  -- Notification preferences
  notification_preferences JSONB DEFAULT '{"emailUpdates": true, "planReminders": false, "productNews": true}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one settings record per user
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only read their own settings
CREATE POLICY "Users can view their own settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own settings
CREATE POLICY "Users can insert their own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own settings
CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own settings
CREATE POLICY "Users can delete their own settings"
  ON user_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
