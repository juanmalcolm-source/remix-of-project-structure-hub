import { Card, CardContent } from "@/components/ui/card";
import { Film, MapPin, Calendar, Sun, Moon, Users, Clock } from "lucide-react";

interface ShootingPlanStatsProps {
  totalScenes: number;
  totalEighths: number;
  totalDays: number;
  uniqueLocations: number;
  dayDays: number;
  nightDays: number;
  totalCharacters: number;
  avgEighthsPerDay: number;
}

export function ShootingPlanStats({
  totalScenes,
  totalEighths,
  totalDays,
  uniqueLocations,
  dayDays,
  nightDays,
  totalCharacters,
  avgEighthsPerDay,
}: ShootingPlanStatsProps) {
  const stats = [
    {
      label: "Escenas",
      value: totalScenes,
      icon: <Film className="h-5 w-5" />,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Localizaciones",
      value: uniqueLocations,
      icon: <MapPin className="h-5 w-5" />,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Octavos totales",
      value: `${totalEighths.toFixed(0)}/8`,
      icon: <Clock className="h-5 w-5" />,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Días de rodaje",
      value: totalDays,
      icon: <Calendar className="h-5 w-5" />,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Días (DÍA)",
      value: dayDays,
      icon: <Sun className="h-5 w-5" />,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Días (NOCHE)",
      value: nightDays,
      icon: <Moon className="h-5 w-5" />,
      color: "text-indigo-400",
      bgColor: "bg-indigo-400/10",
    },
    {
      label: "Personajes",
      value: totalCharacters,
      icon: <Users className="h-5 w-5" />,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      label: "Media oct./día",
      value: avgEighthsPerDay.toFixed(1),
      icon: <Clock className="h-5 w-5" />,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="overflow-hidden">
          <CardContent className="p-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${stat.bgColor} ${stat.color} mb-2`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
