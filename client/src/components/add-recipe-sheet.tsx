import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { X, Link as LinkIcon, Loader2 } from "lucide-react";

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

  const resetForm = () => {
    setTitle("");
    setImageUrl("");
    setTags("");
    setIngredients("");
    setSteps("");
    setDescription("");
  };

  const canSubmit = title.trim().length > 0 && ingredients.trim().length > 0 && steps.trim().length > 0;

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Drawer.Content className="max-h-[94dvh] rounded-t-3xl outline-none bg-background fixed inset-x-0 bottom-0 z-50">
          <div className="mx-auto w-10 h-1 flex-shrink-0 rounded-full bg-muted-foreground/20 mt-3 mb-3" />
          <div className="overflow-y-auto pb-10 px-6">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
              <h2 className="font-serif text-2xl font-bold">New Recipe</h2>
              <button
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground/60 p-1.5 rounded-xl"
                data-testid="button-close-add"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
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

              <div className="pt-1 pb-2 opacity-40">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <LinkIcon className="w-3 h-3" />
                  Import from URL (coming soon)
                </label>
                <Input
                  disabled
                  placeholder="Paste a recipe URL to auto-import"
                  className="rounded-xl bg-card border-0"
                  data-testid="input-import-url"
                />
              </div>

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
                  "Add Recipe"
                )}
              </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
