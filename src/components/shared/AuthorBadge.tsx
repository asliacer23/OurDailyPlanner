import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Author {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface AuthorBadgeProps {
  author: Author | null;
  size?: 'sm' | 'md';
  showName?: boolean;
}

export function AuthorBadge({ author, size = 'sm', showName = false }: AuthorBadgeProps) {
  if (!author) return null;

  const initials = author.display_name?.[0]?.toUpperCase() || 'U';
  const sizeClasses = size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-7 w-7 text-xs';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <Avatar className={sizeClasses}>
              <AvatarImage src={author.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            {showName && (
              <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                {author.display_name}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Created by {author.display_name || 'Unknown'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
