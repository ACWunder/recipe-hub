import { useQuery } from "@tanstack/react-query";
import type { RecipeWithAuthor } from "@shared/schema";
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { useRecipeDetail } from "@/components/recipe-detail-context";
import RecipePlaceholder from "@/components/recipe-placeholder";
import { Heart, X, Sparkles, User as UserIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import AuthSheet from "@/components/auth-sheet";

type FilterScope = "all" | "mine" | "following" | "base";

function shuffleRecipes(recipes: RecipeWithAuthor[]) {
  const shuffled = [...recipes];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function DiscoverPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<FilterScope>("all");
  const [authOpen, setAuthOpen] = useState(false);

  const { data: recipes, isLoading } = useQuery<RecipeWithAuthor[]>({
    queryKey: ["/api/recipes", `?scope=${scope}`],
  });

  const [deckRecipes, setDeckRecipes] = useState<RecipeWithAuthor[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRefilling, setIsRefilling] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeIntent, setSwipeIntent] = useState<"left" | "right" | null>(null);
  const { openRecipe } = useRecipeDetail();
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refillTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!recipes || recipes.length === 0) {
      setDeckRecipes([]);
      setCurrentIndex(0);
      setIsRefilling(false);
      setIsSwiping(false);
      setSwipeIntent(null);
      return;
    }

    setDeckRecipes(shuffleRecipes(recipes));
    setCurrentIndex(0);
    setIsRefilling(false);
    setIsSwiping(false);
    setSwipeIntent(null);
  }, [recipes, scope]);

  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (swipeTimeoutRef.current) clearTimeout(swipeTimeoutRef.current);
      if (refillTimeoutRef.current) clearTimeout(refillTimeoutRef.current);
    };
  }, []);

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (deckRecipes.length === 0 || isRefilling || isSwiping) return;

      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (swipeTimeoutRef.current) clearTimeout(swipeTimeoutRef.current);
      if (refillTimeoutRef.current) clearTimeout(refillTimeoutRef.current);

      setIsSwiping(true);
      setSwipeIntent(direction);

      if (direction === "right" && deckRecipes[currentIndex]) {
        openTimeoutRef.current = setTimeout(() => {
          const recipe = deckRecipes[currentIndex];
          if (recipe) openRecipe(recipe);
        }, 220);
      }

      swipeTimeoutRef.current = setTimeout(() => {
        const nextIndex = currentIndex + 1;

        if (nextIndex >= deckRecipes.length) {
          setCurrentIndex(deckRecipes.length);
          setIsRefilling(true);
          setIsSwiping(false);
          setSwipeIntent(null);

          refillTimeoutRef.current = setTimeout(() => {
            setDeckRecipes(shuffleRecipes(deckRecipes));
            setCurrentIndex(0);
            setIsRefilling(false);
          }, 650);
          return;
        }

        setCurrentIndex(nextIndex);
        setIsSwiping(false);
        setSwipeIntent(null);
      }, 300);
    },
    [deckRecipes, currentIndex, isRefilling, isSwiping, openRecipe]
  );

  const handleScopeChange = (s: FilterScope) => {
    if ((s === "mine" || s === "following") && !user) {
      setAuthOpen(true);
      return;
    }
    setScope(s);
    setCurrentIndex(0);
    setIsSwiping(false);
    setSwipeIntent(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-8 gap-6">
        <div className="text-center mb-2">
          <Skeleton className="h-8 w-48 mx-auto mb-3 rounded-xl" />
          <Skeleton className="h-4 w-56 mx-auto rounded-lg" />
        </div>
        <Skeleton className="w-full max-w-[300px] aspect-[3/4] rounded-3xl" />
      </div>
    );
  }

  const remaining = deckRecipes.slice(currentIndex);
  const showAuthor = scope !== "mine";

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
          <h1 className="font-serif text-3xl font-bold tracking-tight" data-testid="text-discover-title">Discover</h1>
          <button
            onClick={() => setAuthOpen(true)}
            className="p-1.5 rounded-xl text-muted-foreground"
            data-testid="button-account-discover"
          >
            <UserIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-muted-foreground text-sm mb-3">Swipe right to view, left to skip</p>
        <div className="flex gap-2 pb-2">
          {(["all", "mine", "following", "base"] as FilterScope[]).map((s) => (
            <button
              key={s}
              onClick={() => handleScopeChange(s)}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-all ${
                scope === s ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
              }`}
              data-testid={`filter-discover-${s}`}
            >
              {s === "all" ? "All" : s === "mine" ? "Mine" : s === "following" ? "Following" : "Base"}
            </button>
          ))}
        </div>
      </header>

      {isRefilling ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.9, 1.05, 1], opacity: 1, rotate: [0, 6, -6, 0] }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="w-20 h-20 rounded-3xl bg-primary/8 flex items-center justify-center mb-6"
          >
            <Sparkles className="w-9 h-9 text-primary" />
          </motion.div>
          <h2 className="font-serif text-2xl font-bold mb-2">Neue Reihenfolge...</h2>
          <p className="text-muted-foreground text-sm max-w-[260px] leading-relaxed">
            Der Discover-Stapel wird neu gemischt.
          </p>
        </div>
      ) : remaining.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-20 h-20 rounded-3xl bg-primary/8 flex items-center justify-center mb-6"
          >
            <Sparkles className="w-9 h-9 text-primary" />
          </motion.div>
          <h2 className="font-serif text-2xl font-bold mb-2">All caught up!</h2>
          <p className="text-muted-foreground text-sm max-w-[240px] leading-relaxed">
            {scope === "mine" ? "You haven't added any recipes yet." :
             scope === "following" ? "No recipes from people you follow yet." :
             scope === "base" ? "No base recipes available." :
             "You've seen all available recipes."}
          </p>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center px-4 pb-6 pt-0 relative -translate-y-8">
          <div className="relative w-full max-w-[350px] aspect-[3/4.45]">
            {remaining.slice(0, 5).reverse().map((recipe, reverseIdx) => {
              const stackSize = remaining.slice(0, 5).length;
              const stackIdx = stackSize - 1 - reverseIdx;

              if (stackIdx === 0) {
                return (
                  <SwipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onSwipe={handleSwipe}
                    showAuthor={showAuthor}
                    disabled={isSwiping}
                    swipeIntent={swipeIntent}
                  />
                );
              }

              return (
                <motion.div
                  key={recipe.id}
                  className="absolute inset-0 rounded-3xl overflow-hidden"
                  animate={{
                    y: stackIdx * 9,
                    scale: 1,
                    opacity: 1,
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{
                    zIndex: 10 - stackIdx,
                    filter: `brightness(${1 - stackIdx * 0.07})`,
                  }}
                >
                  <CardContent recipe={recipe} showAuthor={showAuthor} />
                </motion.div>
              );
            })}

            <div className="absolute left-0 right-0 bottom-5 z-20 flex items-center justify-center gap-8 px-5 pointer-events-none">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSwipe("left")}
                className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white shadow-[0_10px_30px_rgba(15,23,42,0.35)] pointer-events-auto"
                data-testid="button-swipe-left"
              >
                <X className="w-7 h-7" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSwipe("right")}
                className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white shadow-[0_10px_30px_rgba(239,68,68,0.35)] pointer-events-auto"
                data-testid="button-swipe-right"
              >
                <Heart className="w-7 h-7" />
              </motion.button>
            </div>
          </div>
        </div>
      )}

      <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}

function SwipeCard({
  recipe,
  onSwipe,
  showAuthor,
  disabled,
  swipeIntent,
}: {
  recipe: RecipeWithAuthor;
  onSwipe: (dir: "left" | "right") => void;
  showAuthor: boolean;
  disabled: boolean;
  swipeIntent: "left" | "right" | null;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-14, 14]);
  const likeOpacity = useTransform(x, [0, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, 0], [1, 0]);
  const glowOpacity = useTransform(x, [0, 140], [0, 0.3]);

  const animateOut = useCallback(
    (direction: "left" | "right") => {
      animate(x, direction === "right" ? 820 : -820, {
        duration: 0.3,
        ease: "easeInOut",
      });
      onSwipe(direction);
    },
    [onSwipe, x]
  );


  useEffect(() => {
    if (!swipeIntent) return;
    animateOut(swipeIntent);
  }, [swipeIntent, animateOut]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (disabled) return;

    const threshold = 100;
    if (info.offset.x > threshold) {
      animateOut("right");
    } else if (info.offset.x < -threshold) {
      animateOut("left");
    } else {
      animate(x, 0, { duration: 0.25, ease: "easeInOut" });
    }
  };

  return (
    <motion.div
      className="absolute inset-0 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none shadow-lg"
      style={{ x, rotate, zIndex: 20 }}
      drag={disabled ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      onDragEnd={handleDragEnd}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      data-testid="card-swipe"
    >
      <CardContent recipe={recipe} showAuthor={showAuthor} />
      <motion.div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          opacity: glowOpacity,
          background: "radial-gradient(circle at 70% 50%, hsl(152 50% 50% / 0.4), transparent 70%)",
        }}
      />
      <motion.div
        className="absolute top-5 left-5 bg-primary/90 backdrop-blur-sm text-primary-foreground font-bold text-sm px-4 py-2 rounded-xl -rotate-12"
        style={{ opacity: likeOpacity }}
      >
        VIEW
      </motion.div>
      <motion.div
        className="absolute top-5 right-5 bg-destructive/90 backdrop-blur-sm text-destructive-foreground font-bold text-sm px-4 py-2 rounded-xl rotate-12"
        style={{ opacity: nopeOpacity }}
      >
        SKIP
      </motion.div>
    </motion.div>
  );
}

function CardContent({ recipe, showAuthor }: { recipe: RecipeWithAuthor; showAuthor: boolean }) {
  return (
    <div className="relative w-full h-full">
      {recipe.imageUrl ? (
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <RecipePlaceholder title={recipe.title} className="w-full h-full" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5 pb-24">
        <h3 className="text-white font-serif text-xl font-bold mb-1 drop-shadow-md">
          {recipe.title}
        </h3>
        {showAuthor && recipe.authorUsername && (
          <p className="text-white/60 text-xs mb-2" data-testid={`author-${recipe.id}`}>
            by @{recipe.authorUsername}
          </p>
        )}
        {showAuthor && recipe.isBase && (
          <p className="text-white/60 text-xs mb-2" data-testid={`author-${recipe.id}`}>
            by @arthur
          </p>
        )}
        {recipe.description && (
          <p className="text-white/70 text-xs leading-relaxed mb-3 line-clamp-2">
            {recipe.description}
          </p>
        )}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-white/90 bg-white/15 backdrop-blur-md text-[11px] px-3 py-1 rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
