import { useState } from "react";
import { useEvents, useCreateEvent } from "@/hooks/use-events";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarPlus, MapPin, Clock } from "lucide-react";

export default function Schedule() {
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", date: "", time: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.time) return;
    
    const dateTime = new Date(`${formData.date}T${formData.time}`).toISOString();
    createEvent.mutate(
      { title: formData.title, description: formData.description, date: dateTime },
      { onSuccess: () => { setIsOpen(false); setFormData({ title: "", description: "", date: "", time: "" }); } }
    );
  };

  // Sort events by date ascending
  const sortedEvents = [...(events || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Schedule</h1>
          <p className="text-muted-foreground mt-1">Upcoming family events and activities.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-md hover-elevate gap-2">
              <CalendarPlus className="w-4 h-4" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">New Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Title</label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Soccer practice" className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <Input type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description / Location</label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Field 4" className="rounded-xl" />
              </div>
              <Button type="submit" disabled={createEvent.isPending} className="w-full rounded-xl h-11 mt-2">
                {createEvent.isPending ? "Adding..." : "Add to Calendar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="h-40 flex items-center justify-center"><p className="text-muted-foreground">Loading schedule...</p></div>
      ) : sortedEvents.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-2 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <CalendarPlus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No upcoming events.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedEvents.map(event => {
            const date = new Date(event.date);
            return (
              <Card key={event.id} className="rounded-2xl border-border/50 hover:shadow-md transition-shadow overflow-hidden">
                <div className="flex h-full">
                  <div className="w-20 bg-primary/5 flex flex-col items-center justify-center py-4 border-r border-border/50">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">{format(date, 'MMM')}</span>
                    <span className="text-2xl font-display font-bold text-foreground">{format(date, 'd')}</span>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col justify-center">
                    <h3 className="font-semibold text-lg leading-tight mb-1">{event.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {format(date, 'h:mm a')}</div>
                      {event.description && <div className="flex items-center gap-1 truncate"><MapPin className="w-3.5 h-3.5" /> <span className="truncate max-w-[120px]">{event.description}</span></div>}
                    </div>
                  </CardContent>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  );
}
