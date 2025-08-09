import type { ReactNode } from "react";

export function SectionHeader({
  title,
  actions,
  className,
}: {
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {actions}
    </div>
  );
}

