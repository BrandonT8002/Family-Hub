import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGroceryLists, useGroceryItems, useCreateGroceryItem, useToggleGroceryItem } from "@/hooks/use-groceries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, CheckCircle2, Circle, ShoppingCart, Tag, Store, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AISLE_CATEGORIES = [
  "Produce", "Meat", "Seafood", "Dairy", "Frozen", "Bakery", "Deli", 
  "Pantry / Dry Goods", "Beverages", "Snacks", "Household", "Toiletries", 
  "Baby", "Pet", "Pharmacy", "Miscellaneous"
];

export default function GroceryListDetail() {
  const [, params] = useRoute("/groceries/:listId");
  const listId = params?.listId;
  
  const { data: lists } = useGroceryLists();
  const { data: items, isLoading } = useGroceryItems(listId || "");
  const createItem = useCreateGroceryItem();
  const toggleItem = useToggleGroceryItem();
  
  const [newItemName, setNewItemName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Miscellaneous");
  const [price, setPrice] = useState("");

  const list = lists?.find(l => l.id === Number(listId));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !listId) return;
    createItem.mutate(
      { 
        listId, 
        name: newItemName, 
        category: selectedCategory,
        price: price || "0"
      },
      { onSuccess: () => {
        setNewItemName("");
        setPrice("");
        setSelectedCategory("Miscellaneous");
      }}
    );
  };

  if (!listId) return <div className="p-8 text-center">Invalid list</div>;

  const itemsByAisle = (items || []).reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const sortedAisles = Object.keys(itemsByAisle).sort();
  const estimatedTotal = (items || []).reduce((sum, item) => sum + Number(item.price || 0), 0);
  const runningTotal = (items || []).filter(i => i.isChecked).reduce((sum, item) => sum + Number(item.price || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link href="/groceries" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4 inline-flex w-fit transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Lists
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold">{list?.name || "Grocery List"}</h1>
            {list?.type && <Badge variant="secondary" className="rounded-md">{list.type}</Badge>}
          </div>
          {list?.storeName && (
            <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
              <Store className="w-4 h-4" /> {list.storeName}
            </p>
          )}
        </div>
        
        <Card className="bg-primary/5 border-primary/20 rounded-2xl p-4 shadow-sm min-w-[200px]">
          <div className="text-xs font-semibold text-primary/70 uppercase tracking-wider mb-1">Estimated Budget</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold">${runningTotal.toFixed(2)}</span>
            <span className="text-muted-foreground text-sm">of ${estimatedTotal.toFixed(2)}</span>
          </div>
        </Card>
      </div>

      <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden bg-muted/20">
        <div className="p-4 bg-background border-b border-border/50">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <Input 
                  value={newItemName} 
                  onChange={e => setNewItemName(e.target.value)} 
                  placeholder="What do we need? (e.g. Organic Milk)" 
                  className="rounded-xl h-11 bg-muted/30 border-transparent focus-visible:ring-primary/20"
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-transparent">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {AISLE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-32 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input 
                  type="number"
                  step="0.01"
                  value={price} 
                  onChange={e => setPrice(e.target.value)} 
                  placeholder="0.00" 
                  className="pl-7 rounded-xl h-11 bg-muted/30 border-transparent focus-visible:ring-primary/20"
                />
              </div>
              <Button type="submit" disabled={!newItemName.trim() || createItem.isPending} className="rounded-xl h-11 px-6 shadow-md hover-elevate">
                <Plus className="w-5 h-5 mr-2" /> Add Item
              </Button>
            </div>
          </form>
        </div>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Loading items...</div>
          ) : (items || []).length === 0 ? (
            <div className="p-20 text-center text-muted-foreground flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-lg font-medium">Your list is empty</p>
              <p className="text-sm opacity-70 mt-1">Add items above to start organizing by aisle.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {sortedAisles.map(aisle => (
                <div key={aisle} className="bg-background">
                  <div className="px-6 py-3 bg-muted/30 flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-primary/60" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{aisle}</span>
                  </div>
                  <div className="divide-y divide-border/30">
                    {itemsByAisle[aisle].map(item => (
                      <div key={item.id} className={`group flex items-center justify-between p-4 px-6 transition-all ${item.isChecked ? 'bg-muted/10' : 'hover:bg-muted/20'}`}>
                        <div className="flex items-center gap-4 flex-1">
                          <button 
                            onClick={() => toggleItem.mutate({ id: item.id, isChecked: !item.isChecked, listId })}
                            className={`transition-all duration-300 ${item.isChecked ? 'text-primary scale-110' : 'text-muted-foreground hover:text-primary'}`}
                          >
                            {item.isChecked ? <CheckCircle2 className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
                          </button>
                          <div className="flex-1">
                            <span className={`text-base font-medium transition-all ${item.isChecked ? 'line-through text-muted-foreground decoration-2' : ''}`}>
                              {item.name}
                            </span>
                            {item.price && Number(item.price) > 0 && (
                              <p className="text-xs font-bold text-muted-foreground mt-0.5">${Number(item.price).toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                        
                        {item.notes && (
                          <div className="hidden md:flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md max-w-[200px] truncate">
                            <Info className="w-3 h-3 mr-1 shrink-0" /> {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {estimatedTotal > 0 && (
        <div className="text-center text-xs text-muted-foreground mt-4 italic">
          Tip: Add prices to items to track your grocery budget in real-time.
        </div>
      )}
    </div>
  );
}
