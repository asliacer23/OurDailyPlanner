# Implementation Guide: Edit Confirmation + Peso Currency

## 🔄 Part 1: Edit Confirmation System

### What It Does:
- When **Owner** edits Partner's note → Partner must **approve or deny**
- When **Partner** edits Owner's note → Owner must **approve or deny**
- **Author** can always edit/delete their own items
- **Non-authors** must request confirmation before changes

### How It Works:

**Step 1: Edit Request Created**
```
User A tries to edit User B's note
↓
System creates pending_edit record
↓
User B sees notification: "User A wants to edit: 'My Note'"
```

**Step 2: Approval Dialog Shows**
```
"User A wants to edit your Note"
─────────────────────────
Original: "Buy groceries"
New: "Buy groceries and milk"

Reason: "Added milk to the list"

[Deny] [Approve]
```

**Step 3: Approval**
- If **Approve** → Changes apply immediately
- If **Deny** → No changes, request deleted
- Author always can edit own items without approval

---

## 📊 Database Changes Required

### Migration 1: `20251229_add_edit_confirmation.sql`
Creates the `pending_edits` table:
```sql
- id (UUID)
- workspace_id (who it affects)
- requester_id (who wants to edit)
- approver_id (who must approve)
- content_type (note, event, expense, etc.)
- content_id (which item)
- action (edit or delete)
- original_data (JSONB backup)
- new_data (JSONB proposed changes)
- status (pending/approved/rejected)
```

### Migration 2: `20251229_update_rls_confirmation.sql`
Updates RLS policies:
- Authors can edit own items without approval
- Non-authors must create pending_edits request
- New functions: `request_edit()`, `approve_edit()`, `reject_edit()`

---

## 💱 Part 2: Currency - Dollar to Peso

### New File: `src/lib/currency.ts`

**Functions:**
```typescript
// Basic formatting
formatPeso(amount)           // ₱1,234.56
formatPesoCompact(amount)    // ₱1.2K for large numbers
parsePeso(value)             // Parse ₱1,234.56 → 1234.56

// Color coding
getPesoColor(amount)         // Returns color class
formatPesoWithColor(amount)  // ₱1,234.56 (in green/red)
```

### Usage in Components:
```typescript
import { formatPeso } from '@/lib/currency';

// In expense display
<span>{formatPeso(expense.amount)}</span>

// In financial summary
<p>Total: {formatPeso(totalExpenses)}</p>

// Compact format for summaries
<h3>{formatPesoCompact(monthlyBudget)}</h3>
```

---

## 🎯 Frontend Components Added

### 1. `EditConfirmationDialog.tsx`
Shows approval dialog when another user edits content
```typescript
<EditConfirmationDialog
  isOpen={showConfirm}
  requesterName="Asli"
  contentType="note"
  action="edit"
  changeDescription="Updated the note"
  onApprove={handleApprove}
  onReject={handleReject}
  editId={editId}
/>
```

### 2. `useEditRequests.ts` Hook
Manages all edit confirmation logic:
```typescript
const {
  pendingEdits,          // List of pending edits
  requestEdit,           // Request an edit
  approveEdit,           // Approve pending edit
  rejectEdit,            // Reject pending edit
  loading,
  refetch
} = useEditRequests(workspaceId);

// Request an edit
await requestEdit(
  'note',                    // content_type
  noteId,                    // content_id
  'edit',                    // action
  { title: 'New title' },   // new_data
  'Fixed typo'              // description
);

// Approve
await approveEdit(editRequestId);

// Reject
await rejectEdit(editRequestId);
```

---

## 🔧 How to Update Components

### Example: NotesPage Update

**Old Code:**
```typescript
const handleUpdateNote = async () => {
  const { error } = await supabase
    .from('notes')
    .update({ title: newNote.title })
    .eq('id', editingNote.id);
}
```

**New Code:**
```typescript
const { requestEdit, pendingEdits } = useEditRequests(workspace?.id);
const [confirmDialog, setConfirmDialog] = useState(null);

const handleUpdateNote = async () => {
  // If editing own note, update directly
  if (editingNote.author_id === user?.id) {
    const { error } = await supabase
      .from('notes')
      .update({ title: newNote.title })
      .eq('id', editingNote.id);
  } else {
    // If editing other's note, request approval
    await requestEdit(
      'note',
      editingNote.id,
      'edit',
      { title: newNote.title },
      'Updated note content'
    );
  }
}

// Show pending edits
<div>
  {pendingEdits.map(edit => (
    <EditConfirmationDialog
      key={edit.id}
      isOpen={true}
      requesterName={edit.requester?.display_name}
      contentType={edit.content_type}
      action={edit.action}
      onApprove={() => approveEdit(edit.id)}
      onReject={() => rejectEdit(edit.id)}
      editId={edit.id}
    />
  ))}
</div>
```

---

## 📋 Applies To All Features:

✅ Notes
✅ Events
✅ Goals
✅ Tasks
✅ Expenses (with Peso)
✅ Revenues (with Peso)
✅ Budgets (with Peso)
✅ Travel Plans
✅ Anniversaries
✅ Love Letters
✅ Date Ideas
✅ Schedules
✅ Tips
✅ Quick Notes

---

## 🚀 Implementation Order

1. ✅ Create `20251229_add_edit_confirmation.sql` migration
2. ✅ Create `20251229_update_rls_confirmation.sql` migration
3. ✅ Update types.ts with `pending_edits` table
4. ✅ Create `src/lib/currency.ts`
5. ✅ Create `EditConfirmationDialog.tsx`
6. ✅ Create `useEditRequests.ts` hook
7. Update all feature pages (NotesPage, ExpensesPage, etc.)
8. Update all display components to use `formatPeso`
9. Test with test user

---

## ✨ User Experience

**Scenario 1: Editing Own Content**
```
Asli edits "Buy milk"
↓
Edit applied immediately ✓
```

**Scenario 2: Editing Partner's Content**
```
Asli edits John's note
↓
John sees: "Asli wants to edit your note: Buy milk"
↓
John approves
↓
Edit applied ✓
```

**Scenario 3: Rejecting Edit**
```
John sees: "Asli wants to delete your note"
↓
John denies
↓
Note stays, edit request deleted ✗
```

---

## 💾 Database Tables Affected

| Table | Change | Reason |
|-------|--------|--------|
| `pending_edits` | Created | Track edit/delete requests |
| `notes` | RLS Updated | Require approval for non-authors |
| `events` | RLS Updated | Same as notes |
| `expenses` | RLS Updated | Same as notes |
| `goals` | RLS Updated | Same as notes |
| All others | RLS Updated | Apply confirmation to all |

---

## 🔒 Security

✅ Author always can edit/delete own items
✅ Non-authors must create request
✅ Approver must be workspace member
✅ RLS enforces at database level
✅ All actions logged in `pending_edits`

