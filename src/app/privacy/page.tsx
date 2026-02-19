import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - RVU Tracker",
  description: "Privacy Policy for RVU Tracker",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8 sm:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: February 18, 2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Overview</h2>
            <p>
              RVU Tracker (&quot;we&quot;, &quot;our&quot;, or &quot;the app&quot;) is a medical procedure RVU
              (Relative Value Unit) tracking tool available at trackmyrvu.com and as a mobile application.
              We respect your privacy and are committed to protecting the personal information you share with us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Information We Collect</h2>
            <p className="mb-3">When you sign in with Google or Apple, we receive and store:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your name</li>
              <li>Your email address</li>
              <li>Your profile picture (Google only)</li>
              <li>A unique account identifier from the sign-in provider</li>
            </ul>
            <p className="mt-3">When you use the app, we store:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Visit records you create (dates, times, notes, no-show status)</li>
              <li>Procedure codes (HCPCS) and RVU values associated with your visits</li>
              <li>Your favorited HCPCS codes and their display order</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How We Use Your Information</h2>
            <p>Your information is used solely to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Authenticate your identity and maintain your session</li>
              <li>Store and display your visit and procedure data</li>
              <li>Provide analytics and reporting on your RVU activity</li>
            </ul>
            <p className="mt-3">
              We do not sell, share, or disclose your personal information to third parties.
              We do not use your data for advertising or marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Storage &amp; Security</h2>
            <p>
              Your data is stored in a secure PostgreSQL database hosted by Neon (via Vercel).
              All data is transmitted over HTTPS. Access to your data is restricted to your
              authenticated account only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Google Sign-In</strong> &mdash; for authentication (governed by Google&apos;s Privacy Policy)</li>
              <li><strong>Apple Sign In</strong> &mdash; for authentication (governed by Apple&apos;s Privacy Policy)</li>
              <li><strong>Vercel</strong> &mdash; for hosting and deployment</li>
              <li><strong>Neon</strong> &mdash; for database hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Retention &amp; Deletion</h2>
            <p>
              Your data is retained as long as your account is active. You may request deletion
              of your account and all associated data at any time by contacting us. Upon request,
              all your personal information, visits, procedures, and favorites will be permanently deleted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Children&apos;s Privacy</h2>
            <p>
              RVU Tracker is intended for use by medical professionals. We do not knowingly
              collect information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Changes will be reflected
              on this page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact</h2>
            <p>
              If you have questions about this privacy policy or wish to request data deletion,
              please contact us at <a href="mailto:privacy@trackmyrvu.com" className="text-blue-600 hover:underline">privacy@trackmyrvu.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <a href="/" className="text-sm text-blue-600 hover:underline">&larr; Back to RVU Tracker</a>
        </div>
      </div>
    </div>
  );
}
