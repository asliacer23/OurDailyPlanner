import { useState, useEffect } from 'react';
import { Lightbulb, Plus, Trash2, Pin } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  author_id: string;
  created_at: string;
}

export function TipsWidget() {
  const { user, workspace } = useAuth();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTip, setNewTip] = useState({ title: '', content: '', category: 'general' });

  const fetchTips = async () => {
    if (!workspace?.id) return;
    try {
      const { data, error } = await supabase
        .from('tips')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTips(data || []);
    } catch (error) {
      console.error('Failed to load tips:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, [workspace?.id]);

  const handleCreate = async () => {
    if (!user?.id || !workspace?.id || !newTip.title || !newTip.content) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase.from('tips').insert({
        title: newTip.title,
        content: newTip.content,
        category: newTip.category,
        author_id: user.id,
        workspace_id: workspace.id,
      });

      if (error) throw error;
      toast.success('Tip added!');
      setNewTip({ title: '', content: '', category: 'general' });
      setDialogOpen(false);
      fetchTips();
    } catch (error) {
      toast.error('Failed to add tip');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('tips').delete().eq('id', id);
      if (error) throw error;
      toast.success('Tip deleted');
      fetchTips();
    } catch (error) {
      toast.error('Failed to delete tip');
    }
  };

  const togglePin = async (tip: Tip) => {
    try {
      const { error } = await supabase
        .from('tips')
        .update({ is_pinned: !tip.is_pinned })
        .eq('id', tip.id);
      if (error) throw error;
      fetchTips();
    } catch (error) {
      toast.error('Failed to update tip');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'relationship': return 'bg-pink-500/10 text-pink-500';
      case 'finance': return 'bg-green-500/10 text-green-500';
      case 'health': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="border-border/50 shadow-soft">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-warning" />
            Tips & Reminders
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Tip</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newTip.title}
                    onChange={(e) => setNewTip({ ...newTip, title: e.target.value })}
                    placeholder="Tip title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={newTip.content}
                    onChange={(e) => setNewTip({ ...newTip, content: e.target.value })}
                    placeholder="Tip content..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    value={newTip.category}
                    onChange={(e) => setNewTip({ ...newTip, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="general">General</option>
                    <option value="relationship">Relationship</option>
                    <option value="finance">Finance</option>
                    <option value="health">Health</option>
                  </select>
                </div>
                <Button onClick={handleCreate} className="w-full">Add Tip</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : tips.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tips yet</p>
          </div>
        ) : (
          tips.map((tip) => (
            <div
              key={tip.id}
              className={cn(
                'p-3 rounded-lg border border-border/50 group transition-colors',
                tip.is_pinned && 'bg-warning/5 border-warning/20'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {tip.is_pinned && <Pin className="h-3 w-3 text-warning" />}
                    <h4 className="font-medium text-sm truncate">{tip.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{tip.content}</p>
                  <Badge variant="secondary" className={cn('text-[10px] mt-2', getCategoryColor(tip.category))}>
                    {tip.category}
                  </Badge>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => togglePin(tip)}
                  >
                    <Pin className={cn('h-3 w-3', tip.is_pinned && 'text-warning fill-warning')} />
                  </Button>
                  {tip.author_id === user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDelete(tip.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
