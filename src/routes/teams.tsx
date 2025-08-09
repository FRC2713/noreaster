import { supabase } from "../supabase/client";
import { TeamCard } from "@/components/team-card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

import { Link } from "react-router";

// Local typing not needed since we don't annotate with Team directly

export default function Component() {
  const { data: teams = [], isLoading, error } = useQuery({
    queryKey: ["teams", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, number, name, robot_image_url")
        .order("number", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <p>Loading teams...</p>;
  if (error) return <p className="text-red-600">Error: {String(error)}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Teams</h1>
        <Link to="/teams/new"><Button>New Team</Button></Link>
      </div>
      {teams.length === 0 ? (
        <p className="text-muted-foreground">No teams yet.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <li key={t.id}>
              <Link to={`/teams/${t.id}`} className="block">
                <TeamCard team={t} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}