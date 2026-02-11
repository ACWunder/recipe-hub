import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DiscoverPage from "@/pages/discover";
import AllRecipesPage from "@/pages/all-recipes";
import RecentPage from "@/pages/recent";
import BottomTabBar from "@/components/bottom-tab-bar";
import { AnimatePresence, motion } from "framer-motion";
import { RecipeDetailProvider } from "@/components/recipe-detail-context";

type TabId = "discover" | "recipes" | "recent";

function App() {
  const [activeTab, setActiveTab] = useState<TabId>("discover");

  const pages: Record<TabId, JSX.Element> = {
    discover: <DiscoverPage />,
    recipes: <AllRecipesPage />,
    recent: <RecentPage />,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RecipeDetailProvider>
          <div className="flex flex-col h-[100dvh] bg-background overflow-hidden">
            <main className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  {pages[activeTab]}
                </motion.div>
              </AnimatePresence>
            </main>
            <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
          <Toaster />
        </RecipeDetailProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
