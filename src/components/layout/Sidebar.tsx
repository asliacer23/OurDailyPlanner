import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  MessageCircle,
  Wallet,
  Settings,
  X,
  Heart,
  CheckSquare,
  Target,
  ShoppingCart,
  Bell,
  Book,
  Film,
  Plane,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navSections = [
  {
    title: 'Main',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/calendar', label: 'Calendar', icon: Calendar },
      { href: '/messages', label: 'Messages', icon: MessageCircle },
      { href: '/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    title: 'Planning',
    items: [
      { href: '/notes', label: 'Notes', icon: FileText },
      { href: '/tasks', label: 'Tasks', icon: CheckSquare },
      { href: '/goals', label: 'Goals', icon: Target },
      { href: '/shopping', label: 'Shopping Lists', icon: ShoppingCart },
    ],
  },
  {
    title: 'Lifestyle',
    items: [
      { href: '/finance', label: 'Finance', icon: Wallet },
      { href: '/travel', label: 'Travel Plans', icon: Plane },
      { href: '/movies', label: 'Movies', icon: Film },
      { href: '/books', label: 'Books', icon: Book },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border',
          'transform transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-semibold text-sm">Life Planner</span>
                <span className="text-xs text-muted-foreground">Shared workspace</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1">
            <nav className="p-3 space-y-4">
              {navSections.map((section) => (
                <div key={section.title}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
                    {section.title}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.href || 
                        (item.href !== '/' && location.pathname.startsWith(item.href));
                      
                      return (
                        <NavLink
                          key={item.href}
                          to={item.href}
                          onClick={onClose}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                            'transition-all duration-200',
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                          )}
                        >
                          <item.icon className={cn('h-4 w-4', isActive && 'text-primary')} />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">Together since</p>
                <p className="text-xs text-muted-foreground">2024</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
