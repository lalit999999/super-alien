import { IntegrationStatus } from "./integration-status";
import { Loader2 } from "lucide-react";

type Props = {
  icon: React.ReactNode;
  title: string;
  description: string;
  connected: boolean;
  connecting?: boolean;
  onConnect: () => void;
};

export function IntegrationCard({
  icon,
  title,
  description,
  connected,
  connecting,
  onConnect,
}: Props) {
  return (
    <div
      className={`rounded-2xl border p-6 transition-all ${
        connected
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-[#E7D8C8] bg-white hover:border-[#BE5103]/30 hover:shadow-sm"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8F2EA] border border-[#E7D8C8]">
          {icon}
        </div>
        <IntegrationStatus connected={connected} loading={connecting} />
      </div>

      <h3 className="text-base font-semibold text-[#332216]">{title}</h3>
      <p className="mt-1 text-sm text-[#544823]">{description}</p>

      <div className="mt-5">
        {connected ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Successfully connected
          </div>
        ) : (
          <button
            onClick={onConnect}
            disabled={connecting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#BE5103] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8C4C1F] disabled:opacity-60"
          >
            {connecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {connecting ? "Connecting…" : `Connect ${title}`}
          </button>
        )}
      </div>
    </div>
  );
}
