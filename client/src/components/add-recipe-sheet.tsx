import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { X, Link as LinkIcon, Loader2, Sparkles, Camera, ImagePlus, Lock, LockOpen } from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useUpload } from "@/hooks/use-upload";

type ImageMode = "upload" | "url";

const AVAILABLE_TAGS = [
  "asian",
  "italian",
  "seafood",
  "vegetarian",
  "vegan",
  "breakfast",
  "baked-goods",
  "healthy",
  "high-protein",
  "indian",
  "chinese",
  "vietnamese",
  "thai",
  "german",
  "oven-baked",
  "rice",
  "pasta",
  "salad",
  "spicy",
  "snack",
  "soup",
  "sweet",
  "try",
] as const;


interface AddRecipeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddRecipeSheet({ open, onOpenChange }: AddRecipeSheetProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [description, setDescription] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [imageMode, setImageMode] = useState<ImageMode>("upload");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isHidden, setIsHidden] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      const servePath = response.objectPath;
      setImageUrl(servePath);
      toast({ title: "Photo uploaded!" });
    },
    onError: (err) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setTitle("");
    setImageUrl("");
    setSelectedTags([]);
    setIngredients("");
    setSteps("");
    setDescription("");
    setImportUrl("");
    setImagePreview(null);
    setImageMode("upload");
    setIsHidden(false);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Image must be under 10MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    await uploadFile(file);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        imageUrl: imageUrl.trim() || null,
        isHidden,
        tags: selectedTags,
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
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
        setImageMode("url");
      }
      if (data.tags && Array.isArray(data.tags)) {
        const importedTags = data.tags
          .map((tag: string) => tag.toLowerCase().trim())
          .filter((tag: string) => AVAILABLE_TAGS.includes(tag as (typeof AVAILABLE_TAGS)[number]));
        setSelectedTags(Array.from(new Set(importedTags)));
      }
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

  const canSubmit = title.trim().length > 0 && ingredients.trim().length > 0 && steps.trim().length > 0 && !isUploading;
  const canImport = importUrl.trim().length > 0 && !importMutation.isPending;
  const orderedTags = [
    ...selectedTags,
    ...AVAILABLE_TAGS.filter((tag) => !selectedTags.includes(tag)),
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };


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
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsHidden((prev) => !prev)}
                className="text-muted-foreground/80 p-1.5 rounded-xl"
                data-testid="button-toggle-hidden-add"
                title={isHidden ? "Recipe is hidden" : "Recipe is visible"}
              >
                {isHidden ? <Lock className="w-5 h-5" /> : <LockOpen className="w-5 h-5" />}
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground/60 p-1.5 rounded-xl"
                data-testid="button-close-add"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
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
                  placeholder="e.g. Pasta Carbonara"
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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Recipe Image</label>
                <div className="flex gap-1 mb-3">
                  <button
                    onClick={() => setImageMode("upload")}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                      imageMode === "upload" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                    }`}
                    data-testid="toggle-image-upload"
                  >
                    Photo
                  </button>
                  <button
                    onClick={() => setImageMode("url")}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                      imageMode === "url" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                    }`}
                    data-testid="toggle-image-url"
                  >
                    URL
                  </button>
                </div>

                {imageMode === "upload" ? (
                  <div>
                    {imagePreview ? (
                      <div className="relative rounded-xl overflow-hidden mb-2 aspect-[4/3]">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                        <button
                          onClick={() => { setImagePreview(null); setImageUrl(""); }}
                          className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-lg"
                          data-testid="button-remove-photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-card p-4 text-sm text-muted-foreground"
                          data-testid="button-choose-photo"
                        >
                          <ImagePlus className="w-5 h-5" />
                          Choose Photo
                        </button>
                        <button
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-card p-4 text-sm text-muted-foreground"
                          data-testid="button-take-photo"
                        >
                          <Camera className="w-5 h-5" />
                          Take Photo
                        </button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                        e.target.value = "";
                      }}
                      data-testid="input-file-photo"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                        e.target.value = "";
                      }}
                      data-testid="input-camera-photo"
                    />
                  </div>
                ) : (
                  <Input
                    placeholder="https://example.com/photo.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="rounded-xl bg-card border-0"
                    data-testid="input-image-url"
                  />
                )}
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
                        data-testid={`tag-option-${tag}`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
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
                  placeholder={"One step per line\ne.g.\nPreheat oven to 180C\nMix dry ingredients"}
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
