import { CheckCircle, Circle } from "lucide-react";

type Props = {
  gmailConnected: boolean;
  calendarConnected: boolean;
};

export function IntegrationProgress({ gmailConnected, calendarConnected }: Props) {
  const count = [gmailConnected, calendarConnected].filter(Boolean).length;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="h-2 w-24 rounded-full bg-[#E7D8C8] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#BE5103] transition-all duration-500"
            style={{ width: `${(count / 2) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-[#544823]">{count}/2 Connected</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5 text-xs">
          {gmailConnected ? (
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-[#E7D8C8]" />
          )}
          <span className={gmailConnected ? "text-emerald-600 font-medium" : "text-[#8C4C1F]"}>
            Gmail
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {calendarConnected ? (
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-[#E7D8C8]" />
          )}
          <span className={calendarConnected ? "text-emerald-600 font-medium" : "text-[#8C4C1F]"}>
            Calendar
          </span>
        </div>
      </div>
    </div>
  );
}
