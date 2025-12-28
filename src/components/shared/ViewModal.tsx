import { ReactNode } from 'react';
import { format } from 'date-fns';
import { Trash2, Edit2, X, User, Calendar, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface Author {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  author?: Author | null;
  createdAt?: string;
  visibility?: 'private' | 'shared' | 'business';
  onEdit?: () => void;
  onDelete?: () => void;
  children: ReactNode;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function ViewModal({
  open,
  onOpenChange,
  title,
  author,
  createdAt,
  visibility,
  onEdit,
  onDelete,
  children,
  canEdit = true,
  canDelete = true,
}: ViewModalProps) {
  const initials = author?.display_name?.[0]?.toUpperCase() || 'U';

  const getVisibilityLabel = (vis: string) => {
    switch (vis) {
      case 'private': return '🔒 Private';
      case 'shared': return '👫 Shared';
      case 'business': return '💼 Business';
      default: return vis;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl font-display pr-8">{title}</DialogTitle>
          </div>
        </DialogHeader>

        {/* Author & Meta Info */}
        <div className="flex items-center justify-between py-3 border-y border-border/50">
          <div className="flex items-center gap-3">
            {author && (
              <>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={author.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{author.display_name || 'Unknown'}</p>
                  {createdAt && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(createdAt), 'MMM d, yyyy • h:mm a')}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          {visibility && (
            <Badge variant="secondary" className="text-xs">
              {getVisibilityLabel(visibility)}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="py-4">
          {children}
        </div>

        {/* Actions */}
        {(canEdit || canDelete) && (
          <>
            <Separator />
            <div className="flex justify-end gap-2 pt-4">
              {canDelete && onDelete && (
                <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              {canEdit && onEdit && (
                <Button size="sm" onClick={onEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
