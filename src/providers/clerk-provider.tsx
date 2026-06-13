import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs";

// Server component wrapper — lets us centralise Clerk config in one place
// without scattering appearance/localization props across every layout.
export async function ClerkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BaseClerkProvider
      appearance={{
        variables: { colorPrimary: "#000000" },
      }}
    >
      {children}
    </BaseClerkProvider>
  );
}
