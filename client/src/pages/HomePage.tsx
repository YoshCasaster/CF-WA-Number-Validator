import { useState, useEffect, useRef } from "react";
import { AppHeader } from "@/components/AppHeader";
import { QRAuthModal } from "@/components/QRAuthModal";
import { UploadInterface } from "@/components/UploadInterface";
import { CheckingProgress } from "@/components/CheckingProgress";
import { QuickStats } from "@/components/QuickStats";
import { ResultsTable } from "@/components/ResultsTable";
import { ControlBar } from "@/components/ControlBar";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import type { PhoneCheck, Statistics, WSMessage } from "@shared/schema";

export default function HomePage() {
  const { toast } = useToast();

  // WebSocket state
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);

  // WhatsApp session state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<
    { name: string; number: string } | undefined
  >();
  const [authLoading, setAuthLoading] = useState(true);

  // Checking state
  const [numbers, setNumbers] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentNumber, setCurrentNumber] = useState<string | null>(null);
  const [results, setResults] = useState<PhoneCheck[]>([]);

  // Statistics
  const [stats, setStats] = useState<Statistics>({
    total: 0,
    checked: 0,
    active: 0,
    nonWa: 0,
    errors: 0,
    checking: 0,
  });

  // Connect to WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setWsError(null);
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        handleWSMessage(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWsError("Failed to connect to server");
      toast({
        title: "Connection Error",
        description: "Failed to connect to server. Please refresh the page.",
        variant: "destructive",
      });
    };

    ws.onclose = () => {
      setIsConnected(false);
      setAuthLoading(false);
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, [toast]);

  const handleWSMessage = (message: WSMessage) => {
    switch (message.type) {
      case "qr":
        setQrCode(message.qrCode);
        setIsAuthenticated(false);
        setAuthLoading(false);
        break;

      case "authenticated":
        setIsAuthenticated(true);
        setQrCode(null);
        setAuthLoading(false);
        setAccountInfo({
          name: message.accountName,
          number: message.accountNumber,
        });
        toast({
          title: "WhatsApp Connected",
          description: `Logged in as ${message.accountName}`,
        });
        break;

      case "disconnected":
        setIsAuthenticated(false);
        setQrCode(null);
        setAccountInfo(undefined);
        setAuthLoading(false);
        toast({
          title: "WhatsApp Disconnected",
          description: "Please scan QR code again",
          variant: "destructive",
        });
        break;

      case "checkStart":
        setCurrentNumber(message.number);
        break;

      case "checkResult":
        setResults((prev) => {
          const existing = prev.find(
            (r) => r.phoneNumber === message.result.phoneNumber,
          );
          if (existing) {
            return prev.map((r) =>
              r.phoneNumber === message.result.phoneNumber ? message.result : r,
            );
          }
          return [...prev, message.result];
        });

        // Update statistics
        setStats((prev) => {
          const newStats = { ...prev };
          newStats.checked = prev.checked + 1;

          if (message.result.status === "active") {
            newStats.active += 1;
          } else if (message.result.status === "non-wa") {
            newStats.nonWa += 1;
          } else if (message.result.status === "error") {
            newStats.errors += 1;
          }

          return newStats;
        });
        break;

      case "checkComplete":
        setIsChecking(false);
        setCurrentNumber(null);
        toast({
          title: "Checking Complete",
          description: "All numbers have been checked",
        });
        break;

      case "error":
        toast({
          title: "Error",
          description: message.message,
          variant: "destructive",
        });
        break;
    }
  };

  const handleStartChecking = () => {
    if (!isAuthenticated) {
      toast({
        title: "Not Authenticated",
        description: "Please wait for WhatsApp authentication to complete",
        variant: "destructive",
      });
      return;
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Connection Error",
        description: "WebSocket is not connected. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    const numberList = numbers
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);

    if (numberList.length === 0) {
      toast({
        title: "No Numbers",
        description: "Please enter at least one phone number",
        variant: "destructive",
      });
      return;
    }

    // Reset state
    setResults([]);
    setStats({
      total: numberList.length,
      checked: 0,
      active: 0,
      nonWa: 0,
      errors: 0,
      checking: 0,
    });
    setIsChecking(true);
    setIsPaused(false);

    // Send numbers to server
    wsRef.current.send(
      JSON.stringify({
        type: "startCheck",
        numbers: numberList,
      }),
    );
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    // TODO: Implement actual pause/resume logic with backend
    toast({
      title: isPaused ? "Resumed" : "Paused",
      description: isPaused ? "Checking resumed" : "Checking paused",
    });
  };

  const handleStop = () => {
    setIsChecking(false);
    setIsPaused(false);
    setCurrentNumber(null);
    toast({
      title: "Stopped",
      description: "Checking has been stopped",
    });
  };

  const handleExport = async () => {
    if (results.length === 0) {
      toast({
        title: "No Results",
        description: "No results to copy",
        variant: "destructive",
      });
      return;
    }

    // Generate content - only result values (1 or empty)
    const resultText = results
      .map((result) => {
        // 1 = WhatsApp active, kosong = tidak aktif/tidak terdaftar
        return result.status === "active" ? "1" : "";
      })
      .join("\n");

    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(resultText);

      toast({
        title: "Copied!",
        description: `${results.length} results copied to clipboard`,
      });
    } catch (error) {
      // Fallback if clipboard API fails
      console.error("Failed to copy:", error);
      toast({
        title: "Copy Failed",
        description: "Please try again or use a modern browser",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        isConnected={isConnected}
        isAuthenticated={isAuthenticated}
        accountInfo={accountInfo}
      />

      <QRAuthModal open={!isAuthenticated && qrCode !== null} qrCode={qrCode} />

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
        {/* Connection Error Alert */}
        {wsError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{wsError}</AlertDescription>
          </Alert>
        )}

        {/* Authentication Loading State */}
        {authLoading && isConnected && (
          <div className="mb-6">
            <Alert>
              <AlertDescription className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                Initializing WhatsApp connection...
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Not Authenticated Warning */}
        {!isAuthenticated && !authLoading && isConnected && !qrCode && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Waiting for WhatsApp authentication. Please scan the QR code when
              it appears.
            </AlertDescription>
          </Alert>
        )}

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Panel - Upload Interface */}
          <div className="lg:col-span-1">
            <UploadInterface
              numbers={numbers}
              onNumbersChange={setNumbers}
              onStartChecking={handleStartChecking}
              isChecking={isChecking}
              disabled={!isAuthenticated}
            />
          </div>

          {/* Center Panel - Checking Progress */}
          <div className="lg:col-span-1">
            <CheckingProgress
              currentNumber={currentNumber}
              totalNumbers={stats.total}
              checkedNumbers={stats.checked}
              isChecking={isChecking}
            />
          </div>

          {/* Right Panel - Quick Stats */}
          <div className="lg:col-span-1">
            <QuickStats
              stats={stats}
              onExport={handleExport}
              hasResults={results.length > 0}
            />
          </div>
        </div>

        {/* Control Bar (appears when checking is active) */}
        {isChecking && (
          <div className="mb-8">
            <ControlBar
              isChecking={isChecking}
              isPaused={isPaused}
              progress={(stats.checked / stats.total) * 100}
              onPauseResume={handlePauseResume}
              onStop={handleStop}
            />
          </div>
        )}

        {/* Results Table Section */}
        {results.length > 0 && (
          <div className="w-full">
            <ResultsTable results={results} />
          </div>
        )}

        {/* Empty State */}
        {results.length === 0 && !isChecking && isAuthenticated && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-accent mx-auto flex items-center justify-center mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Siap untuk mulai checking?
              </h3>
              <p className="text-sm">
                Upload daftar nomor telepon atau masukkan secara manual, lalu
                klik "Start Checking" untuk memulai.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
