import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type Props = {
  connected: boolean;
  loading?: boolean;
};

export function IntegrationStatus({ connected, loading }: Props) {
  if (loading) {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-[#E7D8C8] bg-[#F8F2EA] px-3 py-1 text-xs font-medium text-[#8C4C1F]">
        <Loader2 className="h-3 w-3 animate-spin" />
        Connecting…
      </span>
    );
  }

  return (
    <span
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        connected
          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
          : "border-[#E7D8C8] bg-[#F8F2EA] text-[#8C4C1F]"
      }`}
    >
      {connected ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}
