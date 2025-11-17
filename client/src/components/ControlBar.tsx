import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pause, Play, Square } from "lucide-react";

interface ControlBarProps {
  isChecking: boolean;
  isPaused: boolean;
  progress: number;
  onPauseResume: () => void;
  onStop: () => void;
}

export function ControlBar({
  isChecking,
  isPaused,
  progress,
  onPauseResume,
  onStop,
}: ControlBarProps) {
  return (
    <Card className="sticky bottom-4 md:static shadow-lg md:shadow-none">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span 
                className="text-sm font-bold"
                data-testid="text-control-progress"
              >
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="default"
              onClick={onPauseResume}
              disabled={!isChecking}
              data-testid="button-pause-resume"
              aria-label={isPaused ? "Resume checking" : "Pause checking"}
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
            
            <Button
              variant="destructive"
              size="default"
              onClick={onStop}
              disabled={!isChecking}
              data-testid="button-stop"
              aria-label="Stop checking"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
