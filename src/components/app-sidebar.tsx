import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/lib/use-auth';
import {
  Home,
  Users,
  Shield,
  Calendar,
  Clock,
  Trophy,
  User as UserIcon,
  BookOpenText,
  LogOut,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Menu items for navigation
const navItems = [
  {
    title: 'Home',
    url: '/',
    icon: Home,
  },
  {
    title: 'Teams',
    url: '/teams',
    icon: Users,
  },
  {
    title: 'Alliances',
    url: '/alliances',
    icon: Shield,
  },
  {
    title: 'Matches',
    url: '/matches',
    icon: Calendar,
  },
  {
    title: 'Schedule',
    url: '/schedule',
    icon: Clock,
  },
  {
    title: 'Rankings',
    url: '/rankings',
    icon: Trophy,
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <img
            src={`${import.meta.env.BASE_URL}NoreasterLogo.png`}
            alt="Noreaster"
            className="h-8 w-auto"
          />
          <span className="font-semibold">Noreaster</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/docs">
                <BookOpenText className="h-4 w-4" />
                <span>Documentation</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarSeparator />
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <UserIcon className="h-4 w-4" />
                  <span>{user ? user.email : 'Sign In'}</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {user ? (
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link to="/auth">Sign in</Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
