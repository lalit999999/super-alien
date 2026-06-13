import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { authConfig } from "@/config/auth.config";

export async function ClerkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BaseClerkProvider
      signInUrl={authConfig.signInUrl}
      signUpUrl={authConfig.signUpUrl}
      appearance={{ theme: shadcn }}
    >
      {children}
    </BaseClerkProvider>
  );
}
