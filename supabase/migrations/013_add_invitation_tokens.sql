-- =====================================================
-- TEAM MEMBER INVITATION SYSTEM
-- =====================================================

-- Add invitation token fields to organization_members
ALTER TABLE organization_members
ADD COLUMN IF NOT EXISTS invitation_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMPTZ;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_org_members_invitation_token ON organization_members(invitation_token);

-- Function to generate new invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate new token and set expiration to 7 days from now
  NEW.invitation_token = gen_random_uuid();
  NEW.invitation_expires_at = NOW() + INTERVAL '7 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate token on insert
CREATE TRIGGER generate_invitation_token_on_insert
  BEFORE INSERT ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION generate_invitation_token();

COMMENT ON COLUMN organization_members.invitation_token IS 'Unique token for invitation link';
COMMENT ON COLUMN organization_members.invitation_sent_at IS 'When the invitation email was sent';
COMMENT ON COLUMN organization_members.invitation_accepted_at IS 'When the user accepted the invitation';
COMMENT ON COLUMN organization_members.invitation_expires_at IS 'When the invitation expires (7 days from creation)';
