"use client";

import { SignIn } from "@clerk/nextjs";
import { useTheme } from "next-themes";

const LIGHT = {
  colorPrimary: "#BE5103",
  colorBackground: "#FFFDF8",
  colorForeground: "#332216",
  colorMutedForeground: "#8C4C1F",
  colorInput: "#F8F2EA",
  colorInputForeground: "#332216",
  colorNeutral: "#332216",
  colorBorder: "#E7D8C8",
  colorDanger: "#dc2626",
} as const;

const DARK = {
  colorPrimary: "#D97706",
  colorBackground: "#111111",
  colorForeground: "#F5F5F5",
  colorMutedForeground: "#A1A1AA",
  colorInput: "#181818",
  colorInputForeground: "#F5F5F5",
  colorNeutral: "#F5F5F5",
  colorBorder: "#2A2A2A",
  colorDanger: "#f87171",
} as const;

export default function SignInPage() {
  const { resolvedTheme } = useTheme();
  const vars = resolvedTheme === "dark" ? DARK : LIGHT;

  return (
    <SignIn
      appearance={{
        options: {
          elevation: "flush",
          logoPlacement: "none",
        },
        variables: {
          ...vars,
          borderRadius: "0.5rem",
          fontFamily: "inherit",
        },
        elements: {
          socialButtonsBlockButton:
            "border-ps-border bg-ps-surface text-ps-text font-medium hover:bg-ps-surface-2 transition-colors",
          socialButtonsBlockButtonText: "font-medium text-ps-text",
          formFieldLabel: "text-sm font-medium text-ps-text",
          formButtonPrimary:
            "bg-ps-accent hover:bg-ps-accent-dark font-semibold transition-colors shadow-sm",
          footerActionLink: "text-ps-accent font-medium hover:text-ps-accent-dark",
          footer: "hidden",
        },
      }}
    />
  );
}
