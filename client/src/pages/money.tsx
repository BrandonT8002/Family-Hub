import { useState } from "react";
import { useExpenses, useCreateExpense, useFinancialSchedule, useCreateFinancialSchedule, useUpdateFinancialSchedule, useDeleteFinancialSchedule, useSavingsGoals, useUpdateSavingsGoal, useCreateSavingsGoal } from "@/hooks/use-expenses";
import { format, startOfWeek, startOfMonth, isAfter, isBefore, differenceInDays, addMonths, addWeeks, addYears } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Plus, Receipt, TrendingUp, Wallet, Calendar as CalendarIcon, Target, ArrowUpRight, ArrowDownRight, DollarSign, CreditCard, Zap, Home, Wifi, Car, GraduationCap, Heart, ShoppingBag, MoreVertical, Pencil, Trash2, Check, X, AlertCircle, Clock, CheckCircle2, Ban } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const EXPENSE_CATEGORIES = ["Rent/Mortgage", "Utilities", "Subscriptions", "Gas", "Clothing", "Dining Out", "Entertainment", "School", "Other"];
const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#94a3b8', '#10b981', '#f43f5e', '#0ea5e9', '#64748b'];

const BILL_TYPES = [
  { value: "housing", label: "Housing", icon: Home },
  { value: "utility", label: "Utility", icon: Zap },
  { value: "subscription", label: "Subscription", icon: CreditCard },
  { value: "insurance", label: "Insurance", icon: Heart },
  { value: "transportation", label: "Transportation", icon: Car },
  { value: "education", label: "Education", icon: GraduationCap },
  { value: "internet", label: "Internet / Phone", icon: Wifi },
  { value: "shopping", label: "Shopping", icon: ShoppingBag },
  { value: "other", label: "Other", icon: Receipt },
];

const BILL_CATEGORIES = ["Rent/Mortgage", "Electric", "Water", "Gas Bill", "Internet", "Phone", "Car Payment", "Car Insurance", "Health Insurance", "Netflix", "Spotify", "Gym", "Loan Payment", "Credit Card", "Daycare", "Tuition", "Other"];

function getAnnualCost(amount: number, frequency: string | null): number {
  if (!frequency) return amount;
  switch (frequency) {
    case "Weekly": return amount * 52;
    case "Bi-weekly": return amount * 26;
    case "Monthly": return amount * 12;
    case "Quarterly": return amount * 4;
    case "Yearly": return amount;
    case "One-time": return amount;
    default: return amount * 12;
  }
}

function getNextDueDate(dueDate: Date, frequency: string | null): Date {
  const now = new Date();
  let next = new Date(dueDate);
  if (!frequency || frequency === "One-time") return next;
  while (next < now) {
    switch (frequency) {
      case "Weekly": next = addWeeks(next, 1); break;
      case "Bi-weekly": next = addWeeks(next, 2); break;
      case "Monthly": next = addMonths(next, 1); break;
      case "Quarterly": next = addMonths(next, 3); break;
      case "Yearly": next = addYears(next, 1); break;
      default: next = addMonths(next, 1);
    }
  }
  return next;
}

function getDueStatus(dueDate: Date, frequency: string | null, isPaid: boolean) {
  if (isPaid) return { label: "Paid", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 };
  const next = getNextDueDate(dueDate, frequency);
  const now = new Date();
  const daysUntil = differenceInDays(next, now);
  if (daysUntil < 0) return { label: "Overdue", color: "bg-red-100 text-red-700", icon: AlertCircle };
  if (daysUntil <= 3) return { label: "Due Soon", color: "bg-amber-100 text-amber-700", icon: Clock };
  if (daysUntil <= 7) return { label: `Due in ${daysUntil}d`, color: "bg-blue-100 text-blue-700", icon: Clock };
  return { label: `Due ${format(next, 'MMM d')}`, color: "bg-slate-100 text-slate-600", icon: CalendarIcon };
}

function getBillTypeIcon(billType: string | null) {
  const found = BILL_TYPES.find(t => t.value === billType);
  return found ? found.icon : Receipt;
}

export default function Money() {
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: schedule, isLoading: scheduleLoading } = useFinancialSchedule();
  const { data: goals, isLoading: goalsLoading } = useSavingsGoals();
  const { toast } = useToast();
  
  const createExpense = useCreateExpense();
  const createSchedule = useCreateFinancialSchedule();
  const updateSchedule = useUpdateFinancialSchedule();
  const deleteSchedule = useDeleteFinancialSchedule();
  const createGoal = useCreateSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [deletingBill, setDeletingBill] = useState<number | null>(null);

  const [expenseForm, setExpenseForm] = useState({ amount: "", category: "", description: "", vendor: "", tag: "" });
  const [billForm, setBillForm] = useState({
    title: "", amount: "", type: "Recurring", frequency: "Monthly", dueDate: "",
    isPayday: false, billType: "other", category: "", notes: "", autoPay: false
  });
  const [goalForm, setGoalForm] = useState({ name: "", targetAmount: "", currentAmount: "0" });

  const expensesData = expenses || [];
  const scheduleData = schedule || [];
  const goalsData = goals || [];

  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const spentThisWeek = expensesData
    .filter(e => isAfter(new Date(e.date), weekStart))
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const spentThisMonth = expensesData
    .filter(e => isAfter(new Date(e.date), monthStart))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const bills = scheduleData.filter(s => !s.isPayday);
  const income = scheduleData.filter(s => s.isPayday);
  const totalMonthlyBills = bills.reduce((sum, b) => {
    const freq = b.frequency || "Monthly";
    const monthly = freq === "Weekly" ? Number(b.amount) * 4.33
      : freq === "Bi-weekly" ? Number(b.amount) * 2.17
      : freq === "Quarterly" ? Number(b.amount) / 3
      : freq === "Yearly" ? Number(b.amount) / 12
      : Number(b.amount);
    return sum + monthly;
  }, 0);
  const totalAnnualBills = bills.reduce((sum, b) => sum + getAnnualCost(Number(b.amount), b.frequency), 0);
  const totalAnnualIncome = income.reduce((sum, i) => sum + getAnnualCost(Number(i.amount), i.frequency), 0);

  const upcomingBills = bills
    .map(b => ({ ...b, nextDue: getNextDueDate(new Date(b.dueDate), b.frequency) }))
    .sort((a, b) => a.nextDue.getTime() - b.nextDue.getTime());
  const overdueBills = upcomingBills.filter(b => !b.isPaid && differenceInDays(b.nextDue, now) < 0);
  const dueSoonBills = upcomingBills.filter(b => !b.isPaid && differenceInDays(b.nextDue, now) >= 0 && differenceInDays(b.nextDue, now) <= 7);

  const aggregated = expensesData.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
    return acc;
  }, {} as Record<string, number>);
  const chartData = Object.entries(aggregated)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const billsByType = bills.reduce((acc, b) => {
    const type = b.billType || "other";
    if (!acc[type]) acc[type] = 0;
    acc[type] += getAnnualCost(Number(b.amount), b.frequency);
    return acc;
  }, {} as Record<string, number>);
  const annualBreakdown = Object.entries(billsByType)
    .map(([type, value]) => ({ name: BILL_TYPES.find(t => t.value === type)?.label || type, value }))
    .sort((a, b) => b.value - a.value);

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExpense.mutate(expenseForm, {
      onSuccess: () => {
        setExpenseOpen(false);
        setExpenseForm({ amount: "", category: "", description: "", vendor: "", tag: "" });
        toast({ title: "Expense logged" });
      }
    });
  };

  const handleBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBill) {
      updateSchedule.mutate({
        id: editingBill.id,
        title: billForm.title,
        amount: billForm.amount,
        type: billForm.type,
        frequency: billForm.frequency,
        dueDate: billForm.dueDate,
        isPayday: billForm.isPayday,
        billType: billForm.billType,
        category: billForm.category,
        notes: billForm.notes,
        autoPay: billForm.autoPay,
      }, {
        onSuccess: () => {
          setBillOpen(false);
          setEditingBill(null);
          resetBillForm();
          toast({ title: "Bill updated" });
        },
        onError: () => toast({ title: "Failed to update bill", variant: "destructive" })
      });
    } else {
      createSchedule.mutate(billForm, {
        onSuccess: () => {
          setBillOpen(false);
          resetBillForm();
          toast({ title: billForm.isPayday ? "Income added" : "Bill added" });
        },
        onError: () => toast({ title: "Failed to add bill", variant: "destructive" })
      });
    }
  };

  const resetBillForm = () => {
    setBillForm({ title: "", amount: "", type: "Recurring", frequency: "Monthly", dueDate: "", isPayday: false, billType: "other", category: "", notes: "", autoPay: false });
  };

  const openEditBill = (item: any) => {
    setEditingBill(item);
    setBillForm({
      title: item.title,
      amount: String(Number(item.amount)),
      type: item.type,
      frequency: item.frequency || "Monthly",
      dueDate: format(new Date(item.dueDate), "yyyy-MM-dd"),
      isPayday: item.isPayday || false,
      billType: item.billType || "other",
      category: item.category || "",
      notes: item.notes || "",
      autoPay: item.autoPay || false,
    });
    setBillOpen(true);
  };

  const handleDeleteBill = (id: number) => {
    deleteSchedule.mutate(id, {
      onSuccess: () => {
        setDeletingBill(null);
        toast({ title: "Bill deleted" });
      },
      onError: () => toast({ title: "Failed to delete bill", variant: "destructive" })
    });
  };

  const togglePaid = (item: any) => {
    updateSchedule.mutate({ id: item.id, isPaid: !item.isPaid }, {
      onError: () => toast({ title: "Failed to update bill", variant: "destructive" })
    });
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGoal.mutate(goalForm, {
      onSuccess: () => {
        setGoalOpen(false);
        setGoalForm({ name: "", targetAmount: "", currentAmount: "0" });
        toast({ title: "Goal created" });
      }
    });
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold" data-testid="text-money-title">Money Management</h1>
          <p className="text-muted-foreground mt-1">Bills, expenses, and savings at a glance.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => { resetBillForm(); setEditingBill(null); setBillOpen(true); }} data-testid="button-add-bill">
            <Plus className="w-4 h-4" /> Add Bill
          </Button>
          <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl shadow-md hover-elevate gap-2 bg-primary text-primary-foreground" data-testid="button-log-expense">
                <Plus className="w-4 h-4" /> Log Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Log Expense</DialogTitle>
                <DialogDescription>Record a purchase or payment</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleExpenseSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input type="number" step="0.01" required value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="pl-7 rounded-xl" placeholder="0.00" data-testid="input-expense-amount" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={expenseForm.category} onValueChange={(val) => setExpenseForm({...expenseForm, category: val})}>
                      <SelectTrigger className="rounded-xl" data-testid="select-expense-category"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store / Vendor</label>
                  <Input value={expenseForm.vendor} onChange={e => setExpenseForm({...expenseForm, vendor: e.target.value})} placeholder="e.g. Costco, Target" className="rounded-xl" data-testid="input-expense-vendor" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input required value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} placeholder="What was it for?" className="rounded-xl" data-testid="input-expense-description" />
                </div>
                <Button type="submit" disabled={createExpense.isPending} className="w-full rounded-xl h-11 mt-2" data-testid="button-submit-expense">
                  {createExpense.isPending ? "Saving..." : "Save Expense"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="bills" className="space-y-6">
        <TabsList className="bg-white/40 p-1.5 rounded-2xl border-2 border-white/60 backdrop-blur-md shadow-inner">
          <TabsTrigger value="bills" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all font-black text-sm tracking-wide" data-testid="tab-bills">BILLS</TabsTrigger>
          <TabsTrigger value="expenses" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all font-black text-sm tracking-wide" data-testid="tab-expenses">EXPENSES</TabsTrigger>
          <TabsTrigger value="goals" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all font-black text-sm tracking-wide" data-testid="tab-goals">SAVINGS</TabsTrigger>
        </TabsList>

        <TabsContent value="bills" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Monthly Bills</p>
                    <h3 className="text-2xl font-display font-bold mt-1" data-testid="text-monthly-bills">${totalMonthlyBills.toFixed(2)}</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg text-primary"><CreditCard className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Annual Cost</p>
                    <h3 className="text-2xl font-display font-bold mt-1" data-testid="text-annual-cost">${totalAnnualBills.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                  </div>
                  <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500"><DollarSign className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Annual Income</p>
                    <h3 className="text-2xl font-display font-bold mt-1 text-emerald-600" data-testid="text-annual-income">${totalAnnualIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                  </div>
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><TrendingUp className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className={`rounded-2xl shadow-sm ${overdueBills.length > 0 ? 'border-red-200 bg-red-50/50' : dueSoonBills.length > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-border/50'}`}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attention</p>
                    <h3 className="text-2xl font-display font-bold mt-1" data-testid="text-attention-count">
                      {overdueBills.length > 0 ? `${overdueBills.length} overdue` : dueSoonBills.length > 0 ? `${dueSoonBills.length} due soon` : "All clear"}
                    </h3>
                  </div>
                  <div className={`p-2 rounded-lg ${overdueBills.length > 0 ? 'bg-red-100 text-red-600' : dueSoonBills.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {overdueBills.length > 0 ? <AlertCircle className="w-5 h-5" /> : dueSoonBills.length > 0 ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {(overdueBills.length > 0 || dueSoonBills.length > 0) && (
            <Card className="rounded-2xl border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm">
              <CardContent className="p-5">
                <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" /> Upcoming & Overdue
                </h3>
                <div className="space-y-2">
                  {[...overdueBills, ...dueSoonBills].slice(0, 5).map(bill => {
                    const status = getDueStatus(new Date(bill.dueDate), bill.frequency, bill.isPaid || false);
                    const StatusIcon = status.icon;
                    return (
                      <div key={bill.id} className="flex items-center justify-between bg-white/80 rounded-xl p-3" data-testid={`alert-bill-${bill.id}`}>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={`rounded-lg text-[10px] gap-1 ${status.color} border-0`}>
                            <StatusIcon className="w-3 h-3" /> {status.label}
                          </Badge>
                          <span className="font-medium text-sm">{bill.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-display font-bold">${Number(bill.amount).toFixed(2)}</span>
                          <Button size="sm" variant="outline" className="rounded-lg h-7 text-xs gap-1" onClick={() => togglePaid(bill)} data-testid={`button-pay-${bill.id}`}>
                            <Check className="w-3 h-3" /> Mark Paid
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold">All Bills & Payments</h2>
                <Button variant="outline" className="rounded-xl gap-2" onClick={() => { resetBillForm(); setEditingBill(null); setBillOpen(true); }} data-testid="button-add-bill-inline">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>
              
              {scheduleLoading ? (
                <div className="text-center p-8 text-muted-foreground">Loading bills...</div>
              ) : scheduleData.length === 0 ? (
                <Card className="rounded-2xl border-2 border-dashed border-border/50 p-12 text-center">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <h3 className="text-lg font-medium mb-1">No bills tracked yet</h3>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-4">Add your bills and income to see your financial picture.</p>
                  <Button className="rounded-xl gap-2" onClick={() => { resetBillForm(); setEditingBill(null); setBillOpen(true); }} data-testid="button-add-first-bill">
                    <Plus className="w-4 h-4" /> Add Your First Bill
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {income.length > 0 && (
                    <>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider px-1">Income</p>
                      {income.map(item => {
                        const annualCost = getAnnualCost(Number(item.amount), item.frequency);
                        const IconComp = getBillTypeIcon(item.billType);
                        return (
                          <Card key={item.id} className="rounded-2xl border-emerald-100 shadow-sm hover:shadow-md transition-all" data-testid={`card-income-${item.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                                  <ArrowUpRight className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h4 className="font-bold text-sm truncate" data-testid={`text-income-title-${item.id}`}>{item.title}</h4>
                                    <Badge variant="outline" className="rounded-md text-[10px] border-emerald-200 text-emerald-600">{item.frequency}</Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Next: {format(getNextDueDate(new Date(item.dueDate), item.frequency), 'MMM d, yyyy')}
                                    {item.frequency !== "One-time" && <span className="ml-2 text-emerald-600 font-medium">${annualCost.toLocaleString()}/yr</span>}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-lg font-display font-bold text-emerald-600" data-testid={`text-income-amount-${item.id}`}>+${Number(item.amount).toFixed(2)}</p>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" data-testid={`button-menu-income-${item.id}`}>
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="rounded-xl">
                                    <DropdownMenuItem onClick={() => openEditBill(item)} data-testid={`button-edit-income-${item.id}`}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => setDeletingBill(item.id)} data-testid={`button-delete-income-${item.id}`}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </>
                  )}

                  {bills.length > 0 && (
                    <>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 mt-4">Bills & Payments</p>
                      {upcomingBills.map(item => {
                        const annualCost = getAnnualCost(Number(item.amount), item.frequency);
                        const IconComp = getBillTypeIcon(item.billType);
                        const status = getDueStatus(new Date(item.dueDate), item.frequency, item.isPaid || false);
                        const StatusIcon = status.icon;
                        return (
                          <Card key={item.id} className={`rounded-2xl shadow-sm hover:shadow-md transition-all ${item.isPaid ? 'border-emerald-100 opacity-70' : 'border-border/50'}`} data-testid={`card-bill-${item.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <button onClick={() => togglePaid(item)} className="shrink-0" data-testid={`button-toggle-paid-${item.id}`}>
                                  <div className={`p-2.5 rounded-xl transition-colors ${item.isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 hover:bg-primary/10 hover:text-primary'}`}>
                                    {item.isPaid ? <CheckCircle2 className="w-5 h-5" /> : <IconComp className="w-5 h-5" />}
                                  </div>
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h4 className={`font-bold text-sm truncate ${item.isPaid ? 'line-through text-muted-foreground' : ''}`} data-testid={`text-bill-title-${item.id}`}>{item.title}</h4>
                                    <Badge variant="outline" className={`rounded-md text-[10px] gap-0.5 border-0 ${status.color}`}>
                                      <StatusIcon className="w-2.5 h-2.5" /> {status.label}
                                    </Badge>
                                    {item.autoPay && <Badge variant="outline" className="rounded-md text-[10px] border-blue-200 text-blue-600 gap-0.5"><Zap className="w-2.5 h-2.5" /> Auto</Badge>}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{item.frequency || "One-time"}</span>
                                    {item.category && <><span className="text-border">|</span><span>{item.category}</span></>}
                                    {item.frequency !== "One-time" && (
                                      <span className="text-rose-500 font-medium">${annualCost.toLocaleString()}/yr</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className={`text-lg font-display font-bold ${item.isPaid ? 'text-muted-foreground' : ''}`} data-testid={`text-bill-amount-${item.id}`}>
                                    -${Number(item.amount).toFixed(2)}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">{format(item.nextDue, 'MMM d')}</p>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" data-testid={`button-menu-bill-${item.id}`}>
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="rounded-xl">
                                    <DropdownMenuItem onClick={() => openEditBill(item)} data-testid={`button-edit-bill-${item.id}`}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => togglePaid(item)} data-testid={`button-paid-menu-${item.id}`}>
                                      {item.isPaid ? <><Ban className="w-4 h-4 mr-2" /> Mark Unpaid</> : <><Check className="w-4 h-4 mr-2" /> Mark Paid</>}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => setDeletingBill(item.id)} data-testid={`button-delete-bill-${item.id}`}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              {item.notes && (
                                <p className="text-xs text-muted-foreground mt-2 ml-14 bg-muted/30 p-2 rounded-lg">{item.notes}</p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-display flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Annual Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {annualBreakdown.length > 0 ? (
                    <>
                      <div className="w-full h-[180px] mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={annualBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                              {annualBreakdown.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 mt-2">
                        {annualBreakdown.map((entry, index) => (
                          <div key={entry.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                              <span className="text-muted-foreground">{entry.name}</span>
                            </div>
                            <span className="font-bold">${entry.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/50">
                        <div className="flex justify-between text-sm font-bold">
                          <span>Total Annual</span>
                          <span className="font-display text-primary">${totalAnnualBills.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground text-sm italic">Add bills to see annual cost breakdown.</div>
                  )}
                </CardContent>
              </Card>

              {bills.length > 0 && (
                <Card className="rounded-2xl border-border/50 shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-display flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" /> Per-Bill Annual Cost
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-3 mt-2">
                      {bills
                        .map(b => ({ name: b.title, annual: getAnnualCost(Number(b.amount), b.frequency), monthly: Number(b.amount), frequency: b.frequency }))
                        .sort((a, b) => b.annual - a.annual)
                        .map((b, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium truncate mr-2">{b.name}</span>
                              <span className="font-bold text-rose-500 shrink-0">${b.annual.toLocaleString()}/yr</span>
                            </div>
                            <div className="w-full bg-muted/50 rounded-full h-1.5">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-primary to-rose-400"
                                style={{ width: `${Math.min((b.annual / Math.max(totalAnnualBills, 1)) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Spent this Week</p>
                    <h3 className="text-2xl font-display font-bold mt-1" data-testid="text-weekly-spend">${spentThisWeek.toFixed(2)}</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg text-primary"><TrendingUp className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Spent this Month</p>
                    <h3 className="text-2xl font-display font-bold mt-1" data-testid="text-monthly-spend">${spentThisMonth.toFixed(2)}</h3>
                  </div>
                  <div className="p-2 bg-accent/10 rounded-lg text-accent"><Wallet className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Transactions</p>
                    <h3 className="text-2xl font-display font-bold mt-1">{expensesData.length}</h3>
                  </div>
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Receipt className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Goals</p>
                    <h3 className="text-2xl font-display font-bold mt-1">{goalsData.length}</h3>
                  </div>
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><Target className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 rounded-2xl border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-muted/30 p-4">
                <CardTitle className="text-lg flex items-center gap-2 font-display">
                  <Receipt className="w-4 h-4" /> Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {expensesLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading transactions...</div>
                  ) : expensesData.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-muted-foreground">No transactions logged yet.</p>
                      <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setExpenseOpen(true)} data-testid="button-log-first-expense">Log your first expense</Button>
                    </div>
                  ) : (
                    expensesData.slice().reverse().slice(0, 10).map((exp) => (
                      <div key={exp.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors" data-testid={`row-expense-${exp.id}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{exp.vendor || exp.description}</p>
                            <div className="flex gap-2 items-center text-xs text-muted-foreground mt-0.5">
                              <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded-md font-medium">{exp.category}</span>
                              <span>{format(new Date(exp.date), 'MMM d')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold font-display text-lg">-${Number(exp.amount).toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardHeader className="p-4 border-b">
                  <CardTitle className="text-lg font-display">Spending Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {chartData.length > 0 ? (
                    <>
                      <div className="w-full h-[200px] mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                              {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-3">
                        {chartData.slice(0, 5).map((entry, index) => (
                          <div key={entry.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                              <span className="text-muted-foreground">{entry.name}</span>
                            </div>
                            <span className="font-bold">${entry.value.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-10 text-center text-muted-foreground italic">Add expenses to see breakdown.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-display font-semibold">Savings Goals</h2>
            <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl gap-2 bg-primary" data-testid="button-new-goal"><Target className="w-4 h-4" /> New Goal</Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display">New Savings Goal</DialogTitle>
                  <DialogDescription>Set a target to save towards</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleGoalSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Goal Name</label>
                    <Input required value={goalForm.name} onChange={e => setGoalForm({...goalForm, name: e.target.value})} placeholder="e.g. New Couch, Vacation" className="rounded-xl" data-testid="input-goal-name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Amount</label>
                      <Input type="number" required value={goalForm.targetAmount} onChange={e => setGoalForm({...goalForm, targetAmount: e.target.value})} className="rounded-xl" placeholder="0" data-testid="input-goal-target" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Initial Savings</label>
                      <Input type="number" value={goalForm.currentAmount} onChange={e => setGoalForm({...goalForm, currentAmount: e.target.value})} className="rounded-xl" placeholder="0" data-testid="input-goal-initial" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full rounded-xl" disabled={createGoal.isPending} data-testid="button-submit-goal">Create Goal</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goalsLoading ? (
              <div>Loading goals...</div>
            ) : goalsData.length === 0 ? (
              <div className="col-span-full p-12 text-center border-2 border-dashed rounded-3xl bg-muted/20">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No savings goals yet</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mt-1">Work together to save for something special.</p>
              </div>
            ) : (
              goalsData.map(goal => {
                const progress = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100;
                return (
                  <Card key={goal.id} className="rounded-2xl border-border/50 shadow-sm overflow-hidden" data-testid={`card-goal-${goal.id}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-xl font-display font-bold" data-testid={`text-goal-name-${goal.id}`}>{goal.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            ${Number(goal.currentAmount).toLocaleString()} saved of ${Number(goal.targetAmount).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-display font-black text-primary">{Math.round(progress)}%</span>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <Progress value={progress} className="h-3 rounded-full bg-primary/10" />
                        
                        <div className="flex gap-2">
                          <Input 
                            type="number" 
                            placeholder="Add amount" 
                            className="rounded-xl h-9"
                            data-testid={`input-goal-add-${goal.id}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = Number((e.target as HTMLInputElement).value);
                                if (val) {
                                  updateGoal.mutate({ id: goal.id, currentAmount: (Number(goal.currentAmount) + val).toString() });
                                  (e.target as HTMLInputElement).value = "";
                                }
                              }
                            }}
                          />
                          <Button size="sm" variant="secondary" className="rounded-xl" data-testid={`button-goal-update-${goal.id}`}>Update</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={billOpen} onOpenChange={(open) => { setBillOpen(open); if (!open) setEditingBill(null); }}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editingBill ? "Edit Bill" : "Add Bill or Income"}</DialogTitle>
            <DialogDescription>{editingBill ? "Update the details of this bill" : "Track a recurring bill, subscription, or income"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBillSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input required value={billForm.title} onChange={e => setBillForm({...billForm, title: e.target.value})} placeholder="e.g. Rent, Netflix, Electric Bill" className="rounded-xl" data-testid="input-bill-title" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="number" step="0.01" required value={billForm.amount} onChange={e => setBillForm({...billForm, amount: e.target.value})} className="pl-7 rounded-xl" placeholder="0.00" data-testid="input-bill-amount" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bill Type</label>
                <Select value={billForm.billType} onValueChange={v => setBillForm({...billForm, billType: v})}>
                  <SelectTrigger className="rounded-xl" data-testid="select-bill-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BILL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Frequency</label>
                <Select value={billForm.frequency} onValueChange={v => setBillForm({...billForm, frequency: v})}>
                  <SelectTrigger className="rounded-xl" data-testid="select-bill-frequency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="One-time">One-time</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input type="date" required value={billForm.dueDate} onChange={e => setBillForm({...billForm, dueDate: e.target.value})} className="rounded-xl" data-testid="input-bill-due-date" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={billForm.category} onValueChange={v => setBillForm({...billForm, category: v})}>
                <SelectTrigger className="rounded-xl" data-testid="select-bill-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {BILL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea value={billForm.notes} onChange={e => setBillForm({...billForm, notes: e.target.value})} placeholder="Account number, reference, or notes..." className="rounded-xl resize-none h-16" data-testid="input-bill-notes" />
            </div>

            <div className="flex items-center gap-6 bg-muted/30 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <Switch checked={billForm.isPayday} onCheckedChange={v => setBillForm({...billForm, isPayday: v})} data-testid="switch-is-income" />
                <label className="text-sm font-medium cursor-pointer">Income / Payday</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={billForm.autoPay} onCheckedChange={v => setBillForm({...billForm, autoPay: v})} data-testid="switch-auto-pay" />
                <label className="text-sm font-medium cursor-pointer">Auto-pay</label>
              </div>
            </div>

            {billForm.amount && billForm.frequency && billForm.frequency !== "One-time" && (
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">Annual Cost</p>
                <p className="text-xl font-display font-bold text-primary" data-testid="text-bill-annual-preview">
                  ${getAnnualCost(Number(billForm.amount), billForm.frequency).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}

            <Button type="submit" className="w-full rounded-xl h-11" disabled={createSchedule.isPending || updateSchedule.isPending} data-testid="button-submit-bill">
              {(createSchedule.isPending || updateSchedule.isPending) ? "Saving..." : editingBill ? "Update Bill" : "Add Bill"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deletingBill !== null} onOpenChange={(open) => { if (!open) setDeletingBill(null); }}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Delete Bill?</DialogTitle>
            <DialogDescription>This action cannot be undone. The bill will be permanently removed.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeletingBill(null)} data-testid="button-cancel-delete">Cancel</Button>
            <Button variant="destructive" className="flex-1 rounded-xl" onClick={() => deletingBill && handleDeleteBill(deletingBill)} disabled={deleteSchedule.isPending} data-testid="button-confirm-delete">
              {deleteSchedule.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
