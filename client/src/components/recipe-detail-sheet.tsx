import type { RecipeWithAuthor } from "@shared/schema";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Copy, Check, X, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import RecipePlaceholder from "@/components/recipe-placeholder";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RecipeDetailSheetProps {
  recipe: RecipeWithAuthor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RecipeDetailSheet({ recipe, open, onOpenChange }: RecipeDetailSheetProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    setCheckedIngredients(new Set());
  }, [recipe?.id]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/recipes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes/recent"] });
      toast({ title: "Recipe deleted" });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
    },
  });

  if (!recipe) return null;

  const tags = Array.isArray(recipe.tags) ? recipe.tags : [];
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];

  const isOwner = user && recipe.createdByUserId === user.id;

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copied!` });
    } catch {
      toast({ title: "Couldn't copy", variant: "destructive" });
    }
  };

  return (
    <>
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="h-[94dvh] rounded-t-3xl outline-none bg-background fixed inset-x-0 bottom-0 z-50 flex flex-col">
            <div className="mx-auto w-10 h-1 flex-shrink-0 rounded-full bg-muted-foreground/20 mt-3 mb-3" />

            {/* critical: give the scroll container a bounded height inside a flex column */}
            <div className="flex-1 min-h-0 overflow-y-auto pb-10 px-6 overscroll-contain touch-pan-y">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                <h2 className="font-serif text-2xl font-bold leading-tight flex-1" data-testid="text-recipe-title">
                  {recipe.title}
                </h2>
                <div className="flex items-center gap-1 mt-1">
                  {isOwner && (
                    <button
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="text-destructive/60 p-1.5 rounded-xl"
                      data-testid="button-delete-recipe"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => onOpenChange(false)}
                    className="text-muted-foreground/60 p-1.5 rounded-xl"
                    data-testid="button-close-detail"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {(recipe.authorUsername || recipe.isBase) && (
                <p className="text-sm text-muted-foreground mb-4" data-testid="text-recipe-author">
                  by @{recipe.isBase ? "Recipease" : recipe.authorUsername}
                </p>
              )}

              {recipe.imageUrl ? (
                <div className="rounded-2xl overflow-hidden mb-5 aspect-[4/3]">
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden mb-5 aspect-[4/3]">
                  <RecipePlaceholder title={recipe.title} className="w-full h-full" />
                </div>
              )}

              {recipe.description && (
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                  {recipe.description}
                </p>
              )}

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {tags.map((tag) => (
                    <span key={tag} className="text-xs font-medium px-3 py-1 rounded-full bg-primary/8 text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mb-8">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                  <h3 className="font-semibold text-base">Ingredients</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-xl text-xs"
                    onClick={() => copyToClipboard(ingredients.join("\n"), "Ingredients")}
                    data-testid="button-copy-ingredients"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy
                  </Button>
                </div>
                <ul className="space-y-3">
                  {ingredients.map((item, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-3 group cursor-pointer"
                      onClick={() => toggleIngredient(i)}
                      whileTap={{ scale: 0.98 }}
                      data-testid={`ingredient-item-${i}`}
                    >
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                          checkedIngredients.has(i) ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        {checkedIngredients.has(i) && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <span
                        className={`text-sm leading-relaxed transition-all duration-200 ${
                          checkedIngredients.has(i) ? "line-through text-muted-foreground/50" : ""
                        }`}
                      >
                        {item}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                  <h3 className="font-semibold text-base">Steps</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-xl text-xs"
                    onClick={() => copyToClipboard(steps.map((s, i) => `${i + 1}. ${s}`).join("\n"), "Steps")}
                    data-testid="button-copy-steps"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy
                  </Button>
                </div>
                <ol className="space-y-5">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-3.5" data-testid={`step-item-${i}`}>
                      <div className="w-7 h-7 rounded-lg bg-primary/8 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">
                        {i + 1}
                      </div>
                      <p className="text-sm leading-relaxed pt-0.5 text-foreground/80">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-2xl max-w-sm mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground"
              onClick={() => deleteMutation.mutate(recipe.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
