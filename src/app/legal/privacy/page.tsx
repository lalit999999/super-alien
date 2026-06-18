import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - SuperAlien",
  description: "Privacy Policy for SuperAlien",
};

export default function PrivacyPage() {
  return (
    <article className="max-w-none">
      <h1 className="mb-8 text-3xl font-bold text-ps-text">Privacy Policy</h1>

      <p className="mb-8 text-sm text-ps-secondary">
        Last updated:{" "}
        {new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <Section title="1. Introduction">
        SuperAlien ("we" or "us" or "our") operates the superalien.io website (the "Site"). This
        page informs you of our policies regarding the collection, use, and disclosure of personal
        data when you use our Service and the choices you have associated with that data.
      </Section>

      <Section title="2. Information Collection and Use">
        <p className="mb-4">
          We collect several different types of information for various purposes to provide and
          improve our Service to you.
        </p>
        <h3 className="mb-3 mt-6 text-xl font-semibold text-ps-text">Types of Data Collected:</h3>
        <ul className="mb-4 list-inside list-disc space-y-2">
          <li>
            <strong className="text-ps-text">Personal Data:</strong> Email address, name, phone
            number, cookies and usage data
          </li>
          <li>
            <strong className="text-ps-text">Gmail Data:</strong> Email contents, contacts, labels
            (only with your explicit permission)
          </li>
          <li>
            <strong className="text-ps-text">Calendar Data:</strong> Event titles, times, attendees
            (only with your explicit permission)
          </li>
          <li>
            <strong className="text-ps-text">Usage Data:</strong> Information about how you interact
            with our Service
          </li>
        </ul>
      </Section>

      <Section title="3. Use of Data">
        <p className="mb-4">SuperAlien uses the collected data for various purposes:</p>
        <ul className="mb-4 list-inside list-disc space-y-2">
          <li>To provide and maintain our Service</li>
          <li>To notify you about changes to our Service</li>
          <li>To allow you to participate in interactive features of our Service</li>
          <li>To provide customer support</li>
          <li>To gather analysis or valuable information to improve our Service</li>
          <li>To monitor the usage of our Service</li>
          <li>To detect, prevent and address technical and security issues</li>
        </ul>
      </Section>

      <Section title="4. Security of Data">
        The security of your data is important to us but remember that no method of transmission
        over the Internet or method of electronic storage is 100% secure. While we strive to use
        commercially acceptable means to protect your Personal Data, we cannot guarantee its
        absolute security.
      </Section>

      <Section title="5. Service Providers">
        <p className="mb-4">
          We may employ third party companies and individuals to facilitate our Service. Our
          primary third-party integrations include:
        </p>
        <ul className="mb-4 list-inside list-disc space-y-2">
          <li>Clerk (Authentication)</li>
          <li>Google Gmail API (Email access)</li>
          <li>Google Calendar API (Calendar access)</li>
          <li>OpenAI (AI processing)</li>
        </ul>
      </Section>

      <Section title="6. Changes to This Privacy Policy">
        We may update our Privacy Policy from time to time. We will notify you of any changes by
        posting the new Privacy Policy on this page and updating the "effective date" at the top
        of this Privacy Policy.
      </Section>

      <Section title="7. Contact Us">
        If you have any questions about this Privacy Policy, please contact us at{" "}
        <a href="mailto:privacy@superalien.io" className="text-ps-accent hover:underline">
          privacy@superalien.io
        </a>
        .
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 mt-8 text-2xl font-semibold text-ps-text">{title}</h2>
      <div className="text-ps-secondary leading-relaxed">{children}</div>
    </section>
  );
}
