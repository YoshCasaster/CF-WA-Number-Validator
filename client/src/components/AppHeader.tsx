import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

interface AppHeaderProps {
  isConnected: boolean;
  isAuthenticated: boolean;
  accountInfo?: {
    name: string;
    number: string;
  };
}

export function AppHeader({ isConnected, isAuthenticated, accountInfo }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">WA</span>
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
            aria-label={isConnected ? "Connected to server" : isAuthenticated ? "Connecting to server" : "Disconnected from server"}
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
        </div>
      </div>
    </header>
  );
}
