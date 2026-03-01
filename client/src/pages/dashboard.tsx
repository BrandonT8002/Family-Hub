import { useEvents } from "@/hooks/use-events";
import { useExpenses } from "@/hooks/use-expenses";
import { useChatMessages } from "@/hooks/use-chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Wallet, MessageSquare, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { format, isToday } from "date-fns";

export default function Dashboard() {
  const { data: events } = useEvents();
  const { data: expenses } = useExpenses();
  const { data: chats } = useChatMessages();

  const todayEvents = events?.filter(e => isToday(new Date(e.date))) || [];
  const recentExpenses = expenses?.slice(0, 3) || [];
  const recentChats = chats?.slice(0, 3) || [];

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Good to see you!</h1>
        <p className="text-muted-foreground mt-1 text-lg">Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Schedule Summary */}
        <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <CalendarDays className="w-4 h-4" />
              </div>
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="space-y-4 flex-1">
              {todayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No events scheduled for today.</p>
              ) : (
                todayEvents.map(event => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(event.date), 'h:mm a')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link href="/schedule" className="text-sm text-primary font-medium hover:underline mt-4 flex items-center gap-1 inline-flex w-fit">
              View full calendar <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Expenses Summary */}
        <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-2 bg-accent/10 rounded-lg text-accent">
                <Wallet className="w-4 h-4" />
              </div>
              Recent Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="space-y-4 flex-1">
              {recentExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No recent expenses.</p>
              ) : (
                recentExpenses.map(expense => (
                  <div key={expense.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {expense.category[0]}
                      </div>
                      <p className="text-sm font-medium">{expense.description}</p>
                    </div>
                    <span className="text-sm font-bold">${Number(expense.amount).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
            <Link href="/money" className="text-sm text-primary font-medium hover:underline mt-4 flex items-center gap-1 inline-flex w-fit">
              Manage money <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Chat Summary */}
        <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                <MessageSquare className="w-4 h-4" />
              </div>
              Family Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="space-y-4 flex-1">
              {recentChats.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No messages yet.</p>
              ) : (
                recentChats.map(chat => (
                  <div key={chat.id} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">{chat.user.firstName}</span>
                    <p className="text-sm bg-muted/50 p-2 rounded-xl rounded-tl-none border border-border/30 line-clamp-2">
                      {chat.content}
                    </p>
                  </div>
                ))
              )}
            </div>
            <Link href="/chat" className="text-sm text-primary font-medium hover:underline mt-4 flex items-center gap-1 inline-flex w-fit">
              Open chat <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
