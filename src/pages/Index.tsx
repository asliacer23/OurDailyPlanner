import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { Calendar, FileText, MessageCircle, Wallet, TrendingUp, CheckSquare, Target, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatPeso } from '@/lib/currency';
import { PhotoCarousel } from '@/components/home/PhotoCarousel';
import { TipsWidget } from '@/components/home/TipsWidget';
import { QuickNotesWidget } from '@/components/home/QuickNotesWidget';
import { RemindersWidget } from '@/components/home/RemindersWidget';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DashboardPage() {
  const { profile, workspace } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ notes: 0, messages: 0, expenses: 0, revenues: 0, tasks: 0, goals: 0 });
  const currentDate = new Date();

  useEffect(() => {
    const fetchStats = async () => {
      if (!workspace?.id) return;

      const [notesRes, messagesRes, expensesRes, revenuesRes, tasksRes, goalsRes] = await Promise.all([
        supabase.from('notes').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
        supabase.from('expenses').select('amount').eq('workspace_id', workspace.id),
        supabase.from('revenues').select('amount').eq('workspace_id', workspace.id),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id).eq('status', 'pending'),
        supabase.from('goals').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id).eq('status', 'in_progress'),
      ]);

      const totalExpenses = expensesRes.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalRevenues = revenuesRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      setStats({
        notes: notesRes.count || 0,
        messages: messagesRes.count || 0,
        expenses: totalExpenses,
        revenues: totalRevenues,
        tasks: tasksRes.count || 0,
        goals: goalsRes.count || 0,
      });
    };

    fetchStats();
  }, [workspace?.id]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">
            {greeting()}, {profile?.display_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-muted-foreground">{format(currentDate, 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      {/* Photo Carousel */}
      <PhotoCarousel />

      {/* Quick Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card className="border-border/50 shadow-soft cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/notes')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{stats.notes}</p>
                <p className="text-xs text-muted-foreground">Notes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-soft cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/messages')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{stats.messages}</p>
                <p className="text-xs text-muted-foreground">Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-soft cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/tasks')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{stats.tasks}</p>
                <p className="text-xs text-muted-foreground">Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-soft cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/goals')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{stats.goals}</p>
                <p className="text-xs text-muted-foreground">Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-soft cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/finance')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-lg font-bold font-display text-success">{formatPeso(stats.revenues)}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-soft cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/finance')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-lg font-bold font-display text-destructive">{formatPeso(stats.expenses)}</p>
                <p className="text-xs text-muted-foreground">Expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calendar & Quick Notes */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Mini Calendar */}
            <Card className="border-border/50 shadow-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {format(currentDate, 'MMMM yyyy')}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {WEEKDAYS.map((day, index) => (
                    <div key={`weekday-${index}`} className="text-xs font-medium text-muted-foreground py-1">{day}</div>
                  ))}
                  {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {days.map((day) => (
                    <button
                      key={day.toISOString()}
                      onClick={() => navigate('/calendar')}
                      className={cn(
                        'aspect-square flex items-center justify-center text-xs rounded-full transition-colors',
                        isToday(day) ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-accent'
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <QuickNotesWidget />
          </div>

          {/* Tips Widget */}
          <TipsWidget />
        </div>

        {/* Right Column - Reminders */}
        <div>
          <RemindersWidget />
        </div>
      </div>
    </div>
  );
}
