// no React import needed for React 17+ with jsx runtime

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
  const textClass = size === "lg" ? "text-2xl md:text-3xl" : "text-sm";
  const cellPad = size === "lg" ? "py-4 px-4" : "py-1 pr-3";

  return (
    <div className={className}>
      <table className={`w-full ${textClass}`}>
        <thead className={size === "lg" ? "sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" : "opacity-70 text-left"}>
          <tr className={size === "lg" ? "text-left border-b" : "text-left"}>
            {showRank && <th className={cellPad}>Rank</th>}
            <th className={cellPad}>Alliance</th>
            <th className={cellPad}>Played</th>
            {showWLT && <th className={cellPad}>W-L-T</th>}
            <th className={cellPad}>Avg RP</th>
            <th className={cellPad.replace("pr-3", "")}>Avg Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={r.id} className={size === "lg" ? `border-b ${idx % 2 === 0 ? "bg-muted/30" : ""}` : "border-t"}>
              {showRank && <td className={cellPad + " font-medium"}>{r.rank ?? idx + 1}</td>}
              <td className={cellPad}>{r.name}</td>
              <td className={cellPad}>{r.played}</td>
              {showWLT && <td className={cellPad}>{(r.wins ?? 0)}-{(r.losses ?? 0)}-{(r.ties ?? 0)}</td>}
              <td className={cellPad}>{r.avgRp.toFixed(3)}</td>
              <td className={cellPad.replace("pr-3", "")}>{r.avgScore.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

