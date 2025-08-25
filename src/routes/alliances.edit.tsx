import { DndContext, useDroppable, useDraggable, rectIntersection } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { supabase } from "../supabase/client";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAlliancesPolling } from "@/lib/use-alliances-polling";
import { AlliancesStatus } from "@/components/alliances-status";
import { RobotImage } from "@/components/robot-image";
import type { DatabaseTeam } from "@/types";

// DnD components
function DroppableArea({ id, className, children }: { id: string; className?: string; children?: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`${className ?? ""} ${isOver ? "ring-2 ring-primary" : ""}`.trim()}>
      {children}
    </div>
  );
}

function DraggableTeamCard({ team }: { team: DatabaseTeam }) {
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
      className={`cursor-grab active:cursor-grabbing select-none border rounded-md p-4 bg-background hover:bg-accent w-full h-full min-h-[80px] max-w-[300px] ${
        isDragging ? "opacity-70" : ""
      }`}
      title={`${team.number} ${team.name}`}
    >
      <div className="flex items-center gap-3 h-full">
        <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
          <RobotImage team={team} className="w-full h-full" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-tight text-lg">{team.number}</div>
          <div className="text-sm text-muted-foreground truncate">{team.name}</div>
        </div>
      </div>
    </div>
  );
}

export default function AlliancesEditRoute() {
  const { alliances, teams, isLoading, error } = useAlliancesPolling();
  const queryClient = useQueryClient();

  // Get user authentication status
  const { data: authData } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return { user };
    },
  });

  const user = authData?.user;

  const availableTeams = teams.filter(team => {
    const assignedTeamIds = new Set(
      alliances.flatMap(a => a.teams.filter(Boolean).map(t => (t as DatabaseTeam).id))
    );
    return !assignedTeamIds.has(team.id);
  });

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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["alliances", "polling"] });
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
      void persistAssignment(teamId, null, null);
      return;
    }

    // Dropping onto an alliance slot id format: alliance:{allianceId}:slot:{n}
    if (overId.startsWith("alliance:")) {
      const parts = overId.split(":");
      const allianceId = parts[1];
      const slot = Number(parts[3] ?? "0");
      if (!allianceId || !(slot >= 1 && slot <= 4)) return;

      void persistAssignment(teamId, allianceId, slot);
      return;
    }
  }

  if (isLoading) return <p>Loading alliances...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <DndContext onDragEnd={onDragEnd} collisionDetection={rectIntersection}>
      <div className="space-y-6">
        {/* Teams section at the top */}
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

        {/* Alliances section below in two columns */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Alliances</h2>
            {user && (
              <Button onClick={createAlliance}>New Alliance</Button>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {alliances.length === 0 && (
              <div className="text-sm text-muted-foreground col-span-full">No alliances yet. Create one to begin.</div>
            )}
            {alliances.map((a) => (
              <Card key={a.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Alliance emblem in circular div */}
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {a.emblem_image_url ? (
                          <img 
                            src={a.emblem_image_url} 
                            alt={`${a.name} emblem`} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-xs text-muted-foreground">
                            {a.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-base">
                        <Link to={`/alliances/${a.id}`} className="hover:underline">{a.name}</Link>
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-3">
                    {a.teams.map((t: DatabaseTeam | null, idx: number) => (
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
