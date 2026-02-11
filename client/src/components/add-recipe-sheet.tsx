import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { X, Link as LinkIcon, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface AddRecipeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddRecipeSheet({ open, onOpenChange }: AddRecipeSheetProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [description, setDescription] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setTitle("");
    setImageUrl("");
    setTags("");
    setIngredients("");
    setSteps("");
    setDescription("");
    setImportUrl("");
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        imageUrl: imageUrl.trim() || null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        ingredients: ingredients
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        steps: steps
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        createdByUserId: null,
      };
      await apiRequest("POST", "/api/recipes", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes/recent"] });
      toast({ title: "Recipe added!" });
      resetForm();
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error adding recipe", description: err.message, variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/import-recipe", { url: importUrl.trim() });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.imageUrl) setImageUrl(data.imageUrl);
      if (data.tags && Array.isArray(data.tags)) setTags(data.tags.join(", "));
      if (data.ingredients && Array.isArray(data.ingredients)) setIngredients(data.ingredients.join("\n"));
      if (data.steps && Array.isArray(data.steps)) setSteps(data.steps.join("\n"));
      toast({ title: "Recipe imported!", description: "Review the fields below and save." });
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    },
  });

  const canSubmit = title.trim().length > 0 && ingredients.trim().length > 0 && steps.trim().length > 0;
  const canImport = importUrl.trim().length > 0 && !importMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col bg-background outline-none sm:inset-4 sm:rounded-2xl sm:m-auto sm:max-w-lg sm:max-h-[92vh]"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          data-testid="modal-add-recipe"
        >
          <VisuallyHidden>
            <DialogPrimitive.Title>Add Recipe</DialogPrimitive.Title>
            <DialogPrimitive.Description>Create a new recipe or import from URL</DialogPrimitive.Description>
          </VisuallyHidden>

          <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-3 flex-shrink-0 border-b border-border/40">
            <h2 className="font-serif text-2xl font-bold" data-testid="text-add-recipe-title">New Recipe</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground/60 p-1.5 rounded-xl"
              data-testid="button-close-add"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              <div className="rounded-2xl bg-card p-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <LinkIcon className="w-3 h-3" />
                  Import from URL
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste a recipe URL..."
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    className="rounded-xl bg-background border-0 flex-1"
                    data-testid="input-import-url"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canImport) {
                        e.preventDefault();
                        importMutation.mutate();
                      }
                    }}
                  />
                  <Button
                    onClick={() => importMutation.mutate()}
                    disabled={!canImport}
                    className="rounded-xl flex-shrink-0"
                    data-testid="button-import"
                  >
                    {importMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {importMutation.isPending && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Fetching and parsing recipe...
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-xs text-muted-foreground font-medium">or fill in manually</span>
                <div className="flex-1 h-px bg-border/40" />
              </div>

              <div>
                <label htmlFor="title" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Title *</label>
                <Input
                  id="title"
                  placeholder="e.g. Classic Margherita Pizza"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl bg-card border-0"
                  data-testid="input-title"
                />
              </div>

              <div>
                <label htmlFor="description" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Description</label>
                <Input
                  id="description"
                  placeholder="A brief description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl bg-card border-0"
                  data-testid="input-description"
                />
              </div>

              <div>
                <label htmlFor="imageUrl" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Image URL</label>
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/photo.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="rounded-xl bg-card border-0"
                  data-testid="input-image-url"
                />
              </div>

              <div>
                <label htmlFor="tags" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Tags</label>
                <Input
                  id="tags"
                  placeholder="Italian, Pasta, Quick (comma-separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="rounded-xl bg-card border-0"
                  data-testid="input-tags"
                />
              </div>

              <div>
                <label htmlFor="ingredients" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Ingredients *</label>
                <Textarea
                  id="ingredients"
                  placeholder={"One ingredient per line\ne.g.\n2 cups flour\n1 cup sugar"}
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  rows={5}
                  className="rounded-xl bg-card border-0 text-sm"
                  data-testid="input-ingredients"
                />
              </div>

              <div>
                <label htmlFor="steps" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Steps *</label>
                <Textarea
                  id="steps"
                  placeholder={"One step per line\ne.g.\nPreheat oven to 375F\nMix dry ingredients"}
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  rows={5}
                  className="rounded-xl bg-card border-0 text-sm"
                  data-testid="input-steps"
                />
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 px-6 py-4 border-t border-border/40 bg-background safe-area-bottom">
            <Button
              onClick={() => mutation.mutate()}
              disabled={!canSubmit || mutation.isPending}
              className="w-full rounded-xl text-sm font-semibold"
              data-testid="button-submit-recipe"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Save Recipe"
              )}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
