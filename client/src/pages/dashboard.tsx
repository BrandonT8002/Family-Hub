import { useExpenses, useFinancialSchedule, useSavingsGoals } from "@/hooks/use-expenses";
import { useEvents } from "@/hooks/use-events";
import { format, isSameDay, startOfMonth, endOfMonth, isAfter, isBefore } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle, 
  MessageSquare, 
  Plus, 
  TrendingUp, 
  Wallet, 
  Clock,
  ArrowRight,
  ShoppingCart,
  Receipt,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: expenses } = useExpenses();
  const { data: schedule } = useFinancialSchedule();
  const { data: goals } = useSavingsGoals();
  const { data: events } = useEvents();

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // Stats calculations
  const monthlySpend = expenses
    ?.filter(e => isAfter(new Date(e.date), monthStart) && isBefore(new Date(e.date), monthEnd))
    .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  const upcomingBills = schedule
    ?.filter(s => !s.isPayday && isAfter(new Date(s.dueDate), today))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3) || [];

  const activeGoals = goals?.slice(0, 2) || [];
  const todayEvents = events?.filter(e => isSameDay(new Date(e.startTime), today)) || [];

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-4xl font-display font-bold tracking-tight">Family Overview</h1>
        <p className="text-muted-foreground mt-2 text-lg">Everything at a glance for your household.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Money Snapshot */}
        <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden bg-primary/5 border-primary/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary/70 font-medium">Monthly Spending</CardDescription>
            <CardTitle className="text-3xl font-display font-bold">${monthlySpend.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-primary/80 mb-4">
              <TrendingUp className="w-4 h-4" />
              <span>Tracking {expenses?.length || 0} transactions</span>
            </div>
            <Link href="/money">
              <Button variant="link" className="p-0 h-auto text-primary font-semibold gap-1">
                Manage Money <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Schedule Snapshot */}
        <Card className="rounded-3xl border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Today's Schedule</CardDescription>
            <CardTitle className="text-3xl font-display font-bold">{todayEvents.length} Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {todayEvents.length > 0 ? (
                todayEvents.slice(0, 2).map(event => (
                  <div key={event.id} className="flex items-center gap-2 text-sm truncate">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-medium">{format(new Date(event.startTime), 'h:mm a')}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="truncate">{event.title}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">Quiet day today.</p>
              )}
            </div>
            <Link href="/schedule">
              <Button variant="link" className="p-0 h-auto font-semibold gap-1">
                View Calendar <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="rounded-3xl border-border/50 shadow-sm bg-accent/5 border-accent/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-display font-bold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link href="/money">
              <Button variant="outline" size="sm" className="w-full rounded-xl justify-start gap-2 h-10 border-border/50">
                <Receipt className="w-4 h-4 text-primary" /> Expense
              </Button>
            </Link>
            <Link href="/groceries">
              <Button variant="outline" size="sm" className="w-full rounded-xl justify-start gap-2 h-10 border-border/50">
                <ShoppingCart className="w-4 h-4 text-orange-500" /> Groceries
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Obligations */}
        <section className="space-y-4">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" /> Upcoming Bills
          </h2>
          <div className="space-y-3">
            {upcomingBills.length > 0 ? (
              upcomingBills.map(bill => (
                <Card key={bill.id} className="rounded-2xl border-border/40 shadow-none hover-elevate transition-all">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-xl">
                        <Receipt className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{bill.title}</p>
                        <p className="text-xs text-muted-foreground">Due {format(new Date(bill.dueDate), 'MMM d')}</p>
                      </div>
                    </div>
                    <p className="font-display font-bold">-${Number(bill.amount).toFixed(2)}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="p-8 text-center border-2 border-dashed rounded-3xl text-muted-foreground">
                No upcoming bills.
              </div>
            )}
          </div>
        </section>

        {/* Savings Progress */}
        <section className="space-y-4">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" /> Savings Goals
          </h2>
          <div className="space-y-4">
            {activeGoals.length > 0 ? (
              activeGoals.map(goal => {
                const progress = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100;
                return (
                  <Card key={goal.id} className="rounded-2xl border-border/40 shadow-none">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <p className="font-bold">{goal.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            ${Number(goal.currentAmount).toLocaleString()} / ${Number(goal.targetAmount).toLocaleString()}
                          </p>
                        </div>
                        <p className="font-display font-black text-primary text-xl">{Math.round(progress)}%</p>
                      </div>
                      <Progress value={progress} className="h-2 rounded-full bg-primary/10" />
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="p-8 text-center border-2 border-dashed rounded-3xl text-muted-foreground">
                Set a savings goal to track progress.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
