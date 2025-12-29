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
import { useEditRequests } from '@/hooks/useEditRequests';
import { useOnlineStatus, useOnReconnect } from '@/hooks/useOnlineStatus';
import { fetchWithCache, subscribeToTable } from '@/lib/cacheAndSync';
import { EditConfirmationDialog } from '@/components/shared/EditConfirmationDialog';
import { ViewModal } from '@/components/shared/ViewModal';
import { AuthorBadge } from '@/components/shared/AuthorBadge';
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
  author?: { id: string; display_name: string | null; avatar_url: string | null };
}

export default function NotesPage() {
  const { user, workspace, profile } = useAuth();
  const { pendingEdits, requestEdit, approveEdit, rejectEdit } = useEditRequests(workspace?.id || null);
  const { isOnline } = useOnlineStatus();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingEditToShow, setPendingEditToShow] = useState<any>(null);
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
      // Use cache-first strategy for offline support
      const data = await fetchWithCache<Note[]>(
        supabase
          .from('notes')
          .select('*, author:profiles!notes_author_id_fkey(id, display_name, avatar_url)')
          .eq('workspace_id', workspace.id)
          .order('updated_at', { ascending: false }),
        {
          cacheKey: `notes_${workspace.id}`,
          ttl: 300000, // 5 minutes
        }
      );

      if (data) {
        setNotes(data);
      }
    } catch (error: any) {
      console.error('Failed to load notes:', error);
      if (isOnline) {
        toast.error('Failed to load notes');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspace?.id) {
      fetchNotes();

      // Setup real-time subscription
      const unsubscribe = subscribeToTable<Note>(
        'notes',
        (updated) => {
          if (updated.workspace_id === workspace.id) {
            setNotes((prev) =>
              prev.map((n) => (n.id === updated.id ? updated : n))
            );
            toast.success('Note updated');
          }
        },
        (newNote) => {
          if (newNote.workspace_id === workspace.id) {
            setNotes((prev) => [newNote, ...prev]);
            toast.success('New note added');
          }
        },
        (deleted) => {
          if (deleted.workspace_id === workspace.id) {
            setNotes((prev) => prev.filter((n) => n.id !== deleted.id));
            toast.success('Note deleted');
          }
        },
        `workspace_id=eq.${workspace.id}`
      );

      return unsubscribe;
    }
  }, [workspace?.id, isOnline]);

  // Sync notes when reconnecting
  useOnReconnect(async () => {
    if (workspace?.id) {
      await fetchNotes();
    }
  });

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

    // Check if editing own note
    if (editingNote.author_id === user.id) {
      // Direct update - author can always edit own notes
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
    } else {
      // Request approval from partner
      const editId = await requestEdit(
        'note',
        editingNote.id,
        'edit',
        { 
          title: newNote.title,
          content: newNote.content || null,
          visibility: newNote.visibility
        },
        `Updated note: "${editingNote.title}" → "${newNote.title}"`
      );

      if (editId) {
        toast.info('Approval request sent to your partner');
        resetForm();
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const noteToDelete = notes.find(n => n.id === noteId);
    if (!noteToDelete) return;

    // Check if deleting own note
    if (noteToDelete.author_id === user?.id) {
      // Direct delete - author can always delete own notes
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
    } else {
      // Request approval from partner
      const editId = await requestEdit(
        'note',
        noteId,
        'delete',
        null,
        `Requested deletion of note: "${noteToDelete.title}"`
      );

      if (editId) {
        toast.info('Delete request sent to your partner');
      }
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

  // Show pending edits that need current user's approval
  const myPendingApprovals = pendingEdits.filter(e => e.content_type === 'note' && e.approver_id === user?.id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Pending Approval Dialogs */}
      {myPendingApprovals.map(edit => (
        <EditConfirmationDialog
          key={edit.id}
          isOpen={showConfirmDialog && pendingEditToShow?.id === edit.id}
          requesterName={edit.requester?.display_name || 'Partner'}
          contentType="Note"
          action={edit.action as 'edit' | 'delete'}
          changeDescription={edit.change_description}
          newData={edit.new_data}
          originalData={edit.original_data}
          onApprove={async (editId) => {
            await approveEdit(editId);
            setShowConfirmDialog(false);
            setPendingEditToShow(null);
            fetchNotes();
          }}
          onReject={async (editId) => {
            await rejectEdit(editId);
            setShowConfirmDialog(false);
            setPendingEditToShow(null);
          }}
          onClose={() => {
            setShowConfirmDialog(false);
            setPendingEditToShow(null);
          }}
          editId={edit.id}
        />
      ))}
      
      {/* Show notification badge if there are pending approvals */}
      {myPendingApprovals.length > 0 && !showConfirmDialog && (
        <div className="fixed bottom-24 right-4 z-50">
          <Button
            onClick={() => {
              setShowConfirmDialog(true);
              setPendingEditToShow(myPendingApprovals[0]);
            }}
            className="gap-2"
          >
            {myPendingApprovals.length} Edit{myPendingApprovals.length !== 1 ? 's' : ''} Need Approval
          </Button>
        </div>
      )}

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

      {/* View Modal */}
      <ViewModal
        open={!!viewingNote}
        onOpenChange={(open) => !open && setViewingNote(null)}
        title={viewingNote?.title || ''}
        createdAt={viewingNote?.created_at}
        visibility={viewingNote?.visibility}
        onEdit={() => viewingNote && openEditDialog(viewingNote)}
        onDelete={() => viewingNote && handleDeleteNote(viewingNote.id)}
        canEdit={true}
        canDelete={true}
        author={viewingNote?.author || null}
      >
        <div className="space-y-4">
          {viewingNote?.content && <p className="text-foreground whitespace-pre-wrap">{viewingNote.content}</p>}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Last updated: {viewingNote?.updated_at ? format(new Date(viewingNote.updated_at), 'MMMM d, yyyy') : 'Unknown'}</span>
          </div>
        </div>
      </ViewModal>

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
                  onClick={() => setViewingNote(note)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base line-clamp-1">{note.title}</CardTitle>
                      <Badge variant="secondary" className="shrink-0 flex items-center gap-1">
                        {getVisibilityIcon(note.visibility)}
                        <span className="capitalize text-xs">{note.visibility}</span>
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <AuthorBadge author={note.author || null} size="sm" />
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