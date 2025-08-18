import { useMemo } from "react";
import { DndContext, useDroppable, useDraggable, rectIntersection } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { supabase } from "../supabase/client";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useAlliancesStore } from "@/lib/alliances-store";
import { useAlliancesPolling } from "@/lib/use-alliances-polling";
import { AlliancesStatus } from "@/components/alliances-status";

// DnD components
function DroppableArea({ id, className, children }: { id: string; className?: string; children?: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`${className ?? ""} ${isOver ? "ring-2 ring-primary" : ""}`.trim()}>
      {children}
    </div>
  );
}

function DraggableTeamCard({ team }: { team: { id: string; number: number; name: string; robot_image_url: string | null } }) {
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
          <div className="font-semibold leading-tight">{team.number}</div>
          <div className="text-xs text-muted-foreground truncate">{team.name}</div>
        
      </div>
    </div>
  );
}

export default function AlliancesRoute() {
  const { alliances, teams, isLoading, error } = useAlliancesPolling();
  const { getAvailableTeams, assignTeamToSlot, addAlliance, removeAlliance } = useAlliancesStore();
  const queryClient = useQueryClient();

  const availableTeams = useMemo(() => getAvailableTeams(), [getAvailableTeams]);

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
      const newAlliance = { 
        id: data.id, 
        name: data.name, 
        created_at: data.created_at, 
        teams: [null, null, null, null] 
      };
      addAlliance(newAlliance);
      void queryClient.invalidateQueries({ queryKey: ["alliances", "polling"] });
    },
    onError: () => {
      // Error handling is done by the store
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
      removeAlliance(id);
      void queryClient.invalidateQueries({ queryKey: ["alliances", "polling"] });
      void queryClient.invalidateQueries({ queryKey: ["alliance_teams", "polling"] });
    },
    onError: (e: Error) => {
      // Error handling is done by the store
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
      void queryClient.invalidateQueries({ queryKey: ["alliance_teams", "polling"] });
    },
  });

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
      assignTeamToSlot(teamId, null, null);
      void persistAssignment(teamId, null, null);
      return;
    }

    // Dropping onto an alliance slot id format: alliance:{allianceId}:slot:{n}
    if (overId.startsWith("alliance:")) {
      const parts = overId.split(":");
      const allianceId = parts[1];
      const slot = Number(parts[3] ?? "0");
      if (!allianceId || !(slot >= 1 && slot <= 4)) return;

      assignTeamToSlot(teamId, allianceId, slot);
      void persistAssignment(teamId, allianceId, slot);
      return;
    }
  }

  if (isLoading) return <p>Loading alliances...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <DndContext onDragEnd={onDragEnd} collisionDetection={rectIntersection}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Teams</h2>
            <AlliancesStatus />
          </div>
          <Card>
            <CardContent className="p-3">
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
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Alliances</h2>
            <Button onClick={createAlliance}>New Alliance</Button>
          </div>
          <div className="grid gap-4">
            {alliances.length === 0 && (
              <div className="text-sm text-muted-foreground">No alliances yet. Create one to begin.</div>
            )}
            {alliances.map((a: { id: string; name: string; created_at?: string; teams: ({ id: string; number: number; name: string; robot_image_url: string | null } | null)[] }) => (
              <Card key={a.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">
                      <Link to={`/alliances/${a.id}`} className="hover:underline">{a.name}</Link>
                    </CardTitle>
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
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-3">
                    {a.teams.map((t: { id: string; number: number; name: string; robot_image_url: string | null } | null, idx: number) => (
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
}