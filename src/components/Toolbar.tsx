import { MousePointer2, Pencil, Square, Circle, Trash2, Pentagon, Grid3x3, Type } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { ToolType } from "@/types/canvas";

interface ToolbarProps {
  activeTool: ToolType;
  onToolClick: (tool: ToolType) => void;
  onClear: () => void;
}

export const Toolbar = ({ activeTool, onToolClick, onClear }: ToolbarProps) => {
  const tools = [
    { id: "select" as const, icon: MousePointer2, label: "Seleccionar" },
    { id: "draw" as const, icon: Pencil, label: "Dibujar Libre" },
    { id: "rectangle" as const, icon: Square, label: "Zona Rectangular" },
    { id: "circle" as const, icon: Circle, label: "Asiento Individual" },
    { id: "polygon" as const, icon: Pentagon, label: "Forma Personalizada" },
    { id: "text" as const, icon: Type, label: "Texto/Etiqueta" },
  ];

  return (
    <div className="bg-card rounded-xl shadow-lg p-4 border border-border w-[240px]">
      <h3 className="text-sm font-semibold mb-4 text-foreground">Herramientas</h3>
      <div className="flex flex-col gap-2">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "default" : "outline"}
            size="lg"
            onClick={() => onToolClick(tool.id)}
            className={cn(
              "justify-start gap-3 transition-all",
              activeTool === tool.id && "bg-primary text-primary-foreground shadow-md"
            )}
          >
            <tool.icon className="h-5 w-5" />
            <span className="text-xs">{tool.label}</span>
          </Button>
        ))}
        <div className="h-px bg-border my-2" />
        <Button
          variant="destructive"
          size="lg"
          onClick={onClear}
          className="justify-start gap-3"
        >
          <Trash2 className="h-5 w-5" />
          <span>Limpiar Todo</span>
        </Button>
      </div>
    </div>
  );
};
