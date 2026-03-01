import { useState } from "react";
import { useExpenses, useCreateExpense } from "@/hooks/use-expenses";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Plus, Receipt, TrendingUp } from "lucide-react";

const CATEGORIES = ["Groceries", "Utilities", "Entertainment", "Kids", "Home", "Other"];
const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#94a3b8'];

export default function Money() {
  const { data: expenses, isLoading } = useEvents(); // Typo alias hook, let's fix below
  const realExpenses = useExpenses();
  const expensesData = realExpenses.data || [];
  
  const createExpense = useCreateExpense();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ amount: "", category: "", description: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category || !formData.description) return;
    createExpense.mutate(
      { amount: formData.amount, category: formData.category, description: formData.description },
      { onSuccess: () => { setIsOpen(false); setFormData({ amount: "", category: "", description: "" }); } }
    );
  };

  const totalSpent = expensesData.reduce((sum, exp) => sum + Number(exp.amount), 0);
  
  // Aggregate for chart
  const aggregated = expensesData.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
    return acc;
  }, {} as Record<string, number>);
  
  const chartData = Object.entries(aggregated).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Money</h1>
          <p className="text-muted-foreground mt-1">Track family spending and budgets.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-md hover-elevate gap-2 bg-accent hover:bg-accent/90 text-white">
              <Plus className="w-4 h-4" /> Log Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Log Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="pl-7 rounded-xl" placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Target run" className="rounded-xl" />
              </div>
              <Button type="submit" disabled={createExpense.isPending} className="w-full rounded-xl h-11 mt-2">
                {createExpense.isPending ? "Saving..." : "Save Expense"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="rounded-2xl border-border/50 bg-gradient-to-br from-background to-muted/50">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Spent (All time)</p>
                  <h3 className="text-3xl font-display font-bold">${totalSpent.toFixed(2)}</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {realExpenses.isLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading...</div>
              ) : expensesData.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No expenses logged yet.</div>
              ) : (
                <div className="space-y-4">
                  {expensesData.slice(0, 10).map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Receipt className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{exp.description}</p>
                          <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded-md">{exp.category}</span>
                            {exp.date && <span>{format(new Date(exp.date), 'MMM d, yyyy')}</span>}
                          </div>
                        </div>
                      </div>
                      <span className="font-bold font-display text-base">
                        ${Number(exp.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="rounded-2xl border-border/50 h-full">
            <CardHeader>
              <CardTitle className="text-lg">Spending by Category</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {chartData.length > 0 ? (
                <>
                  <div className="w-full h-[250px] mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full space-y-2">
                    {chartData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span>{entry.name}</span>
                        </div>
                        <span className="font-medium">${entry.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-muted-foreground">Log expenses to see charts.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
