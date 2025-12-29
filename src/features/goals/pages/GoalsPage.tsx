import { useState, useEffect } from 'react';
import { Plus, Target, Trophy, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEditRequests } from '@/hooks/useEditRequests';
import { useOnlineStatus, useOnReconnect } from '@/hooks/useOnlineStatus';
import { fetchWithCache, subscribeToTable } from '@/lib/cacheAndSync';
import { EditConfirmationDialog } from '@/components/shared/EditConfirmationDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ViewModal } from '@/components/shared/ViewModal';
import { AuthorBadge } from '@/components/shared/AuthorBadge';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  progress: number;
  target_date: string | null;
  visibility: 'private' | 'shared' | 'business';
  author_id: string;
  created_at: string;
  author?: { id: string; display_name: string | null; avatar_url: string | null };
}

const CATEGORIES = ['personal', 'career', 'health', 'finance', 'relationship', 'education'];

export default function GoalsPage() {
  const { user, workspace } = useAuth();
  const { pendingEdits, requestEdit, approveEdit, rejectEdit } = useEditRequests(workspace?.id || null);
  const { isOnline } = useOnlineStatus();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [viewingGoal, setViewingGoal] = useState<Goal | null>(null);
  const [showPendingEdit, setShowPendingEdit] = useState(false);
  const [newGoal, setNewGoal] = useState<{
    title: string;
    description: string;
    category: string;
    status: string;
    progress: number;
    target_date: string;
    visibility: 'private' | 'shared' | 'business';
  }>({
    title: '',
    description: '',
    category: 'personal',
    status: 'in_progress',
    progress: 0,
    target_date: '',
    visibility: 'shared',
  });

  const fetchGoals = async () => {
    if (!workspace?.id) return;
    try {
      // Use cache-first strategy
      const data = await fetchWithCache<Goal[]>(
        supabase
          .from('goals')
          .select('*, author:profiles!goals_author_id_fkey(id, display_name, avatar_url)')
          .eq('workspace_id', workspace.id)
          .order('created_at', { ascending: false }),
        {
          cacheKey: `goals_${workspace.id}`,
          ttl: 1800000, // 30 minutes
        }
      );

      if (data) {
        setGoals(data);
      }
    } catch (error) {
      if (isOnline) {
        toast.error('Failed to load goals');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspace?.id) {
      fetchGoals();

      // Real-time subscription
      const unsubscribe = subscribeToTable<Goal>(
        'goals',
        (updated) => {
          if (updated.workspace_id === workspace.id) {
            setGoals((prev) =>
              prev.map((g) => (g.id === updated.id ? updated : g))
            );
          }
        },
        (newGoal) => {
          if (newGoal.workspace_id === workspace.id) {
            setGoals((prev) => [newGoal, ...prev]);
          }
        },
        (deleted) => {
          if (deleted.workspace_id === workspace.id) {
            setGoals((prev) => prev.filter((g) => g.id !== deleted.id));
          }
        },
        `workspace_id=eq.${workspace.id}`
      );

      return unsubscribe;
    }
  }, [workspace?.id, isOnline]);

  // Sync when reconnecting
  useOnReconnect(async () => {
    if (workspace?.id) {
      await fetchGoals();
    }
  });

  const handleCreate = async () => {
    if (!user?.id || !workspace?.id || !newGoal.title) {
      toast.error('Please enter a title');
      return;
    }

    try {
      const { error } = await supabase.from('goals').insert({
        ...newGoal,
        target_date: newGoal.target_date || null,
        description: newGoal.description || null,
        author_id: user.id,
        workspace_id: workspace.id,
      });

      if (error) throw error;
      toast.success('Goal created!');
      resetForm();
      fetchGoals();
    } catch (error) {
      toast.error('Failed to create goal');
    }
  };

  const handleUpdate = async () => {
    if (!editingGoal) return;
    try {
      const newData = {
        title: newGoal.title,
        description: newGoal.description || null,
        category: newGoal.category,
        status: newGoal.status,
        progress: newGoal.progress,
        target_date: newGoal.target_date || null,
        visibility: newGoal.visibility,
      };

      // If user is the author, update directly
      if (editingGoal.author_id === user?.id) {
        const { error } = await supabase
          .from('goals')
          .update(newData)
          .eq('id', editingGoal.id);

        if (error) throw error;
        toast.success('Goal updated!');
      } else {
        // Request approval from author
        await requestEdit('goal', editingGoal.id, 'edit', newData, `Updated goal: "${newGoal.title}"`);
        toast.success('Edit request sent to goal owner for approval');
      }
      
      resetForm();
      fetchGoals();
    } catch (error) {
      toast.error('Failed to update goal');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.id) return;
    const goalToDelete = goals.find(g => g.id === id);
    if (!goalToDelete) return;

    try {
      // If user is the author, delete directly
      if (goalToDelete.author_id === user.id) {
        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (error) throw error;
        toast.success('Goal deleted');
      } else {
        // Request deletion approval from author
        await requestEdit('goal', id, 'delete', null, 'Requested to delete this goal');
        toast.success('Delete request sent to goal owner for approval');
      }
      
      setViewingGoal(null);
      fetchGoals();
    } catch (error) {
      toast.error('Failed to delete goal');
    }
  };

  const resetForm = () => {
    setNewGoal({ title: '', description: '', category: 'personal', status: 'in_progress', progress: 0, target_date: '', visibility: 'shared' });
    setEditingGoal(null);
    setDialogOpen(false);
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setNewGoal({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      status: goal.status,
      progress: goal.progress,
      target_date: goal.target_date || '',
      visibility: goal.visibility,
    });
    setViewingGoal(null);
    setDialogOpen(true);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      personal: 'bg-blue-500/10 text-blue-500',
      career: 'bg-purple-500/10 text-purple-500',
      health: 'bg-green-500/10 text-green-500',
      finance: 'bg-yellow-500/10 text-yellow-500',
      relationship: 'bg-pink-500/10 text-pink-500',
      education: 'bg-orange-500/10 text-orange-500',
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Goals</h1>
          <p className="text-muted-foreground">Track your aspirations</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Goal</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'New Goal'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="Your goal" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} placeholder="Details..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newGoal.category} onValueChange={(v) => setNewGoal({ ...newGoal, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Date</Label>
                  <Input type="date" value={newGoal.target_date} onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Progress: {newGoal.progress}%</Label>
                <Slider value={[newGoal.progress]} onValueChange={([v]) => setNewGoal({ ...newGoal, progress: v })} max={100} step={5} />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={newGoal.visibility} onValueChange={(v) => setNewGoal({ ...newGoal, visibility: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">🔒 Private</SelectItem>
                    <SelectItem value="shared">👫 Shared</SelectItem>
                    <SelectItem value="business">💼 Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={editingGoal ? handleUpdate : handleCreate} className="w-full">
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border/50 animate-pulse">
              <CardContent className="p-6"><div className="h-20 bg-muted rounded" /></CardContent>
            </Card>
          ))
        ) : goals.length === 0 ? (
          <Card className="col-span-full border-border/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">No goals yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Set your first goal</p>
              <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />New Goal</Button>
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => (
            <Card key={goal.id} className="border-border/50 shadow-soft hover:shadow-md transition-all cursor-pointer" onClick={() => setViewingGoal(goal)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn('text-xs capitalize', getCategoryColor(goal.category))}>{goal.category}</Badge>
                      {goal.progress >= 100 && <Trophy className="h-4 w-4 text-yellow-500" />}
                    </div>
                    <h3 className="font-semibold line-clamp-1">{goal.title}</h3>
                  </div>
                  <AuthorBadge author={goal.author || null} size="sm" />
                </div>
                <Progress value={goal.progress} className="h-2 mb-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{goal.progress}% complete</span>
                  {goal.target_date && <span>Due {format(new Date(goal.target_date), 'MMM d')}</span>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ViewModal
        open={!!viewingGoal}
        onOpenChange={(open) => !open && setViewingGoal(null)}
        title={viewingGoal?.title || ''}
        author={viewingGoal?.author || null}
        createdAt={viewingGoal?.created_at}
        visibility={viewingGoal?.visibility}
        onEdit={() => viewingGoal && openEditDialog(viewingGoal)}
        onDelete={() => viewingGoal && handleDelete(viewingGoal.id)}
        canEdit={viewingGoal?.author_id === user?.id}
        canDelete={viewingGoal?.author_id === user?.id}
      >
        <div className="space-y-4">
          {viewingGoal?.description && <p className="text-foreground">{viewingGoal.description}</p>}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{viewingGoal?.progress}%</span>
            </div>
            <Progress value={viewingGoal?.progress || 0} className="h-3" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className={getCategoryColor(viewingGoal?.category || 'personal')} >{viewingGoal?.category}</Badge>
          </div>
          {viewingGoal?.target_date && (
            <p className="text-sm text-muted-foreground">
              Target: {format(new Date(viewingGoal.target_date), 'MMMM d, yyyy')}
            </p>
          )}
        </div>
      </ViewModal>

      {pendingEdits.filter(e => e.content_type === 'goal' && e.approver_id === user?.id).length > 0 && (
        <>
          {pendingEdits.filter(e => e.content_type === 'goal' && e.approver_id === user?.id).map(edit => (
            <EditConfirmationDialog
              key={edit.id}
              isOpen={showPendingEdit && pendingEdits.some(e => e.content_type === 'goal' && e.approver_id === user?.id && e.id === edit.id)}
              requesterName={edit.requester?.display_name || 'Unknown'}
              contentType="goal"
              action={edit.action as 'edit' | 'delete'}
              originalData={edit.original_data}
              newData={edit.new_data}
              changeDescription={edit.change_description}
              onApprove={async (editId) => {
                await approveEdit(editId);
                setShowPendingEdit(false);
                fetchGoals();
              }}
              onReject={async (editId) => {
                await rejectEdit(editId);
                setShowPendingEdit(false);
              }}
              onClose={() => setShowPendingEdit(false)}
              editId={edit.id}
            />
          ))}
          {!showPendingEdit && pendingEdits.some(e => e.content_type === 'goal' && e.approver_id === user?.id) && (
            <Button
              variant="outline"
              className="fixed bottom-24 right-4 gap-2"
              onClick={() => setShowPendingEdit(true)}
            >
              {pendingEdits.filter(e => e.content_type === 'goal' && e.approver_id === user?.id).length} Pending Approval
            </Button>
          )}
        </>
      )}
    </div>
  );
}

