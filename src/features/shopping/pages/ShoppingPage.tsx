import { useState, useEffect } from 'react';
import { Plus, ShoppingCart, Check, Trash2, Package, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEditRequests } from '@/hooks/useEditRequests';
import { useOnlineStatus, useOnReconnect } from '@/hooks/useOnlineStatus';
import { fetchWithCache, subscribeToTable } from '@/lib/cacheAndSync';
import { EditConfirmationDialog } from '@/components/shared/EditConfirmationDialog';
import { ViewModal } from '@/components/shared/ViewModal';
import { AuthorBadge } from '@/components/shared/AuthorBadge';
import { cn } from '@/lib/utils';
import { formatPeso } from '@/lib/currency';
import { toast } from 'sonner';

interface ShoppingList {
  id: string;
  name: string;
  description: string | null;
  visibility: 'private' | 'shared' | 'business';
  workspace_id: string;
  author_id: string;
  created_at: string;
  author?: { id: string; display_name: string | null; avatar_url: string | null };
  items?: ShoppingItem[];
}

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  is_purchased: boolean;
  price: number | null;
  list_id: string;
}

export default function ShoppingPage() {
  const { user, workspace } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { pendingEdits, requestEdit, approveEdit, rejectEdit } = useEditRequests(workspace?.id || null);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [viewingList, setViewingList] = useState<ShoppingList | null>(null);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [showPendingEdit, setShowPendingEdit] = useState(false);
  const [newList, setNewList] = useState({ name: '', description: '', visibility: 'shared' as 'private' | 'shared' | 'business' });
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: '', price: '' });

  const fetchLists = async () => {
    if (!workspace?.id) return;
    try {
      const query = supabase
        .from('shopping_lists')
        .select('*, author:profiles!shopping_lists_author_id_fkey(id, display_name, avatar_url)')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

      const data = await fetchWithCache(query, { cacheKey: `shopping_lists_${workspace.id}`, ttl: 300000 });
      if (data && Array.isArray(data)) {
        setLists(data as ShoppingList[]);
        
        if (data.length > 0 && !selectedList) {
          fetchItems(data[0].id);
          setSelectedList(data[0] as ShoppingList);
        }
      } else if (isOnline) {
        toast.error('Failed to load lists');
      }
    } catch (error) {
      if (isOnline) toast.error('Failed to load lists');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (listId: string) => {
    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setSelectedList(prev => prev ? { ...prev, items: data as ShoppingItem[] } : null);
    } catch (error) {
      toast.error('Failed to load items');
    }
  };

  useEffect(() => {
    if (workspace?.id) {
      fetchLists();

      // Real-time subscription
      const unsubscribe = subscribeToTable<ShoppingList>(
        'shopping_lists',
        (updated) => {
          if (updated.workspace_id === workspace.id) {
            setLists((prev) =>
              prev.map((l) => (l.id === updated.id ? updated : l))
            );
          }
        },
        (newList) => {
          if (newList.workspace_id === workspace.id) {
            setLists((prev) => [newList, ...prev]);
          }
        },
        (deleted) => {
          if (deleted.workspace_id === workspace.id) {
            setLists((prev) => prev.filter((l) => l.id !== deleted.id));
          }
        },
        `workspace_id=eq.${workspace.id}`
      );

      return unsubscribe;
    }
  }, [workspace?.id, isOnline]);

  useOnReconnect(async () => {
    if (workspace?.id) {
      await fetchLists();
    }
  });

  const handleCreateList = async () => {
    if (!user?.id || !workspace?.id || !newList.name) {
      toast.error('Please enter a name');
      return;
    }

    try {
      const { data, error } = await supabase.from('shopping_lists').insert({
        name: newList.name,
        description: newList.description || null,
        visibility: newList.visibility,
        author_id: user.id,
        workspace_id: workspace.id,
      }).select().single();

      if (error) throw error;
      toast.success('List created!');
      setNewList({ name: '', description: '', visibility: 'shared' });
      setListDialogOpen(false);
      fetchLists();
      if (data) {
        setSelectedList({ ...data, items: [] } as ShoppingList);
      }
    } catch (error) {
      toast.error('Failed to create list');
    }
  };

  const handleUpdateList = async () => {
    if (!editingList || !user?.id) return;

    // Check if editing own list
    if (editingList.author_id === user.id) {
      // Direct update - author can always edit own lists
      try {
        const { error } = await supabase
          .from('shopping_lists')
          .update({
            name: newList.name,
            description: newList.description || null,
            visibility: newList.visibility,
          })
          .eq('id', editingList.id);

        if (error) throw error;
        
        toast.success('List updated!');
        resetForm();
        fetchLists();
      } catch (error) {
        toast.error('Failed to update list');
      }
    } else {
      // Request approval from partner
      const editId = await requestEdit(
        'shopping_list',
        editingList.id,
        'edit',
        { 
          name: newList.name,
          description: newList.description || null,
          visibility: newList.visibility
        },
        `Updated list: "${editingList.name}" → "${newList.name}"`
      );

      if (editId) {
        toast.info('Approval request sent to your partner');
        resetForm();
      }
    }
  };

  const handleDeleteList = async (listId: string) => {
    const listToDelete = lists.find(l => l.id === listId);
    if (!listToDelete) return;

    // Check if deleting own list
    if (listToDelete.author_id === user?.id) {
      // Direct delete - author can always delete own lists
      try {
        const { error } = await supabase.from('shopping_lists').delete().eq('id', listId);
        if (error) throw error;
        toast.success('List deleted');
        if (selectedList?.id === listId) setSelectedList(null);
        fetchLists();
      } catch (error: any) {
        toast.error('Failed to delete list');
      }
    } else {
      // Request approval from partner
      const editId = await requestEdit(
        'shopping_list',
        listId,
        'delete',
        null,
        `Requested deletion of list: "${listToDelete.name}"`
      );

      if (editId) {
        toast.info('Delete request sent to your partner');
      }
    }
  };

  const resetForm = () => {
    setNewList({ name: '', description: '', visibility: 'shared' });
    setEditingList(null);
    setListDialogOpen(false);
  };

  const openEditDialog = (list: ShoppingList) => {
    setEditingList(list);
    setNewList({
      name: list.name,
      description: list.description || '',
      visibility: list.visibility,
    });
    setListDialogOpen(true);
  };

  const handleAddItem = async () => {
    if (!selectedList || !newItem.name) {
      toast.error('Please enter item name');
      return;
    }

    try {
      const { error } = await supabase.from('shopping_items').insert({
        name: newItem.name,
        quantity: newItem.quantity ? parseFloat(newItem.quantity) : null,
        unit: newItem.unit || null,
        price: newItem.price ? parseFloat(newItem.price) : null,
        list_id: selectedList.id,
        is_purchased: false,
      });

      if (error) throw error;
      toast.success('Item added!');
      setNewItem({ name: '', quantity: '', unit: '', price: '' });
      setItemDialogOpen(false);
      fetchItems(selectedList.id);
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const togglePurchased = async (item: ShoppingItem) => {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .update({ is_purchased: !item.is_purchased, purchased_by: !item.is_purchased ? user?.id : null })
        .eq('id', item.id);

      if (error) throw error;
      if (selectedList) fetchItems(selectedList.id);
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from('shopping_items').delete().eq('id', itemId);
      if (error) throw error;
      toast.success('Item removed');
      if (selectedList) fetchItems(selectedList.id);
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };


  const items = selectedList?.items || [];
  const purchasedCount = items.filter(i => i.is_purchased).length;
  const totalPrice = items.filter(i => i.is_purchased).reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

  const filteredLists = lists.filter(list => {
    if (activeTab === 'all') return true;
    return list.visibility === activeTab;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Shopping</h1>
          <p className="text-muted-foreground">Manage your shopping lists</p>
        </div>
        
        <Dialog open={listDialogOpen} onOpenChange={(open) => {
          setListDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New List</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingList ? 'Edit Shopping List' : 'New Shopping List'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newList.name} onChange={(e) => setNewList({ ...newList, name: e.target.value })} placeholder="Groceries, Home Depot..." />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input value={newList.description} onChange={(e) => setNewList({ ...newList, description: e.target.value })} placeholder="Weekly groceries" />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={newList.visibility}
                  onValueChange={(value) => 
                    setNewList({ ...newList, visibility: value as 'private' | 'shared' | 'business' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">🔒 Private</SelectItem>
                    <SelectItem value="shared">👫 Shared (Both of you)</SelectItem>
                    <SelectItem value="business">💼 Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={editingList ? handleUpdateList : handleCreateList} className="w-full">
                {editingList ? 'Update List' : 'Create List'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Lists sidebar with tabs */}
        <div className="space-y-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="private" className="text-xs">🔒</TabsTrigger>
              <TabsTrigger value="shared" className="text-xs">👫</TabsTrigger>
              <TabsTrigger value="business" className="text-xs">💼</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Your Lists</h2>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border/50 animate-pulse">
                <CardContent className="p-3"><div className="h-5 bg-muted rounded w-3/4" /></CardContent>
              </Card>
            ))
          ) : filteredLists.length === 0 ? (
            <Card className="border-border/50 border-dashed">
              <CardContent className="p-4 text-center">
                <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No lists yet</p>
              </CardContent>
            </Card>
          ) : (
            filteredLists.map((list) => (
              <Card 
                key={list.id} 
                className={cn(
                  'border-border/50 cursor-pointer transition-all hover:shadow-md group',
                  selectedList?.id === list.id && 'border-primary bg-primary/5'
                )}
              >
                <CardContent className="p-3">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => { setSelectedList(list); fetchItems(list.id); }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block">{list.name}</span>
                        <Badge variant="secondary" className="text-xs mt-1 capitalize">
                          {list.visibility}
                        </Badge>
                      </div>
                    </div>
                    <AuthorBadge author={list.author || null} size="sm" />
                  </div>
                  <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setSelectedList(list);
                        fetchItems(list.id);
                        setViewingList(list);
                      }}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEditDialog(list)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteList(list.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Items */}
        <Card className="border-border/50 shadow-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display">{selectedList?.name || 'Select a list'}</CardTitle>
                {selectedList && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {purchasedCount}/{items.length} items • {formatPeso(totalPrice)} spent
                  </p>
                )}
              </div>
              {selectedList && (
                <div className="flex gap-2">
                  <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Item</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Add Item</DialogTitle></DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Item Name</Label>
                          <Input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Milk, Bread..." />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-2">
                            <Label>Qty</Label>
                            <Input type="number" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })} placeholder="1" />
                          </div>
                          <div className="space-y-2">
                            <Label>Unit</Label>
                            <Input value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} placeholder="kg, pcs" />
                          </div>
                          <div className="space-y-2">
                            <Label>Price</Label>
                            <Input type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} placeholder="0.00" />
                          </div>
                        </div>
                        <Button onClick={handleAddItem} className="w-full">Add Item</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => selectedList && handleDeleteList(selectedList.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedList ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a list to view items</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No items yet</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setItemDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />Add first item
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border border-border/50 transition-all group',
                      item.is_purchased && 'bg-muted/50'
                    )}
                  >
                    <Checkbox 
                      checked={item.is_purchased} 
                      onCheckedChange={() => togglePurchased(item)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className={cn('font-medium', item.is_purchased && 'line-through text-muted-foreground')}>
                        {item.name}
                      </span>
                      {(item.quantity || item.unit) && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({item.quantity}{item.unit && ` ${item.unit}`})
                        </span>
                      )}
                    </div>
                    {item.price && (
                      <span className="text-sm font-medium">{formatPeso(item.price * (item.quantity || 1))}</span>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {pendingEdits.filter(e => e.content_type === 'shopping_list' && e.approver_id === user?.id).length > 0 && (
          <>
            {pendingEdits.filter(e => e.content_type === 'shopping_list' && e.approver_id === user?.id).map(edit => (
              <EditConfirmationDialog
                key={edit.id}
                isOpen={showPendingEdit && pendingEdits.some(e => e.content_type === 'shopping_list' && e.approver_id === user?.id && e.id === edit.id)}
                requesterName={edit.requester?.display_name || 'Unknown'}
                contentType="shopping_list"
                action={edit.action as 'edit' | 'delete'}
                originalData={edit.original_data}
                newData={edit.new_data}
                changeDescription={edit.change_description}
                onApprove={async (editId) => {
                  await approveEdit(editId);
                  setShowPendingEdit(false);
                  fetchLists();
                }}
                onReject={async (editId) => {
                  await rejectEdit(editId);
                  setShowPendingEdit(false);
                }}
                onClose={() => setShowPendingEdit(false)}
                editId={edit.id}
              />
            ))}
            {!showPendingEdit && pendingEdits.some(e => e.content_type === 'shopping_list' && e.approver_id === user?.id) && (
              <Button
                variant="outline"
                className="fixed bottom-24 right-4 gap-2"
                onClick={() => setShowPendingEdit(true)}
              >
                {pendingEdits.filter(e => e.content_type === 'shopping_list' && e.approver_id === user?.id).length} Pending Approval
              </Button>
            )}
          </>
        )}

      {/* View Modal */}
      <ViewModal
        open={!!viewingList}
        onOpenChange={(open) => !open && setViewingList(null)}
        title={viewingList?.name || ""}
        createdAt={viewingList?.created_at}
        visibility={viewingList?.visibility}
        onEdit={() => {
          openEditDialog(viewingList!);
          setViewingList(null);
        }}
        onDelete={() => {
          handleDeleteList(viewingList!.id);
          setViewingList(null);
        }}
        canEdit={viewingList && viewingList.author_id === user?.id}
        canDelete={viewingList && viewingList.author_id === user?.id}
        author={viewingList?.author || null}
      >
        <div className="space-y-3">
          {viewingList?.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm mt-1">{viewingList.description}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Items</p>
            <p className="text-sm mt-1">{viewingList?.items && viewingList.items.length > 0 ? `${viewingList.items.length} items` : 'No items'}</p>
          </div>
        </div>
      </ViewModal>

      {/* Pending Approval Dialogs */}
      {pendingEdits.filter(e => e.content_type === 'shopping_list' && e.approver_id === user?.id).length > 0 && (
        <>
          {pendingEdits.filter(e => e.content_type === 'shopping_list' && e.approver_id === user?.id).map(edit => (
            <EditConfirmationDialog
              key={edit.id}
              isOpen={showPendingEdit && pendingEdits.some(e => e.content_type === 'shopping_list' && e.approver_id === user?.id && e.id === edit.id)}
              requesterName={edit.requester?.display_name || 'Unknown'}
              contentType="shopping_list"
              action={edit.action as 'edit' | 'delete'}
              originalData={edit.original_data}
              newData={edit.new_data}
              changeDescription={edit.change_description}
              onApprove={async (editId) => {
                await approveEdit(editId);
                setShowPendingEdit(false);
                fetchLists();
              }}
              onReject={async (editId) => {
                await rejectEdit(editId);
                setShowPendingEdit(false);
              }}
              onClose={() => setShowPendingEdit(false)}
              editId={edit.id}
            />
          ))}
          {!showPendingEdit && pendingEdits.some(e => e.content_type === 'shopping_list' && e.approver_id === user?.id) && (
            <Button
              variant="outline"
              className="fixed bottom-24 right-4 gap-2"
              onClick={() => setShowPendingEdit(true)}
            >
              {pendingEdits.filter(e => e.content_type === 'shopping_list' && e.approver_id === user?.id).length} Pending Approval
            </Button>
          )}
        </>
      )}
      </div>
    </div>
  );
}

