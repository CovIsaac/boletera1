import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Polygon, IText, FabricObject } from "fabric";
import { Toolbar } from "./Toolbar";
import { ColorPicker } from "./ColorPicker";
import { SeatingGenerator } from "./SeatingGenerator";
import { PropertiesPanel } from "./PropertiesPanel";
import { ZoneManager } from "./ZoneManager";
import { toast } from "sonner";
import { ToolType, SeatingGrid, Zone, SeatType } from "@/types/canvas";

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState("#0EA5E9");
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth - 640,
      height: window.innerHeight - 120,
      backgroundColor: "#ffffff",
    });

    // Enable drawing mode temporarily to initialize the brush
    canvas.isDrawingMode = true;
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = 3;
    }
    canvas.isDrawingMode = false;

    // Selection event handlers
    canvas.on("selection:created", (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on("selection:updated", (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on("selection:cleared", () => {
      setSelectedObject(null);
    });

    setFabricCanvas(canvas);
    toast.success("Canvas listo - ¡Comienza a crear tu mapa de asientos!");

    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth - 640,
        height: window.innerHeight - 120,
      });
      canvas.renderAll();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === "draw";
    
    if (activeTool === "draw" && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = 3;
    }

    // Handle polygon drawing
    if (activeTool === "polygon") {
      fabricCanvas.defaultCursor = "crosshair";
      fabricCanvas.hoverCursor = "crosshair";
    } else {
      fabricCanvas.defaultCursor = "default";
      fabricCanvas.hoverCursor = "move";
      setIsDrawingPolygon(false);
      setPolygonPoints([]);
    }
  }, [activeTool, activeColor, fabricCanvas]);

  // Handle polygon clicks
  useEffect(() => {
    if (!fabricCanvas || activeTool !== "polygon") return;

    const handleCanvasClick = (e: any) => {
      if (!e.pointer) return;

      const newPoint = { x: e.pointer.x, y: e.pointer.y };
      const updatedPoints = [...polygonPoints, newPoint];
      setPolygonPoints(updatedPoints);

      // Draw temporary circles to show points
      const circle = new Circle({
        left: newPoint.x - 3,
        top: newPoint.y - 3,
        radius: 3,
        fill: activeColor,
        selectable: false,
        evented: false,
      });
      fabricCanvas.add(circle);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && polygonPoints.length >= 3) {
        // Create polygon
        const polygon = new Polygon(polygonPoints, {
          fill: activeColor + "80", // Semi-transparent
          stroke: activeColor,
          strokeWidth: 2,
          objectCaching: false,
        });

        // Remove temporary circles
        const objects = fabricCanvas.getObjects();
        objects.forEach((obj) => {
          if (obj instanceof Circle && obj.radius === 3) {
            fabricCanvas.remove(obj);
          }
        });

        fabricCanvas.add(polygon);
        fabricCanvas.renderAll();

        const newZone: Zone = {
          id: `zone-${Date.now()}`,
          name: `Zona Personalizada ${zones.length + 1}`,
          color: activeColor,
          type: "custom",
        };
        setZones([...zones, newZone]);

        toast.success("Zona personalizada creada - Presiona Enter para finalizar otra");
        setPolygonPoints([]);
      } else if (e.key === "Escape") {
        // Cancel polygon drawing
        const objects = fabricCanvas.getObjects();
        objects.forEach((obj) => {
          if (obj instanceof Circle && obj.radius === 3) {
            fabricCanvas.remove(obj);
          }
        });
        fabricCanvas.renderAll();
        setPolygonPoints([]);
        toast.info("Polígono cancelado");
      }
    };

    fabricCanvas.on("mouse:down", handleCanvasClick);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      fabricCanvas.off("mouse:down", handleCanvasClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fabricCanvas, activeTool, polygonPoints, activeColor, zones]);

  const handleToolClick = (tool: ToolType) => {
    setActiveTool(tool);

    if (tool === "rectangle") {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: activeColor + "80",
        width: 200,
        height: 150,
        stroke: activeColor,
        strokeWidth: 3,
      });
      fabricCanvas?.add(rect);
      
      const newZone: Zone = {
        id: `zone-${Date.now()}`,
        name: `Zona ${zones.length + 1}`,
        color: activeColor,
        type: "section",
      };
      setZones([...zones, newZone]);
      toast.success("Zona rectangular agregada");
    } else if (tool === "circle") {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: activeColor,
        radius: 15,
        stroke: "#1e293b",
        strokeWidth: 2,
      });
      fabricCanvas?.add(circle);
      toast.success("Asiento agregado");
    } else if (tool === "text") {
      const text = new IText("Etiqueta", {
        left: 100,
        top: 100,
        fontSize: 20,
        fill: "#1e293b",
        fontFamily: "Arial",
      });
      fabricCanvas?.add(text);
      toast.success("Texto agregado - Haz doble clic para editar");
    } else if (tool === "polygon") {
      toast.info("Haz clic para agregar puntos. Presiona Enter para finalizar o Escape para cancelar");
    }
  };

  const handleGenerateSeating = (grid: SeatingGrid) => {
    if (!fabricCanvas) return;

    const startX = 100;
    const startY = 100;
    const seatRadius = 12;

    const getSeatColor = (type: SeatType) => {
      switch (type) {
        case "vip": return "#F59E0B";
        case "accessible": return "#10B981";
        case "blocked": return "#6B7280";
        default: return activeColor;
      }
    };

    for (let row = 0; row < grid.rows; row++) {
      const rowLetter = String.fromCharCode(grid.startRow.charCodeAt(0) + row);
      
      for (let col = 0; col < grid.columns; col++) {
        const x = startX + (col * grid.seatSpacing);
        const y = startY + (row * grid.rowSpacing);

        // Create seat circle
        const seat = new Circle({
          left: x,
          top: y,
          radius: seatRadius,
          fill: getSeatColor(grid.seatType),
          stroke: "#1e293b",
          strokeWidth: 2,
        });

        // Add seat number text
        const seatNumber = new IText(`${rowLetter}${col + 1}`, {
          left: x + seatRadius - 8,
          top: y + seatRadius - 8,
          fontSize: 10,
          fill: "#ffffff",
          fontFamily: "Arial",
          selectable: false,
          evented: false,
        });

        fabricCanvas.add(seat);
        fabricCanvas.add(seatNumber);
      }
    }

    fabricCanvas.renderAll();
    
    const newZone: Zone = {
      id: grid.zoneId,
      name: `Sección ${zones.length + 1} (${grid.rows}x${grid.columns})`,
      color: getSeatColor(grid.seatType),
      type: "section",
      capacity: grid.rows * grid.columns,
    };
    setZones([...zones, newZone]);

    toast.success(`${grid.rows * grid.columns} asientos generados correctamente`);
    setActiveTool("select");
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    setZones([]);
    toast.success("Canvas limpiado");
  };

  const handleUpdateProperties = (properties: Record<string, any>) => {
    if (!selectedObject || !fabricCanvas) return;

    Object.entries(properties).forEach(([key, value]) => {
      (selectedObject as any)[key] = value;
    });

    fabricCanvas.renderAll();
    toast.success("Propiedades actualizadas");
  };

  const handleToggleZoneVisibility = (zoneId: string) => {
    // Implementation for toggling zone visibility
    toast.info("Función de visibilidad en desarrollo");
  };

  const handleDeleteZone = (zoneId: string) => {
    setZones(zones.filter(z => z.id !== zoneId));
    toast.success("Zona eliminada");
  };

  const handleSelectZone = (zoneId: string) => {
    toast.info("Zona seleccionada");
  };

  return (
    <div className="flex gap-4 p-4 min-h-screen bg-background">
      <div className="flex flex-col gap-4">
        <Toolbar activeTool={activeTool} onToolClick={handleToolClick} onClear={handleClear} />
        <ColorPicker color={activeColor} onChange={setActiveColor} />
      </div>
      
      <div className="flex-1 bg-card rounded-xl shadow-lg overflow-hidden border border-border">
        <canvas ref={canvasRef} />
      </div>

      <div className="flex flex-col gap-4">
        <SeatingGenerator onGenerate={handleGenerateSeating} />
        <PropertiesPanel selectedObject={selectedObject} onUpdate={handleUpdateProperties} />
        <ZoneManager 
          zones={zones}
          onToggleVisibility={handleToggleZoneVisibility}
          onDeleteZone={handleDeleteZone}
          onSelectZone={handleSelectZone}
        />
      </div>
    </div>
  );
};
