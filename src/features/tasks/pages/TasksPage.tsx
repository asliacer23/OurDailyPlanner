import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Clock, Filter, Trash2, Edit2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ViewModal } from '@/components/shared/ViewModal';
import { AuthorBadge } from '@/components/shared/AuthorBadge';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  visibility: 'private' | 'shared' | 'business';
  author_id: string;
  assigned_to: string | null;
  created_at: string;
  author?: { id: string; display_name: string | null; avatar_url: string | null };
}

export default function TasksPage() {
  const { user, workspace } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    due_date: string;
    visibility: 'private' | 'shared' | 'business';
  }>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    visibility: 'shared',
  });

  const fetchTasks = async () => {
    if (!workspace?.id) return;
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, author:profiles!tasks_author_id_fkey(id, display_name, avatar_url)')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data as Task[]);
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [workspace?.id]);

  const handleCreate = async () => {
    if (!user?.id || !workspace?.id || !newTask.title) {
      toast.error('Please enter a title');
      return;
    }

    try {
      const { error } = await supabase.from('tasks').insert({
        ...newTask,
        due_date: newTask.due_date || null,
        description: newTask.description || null,
        author_id: user.id,
        workspace_id: workspace.id,
      });

      if (error) throw error;
      toast.success('Task created!');
      resetForm();
      fetchTasks();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdate = async () => {
    if (!editingTask) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: newTask.title,
          description: newTask.description || null,
          status: newTask.status,
          priority: newTask.priority,
          due_date: newTask.due_date || null,
          visibility: newTask.visibility,
        })
        .eq('id', editingTask.id);

      if (error) throw error;
      toast.success('Task updated!');
      resetForm();
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      toast.success('Task deleted');
      setViewingTask(null);
      fetchTasks();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
      if (error) throw error;
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setNewTask({ title: '', description: '', status: 'pending', priority: 'medium', due_date: '', visibility: 'shared' });
    setEditingTask(null);
    setDialogOpen(false);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || '',
      visibility: task.visibility,
    });
    setViewingTask(null);
    setDialogOpen(true);
  };

  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return task.status === 'pending';
    if (activeTab === 'in_progress') return task.status === 'in_progress';
    if (activeTab === 'completed') return task.status === 'completed';
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive bg-destructive/10';
      case 'medium': return 'text-warning bg-warning/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage your to-dos</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Task</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Task title" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} placeholder="Details..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={newTask.status} onValueChange={(v) => setNewTask({ ...newTask, status: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select value={newTask.visibility} onValueChange={(v) => setNewTask({ ...newTask, visibility: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">🔒 Private</SelectItem>
                      <SelectItem value="shared">👫 Shared</SelectItem>
                      <SelectItem value="business">💼 Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={editingTask ? handleUpdate : handleCreate} className="w-full">
                {editingTask ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-border/50 animate-pulse">
                  <CardContent className="p-4"><div className="h-6 bg-muted rounded w-1/2" /></CardContent>
                </Card>
              ))
            ) : filteredTasks.length === 0 ? (
              <Card className="border-border/50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-1">No tasks</h3>
                  <p className="text-sm text-muted-foreground mb-4">Create your first task</p>
                  <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />New Task</Button>
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map((task) => (
                <Card key={task.id} className="border-border/50 shadow-soft hover:shadow-md transition-all cursor-pointer" onClick={() => setViewingTask(task)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(task); }} className="shrink-0">
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn('font-medium', task.status === 'completed' && 'line-through text-muted-foreground')}>
                            {task.title}
                          </span>
                          <Badge className={cn('text-xs', getPriorityColor(task.priority))}>{task.priority}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {task.due_date && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />{format(new Date(task.due_date), 'MMM d')}
                            </span>
                          )}
                          <AuthorBadge author={task.author || null} size="sm" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* View Modal */}
      <ViewModal
        open={!!viewingTask}
        onOpenChange={(open) => !open && setViewingTask(null)}
        title={viewingTask?.title || ''}
        author={viewingTask?.author || null}
        createdAt={viewingTask?.created_at}
        visibility={viewingTask?.visibility}
        onEdit={() => viewingTask && openEditDialog(viewingTask)}
        onDelete={() => viewingTask && handleDelete(viewingTask.id)}
        canEdit={viewingTask?.author_id === user?.id}
        canDelete={viewingTask?.author_id === user?.id}
      >
        <div className="space-y-4">
          {viewingTask?.description && <p className="text-foreground">{viewingTask.description}</p>}
          <div className="flex flex-wrap gap-2">
            <Badge className={getPriorityColor(viewingTask?.priority || 'medium')}>
              {viewingTask?.priority} priority
            </Badge>
            <Badge variant="outline">{viewingTask?.status?.replace('_', ' ')}</Badge>
          </div>
          {viewingTask?.due_date && (
            <p className="text-sm text-muted-foreground">
              Due: {format(new Date(viewingTask.due_date), 'MMMM d, yyyy')}
            </p>
          )}
        </div>
      </ViewModal>
    </div>
  );
}
