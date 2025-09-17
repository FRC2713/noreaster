import { Outlet } from 'react-router';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Toaster } from '@/components/ui/sonner';

function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col min-h-dvh">
        <header className="flex items-center gap-4 p-4 border-b">
          <SidebarTrigger />
        </header>
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
      <Toaster position="bottom-right" className="pointer-events-auto" />
    </SidebarProvider>
  );
}

export default AppLayout;
