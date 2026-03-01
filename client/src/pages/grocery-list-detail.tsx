import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGroceryLists, useGroceryItems, useCreateGroceryItem, useToggleGroceryItem } from "@/hooks/use-groceries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, CheckCircle2, Circle } from "lucide-react";

export default function GroceryListDetail() {
  const [, params] = useRoute("/groceries/:listId");
  const listId = params?.listId;
  
  const { data: lists } = useGroceryLists();
  const { data: items, isLoading } = useGroceryItems(listId || "");
  const createItem = useCreateGroceryItem();
  const toggleItem = useToggleGroceryItem();
  
  const [newItemName, setNewItemName] = useState("");

  const list = lists?.find(l => l.id === Number(listId));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !listId) return;
    createItem.mutate(
      { listId, name: newItemName, category: "Uncategorized" },
      { onSuccess: () => setNewItemName("") }
    );
  };

  if (!listId) return <div>Invalid list</div>;

  const pendingItems = items?.filter(i => !i.isChecked) || [];
  const completedItems = items?.filter(i => i.isChecked) || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/groceries" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4 inline-flex w-fit transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Lists
        </Link>
        <h1 className="text-3xl font-display font-bold">{list?.name || "Grocery List"}</h1>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <div className="p-2 bg-muted/30 border-b border-border/50">
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input 
              value={newItemName} 
              onChange={e => setNewItemName(e.target.value)} 
              placeholder="Add an item... (e.g. Milk)" 
              className="rounded-xl border-transparent focus-visible:ring-primary/20 bg-background"
              autoFocus
            />
            <Button type="submit" size="icon" disabled={!newItemName.trim() || createItem.isPending} className="rounded-xl shrink-0">
              <Plus className="w-5 h-5" />
            </Button>
          </form>
        </div>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading items...</div>
          ) : items?.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <ShoppingCart className="w-6 h-6" />
              </div>
              List is empty. Add some items above!
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {pendingItems.map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleItem.mutate({ id: item.id, isChecked: true, listId })}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Circle className="w-6 h-6" />
                    </button>
                    <span className="font-medium text-base">{item.name}</span>
                  </div>
                </div>
              ))}
              
              {completedItems.length > 0 && (
                <div className="bg-muted/10">
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">
                    Checked Off
                  </div>
                  {completedItems.map(item => (
                    <div key={item.id} className="p-4 flex items-center justify-between opacity-60">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => toggleItem.mutate({ id: item.id, isChecked: false, listId })}
                          className="text-primary"
                        >
                          <CheckCircle2 className="w-6 h-6" />
                        </button>
                        <span className="font-medium text-base line-through">{item.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Just importing ShoppingCart here for the empty state icon
import { ShoppingCart } from "lucide-react";
