import { Bell, Menu, MessageCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from './ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { OfflineIndicator } from '@/components/shared/OfflineIndicator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { Profile } from '@/features/auth/hooks/useAuth';

interface HeaderProps {
  profile: Profile | null;
  onMenuToggle: () => void;
  onSignOut: () => void;
  unreadNotifications?: number;
  unreadMessages?: number;
}

export function Header({ 
  profile, 
  onMenuToggle, 
  onSignOut,
  unreadNotifications = 0,
  unreadMessages = 0,
}: HeaderProps) {
  const navigate = useNavigate();
  
  const initials = profile?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="hidden sm:flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-display font-bold text-sm">LP</span>
            </div>
            <span className="font-display font-semibold text-base hidden md:inline">
              Life Planner
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 lg:gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => navigate('/messages')}
          >
            <MessageCircle className="h-5 w-5" />
            {unreadMessages > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {unreadMessages}
              </Badge>
            )}
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {unreadNotifications}
              </Badge>
            )}
          </Button>

          <ThemeToggle />

          <OfflineIndicator />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.display_name || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.display_name}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} className="text-destructive">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
