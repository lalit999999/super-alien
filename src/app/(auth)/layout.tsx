import { Zap } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFFDF8]">
      {/* Warm top gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% -20%, #FEF0E7 0%, transparent 70%)",
        }}
      />

      {/* Logo bar */}
      <header className="flex h-16 items-center px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#BE5103]">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold text-[#332216]">SuperAlien</span>
        </Link>
      </header>

      {/* Centered auth card */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="py-4 text-center text-xs text-[#8C4C1F]">
        © {new Date().getFullYear()} SuperAlien · Privacy · Terms
      </footer>
    </div>
  );
}
