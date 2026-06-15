import Link from "next/link";

type Props = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
};

export function OnboardingEmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center px-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8F2EA] border border-[#E7D8C8]">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-[#332216]">{title}</p>
        <p className="mt-1 text-xs text-[#544823] max-w-xs">{description}</p>
      </div>
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="rounded-xl bg-[#BE5103] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8C4C1F]"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="rounded-xl bg-[#BE5103] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8C4C1F]"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
