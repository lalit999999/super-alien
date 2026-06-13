import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-end px-6 py-3 border-b border-zinc-800">
        <h1>Profile here ---</h1>
        <UserButton />
      </header>
      <main>{children}</main>
    </div>
  );
}
