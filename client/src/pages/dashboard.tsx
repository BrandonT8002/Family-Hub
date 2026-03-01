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
        <Card className="rounded-[2.5rem] border-white/80 shadow-xl overflow-hidden bg-white/90 backdrop-blur-xl transition-all hover:shadow-2xl hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary font-black uppercase tracking-widest text-[11px]">Monthly Spending</CardDescription>
            <CardTitle className="text-4xl font-display font-black text-slate-900">${monthlySpend.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-primary font-black mb-6">
              <TrendingUp className="w-5 h-5" />
              <span>{expenses?.length || 0} Transactions Tracked</span>
            </div>
            <Link href="/money">
              <Button variant="default" className="w-full rounded-2xl h-12 bg-primary text-primary-foreground font-black shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Manage Money
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Schedule Snapshot */}
        <Card className="rounded-[2.5rem] border-white/80 shadow-xl bg-white/90 backdrop-blur-xl transition-all hover:shadow-2xl hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-900 font-black uppercase tracking-widest text-[11px]">Today's Schedule</CardDescription>
            <CardTitle className="text-4xl font-display font-black text-slate-900">{todayEvents.length} Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              {todayEvents.length > 0 ? (
                todayEvents.slice(0, 2).map(event => (
                  <div key={event.id} className="flex items-center gap-3 text-sm truncate bg-slate-50 p-3 rounded-2xl border-2 border-white shadow-sm">
                    <div className="bg-primary/20 p-1.5 rounded-lg">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 leading-none mb-1">{format(new Date(event.startTime), 'h:mm a')}</p>
                      <p className="truncate font-bold text-slate-500 leading-none">{event.title}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 font-bold italic bg-slate-50 p-4 rounded-2xl text-center border-2 border-white">Quiet day today.</p>
              )}
            </div>
            <Link href="/schedule">
              <Button variant="outline" className="w-full rounded-2xl h-12 border-2 border-slate-200 font-black text-slate-900 hover:bg-slate-50 transition-all">
                View Calendar
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="rounded-[2.5rem] border-white/80 shadow-xl bg-white/90 backdrop-blur-xl transition-all hover:shadow-2xl hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-display font-black text-slate-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3">
            <Link href="/money">
              <Button variant="outline" className="w-full rounded-2xl justify-start gap-3 h-14 bg-white border-2 border-primary/20 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-sm font-black group">
                <div className="bg-primary/10 group-hover:bg-white/20 p-2 rounded-xl">
                  <Receipt className="w-5 h-5 text-primary group-hover:text-white" />
                </div>
                Log New Expense
              </Button>
            </Link>
            <Link href="/groceries">
              <Button variant="outline" className="w-full rounded-2xl justify-start gap-3 h-14 bg-white border-2 border-orange-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm font-black group">
                <div className="bg-orange-100 group-hover:bg-white/20 p-2 rounded-xl">
                  <ShoppingCart className="w-5 h-5 text-orange-600 group-hover:text-white" />
                </div>
                Open Groceries
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
                <Card key={bill.id} className="rounded-2xl border-white/40 shadow-sm hover-elevate transition-all bg-white/70 backdrop-blur-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-xl shadow-inner">
                        <Receipt className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-black text-sm">{bill.title}</p>
                        <p className="text-xs text-primary/70 font-bold">Due {format(new Date(bill.dueDate), 'MMM d')}</p>
                      </div>
                    </div>
                    <p className="font-display font-black text-xl text-primary">-${Number(bill.amount).toFixed(2)}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-white/60 rounded-3xl text-primary/60 font-bold bg-white/40">
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
                  <Card key={goal.id} className="rounded-2xl border-white/40 shadow-sm bg-white/70 backdrop-blur-sm">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <p className="font-black text-lg">{goal.name}</p>
                          <p className="text-sm text-primary font-bold mt-0.5">
                            ${Number(goal.currentAmount).toLocaleString()} / ${Number(goal.targetAmount).toLocaleString()}
                          </p>
                        </div>
                        <p className="font-display font-black text-primary text-2xl">{Math.round(progress)}%</p>
                      </div>
                      <Progress value={progress} className="h-3 rounded-full bg-white border border-white/60 shadow-inner" />
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-white/60 rounded-3xl text-primary/60 font-bold bg-white/40">
                Set a savings goal to track progress.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
