import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/use-auth';
import {
  useSimulateMatches,
  useResetMatches,
} from '@/lib/use-match-simulation';
import {
  Settings,
  Users,
  Shield,
  Database,
  Activity,
  Play,
  RotateCcw,
} from 'lucide-react';

export default function Admin() {
  const { user } = useAuth();
  const simulateMatches = useSimulateMatches();
  const resetMatches = useResetMatches();

  const adminSections = [
    {
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      icon: Users,
      status: 'Coming Soon',
      statusVariant: 'secondary' as const,
    },
    {
      title: 'Tournament Settings',
      description: 'Configure tournament parameters and rules',
      icon: Settings,
      status: 'Coming Soon',
      statusVariant: 'secondary' as const,
    },
    {
      title: 'Security & Access',
      description: 'Manage security settings and access controls',
      icon: Shield,
      status: 'Coming Soon',
      statusVariant: 'secondary' as const,
    },
    {
      title: 'Database Management',
      description: 'View and manage database operations',
      icon: Database,
      status: 'Coming Soon',
      statusVariant: 'secondary' as const,
    },
    {
      title: 'System Monitoring',
      description: 'Monitor system health and performance',
      icon: Activity,
      status: 'Coming Soon',
      statusVariant: 'secondary' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.email}. Manage your tournament system from here.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminSections.map(section => {
          const IconComponent = section.icon;
          return (
            <Card
              key={section.title}
              className="transition-colors hover:bg-muted/50"
            >
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
                <Badge variant={section.statusVariant} className="ml-auto">
                  {section.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <CardDescription>{section.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
          <CardDescription>System overview and key metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Active Users
              </p>
              <p className="text-2xl font-bold">1</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                System Status
              </p>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <p className="text-sm font-medium">Online</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Database
              </p>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <p className="text-sm font-medium">Connected</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Version
              </p>
              <p className="text-sm font-medium">v1.0.0</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Match Simulation</CardTitle>
          <CardDescription>
            Simulate match results for testing and demonstration purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() =>
                  simulateMatches.mutate({ matchType: 'round_robin' })
                }
                disabled={simulateMatches.isPending}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {simulateMatches.isPending
                  ? 'Simulating...'
                  : 'Simulate Round Robin Matches'}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  resetMatches.mutate({ matchType: 'round_robin' })
                }
                disabled={resetMatches.isPending}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {resetMatches.isPending
                  ? 'Resetting...'
                  : 'Reset Round Robin Matches'}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => simulateMatches.mutate({ matchType: 'playoff' })}
                disabled={simulateMatches.isPending}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {simulateMatches.isPending
                  ? 'Simulating..'
                  : 'Simulate Playoff Matches'}
              </Button>
              <Button
                variant="outline"
                onClick={() => resetMatches.mutate({ matchType: 'playoff' })}
                disabled={resetMatches.isPending}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {resetMatches.isPending
                  ? 'Resetting...'
                  : 'Reset Playoff Matches'}
              </Button>
            </div>

            {simulateMatches.isSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ Successfully simulated {simulateMatches.data.updatedCount}{' '}
                  {simulateMatches.data.matchType.replace('_', ' ')} matches
                </p>
              </div>
            )}

            {resetMatches.isSuccess && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ✓ Successfully reset{' '}
                  {resetMatches.data.matchType.replace('_', ' ')} matches
                </p>
              </div>
            )}

            {(simulateMatches.isError || resetMatches.isError) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ✗ Error:{' '}
                  {simulateMatches.error?.message ||
                    resetMatches.error?.message}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
