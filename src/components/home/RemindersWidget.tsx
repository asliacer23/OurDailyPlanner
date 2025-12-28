import { useState, useEffect } from 'react';
import { Bell, Check, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { AuthorBadge } from '@/components/shared/AuthorBadge';

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  remind_at: string;
  is_completed: boolean;
  author_id: string;
  profiles?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function RemindersWidget() {
  const { user, workspace } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    remind_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });

  const fetchReminders = async () => {
    if (!workspace?.id) return;
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*, profiles(id, display_name, avatar_url)')
        .eq('workspace_id', workspace.id)
        .eq('is_completed', false)
        .order('remind_at', { ascending: true })
        .limit(5);

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [workspace?.id]);

  const handleCreate = async () => {
    if (!user?.id || !workspace?.id || !newReminder.title) {
      toast.error('Please enter a title');
      return;
    }

    try {
      const { error } = await supabase.from('reminders').insert({
        title: newReminder.title,
        description: newReminder.description || null,
        remind_at: new Date(newReminder.remind_at).toISOString(),
        author_id: user.id,
        workspace_id: workspace.id,
      });

      if (error) throw error;
      toast.success('Reminder created!');
      setNewReminder({
        title: '',
        description: '',
        remind_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      });
      setDialogOpen(false);
      fetchReminders();
    } catch (error) {
      toast.error('Failed to create reminder');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_completed: true })
        .eq('id', id);
      if (error) throw error;
      toast.success('Reminder completed!');
      fetchReminders();
    } catch (error) {
      toast.error('Failed to update reminder');
    }
  };

  const getTimeLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isPast(date) && !isToday(date)) return { text: 'Overdue', class: 'text-destructive' };
    if (isToday(date)) return { text: 'Today ' + format(date, 'h:mm a'), class: 'text-warning' };
    if (isTomorrow(date)) return { text: 'Tomorrow ' + format(date, 'h:mm a'), class: 'text-primary' };
    const days = differenceInDays(date, new Date());
    if (days <= 7) return { text: `In ${days} days`, class: 'text-muted-foreground' };
    return { text: format(date, 'MMM d'), class: 'text-muted-foreground' };
  };

  return (
    <Card className="border-border/50 shadow-soft">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Reminders
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Reminder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                    placeholder="Reminder title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={newReminder.description}
                    onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                    placeholder="Additional details..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Remind At</Label>
                  <Input
                    type="datetime-local"
                    value={newReminder.remind_at}
                    onChange={(e) => setNewReminder({ ...newReminder, remind_at: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreate} className="w-full">Create Reminder</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming reminders</p>
          </div>
        ) : (
          reminders.map((reminder) => {
            const timeLabel = getTimeLabel(reminder.remind_at);
            return (
              <div
                key={reminder.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 group hover:bg-muted/30 transition-colors"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 mt-0.5"
                  onClick={() => handleComplete(reminder.id)}
                >
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground group-hover:border-primary transition-colors" />
                </Button>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{reminder.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn('text-xs flex items-center gap-1', timeLabel.class)}>
                      <Clock className="h-3 w-3" />
                      {timeLabel.text}
                    </span>
                    <AuthorBadge author={reminder.profiles || null} size="sm" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
