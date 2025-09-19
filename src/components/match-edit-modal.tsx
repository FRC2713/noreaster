import { useEffect, useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { useMatch } from '@/lib/use-match';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AllianceRPToggles } from '@/components/alliance-rp-toggles';

interface MatchEditModalProps {
  matchId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MatchRow = {
  id: string;
  name: string | null;
  red_alliance_id: string;
  blue_alliance_id: string;
  scheduled_at: string | null;
  red_score: number | null;
  blue_score: number | null;
  red_auto_score: number | null;
  blue_auto_score: number | null;
  red_coral_rp: boolean;
  red_auto_rp: boolean;
  red_barge_rp: boolean;
  blue_coral_rp: boolean;
  blue_auto_rp: boolean;
  blue_barge_rp: boolean;
};

function MatchEditForm({
  matchId,
  onClose,
}: {
  matchId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: currentMatch, isLoading, error } = useMatch(matchId);

  const [redScore, setRedScore] = useState<string>('');
  const [blueScore, setBlueScore] = useState<string>('');
  const [redAutoScore, setRedAutoScore] = useState<string>('');
  const [blueAutoScore, setBlueAutoScore] = useState<string>('');
  const [redCoral, setRedCoral] = useState(false);
  const [redAlgae, setRedAlgae] = useState(false);
  const [redBarge, setRedBarge] = useState(false);
  const [blueCoral, setBlueCoral] = useState(false);
  const [blueAlgae, setBlueAlgae] = useState(false);
  const [blueBarge, setBlueBarge] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const clearFields = () => {
    setRedScore('');
    setBlueScore('');
    setRedAutoScore('');
    setBlueAutoScore('');
    setRedCoral(false);
    setRedAlgae(false);
    setRedBarge(false);
    setBlueCoral(false);
    setBlueAlgae(false);
    setBlueBarge(false);
    setStatus(null);
  };

  useEffect(() => {
    if (!currentMatch) return;
    setRedScore(
      currentMatch.red_score != null ? String(currentMatch.red_score) : ''
    );
    setBlueScore(
      currentMatch.blue_score != null ? String(currentMatch.blue_score) : ''
    );
    setRedAutoScore(
      currentMatch.red_auto_score != null
        ? String(currentMatch.red_auto_score)
        : ''
    );
    setBlueAutoScore(
      currentMatch.blue_auto_score != null
        ? String(currentMatch.blue_auto_score)
        : ''
    );
    setRedCoral(!!currentMatch.red_coral_rp);
    setRedAlgae(!!currentMatch.red_auto_rp);
    setRedBarge(!!currentMatch.red_barge_rp);
    setBlueCoral(!!currentMatch.blue_coral_rp);
    setBlueAlgae(!!currentMatch.blue_auto_rp);
    setBlueBarge(!!currentMatch.blue_barge_rp);
  }, [currentMatch]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!matchId) return;
      const payload: Partial<MatchRow> = {
        red_score: redScore ? Number(redScore) : null,
        blue_score: blueScore ? Number(blueScore) : null,
        red_auto_score: redAutoScore ? Number(redAutoScore) : null,
        blue_auto_score: blueAutoScore ? Number(blueAutoScore) : null,
        red_coral_rp: redCoral,
        red_auto_rp: redAlgae,
        red_barge_rp: redBarge,
        blue_coral_rp: blueCoral,
        blue_auto_rp: blueAlgae,
        blue_barge_rp: blueBarge,
      };
      const { error } = await supabase
        .from('matches')
        .update(payload)
        .eq('id', matchId);
      if (error) throw error;
    },
    onSuccess: () => {
      setStatus('Saved.');
      void queryClient.invalidateQueries({ queryKey: ['matches', 'polling'] });
      void queryClient.invalidateQueries({
        queryKey: ['matches', 'byId', matchId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['match-details', matchId],
      });
      // Close modal after successful save
      setTimeout(() => onClose(), 1000);
    },
    onError: (e: Error) =>
      setStatus(`Save failed: ${e?.message ?? 'Unknown error'}`),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Loading match…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Error: {String(error)}</p>
      </div>
    );
  }

  if (!currentMatch) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Match not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4 text-lg">
        <div className="space-y-2 rounded-md border border-red-200 bg-red-50/30 p-4">
          <Label htmlFor="red-score" className="text-base font-medium">
            Red Score
          </Label>
          <Input
            id="red-score"
            type="number"
            value={redScore}
            onChange={e => setRedScore(e.target.value)}
            className="text-lg border-red-200 focus:border-red-400"
          />
        </div>
        <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50/30 p-4">
          <Label htmlFor="blue-score" className="text-base font-medium">
            Blue Score
          </Label>
          <Input
            id="blue-score"
            type="number"
            value={blueScore}
            onChange={e => setBlueScore(e.target.value)}
            className="text-lg border-blue-200 focus:border-blue-400"
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 text-lg">
        <div className="space-y-2 rounded-md border border-red-200 bg-red-50/30 p-4">
          <Label htmlFor="red-auto-score" className="text-base font-medium">
            Red Auto Score
          </Label>
          <Input
            id="red-auto-score"
            type="number"
            value={redAutoScore}
            onChange={e => setRedAutoScore(e.target.value)}
            className="text-lg border-red-200 focus:border-red-400"
          />
        </div>
        <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50/30 p-4">
          <Label htmlFor="blue-auto-score" className="text-base font-medium">
            Blue Auto Score
          </Label>
          <Input
            id="blue-auto-score"
            type="number"
            value={blueAutoScore}
            onChange={e => setBlueAutoScore(e.target.value)}
            className="text-lg border-blue-200 focus:border-blue-400"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <AllianceRPToggles
          title="Red Alliance RP"
          coral={redCoral}
          auto={redAlgae}
          barge={redBarge}
          onCoralChange={setRedCoral}
          onAutoChange={setRedAlgae}
          onBargeChange={setRedBarge}
          className="border-red-200 bg-red-50/30"
        />
        <AllianceRPToggles
          title="Blue Alliance RP"
          coral={blueCoral}
          auto={blueAlgae}
          barge={blueBarge}
          onCoralChange={setBlueCoral}
          onAutoChange={setBlueAlgae}
          onBargeChange={setBlueBarge}
          className="border-blue-200 bg-blue-50/30"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
          <Button
            variant="outline"
            onClick={clearFields}
            disabled={saveMutation.isPending}
          >
            Clear
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saveMutation.isPending}
          >
            Cancel
          </Button>
          {status && <span className="text-sm opacity-80">{status}</span>}
        </div>
      </div>
    </div>
  );
}

export function MatchEditModal({
  matchId,
  open,
  onOpenChange,
}: MatchEditModalProps) {
  const isMobile = useIsMobile();

  if (!matchId) return null;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>Edit Match</SheetTitle>
          </SheetHeader>
          <div className="mt-6 overflow-y-auto">
            <MatchEditForm
              matchId={matchId}
              onClose={() => onOpenChange(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Match</DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          <MatchEditForm
            matchId={matchId}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
