import DocsLayout from "./DocsLayout";
import { DocsHeader, Section, Subsection, Callout, Table, NextSteps } from "./DocsComponents";

export default function TroubleshootingPage() {
  return (
    <DocsLayout>
      <DocsHeader
        title="Troubleshooting Guide"
        subtitle="Resolve common issues, error messages, and technical problems with Trellis."
      />

      <Section title="Quick Diagnostics">
        <p>
          Most issues fall into a few categories. Start here to quickly identify your problem:
        </p>
        <Table
          headers={["Symptom", "Likely Cause", "Fix Section"]}
          rows={[
            ["Page won't load / white screen", "JavaScript error or network issue", "→ Loading Problems"],
            ["Can't sign in / password rejected", "Account or authentication issue", "→ Authentication"],
            ["Data not saving", "Network timeout or validation error", "→ Saving Issues"],
            ["Map not displaying", "Google Maps API or browser issue", "→ Map Problems"],
            ["Calculations seem wrong", "Input validation or formula issue", "→ Calculation Errors"],
          ]}
        />
      </Section>

      <Section title="Loading Problems">
        <Subsection title="White Screen or Page Won't Load">
          <p>
            If Trellis shows a blank white screen:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li><strong>Hard refresh the page:</strong>
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>Windows/Linux: Ctrl + Shift + R</li>
                <li>Mac: Cmd + Shift + R</li>
                <li>This clears cached JavaScript that may be corrupted</li>
              </ul>
            </li>
            <li><strong>Clear browser cache:</strong>
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>Chrome: Settings → Privacy and Security → Clear browsing data</li>
                <li>Select "Cached images and files"</li>
                <li>Time range: "Last 24 hours"</li>
                <li>Click "Clear data"</li>
              </ul>
            </li>
            <li><strong>Try incognito/private mode:</strong> This tests if browser extensions are causing conflicts</li>
            <li><strong>Check browser console:</strong>
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>Press F12 (Windows) or Cmd + Option + I (Mac)</li>
                <li>Click "Console" tab</li>
                <li>Look for red error messages</li>
                <li>Screenshot and send to support if errors present</li>
              </ul>
            </li>
          </ol>
          <Callout type="tip" title="Browser Compatibility">
            Trellis works best on Chrome, Firefox, Safari, and Edge (latest versions). Internet Explorer is not supported. Update to latest browser version if experiencing issues.
          </Callout>
        </Subsection>

        <Subsection title="Slow Loading or Timeouts">
          <p>
            If pages load very slowly or time out:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Check internet speed:</strong> Visit speedtest.net—Trellis needs minimum 5 Mbps</li>
            <li><strong>Reduce active tabs:</strong> Close other browser tabs using memory (especially video/streaming)</li>
            <li><strong>Restart browser:</strong> Completely quit and restart browser application</li>
            <li><strong>Check VPN:</strong> If using VPN, try disabling it (some VPNs cause latency issues)</li>
          </ul>
        </Subsection>

        <Subsection title="Infinite Loading Spinner">
          <p>
            If loading spinner never completes:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Wait 30 seconds (large datasets take time on first load)</li>
            <li>Check network tab in browser console (F12 → Network) for failed requests</li>
            <li>Refresh page</li>
            <li>If persists, sign out and sign back in</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Authentication Issues">
        <Subsection title="Can't Sign In">
          <p>
            If login fails with "Invalid credentials" error:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li><strong>Verify email address:</strong> Check for typos (common: .com vs .co, missing letters)</li>
            <li><strong>Check Caps Lock:</strong> Password is case-sensitive</li>
            <li><strong>Reset password:</strong>
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>Click "Forgot Password" on sign-in page</li>
                <li>Enter email address</li>
                <li>Check email for reset link (check spam folder)</li>
                <li>Link expires after 1 hour—request new one if expired</li>
              </ul>
            </li>
            <li><strong>Verify account exists:</strong> Try signing up—if email already registered, account exists</li>
          </ol>
        </Subsection>

        <Subsection title="Email Verification Not Received">
          <p>
            After signing up, verification email should arrive within 5 minutes:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Check spam/junk folder:</strong> Email filters sometimes flag automated emails</li>
            <li><strong>Whitelist sender:</strong> Add noreply@vinepioneer.com to contacts</li>
            <li><strong>Check email address:</strong> Verify correct email in account settings</li>
            <li><strong>Resend verification:</strong> Sign in → Account Settings → "Resend verification email"</li>
            <li><strong>Wait 15 minutes:</strong> Some email providers delay delivery</li>
          </ul>
        </Subsection>

        <Subsection title="Session Expired / Logged Out Automatically">
          <p>
            If repeatedly logged out:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Sessions expire after 7 days of inactivity (security feature)</li>
            <li>Check browser isn't blocking cookies (required for session persistence)</li>
            <li>Don't use incognito mode (sessions don't persist)</li>
            <li>If using multiple devices, only one active session per account</li>
          </ul>
        </Subsection>

        <Subsection title="Two-Factor Authentication (2FA) Issues">
          <p>
            If 2FA code not working:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Codes expire after 30 seconds—generate new code and enter quickly</li>
            <li>Ensure device time is synced (2FA requires accurate system clock)</li>
            <li>Try backup codes (provided when 2FA first enabled)</li>
            <li>Contact support to disable 2FA if locked out (identity verification required)</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Saving Issues">
        <Subsection title="Changes Not Saving">
          <p>
            If edits don't persist after clicking Save:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li><strong>Check save confirmation:</strong> Look for green "Saved" checkmark or success message</li>
            <li><strong>Look for validation errors:</strong> Red text indicates required fields missing or invalid data</li>
            <li><strong>Check internet connection:</strong> Save requires network—offline changes won't persist</li>
            <li><strong>Refresh page:</strong> Verify if changes actually saved (may be display bug)</li>
            <li><strong>Browser console errors:</strong> F12 → Console, look for network errors (500, 401, 403)</li>
          </ol>
        </Subsection>

        <Subsection title='Error: "Request Timeout"'>
          <p>
            If save fails with timeout error:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Large datasets (500+ tasks, 50+ blocks) take longer to save</li>
            <li>Wait 60 seconds and try again</li>
            <li>Check internet speed (slow upload causes timeouts)</li>
            <li>Try saving smaller chunks (e.g., one block at a time vs. all at once)</li>
          </ul>
        </Subsection>

        <Subsection title="Lost Changes After Browser Crash">
          <p>
            Trellis auto-saves every 30 seconds, but recent changes may be lost:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Check "last saved" timestamp (top of page)—indicates most recent successful save</li>
            <li>Look for "unsaved changes" indicator (orange dot) before leaving page</li>
            <li>Manually save critical changes before closing browser</li>
            <li>No local cache—all data stored server-side, so crashes don't corrupt data</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Map Problems">
        <Subsection title="Map Not Displaying / Gray Box">
          <p>
            If vineyard map shows blank gray area:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li><strong>Check internet connection:</strong> Map tiles require active network</li>
            <li><strong>Verify GPS coordinates:</strong> Invalid coordinates cause map rendering failures</li>
            <li><strong>Google Maps API:</strong> Rare outages occur—check status.cloud.google.com</li>
            <li><strong>Browser zoom:</strong> Reset browser zoom to 100% (Ctrl/Cmd + 0)</li>
            <li><strong>GPU acceleration:</strong> Try disabling hardware acceleration in browser settings</li>
          </ol>
        </Subsection>

        <Subsection title="Can't Draw Polygons">
          <p>
            If drawing tool not working:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Click "polygon" drawing button to activate (cursor changes to crosshair)</li>
            <li>Zoom in closer (drawing tool disabled at wide zoom levels)</li>
            <li>Close any open polygon before starting new one (click starting point to close)</li>
            <li>Minimum 3 points required for valid polygon</li>
          </ul>
        </Subsection>

        <Subsection title="Incorrect Acreage Calculation">
          <p>
            If GPS polygon area seems wrong:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Verify polygon is closed (last point connects to first point)</li>
            <li>Check for overlapping lines (self-intersecting polygons give wrong area)</li>
            <li>Ensure all points are placed correctly (zoom in to verify boundary accuracy)</li>
            <li>Compare to known acreage from property survey (GPS accuracy ±5%)</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Calculation Errors">
        <Subsection title='Planner Shows "Infinity" or "NaN"'>
          <p>
            If calculations display "Infinity", "NaN", or negative numbers:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Division by zero:</strong> Check for zero values in acres, spacing, or price fields</li>
            <li><strong>Negative values:</strong> Ensure all cost/price inputs are positive numbers</li>
            <li><strong>Missing required fields:</strong> Fill in all financial inputs before viewing projections</li>
            <li><strong>Refresh page:</strong> Stale cached calculations may display incorrectly</li>
          </ul>
        </Subsection>

        <Subsection title="Unrealistic Projections">
          <p>
            If 10-year plan shows extremely high/low numbers:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li><strong>Verify inputs:</strong> Double-check acres, price per ton, yield, and costs</li>
            <li><strong>Check units:</strong> Ensure using correct units (tons vs. pounds, $ vs. $1,000)</li>
            <li><strong>Compare to benchmarks:</strong> See Formulas page for industry-standard ranges</li>
            <li><strong>Screenshot and report:</strong> If inputs are correct but output wrong, contact support</li>
          </ol>
        </Subsection>

        <Subsection title="Material Costs Don't Match Quotes">
          <p>
            If calculated trellis/irrigation costs differ from contractor quotes:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Default prices are national averages—adjust in Financial Inputs for regional pricing</li>
            <li>Contractor quotes include labor—planner separates materials and labor</li>
            <li>Verify spacing and row count match contractor's assumptions</li>
            <li>Check for included items (e.g., contractor may include site prep, planner doesn't)</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Data Issues">
        <Subsection title="Missing Blocks, Tasks, or Records">
          <p>
            If data disappeared:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li><strong>Check filters:</strong> Data may be hidden by active filter (date range, block, status)</li>
            <li><strong>Archive status:</strong> Archived items hidden by default—click "Show Archived"</li>
            <li><strong>Wrong vineyard selected:</strong> Verify correct vineyard in top navigation</li>
            <li><strong>Accidental deletion:</strong> Check "Activity Log" for deletion events</li>
            <li><strong>Data recovery:</strong> Contact support within 30 days for restore from backup</li>
          </ol>
        </Subsection>

        <Subsection title="Duplicate Entries">
          <p>
            If seeing duplicate blocks, tasks, or irrigation events:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Caused by double-clicking Save button (creates two identical records)</li>
            <li>Delete duplicate manually (select and click trash icon)</li>
            <li>We're adding duplicate detection to prevent this (coming in next release)</li>
          </ul>
        </Subsection>

        <Subsection title="Data Not Syncing Between Devices">
          <p>
            If changes on mobile don't appear on desktop (or vice versa):
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Pull down to refresh on mobile app</li>
            <li>Hard refresh browser on desktop (Ctrl/Cmd + Shift + R)</li>
            <li>Check "last synced" timestamp (should be within 30 seconds)</li>
            <li>Verify both devices logged into same account</li>
            <li>If still not syncing after 5 minutes, contact support</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Performance Issues">
        <Subsection title="Slow Performance with Large Datasets">
          <p>
            If app slows down with 50+ blocks or 1,000+ tasks:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Archive old data:</strong> Archive completed tasks and past-season records</li>
            <li><strong>Use filters:</strong> Filter to current season/active blocks to reduce displayed data</li>
            <li><strong>Close other tabs:</strong> Browser memory limits affect performance</li>
            <li><strong>Increase browser memory:</strong> Chrome flags to increase heap size (advanced)</li>
          </ul>
        </Subsection>

        <Subsection title="Calendar View Lagging">
          <p>
            If calendar takes long time to render events:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Switch to Agenda view (faster for 500+ events)</li>
            <li>Filter to specific date range (e.g., current month only)</li>
            <li>Archive completed irrigation schedules (reduces recurring events)</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Mobile App Issues">
        <Subsection title="App Crashes on Startup">
          <p>
            If mobile app crashes immediately:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Force close app (swipe up on iOS, recent apps on Android)</li>
            <li>Clear app cache (Settings → Apps → Trellis → Clear Cache)</li>
            <li>Update to latest app version (App Store / Play Store)</li>
            <li>Restart device</li>
            <li>Uninstall and reinstall app (last resort—data preserved on server)</li>
          </ol>
        </Subsection>

        <Subsection title="GPS Location Not Working">
          <p>
            If app can't detect your location:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Check location permissions (Settings → Trellis → Location → Allow)</li>
            <li>Enable GPS in device settings</li>
            <li>Move outdoors (GPS doesn't work well indoors)</li>
            <li>Wait 30 seconds for GPS lock (cold start takes time)</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Billing & Subscription">
        <Subsection title="Payment Declined">
          <p>
            If credit card payment fails:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Verify card number, expiration, CVV are correct</li>
            <li>Check billing address matches card on file with bank</li>
            <li>Ensure sufficient funds/credit limit</li>
            <li>Contact bank (some flag recurring charges as fraud)</li>
            <li>Try different card if issue persists</li>
          </ul>
        </Subsection>

        <Subsection title="Can't Access Paid Features">
          <p>
            If locked out of features after subscribing:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Sign out and sign back in (refreshes subscription status)</li>
            <li>Check Account Settings → Subscription—verify tier is correct</li>
            <li>Payment may still be processing (can take 10 minutes)</li>
            <li>If still locked after 1 hour, contact support with payment confirmation</li>
          </ul>
        </Subsection>

        <Subsection title="Cancel Subscription">
          <p>
            To cancel subscription:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Go to Account Settings → Subscription</li>
            <li>Click "Manage Subscription"</li>
            <li>Select "Cancel Subscription"</li>
            <li>Access continues through end of billing period</li>
            <li>Data retained for 90 days after cancellation</li>
          </ol>
        </Subsection>
      </Section>

      <Callout type="warning" title="Still Having Issues?">
        If troubleshooting steps don't resolve your problem, contact support with:
        <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
          <li>Detailed description of problem</li>
          <li>Steps to reproduce issue</li>
          <li>Screenshot of error (if any)</li>
          <li>Browser/device type and version</li>
          <li>Email: support@vinepioneer.com</li>
        </ul>
        We respond within 24 hours (usually much faster).
      </Callout>

      <NextSteps
        links={[
          {
            title: "Support & Contact",
            description: "Get help from the Trellis team",
            href: "/docs/support",
          },
          {
            title: "FAQ",
            description: "Answers to frequently asked questions",
            href: "/docs/faq",
          },
          {
            title: "Quick Start Guide",
            description: "Review setup steps if experiencing onboarding issues",
            href: "/docs/getting-started/quick-start",
          },
        ]}
      />
    </DocsLayout>
  );
}
