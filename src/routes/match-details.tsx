import { useState } from 'react';
import { useParams } from 'react-router';
import { useMatchDetails } from '@/lib/use-match-details';
import { useAuth } from '@/lib/use-auth';
import { CompletedMatchDetails } from '@/components/completed-match-details';
import { UpcomingMatchDetails } from '@/components/upcoming-match-details';
import { MatchDetailsSkeleton } from '@/components/match-details-skeleton';
import { MatchEditModal } from '@/components/match-edit-modal';

export default function MatchDetailsRoute() {
  const { user } = useAuth();
  const { matchId } = useParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: matchDetails, isLoading, error } = useMatchDetails(matchId!);

  if (!matchId) {
    return (
      <div className="min-h-dvh w-full p-4 md:p-8 lg:p-10">
        <p className="text-red-600">Missing match id</p>
      </div>
    );
  }

  if (isLoading) {
    return <MatchDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-dvh w-full p-4 md:p-8 lg:p-10">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-600">Error: {String(error)}</p>
        </div>
      </div>
    );
  }

  if (!matchDetails) {
    return (
      <div className="min-h-dvh w-full p-4 md:p-8 lg:p-10">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Match not found</p>
        </div>
      </div>
    );
  }

  const { match, redAllianceName, blueAllianceName, redSlots, blueSlots } =
    matchDetails;
  const hasScores = match.red_score !== null && match.blue_score !== null;

  // Render appropriate component based on match status
  if (hasScores) {
    return (
      <>
        <CompletedMatchDetails
          match={match}
          redSlots={redSlots}
          blueSlots={blueSlots}
          redAllianceName={redAllianceName}
          blueAllianceName={blueAllianceName}
          user={user}
          onEditClick={() => setIsEditModalOpen(true)}
        />
        <MatchEditModal
          matchId={matchId}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
        />
      </>
    );
  } else {
    return (
      <>
        <UpcomingMatchDetails
          match={match}
          redSlots={redSlots}
          blueSlots={blueSlots}
          redAllianceName={redAllianceName}
          blueAllianceName={blueAllianceName}
          user={user}
          onEditClick={() => setIsEditModalOpen(true)}
        />
        <MatchEditModal
          matchId={matchId}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
        />
      </>
    );
  }
}
