import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SectionCard({
  title,
  right,
  children,
  className,
}: {
  title: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {right}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

