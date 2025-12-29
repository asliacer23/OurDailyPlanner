import { useState, useEffect } from 'react';
import { Plus, Film, Star, Check, Trash2 } from 'lucide-react';
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
import { useOnlineStatus, useOnReconnect } from '@/hooks/useOnlineStatus';
import { fetchWithCache, subscribeToTable } from '@/lib/cacheAndSync';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ViewModal } from '@/components/shared/ViewModal';
import { AuthorBadge } from '@/components/shared/AuthorBadge';

interface Movie {
  id: string;
  title: string;
  year: number | null;
  genre: string | null;
  rating: number | null;
  is_watched: boolean;
  notes: string | null;
  visibility: 'private' | 'shared' | 'business';
  author_id: string;
  created_at: string;
  author?: { id: string; display_name: string | null; avatar_url: string | null };
}

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Documentary', 'Animation'];

export default function MoviesPage() {
  const { user, workspace } = useAuth();
  const { isOnline } = useOnlineStatus();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [viewingMovie, setViewingMovie] = useState<Movie | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [newMovie, setNewMovie] = useState<{
    title: string;
    year: string;
    genre: string;
    rating: string;
    is_watched: boolean;
    notes: string;
    visibility: 'private' | 'shared' | 'business';
  }>({
    title: '',
    year: '',
    genre: '',
    rating: '',
    is_watched: false,
    notes: '',
    visibility: 'shared',
  });

  const fetchMovies = async () => {
    if (!workspace?.id) return;
    try {
      const data = await fetchWithCache(
        () => supabase
          .from('movies_watch_list')
          .select('*, author:profiles!movies_watch_list_author_id_fkey(id, display_name, avatar_url)')
          .eq('workspace_id', workspace.id)
          .order('created_at', { ascending: false }),
        { cacheKey: `movies_${workspace.id}`, ttl: 3600000 }
      );
      setMovies(data as Movie[]);
    } catch (error) {
      if (isOnline) {
        toast.error('Failed to load movies');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
    if (!workspace?.id) return;

    const unsubscribe = subscribeToTable(
      'movies_watch_list',
      {
        event: '*',
        schema: 'public',
        filter: `workspace_id=eq.${workspace.id}`,
      },
      {
        onUpdate: (payload) => {
          setMovies((prev) =>
            prev.map((m) => (m.id === payload.new.id ? (payload.new as Movie) : m))
          );
        },
        onInsert: (payload) => {
          setMovies((prev) => [payload.new as Movie, ...prev]);
        },
        onDelete: (payload) => {
          setMovies((prev) => prev.filter((m) => m.id !== payload.old.id));
        },
      }
    );

    return () => unsubscribe();
  }, [workspace?.id]);

  useOnReconnect(async () => {
    if (workspace?.id) {
      await fetchMovies();
    }
  });

  const handleCreate = async () => {
    if (!user?.id || !workspace?.id || !newMovie.title) {
      toast.error('Please enter a title');
      return;
    }

    try {
      const { error } = await supabase.from('movies_watch_list').insert({
        title: newMovie.title,
        year: newMovie.year ? parseInt(newMovie.year) : null,
        genre: newMovie.genre || null,
        rating: newMovie.rating ? parseInt(newMovie.rating) : null,
        is_watched: newMovie.is_watched,
        notes: newMovie.notes || null,
        visibility: newMovie.visibility,
        author_id: user.id,
        workspace_id: workspace.id,
      });

      if (error) throw error;
      toast.success('Movie added!');
      resetForm();
      fetchMovies();
    } catch (error) {
      toast.error('Failed to add movie');
    }
  };

  const handleUpdate = async () => {
    if (!editingMovie) return;
    try {
      const { error } = await supabase
        .from('movies_watch_list')
        .update({
          title: newMovie.title,
          year: newMovie.year ? parseInt(newMovie.year) : null,
          genre: newMovie.genre || null,
          rating: newMovie.rating ? parseInt(newMovie.rating) : null,
          is_watched: newMovie.is_watched,
          notes: newMovie.notes || null,
          visibility: newMovie.visibility,
        })
        .eq('id', editingMovie.id);

      if (error) throw error;
      toast.success('Movie updated!');
      resetForm();
      fetchMovies();
    } catch (error) {
      toast.error('Failed to update movie');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('movies_watch_list').delete().eq('id', id);
      if (error) throw error;
      toast.success('Movie removed');
      setViewingMovie(null);
      fetchMovies();
    } catch (error) {
      toast.error('Failed to delete movie');
    }
  };

  const toggleWatched = async (movie: Movie) => {
    try {
      const { error } = await supabase
        .from('movies_watch_list')
        .update({ is_watched: !movie.is_watched })
        .eq('id', movie.id);
      if (error) throw error;
      fetchMovies();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const resetForm = () => {
    setNewMovie({ title: '', year: '', genre: '', rating: '', is_watched: false, notes: '', visibility: 'shared' });
    setEditingMovie(null);
    setDialogOpen(false);
  };

  const openEditDialog = (movie: Movie) => {
    setEditingMovie(movie);
    setNewMovie({
      title: movie.title,
      year: movie.year?.toString() || '',
      genre: movie.genre || '',
      rating: movie.rating?.toString() || '',
      is_watched: movie.is_watched,
      notes: movie.notes || '',
      visibility: movie.visibility,
    });
    setViewingMovie(null);
    setDialogOpen(true);
  };

  const filteredMovies = (movies || []).filter(m => {
    if (activeTab === 'watchlist') return !m.is_watched;
    if (activeTab === 'watched') return m.is_watched;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Movies</h1>
          <p className="text-muted-foreground">Track movies to watch together</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Movie</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingMovie ? 'Edit Movie' : 'Add Movie'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newMovie.title} onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })} placeholder="Movie title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input type="number" value={newMovie.year} onChange={(e) => setNewMovie({ ...newMovie, year: e.target.value })} placeholder="2024" />
                </div>
                <div className="space-y-2">
                  <Label>Genre</Label>
                  <Select value={newMovie.genre} onValueChange={(v) => setNewMovie({ ...newMovie, genre: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Your Rating (1-10)</Label>
                  <Input type="number" min="1" max="10" value={newMovie.rating} onChange={(e) => setNewMovie({ ...newMovie, rating: e.target.value })} placeholder="8" />
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select value={newMovie.visibility} onValueChange={(v) => setNewMovie({ ...newMovie, visibility: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">🔒 Private</SelectItem>
                      <SelectItem value="shared">👫 Shared</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={newMovie.notes} onChange={(e) => setNewMovie({ ...newMovie, notes: e.target.value })} placeholder="Why you want to watch it..." rows={2} />
              </div>
              <Button onClick={editingMovie ? handleUpdate : handleCreate} className="w-full">
                {editingMovie ? 'Update Movie' : 'Add Movie'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({movies?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist ({movies?.filter(m => !m.is_watched)?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="watched">Watched ({movies?.filter(m => m.is_watched)?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="border-border/50 animate-pulse">
                  <CardContent className="p-4"><div className="h-24 bg-muted rounded" /></CardContent>
                </Card>
              ))
            ) : filteredMovies.length === 0 ? (
              <Card className="col-span-full border-border/50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Film className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-1">No movies</h3>
                  <p className="text-sm text-muted-foreground mb-4">Add movies to your list</p>
                  <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Movie</Button>
                </CardContent>
              </Card>
            ) : (
              filteredMovies.map((movie) => (
                <Card 
                  key={movie.id} 
                  className={cn(
                    'border-border/50 shadow-soft hover:shadow-md transition-all cursor-pointer group',
                    movie.is_watched && 'opacity-75'
                  )}
                  onClick={() => setViewingMovie(movie)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleWatched(movie); }}
                        className={cn(
                          'h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors',
                          movie.is_watched ? 'bg-success border-success text-success-foreground' : 'border-muted-foreground hover:border-primary'
                        )}
                      >
                        {movie.is_watched && <Check className="h-4 w-4" />}
                      </button>
                      <AuthorBadge author={movie.author || null} size="sm" />
                    </div>
                    <h3 className={cn('font-semibold line-clamp-2 mb-1', movie.is_watched && 'line-through')}>
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {movie.year && <span>{movie.year}</span>}
                      {movie.genre && <Badge variant="secondary" className="text-xs">{movie.genre}</Badge>}
                    </div>
                    {movie.rating && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="font-medium">{movie.rating}/10</span>
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
        open={!!viewingMovie}
        onOpenChange={(open) => !open && setViewingMovie(null)}
        title={viewingMovie?.title || ''}
        author={viewingMovie?.author || null}
        createdAt={viewingMovie?.created_at}
        visibility={viewingMovie?.visibility}
        onEdit={() => viewingMovie && openEditDialog(viewingMovie)}
        onDelete={() => viewingMovie && handleDelete(viewingMovie.id)}
        canEdit={viewingMovie?.author_id === user?.id}
        canDelete={viewingMovie?.author_id === user?.id}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {viewingMovie?.year && <Badge variant="outline">{viewingMovie.year}</Badge>}
            {viewingMovie?.genre && <Badge variant="secondary">{viewingMovie.genre}</Badge>}
            {viewingMovie?.is_watched && <Badge className="bg-success text-success-foreground">Watched</Badge>}
          </div>
          {viewingMovie?.rating && (
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
              <span className="text-lg font-semibold">{viewingMovie.rating}/10</span>
            </div>
          )}
          {viewingMovie?.notes && <p className="text-muted-foreground">{viewingMovie.notes}</p>}
        </div>
      </ViewModal>
    </div>
  );
}
