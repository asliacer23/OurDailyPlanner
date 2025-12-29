import { useState, useEffect } from 'react';
import { Plus, Plane, MapPin, Calendar, DollarSign, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEditRequests } from '@/hooks/useEditRequests';
import { EditConfirmationDialog } from '@/components/shared/EditConfirmationDialog';
import { formatPeso } from '@/lib/currency';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { ViewModal } from '@/components/shared/ViewModal';
import { AuthorBadge } from '@/components/shared/AuthorBadge';

interface TravelPlan {
  id: string;
  destination: string;
  start_date: string;
  end_date: string | null;
  budget: number | null;
  status: string;
  notes: string | null;
  visibility: 'private' | 'shared' | 'business';
  author_id: string;
  created_at: string;
  author?: { id: string; display_name: string | null; avatar_url: string | null };
}

export default function TravelPage() {
  const { user, workspace } = useAuth();
  const { pendingEdits, requestEdit, approveEdit, rejectEdit } = useEditRequests(workspace?.id || null);
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TravelPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<TravelPlan | null>(null);
  const [showPendingEdit, setShowPendingEdit] = useState(false);
  const [newPlan, setNewPlan] = useState<{
    destination: string;
    start_date: string;
    end_date: string;
    budget: string;
    status: string;
    notes: string;
    visibility: 'private' | 'shared' | 'business';
  }>({
    destination: '',
    start_date: '',
    end_date: '',
    budget: '',
    status: 'planned',
    notes: '',
    visibility: 'shared',
  });

  const fetchPlans = async () => {
    if (!workspace?.id) return;
    try {
      const { data, error } = await supabase
        .from('travel_plans')
        .select('*, author:profiles!travel_plans_author_id_fkey(id, display_name, avatar_url)')
        .eq('workspace_id', workspace.id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setPlans(data as TravelPlan[]);
    } catch (error) {
      toast.error('Failed to load travel plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [workspace?.id]);

  const handleCreate = async () => {
    if (!user?.id || !workspace?.id || !newPlan.destination || !newPlan.start_date) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      const { error } = await supabase.from('travel_plans').insert({
        destination: newPlan.destination,
        start_date: newPlan.start_date,
        end_date: newPlan.end_date || null,
        budget: newPlan.budget ? parseFloat(newPlan.budget) : null,
        status: newPlan.status,
        notes: newPlan.notes || null,
        visibility: newPlan.visibility,
        author_id: user.id,
        workspace_id: workspace.id,
      });

      if (error) throw error;
      toast.success('Travel plan created!');
      resetForm();
      fetchPlans();
    } catch (error) {
      toast.error('Failed to create plan');
    }
  };

  const handleUpdate = async () => {
    if (!editingPlan) return;
    try {
      const newData = {
        destination: newPlan.destination,
        start_date: newPlan.start_date,
        end_date: newPlan.end_date || null,
        budget: newPlan.budget ? parseFloat(newPlan.budget) : null,
        status: newPlan.status,
        notes: newPlan.notes || null,
        visibility: newPlan.visibility,
      };

      // If user is the author, update directly
      if (editingPlan.author_id === user?.id) {
        const { error } = await supabase
          .from('travel_plans')
          .update(newData)
          .eq('id', editingPlan.id);

        if (error) throw error;
        toast.success('Plan updated!');
      } else {
        // Request approval from author
        await requestEdit('travel_plan', editingPlan.id, 'edit', newData, `Updated travel plan: "${newPlan.destination}"`);
        toast.success('Edit request sent to plan owner for approval');
      }
      
      resetForm();
      fetchPlans();
    } catch (error) {
      toast.error('Failed to update plan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.id) return;
    const planToDelete = plans.find(p => p.id === id);
    if (!planToDelete) return;

    try {
      // If user is the author, delete directly
      if (planToDelete.author_id === user.id) {
        const { error } = await supabase.from('travel_plans').delete().eq('id', id);
        if (error) throw error;
        toast.success('Plan deleted');
      } else {
        // Request deletion approval from author
        await requestEdit('travel_plan', id, 'delete', null, 'Requested to delete this travel plan');
        toast.success('Delete request sent to plan owner for approval');
      }
      
      setViewingPlan(null);
      fetchPlans();
    } catch (error) {
      toast.error('Failed to delete plan');
    }
  };

  const resetForm = () => {
    setNewPlan({ destination: '', start_date: '', end_date: '', budget: '', status: 'planned', notes: '', visibility: 'shared' });
    setEditingPlan(null);
    setDialogOpen(false);
  };

  const openEditDialog = (plan: TravelPlan) => {
    setEditingPlan(plan);
    setNewPlan({
      destination: plan.destination,
      start_date: plan.start_date,
      end_date: plan.end_date || '',
      budget: plan.budget?.toString() || '',
      status: plan.status,
      notes: plan.notes || '',
      visibility: plan.visibility,
    });
    setViewingPlan(null);
    setDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-500/10 text-blue-500';
      case 'booked': return 'bg-purple-500/10 text-purple-500';
      case 'ongoing': return 'bg-green-500/10 text-green-500';
      case 'completed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Travel</h1>
          <p className="text-muted-foreground">Plan your adventures</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Trip</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Edit Trip' : 'Plan a Trip'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Destination</Label>
                <Input value={newPlan.destination} onChange={(e) => setNewPlan({ ...newPlan, destination: e.target.value })} placeholder="Paris, Tokyo, New York..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={newPlan.start_date} onChange={(e) => setNewPlan({ ...newPlan, start_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={newPlan.end_date} onChange={(e) => setNewPlan({ ...newPlan, end_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Budget</Label>
                  <Input type="number" value={newPlan.budget} onChange={(e) => setNewPlan({ ...newPlan, budget: e.target.value })} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={newPlan.status} onValueChange={(v) => setNewPlan({ ...newPlan, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={newPlan.notes} onChange={(e) => setNewPlan({ ...newPlan, notes: e.target.value })} placeholder="Things to do, places to visit..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={newPlan.visibility} onValueChange={(v) => setNewPlan({ ...newPlan, visibility: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">🔒 Private</SelectItem>
                    <SelectItem value="shared">👫 Shared</SelectItem>
                    <SelectItem value="business">💼 Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={editingPlan ? handleUpdate : handleCreate} className="w-full">
                {editingPlan ? 'Update Trip' : 'Create Trip'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border/50 animate-pulse">
              <CardContent className="p-6"><div className="h-24 bg-muted rounded" /></CardContent>
            </Card>
          ))
        ) : plans.length === 0 ? (
          <Card className="col-span-full border-border/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Plane className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">No trips planned</h3>
              <p className="text-sm text-muted-foreground mb-4">Start planning your next adventure</p>
              <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Plan a Trip</Button>
            </CardContent>
          </Card>
        ) : (
          plans.map((plan) => {
            const days = plan.end_date ? differenceInDays(new Date(plan.end_date), new Date(plan.start_date)) + 1 : 1;
            return (
              <Card key={plan.id} className="border-border/50 shadow-soft hover:shadow-md transition-all cursor-pointer overflow-hidden" onClick={() => setViewingPlan(plan)}>
                <div className="h-2 bg-gradient-to-r from-primary to-primary/50" />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={cn('text-xs capitalize', getStatusColor(plan.status))}>{plan.status}</Badge>
                    <AuthorBadge author={plan.author || null} size="sm" />
                  </div>
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {plan.destination}
                  </h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(plan.start_date), 'MMM d')} - {plan.end_date ? format(new Date(plan.end_date), 'MMM d, yyyy') : '?'}
                      <span className="text-xs">({days} days)</span>
                    </div>
                    {plan.budget && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5" />
                        Budget: {formatPeso(plan.budget)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <ViewModal
        open={!!viewingPlan}
        onOpenChange={(open) => !open && setViewingPlan(null)}
        title={viewingPlan?.destination || ''}
        author={viewingPlan?.author || null}
        createdAt={viewingPlan?.created_at}
        visibility={viewingPlan?.visibility}
        onEdit={() => viewingPlan && openEditDialog(viewingPlan)}
        onDelete={() => viewingPlan && handleDelete(viewingPlan.id)}
        canEdit={viewingPlan?.author_id === user?.id}
        canDelete={viewingPlan?.author_id === user?.id}
      >
        <div className="space-y-4">
          <Badge className={getStatusColor(viewingPlan?.status || 'planned')}>{viewingPlan?.status}</Badge>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Start</p>
              <p className="font-medium">{viewingPlan?.start_date && format(new Date(viewingPlan.start_date), 'MMMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">End</p>
              <p className="font-medium">{viewingPlan?.end_date ? format(new Date(viewingPlan.end_date), 'MMMM d, yyyy') : 'Not set'}</p>
            </div>
          </div>
          {viewingPlan?.budget && (
            <div className="text-sm">
              <p className="text-muted-foreground">Budget</p>
              <p className="font-medium text-lg">{formatPeso(viewingPlan.budget)}</p>
            </div>
          )}
          {viewingPlan?.notes && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">Notes</p>
              <p className="whitespace-pre-wrap">{viewingPlan.notes}</p>
            </div>
          )}
        </div>
      </ViewModal>

      {pendingEdits.filter(e => e.content_type === 'travel_plan' && e.approver_id === user?.id).length > 0 && (
        <>
          {pendingEdits.filter(e => e.content_type === 'travel_plan' && e.approver_id === user?.id).map(edit => (
            <EditConfirmationDialog
              key={edit.id}
              isOpen={showPendingEdit && pendingEdits.some(e => e.content_type === 'travel_plan' && e.approver_id === user?.id && e.id === edit.id)}
              requesterName={edit.requester?.display_name || 'Unknown'}
              contentType="travel_plan"
              action={edit.action as 'edit' | 'delete'}
              originalData={edit.original_data}
              newData={edit.new_data}
              changeDescription={edit.change_description}
              onApprove={async (editId) => {
                await approveEdit(editId);
                setShowPendingEdit(false);
                fetchTravelPlans();
              }}
              onReject={async (editId) => {
                await rejectEdit(editId);
                setShowPendingEdit(false);
              }}
              onClose={() => setShowPendingEdit(false)}
              editId={edit.id}
            />
          ))}
          {!showPendingEdit && pendingEdits.some(e => e.content_type === 'travel_plan' && e.approver_id === user?.id) && (
            <Button
              variant="outline"
              className="fixed bottom-24 right-4 gap-2"
              onClick={() => setShowPendingEdit(true)}
            >
              {pendingEdits.filter(e => e.content_type === 'travel_plan' && e.approver_id === user?.id).length} Pending Approval
            </Button>
          )}
        </>
      )}
    </div>
  );
}

