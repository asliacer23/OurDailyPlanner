import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Lock, Users, Trash2, Edit2, Pin, Tag } from 'lucide-react';
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

interface Note {
  id: string;
  title: string;
  content: string | null;
  visibility: 'private' | 'shared' | 'business';
  author_id: string;
  date: string | null;
  created_at: string;
  updated_at: string;
}

export default function NotesPage() {
  const { user, workspace, profile } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [newNote, setNewNote] = useState<{
    title: string;
    content: string;
    visibility: 'private' | 'shared' | 'business';
  }>({
    title: '',
    content: '',
    visibility: 'shared',
  });

  const fetchNotes = async () => {
    if (!workspace?.id) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data as Note[]);
    } catch (error: any) {
      console.error('Failed to load notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspace?.id) {
      fetchNotes();
    }
  }, [workspace?.id]);

  const handleCreateNote = async () => {
    if (!user?.id || !workspace?.id || !newNote.title) {
      toast.error('Please enter a title');
      return;
    }

    try {
      const { error } = await supabase.from('notes').insert({
        title: newNote.title,
        content: newNote.content || null,
        visibility: newNote.visibility,
        author_id: user.id,
        workspace_id: workspace.id,
      });

      if (error) throw error;
      
      toast.success('Note created!');
      setNewNote({ title: '', content: '', visibility: 'shared' });
      setDialogOpen(false);
      fetchNotes();
    } catch (error: any) {
      console.error('Failed to create note:', error);
      toast.error('Failed to create note');
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !user?.id) return;

    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: newNote.title,
          content: newNote.content || null,
          visibility: newNote.visibility,
        })
        .eq('id', editingNote.id);

      if (error) throw error;
      
      toast.success('Note updated!');
      resetForm();
      fetchNotes();
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      
      toast.success('Note deleted');
      fetchNotes();
    } catch (error: any) {
      toast.error('Failed to delete note');
    }
  };

  const resetForm = () => {
    setNewNote({ title: '', content: '', visibility: 'shared' });
    setEditingNote(null);
    setDialogOpen(false);
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    setNewNote({
      title: note.title,
      content: note.content || '',
      visibility: note.visibility,
    });
    setDialogOpen(true);
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'private') return matchesSearch && note.visibility === 'private';
    if (activeTab === 'shared') return matchesSearch && note.visibility === 'shared';
    if (activeTab === 'business') return matchesSearch && note.visibility === 'business';
    return matchesSearch;
  });

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'private':
        return <Lock className="h-3 w-3" />;
      case 'shared':
        return <Users className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Notes</h1>
          <p className="text-muted-foreground">Personal & shared notes</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingNote ? 'Edit Note' : 'Create Note'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Note title"
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Write your note..."
                  rows={8}
                />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={newNote.visibility}
                  onValueChange={(value) => 
                    setNewNote({ ...newNote, visibility: value as 'private' | 'shared' | 'business' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">🔒 Private (Only you)</SelectItem>
                    <SelectItem value="shared">👫 Shared (Both of you)</SelectItem>
                    <SelectItem value="business">💼 Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={editingNote ? handleUpdateNote : handleCreateNote} 
                className="w-full"
              >
                {editingNote ? 'Update Note' : 'Create Note'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="private">Private</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
          </TabsList>
          
          {/* Search */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="pl-10"
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          {/* Notes Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-border/50 animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded" />
                      <div className="h-4 bg-muted rounded w-5/6" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredNotes.length === 0 ? (
              <Card className="col-span-full border-border/50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-1">No notes yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Create your first note to get started</p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Note
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredNotes.map((note) => (
                <Card
                  key={note.id}
                  className={cn(
                    'border-border/50 shadow-soft transition-all duration-200',
                    'hover:shadow-md hover:border-border cursor-pointer group'
                  )}
                  onClick={() => openEditDialog(note)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base line-clamp-1">{note.title}</CardTitle>
                      <Badge variant="secondary" className="shrink-0 flex items-center gap-1">
                        {getVisibilityIcon(note.visibility)}
                        <span className="capitalize text-xs">{note.visibility}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {note.content || 'No content'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.updated_at), 'MMM d, yyyy')}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(note);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}