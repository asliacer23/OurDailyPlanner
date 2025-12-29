import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PendingEdit {
  id: string;
  requester_id: string;
  approver_id: string;
  content_type: string;
  content_id: string;
  action: 'edit' | 'delete';
  original_data: any;
  new_data: any;
  change_description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  requester?: {
    display_name: string;
    email: string;
  };
}

export function useEditRequests(workspaceId: string | null) {
  const [pendingEdits, setPendingEdits] = useState<PendingEdit[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch pending edits
  const fetchPendingEdits = async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pending_edits')
        .select(`
          id,
          requester_id,
          approver_id,
          content_type,
          content_id,
          action,
          original_data,
          new_data,
          change_description,
          status,
          created_at,
          updated_at,
          workspace_id
        `)
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingEdits((data as any[]) || []);
    } catch (error: any) {
      console.error('Failed to fetch pending edits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Request an edit
  const requestEdit = async (
    contentType: string,
    contentId: string,
    action: 'edit' | 'delete',
    newData?: any,
    description?: string
  ) => {
    if (!workspaceId) return null;

    try {
      const { data, error } = await supabase
        .rpc('request_edit', {
          p_workspace_id: workspaceId,
          p_content_type: contentType,
          p_content_id: contentId,
          p_action: action,
          p_new_data: newData || null,
          p_description: description || null,
        });

      if (error) throw error;
      toast.success('Edit request sent for approval!');
      await fetchPendingEdits();
      return data;
    } catch (error: any) {
      console.error('Failed to request edit:', error);
      toast.error(error.message || 'Failed to request edit');
      return null;
    }
  };

  // Approve an edit
  const approveEdit = async (editId: string) => {
    try {
      const { error } = await supabase.rpc('approve_edit', {
        p_edit_id: editId,
      });

      if (error) throw error;
      toast.success('Edit approved and applied!');
      await fetchPendingEdits();
    } catch (error: any) {
      console.error('Failed to approve edit:', error);
      toast.error(error.message || 'Failed to approve edit');
      throw error;
    }
  };

  // Reject an edit
  const rejectEdit = async (editId: string) => {
    try {
      const { error } = await supabase.rpc('reject_edit', {
        p_edit_id: editId,
      });

      if (error) throw error;
      await fetchPendingEdits();
    } catch (error: any) {
      console.error('Failed to reject edit:', error);
      throw error;
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!workspaceId) return;

    fetchPendingEdits();

    const channel = supabase
      .channel(`pending_edits:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_edits',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          fetchPendingEdits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  return {
    pendingEdits,
    loading,
    requestEdit,
    approveEdit,
    rejectEdit,
    refetch: fetchPendingEdits,
  };
}
