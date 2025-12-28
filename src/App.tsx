import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";

// Auth & Main
import AuthPage from "@/features/auth/pages/AuthPage";
import DashboardPage from "@/pages/Index";
import NotFound from "./pages/NotFound";

// Core Features
import CalendarPage from "@/features/calendar/pages/CalendarPage";
import NotesPage from "@/features/notes/pages/NotesPage";
import MessagesPage from "@/features/messages/pages/MessagesPage";
import NotificationsPage from "@/features/notifications/pages/NotificationsPage";

// Planning Features
import TasksPage from "@/features/tasks/pages/TasksPage";
import GoalsPage from "@/features/goals/pages/GoalsPage";
import ShoppingPage from "@/features/shopping/pages/ShoppingPage";

// Lifestyle Features
import FinancePage from "@/features/finance/pages/FinancePage";
import TravelPage from "@/features/travel/pages/TravelPage";
import MoviesPage from "@/features/movies/pages/MoviesPage";
import BooksPage from "@/features/books/pages/BooksPage";

// Settings
import SettingsPage from "@/features/settings/pages/SettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<AppShell />}>
              {/* Dashboard */}
              <Route path="/" element={<DashboardPage />} />
              
              {/* Core Features */}
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              
              {/* Planning */}
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/shopping" element={<ShoppingPage />} />
              
              {/* Lifestyle */}
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/travel" element={<TravelPage />} />
              <Route path="/movies" element={<MoviesPage />} />
              <Route path="/books" element={<BooksPage />} />
              
              {/* Settings */}
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
