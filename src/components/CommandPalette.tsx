import { useState, useEffect } from "react";
import { Search, Zap, Video, Share, Workflow, Wrench, Users, Command } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const commands = [
  { icon: Share, label: "Create API Integration", category: "API Hub", shortcut: "⌘ A" },
  { icon: Video, label: "Generate Tutorial from URL", category: "Tutorial Builder", shortcut: "⌘ T" },
  { icon: Video, label: "New Video Project", category: "Video Creator", shortcut: "⌘ V" },
  { icon: Zap, label: "Create Workflow", category: "Workflow Engine", shortcut: "⌘ W" },
  { icon: Wrench, label: "Build New App", category: "App Builder", shortcut: "⌘ B" },
  { icon: Users, label: "Add Contact", category: "CRM Suite", shortcut: "⌘ C" },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenChange]);

  const filteredCommands = commands.filter(
    (command) =>
      command.label.toLowerCase().includes(search.toLowerCase()) ||
      command.category.toLowerCase().includes(search.toLowerCase())
  );

  const run = (label: string) => {
    toast(label, { description: "Action will be wired to modules shortly" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="command-palette max-w-2xl p-0 gap-0">
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="mr-3 h-5 w-5 text-muted-foreground" />
          <input
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            placeholder="Search commands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        </div>
        
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No commands found.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((command, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 cursor-pointer group transition-all duration-200 hover-lift"
                  onClick={() => run(command.label)}
                >
                  <command.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{command.label}</div>
                    <div className="text-xs text-muted-foreground">{command.category}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{command.shortcut}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}