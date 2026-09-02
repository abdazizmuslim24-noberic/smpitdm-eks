import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { resolveIcon, type IconName } from "@/lib/icons";

interface StatCardProps {
  label: string;
  value: string;
  icon: IconName;
  hint?: string;
  className?: string;
}

export function StatCard({ label, value, icon, hint, className }: StatCardProps) {
  const Icon = resolveIcon(icon);
  return (
    <Card className={cn("border-l-4", className)}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
          {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
