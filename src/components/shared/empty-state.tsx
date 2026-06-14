import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8F2EA]">
        <Icon className="h-6 w-6 text-[#BE5103]" />
      </div>
      <div>
        <p className="text-sm font-medium text-[#332216]">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-[#8C4C1F]">{description}</p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-lg bg-[#BE5103] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#8C4C1F]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
