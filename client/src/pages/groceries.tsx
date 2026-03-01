import { useState } from "react";
import { useGroceryLists, useCreateGroceryList } from "@/hooks/use-groceries";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Plus, ChevronRight } from "lucide-react";

export default function Groceries() {
  const { data: lists, isLoading } = useGroceryLists();
  const createList = useCreateGroceryList();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createList.mutate(
      { name },
      { onSuccess: () => { setIsOpen(false); setName(""); } }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Grocery Lists</h1>
          <p className="text-muted-foreground mt-1">Manage shopping needs together.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-md hover-elevate gap-2">
              <Plus className="w-4 h-4" /> New List
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Create a List</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">List Name</label>
                <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Costco Run, Weekly Trader Joe's" className="rounded-xl h-11" autoFocus />
              </div>
              <Button type="submit" disabled={createList.isPending} className="w-full rounded-xl h-11">
                {createList.isPending ? "Creating..." : "Create List"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading lists...</div>
      ) : lists?.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-2 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <ShoppingCart className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No grocery lists yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lists?.map((list) => (
            <Link key={list.id} href={`/groceries/${list.id}`}>
              <Card className="rounded-2xl border-border/50 hover-elevate cursor-pointer group h-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{list.name}</h3>
                      <p className="text-sm text-muted-foreground">Tap to view items</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
