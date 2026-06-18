import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - SuperAlien",
  description: "Terms of Service for SuperAlien",
};

export default function TermsPage() {
  return (
    <article className="max-w-none">
      <h1 className="mb-8 text-3xl font-bold text-ps-text">Terms of Service</h1>

      <p className="mb-8 text-sm text-ps-secondary">
        Last updated:{" "}
        {new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <Section title="1. Agreement to Terms">
        By accessing and using SuperAlien ("Service"), you accept and agree to be bound by the
        terms and provision of this agreement. If you do not agree to abide by the above, please
        do not use this service.
      </Section>

      <Section title="2. Use License">
        <p className="mb-4">
          Permission is granted to temporarily use SuperAlien for personal, non-commercial
          transitory use only. Under this license you may not:
        </p>
        <ul className="mb-4 list-inside list-disc space-y-2 text-ps-secondary">
          <li>Modify or copy the materials</li>
          <li>Use the materials for any commercial purpose or public display</li>
          <li>Attempt to decompile or reverse engineer any software contained on SuperAlien</li>
          <li>Remove any copyright or other proprietary notations from the materials</li>
          <li>Transfer the materials to another person or "mirror" them on any other server</li>
        </ul>
      </Section>

      <Section title="3. Disclaimer">
        The materials on SuperAlien are provided on an 'as is' basis. SuperAlien makes no
        warranties, expressed or implied, and hereby disclaims and negates all other warranties
        including, without limitation, implied warranties or conditions of merchantability,
        fitness for a particular purpose, or non-infringement of intellectual property or other
        violation of rights.
      </Section>

      <Section title="4. Limitations">
        In no event shall SuperAlien or its suppliers be liable for any damages (including,
        without limitation, damages for loss of data or profit, or due to business interruption)
        arising out of the use or inability to use the materials on SuperAlien.
      </Section>

      <Section title="5. Accuracy of Materials">
        The materials appearing on SuperAlien could include technical, typographical, or
        photographic errors. SuperAlien does not warrant that any of the materials on our site
        are accurate, complete, or current. SuperAlien may make changes to the materials
        contained on our site at any time without notice.
      </Section>

      <Section title="6. Links">
        SuperAlien has not reviewed all of the sites linked to our website and is not responsible
        for the contents of any such linked site. The inclusion of any link does not imply
        endorsement by SuperAlien of the site. Use of any such linked website is at the user's
        own risk.
      </Section>

      <Section title="7. Modifications">
        SuperAlien may revise these terms of service at any time without notice. By using this
        website, you are agreeing to be bound by the then current version of these terms of
        service.
      </Section>

      <Section title="8. Governing Law">
        These terms and conditions are governed by and construed in accordance with the laws of
        India, and you irrevocably submit to the exclusive jurisdiction of the courts in that
        location.
      </Section>

      <Section title="Contact Us">
        If you have any questions about these Terms of Service, please contact us at{" "}
        <a href="mailto:support@superalien.io" className="text-ps-accent hover:underline">
          support@superalien.io
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
