import { useState, useEffect } from 'react';
import { Plus, ShoppingCart, Check, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AuthorBadge } from '@/components/shared/AuthorBadge';

interface ShoppingList {
  id: string;
  name: string;
  description: string | null;
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
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [newList, setNewList] = useState({ name: '', description: '' });
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: '', price: '' });

  const fetchLists = async () => {
    if (!workspace?.id) return;
    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*, author:profiles!shopping_lists_author_id_fkey(id, display_name, avatar_url)')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLists(data as ShoppingList[]);
      
      if (data && data.length > 0 && !selectedList) {
        fetchItems(data[0].id);
        setSelectedList(data[0] as ShoppingList);
      }
    } catch (error) {
      toast.error('Failed to load lists');
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
    fetchLists();
  }, [workspace?.id]);

  const handleCreateList = async () => {
    if (!user?.id || !workspace?.id || !newList.name) {
      toast.error('Please enter a name');
      return;
    }

    try {
      const { data, error } = await supabase.from('shopping_lists').insert({
        name: newList.name,
        description: newList.description || null,
        author_id: user.id,
        workspace_id: workspace.id,
      }).select().single();

      if (error) throw error;
      toast.success('List created!');
      setNewList({ name: '', description: '' });
      setListDialogOpen(false);
      fetchLists();
      if (data) {
        setSelectedList({ ...data, items: [] } as ShoppingList);
      }
    } catch (error) {
      toast.error('Failed to create list');
    }
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

  const handleDeleteList = async (listId: string) => {
    try {
      const { error } = await supabase.from('shopping_lists').delete().eq('id', listId);
      if (error) throw error;
      toast.success('List deleted');
      setSelectedList(null);
      fetchLists();
    } catch (error) {
      toast.error('Failed to delete list');
    }
  };

  const items = selectedList?.items || [];
  const purchasedCount = items.filter(i => i.is_purchased).length;
  const totalPrice = items.filter(i => i.is_purchased).reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Shopping</h1>
          <p className="text-muted-foreground">Manage your shopping lists</p>
        </div>
        
        <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New List</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Shopping List</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newList.name} onChange={(e) => setNewList({ ...newList, name: e.target.value })} placeholder="Groceries, Home Depot..." />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input value={newList.description} onChange={(e) => setNewList({ ...newList, description: e.target.value })} placeholder="Weekly groceries" />
              </div>
              <Button onClick={handleCreateList} className="w-full">Create List</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Lists sidebar */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Your Lists</h2>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border/50 animate-pulse">
                <CardContent className="p-3"><div className="h-5 bg-muted rounded w-3/4" /></CardContent>
              </Card>
            ))
          ) : lists.length === 0 ? (
            <Card className="border-border/50 border-dashed">
              <CardContent className="p-4 text-center">
                <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No lists yet</p>
              </CardContent>
            </Card>
          ) : (
            lists.map((list) => (
              <Card 
                key={list.id} 
                className={cn(
                  'border-border/50 cursor-pointer transition-all hover:shadow-md',
                  selectedList?.id === list.id && 'border-primary bg-primary/5'
                )}
                onClick={() => { setSelectedList(list); fetchItems(list.id); }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{list.name}</span>
                    </div>
                    <AuthorBadge author={list.author || null} size="sm" />
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
                    {purchasedCount}/{items.length} items • ${totalPrice.toFixed(2)} spent
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
                      <span className="text-sm font-medium">${(item.price * (item.quantity || 1)).toFixed(2)}</span>
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
      </div>
    </div>
  );
}
