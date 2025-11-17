import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2 } from "lucide-react";

interface CheckingProgressProps {
  currentNumber: string | null;
  totalNumbers: number;
  checkedNumbers: number;
  isChecking: boolean;
}

export function CheckingProgress({
  currentNumber,
  totalNumbers,
  checkedNumbers,
  isChecking,
}: CheckingProgressProps) {
  const percentage = totalNumbers > 0 ? (checkedNumbers / totalNumbers) * 100 : 0;
  const isComplete = totalNumbers > 0 && checkedNumbers === totalNumbers;

  return (
    <Card className="h-full" data-testid="card-checking-progress">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg font-semibold">Progress Checking</CardTitle>
        <CardDescription>
          Status real-time dari proses checking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Circular Progress Indicator */}
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-8 border-muted flex items-center justify-center">
              {isChecking ? (
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              ) : isComplete ? (
                <CheckCircle2 className="w-12 h-12 text-primary" />
              ) : (
                <div className="text-center">
                  <div className="text-3xl font-bold" data-testid="text-percentage">
                    {Math.round(percentage)}%
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 text-center space-y-2 w-full">
            {currentNumber && isChecking ? (
              <>
                <p className="text-sm text-muted-foreground">Checking nomor:</p>
                <div 
                  className="font-mono text-lg font-medium bg-accent px-4 py-2 rounded-md inline-block"
                  data-testid="text-current-number"
                >
                  {currentNumber}
                </div>
              </>
            ) : isComplete ? (
              <p className="text-lg font-medium text-primary">Checking Selesai!</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Belum ada proses checking
              </p>
            )}
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="space-y-2">
          <Progress value={percentage} className="h-2" data-testid="progress-bar" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium" data-testid="text-progress-stats">
              {checkedNumbers} dari {totalNumbers}
            </span>
          </div>
        </div>

        {/* Estimated Time */}
        {isChecking && totalNumbers > 0 && (
          <div className="bg-accent/50 rounded-md p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Estimasi waktu tersisa</p>
            <p className="text-lg font-semibold" data-testid="text-estimated-time">
              {Math.ceil(((totalNumbers - checkedNumbers) * 3) / 60)} menit
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ~3 detik per nomor
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
