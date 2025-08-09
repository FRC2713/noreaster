import { Link, Outlet } from "react-router";

function AppLayout() {
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
          <Link to="/about" className="hover:underline">About</Link>
          <Link to="/auth" className="hover:underline">Auth</Link>
        </nav>
      </header>
      <main className="container mx-auto flex-1 p-6">
        <Outlet />
      </main>
      <footer className="border-t text-sm p-4 text-center">
        <img src={`${import.meta.env.BASE_URL}NoreasterBanner.png`} alt="Noreaster Banner" className="mx-auto mb-2 h-10 w-auto" />
        <span className="opacity-70">© {new Date().getFullYear()} Noreaster</span>
      </footer>
    </div>
  );
}

export default AppLayout;
