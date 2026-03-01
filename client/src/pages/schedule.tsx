import { useState } from "react";
import { useEvents, useCreateEvent } from "@/hooks/use-events";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarPlus, MapPin, Clock, ChevronLeft, ChevronRight, Lock, Users, Info } from "lucide-react";

export default function Schedule() {
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({ 
    title: "", 
    description: "", 
    date: format(new Date(), 'yyyy-MM-dd'), 
    time: "12:00",
    recurrence: "One-time",
    isPersonal: false,
    notes: "",
    location: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.time) return;
    
    const dateTime = new Date(`${formData.date}T${formData.time}`);
    createEvent.mutate(
      { 
        title: formData.title, 
        description: formData.description, 
        date: dateTime.toISOString(),
        startTime: dateTime.toISOString(),
        recurrence: formData.recurrence,
        isPersonal: formData.isPersonal,
        notes: formData.notes,
        location: formData.location
      },
      { onSuccess: () => { 
        setIsOpen(false); 
        setFormData({ 
          title: "", description: "", date: format(new Date(), 'yyyy-MM-dd'), time: "12:00",
          recurrence: "One-time", isPersonal: false, notes: "", location: ""
        }); 
      } }
    );
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const dayEvents = (events || []).filter(e => isSameDay(new Date(e.date), selectedDate));

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tight text-slate-900">Schedule</h1>
          <p className="text-slate-600 mt-2 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Family Coordination Engine
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-14 px-8 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-3 text-lg font-black bg-primary text-white">
              <CalendarPlus className="w-6 h-6" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl rounded-[2rem] border-none shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="font-display text-3xl font-black text-slate-900">New Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 ml-1">Title</label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Soccer practice, Dinner date" className="rounded-2xl h-14 bg-slate-50 border-2 border-slate-100 focus:border-primary/30 text-lg font-bold" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 ml-1">Date</label>
                  <Input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="rounded-2xl h-14 bg-slate-50 border-2 border-slate-100 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 ml-1">Time</label>
                  <Input type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="rounded-2xl h-14 bg-slate-50 border-2 border-slate-100 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 ml-1">Recurrence</label>
                  <Select value={formData.recurrence} onValueChange={v => setFormData({...formData, recurrence: v})}>
                    <SelectTrigger className="rounded-2xl h-14 bg-slate-50 border-2 border-slate-100 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="One-time">One-time</SelectItem>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 ml-1">Visibility</label>
                  <div className="flex items-center gap-3 h-14 px-4 bg-slate-50 border-2 border-slate-100 rounded-2xl">
                    <Checkbox id="isPersonal" checked={formData.isPersonal} onCheckedChange={(checked) => setFormData({...formData, isPersonal: !!checked})} />
                    <label htmlFor="isPersonal" className="text-sm font-bold cursor-pointer flex items-center gap-2">
                      {formData.isPersonal ? <Lock className="w-4 h-4 text-amber-500" /> : <Users className="w-4 h-4 text-primary" />}
                      {formData.isPersonal ? "Personal" : "Shared with Family"}
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 ml-1">Location</label>
                <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Town Square, Main Field" className="rounded-2xl h-14 bg-slate-50 border-2 border-slate-100 font-bold" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 ml-1">Notes</label>
                <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Any extra details?" className="rounded-2xl h-14 bg-slate-50 border-2 border-slate-100 font-bold" />
              </div>

              <Button type="submit" disabled={createEvent.isPending} className="w-full rounded-2xl h-16 text-xl font-black shadow-xl shadow-primary/20 mt-4 transition-all hover:scale-[1.01]">
                {createEvent.isPending ? "Creating..." : "Confirm Event"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[2.5rem] border-white/80 shadow-2xl bg-white/90 backdrop-blur-xl overflow-hidden p-6">
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-2xl font-display font-black text-slate-900">{format(currentDate, 'MMMM yyyy')}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="rounded-xl border-2"><ChevronLeft className="w-5 h-5" /></Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="rounded-xl border-2"><ChevronRight className="w-5 h-5" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 pb-4">{d}</div>
            ))}
            {calendarDays.map((day, i) => {
              const dayEvents = (events || []).filter(e => isSameDay(new Date(e.date), day));
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, monthStart);

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative h-24 rounded-2xl border-2 transition-all p-2 flex flex-col items-start group
                    ${isSelected ? 'border-primary bg-primary/5 shadow-inner' : 'border-slate-50 hover:border-primary/20 bg-white/50'}
                    ${!isCurrentMonth && 'opacity-30'}
                  `}
                >
                  <span className={`text-sm font-black ${isToday ? 'bg-primary text-white w-7 h-7 flex items-center justify-center rounded-full -mt-1 -ml-1' : 'text-slate-900'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="mt-auto flex flex-wrap gap-1">
                    {dayEvents.slice(0, 3).map(e => (
                      <div key={e.id} className={`w-1.5 h-1.5 rounded-full ${e.isPersonal ? 'bg-amber-400' : 'bg-primary'}`} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-display font-black text-slate-900">{format(selectedDate, 'MMM d, yyyy')}</h3>
          </div>
          <div className="space-y-4">
            {dayEvents.length === 0 ? (
              <Card className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/40 p-10 text-center">
                <p className="text-slate-400 font-bold italic">No events scheduled.</p>
              </Card>
            ) : (
              dayEvents.map(event => (
                <Card key={event.id} className="rounded-3xl border-white/80 shadow-lg bg-white/95 p-5 transition-all hover:scale-[1.02]">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2.5 rounded-2xl ${event.isPersonal ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                      {event.isPersonal ? <Lock className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{format(new Date(event.date), 'h:mm a')}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{event.recurrence}</p>
                    </div>
                  </div>
                  <h4 className="font-black text-xl text-slate-900 mb-2">{event.title}</h4>
                  <div className="space-y-2">
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                        <MapPin className="w-4 h-4" /> {event.location}
                      </div>
                    )}
                    {event.notes && (
                      <div className="flex items-start gap-2 text-sm text-slate-500 font-medium bg-slate-50 p-3 rounded-2xl border-2 border-white">
                        <Info className="w-4 h-4 mt-0.5 text-primary" /> {event.notes}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
