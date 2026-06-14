import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        options: {
          // Removes card border, shadow, border-radius, and outer padding so the
          // form sits flush inside our custom two-column auth layout panel.
          elevation: "flush",
          logoPlacement: "none",
        },
        variables: {
          colorPrimary: "#BE5103",
          colorBackground: "#FFFDF8",
          colorForeground: "#332216",
          colorMutedForeground: "#8C4C1F",
          colorInput: "#F8F2EA",
          colorInputForeground: "#332216",
          colorNeutral: "#332216",
          colorBorder: "#E7D8C8",
          colorDanger: "#dc2626",
          borderRadius: "0.5rem",
          fontFamily: "inherit",
        },
        elements: {
          // Social / OAuth buttons
          socialButtonsBlockButton:
            "border-ps-border bg-ps-surface text-ps-text font-medium hover:bg-ps-surface-2 transition-colors",
          socialButtonsBlockButtonText: "font-medium text-ps-text",

          // Form fields
          formFieldLabel: "text-sm font-medium text-ps-text",

          // Primary CTA
          formButtonPrimary:
            "bg-ps-accent hover:bg-ps-accent-dark font-semibold transition-colors shadow-sm",

          // Footer links
          footerActionLink: "text-ps-accent font-medium hover:text-ps-accent-dark",

          // Clerk branding footer
          footer: "hidden",
        },
      }}
    />
  );
}
