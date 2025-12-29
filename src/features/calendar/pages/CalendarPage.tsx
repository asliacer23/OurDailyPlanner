import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEditRequests } from '@/hooks/useEditRequests';
import { EditConfirmationDialog } from '@/components/shared/EditConfirmationDialog';
import { AuthorBadge } from '@/components/shared/AuthorBadge';
import { ViewModal } from '@/components/shared/ViewModal';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  all_day: boolean;
  color: string;
  visibility: 'private' | 'shared' | 'business';
  author_id: string;
  author?: Profile;
  created_at?: string;
}

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EVENT_COLORS = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EF4444', label: 'Red' },
];

export default function CalendarPage() {
  const { user, workspace } = useAuth();
  const { pendingEdits, requestEdit, approveEdit, rejectEdit } = useEditRequests(workspace?.id || null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showPendingEdit, setShowPendingEdit] = useState(false);
  
  const [newEvent, setNewEvent] = useState<{
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    all_day: boolean;
    color: string;
    visibility: 'private' | 'shared' | 'business';
  }>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    all_day: false,
    color: '#3B82F6',
    visibility: 'shared',
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = useMemo(() => 
    eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart.getTime(), calendarEnd.getTime()]
  );

  const fetchEvents = async () => {
    if (!workspace?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data as Event[]);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [workspace?.id]);

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getEventsForDay = (day: Date) => 
    events.filter(event => {
      const eventDate = new Date(event.start_time);
      return isSameDay(eventDate, day);
    });

  const handleCreateEvent = async () => {
    if (!user?.id || !workspace?.id || !newEvent.title || !selectedDate) return;

    const startTime = newEvent.all_day 
      ? new Date(selectedDate.setHours(0, 0, 0, 0)).toISOString()
      : new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${newEvent.start_time}`).toISOString();
    
    const endTime = newEvent.end_time && !newEvent.all_day
      ? new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${newEvent.end_time}`).toISOString()
      : null;

    try {
      const { error } = await supabase.from('events').insert({
        title: newEvent.title,
        description: newEvent.description || null,
        start_time: startTime,
        end_time: endTime,
        all_day: newEvent.all_day,
        color: newEvent.color,
        visibility: newEvent.visibility,
        author_id: user.id,
        workspace_id: workspace.id,
      });

      if (error) throw error;
      
      toast.success('Event created!');
      resetForm();
      fetchEvents();
    } catch (error: any) {
      toast.error('Failed to create event');
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !user?.id) return;

    // Check if editing own event
    if (editingEvent.author_id === user.id) {
      // Direct update - author can always edit own events
      try {
        const { error } = await supabase
          .from('events')
          .update({
            title: newEvent.title,
            description: newEvent.description || null,
            color: newEvent.color,
            visibility: newEvent.visibility,
          })
          .eq('id', editingEvent.id);

        if (error) throw error;
        
        toast.success('Event updated!');
        resetForm();
        fetchEvents();
      } catch (error) {
        toast.error('Failed to update event');
      }
    } else {
      // Request approval from partner
      const editId = await requestEdit(
        'event',
        editingEvent.id,
        'edit',
        { 
          title: newEvent.title,
          description: newEvent.description || null,
          color: newEvent.color,
          visibility: newEvent.visibility
        },
        `Updated event: "${editingEvent.title}" → "${newEvent.title}"`
      );

      if (editId) {
        toast.info('Approval request sent to your partner');
        resetForm();
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const eventToDelete = events.find(e => e.id === eventId);
    if (!eventToDelete) return;

    // Check if deleting own event
    if (eventToDelete.author_id === user?.id) {
      // Direct delete - author can always delete own events
      try {
        const { error } = await supabase.from('events').delete().eq('id', eventId);
        if (error) throw error;
        toast.success('Event deleted');
        fetchEvents();
      } catch (error: any) {
        toast.error('Failed to delete event');
      }
    } else {
      // Request approval from partner
      const editId = await requestEdit(
        'event',
        eventId,
        'delete',
        null,
        `Requested deletion of event: "${eventToDelete.title}"`
      );

      if (editId) {
        toast.info('Delete request sent to your partner');
      }
    }
  };

  const resetForm = () => {
    setNewEvent({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      all_day: false,
      color: '#3B82F6',
      visibility: 'shared',
    });
    setEditingEvent(null);
    setDialogOpen(false);
  };

  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description || '',
      start_time: format(new Date(event.start_time), 'HH:mm'),
      end_time: event.end_time ? format(new Date(event.end_time), 'HH:mm') : '',
      all_day: event.all_day || false,
      color: event.color || '#3B82F6',
      visibility: event.visibility,
    });
    setDialogOpen(true);
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Calendar</h1>
          <p className="text-muted-foreground">2026 Planning & Events</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedDate(selectedDate || new Date())}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Event Title</Label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Enter event title"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Event details..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-4">
                <Switch
                  checked={newEvent.all_day}
                  onCheckedChange={(checked) => setNewEvent({ ...newEvent, all_day: checked })}
                />
                <Label>All day event</Label>
              </div>
              {!newEvent.all_day && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={newEvent.start_time}
                      onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={newEvent.end_time}
                      onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select
                    value={newEvent.color}
                    onValueChange={(value) => setNewEvent({ ...newEvent, color: value })}
                  >
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: newEvent.color }} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select
                    value={newEvent.visibility}
                    onValueChange={(value) => setNewEvent({ ...newEvent, visibility: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="shared">Shared</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={editingEvent ? handleUpdateEvent : handleCreateEvent} 
                className="w-full"
              >
                {editingEvent ? 'Update Event' : 'Add Event'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar Grid */}
        <Card className="border-border/50 shadow-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display">
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {days.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'min-h-[80px] lg:min-h-[100px] p-1 lg:p-2 bg-card text-left transition-colors',
                      'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset',
                      !isCurrentMonth && 'bg-muted/50 text-muted-foreground',
                      isSelected && 'ring-2 ring-primary ring-inset',
                      isTodayDate && 'bg-primary/5'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-7 h-7 text-sm rounded-full',
                        isTodayDate && 'bg-primary text-primary-foreground font-semibold'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs truncate px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: event.color + '20', color: event.color }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Events */}
        <Card className="border-border/50 shadow-soft h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">
              {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Loading...</div>
              ) : selectedDayEvents.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No events on this day</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setDialogOpen(true)}
                  >
                    Add Event
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors group cursor-pointer"
                      onClick={() => setViewingEvent(event)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <div
                            className="w-3 h-3 rounded-full mt-1 shrink-0"
                            style={{ backgroundColor: event.color }}
                          />
                          <div>
                            <p className="font-medium text-sm">{event.title}</p>
                            {event.all_day ? (
                              <Badge variant="secondary" className="text-xs mt-1">All Day</Badge>
                            ) : (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(event.start_time), 'h:mm a')}
                                {event.end_time && ` - ${format(new Date(event.end_time), 'h:mm a')}`}
                              </p>
                            )}
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditDialog(event)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Pending Approval Dialogs */}
        {pendingEdits.filter(e => e.content_type === 'event' && e.approver_id === user?.id).length > 0 && (
          <>
            {pendingEdits.filter(e => e.content_type === 'event' && e.approver_id === user?.id).map(edit => (
              <EditConfirmationDialog
                key={edit.id}
                isOpen={showPendingEdit && pendingEdits.some(e => e.content_type === 'event' && e.approver_id === user?.id && e.id === edit.id)}
                requesterName={edit.requester?.display_name || 'Unknown'}
                contentType="event"
                action={edit.action as 'edit' | 'delete'}
                originalData={edit.original_data}
                newData={edit.new_data}
                changeDescription={edit.change_description}
                onApprove={async (editId) => {
                  await approveEdit(editId);
                  setShowPendingEdit(false);
                  fetchEvents();
                }}
                onReject={async (editId) => {
                  await rejectEdit(editId);
                  setShowPendingEdit(false);
                }}
                onClose={() => setShowPendingEdit(false)}
                editId={edit.id}
              />
            ))}
            {!showPendingEdit && pendingEdits.some(e => e.content_type === 'event' && e.approver_id === user?.id) && (
              <Button
                variant="outline"
                className="fixed bottom-24 right-4 gap-2"
                onClick={() => setShowPendingEdit(true)}
              >
                {pendingEdits.filter(e => e.content_type === 'event' && e.approver_id === user?.id).length} Pending Approval
              </Button>
            )}
          </>
        )}

        {/* View Modal */}
        <ViewModal
          open={!!viewingEvent}
          onOpenChange={(open) => !open && setViewingEvent(null)}
          title={viewingEvent?.title || ''}
          createdAt={viewingEvent?.created_at}
          visibility={viewingEvent?.visibility}
          onEdit={() => viewingEvent && openEditDialog(viewingEvent)}
          onDelete={() => viewingEvent && handleDeleteEvent(viewingEvent.id)}
          canEdit={true}
          canDelete={true}
          author={viewingEvent?.author || null}
        >
          <div className="space-y-4">
            {viewingEvent?.description && <p className="text-foreground whitespace-pre-wrap">{viewingEvent.description}</p>}
            <div className="space-y-2 text-sm text-muted-foreground">
              {!viewingEvent?.all_day && viewingEvent?.start_time && (
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {format(new Date(viewingEvent.start_time), 'MMMM d, yyyy h:mm a')}
                  {viewingEvent?.end_time && ` - ${format(new Date(viewingEvent.end_time), 'h:mm a')}`}
                </p>
              )}
              {viewingEvent?.all_day && (
                <p>All Day Event</p>
              )}
            </div>
          </div>
        </ViewModal>
      </div>
    </div>
  );
}