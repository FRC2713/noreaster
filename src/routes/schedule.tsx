import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MatchCard } from "@/components/match-card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Alliance = { id: string; name: string };

type GeneratedMatch = {
  red_alliance_id: string;
  blue_alliance_id: string;
  scheduled_at: string; // ISO
};

function toISODateTime(date: Date, timeHHMM: string) {
  const [hh, mm] = timeHHMM.split(":").map((n) => Number(n));
  const d = new Date(date);
  d.setHours(hh ?? 0, mm ?? 0, 0, 0);
  return d.toISOString();
}

function addMinutes(iso: string, minutes: number) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

function inRange(iso: string, startIso: string, endIso: string) {
  const t = new Date(iso).getTime();
  return t >= new Date(startIso).getTime() && t <= new Date(endIso).getTime();
}

function overlaps(startA: string, endA: string, startB?: string, endB?: string) {
  if (!startB || !endB) return false;
  const a1 = new Date(startA).getTime();
  const a2 = new Date(endA).getTime();
  const b1 = new Date(startB).getTime();
  const b2 = new Date(endB).getTime();
  return Math.max(a1, b1) < Math.min(a2, b2);
}

export default function ScheduleRoute() {
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Single-day schedule controls
  const [day, setDay] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("17:00");
  const [intervalMin, setIntervalMin] = useState<string>("8");
  const [lunchStartTime, setLunchStartTime] = useState<string>("12:00");
  const [lunchEndTime, setLunchEndTime] = useState<string>("13:00");

  const [generated, setGenerated] = useState<GeneratedMatch[]>([]);

  const { data: allianceRows = [], isLoading: alliancesLoading, error: alliancesError } = useQuery({
    queryKey: ["alliances", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("alliances").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    setAlliances(allianceRows as Alliance[]);
  }, [allianceRows]);

  const allianceIds = useMemo(() => alliances.map((a) => a.id), [alliances]);

  function generate() {
    setStatus(null);
    setGenerated([]);
    if (!day || !startTime || !endTime || !intervalMin) {
      setStatus("Please pick the event day, start/end times, and interval.");
      return;
    }
    if (alliances.length < 2) {
      setStatus("Need at least 2 alliances.");
      return;
    }

    const startIso = toISODateTime(day, startTime);
    const endIso = toISODateTime(day, endTime);
    const lunchStartIso = lunchStartTime ? toISODateTime(day, lunchStartTime) : "";
    const lunchEndIso = lunchEndTime ? toISODateTime(day, lunchEndTime) : "";
    const slotMinutes = Math.max(1, Number(intervalMin));

    // Build time slots between start and end, skipping lunch overlap
    const slots: string[] = [];
    let cur = startIso;
    while (inRange(cur, startIso, endIso)) {
      const next = addMinutes(cur, slotMinutes);
      const overlapsLunch = overlaps(cur, next, lunchStartIso || undefined, lunchEndIso || undefined);
      if (!overlapsLunch) slots.push(cur);
      cur = next;
    }

    // Ensure equal number of matches per alliance by trimming slots
    const A = allianceIds.length;
    let totalAppearances = 2 * slots.length;
    let k = Math.floor(totalAppearances / A);
    if (A % 2 === 1 && k % 2 === 1) k--;
    if (k < 0) k = 0;
    const totalAppearancesBalanced = k * A;
    const slotsToUse = totalAppearancesBalanced / 2;

    const usableSlots = slots.slice(0, slotsToUse);

    // Greedy pairing with back-to-back avoidance and no identical consecutive pairs
    const remaining = allianceIds.map((id) => ({ id, n: k }));
    const lastSlotIndex = new Map<string, number>();
    allianceIds.forEach((id) => lastSlotIndex.set(id, -Infinity));
    let prevPair: Set<string> | null = null;

    const out: GeneratedMatch[] = [];
    let flip = false;
    for (let sIdx = 0; sIdx < usableSlots.length; sIdx++) {
      const slot = usableSlots[sIdx];
      remaining.sort((a, b) => {
        if (b.n !== a.n) return b.n - a.n;
        return (lastSlotIndex.get(a.id)! - lastSlotIndex.get(b.id)!);
      });

      let chosenA: string | null = null;
      let chosenB: string | null = null;

      outer: for (let i = 0; i < remaining.length; i++) {
        const ra = remaining[i];
        if (ra.n <= 0) continue;
        for (let j = i + 1; j < remaining.length; j++) {
          const rb = remaining[j];
          if (rb.n <= 0) continue;
          if (lastSlotIndex.get(ra.id) === sIdx - 1) continue;
          if (lastSlotIndex.get(rb.id) === sIdx - 1) continue;
          const pairSet = new Set([ra.id, rb.id]);
          if (prevPair && pairSet.size === prevPair.size) {
            let same = true;
            for (const id of pairSet) if (!prevPair.has(id)) { same = false; break; }
            if (same) continue;
          }
          chosenA = ra.id; chosenB = rb.id; break outer;
        }
      }

      if (!chosenA || !chosenB) {
        outer2: for (let i = 0; i < remaining.length; i++) {
          const ra = remaining[i];
          if (ra.n <= 0) continue;
          for (let j = i + 1; j < remaining.length; j++) {
            const rb = remaining[j];
            if (rb.n <= 0) continue;
            const pairSet = new Set([ra.id, rb.id]);
            if (prevPair && pairSet.size === prevPair.size) {
              let same = true;
              for (const id of pairSet) if (!prevPair.has(id)) { same = false; break; }
              if (same) continue;
            }
            chosenA = ra.id; chosenB = rb.id; break outer2;
          }
        }
      }

      if (!chosenA || !chosenB) {
        const ra = remaining.find((r) => r.n > 0);
        const rb = remaining.find((r) => r.n > 0 && r.id !== ra?.id);
        if (!ra || !rb) break;
        chosenA = ra.id; chosenB = rb.id;
      }

      const idxA = remaining.findIndex((r) => r.id === chosenA);
      const idxB = remaining.findIndex((r) => r.id === chosenB);
      if (idxA === -1 || idxB === -1) continue;

      out.push({
        red_alliance_id: flip ? chosenB : chosenA,
        blue_alliance_id: flip ? chosenA : chosenB,
        scheduled_at: slot,
      });
      remaining[idxA].n--; remaining[idxB].n--;
      lastSlotIndex.set(chosenA, sIdx);
      lastSlotIndex.set(chosenB, sIdx);
      prevPair = new Set([chosenA, chosenB]);
      flip = !flip;
    }

    setGenerated(out);
  }

  const saveMatches = useMutation({
    mutationFn: async (payload: any[]) => {
      const { error } = await supabase.from("matches").insert(payload);
      if (error) throw error;
      return true;
    },
    onSuccess: (_, variables) => {
      setStatus(`Saved ${variables.length} matches.`);
      void queryClient.invalidateQueries({ queryKey: ["matches", "list"] });
    },
    onError: (e: any) => {
      setStatus(`Save failed: ${e?.message ?? "Unknown error"}`);
    },
  });

  function save() {
    if (generated.length === 0) return;
    const payload = generated.map((m, idx) => ({
      name: `Match ${idx + 1}`,
      red_alliance_id: m.red_alliance_id,
      blue_alliance_id: m.blue_alliance_id,
      scheduled_at: m.scheduled_at,
      red_score: null,
      blue_score: null,
      red_coral_rp: false,
      red_auto_rp: false,
      red_barge_rp: false,
      blue_coral_rp: false,
      blue_auto_rp: false,
      blue_barge_rp: false,
    }));
    saveMatches.mutate(payload);
  }

  const stats = useMemo(() => {
    if (generated.length === 0) return null;
    const perAllianceCount = new Map<string, number>();
    const timesByAlliance = new Map<string, number[]>();

    for (const g of generated) {
      [g.red_alliance_id, g.blue_alliance_id].forEach((id) => {
        perAllianceCount.set(id, (perAllianceCount.get(id) ?? 0) + 1);
        const arr = timesByAlliance.get(id) ?? [];
        arr.push(new Date(g.scheduled_at).getTime());
        timesByAlliance.set(id, arr);
      });
    }

    const avgTurnaroundMin = new Map<string, number>();
    const minTurnaroundMin = new Map<string, number>();
    const maxTurnaroundMin = new Map<string, number>();

    for (const [id, arr] of timesByAlliance.entries()) {
      arr.sort((a, b) => a - b);
      if (arr.length <= 1) {
        avgTurnaroundMin.set(id, 0);
        minTurnaroundMin.set(id, 0);
        maxTurnaroundMin.set(id, 0);
        continue;
      }
      const gaps: number[] = [];
      for (let i = 1; i < arr.length; i++) gaps.push((arr[i] - arr[i - 1]) / 60000);
      const sum = gaps.reduce((s, x) => s + x, 0);
      avgTurnaroundMin.set(id, sum / gaps.length);
      minTurnaroundMin.set(id, Math.min(...gaps));
      maxTurnaroundMin.set(id, Math.max(...gaps));
    }

    const rows = alliances.map((a) => ({
      id: a.id,
      name: a.name,
      matches: perAllianceCount.get(a.id) ?? 0,
      avgMinutes: Number((avgTurnaroundMin.get(a.id) ?? 0).toFixed(1)),
      minMinutes: Number((minTurnaroundMin.get(a.id) ?? 0).toFixed(1)),
      maxMinutes: Number((maxTurnaroundMin.get(a.id) ?? 0).toFixed(1)),
    }));

    const totalMatches = generated.length;
    const avgMatchesPerAlliance = rows.length ? Number((totalMatches * 2 / rows.length).toFixed(2)) : 0;

    return { rows, totalMatches, avgMatchesPerAlliance };
  }, [generated, alliances]);

  function allianceName(id: string) {
    return alliances.find((a) => a.id === id)?.name ?? id;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Schedule</h1>
      {alliancesLoading && <p className="text-sm text-muted-foreground">Loading alliances…</p>}
      {alliancesError && <p className="text-sm text-red-600">{String(alliancesError)}</p>}

      {stats && (
        <div className="rounded-md border p-3">
          <div className="text-sm mb-2">
            <span className="mr-4">Generated Matches: <strong>{stats.totalMatches}</strong></span>
            <span>Avg matches per alliance: <strong>{stats.avgMatchesPerAlliance}</strong></span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left opacity-70">
                <tr>
                  <th className="py-1 pr-4">Alliance</th>
                  <th className="py-1 pr-4">Matches</th>
                  <th className="py-1 pr-4">Avg Turnaround (min)</th>
                  <th className="py-1 pr-4">Shortest (min)</th>
                  <th className="py-1">Longest (min)</th>
                </tr>
              </thead>
              <tbody>
                {stats.rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-1 pr-4">{r.name}</td>
                    <td className="py-1 pr-4">{r.matches}</td>
                    <td className="py-1 pr-4">{r.avgMinutes}</td>
                    <td className="py-1 pr-4">{r.minMinutes}</td>
                    <td className="py-1">{r.maxMinutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid gap-3 max-w-3xl">
        <div className="grid sm:grid-cols-3 gap-6 items-start">
          <div>
            <label className="text-sm font-medium mb-1 block">Event Day</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal">
                  {day ? day.toDateString() : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="p-0">
                <Calendar mode="single" selected={day} onSelect={setDay} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Start Time</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">End Time</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full rounded-md border px-3 py-2" />
          </div>
        </div>
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="sm:col-span-1">
            <label className="text-sm font-medium">Minutes Between Matches</label>
            <input type="number" min={1} value={intervalMin} onChange={(e) => setIntervalMin(e.target.value)} className="w-full rounded-md border px-3 py-2" />
          </div>
          <div className="sm:col-span-1">
            <label className="text-sm font-medium">Lunch Start (optional)</label>
            <input type="time" value={lunchStartTime} onChange={(e) => setLunchStartTime(e.target.value)} className="w-full rounded-md border px-3 py-2" />
          </div>
          <div className="sm:col-span-1">
            <label className="text-sm font-medium">Lunch End (optional)</label>
            <input type="time" value={lunchEndTime} onChange={(e) => setLunchEndTime(e.target.value)} className="w-full rounded-md border px-3 py-2" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={generate}>Generate</Button>
          <Button variant="secondary" onClick={() => setGenerated([])}>Clear</Button>
          <Button variant="default" onClick={save} disabled={generated.length === 0}>Save</Button>
          {status && <span className="text-sm opacity-80">{status}</span>}
        </div>
      </div>

      <div className="grid gap-3">
        {generated.length === 0 ? (
          <p className="text-muted-foreground">No generated matches yet.</p>
        ) : (
          <ul className="grid gap-2">
            {generated.map((m, i) => (
              <li key={`${m.scheduled_at}-${i}`}>
                <MatchCard
                  scheduledAt={m.scheduled_at}
                  redName={allianceName(m.red_alliance_id)}
                  blueName={allianceName(m.blue_alliance_id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}