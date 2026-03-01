import { useState, useRef, useCallback } from "react";
import {
  useDiaryEntries,
  useCreateDiaryEntry,
  useUpdateDiaryEntry,
  useDeleteDiaryEntry,
  useMoodStats,
  useDiarySettings,
  useUpdateDiarySettings,
  useVerifyDiaryPin,
  useDeletedDiaryEntries,
  useRestoreDiaryEntry,
} from "@/hooks/use-diary";
import { useUploadMedia } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Plus,
  Lock,
  Unlock,
  ChevronLeft,
  Trash2,
  Edit3,
  Tag,
  Image,
  X,
  BarChart3,
  Settings,
  RotateCcw,
  Search,
  Eye,
  EyeOff,
  KeyRound,
  Smile,
} from "lucide-react";

const MOODS = [
  { label: "Calm", emoji: "😌", color: "bg-blue-100 text-blue-700" },
  { label: "Stressed", emoji: "😰", color: "bg-red-100 text-red-700" },
  { label: "Excited", emoji: "🤩", color: "bg-yellow-100 text-yellow-700" },
  { label: "Overwhelmed", emoji: "😵", color: "bg-purple-100 text-purple-700" },
  { label: "Motivated", emoji: "💪", color: "bg-green-100 text-green-700" },
  { label: "Sad", emoji: "😢", color: "bg-indigo-100 text-indigo-700" },
  { label: "Grateful", emoji: "🙏", color: "bg-amber-100 text-amber-700" },
  { label: "Anxious", emoji: "😟", color: "bg-orange-100 text-orange-700" },
  { label: "Happy", emoji: "😊", color: "bg-emerald-100 text-emerald-700" },
  { label: "Angry", emoji: "😤", color: "bg-rose-100 text-rose-700" },
];

const TAG_PRESETS = ["School", "Relationship", "Family", "Work", "Goals", "Health", "Personal", "Travel", "Hobbies"];

type View = "list" | "write" | "read" | "mood" | "settings" | "trash";

export default function Diary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: entries, isLoading } = useDiaryEntries();
  const { data: moodData } = useMoodStats();
  const { data: diarySettings } = useDiarySettings();
  const { data: deletedEntries } = useDeletedDiaryEntries();
  const createEntry = useCreateDiaryEntry();
  const updateEntry = useUpdateDiaryEntry();
  const deleteEntry = useDeleteDiaryEntry();
  const updateSettings = useUpdateDiarySettings();
  const verifyPin = useVerifyDiaryPin();
  const restoreEntry = useRestoreDiaryEntry();
  const uploadMedia = useUploadMedia();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<View>("list");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [settingsPin, setSettingsPin] = useState("");
  const [settingsLocked, setSettingsLocked] = useState(true);
  const [settingsReflection, setSettingsReflection] = useState(false);

  const hasPin = diarySettings?.diaryPin;
  const needsUnlock = hasPin && diarySettings?.isLocked && !isUnlocked;

  const handleUnlock = async () => {
    if (!pinInput.trim()) return;
    const result = await verifyPin.mutateAsync(pinInput);
    if (result.valid) {
      setIsUnlocked(true);
      setPinInput("");
    } else {
      toast({ title: "Incorrect PIN", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setTitle("");
    setBody("");
    setMood(null);
    setTags([]);
    setCustomTag("");
    setPhotos([]);
    setIsPrivate(true);
    setEditingId(null);
  };

  const handleWrite = () => {
    resetForm();
    setView("write");
  };

  const handleEdit = (entry: any) => {
    setTitle(entry.title || "");
    setBody(entry.body || "");
    setMood(entry.mood || null);
    setTags(entry.tags || []);
    setPhotos(entry.photoUrls || []);
    setIsPrivate(entry.isPrivate);
    setEditingId(entry.id);
    setView("write");
  };

  const handleSave = () => {
    if (!body.trim()) {
      toast({ title: "Write something first", description: "Your entry needs some content.", variant: "destructive" });
      return;
    }
    const data = {
      title: title.trim() || undefined,
      body: body.trim(),
      mood: mood || undefined,
      tags: tags.length > 0 ? tags : undefined,
      photoUrls: photos.length > 0 ? photos : undefined,
      isPrivate,
    };

    if (editingId) {
      updateEntry.mutate({ id: editingId, ...data }, {
        onSuccess: () => {
          toast({ title: "Entry updated" });
          resetForm();
          setView("list");
        }
      });
    } else {
      createEntry.mutate(data, {
        onSuccess: () => {
          toast({ title: "Entry saved" });
          resetForm();
          setView("list");
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteEntry.mutate(id, {
      onSuccess: () => {
        toast({ title: "Entry moved to trash", description: "You can restore it within 30 days." });
        setView("list");
        setSelectedEntry(null);
      }
    });
  };

  const handleRestore = (id: number) => {
    restoreEntry.mutate(id, {
      onSuccess: () => {
        toast({ title: "Entry restored" });
      }
    });
  };

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadMedia.mutateAsync(file);
      setPhotos(prev => [...prev, result.url]);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [uploadMedia, toast]);

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags(prev => [...prev, tag.trim()]);
    }
    setCustomTag("");
  };

  const handleSaveSettings = () => {
    const data: any = {};
    if (settingsPin.trim()) data.diaryPin = settingsPin;
    data.isLocked = settingsLocked;
    data.weeklyReflectionEnabled = settingsReflection;
    updateSettings.mutate(data, {
      onSuccess: () => {
        toast({ title: "Diary settings saved" });
        setSettingsPin("");
      }
    });
  };

  const openEntry = (entry: any) => {
    setSelectedEntry(entry);
    setView("read");
  };

  const filteredEntries = (entries || []).filter((entry: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = entry.title?.toLowerCase().includes(q);
      const matchBody = entry.body?.toLowerCase().includes(q);
      const matchTags = entry.tags?.some((t: string) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchBody && !matchTags) return false;
    }
    if (filterTag && (!entry.tags || !entry.tags.includes(filterTag))) return false;
    return true;
  });

  const moodDistribution = (() => {
    if (!moodData || moodData.length === 0) return [];
    const counts: Record<string, number> = {};
    moodData.forEach((d: any) => { if (d.mood) counts[d.mood] = (counts[d.mood] || 0) + 1; });
    const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0);
    return Object.entries(counts)
      .map(([mood, count]) => ({ mood, count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
  })();

  const allTags = (() => {
    if (!entries) return [];
    const tagSet = new Set<string>();
    entries.forEach((e: any) => e.tags?.forEach((t: string) => tagSet.add(t)));
    return Array.from(tagSet);
  })();

  if (needsUnlock) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-sm mx-auto text-center px-4">
        <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-primary opacity-60" />
        </div>
        <h1 className="text-3xl font-display font-bold mb-2">Diary Locked</h1>
        <p className="text-muted-foreground mb-8">Enter your PIN to access your diary.</p>
        <div className="w-full space-y-4">
          <Input
            type="password"
            value={pinInput}
            onChange={e => setPinInput(e.target.value)}
            placeholder="Enter PIN"
            className="rounded-xl h-14 text-center text-2xl tracking-[0.5em] bg-muted/50 border-transparent"
            maxLength={6}
            onKeyDown={e => e.key === "Enter" && handleUnlock()}
            data-testid="input-diary-pin"
            autoFocus
          />
          <Button
            onClick={handleUnlock}
            disabled={verifyPin.isPending}
            className="w-full rounded-2xl h-14 text-lg font-bold shadow-xl shadow-primary/10"
            data-testid="button-unlock-diary"
          >
            {verifyPin.isPending ? "Verifying..." : "Unlock Diary"}
          </Button>
        </div>
      </div>
    );
  }

  if (view === "write") {
    return (
      <div className="max-w-2xl mx-auto pb-10 px-2">
        <Button
          variant="ghost"
          onClick={() => { resetForm(); setView("list"); }}
          className="mb-4 gap-2 text-muted-foreground"
          data-testid="button-back-diary"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Diary
        </Button>

        <div className="space-y-6">
          <div>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="text-2xl font-display font-bold border-none bg-transparent focus-visible:ring-0 px-0 h-auto placeholder:text-muted-foreground/30"
              data-testid="input-diary-title"
            />
          </div>

          <Textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[200px] text-base border-none bg-transparent focus-visible:ring-0 px-0 resize-none placeholder:text-muted-foreground/30 leading-relaxed"
            data-testid="input-diary-body"
            autoFocus={!editingId}
          />

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Smile className="w-4 h-4" /> How are you feeling?
              </p>
              <div className="flex flex-wrap gap-2">
                {MOODS.map(m => (
                  <button
                    key={m.label}
                    onClick={() => setMood(mood === m.label ? null : m.label)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                      mood === m.label ? m.color + " ring-2 ring-offset-1 ring-current scale-105" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                    data-testid={`button-mood-${m.label.toLowerCase()}`}
                  >
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Tags
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {TAG_PRESETS.map(t => (
                  <button
                    key={t}
                    onClick={() => tags.includes(t) ? setTags(tags.filter(x => x !== t)) : addTag(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      tags.includes(t) ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                    data-testid={`button-tag-${t.toLowerCase()}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={customTag}
                  onChange={e => setCustomTag(e.target.value)}
                  placeholder="Custom tag..."
                  className="rounded-xl h-9 bg-muted/30 border-transparent text-sm flex-1"
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag(customTag))}
                  data-testid="input-custom-tag"
                />
                <Button size="sm" variant="outline" onClick={() => addTag(customTag)} className="rounded-xl" data-testid="button-add-tag">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map(t => (
                    <Badge key={t} variant="secondary" className="rounded-lg gap-1 pr-1">
                      {t}
                      <button onClick={() => setTags(tags.filter(x => x !== t))} className="ml-0.5 hover:text-destructive" data-testid={`button-remove-tag-${t.toLowerCase()}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Image className="w-4 h-4" /> Photos
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <div className="flex flex-wrap gap-3">
                {photos.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="w-20 h-20 rounded-xl object-cover" />
                    <button
                      onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`button-remove-photo-${i}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  data-testid="button-add-photo"
                  disabled={uploadMedia.isPending}
                >
                  {uploadMedia.isPending ? "..." : <Plus className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl">
              <div className="flex items-center gap-2">
                {isPrivate ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-semibold">{isPrivate ? "Private Entry" : "Entry Visible"}</p>
                  <p className="text-xs text-muted-foreground">{isPrivate ? "This entry is currently private" : "You are sharing this entry"}</p>
                </div>
              </div>
              <Switch checked={!isPrivate} onCheckedChange={v => setIsPrivate(!v)} data-testid="switch-diary-privacy" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={createEntry.isPending || updateEntry.isPending}
              className="flex-1 rounded-2xl h-14 text-lg font-bold shadow-xl shadow-primary/10"
              data-testid="button-save-entry"
            >
              {createEntry.isPending || updateEntry.isPending ? "Saving..." : editingId ? "Update Entry" : "Save Entry"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "read" && selectedEntry) {
    const moodObj = MOODS.find(m => m.label === selectedEntry.mood);
    return (
      <div className="max-w-2xl mx-auto pb-10 px-2">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => { setSelectedEntry(null); setView("list"); }}
            className="gap-2 text-muted-foreground"
            data-testid="button-back-from-entry"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleEdit(selectedEntry)} className="rounded-xl text-muted-foreground" data-testid="button-edit-entry">
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(selectedEntry.id)} className="rounded-xl text-muted-foreground hover:text-destructive" data-testid="button-delete-entry">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
              <span>{format(new Date(selectedEntry.createdAt), "EEEE, MMMM d, yyyy")}</span>
              <span>·</span>
              <span>{format(new Date(selectedEntry.createdAt), "h:mm a")}</span>
              {selectedEntry.isPrivate && (
                <Badge variant="outline" className="rounded-lg text-[10px] gap-1">
                  <Lock className="w-2.5 h-2.5" /> Private
                </Badge>
              )}
            </div>
            {selectedEntry.title && (
              <h1 className="text-3xl font-display font-bold mb-4" data-testid="text-entry-title">{selectedEntry.title}</h1>
            )}
          </div>

          {moodObj && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${moodObj.color}`}>
              <span className="text-lg">{moodObj.emoji}</span> {moodObj.label}
            </div>
          )}

          <div className="text-base leading-relaxed whitespace-pre-wrap" data-testid="text-entry-body">
            {selectedEntry.body}
          </div>

          {selectedEntry.photoUrls?.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {selectedEntry.photoUrls.map((url: string, i: number) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="max-w-[200px] max-h-[200px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(url, '_blank')}
                />
              ))}
            </div>
          )}

          {selectedEntry.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedEntry.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="rounded-lg">{tag}</Badge>
              ))}
            </div>
          )}

          {selectedEntry.updatedAt && selectedEntry.updatedAt !== selectedEntry.createdAt && (
            <p className="text-xs text-muted-foreground">
              Last edited {formatDistanceToNow(new Date(selectedEntry.updatedAt), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (view === "mood") {
    return (
      <div className="max-w-2xl mx-auto pb-10 px-2">
        <Button variant="ghost" onClick={() => setView("list")} className="mb-4 gap-2 text-muted-foreground" data-testid="button-back-mood">
          <ChevronLeft className="w-4 h-4" /> Back to Diary
        </Button>

        <h2 className="text-3xl font-display font-bold mb-2">Mood Insights</h2>
        <p className="text-muted-foreground mb-8">Your emotional patterns over time.</p>

        {moodDistribution.length === 0 ? (
          <Card className="rounded-[2rem] border-border/50 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center min-h-[200px] text-center p-10">
              <Smile className="w-10 h-10 text-muted-foreground opacity-40 mb-4" />
              <p className="text-muted-foreground">No mood data yet. Start writing entries with moods to see your patterns.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="rounded-[2rem] border-border/50 shadow-sm">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="font-display text-xl">Mood Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2 space-y-3">
                {moodDistribution.map(({ mood, count, pct }) => {
                  const moodObj = MOODS.find(m => m.label === mood);
                  return (
                    <div key={mood} className="flex items-center gap-3" data-testid={`mood-stat-${mood.toLowerCase()}`}>
                      <span className="text-lg w-8">{moodObj?.emoji || "•"}</span>
                      <span className="text-sm font-medium w-24">{mood}</span>
                      <div className="flex-1 h-3 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-border/50 shadow-sm">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="font-display text-xl">Recent Moods Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="flex flex-wrap gap-2">
                  {(moodData || []).slice(-30).map((d: any, i: number) => {
                    const moodObj = MOODS.find(m => m.label === d.mood);
                    return d.mood ? (
                      <div
                        key={i}
                        className="flex flex-col items-center gap-0.5"
                        title={`${d.mood} - ${format(new Date(d.createdAt), "MMM d")}`}
                      >
                        <span className="text-lg">{moodObj?.emoji || "•"}</span>
                        <span className="text-[8px] text-muted-foreground">{format(new Date(d.createdAt), "M/d")}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="text-center text-sm text-muted-foreground">
              Total entries with mood: {moodData?.filter((d: any) => d.mood).length || 0}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === "settings") {
    return (
      <div className="max-w-2xl mx-auto pb-10 px-2">
        <Button variant="ghost" onClick={() => setView("list")} className="mb-4 gap-2 text-muted-foreground" data-testid="button-back-settings">
          <ChevronLeft className="w-4 h-4" /> Back to Diary
        </Button>

        <h2 className="text-3xl font-display font-bold mb-2">Diary Settings</h2>
        <p className="text-muted-foreground mb-8">Manage your diary's security and preferences.</p>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border-border/50 shadow-sm">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="font-display text-xl flex items-center gap-2">
                <KeyRound className="w-5 h-5" /> Diary Lock
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Enable PIN Lock</p>
                  <p className="text-xs text-muted-foreground">Require a PIN to access your diary</p>
                </div>
                <Switch
                  checked={settingsLocked}
                  onCheckedChange={setSettingsLocked}
                  data-testid="switch-diary-lock"
                />
              </div>
              {settingsLocked && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold">{hasPin ? "Change PIN" : "Set PIN"}</label>
                  <Input
                    type="password"
                    value={settingsPin}
                    onChange={e => setSettingsPin(e.target.value)}
                    placeholder={hasPin ? "Enter new PIN..." : "Create a 4-6 digit PIN"}
                    className="rounded-xl h-12 bg-muted/50 border-transparent text-center tracking-[0.3em]"
                    maxLength={6}
                    data-testid="input-set-pin"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/50 shadow-sm">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="font-display text-xl">Weekly Reflection</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Gentle weekly prompt</p>
                  <p className="text-xs text-muted-foreground">"Would you like to reflect on this week?"</p>
                </div>
                <Switch
                  checked={settingsReflection}
                  onCheckedChange={setSettingsReflection}
                  data-testid="switch-weekly-reflection"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSaveSettings}
            disabled={updateSettings.isPending}
            className="w-full rounded-2xl h-14 text-lg font-bold shadow-xl shadow-primary/10"
            data-testid="button-save-settings"
          >
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    );
  }

  if (view === "trash") {
    return (
      <div className="max-w-2xl mx-auto pb-10 px-2">
        <Button variant="ghost" onClick={() => setView("list")} className="mb-4 gap-2 text-muted-foreground" data-testid="button-back-trash">
          <ChevronLeft className="w-4 h-4" /> Back to Diary
        </Button>

        <h2 className="text-3xl font-display font-bold mb-2">Recently Deleted</h2>
        <p className="text-muted-foreground mb-8">Entries are permanently removed after 30 days.</p>

        {!deletedEntries?.length ? (
          <Card className="rounded-[2rem] border-border/50 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center min-h-[200px] text-center p-10">
              <Trash2 className="w-10 h-10 text-muted-foreground opacity-40 mb-4" />
              <p className="text-muted-foreground">No deleted entries.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {deletedEntries.map((entry: any) => (
              <Card key={entry.id} className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{entry.title || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground">
                      Deleted {entry.deletedAt ? formatDistanceToNow(new Date(entry.deletedAt), { addSuffix: true }) : "recently"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(entry.id)}
                    className="rounded-xl gap-1"
                    data-testid={`button-restore-${entry.id}`}
                  >
                    <RotateCcw className="w-3 h-3" /> Restore
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10 px-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight">Diary</h1>
          <p className="text-muted-foreground mt-2 text-lg">Your private reflection space.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setView("mood")} className="rounded-xl" data-testid="button-mood-insights">
            <BarChart3 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => { setSettingsLocked(diarySettings?.isLocked ?? true); setSettingsReflection(diarySettings?.weeklyReflectionEnabled ?? false); setView("settings"); }} className="rounded-xl" data-testid="button-diary-settings">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setView("trash")} className="rounded-xl" data-testid="button-diary-trash">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button onClick={handleWrite} className="rounded-2xl h-12 px-6 shadow-lg shadow-primary/20 hover-elevate gap-2 text-base" data-testid="button-new-entry">
            <Plus className="w-5 h-5" /> New Entry
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="pl-10 rounded-xl h-11 bg-muted/30 border-transparent"
            data-testid="input-search-diary"
          />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterTag(null)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${!filterTag ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
            data-testid="button-filter-all"
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filterTag === tag ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
              data-testid={`button-filter-tag-${tag.toLowerCase()}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-muted/30 rounded-2xl animate-pulse" />)}
        </div>
      ) : filteredEntries.length === 0 ? (
        <Card className="rounded-[2.5rem] border-dashed border-2 border-border/50 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center p-10">
            <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-primary opacity-40" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">
              {searchQuery || filterTag ? "No matching entries" : "Your diary awaits"}
            </h2>
            <p className="text-muted-foreground max-w-sm mb-8">
              {searchQuery || filterTag 
                ? "Try adjusting your search or filter." 
                : "Begin writing your first entry. This is your private space for reflection."}
            </p>
            {!searchQuery && !filterTag && (
              <Button onClick={handleWrite} className="rounded-2xl h-12 px-8" data-testid="button-start-writing">
                Start Writing
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry: any) => {
            const moodObj = MOODS.find(m => m.label === entry.mood);
            return (
              <Card
                key={entry.id}
                className="rounded-2xl border-border/50 hover-elevate cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
                onClick={() => openEntry(entry)}
                data-testid={`card-entry-${entry.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {moodObj && (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg ${moodObj.color}`}>
                        {moodObj.emoji}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-base truncate">{entry.title || "Untitled"}</h3>
                        {entry.isPrivate && <Lock className="w-3 h-3 text-muted-foreground shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{entry.body}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.createdAt), "MMM d, yyyy")}
                        </span>
                        {entry.tags?.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="rounded-md text-[10px] py-0">
                            {tag}
                          </Badge>
                        ))}
                        {entry.photoUrls?.length > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Image className="w-3 h-3" /> {entry.photoUrls.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
