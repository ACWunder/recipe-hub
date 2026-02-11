import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { X, Search, UserPlus, UserMinus, Users, Loader2 } from "lucide-react";
import type { SafeUser } from "@shared/schema";

interface FollowingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FollowingSheet({ open, onOpenChange }: FollowingSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<"following" | "search">("following");

  const { data: following = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/following"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });

  const { data: searchResults = [], isFetching: isSearching } = useQuery<SafeUser[]>({
    queryKey: ["/api/users/search", `?q=${searchQuery}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user && searchQuery.length >= 2,
  });

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", "/api/follow", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/search"] });
      toast({ title: "Following!" });
    },
    onError: (err: Error) => {
      const msg = err.message?.includes(":") ? err.message.split(": ").slice(1).join(": ") : err.message;
      toast({ title: "Couldn't follow", description: msg, variant: "destructive" });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", "/api/unfollow", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/search"] });
      toast({ title: "Unfollowed" });
    },
    onError: () => {
      toast({ title: "Something went wrong", variant: "destructive" });
    },
  });

  const tabs = [
    { id: "following" as const, label: "Following" },
    { id: "search" as const, label: "Search" },
  ];

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Drawer.Content className="max-h-[94dvh] rounded-t-3xl outline-none bg-background fixed inset-x-0 bottom-0 z-50 flex flex-col">
          <div className="mx-auto w-10 h-1 flex-shrink-0 rounded-full bg-muted-foreground/20 mt-3 mb-3" />
          <div className="px-6 pb-10 overflow-y-auto flex-1 min-h-0">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <h2 className="font-serif text-2xl font-bold">People</h2>
              <button onClick={() => onOpenChange(false)} className="text-muted-foreground/60 p-1.5 rounded-xl" data-testid="button-close-following">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 mb-5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-all ${
                    tab === t.id ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                  }`}
                  data-testid={`tab-people-${t.id}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "following" && (
              <div className="space-y-2">
                {following.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">Not following anyone yet</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Search for users to follow them</p>
                  </div>
                ) : (
                  following.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card" data-testid={`following-item-${f.id}`}>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-sm">{(f.displayName || f.username)[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{f.displayName || f.username}</p>
                        <p className="text-xs text-muted-foreground">@{f.username}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => unfollowMutation.mutate(f.id)}
                        disabled={unfollowMutation.isPending}
                        data-testid={`button-unfollow-${f.id}`}
                      >
                        <UserMinus className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "search" && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input
                    type="search"
                    placeholder="Search by username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl bg-card border-0 text-sm"
                    data-testid="input-search-users"
                  />
                </div>
                {isSearching && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4" data-testid="text-no-users">No users found</p>
                )}
                {searchResults.map((u) => {
                  const isFollowed = following.some(f => f.id === u.id);
                  return (
                    <div key={u.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card" data-testid={`search-user-${u.id}`}>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-sm">{(u.displayName || u.username)[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{u.displayName || u.username}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                      {isFollowed ? (
                        <Button
                          variant="outline"
                          className="rounded-full text-xs h-8 px-3"
                          onClick={() => unfollowMutation.mutate(u.id)}
                          disabled={unfollowMutation.isPending}
                          data-testid={`button-unfollow-${u.id}`}
                        >
                          <UserMinus className="w-3.5 h-3.5 mr-1" />
                          Unfollow
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          className="rounded-full text-xs h-8 px-3"
                          onClick={() => followMutation.mutate(u.id)}
                          disabled={followMutation.isPending}
                          data-testid={`button-follow-${u.id}`}
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1" />
                          Follow
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
