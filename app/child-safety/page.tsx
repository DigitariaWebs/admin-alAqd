import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Child Safety Standards — Al Aqd',
  description:
    'Al Aqd Child Safety Standards and CSAE prevention policy',
};

export default function ChildSafetyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">Child Safety Standards</h1>
      <p className="text-sm text-gray-500 mb-6">Last updated: May 2026</p>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold mt-6">1. Our Commitment</h2>
        <p>
          Al Aqd is a halal matrimonial application strictly reserved for
          adult Muslims. We have zero tolerance for child sexual abuse and
          exploitation (CSAE), child sexual abuse material (CSAM), or any
          content or behavior that endangers minors. We comply with the
          Google Play Families Policy and applicable laws including 18 U.S.C.
          § 2258A and equivalent international regulations.
        </p>

        <h2 className="text-xl font-semibold mt-6">2. Age Restriction (18+)</h2>
        <p>
          Al Aqd is restricted to users aged 18 years or older. We enforce
          this through:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Mandatory date-of-birth declaration at registration</li>
          <li>Identity verification (KYC) including government-issued ID</li>
          <li>Automated age estimation on uploaded profile photos</li>
          <li>Manual moderation of suspected underage accounts</li>
          <li>
            Immediate account suspension and reporting where a user is
            confirmed or suspected to be under 18
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">
          3. CSAE & CSAM Prevention Measures
        </h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            All uploaded media is scanned with AWS Rekognition for nudity,
            explicit content, and indicators of minors
          </li>
          <li>
            Hash-matching against industry CSAM databases for any media
            entering the platform
          </li>
          <li>
            Human moderators review every flagged item within 24 hours
          </li>
          <li>End-to-end logging of moderation decisions for audit</li>
          <li>
            Restricted messaging features: no media sharing without identity
            verification
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">
          4. Reporting and Takedown
        </h2>
        <p>
          Users can report any account, message, or content via the in-app
          report function. Reports involving suspected CSAE, CSAM, grooming,
          or minors are escalated to our Trust & Safety team within 1 hour
          and reviewed within 24 hours.
        </p>
        <p>
          Confirmed CSAM is reported to the National Center for Missing &
          Exploited Children (NCMEC) via the CyberTipline and to relevant
          local authorities, in accordance with 18 U.S.C. § 2258A.
        </p>

        <h2 className="text-xl font-semibold mt-6">
          5. Child Safety Point of Contact
        </h2>
        <p>
          For all CSAE / CSAM concerns, child safety reports, or
          law-enforcement requests:
        </p>
        <p>
          <strong>Email:</strong>{' '}
          <a
            className="text-blue-600 underline"
            href="mailto:safety@al-aqd.com"
          >
            safety@al-aqd.com
          </a>
        </p>
        <p>
          We aim to acknowledge child safety reports within 24 hours and act
          on confirmed violations immediately.
        </p>

        <h2 className="text-xl font-semibold mt-6">6. Staff Training</h2>
        <p>
          All moderation and Trust & Safety staff receive annual training on
          recognizing grooming behavior, CSAM identification, lawful
          reporting, and trauma-informed response.
        </p>

        <h2 className="text-xl font-semibold mt-6">7. Updates</h2>
        <p>
          We review and update these standards at least annually, or sooner
          when laws or platform requirements change.
        </p>
      </section>
    </main>
  );
}
