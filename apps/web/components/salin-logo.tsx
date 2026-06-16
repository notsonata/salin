import { cn } from "@/lib/utils";

export function SalinLogo({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-10 w-10", className)}
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect className="fill-brandDeep" height="48" rx="13" width="48" />
      <path
        className="fill-panel"
        d="M17 10.5h12.3L36 17.2v19.3c0 1.1-.9 2-2 2H17c-1.1 0-2-.9-2-2v-24c0-1.1.9-2 2-2Z"
      />
      <path
        className="fill-accentSoft"
        d="M29.2 10.5v5.4c0 .9.7 1.6 1.6 1.6H36l-6.8-7Z"
      />
      <path
        className="stroke-brandDeep"
        d="M21 24.5h9M21 29h7M21 33.5h10"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        className="stroke-accentSoft"
        d="M9.5 26.2h4.3l2-6.3 4 14.2 3-10.4 2.3 5.1h4.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <circle className="fill-review" cx="35.5" cy="35.5" r="3" />
    </svg>
  );
}
