import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Double-guard: middleware already blocks unauthenticated users, but this
// Server Component guard ensures no authenticated-layout content is ever
// rendered for a signed-out user even if middleware config changes.
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}
