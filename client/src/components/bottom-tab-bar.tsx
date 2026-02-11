import { Compass, BookOpen, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <nav
      className="sticky bottom-0 z-50 border-t bg-background/80 backdrop-blur-xl"
      data-testid="nav-bottom-tabs"
    >
      <div className="flex items-center justify-around gap-1 px-4 pb-[env(safe-area-inset-bottom,8px)] pt-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              data-testid={`tab-${tab.id}`}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-md transition-colors min-w-[64px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon
                className={cn(
                  "transition-all duration-200",
                  isActive ? "w-6 h-6" : "w-5 h-5"
                )}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span className={cn(
                "text-[11px] font-medium transition-all duration-200",
                isActive ? "opacity-100" : "opacity-70"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
