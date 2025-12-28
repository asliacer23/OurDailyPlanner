import { useState, useEffect, useRef } from 'react';
import { Send, Heart, Smile, Image as ImageIcon, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
}

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const QUICK_REACTIONS = ['❤️', '😊', '👍', '😂', '🎉', '💕'];

export default function MessagesPage() {
  const { user, workspace, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchMessages = async () => {
    if (!workspace?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data as Message[]);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    if (!workspace?.id) return;

    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          user_id,
          profiles (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('workspace_id', workspace.id);

      if (error) throw error;

      const profileMap: Record<string, Profile> = {};
      data?.forEach((member: any) => {
        if (member.profiles) {
          profileMap[member.profiles.id] = member.profiles;
        }
      });
      setProfiles(profileMap);
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    }
  };

  useEffect(() => {
    if (workspace?.id) {
      fetchMessages();
      fetchProfiles();
    }
  }, [workspace?.id]);

  useEffect(() => {
    if (!workspace?.id) return;

    // Subscribe to realtime messages
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspace?.id]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.id || !workspace?.id || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const { error } = await supabase.from('messages').insert({
        content: messageContent,
        sender_id: user.id,
        workspace_id: workspace.id,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageContent);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickReaction = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d, h:mm a');
  };

  const getProfile = (senderId: string) => profiles[senderId];

  const groupMessagesByDate = () => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    messages.forEach((message) => {
      const messageDate = format(new Date(message.created_at), 'yyyy-MM-dd');
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Messages</h1>
          <p className="text-muted-foreground">Chat with your partner</p>
        </div>
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary animate-pulse-soft" />
        </div>
      </div>

      <div className="flex-1 bg-card border border-border/50 rounded-lg shadow-soft overflow-hidden flex flex-col">
        {/* Messages Area */}
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Heart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">No messages yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start a conversation with your partner
              </p>
              <div className="flex gap-2 flex-wrap justify-center">
                {['Hey! 👋', 'I love you! ❤️', 'How are you?'].map((msg) => (
                  <Button
                    key={msg}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewMessage(msg);
                      inputRef.current?.focus();
                    }}
                  >
                    {msg}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {groupMessagesByDate().map((group) => (
                <div key={group.date}>
                  <div className="flex items-center gap-4 my-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground px-2">
                      {getDateLabel(group.date)}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  
                  <div className="space-y-4">
                    {group.messages.map((message) => {
                      const isOwn = message.sender_id === user?.id;
                      const senderProfile = getProfile(message.sender_id);
                      const initials = senderProfile?.display_name?.[0]?.toUpperCase() || 'U';

                      return (
                        <div
                          key={message.id}
                          className={cn(
                            'flex gap-3',
                            isOwn && 'flex-row-reverse'
                          )}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={senderProfile?.avatar_url || ''} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              'max-w-[75%] rounded-2xl px-4 py-2',
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                : 'bg-muted rounded-tl-sm'
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            <p
                              className={cn(
                                'text-xs mt-1',
                                isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              )}
                            >
                              {formatMessageDate(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Quick Reactions */}
        <div className="px-4 py-2 border-t border-border/50 flex gap-2 overflow-x-auto">
          {QUICK_REACTIONS.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-lg hover:scale-110 transition-transform"
              onClick={() => handleQuickReaction(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              disabled={sending}
            />
            <Button type="submit" disabled={!newMessage.trim() || sending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}