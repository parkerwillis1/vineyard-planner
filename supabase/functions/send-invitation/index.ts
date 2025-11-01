import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface InvitationRequest {
  memberId: string
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization,x-client-info,apikey,content-type'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! }
        }
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { memberId }: InvitationRequest = await req.json()

    if (!memberId) {
      return new Response(
        JSON.stringify({ error: 'memberId is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { data: member, error: memberError } = await supabaseClient
      .from('organization_members')
      .select('*, organization:organizations(name, logo_url)')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      return new Response(
        JSON.stringify({ error: 'Member not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173'
    const invitationUrl = `${appUrl}/accept-invitation?token=${member.invitation_token}`

    const expiryDate = new Date(member.invitation_expires_at)
    const expiresAt = expiryDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })

    const orgName = (member.organization && member.organization.name) ? member.organization.name : 'Vine Pioneer'
    const roleCapitalized = member.role.charAt(0).toUpperCase() + member.role.slice(1)

    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to ${orgName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 60px 20px; background-color: #f5f5f7;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
          <tr>
            <td style="background: linear-gradient(135deg,rgb(47, 147, 131) 0%,rgb(16, 158, 198) 100%); height: 100px; padding: 32px 40px; vertical-align: middle;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 400; color: #ffffff; letter-spacing: 0.5px; font-family: 'Georgia', 'Palatino', 'Times New Roman', serif; font-style: italic;">
                Team invitation from ${orgName}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 40px 40px;">
              <p style="margin: 0 0 32px 0; font-size: 17px; line-height: 25px; color: #86868b;">
                ${member.full_name}, ${member.email}
              </p>

              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.5px;">
                You've been invited to join the team.
              </h2>

              <p style="margin: 0 0 24px 0; font-size: 17px; line-height: 25px; color: #1d1d1f;">
                ${orgName} has invited you to join their team on Vine Pioneer as a <strong>${roleCapitalized}</strong>.
              </p>

              <p style="margin: 0 0 32px 0; font-size: 17px; line-height: 25px; color: #1d1d1f;">
                You can <a href="${invitationUrl}" style="color: #0071e3; text-decoration: none;">accept the invitation</a> to get started with managing vineyard operations, tasks, and more.
              </p>

              <div style="margin: 0 0 32px 0; padding: 24px 0; border-top: 1px solid #d2d2d7; border-bottom: 1px solid #d2d2d7;">
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 21px; color: #1d1d1f; font-weight: 600;">
                  Your role: ${roleCapitalized}
                </p>
                <p style="margin: 0; font-size: 15px; line-height: 21px; color: #86868b;">
                  This invitation expires on ${expiresAt}.
                </p>
              </div>

              <p style="margin: 0 0 8px 0; font-size: 15px; line-height: 21px; color: #1d1d1f;">
                <a href="${invitationUrl}" style="color: #0071e3; text-decoration: none;">Accept invitation ></a>
              </p>

              <p style="margin: 0 0 40px 0; font-size: 13px; line-height: 18px; color: #86868b;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 40px 48px 40px; border-top: 1px solid #d2d2d7;">
              <p style="margin: 0 0 4px 0; font-size: 12px; line-height: 16px; color: #86868b;">
                Vine Pioneer
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 16px; color: #86868b;">
                Plan.Grow.Prosper.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Vine Pioneer <noreply@vine-sight.com>',
        to: [member.email],
        subject: `You've been invited to join ${orgName}`,
        html: emailHtml
      })
    })

    if (!resendResponse.ok) {
      const error = await resendResponse.text()
      console.error('Resend API error:', error)
      throw new Error(`Failed to send email: ${error}`)
    }

    await supabaseClient
      .from('organization_members')
      .update({ invitation_sent_at: new Date().toISOString() })
      .eq('id', memberId)

    return new Response(
      JSON.stringify({ success: true, message: 'Invitation sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
