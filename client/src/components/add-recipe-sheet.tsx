import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
        createdByUserId: "demo",
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
        <Drawer.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Drawer.Content className="max-h-[92dvh] rounded-t-2xl outline-none bg-background fixed inset-x-0 bottom-0 z-50">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mt-3 mb-2" />
          <div className="overflow-y-auto pb-8 px-5">
            <div className="flex items-center justify-between gap-3 mb-5">
              <h2 className="font-serif text-xl font-bold">Add Recipe</h2>
              <button onClick={() => onOpenChange(false)} className="text-muted-foreground p-1" data-testid="button-close-add">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium mb-1.5 block">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Classic Margherita Pizza"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-title"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium mb-1.5 block">Description</Label>
                <Input
                  id="description"
                  placeholder="A brief description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-description"
                />
              </div>

              <div>
                <Label htmlFor="imageUrl" className="text-sm font-medium mb-1.5 block">Image URL</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/photo.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  data-testid="input-image-url"
                />
              </div>

              <div>
                <Label htmlFor="tags" className="text-sm font-medium mb-1.5 block">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Italian, Pasta, Quick (comma-separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  data-testid="input-tags"
                />
              </div>

              <div>
                <Label htmlFor="ingredients" className="text-sm font-medium mb-1.5 block">Ingredients *</Label>
                <Textarea
                  id="ingredients"
                  placeholder={"One ingredient per line\ne.g.\n2 cups flour\n1 cup sugar"}
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  rows={5}
                  data-testid="input-ingredients"
                />
              </div>

              <div>
                <Label htmlFor="steps" className="text-sm font-medium mb-1.5 block">Steps *</Label>
                <Textarea
                  id="steps"
                  placeholder={"One step per line\ne.g.\nPreheat oven to 375F\nMix dry ingredients"}
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  rows={5}
                  data-testid="input-steps"
                />
              </div>

              <div className="pt-1 pb-2 opacity-50">
                <Label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" />
                  Import from URL (coming soon)
                </Label>
                <Input
                  disabled
                  placeholder="Paste a recipe URL to auto-import"
                  data-testid="input-import-url"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Later: paste a recipe URL and we'll parse it using the ChatGPT API.
                </p>
              </div>

              <Button
                onClick={() => mutation.mutate()}
                disabled={!canSubmit || mutation.isPending}
                className="w-full"
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
