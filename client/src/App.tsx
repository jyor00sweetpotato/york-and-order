import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/Sidebar";
import Home from "@/pages/Home";
import CategoryView from "@/pages/CategoryView";
import CompletedView from "@/pages/CompletedView";
import ReportsView from "@/pages/ReportsView";
import OneOnOnesView from "@/pages/OneOnOnesView";
import SettingsView from "@/pages/SettingsView";
import NotFound from "@/pages/not-found";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

function Router() {
  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      <Sidebar />
      
      <main className="flex-1 overflow-auto h-screen relative">
        <div className="md:hidden p-4 flex items-center justify-between gap-2 border-b bg-card sticky top-0 z-50">
          <span className="font-bold text-xl text-primary font-display">York & Order</span>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r">
              <Sidebar isMobile />
            </SheetContent>
          </Sheet>
        </div>

        <Switch>
          <Route path="/" component={Home} />
          <Route path="/type/:type" component={CategoryView} />
          <Route path="/category/:category" component={CategoryView} />
          <Route path="/completed" component={CompletedView} />
          <Route path="/reports" component={ReportsView} />
          <Route path="/one-on-ones" component={OneOnOnesView} />
          <Route path="/settings" component={SettingsView} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
        <Toaster />
        <Router />
    </QueryClientProvider>
  );
}

export default App;
