import { Layers, Eye, EyeOff, Trash2, MapPin, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Zone } from "@/types/canvas";

interface ZoneManagerProps {
  zones: Zone[];
  onToggleVisibility: (zoneId: string) => void;
  onDeleteZone: (zoneId: string) => void;
  onSelectZone: (zoneId: string) => void;
  onMoveLayer: (zoneId: string, dir: 'up' | 'down' | 'top' | 'bottom') => void;
}

export const ZoneManager = ({ zones, onToggleVisibility, onDeleteZone, onSelectZone, onMoveLayer }: ZoneManagerProps) => {
  return (
    <div className="bg-card rounded-xl shadow-lg p-4 border border-border w-[280px]">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Capas y Zonas</h3>
      </div>

      <ScrollArea className="h-[300px] pr-4">
        {zones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
            <MapPin className="h-8 w-8 opacity-20" />
            <p className="text-xs text-center">
              No hay zonas creadas.<br/>Dibuja o genera asientos.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...zones].reverse().map((zone) => (
              <div
                key={zone.id}
                className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors group"
                onClick={() => onSelectZone(zone.id)} // Click en todo el item selecciona
                role="button"
                tabIndex={0}
              >
                <div
                  className="w-3 h-3 rounded-full border border-border flex-shrink-0"
                  style={{ backgroundColor: zone.color }}
                />
                
                <div className="flex-1 text-left text-sm text-foreground truncate cursor-pointer">
                  <div className="font-medium truncate">{zone.name || "Sin nombre"}</div>
                </div>

                <div className="flex gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col mr-1">
                        <Button variant="ghost" size="icon" className="h-3 w-4 p-0" onClick={(e) => { e.stopPropagation(); onMoveLayer(zone.id, 'up'); }} title="Subir capa">
                            <ArrowUp className="h-2 w-2" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-3 w-4 p-0" onClick={(e) => { e.stopPropagation(); onMoveLayer(zone.id, 'down'); }} title="Bajar capa">
                            <ArrowDown className="h-2 w-2" />
                        </Button>
                    </div>

                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onToggleVisibility(zone.id); }}>
                        {zone.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); onDeleteZone(zone.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};