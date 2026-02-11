import { Compass, BookOpen, Clock } from "lucide-react";
import { motion } from "framer-motion";

type TabId = "discover" | "recipes" | "recent";

interface BottomTabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: typeof Compass }[] = [
  { id: "discover", label: "Discover", icon: Compass },
  { id: "recipes", label: "Recipes", icon: BookOpen },
  { id: "recent", label: "Recent", icon: Clock },
];

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center pb-[env(safe-area-inset-bottom,6px)] px-5 pb-3 pointer-events-none">
      <nav
        className="relative flex items-center justify-around gap-1 bg-card/70 backdrop-blur-2xl rounded-2xl px-3 py-2 shadow-lg pointer-events-auto w-full max-w-[320px]"
        style={{ border: '1px solid hsl(var(--border) / 0.5)' }}
        data-testid="nav-bottom-tabs"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              data-testid={`tab-${tab.id}`}
              className="relative flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-colors min-w-[64px] z-10"
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={`relative z-10 transition-all duration-300 ${
                  isActive ? "w-5 h-5 text-primary" : "w-5 h-5 text-muted-foreground"
                }`}
                strokeWidth={isActive ? 2.2 : 1.6}
              />
              <span className={`relative z-10 text-[10px] font-semibold tracking-wide transition-all duration-300 ${
                isActive ? "text-primary" : "text-muted-foreground/70"
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
