import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { X, Loader2, LogOut, User as UserIcon } from "lucide-react";

interface AuthSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuthSheet({ open, onOpenChange }: AuthSheetProps) {
  const { user, login, signup, logout } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setDisplayName("");
  };

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    try {
      if (mode === "login") {
        await login(username.trim(), password);
        toast({ title: "Welcome back!" });
      } else {
        await signup(username.trim(), password, displayName.trim() || undefined);
        toast({ title: "Account created!" });
      }
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      const msg = err.message?.includes(":") ? err.message.split(": ").slice(1).join(": ") : err.message;
      toast({ title: mode === "login" ? "Login failed" : "Signup failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged out" });
      onOpenChange(false);
    } catch {
      toast({ title: "Logout failed", variant: "destructive" });
    }
  };

  if (user) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="max-h-[94dvh] rounded-t-3xl outline-none bg-background fixed inset-x-0 bottom-0 z-50">
            <div className="mx-auto w-10 h-1 flex-shrink-0 rounded-full bg-muted-foreground/20 mt-3 mb-3" />
            <div className="px-6 pb-10">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
                <h2 className="font-serif text-2xl font-bold">Account</h2>
                <button onClick={() => onOpenChange(false)} className="text-muted-foreground/60 p-1.5 rounded-xl" data-testid="button-close-auth">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-card mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" data-testid="text-username">{user.displayName || user.username}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
              </div>

              <Button variant="outline" className="w-full rounded-xl" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </Button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Drawer.Content className="max-h-[94dvh] rounded-t-3xl outline-none bg-background fixed inset-x-0 bottom-0 z-50">
          <div className="mx-auto w-10 h-1 flex-shrink-0 rounded-full bg-muted-foreground/20 mt-3 mb-3" />
          <div className="px-6 pb-10">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
              <h2 className="font-serif text-2xl font-bold">
                {mode === "login" ? "Log in" : "Sign up"}
              </h2>
              <button onClick={() => onOpenChange(false)} className="text-muted-foreground/60 p-1.5 rounded-xl" data-testid="button-close-auth">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Username</label>
                <Input
                  placeholder="your_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="rounded-xl bg-card border-0"
                  data-testid="input-auth-username"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Password</label>
                <Input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl bg-card border-0"
                  data-testid="input-auth-password"
                />
              </div>

              {mode === "signup" && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Display name (optional)</label>
                  <Input
                    placeholder="How should we call you?"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="rounded-xl bg-card border-0"
                    data-testid="input-auth-displayname"
                  />
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!username.trim() || !password.trim() || loading}
                className="w-full rounded-xl text-sm font-semibold"
                data-testid="button-auth-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mode === "login" ? "Logging in..." : "Creating account..."}
                  </>
                ) : (
                  mode === "login" ? "Log in" : "Create account"
                )}
              </Button>

              <div className="text-center pt-2">
                <button
                  onClick={() => { setMode(mode === "login" ? "signup" : "login"); resetForm(); }}
                  className="text-xs text-primary font-medium"
                  data-testid="button-toggle-auth-mode"
                >
                  {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                </button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
