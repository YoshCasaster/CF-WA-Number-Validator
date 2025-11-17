import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { Statistics } from "@shared/schema";

interface QuickStatsProps {
  stats: Statistics;
  onExport: () => void;
  hasResults: boolean;
  isLoading?: boolean;
}

export function QuickStats({
  stats,
  onExport,
  hasResults,
  isLoading = false,
}: QuickStatsProps) {
  const activePercentage =
    stats.checked > 0 ? ((stats.active / stats.checked) * 100).toFixed(1) : "0";
  const nonWaPercentage =
    stats.checked > 0 ? ((stats.nonWa / stats.checked) * 100).toFixed(1) : "0";

  const statCards = [
    {
      title: "Total Dicek",
      value: stats.checked,
      icon: null,
      color: "text-foreground",
      testId: "stat-total-checked",
    },
    {
      title: "Aktif di WhatsApp",
      value: stats.active,
      percentage: activePercentage,
      icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />,
      color: "text-primary",
      testId: "stat-active",
    },
    {
      title: "Tidak Terdaftar",
      value: stats.nonWa,
      percentage: nonWaPercentage,
      icon: <XCircle className="w-4 h-4" aria-hidden="true" />,
      color: "text-muted-foreground",
      testId: "stat-non-wa",
    },
    {
      title: "Error",
      value: stats.errors,
      icon: <AlertCircle className="w-4 h-4" aria-hidden="true" />,
      color: "text-destructive",
      testId: "stat-errors",
    },
  ];

  if (isLoading) {
    return (
      <div
        className="space-y-4 h-full flex flex-col"
        data-testid="container-quick-stats"
      >
        <div className="space-y-4 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-4 h-full flex flex-col"
      data-testid="container-quick-stats"
    >
      <div className="space-y-4 flex-1">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover-elevate transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {stat.icon}
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div
                  className={`text-3xl font-bold ${stat.color}`}
                  data-testid={stat.testId}
                  aria-label={`${stat.title}: ${stat.value}`}
                >
                  {stat.value}
                </div>
                {stat.percentage !== undefined && (
                  <div
                    className="text-sm text-muted-foreground"
                    aria-label={`${stat.percentage} percent`}
                  >
                    ({stat.percentage}%)
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="sticky bottom-0 bg-background pt-2">
        <Button
          className="w-full"
          variant="outline"
          onClick={onExport}
          disabled={!hasResults}
          data-testid="button-copy"
          aria-label={`Copy ${stats.checked} results to clipboard`}
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Results
        </Button>
      </div>
    </div>
  );
}
