-- Fix NDVI cache RLS policies to allow UPDATE for upsert operations
-- The existing policies only had SELECT, INSERT, DELETE - missing UPDATE

-- Add UPDATE policy for ndvi_scene_cache
CREATE POLICY "Users can update own block scene cache" ON ndvi_scene_cache
  FOR UPDATE
  USING (
    block_id IN (
      SELECT id FROM vineyard_blocks WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    block_id IN (
      SELECT id FROM vineyard_blocks WHERE user_id = auth.uid()
    )
  );

-- Add UPDATE policy for ndvi_result_cache
CREATE POLICY "Users can update own block result cache" ON ndvi_result_cache
  FOR UPDATE
  USING (
    block_id IN (
      SELECT id FROM vineyard_blocks WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    block_id IN (
      SELECT id FROM vineyard_blocks WHERE user_id = auth.uid()
    )
  );
