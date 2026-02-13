import { Drawer } from "vaul";
import { AlertCircle, Home, Lock, Users, X } from "lucide-react";

interface RecentHelpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RecentHelpSheet({ open, onOpenChange }: RecentHelpSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50" />
        <Drawer.Content className="max-h-[94dvh] rounded-t-3xl outline-none bg-background fixed inset-x-0 bottom-0 z-50 flex flex-col">
          <div className="mx-auto w-10 h-1 flex-shrink-0 rounded-full bg-muted-foreground/20 mt-3 mb-3" />
          <div className="px-6 pb-10 overflow-y-auto flex-1 min-h-0">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-serif text-2xl font-bold">Quick Guide</h2>
              <button
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground/70 p-1.5 rounded-xl"
                data-testid="button-close-recent-help"
                aria-label="Close guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 mb-4">
              <p className="text-sm leading-relaxed text-foreground/90">
                Tiny README for friends: what each tab does, what <strong>Following</strong> means, and how to hide recipes.
              </p>
            </div>

            <div className="space-y-3">
              <section className="rounded-2xl bg-card p-4">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-primary" />Tabs</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li><strong>Discover:</strong> browse and find ideas.</li>
                  <li><strong>Recipes:</strong> your full collection.</li>
                  <li><strong>Recent:</strong> newest recipes added lately.</li>
                </ul>
              </section>

              <section className="rounded-2xl bg-card p-4">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Following</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Follow friends to see their public recipes in feeds and filters.
                </p>
              </section>

              <section className="rounded-2xl bg-card p-4">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />Lock + Try tag</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Use the <strong>lock</strong> if you want to hide a recipe. The <strong>Try</strong> tag is great for ideas you want to test later —
                  you can keep them visible or hide them with the lock.
                </p>
              </section>

              <section className="rounded-2xl bg-card p-4">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Home className="w-4 h-4 text-primary" />Add to Home Screen</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Open your browser menu, tap <strong>Share</strong>, then tap <strong>Add to Home Screen</strong>.
                </p>
              </section>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">Viel spass mit der app, euer arthur</p>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}