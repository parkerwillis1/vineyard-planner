-- Fix RLS policies for irrigation_sessions to allow users to update their own sessions
-- This is needed for the "Stop" button to work when ending stuck sessions

-- Add UPDATE policy for users to update their own sessions
CREATE POLICY "Users can update their own sessions" ON irrigation_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Add DELETE policy for users to delete their own sessions (optional, for cleanup)
CREATE POLICY "Users can delete their own sessions" ON irrigation_sessions
  FOR DELETE USING (auth.uid() = user_id);
