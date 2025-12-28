import { useState, useEffect } from 'react';
import { StickyNote, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AuthorBadge } from '@/components/shared/AuthorBadge';

interface QuickNote {
  id: string;
  content: string;
  color: string;
  author_id: string;
  created_at: string;
  profiles?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const COLORS = ['#FEF3C7', '#DBEAFE', '#FCE7F3', '#D1FAE5', '#E5E7EB', '#F3E8FF'];

export function QuickNotesWidget() {
  const { user, workspace } = useAuth();
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const fetchNotes = async () => {
    if (!workspace?.id) return;
    try {
      const { data, error } = await supabase
        .from('quick_notes')
        .select('*, profiles(id, display_name, avatar_url)')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Failed to load quick notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [workspace?.id]);

  const handleCreate = async () => {
    if (!user?.id || !workspace?.id || !newContent.trim()) return;

    try {
      const { error } = await supabase.from('quick_notes').insert({
        content: newContent.trim(),
        color: selectedColor,
        author_id: user.id,
        workspace_id: workspace.id,
      });

      if (error) throw error;
      toast.success('Note added!');
      setNewContent('');
      setIsAdding(false);
      fetchNotes();
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('quick_notes').delete().eq('id', id);
      if (error) throw error;
      fetchNotes();
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  return (
    <Card className="border-border/50 shadow-soft">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Quick Notes
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isAdding && (
          <div className="mb-4 space-y-2 p-3 rounded-lg border border-border/50 bg-muted/30">
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write a quick note..."
              rows={3}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      'w-5 h-5 rounded-full border-2 transition-transform',
                      selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Button size="sm" onClick={handleCreate} disabled={!newContent.trim()}>
                Add
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No quick notes</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="relative p-3 rounded-lg text-foreground group shadow-sm"
                style={{ backgroundColor: note.color }}
              >
                <p className="text-xs line-clamp-3 text-gray-800">{note.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <AuthorBadge author={note.profiles || null} size="sm" />
                  {note.author_id === user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
