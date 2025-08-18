// no React import needed for React 17+ with jsx runtime
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type RankingRow = {
  id: string;
  name: string;
  played: number;
  avgRp: number;
  avgScore: number;
  wins?: number;
  losses?: number;
  ties?: number;
  rank?: number;
};

export function RankingsTable({
  rows,
  showWLT = false,
  showRank = true,
  size = "sm",
  className,
}: {
  rows: RankingRow[];
  showWLT?: boolean;
  showRank?: boolean;
  size?: "sm" | "lg";
  className?: string;
}) {
  const cellPad = size === "lg" ? "py-4 px-4" : "py-1 pr-3";

  return (
    <div className={className}>
      <Table>
        <TableHeader className={size === "lg" ? "sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" : "opacity-70"}>
          <TableRow className={size === "lg" ? "border-b" : ""}>
            {showRank && <TableHead className={cellPad}>Rank</TableHead>}
            <TableHead className={cellPad}>Alliance</TableHead>
            <TableHead className={cellPad}>Played</TableHead>
            {showWLT && <TableHead className={cellPad}>W-L-T</TableHead>}
            <TableHead className={cellPad}>Avg RP</TableHead>
            <TableHead className={cellPad.replace("pr-3", "")}>Avg Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, idx) => (
            <TableRow key={r.id} className={size === "lg" ? `${idx % 2 === 0 ? "bg-muted/30" : ""}` : "border-t"}>
              {showRank && <TableCell className={cellPad + " font-medium"}>{r.rank ?? idx + 1}</TableCell>}
              <TableCell className={cellPad}>{r.name}</TableCell>
              <TableCell className={cellPad}>{r.played}</TableCell>
              {showWLT && <TableCell className={cellPad}>{(r.wins ?? 0)}-{(r.losses ?? 0)}-{(r.ties ?? 0)}</TableCell>}
              <TableCell className={cellPad}>{r.avgRp.toFixed(3)}</TableCell>
              <TableCell className={cellPad.replace("pr-3", "")}>{r.avgScore.toFixed(1)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

