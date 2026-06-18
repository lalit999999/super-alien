import Link from "next/link";

export const metadata = {
  title: "Legal",
  description: "Legal information for SuperAlien",
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ps-bg">
      <nav className="sticky top-0 z-40 border-b border-ps-border bg-ps-card/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-semibold text-ps-accent hover:text-ps-accent-dark">
            ← Back to SuperAlien
          </Link>
          <div className="flex gap-6 text-sm">
            <Link href="/legal/terms" className="text-ps-secondary hover:text-ps-text transition-colors">
              Terms
            </Link>
            <Link href="/legal/privacy" className="text-ps-secondary hover:text-ps-text transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-12">{children}</div>

      <footer className="mt-12 border-t border-ps-border bg-ps-card/50">
        <div className="mx-auto max-w-4xl px-6 py-8 text-center text-xs text-ps-muted">
          <p>&copy; {new Date().getFullYear()} SuperAlien. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
