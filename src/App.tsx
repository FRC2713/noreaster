import { Link, Outlet, useNavigate } from "react-router";
import { useAuth } from "./lib/use-auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { User as UserIcon } from "lucide-react";

function AppLayout() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b">
        <nav className="container mx-auto flex items-center gap-4 p-4">
          <Link to="/" aria-label="Home" className="flex items-center">
            <img src={`${import.meta.env.BASE_URL}NoreasterLogo.png`} alt="Noreaster Home" className="h-8 w-auto" />
            <span className="sr-only">Noreaster</span>
          </Link>
          <div className="flex-1" />
          <Link to="/teams" className="hover:underline">Teams</Link>
          <Link to="/alliances" className="hover:underline">Alliances</Link>
          <Link to="/matches" className="hover:underline">Matches</Link>
          <Link to="/schedule" className="hover:underline">Schedule</Link>
          <Popover>
            <PopoverTrigger asChild>
              <button aria-label="Account" className="rounded-full border size-9 grid place-items-center hover:bg-accent">
                <UserIcon className="size-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 p-2">
              {user ? (
                <div className="grid gap-1">
                  {user.email && <div className="px-2 py-1 text-xs text-muted-foreground truncate">{user.email}</div>}
                  <button onClick={handleSignOut} className="w-full text-left px-2 py-1 rounded hover:bg-accent">Sign out</button>
                </div>
              ) : (
                <div className="grid gap-1">
                  <Link to="/auth" className="px-2 py-1 rounded hover:bg-accent">Sign in</Link>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </nav>
      </header>
      <main className="container mx-auto flex-1 p-6">
        <Outlet />
      </main>      
    </div>
  );
}

export default AppLayout;
