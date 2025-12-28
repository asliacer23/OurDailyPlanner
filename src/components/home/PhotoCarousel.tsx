import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GalleryPhoto {
  id: string;
  photo_url: string;
  title: string | null;
  description: string | null;
  author_id: string;
  created_at: string;
}

export function PhotoCarousel() {
  const { user, workspace } = useAuth();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPhoto, setNewPhoto] = useState({ title: '', description: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = async () => {
    if (!workspace?.id) return;
    try {
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [workspace?.id]);

  // Auto-rotate carousel
  useEffect(() => {
    if (photos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [photos.length]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id || !workspace?.id) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('photo-gallery')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('photo-gallery')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('gallery_photos').insert({
        photo_url: publicUrl,
        title: newPhoto.title || null,
        description: newPhoto.description || null,
        author_id: user.id,
        workspace_id: workspace.id,
      });

      if (dbError) throw dbError;

      toast.success('Photo uploaded!');
      setNewPhoto({ title: '', description: '' });
      setDialogOpen(false);
      fetchPhotos();
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    try {
      const { error } = await supabase.from('gallery_photos').delete().eq('id', photoId);
      if (error) throw error;
      toast.success('Photo deleted');
      fetchPhotos();
      setCurrentIndex(0);
    } catch (error) {
      toast.error('Failed to delete photo');
    }
  };

  const goToPrev = () => setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % photos.length);

  if (loading) {
    return (
      <Card className="border-border/50 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="font-display flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Our Memories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-[16/9] bg-muted rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-soft overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Our Memories
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Photo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Title (optional)</Label>
                  <Input
                    value={newPhoto.title}
                    onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
                    placeholder="Photo title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    value={newPhoto.description}
                    onChange={(e) => setNewPhoto({ ...newPhoto, description: e.target.value })}
                    placeholder="A short description"
                  />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Select & Upload Photo'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {photos.length === 0 ? (
          <div className="aspect-[16/9] flex flex-col items-center justify-center bg-muted/30 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">No photos yet</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add your first memory
            </Button>
          </div>
        ) : (
          <div className="relative group">
            {/* 3D Carousel Container */}
            <div className="aspect-[16/9] overflow-hidden perspective-1000">
              <div className="relative h-full flex items-center justify-center">
                {photos.map((photo, idx) => {
                  const offset = idx - currentIndex;
                  const isActive = offset === 0;
                  const isPrev = offset === -1 || (currentIndex === 0 && idx === photos.length - 1);
                  const isNext = offset === 1 || (currentIndex === photos.length - 1 && idx === 0);

                  if (!isActive && !isPrev && !isNext) return null;

                  return (
                    <div
                      key={photo.id}
                      className={cn(
                        'absolute inset-0 transition-all duration-500 ease-out',
                        isActive && 'z-20 scale-100 opacity-100 translate-x-0',
                        isPrev && 'z-10 scale-75 opacity-40 -translate-x-1/3 rotate-y-15',
                        isNext && 'z-10 scale-75 opacity-40 translate-x-1/3 -rotate-y-15'
                      )}
                      style={{
                        transform: isActive
                          ? 'translateX(0) scale(1) rotateY(0)'
                          : isPrev
                          ? 'translateX(-40%) scale(0.8) rotateY(25deg)'
                          : 'translateX(40%) scale(0.8) rotateY(-25deg)',
                      }}
                    >
                      <img
                        src={photo.photo_url}
                        alt={photo.title || 'Memory'}
                        className="w-full h-full object-cover"
                      />
                      {isActive && photo.title && (
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <h3 className="text-white font-semibold">{photo.title}</h3>
                          {photo.description && (
                            <p className="text-white/80 text-sm">{photo.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={goToPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Dots */}
                <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1">
                  {photos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={cn(
                        'w-2 h-2 rounded-full transition-all',
                        idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                      )}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Delete button for current photo */}
            {photos[currentIndex]?.author_id === user?.id && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                onClick={() => handleDelete(photos[currentIndex].id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
