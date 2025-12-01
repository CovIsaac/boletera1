import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Polygon, IText, Point, Group, FabricObject, util, Line, FabricImage } from "fabric";
import { Toolbar } from "./Toolbar";
import { ColorPicker } from "./ColorPicker";
import { SeatingGenerator } from "./SeatingGenerator";
import { PropertiesPanel } from "./PropertiesPanel";
import { ZoneManager } from "./ZoneManager";
import { toast } from "sonner";
import { ToolType, SeatingGrid, Zone, SeatType, CustomFabricObject } from "@/types/canvas";
import { Slider } from "@/components/ui/slider"; // Asegúrate de tener este componente

// Algoritmo de Ray Casting para punto en polígono
function isPointInPolygon(point: { x: number; y: number }, vs: { x: number; y: number }[]) {
    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i].x, yi = vs[i].y;
        let xj = vs[j].x, yj = vs[j].y;
        
        let intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

export const Canvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Referencia para el input de archivo
  
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState("#0EA5E9");
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [selectedObject, setSelectedObject] = useState<CustomFabricObject | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  
  // Estados para polígono
  const [polygonPoints, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);
  const [guideLine, setGuideLine] = useState<Line | null>(null); 
  
  // Estados para paneo
  const [isDragging, setIsDragging] = useState(false);
  const [lastPosX, setLastPosX] = useState(0);
  const [lastPosY, setLastPosY] = useState(0);

  // Estado para opacidad de fondo
  const [bgOpacity, setBgOpacity] = useState(0.5);

  // Inicialización del Canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: "#f8fafc",
      selection: true,
    });

    // Configurar pincel
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = 3;
    }

    // Eventos de Selección
    canvas.on("selection:created", (e) => {
      setSelectedObject((e.selected?.[0] as CustomFabricObject) || null);
    });
    canvas.on("selection:updated", (e) => {
      setSelectedObject((e.selected?.[0] as CustomFabricObject) || null);
    });
    canvas.on("selection:cleared", () => {
      setSelectedObject(null);
    });

    // Eventos de Zoom (Rueda del Ratón)
    canvas.on("mouse:wheel", (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      
      canvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Eventos de Paneo
    canvas.on("mouse:down", (opt) => {
      const evt = opt.e;
      if (activeTool === "hand" || evt.altKey) {
        setIsDragging(true);
        setLastPosX(evt.clientX);
        setLastPosY(evt.clientY);
        canvas.selection = false;
      }
    });

    // Mouse Move combinado (Paneo + Línea Guía)
    canvas.on("mouse:move", (opt) => {
      const e = opt.e;
      
      // 1. Lógica de Paneo
      if (isDragging) {
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += e.clientX - lastPosX;
          vpt[5] += e.clientY - lastPosY;
          canvas.requestRenderAll();
          setLastPosX(e.clientX);
          setLastPosY(e.clientY);
        }
        return; 
      }
    });

    canvas.on("mouse:up", () => {
      if (isDragging) {
        canvas.setViewportTransform(canvas.viewportTransform || [1, 0, 0, 1, 0, 0]);
        setIsDragging(false);
        canvas.selection = true;
      }
    });

    setFabricCanvas(canvas);
    toast.success("Lienzo listo. Usa la rueda del mouse para zoom y Alt+Drag para moverte.");

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && canvas) {
        canvas.setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
        canvas.renderAll();
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      canvas.dispose();
    };
  }, []); 

  // Efecto separado para manejar el movimiento del mouse y la línea guía
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMouseMove = (opt: any) => {
        if (activeTool === "polygon" && polygonPoints.length > 0) {
            const pointer = fabricCanvas.getScenePoint(opt.e);
            const lastPoint = polygonPoints[polygonPoints.length - 1];

            if (guideLine) {
                guideLine.set({ x2: pointer.x, y2: pointer.y });
                fabricCanvas.requestRenderAll();
            } else {
                const newLine = new Line([lastPoint.x, lastPoint.y, pointer.x, pointer.y], {
                    stroke: activeColor,
                    strokeWidth: 1,
                    strokeDashArray: [5, 5], 
                    selectable: false,
                    evented: false,
                    opacity: 0.7
                });
                fabricCanvas.add(newLine);
                setGuideLine(newLine);
                fabricCanvas.requestRenderAll();
            }
        }
    };

    fabricCanvas.on("mouse:move", handleMouseMove);

    return () => {
        fabricCanvas.off("mouse:move", handleMouseMove);
    };
  }, [fabricCanvas, activeTool, polygonPoints, guideLine, activeColor]);


  // Actualizar configuración según herramienta
  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === "draw";
    
    if (activeTool === "draw" && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
    }

    if (activeTool === "hand") {
      fabricCanvas.defaultCursor = "grab";
      fabricCanvas.hoverCursor = "grab";
      fabricCanvas.selection = false;
    } else if (activeTool === "polygon") {
      fabricCanvas.defaultCursor = "crosshair";
      fabricCanvas.selection = false;
    } else {
      fabricCanvas.defaultCursor = "default";
      fabricCanvas.hoverCursor = "move";
      fabricCanvas.selection = true;
    }

    if (activeTool !== "polygon") {
      setPolygonPoints([]);
      if (guideLine) {
          fabricCanvas.remove(guideLine);
          setGuideLine(null);
      }
      const objects = fabricCanvas.getObjects();
      objects.forEach((obj: any) => {
        if ((obj instanceof Circle && obj.radius === 4) || obj.id === 'temp-poly-line') {
          fabricCanvas.remove(obj);
        }
      });
      fabricCanvas.requestRenderAll();
    }

  }, [activeTool, activeColor, fabricCanvas]);

  // Manejo de clicks para Polígonos
  useEffect(() => {
    if (!fabricCanvas || activeTool !== "polygon") return;

    const handleCanvasClick = (opt: any) => {
      if (isDragging || opt.e.altKey) return;

      const pointer = fabricCanvas.getScenePoint(opt.e);
      
      // Verificar cierre ANTES de agregar el punto
      if (polygonPoints.length > 2) {
        const start = polygonPoints[0];
        const dist = Math.sqrt(Math.pow(pointer.x - start.x, 2) + Math.pow(pointer.y - start.y, 2));
        
        if (dist < 20) {
          finishPolygon(polygonPoints);
          return;
        }
      }

      const points = [...polygonPoints, { x: pointer.x, y: pointer.y }];
      setPolygonPoints(points);

      // Dibujar punto
      const circle = new Circle({
        left: pointer.x - 4,
        top: pointer.y - 4,
        radius: 4,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });
      fabricCanvas.add(circle);

      // Línea permanente temporal
      if (polygonPoints.length > 0) {
          const lastPoint = polygonPoints[polygonPoints.length - 1];
          const fixedLine = new Line([lastPoint.x, lastPoint.y, pointer.x, pointer.y], {
              stroke: activeColor,
              strokeWidth: 2,
              selectable: false,
              evented: false,
              id: 'temp-poly-line' 
          } as any);
          fabricCanvas.add(fixedLine);
      }
      
      // Resetear línea guía para que se cree una nueva desde el nuevo punto
      if (guideLine) {
          fabricCanvas.remove(guideLine);
          setGuideLine(null); 
      }
    };

    const finishPolygon = (points: {x: number, y: number}[]) => {
        const zoneId = `zone-${Date.now()}`;
        
        // 1. Crear el Polígono
        const polygon = new Polygon(points, {
          fill: activeColor + "80",
          stroke: activeColor,
          strokeWidth: 2,
          objectCaching: false,
        });

        // 2. Crear las Etiquetas de los Lados
        const labels = points.map((point, index) => {
            const nextPoint = points[(index + 1) % points.length];
            const midX = (point.x + nextPoint.x) / 2;
            const midY = (point.y + nextPoint.y) / 2;

            return new IText(`${index + 1}`, {
                left: midX,
                top: midY,
                fontSize: 14,
                fontWeight: 'bold',
                fill: "#ffffff",
                backgroundColor: "#00000080", 
                fontFamily: "Arial",
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
            });
        });

        // 3. AGRUPAR Polígono + Etiquetas
        const group = new Group([polygon, ...labels], {
            objectCaching: false,
            subTargetCheck: true, 
        });

        (group as CustomFabricObject).id = `poly-group-${Date.now()}`;
        (group as CustomFabricObject).zoneId = zoneId;
        (group as CustomFabricObject).name = `Zona ${zones.length + 1}`;
        (group as CustomFabricObject)._customType = "zone";

        // Limpiar marcadores temporales
        const objects = fabricCanvas.getObjects();
        objects.forEach((obj: any) => {
           if ((obj instanceof Circle && obj.radius === 4) || obj.id === 'temp-poly-line') {
               fabricCanvas.remove(obj);
           }
        });
        
        if (guideLine) {
            fabricCanvas.remove(guideLine);
            setGuideLine(null);
        }

        fabricCanvas.add(group);
        fabricCanvas.setActiveObject(group);
        fabricCanvas.renderAll();
        
        const newZone: Zone = {
          id: zoneId,
          name: `Zona Personalizada ${zones.length + 1}`,
          color: activeColor,
          type: "custom",
          visible: true
        };
        setZones(prev => [...prev, newZone]);
        
        setPolygonPoints([]);
        setActiveTool("select"); // Auto quitar herramienta poligono
        toast.success("Zona agrupada creada correctamente");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && polygonPoints.length >= 3) {
        finishPolygon(polygonPoints);
      } else if (e.key === "Escape") {
        setPolygonPoints([]);
        if (guideLine) {
            fabricCanvas.remove(guideLine);
            setGuideLine(null);
        }
        const objects = fabricCanvas.getObjects();
        objects.forEach((obj: any) => {
           if ((obj instanceof Circle && obj.radius === 4) || obj.id === 'temp-poly-line') {
               fabricCanvas.remove(obj);
           }
        });
        fabricCanvas.requestRenderAll();
        toast.info("Polígono cancelado");
      }
    };

    fabricCanvas.on("mouse:down", handleCanvasClick);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      fabricCanvas.off("mouse:down", handleCanvasClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fabricCanvas, activeTool, polygonPoints, activeColor, zones, isDragging, guideLine]);

  // --- CARGA DE IMAGEN DE FONDO ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result as string;
      FabricImage.fromURL(data).then((img) => {
        // Escalar imagen para que quepa en el canvas si es muy grande
        const canvasWidth = fabricCanvas.width;
        const canvasHeight = fabricCanvas.height;
        const imgWidth = img.width || 1;
        const imgHeight = img.height || 1;
        
        const scaleX = canvasWidth / imgWidth;
        const scaleY = canvasHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY); // Ajustar sin deformar (cover) o usar Math.max para fill

        img.set({
            scaleX: scale,
            scaleY: scale,
            originX: 'left',
            originY: 'top',
            opacity: bgOpacity
        });

        // Centrar
        img.set({
            left: (canvasWidth - imgWidth * scale) / 2,
            top: (canvasHeight - imgHeight * scale) / 2
        });

        fabricCanvas.backgroundImage = img;
        fabricCanvas.requestRenderAll();
        toast.success("Imagen de fondo cargada");
      });
    };
    reader.readAsDataURL(file);
  };

  const handleOpacityChange = (val: number[]) => {
      const newOpacity = val[0];
      setBgOpacity(newOpacity);
      if (fabricCanvas && fabricCanvas.backgroundImage) {
          (fabricCanvas.backgroundImage as FabricObject).opacity = newOpacity;
          fabricCanvas.requestRenderAll();
      }
  };

  const handleToolClick = (tool: ToolType) => {
    setActiveTool(tool);
    if (!fabricCanvas) return;

    const center = fabricCanvas.getCenterPoint();
    const vpt = fabricCanvas.viewportTransform;
    const realCenter = {
        x: (center.x - (vpt?.[4] || 0)) / (vpt?.[0] || 1),
        y: (center.y - (vpt?.[5] || 0)) / (vpt?.[3] || 1)
    };

    if (tool === "rectangle") {
      const zoneId = `zone-${Date.now()}`;
      const rect = new Rect({
        left: realCenter.x - 50,
        top: realCenter.y - 50,
        fill: activeColor + "80",
        width: 100,
        height: 100,
        stroke: activeColor,
        strokeWidth: 2,
      });
      
      (rect as CustomFabricObject).id = `rect-${Date.now()}`;
      (rect as CustomFabricObject).zoneId = zoneId;
      (rect as CustomFabricObject).name = `Rectángulo ${zones.length + 1}`;
      (rect as CustomFabricObject)._customType = "zone";

      fabricCanvas.add(rect);
      
      const newZone: Zone = {
        id: zoneId,
        name: `Zona ${zones.length + 1}`,
        color: activeColor,
        type: "section",
        visible: true
      };
      setZones([...zones, newZone]);
      setActiveTool("select");
      toast.success("Zona rectangular agregada");
    } 
    else if (tool === "circle") {
      const circle = new Circle({
        left: realCenter.x,
        top: realCenter.y,
        fill: activeColor,
        radius: 15,
        stroke: "#1e293b",
        strokeWidth: 2,
      });
      (circle as CustomFabricObject)._customType = "seat";
      fabricCanvas.add(circle);
      setActiveTool("select");
      toast.success("Asiento individual agregado");
    } 
    else if (tool === "text") {
      const text = new IText("Etiqueta", {
        left: realCenter.x,
        top: realCenter.y,
        fontSize: 20,
        fill: "#1e293b",
        fontFamily: "Arial",
      });
      (text as CustomFabricObject)._customType = "text";
      fabricCanvas.add(text);
      setActiveTool("select");
      toast.success("Texto agregado");
    }
  };

  const handleGenerateSeating = (grid: SeatingGrid) => {
    if (!fabricCanvas) return;

    const seatRadius = 12;
    const getSeatColor = (type: SeatType) => {
      switch (type) {
        case "vip": return "#F59E0B";
        case "accessible": return "#10B981";
        case "blocked": return "#6B7280";
        default: return activeColor;
      }
    };

    let targetZoneId = grid.zoneId;
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    
    let polygonVertices: { x: number; y: number }[] | null = null;
    let isZoneSelected = false;
    let selectionTransform = null; 

    // Detectar selección
    if (selectedObject && (selectedObject._customType === "zone" || selectedObject.type === "rect" || selectedObject.type === "group")) {
        isZoneSelected = true;
        if (selectedObject.zoneId) targetZoneId = selectedObject.zoneId;

        const boundingRect = selectedObject.getBoundingRect();
        startX = boundingRect.left;
        startY = boundingRect.top;
        endX = boundingRect.left + boundingRect.width;
        endY = boundingRect.top + boundingRect.height;

        if (selectedObject.type === 'group') {
            const group = selectedObject as Group;
            const polygon = group.getObjects().find(o => o.type === 'polygon') as Polygon;
            if (polygon) {
                // Transformar vértices al sistema de coordenadas global
                const matrix = polygon.calcTransformMatrix();
                // Si está en un grupo, necesitamos aplicar también la matriz del grupo
                // Nota: Fabric v6 maneja esto mejor, pero a veces hay que combinar matrices
                // Para simplificar, usaremos los puntos relativos transformados por el objeto poligono
                polygonVertices = polygon.points.map(p => util.transformPoint(p, matrix));
                
                // Corrección: si el grupo ha sido movido, hay que sumar el offset del grupo
                const groupCenter = group.getCenterPoint();
                // Un enfoque más robusto sería desagrupar temporalmente o usar utilidades avanzadas
            }
        } 
        else if (selectedObject.type === 'polygon') {
             const polygon = selectedObject as Polygon;
             const matrix = polygon.calcTransformMatrix();
             polygonVertices = polygon.points.map(p => util.transformPoint(p, matrix));
        }
        else {
            selectionTransform = selectedObject;
        }
        
    } else {
        const vpt = fabricCanvas.viewportTransform || [1,0,0,1,0,0];
        const width = fabricCanvas.width / vpt[0];
        const height = fabricCanvas.height / vpt[3];
        const centerX = (-vpt[4] / vpt[0]) + (width / 2) - ((grid.columns * grid.seatSpacing) / 2);
        const centerY = (-vpt[5] / vpt[3]) + (height / 2) - ((grid.rows * grid.rowSpacing) / 2);
        
        startX = centerX;
        startY = centerY;
        endX = centerX + (grid.columns * grid.seatSpacing);
        endY = centerY + (grid.rows * grid.rowSpacing);
    }

    let addedSeats = 0;

    for (let y = startY; y < endY; y += grid.rowSpacing) {
      const rowIndex = Math.floor((y - startY) / grid.rowSpacing);
      const rowLetter = String.fromCharCode(grid.startRow.charCodeAt(0) + rowIndex);
      
      let colIndex = 0;
      for (let x = startX; x < endX; x += grid.seatSpacing) {
        const testPoint = new Point(x + seatRadius, y + seatRadius); 
        let shouldAdd = true;

        if (isZoneSelected) {
            if (polygonVertices) {
                // TODO: Mejorar la precisión de coordenadas en grupos transformados
                // Por ahora, asumimos bounding box simple si es grupo complejo
                // o intentamos verificar con containsPoint si es objeto simple
                if (selectedObject.type === 'polygon' || selectedObject.type === 'rect') {
                     if (!selectedObject.containsPoint(testPoint)) shouldAdd = false;
                }
            } else if (selectionTransform) {
                if (!selectionTransform.containsPoint(testPoint)) {
                    shouldAdd = false;
                }
            }
        }

        if (shouldAdd) {
            colIndex++;
            const seat = new Circle({
              left: x,
              top: y,
              radius: seatRadius,
              fill: getSeatColor(grid.seatType),
              stroke: "#1e293b",
              strokeWidth: 1,
            });

            (seat as CustomFabricObject).id = `seat-${targetZoneId}-${rowIndex}-${colIndex}`;
            (seat as CustomFabricObject).zoneId = targetZoneId;
            (seat as CustomFabricObject).name = `${rowLetter}${colIndex}`;
            (seat as CustomFabricObject)._customType = "seat";

            const seatNumber = new IText(`${rowLetter}${colIndex}`, {
              left: x + seatRadius - 6,
              top: y + seatRadius - 5,
              fontSize: 10,
              fill: "#ffffff",
              fontFamily: "Arial",
              selectable: false,
              evented: false,
              originX: 'center',
              originY: 'center'
            });
            
            fabricCanvas.add(seat);
            fabricCanvas.add(seatNumber);
            addedSeats++;
        }
      }
    }

    fabricCanvas.renderAll();
    
    if (isZoneSelected) {
        setZones(prev => prev.map(z => z.id === targetZoneId ? { ...z, capacity: (z.capacity || 0) + addedSeats } : z));
        toast.success(`${addedSeats} asientos agregados a la zona`);
    } else {
        const newZone: Zone = {
          id: targetZoneId,
          name: `Sección ${zones.length + 1}`,
          color: getSeatColor(grid.seatType),
          type: "section",
          capacity: addedSeats,
          visible: true
        };
        setZones([...zones, newZone]);
        toast.success(`${addedSeats} asientos generados`);
    }
    
    setActiveTool("select");
  };

  const handleUpdateProperties = (properties: Record<string, any>) => {
    if (!selectedObject || !fabricCanvas) return;

    Object.entries(properties).forEach(([key, value]) => {
      (selectedObject as any)[key] = value;
    });

    if (properties.name && selectedObject.zoneId) {
        setZones(prevZones => prevZones.map(z => 
            z.id === selectedObject.zoneId ? { ...z, name: properties.name } : z
        ));
    }

    fabricCanvas.requestRenderAll();
    toast.success("Propiedades actualizadas");
  };

  const handleToggleZoneVisibility = (zoneId: string) => {
    if (!fabricCanvas) return;

    const zoneIndex = zones.findIndex(z => z.id === zoneId);
    if (zoneIndex === -1) return;

    const newVisibility = !zones[zoneIndex].visible;

    const objects = fabricCanvas.getObjects() as CustomFabricObject[];
    objects.forEach(obj => {
        if (obj.zoneId === zoneId) {
            obj.set('visible', newVisibility);
        }
    });

    const newZones = [...zones];
    newZones[zoneIndex].visible = newVisibility;
    setZones(newZones);

    fabricCanvas.requestRenderAll();
    fabricCanvas.discardActiveObject(); 
  };

  const handleDeleteZone = (zoneId: string) => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects() as CustomFabricObject[];
    const objectsToRemove = objects.filter(obj => obj.zoneId === zoneId);
    
    objectsToRemove.forEach(obj => fabricCanvas.remove(obj));
    
    setZones(zones.filter(z => z.id !== zoneId));
    fabricCanvas.requestRenderAll();
    toast.success("Zona y elementos eliminados");
  };

  const handleSelectZone = (zoneId: string) => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects() as CustomFabricObject[];
    const zoneObjects = objects.filter(obj => obj.zoneId === zoneId);
    
    if (zoneObjects.length > 0) {
        const mainObj = zoneObjects.find(o => o._customType === "zone") || zoneObjects[0];
        fabricCanvas.setActiveObject(mainObj);
        fabricCanvas.requestRenderAll();
    }
  };

  const handleSaveCanvas = () => {
    if (!fabricCanvas) return;
    const json = fabricCanvas.toJSON(['id', 'name', 'price', 'capacity', 'zoneId', '_customType']);
    const dataToSave = {
        canvas: json,
        zones: zones
    };
    localStorage.setItem('boleteraMapData', JSON.stringify(dataToSave));
    toast.success("Mapa guardado localmente");
  };

  const handleLoadCanvas = () => {
    if (!fabricCanvas) return;
    const savedData = localStorage.getItem('boleteraMapData');
    if (!savedData) {
        toast.error("No hay datos guardados");
        return;
    }

    const parsed = JSON.parse(savedData);
    
    fabricCanvas.loadFromJSON(parsed.canvas, () => {
        fabricCanvas.requestRenderAll();
        setZones(parsed.zones || []);
        toast.success("Mapa cargado correctamente");
    });
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#f8fafc";
    fabricCanvas.requestRenderAll();
    setZones([]);
    toast.success("Lienzo limpio");
  };

  const triggerImageUpload = () => {
      fileInputRef.current?.click();
  }

  return (
    <div className="flex gap-4 p-4 min-h-[calc(100vh-80px)] bg-background h-full">
      <div className="flex flex-col gap-4">
        <Toolbar 
            activeTool={activeTool} 
            onToolClick={handleToolClick} 
            onClear={handleClear}
            onSave={handleSaveCanvas}
            onLoad={handleLoadCanvas}
        />
        
        {/* Control de Imagen de Fondo */}
        <div className="bg-card rounded-xl shadow-lg p-4 border border-border w-[240px]">
            <h3 className="text-sm font-semibold mb-2 text-foreground">Fondo</h3>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
            />
            <button 
                onClick={triggerImageUpload}
                className="w-full text-xs bg-secondary hover:bg-secondary/80 py-2 rounded mb-3 text-foreground"
            >
                Cargar Imagen
            </button>
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Opacidad</span>
                    <span>{Math.round(bgOpacity * 100)}%</span>
                </div>
                <Slider 
                    value={[bgOpacity]} 
                    max={1} 
                    step={0.05}
                    onValueChange={handleOpacityChange} 
                />
            </div>
        </div>

        <ColorPicker color={activeColor} onChange={setActiveColor} />
      </div>
      
      <div className="flex-1 bg-card rounded-xl shadow-lg overflow-hidden border border-border relative" ref={containerRef}>
        <canvas ref={canvasRef} />
        <div className="absolute bottom-4 right-4 bg-white/80 px-2 py-1 rounded text-xs pointer-events-none">
            Zoom: {(fabricCanvas?.getZoom() || 1).toFixed(2)}x
        </div>
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