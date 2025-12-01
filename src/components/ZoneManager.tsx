import { Layers, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Zone } from "@/types/canvas";

interface ZoneManagerProps {
  zones: Zone[];
  onToggleVisibility: (zoneId: string) => void;
  onDeleteZone: (zoneId: string) => void;
  onSelectZone: (zoneId: string) => void;
}

export const ZoneManager = ({ zones, onToggleVisibility, onDeleteZone, onSelectZone }: ZoneManagerProps) => {
  return (
    <div className="bg-card rounded-xl shadow-lg p-4 border border-border w-[280px]">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Zonas Creadas</h3>
      </div>

      <ScrollArea className="h-[300px] pr-4">
        {zones.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No hay zonas creadas aún
          </p>
        ) : (
          <div className="space-y-2">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center gap-2 p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <div
                  className="w-4 h-4 rounded border border-border flex-shrink-0"
                  style={{ backgroundColor: zone.color }}
                />
                <button
                  onClick={() => onSelectZone(zone.id)}
                  className="flex-1 text-left text-sm text-foreground hover:text-primary transition-colors"
                >
                  <div className="font-medium">{zone.name || "Sin nombre"}</div>
                  {zone.price && (
                    <div className="text-xs text-muted-foreground">${zone.price}</div>
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onToggleVisibility(zone.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => onDeleteZone(zone.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
