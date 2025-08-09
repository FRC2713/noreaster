import { useEffect, useMemo, useState } from "react";
import { DndContext, useDroppable, useDraggable, rectIntersection } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { supabase } from "../supabase/client";
import { Button } from "@/components/ui/button";
import { RobotImage } from "@/components/robot-image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Types
interface Team {
  id: string;
  number: number;
  name: string;
  robot_image_url: string | null;
}

// AllianceTeam interface removed; hydrated via query results

interface Alliance {
  id: string;
  name: string;
  created_at?: string;
  teams: (Team | null)[]; // length 4
}

// DnD components
function DroppableArea({ id, className, children }: { id: string; className?: string; children?: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`${className ?? ""} ${isOver ? "ring-2 ring-primary" : ""}`.trim()}>
      {children}
    </div>
  );
}

function DraggableTeamCard({ team }: { team: Team }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `team:${team.id}` });
  const style = transform
    ? ({ transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } as React.CSSProperties)
    : ({} as React.CSSProperties);
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing select-none border rounded-md p-2 bg-background hover:bg-accent ${
        isDragging ? "opacity-70" : ""
      }`}
      title={`${team.number} ${team.name}`}
    >
      <div className="flex items-center gap-3">
        <div className="size-12 items-center justify-center">
          <RobotImage team={team} className="rounded overflow-hidden bg-muted" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold leading-tight">{team.number}</div>
          <div className="text-xs text-muted-foreground truncate">{team.name}</div>
        </div>
      </div>
    </div>
  );
}

export default function AlliancesRoute() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [schemaWarning, setSchemaWarning] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: teamRows = [],
    isLoading: teamsLoading,
    error: teamsError,
  } = useQuery({
    queryKey: ["teams", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, number, name, robot_image_url");
      if (error) throw error;
      return data ?? [];
    },
  });

  const {
    data: allianceRows = [],
    isLoading: alliancesLoading,
    error: alliancesError,
  } = useQuery({
    queryKey: ["alliances", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alliances")
        .select("id, name, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allianceTeamsRows = [] } = useQuery({
    queryKey: ["alliance_teams", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alliance_teams")
        .select("id, alliance_id, team_id, slot");
      if (error) throw error;
      return data ?? [];
    },
    // If the table is missing, the query will error; we handle schema warning below
  });

  useEffect(() => {
    if (alliancesError) {
      const msg = String((alliancesError as any)?.message ?? alliancesError);
      if (msg.includes("relation") || msg.includes("42P01")) {
        setSchemaWarning("Alliances tables missing. Create tables 'alliances' and 'alliance_teams' to enable persistence.");
      }
    }
  }, [alliancesError]);

  // Hydrate local state when queries resolve
  useEffect(() => {
    setTeams(teamRows);
    const alliancesData: Alliance[] = (allianceRows as any[]).map((a: any) => ({
      id: a.id,
      name: a.name,
      created_at: a.created_at,
      teams: [null, null, null, null],
    }));
    const teamMap = new Map(teamRows.map((t) => [t.id, t]));
    (allianceTeamsRows as any[]).forEach((at: any) => {
      const idx = alliancesData.findIndex((a) => a.id === at.alliance_id);
      if (idx !== -1 && at.slot >= 1 && at.slot <= 4) {
        alliancesData[idx].teams[at.slot - 1] = teamMap.get(at.team_id) ?? null;
      }
    });
    setAlliances(alliancesData);
  }, [teamRows, allianceRows, allianceTeamsRows]);

  const loading = teamsLoading || alliancesLoading;
  const error = teamsError ? String(teamsError as any) : alliancesError ? String(alliancesError as any) : null;

  // Mutations
  const createAllianceMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("alliances")
        .insert({ name })
        .select("id, name, created_at")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setAlliances((prev) => [...prev, { id: data.id, name: data.name, created_at: data.created_at, teams: [null, null, null, null] }]);
      void queryClient.invalidateQueries({ queryKey: ["alliances", "list"] });
    },
    onError: () => {
      setSchemaWarning("Failed to create alliance. Ensure table 'alliances' exists and RLS allows authenticated inserts.");
    },
  });

  const deleteAllianceMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("alliance_teams").delete().eq("alliance_id", id);
      const { error } = await supabase.from("alliances").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      setAlliances((prev) => prev.filter((a) => a.id !== id));
      void queryClient.invalidateQueries({ queryKey: ["alliances", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["alliance_teams", "list"] });
    },
    onError: (e: any) => {
      setSchemaWarning("Failed to delete alliance. " + (e?.message ?? "Unknown error"));
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (vars: { teamId: string; allianceId: string | null; slot: number | null }) => {
      const { teamId, allianceId, slot } = vars;
      await supabase.from("alliance_teams").delete().eq("team_id", teamId);
      if (allianceId && slot) {
        const { error } = await supabase.from("alliance_teams").insert({ alliance_id: allianceId, team_id: teamId, slot });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["alliance_teams", "list"] });
    },
  });

  const assignedTeamIds = useMemo(
    () => new Set(alliances.flatMap((a) => a.teams.filter(Boolean).map((t) => (t as Team).id))),
    [alliances]
  );
  const availableTeams = useMemo(() => teams.filter((t) => !assignedTeamIds.has(t.id)), [teams, assignedTeamIds]);

  function createAlliance() {
    const defaultName = `Alliance ${alliances.length + 1}`;
    createAllianceMutation.mutate(defaultName);
  }

  function deleteAlliance(id: string) {
    deleteAllianceMutation.mutate(id);
  }

  function persistAssignment(teamId: string, allianceId: string | null, slot: number | null) {
    assignMutation.mutate({ teamId, allianceId, slot });
  }

  function onDragEnd(ev: DragEndEvent) {
    const activeId = (ev.active?.id as string) ?? "";
    const overId = (ev.over?.id as string) ?? "";
    if (!activeId || !activeId.startsWith("team:")) return;
    const teamId = activeId.slice("team:".length);

    if (!overId) return;

    // Dropping back to available pool
    if (overId === "available") {
      setAlliances((prev) => {
        const clone = structuredClone(prev) as Alliance[];
        clone.forEach((a) => {
          for (let i = 0; i < 4; i++) if (a.teams[i]?.id === teamId) a.teams[i] = null;
        });
        return clone;
      });
      void persistAssignment(teamId, null, null);
      return;
    }

    // Dropping onto an alliance slot id format: alliance:{allianceId}:slot:{n}
    if (overId.startsWith("alliance:")) {
      const parts = overId.split(":");
      const allianceId = parts[1];
      const slot = Number(parts[3] ?? "0");
      if (!allianceId || !(slot >= 1 && slot <= 4)) return;

      setAlliances((prev) => {
        const clone = structuredClone(prev) as Alliance[];
        // Remove from any current slot
        clone.forEach((a) => {
          for (let i = 0; i < 4; i++) if (a.teams[i]?.id === teamId) a.teams[i] = null;
        });
        // If target slot occupied, move that team back to available by clearing
        const idx = clone.findIndex((a) => a.id === allianceId);
        if (idx !== -1) clone[idx].teams[slot - 1] = teams.find((t) => t.id === teamId) ?? null;
        return clone;
      });
      void persistAssignment(teamId, allianceId, slot);
      return;
    }
  }

  if (loading) return <p>Loading alliances...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <DndContext onDragEnd={onDragEnd} collisionDetection={rectIntersection}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Teams</h2>
          </div>
          <DroppableArea id="available" className="min-h-[200px] rounded-md border p-3">
            <div className="grid gap-3">
              {availableTeams.map((t) => (
                <DraggableTeamCard key={t.id} team={t} />
              ))}
              {availableTeams.length === 0 && (
                <div className="text-sm text-muted-foreground">All teams are assigned.</div>
              )}
            </div>
          </DroppableArea>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Alliances</h2>
            <Button onClick={createAlliance}>New Alliance</Button>
          </div>
          {schemaWarning && (
            <div className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              {schemaWarning}
            </div>
          )}
          <div className="grid gap-4">
            {alliances.length === 0 && (
              <div className="text-sm text-muted-foreground">No alliances yet. Create one to begin.</div>
            )}
            {alliances.map((a) => (
              <div key={a.id} className="rounded-md border">
                <div className="px-3 py-2 border-b font-medium flex items-center justify-between gap-3">
                  <a href={`/alliances/${a.id}`} className="hover:underline">{a.name}</a>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {a.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the alliance and unassign its teams. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteAlliance(a.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="grid grid-cols-2 gap-3 p-3">
                  {a.teams.map((t, idx) => (
                    <DroppableArea
                      key={`${a.id}:${idx + 1}`}
                      id={`alliance:${a.id}:slot:${idx + 1}`}
                      className="min-h-24 rounded-md border bg-muted/30 grid place-items-center"
                    >
                      <div className="h-full w-full grid place-items-center">
                        {t ? (
                          <DraggableTeamCard team={t} />
                        ) : (
                          <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">
                            Slot {idx + 1}
                          </div>
                        )}
                      </div>
                    </DroppableArea>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
}