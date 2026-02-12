import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DiscoverPage from "@/pages/discover";
import AllRecipesPage from "@/pages/all-recipes";
import RecentPage from "@/pages/recent";
import BottomTabBar from "@/components/bottom-tab-bar";
import { motion } from "framer-motion";
import { RecipeDetailProvider } from "@/components/recipe-detail-context";
import { AuthProvider } from "@/hooks/use-auth";

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
        <AuthProvider>
          <RecipeDetailProvider>
            <div className="app-shell flex flex-col h-[100dvh] bg-background overflow-hidden">
              <main className="flex-1 overflow-hidden relative">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute inset-0"
                >
                  {pages[activeTab]}
                </motion.div>
              </main>
              <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
            <div className="landscape-blocker" role="status" aria-live="polite">
              <p>Please rotate your phone back to portrait mode.</p>
            </div>
            <Toaster />
          </RecipeDetailProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;