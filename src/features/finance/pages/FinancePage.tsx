import { useState, useEffect } from 'react';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEditRequests } from '@/hooks/useEditRequests';
import { useOnlineStatus, useOnReconnect } from '@/hooks/useOnlineStatus';
import { fetchWithCache, subscribeToTable } from '@/lib/cacheAndSync';
import { EditConfirmationDialog } from '@/components/shared/EditConfirmationDialog';
import { AuthorBadge } from '@/components/shared/AuthorBadge';
import { formatPeso, getPesoColor } from '@/lib/currency';
import { toast } from 'sonner';
import { format, getMonth, getYear, subMonths, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Expense {
  id: string;
  amount: number;
  description: string | null;
  expense_type: 'fixed' | 'variable' | 'one_time';
  finance_category: 'business' | 'personal';
  workspace_id: string;
  date: string;
  created_at: string;
  author_id: string;
  author?: Profile;
}

interface Revenue {
  id: string;
  amount: number;
  source: string;
  description: string | null;
  is_recurring: boolean;
  workspace_id: string;
  date: string;
  created_at: string;
  author_id: string;
  author?: Profile;
}

interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
}

interface MonthlyBudget {
  id: string;
  year: number;
  month: number;
  planned_income: number;
  planned_expense: number;
  actual_income: number;
  actual_expense: number;
  notes: string | null;
}

export default function FinancePage() {
  const { user, workspace } = useAuth();
  const { isOnline } = useOnlineStatus();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [selectedBudgetMonth, setSelectedBudgetMonth] = useState(new Date());

  const [newExpense, setNewExpense] = useState<{
    amount: string;
    description: string;
    expense_type: 'fixed' | 'variable' | 'one_time';
    finance_category: 'business' | 'personal';
    date: string;
  }>({
    amount: '',
    description: '',
    expense_type: 'variable',
    finance_category: 'personal',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const [newRevenue, setNewRevenue] = useState({
    amount: '',
    source: '',
    description: '',
    is_recurring: false,
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const [newBudget, setNewBudget] = useState({
    planned_income: '',
    planned_expense: '',
    notes: '',
  });

  const fetchData = async () => {
    if (!workspace?.id) return;

    try {
      const [expensesData, revenuesData, categoriesData, budgetsData] = await Promise.all([
        fetchWithCache(
          supabase
            .from('expenses')
            .select('*, author:profiles!expenses_author_id_fkey(id, display_name, avatar_url)')
            .eq('workspace_id', workspace.id)
            .order('date', { ascending: false }),
          { cacheKey: `expenses_${workspace.id}`, ttl: 300000 }
        ),
        fetchWithCache(
          supabase
            .from('revenues')
            .select('*, author:profiles!revenues_author_id_fkey(id, display_name, avatar_url)')
            .eq('workspace_id', workspace.id)
            .order('date', { ascending: false }),
          { cacheKey: `revenues_${workspace.id}`, ttl: 300000 }
        ),
        fetchWithCache(
          supabase
            .from('expense_categories')
            .select('*')
            .eq('workspace_id', workspace.id),
          { cacheKey: `categories_${workspace.id}`, ttl: 300000 }
        ),
        fetchWithCache(
          supabase
            .from('monthly_budgets')
            .select('*')
            .eq('workspace_id', workspace.id)
            .order('year', { ascending: false })
            .order('month', { ascending: false }),
          { cacheKey: `budgets_${workspace.id}`, ttl: 300000 }
        ),
      ]);

      if (expensesData) setExpenses(expensesData as Expense[]);
      if (revenuesData) setRevenues(revenuesData as Revenue[]);
      if (categoriesData) setCategories(categoriesData as ExpenseCategory[]);
      if (budgetsData) setMonthlyBudgets(budgetsData as MonthlyBudget[]);
      
      if (!expensesData || !revenuesData || !categoriesData || !budgetsData) {
        if (isOnline) toast.error('Failed to load financial data');
      }
    } catch (error) {
      if (isOnline) toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspace?.id) {
      fetchData();

      // Real-time subscriptions for expenses and revenues
      const unsubscribeExpenses = subscribeToTable<Expense>(
        'expenses',
        (updated) => {
          if (updated.workspace_id === workspace.id) {
            setExpenses((prev) =>
              prev.map((e) => (e.id === updated.id ? updated : e))
            );
          }
        },
        (newExpense) => {
          if (newExpense.workspace_id === workspace.id) {
            setExpenses((prev) => [newExpense, ...prev]);
          }
        },
        (deleted) => {
          if (deleted.workspace_id === workspace.id) {
            setExpenses((prev) => prev.filter((e) => e.id !== deleted.id));
          }
        },
        `workspace_id=eq.${workspace.id}`
      );

      const unsubscribeRevenues = subscribeToTable<Revenue>(
        'revenues',
        (updated) => {
          if (updated.workspace_id === workspace.id) {
            setRevenues((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r))
            );
          }
        },
        (newRevenue) => {
          if (newRevenue.workspace_id === workspace.id) {
            setRevenues((prev) => [newRevenue, ...prev]);
          }
        },
        (deleted) => {
          if (deleted.workspace_id === workspace.id) {
            setRevenues((prev) => prev.filter((r) => r.id !== deleted.id));
          }
        },
        `workspace_id=eq.${workspace.id}`
      );

      return () => {
        unsubscribeExpenses();
        unsubscribeRevenues();
      };
    }
  }, [workspace?.id, isOnline]);

  useOnReconnect(async () => {
    if (workspace?.id) {
      await fetchData();
    }
  });

  const handleAddExpense = async () => {
    if (!user?.id || !workspace?.id || !newExpense.amount) return;

    try {
      const { error } = await supabase.from('expenses').insert({
        amount: parseFloat(newExpense.amount),
        description: newExpense.description || null,
        expense_type: newExpense.expense_type,
        finance_category: newExpense.finance_category,
        date: newExpense.date,
        author_id: user.id,
        workspace_id: workspace.id,
      });

      if (error) throw error;

      toast.success('Expense added!');
      setNewExpense({
        amount: '',
        description: '',
        expense_type: 'variable',
        finance_category: 'personal',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
      setExpenseDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  const handleAddRevenue = async () => {
    if (!user?.id || !workspace?.id || !newRevenue.amount || !newRevenue.source) return;

    try {
      const { error } = await supabase.from('revenues').insert({
        amount: parseFloat(newRevenue.amount),
        source: newRevenue.source,
        description: newRevenue.description || null,
        is_recurring: newRevenue.is_recurring,
        date: newRevenue.date,
        author_id: user.id,
        workspace_id: workspace.id,
      });

      if (error) throw error;

      toast.success('Revenue added!');
      setNewRevenue({
        amount: '',
        source: '',
        description: '',
        is_recurring: false,
        date: format(new Date(), 'yyyy-MM-dd'),
      });
      setRevenueDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to add revenue');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      toast.success('Expense deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const handleDeleteRevenue = async (id: string) => {
    try {
      const { error } = await supabase.from('revenues').delete().eq('id', id);
      if (error) throw error;
      toast.success('Revenue deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete revenue');
    }
  };

  const handleSaveBudget = async () => {
    if (!user?.id || !workspace?.id) return;
    const month = getMonth(selectedBudgetMonth) + 1;
    const year = getYear(selectedBudgetMonth);

    try {
      const existing = monthlyBudgets.find(b => b.year === year && b.month === month);
      
      if (existing) {
        const { error } = await supabase
          .from('monthly_budgets')
          .update({
            planned_income: parseFloat(newBudget.planned_income) || 0,
            planned_expense: parseFloat(newBudget.planned_expense) || 0,
            notes: newBudget.notes || null,
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase.from('monthly_budgets').insert({
          workspace_id: workspace.id,
          author_id: user.id,
          year,
          month,
          planned_income: parseFloat(newBudget.planned_income) || 0,
          planned_expense: parseFloat(newBudget.planned_expense) || 0,
          notes: newBudget.notes || null,
        });
        
        if (error) throw error;
      }
      
      toast.success('Budget saved!');
      setBudgetDialogOpen(false);
      setNewBudget({ planned_income: '', planned_expense: '', notes: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to save budget');
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalRevenues = revenues.reduce((sum, r) => sum + Number(r.amount), 0);
  const netBalance = totalRevenues - totalExpenses;
  const savingsRate = totalRevenues > 0 ? ((netBalance / totalRevenues) * 100).toFixed(1) : 0;

  // Generate 12-month data
  const getMonthlyChartData = () => {
    const data = [];
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const month = getMonth(date) + 1;
      const year = getYear(date);
      const budget = monthlyBudgets.find(b => b.year === year && b.month === month);
      
      data.push({
        month: format(date, 'MMM'),
        plannedIncome: budget?.planned_income || 0,
        plannedExpense: budget?.planned_expense || 0,
        actualIncome: budget?.actual_income || 0,
        actualExpense: budget?.actual_expense || 0,
      });
    }
    return data;
  };

  const monthlyData = getMonthlyChartData();
  const currentBudget = monthlyBudgets.find(
    b => b.year === getYear(selectedBudgetMonth) && b.month === getMonth(selectedBudgetMonth) + 1
  );
  const budgetDeficit = currentBudget
    ? Math.max(0, currentBudget.actual_expense - currentBudget.planned_expense)
    : 0;
  const budgetSurplus = currentBudget
    ? Math.max(0, currentBudget.actual_income - currentBudget.planned_income)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Finance</h1>
          <p className="text-muted-foreground">Track your financial health</p>
        </div>

        <div className="flex gap-2">
          <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowDownRight className="h-4 w-4 mr-2 text-destructive" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="What was this for?"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newExpense.expense_type}
                      onValueChange={(value) =>
                        setNewExpense({ ...newExpense, expense_type: value as 'fixed' | 'variable' | 'one_time' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="variable">Variable</SelectItem>
                        <SelectItem value="one_time">One-time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newExpense.finance_category}
                      onValueChange={(value) =>
                        setNewExpense({ ...newExpense, finance_category: value as 'business' | 'personal' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddExpense} className="w-full">
                  Add Expense
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={revenueDialogOpen} onOpenChange={setRevenueDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <ArrowUpRight className="h-4 w-4 mr-2 text-success" />
                Add Revenue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Revenue</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={newRevenue.amount}
                    onChange={(e) => setNewRevenue({ ...newRevenue, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Input
                    value={newRevenue.source}
                    onChange={(e) => setNewRevenue({ ...newRevenue, source: e.target.value })}
                    placeholder="Where did this come from?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newRevenue.date}
                    onChange={(e) => setNewRevenue({ ...newRevenue, date: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddRevenue} className="w-full">
                  Add Revenue
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">
              {formatPeso(totalRevenues)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">
              {formatPeso(totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Balance
            </CardTitle>
            <span className="text-primary font-bold">₱</span>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold font-display',
                netBalance >= 0 ? 'text-success' : 'text-destructive'
              )}
            >
              {formatPeso(netBalance)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Savings Rate
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{savingsRate}%</div>
            <Progress value={Number(savingsRate)} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Tabs defaultValue="budget" className="space-y-4">
        <TabsList>
          <TabsTrigger value="budget">12-Month Budget</TabsTrigger>
          <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
          <TabsTrigger value="revenues">Revenues ({revenues.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="space-y-4">
          {/* Budget Overview Card */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/50 shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Planned Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Income:</span>
                    <span className="text-sm font-semibold">{formatPeso(currentBudget?.planned_income || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Expenses:</span>
                    <span className="text-sm font-semibold">{formatPeso(currentBudget?.planned_expense || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Actual Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Income:</span>
                    <span className="text-sm font-semibold text-success">{formatPeso(currentBudget?.actual_income || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Expenses:</span>
                    <span className="text-sm font-semibold text-destructive">{formatPeso(currentBudget?.actual_expense || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Variance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className={cn('flex justify-between', budgetSurplus > 0 && 'text-success')}>
                    <span className="text-xs text-muted-foreground">Surplus:</span>
                    <span className="text-sm font-semibold">{formatPeso(budgetSurplus)}</span>
                  </div>
                  <div className={cn('flex justify-between', budgetDeficit > 0 && 'text-destructive')}>
                    <span className="text-xs text-muted-foreground">Deficit:</span>
                    <span className="text-sm font-semibold">{formatPeso(budgetDeficit)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 12-Month Trends */}
          <Card className="border-border/50 shadow-soft">
            <CardHeader>
              <CardTitle>12-Month Income vs Expense Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatPeso(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="plannedIncome" stroke="#10B981" strokeWidth={2} name="Planned Income" />
                  <Line type="monotone" dataKey="plannedExpense" stroke="#EF4444" strokeWidth={2} name="Planned Expense" />
                  <Line type="monotone" dataKey="actualIncome" stroke="#059669" strokeWidth={2} strokeDasharray="5 5" name="Actual Income" />
                  <Line type="monotone" dataKey="actualExpense" stroke="#DC2626" strokeWidth={2} strokeDasharray="5 5" name="Actual Expense" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Breakdown */}
          <Card className="border-border/50 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>12-Month Breakdown</CardTitle>
              <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Set Budget
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Set Budget for {format(selectedBudgetMonth, 'MMMM yyyy')}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedBudgetMonth(subMonths(selectedBudgetMonth, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium flex-1 text-center">
                        {format(selectedBudgetMonth, 'MMMM yyyy')}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedBudgetMonth(addMonths(selectedBudgetMonth, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Planned Income</Label>
                      <Input
                        type="number"
                        value={newBudget.planned_income}
                        onChange={(e) => setNewBudget({ ...newBudget, planned_income: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Planned Expenses</Label>
                      <Input
                        type="number"
                        value={newBudget.planned_expense}
                        onChange={(e) => setNewBudget({ ...newBudget, planned_expense: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input
                        value={newBudget.notes}
                        onChange={(e) => setNewBudget({ ...newBudget, notes: e.target.value })}
                        placeholder="Budget notes..."
                      />
                    </div>
                    <Button onClick={handleSaveBudget} className="w-full">
                      Save Budget
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatPeso(Number(value))} />
                  <Legend />
                  <Bar dataKey="plannedExpense" fill="#FCA5A5" name="Planned Expense" />
                  <Bar dataKey="actualExpense" fill="#EF4444" name="Actual Expense" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card className="border-border/50 shadow-soft">
            <CardContent className="p-0">
              {expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-1">No expenses yet</h3>
                  <p className="text-sm text-muted-foreground">Add your first expense</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                          <ArrowDownRight className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{expense.description || 'Expense'}</p>
                            <AuthorBadge author={expense.author || null} size="sm" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(expense.date), 'MMM d, yyyy')}
                            </span>
                            <Badge variant="secondary" className="text-xs capitalize">
                              {expense.expense_type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-semibold text-destructive">
                          -{formatPeso(Number(expense.amount))}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenues">
          <Card className="border-border/50 shadow-soft">
            <CardContent className="p-0">
              {revenues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-1">No revenues yet</h3>
                  <p className="text-sm text-muted-foreground">Add your first revenue</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {revenues.map((revenue) => (
                    <div
                      key={revenue.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                          <ArrowUpRight className="h-5 w-5 text-success" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{revenue.source}</p>
                            <AuthorBadge author={revenue.author || null} size="sm" />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(revenue.date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-semibold text-success">
                          +{formatPeso(Number(revenue.amount))}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteRevenue(revenue.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
