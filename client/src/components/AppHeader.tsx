import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Wifi, WifiOff, Loader2, User, LogOut, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { logout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface AppHeaderProps {
  isConnected: boolean;
  isAuthenticated: boolean;
  accountInfo?: {
    name: string;
    number: string;
  };
  onClearSession?: () => void;
}

export function AppHeader({
  isConnected,
  isAuthenticated,
  accountInfo,
  onClearSession,
}: AppHeaderProps) {
  const { user, setUser, setToken } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setLocation("/login");
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const handleClearSession = async () => {
    if (onClearSession) {
      onClearSession();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                WA
              </span>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                WhatsApp Number Checker
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Cek nomor WhatsApp aktif
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && accountInfo && (
            <div
              className="hidden md:flex flex-col items-end mr-4"
              data-testid="container-account-info"
            >
              <p className="text-sm font-medium" data-testid="text-account-name">
                {accountInfo.name}
              </p>
              <p
                className="text-xs text-muted-foreground font-mono"
                data-testid="text-account-number"
              >
                {accountInfo.number}
              </p>
            </div>
          )}

          <Badge
            variant={isConnected ? "default" : "secondary"}
            className="flex items-center gap-1.5"
            data-testid="badge-connection-status"
            role="status"
            aria-label={
              isConnected
                ? "Connected to server"
                : isAuthenticated
                  ? "Connecting to server"
                  : "Disconnected from server"
            }
          >
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3" aria-hidden="true" />
                <span className="hidden sm:inline">Connected</span>
              </>
            ) : isAuthenticated ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                <span className="hidden sm:inline">Connecting...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" aria-hidden="true" />
                <span className="hidden sm:inline">Disconnected</span>
              </>
            )}
          </Badge>

          <ThemeToggle />

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.fullName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAuthenticated && (
                  <DropdownMenuItem onClick={handleClearSession}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Clear WA Session</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
