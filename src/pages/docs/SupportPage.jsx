import DocsLayout from "./DocsLayout";
import { DocsHeader, Section, Subsection, Callout, Table, NextSteps } from "./DocsComponents";

export default function SupportPage() {
  return (
    <DocsLayout>
      <DocsHeader
        title="Support & Contact"
        subtitle="Get help from the Trellis team, report bugs, request features, and connect with the vineyard community."
      />

      <Section title="How to Get Help">
        <p>
          We're here to support your vineyard success. Choose the best support channel based on your need:
        </p>
        <Table
          headers={["Need", "Best Channel", "Response Time"]}
          rows={[
            ["Technical bug or error", "Email support", "< 24 hours"],
            ["How-to question", "Documentation or email", "< 24 hours"],
            ["Feature request", "Email or community forum", "Acknowledged within 48 hours"],
            ["Billing issue", "Email support", "< 12 hours"],
            ["Emergency (data loss)", "Email with URGENT in subject", "< 4 hours"],
          ]}
        />
      </Section>

      <Section title="Contact Information">
        <Subsection title="Email Support">
          <p>
            Primary support channel for all issues:
          </p>
          <div className="bg-vine-green-50 border border-vine-green-200 rounded-lg p-4 my-4">
            <div className="font-semibold text-vine-green-900 mb-1">Email</div>
            <div className="text-vine-green-700">support@trellisag.com</div>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            <strong>Response time:</strong> We aim to respond to all emails within 24 hours during business days (Monday-Friday). Urgent issues marked with "URGENT" in subject line receive priority response within 4 hours.
          </p>
          <Callout type="tip" title="Effective Support Emails">
            Help us help you faster by including:
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
              <li>Clear subject line describing the issue</li>
              <li>Account email address</li>
              <li>Steps to reproduce the problem</li>
              <li>Screenshot of any error messages</li>
              <li>Browser/device type and version</li>
            </ul>
          </Callout>
        </Subsection>

        <Subsection title="Business Hours">
          <p>
            Support team availability:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Monday - Friday:</strong> 8:00 AM - 6:00 PM Pacific Time</li>
            <li><strong>Saturday - Sunday:</strong> Limited support (emergency issues only)</li>
            <li><strong>Holidays:</strong> Reduced hours (check status page for announcements)</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Email support is monitored 24/7 during harvest season (August-October) for time-sensitive issues.
          </p>
        </Subsection>

        <Subsection title="Phone Support (Enterprise Only)">
          <p>
            Enterprise plan subscribers receive dedicated phone support:
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-4">
            <div className="font-semibold text-gray-900 mb-1">Enterprise Support Line</div>
            <div className="text-gray-700">Available after upgrade to Enterprise plan</div>
            <div className="text-sm text-gray-600 mt-2">Direct line with priority routing and callback guarantee</div>
          </div>
        </Subsection>

        <Subsection title="Live Chat (Coming Soon)">
          <p>
            In-app live chat launching Q2 2025:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Instant answers during business hours</li>
            <li>Screen sharing for complex technical issues</li>
            <li>Available to Starter, Professional, and Enterprise plans</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Support Resources">
        <Subsection title="Documentation">
          <p>
            Comprehensive guides covering all Trellis features:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Getting Started:</strong> Quick start guide and core concepts</li>
            <li><strong>Financial Planner:</strong> Design, financial inputs, projections</li>
            <li><strong>Operations:</strong> Blocks, irrigation, tasks, spray records, team management</li>
            <li><strong>Troubleshooting:</strong> Common issues and solutions</li>
            <li><strong>FAQ:</strong> Frequently asked questions</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Start with documentation search before emailing support—90% of questions answered in docs.
          </p>
        </Subsection>

        <Subsection title="Video Tutorials (Coming Soon)">
          <p>
            Step-by-step video walkthroughs launching Q1 2025:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Getting started: Account setup and first vineyard</li>
            <li>Planner walkthrough: Building your first financial plan</li>
            <li>Operations setup: Creating blocks and importing from planner</li>
            <li>Irrigation management: Scheduling and ET analysis</li>
            <li>Advanced features: Analytics, VRI zones, hardware integration</li>
          </ul>
        </Subsection>

        <Subsection title="Community Forum (Planned)">
          <p>
            Connect with other Trellis users and viticulturists:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Share best practices and vineyard strategies</li>
            <li>Get advice from experienced growers</li>
            <li>Vote on feature requests</li>
            <li>Beta test new features</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Forum launching Q2 2025. Email support@trellisag.com to join early access list.
          </p>
        </Subsection>

        <Subsection title="Status Page">
          <p>
            Real-time system status and incident updates:
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
            <div className="font-semibold text-blue-900 mb-1">System Status</div>
            <div className="text-blue-700">status.trellisag.com</div>
            <div className="text-sm text-blue-600 mt-2">Subscribe to status updates for outage notifications</div>
          </div>
          <p>
            Check status page if experiencing issues—we post real-time updates during outages, maintenance, and performance degradation.
          </p>
        </Subsection>
      </Section>

      <Section title="Bug Reports">
        <Subsection title="How to Report a Bug">
          <p>
            If you encounter unexpected behavior, crashes, or errors:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li><strong>Check if it's a known issue:</strong> Review troubleshooting guide and status page</li>
            <li><strong>Document the bug:</strong>
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>What were you doing when it occurred?</li>
                <li>What did you expect to happen?</li>
                <li>What actually happened?</li>
                <li>Can you reproduce it? If so, exact steps</li>
              </ul>
            </li>
            <li><strong>Gather evidence:</strong>
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>Screenshot of error message</li>
                <li>Browser console log (F12 → Console → screenshot red errors)</li>
                <li>Network log if data not saving (F12 → Network → screenshot failed requests)</li>
              </ul>
            </li>
            <li><strong>Email to:</strong> support@trellisag.com with subject "BUG: [brief description]"</li>
          </ol>
          <Callout type="success" title="Bug Bounty Program">
            We pay $25-$500 for verified bug reports that help us improve Trellis. Critical security bugs eligible for up to $2,000. All users who report bugs receive credit in release notes (with permission).
          </Callout>
        </Subsection>

        <Subsection title="Bug Priority Levels">
          <p>
            How we categorize and respond to bugs:
          </p>
          <Table
            headers={["Priority", "Definition", "Target Fix Time"]}
            rows={[
              ["Critical", "Data loss, security issue, or total system down", "< 4 hours"],
              ["High", "Major feature broken, affecting many users", "< 48 hours"],
              ["Medium", "Feature partially working or workaround available", "< 1 week"],
              ["Low", "Minor cosmetic issue, rare edge case", "Next release"],
            ]}
          />
        </Subsection>
      </Section>

      <Section title="Feature Requests">
        <Subsection title="Submit a Feature Idea">
          <p>
            We prioritize features based on user demand. Share your ideas:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li><strong>Email:</strong> support@trellisag.com with subject "FEATURE REQUEST: [idea]"</li>
            <li><strong>Describe the need:</strong> What problem does this solve? What workflow improves?</li>
            <li><strong>Provide context:</strong> How often would you use this? Critical or nice-to-have?</li>
            <li><strong>Examples:</strong> Link to similar features in other tools (if applicable)</li>
          </ol>
          <p className="text-sm text-gray-600 mt-3">
            We review all feature requests monthly and respond with status (planned, under consideration, not planned). Highly requested features move to roadmap.
          </p>
        </Subsection>

        <Subsection title="Feature Voting (Coming Soon)">
          <p>
            Upvote features you want to see built:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Browse community-submitted feature ideas</li>
            <li>Vote for features most important to you</li>
            <li>See which features are in development</li>
            <li>Track progress on roadmap</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Launching Q2 2025 with community forum.
          </p>
        </Subsection>

        <Subsection title="Current Roadmap Highlights">
          <p>
            Features in active development (Q1-Q2 2025):
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Hardware Integration:</strong> Weather stations, soil sensors, flow meters (Beta: April 2025)</li>
            <li><strong>Mobile App:</strong> iOS and Android native apps (Beta: March 2025)</li>
            <li><strong>Advanced Analytics:</strong> Predictive yield modeling, ML-powered recommendations (Q2 2025)</li>
            <li><strong>Team Collaboration:</strong> Multi-user accounts, role-based permissions (Q2 2025)</li>
            <li><strong>Inventory Tracking:</strong> Grape/wine/bottle inventory module (Q3 2025)</li>
          </ul>
        </Subsection>
      </Section>

      <Section title="Onboarding & Training">
        <Subsection title="Free Setup Call">
          <p>
            Professional and Enterprise plans include complimentary onboarding:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>30-minute setup call:</strong> Screen share walkthrough of core features</li>
            <li><strong>Data import assistance:</strong> Help importing existing vineyard data</li>
            <li><strong>Custom configuration:</strong> Tailor settings to your operation</li>
            <li><strong>Q&A session:</strong> Get answers to your specific questions</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Schedule onboarding call: support@trellisag.com or Account Settings → Schedule Onboarding
          </p>
        </Subsection>

        <Subsection title="Custom Training">
          <p>
            Enterprise plan includes team training:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>1-hour live training for your crew (up to 10 people)</li>
            <li>Customized to your workflow and modules</li>
            <li>Recorded session for future reference</li>
            <li>Follow-up session after 30 days</li>
          </ul>
        </Subsection>

        <Subsection title="Consulting Services">
          <p>
            Need help beyond standard support? We offer:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Viticulture Consulting:</strong> Irrigation design, variety selection, site analysis</li>
            <li><strong>Data Migration:</strong> Import from Excel, other software, or paper records</li>
            <li><strong>Custom Reporting:</strong> Build specialized reports for your business needs</li>
            <li><strong>Integration Development:</strong> Connect Trellis to your existing systems</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Consulting rates: $150-$250/hour depending on service. Contact support@trellisag.com for quote.
          </p>
        </Subsection>
      </Section>

      <Section title="Data Privacy & Security">
        <Subsection title="Data Ownership">
          <p>
            Your vineyard data belongs to you:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>You retain 100% ownership of all data entered into Trellis</li>
            <li>Export your data anytime (CSV, Excel, PDF formats)</li>
            <li>Data retained for 90 days after subscription cancellation</li>
            <li>Permanent deletion available on request</li>
          </ul>
        </Subsection>

        <Subsection title="Security Measures">
          <p>
            How we protect your vineyard data:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>256-bit SSL encryption for all data transmission</li>
            <li>Encrypted at-rest storage (AWS RDS with encryption)</li>
            <li>Daily automated backups (retained for 30 days)</li>
            <li>SOC 2 Type II compliance (audit in progress)</li>
            <li>Two-factor authentication (2FA) available</li>
          </ul>
        </Subsection>

        <Subsection title="Report a Security Issue">
          <p>
            If you discover a security vulnerability:
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
            <div className="font-semibold text-red-900 mb-1">Security Email</div>
            <div className="text-red-700">security@trellisag.com</div>
            <div className="text-sm text-red-600 mt-2">Do NOT post security issues publicly. We respond to security reports within 4 hours.</div>
          </div>
          <p>
            Responsible disclosure: Report privately, give us 90 days to fix before public disclosure. Security bug bounties up to $2,000.
          </p>
        </Subsection>
      </Section>

      <Section title="Feedback">
        <Subsection title="We Want to Hear From You">
          <p>
            Trellis improves based on your feedback:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>General feedback:</strong> support@trellisag.com</li>
            <li><strong>Feature requests:</strong> Submit via email (voting platform coming Q2)</li>
            <li><strong>Usability issues:</strong> Tell us what's confusing or hard to use</li>
            <li><strong>Success stories:</strong> Share how Trellis helped your vineyard</li>
          </ul>
        </Subsection>

        <Subsection title="User Interviews">
          <p>
            Help shape future features:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>30-minute video call to discuss your workflow</li>
            <li>$50 Amazon gift card for participation</li>
            <li>Early access to features you help design</li>
            <li>Email support@trellisag.com with "User Interview" subject to volunteer</li>
          </ul>
        </Subsection>
      </Section>

      <Callout type="success" title="We're Here to Help">
        Trellis exists to support vineyard success. Whether you have a technical question, feature idea, or just want to share your experience, we're listening. Don't hesitate to reach out—your feedback makes the product better for everyone.
      </Callout>

      <NextSteps
        links={[
          {
            title: "Troubleshooting Guide",
            description: "Resolve common technical issues",
            href: "/docs/troubleshooting",
          },
          {
            title: "FAQ",
            description: "Answers to frequently asked questions",
            href: "/docs/faq",
          },
          {
            title: "Getting Started",
            description: "New to Trellis? Start here",
            href: "/docs/getting-started/quick-start",
          },
        ]}
      />
    </DocsLayout>
  );
}
