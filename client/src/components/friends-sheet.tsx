import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { X, Search, UserPlus, Check, XIcon, Users, Loader2 } from "lucide-react";
import type { SafeUser } from "@shared/schema";

interface FriendsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FriendsSheet({ open, onOpenChange }: FriendsSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<"friends" | "requests" | "search">("friends");

  const { data: friends = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/friends"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });

  const { data: requests } = useQuery<{
    incoming: Array<{ id: string; requester: SafeUser }>;
    outgoing: Array<{ id: string; addressee: SafeUser }>;
  }>({
    queryKey: ["/api/friends/requests"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });

  const { data: searchResults = [], isFetching: isSearching } = useQuery<SafeUser[]>({
    queryKey: ["/api/users/search", `?q=${searchQuery}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user && searchQuery.length >= 2,
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (toUserId: string) => {
      await apiRequest("POST", "/api/friends/request", { toUserId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      toast({ title: "Friend request sent!" });
    },
    onError: (err: Error) => {
      const msg = err.message?.includes(":") ? err.message.split(": ").slice(1).join(": ") : err.message;
      toast({ title: "Couldn't send request", description: msg, variant: "destructive" });
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      await apiRequest("POST", `/api/friends/requests/${id}/respond`, { accept });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({ title: "Done!" });
    },
    onError: () => {
      toast({ title: "Something went wrong", variant: "destructive" });
    },
  });

  const incomingCount = requests?.incoming?.length || 0;
  const tabs = [
    { id: "friends" as const, label: "Friends" },
    { id: "requests" as const, label: `Requests${incomingCount ? ` (${incomingCount})` : ""}` },
    { id: "search" as const, label: "Search" },
  ];

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Drawer.Content className="max-h-[94dvh] rounded-t-3xl outline-none bg-background fixed inset-x-0 bottom-0 z-50">
          <div className="mx-auto w-10 h-1 flex-shrink-0 rounded-full bg-muted-foreground/20 mt-3 mb-3" />
          <div className="px-6 pb-10">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <h2 className="font-serif text-2xl font-bold">Friends</h2>
              <button onClick={() => onOpenChange(false)} className="text-muted-foreground/60 p-1.5 rounded-xl" data-testid="button-close-friends">
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
                  data-testid={`tab-friends-${t.id}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "friends" && (
              <div className="space-y-2 max-h-[50dvh] overflow-y-auto">
                {friends.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">No friends yet</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Search for users to add them</p>
                  </div>
                ) : (
                  friends.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card" data-testid={`friend-item-${f.id}`}>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-sm">{(f.displayName || f.username)[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{f.displayName || f.username}</p>
                        <p className="text-xs text-muted-foreground">@{f.username}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "requests" && (
              <div className="space-y-4 max-h-[50dvh] overflow-y-auto">
                {(requests?.incoming?.length || 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Incoming</p>
                    <div className="space-y-2">
                      {requests!.incoming.map((req) => (
                        <div key={req.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card" data-testid={`request-incoming-${req.id}`}>
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold text-sm">{(req.requester.displayName || req.requester.username)[0].toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{req.requester.displayName || req.requester.username}</p>
                            <p className="text-xs text-muted-foreground">@{req.requester.username}</p>
                          </div>
                          <div className="flex gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => respondMutation.mutate({ id: req.id, accept: true })}
                              data-testid={`button-accept-${req.id}`}
                            >
                              <Check className="w-4 h-4 text-primary" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => respondMutation.mutate({ id: req.id, accept: false })}
                              data-testid={`button-reject-${req.id}`}
                            >
                              <XIcon className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(requests?.outgoing?.length || 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sent</p>
                    <div className="space-y-2">
                      {requests!.outgoing.map((req) => (
                        <div key={req.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card" data-testid={`request-outgoing-${req.id}`}>
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold text-sm">{(req.addressee.displayName || req.addressee.username)[0].toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{req.addressee.displayName || req.addressee.username}</p>
                            <p className="text-xs text-muted-foreground">@{req.addressee.username}</p>
                          </div>
                          <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">Pending</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(!requests?.incoming?.length && !requests?.outgoing?.length) && (
                  <div className="flex flex-col items-center py-12 text-center">
                    <p className="text-muted-foreground text-sm">No pending requests</p>
                  </div>
                )}
              </div>
            )}

            {tab === "search" && (
              <div className="space-y-3 max-h-[50dvh] overflow-y-auto">
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
                  <p className="text-center text-muted-foreground text-sm py-4">No users found</p>
                )}
                {searchResults.map((u) => {
                  const isFriend = friends.some(f => f.id === u.id);
                  const isPending = requests?.outgoing?.some(r => r.addressee.id === u.id) || 
                                    requests?.incoming?.some(r => r.requester.id === u.id);
                  return (
                    <div key={u.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card" data-testid={`search-user-${u.id}`}>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-sm">{(u.displayName || u.username)[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{u.displayName || u.username}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                      {isFriend ? (
                        <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">Friends</span>
                      ) : isPending ? (
                        <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">Pending</span>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => sendRequestMutation.mutate(u.id)}
                          disabled={sendRequestMutation.isPending}
                          data-testid={`button-add-friend-${u.id}`}
                        >
                          <UserPlus className="w-4 h-4" />
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
