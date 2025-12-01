import { 
  MousePointer2, Pencil, Square, Circle, Trash2, Pentagon, Type, Hand, Save, Upload, Undo2, Redo2, Copy
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { ToolType } from "@/types/canvas";
import { Separator } from "./ui/separator";

interface ToolbarProps {
  activeTool: ToolType;
  onToolClick: (tool: ToolType) => void;
  onClear: () => void;
  onSave: () => void;
  onLoad: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void; // Nueva función
  canUndo: boolean;
  canRedo: boolean;
}

export const Toolbar = ({ activeTool, onToolClick, onClear, onSave, onLoad, onUndo, onRedo, onDuplicate, canUndo, canRedo }: ToolbarProps) => {
  const tools = [
    { id: "select" as const, icon: MousePointer2, label: "Seleccionar" },
    { id: "hand" as const, icon: Hand, label: "Mover (Pan)" },
    { id: "draw" as const, icon: Pencil, label: "Dibujar" },
    { id: "rectangle" as const, icon: Square, label: "Rectángulo" },
    { id: "circle" as const, icon: Circle, label: "Asiento" },
    { id: "polygon" as const, icon: Pentagon, label: "Polígono" },
    { id: "text" as const, icon: Type, label: "Texto" },
  ];

  return (
    <div className="bg-card rounded-xl shadow-lg p-4 border border-border w-[240px] flex flex-col gap-4">
      
      {/* Historial */}
      <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onUndo} disabled={!canUndo} className="flex-1" title="Deshacer (Undo)">
              <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onRedo} disabled={!canRedo} className="flex-1" title="Rehacer (Redo)">
              <Redo2 className="h-4 w-4" />
          </Button>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Herramientas</h3>
        <div className="flex flex-col gap-2">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={activeTool === tool.id ? "default" : "outline"}
              size="sm"
              onClick={() => onToolClick(tool.id)}
              className={cn(
                "justify-start gap-3 transition-all w-full",
                activeTool === tool.id && "bg-primary text-primary-foreground shadow-md"
              )}
            >
              <tool.icon className="h-4 w-4" />
              <span className="text-xs">{tool.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Acciones</h3>
        <div className="flex flex-col gap-2">
            <Button variant="secondary" size="sm" onClick={onDuplicate} className="justify-start gap-3 w-full">
                <Copy className="h-4 w-4" />
                <span className="text-xs">Duplicar Selección</span>
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={onSave} className="justify-start gap-2">
                  <Save className="h-4 w-4" />
                  <span className="text-xs">Guardar</span>
              </Button>
              <Button variant="outline" size="sm" onClick={onLoad} className="justify-start gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="text-xs">Cargar</span>
              </Button>
            </div>
            
            <Button
                variant="destructive"
                size="sm"
                onClick={onClear}
                className="justify-start gap-3 w-full mt-2"
            >
                <Trash2 className="h-4 w-4" />
                <span className="text-xs">Limpiar Todo</span>
            </Button>
        </div>
      </div>
    </div>
  );
};