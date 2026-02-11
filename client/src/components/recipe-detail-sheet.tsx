import type { Recipe } from "@shared/schema";
import { Drawer } from "vaul";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import RecipePlaceholder from "@/components/recipe-placeholder";

interface RecipeDetailSheetProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RecipeDetailSheet({ recipe, open, onOpenChange }: RecipeDetailSheetProps) {
  const { toast } = useToast();
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  useEffect(() => {
    setCheckedIngredients(new Set());
  }, [recipe?.id]);

  if (!recipe) return null;

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
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Drawer.Content className="max-h-[92dvh] rounded-t-2xl outline-none bg-background fixed inset-x-0 bottom-0 z-50">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mt-3 mb-2" />
          <div className="overflow-y-auto pb-8 px-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="font-serif text-2xl font-bold leading-tight flex-1" data-testid="text-recipe-title">
                {recipe.title}
              </h2>
              <button
                onClick={() => onOpenChange(false)}
                className="mt-1 text-muted-foreground p-1"
                data-testid="button-close-detail"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {recipe.imageUrl ? (
              <div className="rounded-md overflow-hidden mb-5 aspect-[4/3]">
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="rounded-md overflow-hidden mb-5 aspect-[4/3]">
                <RecipePlaceholder title={recipe.title} className="w-full h-full" />
              </div>
            )}

            {recipe.description && (
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {recipe.description}
              </p>
            )}

            {recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {recipe.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs font-medium">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-semibold text-base">Ingredients</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(recipe.ingredients.join("\n"), "Ingredients")}
                  data-testid="button-copy-ingredients"
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy
                </Button>
              </div>
              <ul className="space-y-2">
                {recipe.ingredients.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 group cursor-pointer"
                    onClick={() => toggleIngredient(i)}
                    data-testid={`ingredient-item-${i}`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      checkedIngredients.has(i) ? "bg-primary border-primary" : "border-muted-foreground/30"
                    }`}>
                      {checkedIngredients.has(i) && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className={`text-sm leading-relaxed transition-all ${
                      checkedIngredients.has(i) ? "line-through text-muted-foreground" : ""
                    }`}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-semibold text-base">Steps</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(recipe.steps.map((s, i) => `${i + 1}. ${s}`).join("\n"), "Steps")}
                  data-testid="button-copy-steps"
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy
                </Button>
              </div>
              <ol className="space-y-4">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-3" data-testid={`step-item-${i}`}>
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">
                      {i + 1}
                    </div>
                    <p className="text-sm leading-relaxed pt-0.5">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
