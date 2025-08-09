import { useState } from "react";
import { supabase } from "../supabase/client";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function generateRandomId(length = 8) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function Component() {
  const [teamNumber, setTeamNumber] = useState("");
  const [teamName, setTeamName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const createTeam = useMutation({
    mutationFn: async (vars: { number: number; name: string; file: File | null }) => {
      const { number, name, file } = vars;
      let publicUrl: string | null = null;
      if (file) {
        const ext = (file.name.split(".").pop() || "png").toLowerCase();
        const objectPath = `images/${Date.now()}_${generateRandomId(6)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("robots")
          .upload(objectPath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("robots").getPublicUrl(objectPath);
        publicUrl = data.publicUrl;
      }
      const { error: insertError } = await supabase
        .from("teams")
        .insert({ number, name, robot_image_url: publicUrl });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teams", "list"] });
      setStatus("Team created!");
      setTeamNumber("");
      setTeamName("");
      setFile(null);
      (document.getElementById("robot-file") as HTMLInputElement | null)?.value &&
        ((document.getElementById("robot-file") as HTMLInputElement).value = "");
    },
    onError: (err: any) => {
      setStatus(`Error: ${err?.message || "Failed to create team."}`);
    },
    onSettled: () => setIsSubmitting(false),
  });

   async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    const parsedNumber = Number(teamNumber);
    if (!parsedNumber || parsedNumber <= 0) {
      setStatus("Enter a valid team number.");
      return;
    }
    if (!teamName.trim()) {
      setStatus("Enter a team name.");
      return;
    }

    setIsSubmitting(true);
    createTeam.mutate({ number: parsedNumber, name: teamName.trim(), file });
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Create Team</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Team Number</label>
          <input
            type="number"
            min={1}
            required
            value={teamNumber}
            onChange={(e) => setTeamNumber(e.target.value)}
            className="w-full rounded-md border px-3 py-2 outline-hidden"
            placeholder="e.g. 6328"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Team Name</label>
          <input
            type="text"
            required
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full rounded-md border px-3 py-2 outline-hidden"
            placeholder="Mechanical Advantage"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Robot Image (optional)</label>
          <input
            id="robot-file"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-md border px-3 py-2 file:mr-3 file:rounded-md file:border file:px-3 file:py-1.5 file:bg-background"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Saving..." : "Create Team"}
          </Button>
          {status && <span className="text-sm opacity-80">{status}</span>}
        </div>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        Note: Ensure a Supabase Storage bucket named <strong>robots</strong> exists and is public, and that the
        <strong> teams</strong> table has appropriate RLS policies for inserts.
      </p>
    </div>
  );
}