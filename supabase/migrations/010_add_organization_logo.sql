-- =====================================================
-- ADD LOGO SUPPORT TO ORGANIZATIONS
-- =====================================================

-- Add logo_url column to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment
COMMENT ON COLUMN organizations.logo_url IS 'URL to the organization/vineyard logo image';
