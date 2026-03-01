import { useFamily, useUpdateFamily } from "@/hooks/use-family";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Paintbrush, Palette, Check, RefreshCcw, Type } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FONTS = [
  { name: "Bricolage Grotesque", value: "'Bricolage Grotesque', sans-serif" },
  { name: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', sans-serif" },
  { name: "Inter", value: "'Inter', sans-serif" },
  { name: "Poppins", value: "'Poppins', sans-serif" },
  { name: "Outfit", value: "'Outfit', sans-serif" },
  { name: "Montserrat", value: "'Montserrat', sans-serif" },
];

const DEFAULT_THEME = {
  home: "#f0f4f8",
  schedule: "#f3f0f8",
  money: "#f8f0f0",
  groceries: "#f5f3ee",
  chat: "#eef5f2",
  diary: "#f7f3ee",
  goals: "#eef4f0",
  wishlists: "#f6f0f4",
  leaveTime: "#f0f5f2"
};

const THEME_PRESETS = [
  {
    name: "Soft Cloud",
    description: "Whisper-light tints",
    colors: DEFAULT_THEME
  },
  {
    name: "Warm Sand",
    description: "Cozy earth tones",
    colors: {
      home: "#f5f0e8",
      schedule: "#f0ebe3",
      money: "#f3ece4",
      groceries: "#efe8de",
      chat: "#eee9e0",
      diary: "#f2ebe1",
      goals: "#edeae2",
      wishlists: "#f4ede5",
      leaveTime: "#f0ebe3"
    }
  },
  {
    name: "Ocean Mist",
    description: "Cool, calm waters",
    colors: {
      home: "#edf2f7",
      schedule: "#e8eef6",
      money: "#eef0f5",
      groceries: "#e9eff5",
      chat: "#e6eef4",
      diary: "#eef1f6",
      goals: "#e8eff3",
      wishlists: "#edf0f6",
      leaveTime: "#e9f0f4"
    }
  },
  {
    name: "Lavender Dusk",
    description: "Soft twilight hues",
    colors: {
      home: "#f2eff8",
      schedule: "#eeeaf6",
      money: "#f4eef3",
      groceries: "#f0ecf2",
      chat: "#ede9f3",
      diary: "#f3eff5",
      goals: "#eeeaf2",
      wishlists: "#f5eff6",
      leaveTime: "#efedf4"
    }
  },
  {
    name: "Forest Morning",
    description: "Fresh, natural greens",
    colors: {
      home: "#eef4f0",
      schedule: "#ecf2ee",
      money: "#f2f0ec",
      groceries: "#eaf2ec",
      chat: "#e8f0eb",
      diary: "#f0eee8",
      goals: "#e9f1eb",
      wishlists: "#f0ede9",
      leaveTime: "#eaf2ed"
    }
  },
  {
    name: "Monochrome",
    description: "Clean and minimal",
    colors: {
      home: "#f8f9fa",
      schedule: "#f3f4f6",
      money: "#f1f2f4",
      groceries: "#eef0f2",
      chat: "#f0f1f3",
      diary: "#f2f3f5",
      goals: "#eff0f2",
      wishlists: "#f1f2f4",
      leaveTime: "#f3f4f6"
    }
  },
  {
    name: "Deep Night",
    description: "Dark and refined",
    colors: {
      home: "#1a1d23",
      schedule: "#1e2128",
      money: "#21242b",
      groceries: "#1d2027",
      chat: "#1b1f25",
      diary: "#201f24",
      goals: "#1c2122",
      wishlists: "#211e24",
      leaveTime: "#1b2120"
    }
  }
];

export default function Settings() {
  const { data: family } = useFamily();
  const updateFamily = useUpdateFamily();
  const { toast } = useToast();
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [fontFamily, setFontFamily] = useState("'Bricolage Grotesque', sans-serif");

  useEffect(() => {
    if (family?.themeConfig) {
      setTheme(family.themeConfig as typeof DEFAULT_THEME);
    }
    if (family?.fontFamily) {
      setFontFamily(family.fontFamily);
    }
  }, [family]);

  const handleSave = () => {
    updateFamily.mutate({ themeConfig: theme, fontFamily }, {
      onSuccess: () => {
        toast({
          title: "Settings saved!",
          description: "Your family space has been updated.",
        });
      }
    });
  };

  const handleReset = () => {
    setTheme(DEFAULT_THEME);
    setFontFamily("'Bricolage Grotesque', sans-serif");
  };

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-4xl font-display font-black tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-2 text-lg font-bold">Personalize your family's digital home.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-[2.5rem] border-white/80 shadow-xl bg-white/90 backdrop-blur-xl overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-2xl">
                  <Palette className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black">Custom Colors</CardTitle>
                  <CardDescription className="font-bold">Fine-tune the background for each module.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 mb-8 pb-8 border-b border-slate-100">
                <label className="text-sm font-black text-slate-700 ml-1 flex items-center gap-2">
                  <Type className="w-4 h-4 text-primary" /> Typography Style
                </label>
                <Select value={fontFamily} onValueChange={setFontFamily}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold">
                    <SelectValue placeholder="Select a font" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {FONTS.map((font) => (
                      <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                        {font.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(theme).map(([key, value]) => (
                  <div key={key} className="space-y-3">
                    <label className="text-sm font-black text-slate-700 capitalize flex items-center justify-between">
                      {key} Background
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 uppercase">{value}</span>
                    </label>
                    <div className="flex gap-3">
                      <div 
                        className="w-14 h-14 rounded-2xl border-4 border-white shadow-sm shrink-0" 
                        style={{ backgroundColor: value }}
                      />
                      <Input 
                        type="color" 
                        value={value} 
                        onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                        className="h-14 rounded-2xl cursor-pointer border-2 border-slate-100 p-1 bg-slate-50"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 flex gap-3">
                <Button 
                  onClick={handleSave} 
                  disabled={updateFamily.isPending}
                  className="flex-1 rounded-2xl h-14 font-black text-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                >
                  <Check className="w-5 h-5 mr-2" /> Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="rounded-2xl h-14 font-black border-2 border-slate-100 hover:bg-slate-50"
                >
                  <RefreshCcw className="w-5 h-5 mr-2" /> Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-white/80 shadow-xl bg-white/90 backdrop-blur-xl overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-3 rounded-2xl">
                  <Paintbrush className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black">Theme Presets</CardTitle>
                  <CardDescription className="font-bold">Quickly switch between curated styles.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {THEME_PRESETS.map((preset) => {
                  const isActive = JSON.stringify(theme) === JSON.stringify(preset.colors);
                  return (
                    <button
                      key={preset.name}
                      onClick={() => setTheme(preset.colors)}
                      data-testid={`button-theme-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className={`p-4 rounded-[2rem] border-2 transition-all group text-left ${isActive ? 'border-primary/50 bg-primary/5 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    >
                      <div className="flex gap-1 mb-3">
                        {Object.values(preset.colors).slice(0, 6).map((c, i) => (
                          <div key={i} className="w-5 h-5 rounded-lg border-2 border-white shadow-sm" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <p className={`font-black text-sm ${isActive ? 'text-primary' : 'text-slate-900 group-hover:text-primary'} transition-colors`}>{preset.name}</p>
                      {'description' in preset && (
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5">{preset.description}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-white/80 shadow-xl bg-white/90 backdrop-blur-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-black">Preview</CardTitle>
              <CardDescription className="font-bold">How it looks right now.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-[4/3] rounded-[2rem] border-4 border-white shadow-inner overflow-hidden flex items-center justify-center p-4 relative" style={{ backgroundColor: theme.home }}>
                <div className="bg-white/90 backdrop-blur-md p-6 rounded-[2rem] shadow-xl w-full text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Palette className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-black text-slate-900">Live Preview</h4>
                  <p className="text-xs font-bold text-slate-500 mt-1">Dashboard Background</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
