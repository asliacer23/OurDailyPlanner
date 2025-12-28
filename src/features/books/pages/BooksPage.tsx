import { useState, useEffect } from 'react';
import { Plus, BookOpen, Star, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import { ViewModal } from '@/components/shared/ViewModal';
import { AuthorBadge } from '@/components/shared/AuthorBadge';

interface Book {
  id: string;
  title: string;
  book_author: string | null;
  genre: string | null;
  rating: number | null;
  is_read: boolean;
  notes: string | null;
  visibility: 'private' | 'shared' | 'business';
  author_id: string;
  created_at: string;
  author?: { id: string; display_name: string | null; avatar_url: string | null };
}

const GENRES = ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography', 'Self-Help', 'History'];

export default function BooksPage() {
  const { user, workspace } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [newBook, setNewBook] = useState<{
    title: string;
    book_author: string;
    genre: string;
    rating: string;
    is_read: boolean;
    notes: string;
    visibility: 'private' | 'shared' | 'business';
  }>({
    title: '',
    book_author: '',
    genre: '',
    rating: '',
    is_read: false,
    notes: '',
    visibility: 'shared',
  });

  const fetchBooks = async () => {
    if (!workspace?.id) return;
    try {
      const { data, error } = await supabase
        .from('books_read_list')
        .select('*, author:profiles!books_read_list_author_id_fkey(id, display_name, avatar_url)')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data as Book[]);
    } catch (error) {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [workspace?.id]);

  const handleCreate = async () => {
    if (!user?.id || !workspace?.id || !newBook.title) {
      toast.error('Please enter a title');
      return;
    }

    try {
      const { error } = await supabase.from('books_read_list').insert({
        title: newBook.title,
        book_author: newBook.book_author || null,
        genre: newBook.genre || null,
        rating: newBook.rating ? parseInt(newBook.rating) : null,
        is_read: newBook.is_read,
        notes: newBook.notes || null,
        visibility: newBook.visibility,
        author_id: user.id,
        workspace_id: workspace.id,
      });

      if (error) throw error;
      toast.success('Book added!');
      resetForm();
      fetchBooks();
    } catch (error) {
      toast.error('Failed to add book');
    }
  };

  const handleUpdate = async () => {
    if (!editingBook) return;
    try {
      const { error } = await supabase
        .from('books_read_list')
        .update({
          title: newBook.title,
          book_author: newBook.book_author || null,
          genre: newBook.genre || null,
          rating: newBook.rating ? parseInt(newBook.rating) : null,
          is_read: newBook.is_read,
          notes: newBook.notes || null,
          visibility: newBook.visibility,
        })
        .eq('id', editingBook.id);

      if (error) throw error;
      toast.success('Book updated!');
      resetForm();
      fetchBooks();
    } catch (error) {
      toast.error('Failed to update book');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('books_read_list').delete().eq('id', id);
      if (error) throw error;
      toast.success('Book removed');
      setViewingBook(null);
      fetchBooks();
    } catch (error) {
      toast.error('Failed to delete book');
    }
  };

  const toggleRead = async (book: Book) => {
    try {
      const { error } = await supabase
        .from('books_read_list')
        .update({ is_read: !book.is_read })
        .eq('id', book.id);
      if (error) throw error;
      fetchBooks();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const resetForm = () => {
    setNewBook({ title: '', book_author: '', genre: '', rating: '', is_read: false, notes: '', visibility: 'shared' });
    setEditingBook(null);
    setDialogOpen(false);
  };

  const openEditDialog = (book: Book) => {
    setEditingBook(book);
    setNewBook({
      title: book.title,
      book_author: book.book_author || '',
      genre: book.genre || '',
      rating: book.rating?.toString() || '',
      is_read: book.is_read,
      notes: book.notes || '',
      visibility: book.visibility,
    });
    setViewingBook(null);
    setDialogOpen(true);
  };

  const filteredBooks = books.filter(b => {
    if (activeTab === 'reading') return !b.is_read;
    if (activeTab === 'read') return b.is_read;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Books</h1>
          <p className="text-muted-foreground">Track your reading journey</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Book</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingBook ? 'Edit Book' : 'Add Book'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newBook.title} onChange={(e) => setNewBook({ ...newBook, title: e.target.value })} placeholder="Book title" />
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input value={newBook.book_author} onChange={(e) => setNewBook({ ...newBook, book_author: e.target.value })} placeholder="Book author" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Genre</Label>
                  <Select value={newBook.genre} onValueChange={(v) => setNewBook({ ...newBook, genre: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rating (1-5)</Label>
                  <Input type="number" min="1" max="5" value={newBook.rating} onChange={(e) => setNewBook({ ...newBook, rating: e.target.value })} placeholder="5" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={newBook.notes} onChange={(e) => setNewBook({ ...newBook, notes: e.target.value })} placeholder="Your thoughts..." rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={newBook.visibility} onValueChange={(v) => setNewBook({ ...newBook, visibility: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">🔒 Private</SelectItem>
                    <SelectItem value="shared">👫 Shared</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={editingBook ? handleUpdate : handleCreate} className="w-full">
                {editingBook ? 'Update Book' : 'Add Book'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({books.length})</TabsTrigger>
          <TabsTrigger value="reading">To Read ({books.filter(b => !b.is_read).length})</TabsTrigger>
          <TabsTrigger value="read">Read ({books.filter(b => b.is_read).length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="border-border/50 animate-pulse">
                  <CardContent className="p-4"><div className="h-28 bg-muted rounded" /></CardContent>
                </Card>
              ))
            ) : filteredBooks.length === 0 ? (
              <Card className="col-span-full border-border/50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-1">No books</h3>
                  <p className="text-sm text-muted-foreground mb-4">Add books to your list</p>
                  <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Book</Button>
                </CardContent>
              </Card>
            ) : (
              filteredBooks.map((book) => (
                <Card 
                  key={book.id} 
                  className={cn(
                    'border-border/50 shadow-soft hover:shadow-md transition-all cursor-pointer',
                    book.is_read && 'opacity-75'
                  )}
                  onClick={() => setViewingBook(book)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleRead(book); }}
                        className={cn(
                          'h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors',
                          book.is_read ? 'bg-success border-success text-success-foreground' : 'border-muted-foreground hover:border-primary'
                        )}
                      >
                        {book.is_read && <Check className="h-4 w-4" />}
                      </button>
                      <AuthorBadge author={book.author || null} size="sm" />
                    </div>
                    <h3 className={cn('font-semibold line-clamp-2 mb-1', book.is_read && 'line-through')}>
                      {book.title}
                    </h3>
                    {book.book_author && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">by {book.book_author}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      {book.genre && <Badge variant="secondary" className="text-xs">{book.genre}</Badge>}
                    </div>
                    {book.rating && (
                      <div className="flex items-center gap-0.5 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={cn(
                              'h-4 w-4',
                              i < book.rating! ? 'fill-yellow-500 text-yellow-500' : 'text-muted'
                            )} 
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ViewModal
        open={!!viewingBook}
        onOpenChange={(open) => !open && setViewingBook(null)}
        title={viewingBook?.title || ''}
        author={viewingBook?.author || null}
        createdAt={viewingBook?.created_at}
        visibility={viewingBook?.visibility}
        onEdit={() => viewingBook && openEditDialog(viewingBook)}
        onDelete={() => viewingBook && handleDelete(viewingBook.id)}
        canEdit={viewingBook?.author_id === user?.id}
        canDelete={viewingBook?.author_id === user?.id}
      >
        <div className="space-y-4">
          {viewingBook?.book_author && (
            <p className="text-lg text-muted-foreground">by {viewingBook.book_author}</p>
          )}
          <div className="flex items-center gap-3">
            {viewingBook?.genre && <Badge variant="secondary">{viewingBook.genre}</Badge>}
            {viewingBook?.is_read && <Badge className="bg-success text-success-foreground">Read</Badge>}
          </div>
          {viewingBook?.rating && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={cn(
                    'h-5 w-5',
                    i < viewingBook.rating! ? 'fill-yellow-500 text-yellow-500' : 'text-muted'
                  )} 
                />
              ))}
            </div>
          )}
          {viewingBook?.notes && <p className="text-muted-foreground">{viewingBook.notes}</p>}
        </div>
      </ViewModal>
    </div>
  );
}
