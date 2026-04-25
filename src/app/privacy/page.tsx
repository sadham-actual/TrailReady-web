import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | TrailReady',
  description: 'How TrailReady collects, uses, and protects your information.',
};

const LAST_UPDATED = 'April 24, 2026';
const CONTACT_EMAIL = 'privacy@trail-ready.com';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-mono text-xs uppercase tracking-widest text-action-orange mb-3">{title}</h2>
      <div className="space-y-3 text-stone-700 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bone">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-widest text-muted-stone hover:text-deep-stone transition-colors"
          >
            ← TrailReady
          </Link>
          <h1 className="mt-6 text-3xl font-bold text-deep-stone">Privacy Policy</h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-stone">
            Last updated: {LAST_UPDATED}
          </p>
          <p className="mt-4 text-sm text-stone-600 leading-relaxed">
            TrailReady is a trail condition reporting tool for the off-road community. This policy
            explains what information we collect when you use TrailReady, how we use it, and your
            rights regarding your data.
          </p>
        </div>

        <div className="border-t border-stone-800 pt-10">

          <Section title="Information we collect">
            <p><strong className="text-deep-stone">Account information.</strong> When you create an account we collect your email address and a hashed password, or — if you sign in with Google — your name, email address, and Google profile photo. We do not receive or store your Google password.</p>
            <p><strong className="text-deep-stone">Vehicle profile.</strong> If you choose to set up a vehicle profile we store your rig tier, vehicle make and model, ground clearance, tire size, whether you have low-range gearing or a winch, and your self-reported driver experience level. This information is entirely optional and can be deleted at any time.</p>
            <p><strong className="text-deep-stone">Condition reports.</strong> When you submit a field report we store your report text, vehicle category, confidence level, trail status, timestamp, and any photos you attach. Reports are associated with your account so you can manage them.</p>
            <p><strong className="text-deep-stone">Trail activity.</strong> We store the trails you have bookmarked and any trip bundles you create in the planner.</p>
            <p><strong className="text-deep-stone">Location.</strong> If you allow location access on the map, your GPS coordinates are used only to center the map. They are not stored on our servers.</p>
            <p><strong className="text-deep-stone">Usage data.</strong> Our hosting provider (Vercel) automatically collects standard server logs including IP addresses, browser type, pages visited, and timestamps. We use this data solely to operate and improve the service.</p>
          </Section>

          <Section title="How we use your information">
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Provide the TrailReady service — displaying trail conditions, personalizing vehicle-based verdicts, and saving your activity</li>
              <li>Associate condition reports with your account so you can manage and delete them</li>
              <li>Improve trail data accuracy and the overall product</li>
              <li>Send transactional emails (password resets, account confirmations) — no marketing without your consent</li>
              <li>Detect and prevent abuse or spam reports</li>
            </ul>
            <p>We do not sell your personal information to anyone, ever.</p>
          </Section>

          <Section title="Condition reports and public content">
            <p>Condition reports you submit are visible to all TrailReady users, including those without accounts. Reports show the vehicle category and notes you provide. Your account name or email is <strong className="text-deep-stone">not</strong> displayed publicly alongside your reports.</p>
            <p>Photos you attach to reports are stored on UploadThing's CDN and are publicly accessible via their URL once uploaded. Do not attach photos containing personal information you would not want publicly visible.</p>
          </Section>

          <Section title="Third-party services">
            <p>TrailReady is built on services that process your data on our behalf:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-deep-stone">Supabase</strong> — database and authentication provider. Your account credentials and app data are stored in Supabase's infrastructure. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-action-orange hover:underline">Supabase Privacy Policy</a></li>
              <li><strong className="text-deep-stone">Google</strong> — optional sign-in provider. If you use Google sign-in, Google's privacy policy governs data shared during authentication. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-action-orange hover:underline">Google Privacy Policy</a></li>
              <li><strong className="text-deep-stone">UploadThing</strong> — photo storage for condition report images. <a href="https://uploadthing.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-action-orange hover:underline">UploadThing Privacy Policy</a></li>
              <li><strong className="text-deep-stone">Vercel</strong> — hosting and edge infrastructure. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-action-orange hover:underline">Vercel Privacy Policy</a></li>
              <li><strong className="text-deep-stone">OpenTopoMap</strong> — topographic map tiles displayed in the map view. No account data is sent to OpenTopoMap.</li>
            </ul>
            <p>We do not share your personal information with any other third parties.</p>
          </Section>

          <Section title="Data retention">
            <p>We retain your account information and activity for as long as your account is active. Condition reports you submit are retained to maintain the integrity of trail condition history — older reports provide valuable trend data for the community.</p>
            <p>If you delete your account, your personal information (email, vehicle profile, saved trails, and trip bundles) is deleted. Your condition reports will be anonymized — the content and trail association remain, but the link to your account is removed.</p>
          </Section>

          <Section title="Your rights and choices">
            <p>You can:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-deep-stone">Access your data</strong> — view your vehicle profile, saved trails, and trip bundles in your account settings</li>
              <li><strong className="text-deep-stone">Delete your data</strong> — remove saved trails individually from your profile, or contact us to delete your account entirely</li>
              <li><strong className="text-deep-stone">Update your information</strong> — edit your vehicle profile at any time from your profile page</li>
              <li><strong className="text-deep-stone">Opt out of location</strong> — deny or revoke location permission in your browser at any time; the map still works without it</li>
            </ul>
            <p>If you are in a jurisdiction with data protection rights (such as GDPR or CCPA), you may have additional rights including data portability and the right to object to processing. Contact us to exercise these rights.</p>
          </Section>

          <Section title="Cookies and local storage">
            <p>TrailReady uses cookies to maintain your login session via Supabase Auth. We do not use advertising or tracking cookies.</p>
            <p>We use your browser's local storage to cache offline report drafts when you are submitting a field report without cell service. This data never leaves your device except when submitted to our servers.</p>
          </Section>

          <Section title="Children's privacy">
            <p>TrailReady is not directed at children under 13 and we do not knowingly collect personal information from anyone under 13. If you believe a child has provided us with personal information, please contact us and we will delete it.</p>
          </Section>

          <Section title="Changes to this policy">
            <p>We may update this policy as the product evolves. We will update the "Last updated" date at the top of this page. For significant changes we will notify users via email or an in-app notice. Continued use of TrailReady after changes take effect constitutes acceptance of the updated policy.</p>
          </Section>

          <Section title="Contact">
            <p>Questions, data requests, or concerns about this policy:</p>
            <p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-action-orange hover:underline font-mono text-xs uppercase tracking-wider"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>

        </div>

        <div className="mt-12 pt-8 border-t border-stone-300">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-stone">
            © {new Date().getFullYear()} TrailReady · <Link href="/" className="hover:text-deep-stone transition-colors">Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
