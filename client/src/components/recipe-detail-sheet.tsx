import type { RecipeWithAuthor } from "@shared/schema";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Copy, Check, X, Trash2, Pencil, Save, Lock, LockOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import RecipePlaceholder from "@/components/recipe-placeholder";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const AVAILABLE_TAGS = [
  "Asian",
  "Italian",
  "Seafood",
  "Vegetarian",
  "Vegan",
  "Breakfast",
  "Baked-Goods",
  "Healthy",
  "High-Protein",
  "Indian",
  "Chinese",
  "Vietnamese",
  "Thai",
  "German",
  "Oven-Baked",
  "Rice",
  "Pasta",
  "Salad",
  "Spicy",
  "Snack",
  "Soup",
  "Sweet",
  "Try",
] as const;

export default function RecipeDetailSheet({ recipe, open, onOpenChange }: RecipeDetailSheetProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ingredientsText, setIngredientsText] = useState("");
  const [stepsText, setStepsText] = useState("");
  const [isHidden, setIsHidden] = useState(false);

  const resetEditForm = (currentRecipe: RecipeWithAuthor) => {
    setTitle(currentRecipe.title ?? "");
    setDescription(currentRecipe.description ?? "");
    setImageUrl(currentRecipe.imageUrl ?? "");
    setSelectedTags(Array.isArray(currentRecipe.tags) ? currentRecipe.tags : []);
    setIngredientsText(Array.isArray(currentRecipe.ingredients) ? currentRecipe.ingredients.join("\n") : "");
    setStepsText(Array.isArray(currentRecipe.steps) ? currentRecipe.steps.join("\n") : "");
    setIsHidden(!!currentRecipe.isHidden);
  };

  useEffect(() => {
    setCheckedIngredients(new Set());
    setIsEditing(false);
    if (recipe) {
      resetEditForm(recipe);
    }
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

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        imageUrl: imageUrl.trim() || null,
        isHidden,
        tags: selectedTags,
        ingredients: ingredientsText
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        steps: stepsText
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
      };
      await apiRequest("PATCH", `/api/recipes/${id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes/recent"] });
      toast({ title: "Recipe updated" });
      setIsEditing(false);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  const toggleHiddenMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/recipes/${id}`, { isHidden: !isHidden });
    },
    onSuccess: () => {
      setIsHidden((prev) => !prev);
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes/recent"] });
      toast({ title: !isHidden ? "Recipe hidden" : "Recipe visible" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to change visibility", description: err.message, variant: "destructive" });
    },
  });

  if (!recipe) return null;

  const tags = Array.isArray(recipe.tags) ? recipe.tags : [];
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];

  const isOwner = !!user && recipe.createdByUserId === user.id;
  const orderedTags = [
    ...selectedTags,
    ...AVAILABLE_TAGS.filter((tag) => !selectedTags.includes(tag)),
  ];
  const canSave =
    title.trim().length > 0 &&
    ingredientsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean).length > 0 &&
    stepsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean).length > 0;

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
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

            <div className="flex-1 min-h-0 overflow-y-auto pb-10 px-6 overscroll-contain touch-pan-y">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                {isEditing ? (
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="font-serif text-2xl font-bold leading-tight flex-1 h-auto p-0 border-0 bg-transparent"
                    data-testid="input-edit-title"
                  />
                ) : (
                  <h2 className="font-serif text-2xl font-bold leading-tight flex-1" data-testid="text-recipe-title">
                    {recipe.title}
                  </h2>
                )}
                <div className="flex items-center gap-1 mt-1">
                  {isOwner && !isEditing && (
                    <button
                      onClick={() => toggleHiddenMutation.mutate(recipe.id)}
                      className="text-muted-foreground/80 p-1.5 rounded-xl"
                      data-testid="button-toggle-hidden-recipe"
                      disabled={toggleHiddenMutation.isPending}
                      title={isHidden ? "Recipe is hidden" : "Recipe is visible"}
                    >
                      {isHidden ? <Lock className="w-5 h-5" /> : <LockOpen className="w-5 h-5" />}
                    </button>
                  )}
                  {isOwner && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-muted-foreground/80 p-1.5 rounded-xl"
                      data-testid="button-edit-recipe"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  )}
                  {isOwner && !isEditing && (
                    <button
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="text-destructive/60 p-1.5 rounded-xl"
                      data-testid="button-delete-recipe"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      resetEditForm(recipe);
                      onOpenChange(false);
                    }}
                    className="text-muted-foreground/60 p-1.5 rounded-xl"
                    data-testid="button-close-detail"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {(recipe.authorUsername || recipe.isBase) && (
                <p className="text-sm text-muted-foreground mb-4" data-testid="text-recipe-author">
                  by @{recipe.isBase ? "arthur" : recipe.authorUsername}
                </p>
              )}

              {isEditing ? (
                <div className="space-y-4 mb-5">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Description</label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="rounded-xl bg-card border-0"
                      data-testid="input-edit-description"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Image URL</label>
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="rounded-xl bg-card border-0"
                      data-testid="input-edit-image-url"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Tags</label>
                    <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                      {orderedTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-card text-muted-foreground"
                            }`}
                            data-testid={`tag-option-edit-${tag}`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : recipe.imageUrl ? (
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

              {!isEditing && recipe.description && (
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                  {recipe.description}
                </p>
              )}

              {!isEditing && tags.length > 0 && (
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
                  {!isEditing && (
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
                  )}
                </div>

                {isEditing ? (
                  <Textarea
                    value={ingredientsText}
                    onChange={(e) => setIngredientsText(e.target.value)}
                    rows={6}
                    className="rounded-xl bg-card border-0 text-sm"
                    data-testid="input-edit-ingredients"
                  />
                ) : (
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
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                  <h3 className="font-semibold text-base">Steps</h3>
                  {!isEditing && (
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
                  )}
                </div>
                
                {isEditing ? (
                  <>
                    <Textarea
                      value={stepsText}
                      onChange={(e) => setStepsText(e.target.value)}
                      rows={6}
                      className="rounded-xl bg-card border-0 text-sm"
                      data-testid="input-edit-steps"
                    />
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        className="rounded-xl flex-1"
                        onClick={() => {
                          setIsEditing(false);
                          resetEditForm(recipe);
                        }}
                        data-testid="button-cancel-edit"
                      >
                        Cancel
                      </Button>
                      <Button
                        className="rounded-xl flex-1"
                        onClick={() => updateMutation.mutate(recipe.id)}
                        disabled={!canSave || updateMutation.isPending}
                        data-testid="button-save-edit"
                      >
                        <Save className="w-4 h-4 mr-1.5" />
                        {updateMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </>
                ) : (
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
                )}
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
