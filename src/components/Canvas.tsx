import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Polygon, IText, Point, Group, FabricObject, util, Line, FabricImage, ActiveSelection } from "fabric";
import { Toolbar } from "./Toolbar";
import { ColorPicker } from "./ColorPicker";
import { SeatingGenerator } from "./SeatingGenerator";
import { PropertiesPanel } from "./PropertiesPanel";
import { ZoneManager } from "./ZoneManager";
import { toast } from "sonner";
import { ToolType, SeatingGrid, Zone, SeatType, CustomFabricObject, CanvasState } from "@/types/canvas";
import { Slider } from "@/components/ui/slider";

// Constantes para Snapping
const SNAP_THRESHOLD = 15;

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState("#0EA5E9");
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  
  const [selectedObjects, setSelectedObjects] = useState<CustomFabricObject[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  
  const [polygonPoints, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);
  const [guideLine, setGuideLine] = useState<Line | null>(null); 
  
  const [isDragging, setIsDragging] = useState(false);
  const [lastPosX, setLastPosX] = useState(0);
  const [lastPosY, setLastPosY] = useState(0);

  const [bgOpacity, setBgOpacity] = useState(0.5);

  const [history, setHistory] = useState<CanvasState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isHistoryLocked = useRef(false); 

  const saveHistory = useCallback(() => {
      if (!fabricCanvas || isHistoryLocked.current) return;
      
      const json = fabricCanvas.toJSON(['id', 'name', 'price', 'capacity', 'zoneId', '_customType']);
      const currentState: CanvasState = {
          canvasJSON: json,
          zones: [...zones] 
      };

      setHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(currentState);
          if (newHistory.length > 50) newHistory.shift(); 
          return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 1, 49)); 
  }, [fabricCanvas, zones, historyIndex]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: "#f8fafc",
      selection: true,
      preserveObjectStacking: true, 
    });

    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = 3;
    }

    const handleSelection = () => {
        const selection = canvas.getActiveObjects() as CustomFabricObject[];
        setSelectedObjects(selection || []);
    };

    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", () => setSelectedObjects([]));

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

    canvas.on("mouse:down", (opt) => {
      const evt = opt.e;
      if (activeTool === "hand" || evt.altKey) {
        setIsDragging(true);
        setLastPosX(evt.clientX);
        setLastPosY(evt.clientY);
        canvas.selection = false;
      }
    });

    canvas.on("object:modified", () => saveHistory());
    
    canvas.on('object:moving', (options) => {
        const target = options.target;
        if (!target) return;
        canvas.getObjects().forEach((obj: any) => {
            if (obj._customType === 'guide') canvas.remove(obj);
        });

        const w = target.width * target.scaleX;
        const h = target.height * target.scaleY;
        const center = target.getCenterPoint();

        const targetPoints = {
            left: target.left,
            right: target.left + w,
            top: target.top,
            bottom: target.top + h,
            centerX: center.x,
            centerY: center.y
        };

        canvas.getObjects().forEach((obj: any) => {
            if (obj === target || obj._customType === 'guide' || !obj.visible) return;

            const objW = obj.width * obj.scaleX;
            const objH = obj.height * obj.scaleY;
            const objCenter = obj.getCenterPoint();
            const objPoints = {
                left: obj.left,
                right: obj.left + objW,
                top: obj.top,
                bottom: obj.top + objH,
                centerX: objCenter.x,
                centerY: objCenter.y
            };

            if (Math.abs(targetPoints.left - objPoints.left) < SNAP_THRESHOLD) {
                target.set('left', objPoints.left);
                drawGuide(targetPoints.left, null, 'vertical');
            }
            if (Math.abs(targetPoints.left - objPoints.right) < SNAP_THRESHOLD) {
                target.set('left', objPoints.right);
                drawGuide(targetPoints.left, null, 'vertical');
            }
            if (Math.abs(targetPoints.top - objPoints.top) < SNAP_THRESHOLD) {
                target.set('top', objPoints.top);
                drawGuide(null, targetPoints.top, 'horizontal');
            }
            if (Math.abs(targetPoints.top - objPoints.bottom) < SNAP_THRESHOLD) {
                target.set('top', objPoints.bottom);
                drawGuide(null, targetPoints.top, 'horizontal');
            }
        });
        
        function drawGuide(x: number | null, y: number | null, type: 'vertical' | 'horizontal') {
            if (type === 'vertical' && x !== null) {
                const line = new Line([x, 0, x, canvas.height], { stroke: 'red', strokeDashArray: [5, 5], selectable: false, evented: false });
                (line as CustomFabricObject)._customType = 'guide';
                canvas.add(line);
            } else if (type === 'horizontal' && y !== null) {
                const line = new Line([0, y, canvas.width, y], { stroke: 'red', strokeDashArray: [5, 5], selectable: false, evented: false });
                (line as CustomFabricObject)._customType = 'guide';
                canvas.add(line);
            }
        }
    });

    canvas.on('mouse:up', () => {
        canvas.getObjects().forEach((obj: any) => {
            if (obj._customType === 'guide') canvas.remove(obj);
        });
        
        if (isDragging) {
            canvas.setViewportTransform(canvas.viewportTransform || [1, 0, 0, 1, 0, 0]);
            setIsDragging(false);
            canvas.selection = true;
        } else {
            saveHistory();
        }
    });

    canvas.on("mouse:move", (opt) => {
      const e = opt.e;
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

    setFabricCanvas(canvas);
    setTimeout(() => saveHistory(), 100); 

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
                    stroke: activeColor, strokeWidth: 1, strokeDashArray: [5, 5], selectable: false, evented: false, opacity: 0.7
                });
                fabricCanvas.add(newLine);
                setGuideLine(newLine);
                fabricCanvas.requestRenderAll();
            }
        }
    };
    fabricCanvas.on("mouse:move", handleMouseMove);
    return () => { fabricCanvas.off("mouse:move", handleMouseMove); };
  }, [fabricCanvas, activeTool, polygonPoints, guideLine, activeColor]);

  useEffect(() => {
    if (!fabricCanvas || activeTool !== "polygon") return;
    const handleCanvasClick = (opt: any) => {
      if (isDragging || opt.e.altKey) return;
      const pointer = fabricCanvas.getScenePoint(opt.e);
      if (polygonPoints.length > 2) {
        const start = polygonPoints[0];
        const dist = Math.sqrt(Math.pow(pointer.x - start.x, 2) + Math.pow(pointer.y - start.y, 2));
        if (dist < 20) { finishPolygon(polygonPoints); return; }
      }
      const points = [...polygonPoints, { x: pointer.x, y: pointer.y }];
      setPolygonPoints(points);
      const circle = new Circle({ left: pointer.x - 4, top: pointer.y - 4, radius: 4, fill: "transparent", stroke: activeColor, strokeWidth: 2, selectable: false, evented: false });
      fabricCanvas.add(circle);
      if (guideLine) { fabricCanvas.remove(guideLine); setGuideLine(null); }
    };

    const finishPolygon = (points: {x: number, y: number}[]) => {
        const zoneId = `zone-${Date.now()}`;
        const polygon = new Polygon(points, { fill: activeColor + "80", stroke: activeColor, strokeWidth: 2, objectCaching: false });
        const labels = points.map((point, index) => {
            const nextPoint = points[(index + 1) % points.length];
            const midX = (point.x + nextPoint.x) / 2;
            const midY = (point.y + nextPoint.y) / 2;
            return new IText(`${index + 1}`, { left: midX, top: midY, fontSize: 14, fontWeight: 'bold', fill: "#ffffff", backgroundColor: "#00000080", fontFamily: "Arial", originX: 'center', originY: 'center', selectable: false, evented: false });
        });
        const group = new Group([polygon, ...labels], { objectCaching: false, subTargetCheck: true });
        (group as CustomFabricObject).id = `poly-group-${Date.now()}`;
        (group as CustomFabricObject).zoneId = zoneId;
        (group as CustomFabricObject).name = `Zona ${zones.length + 1}`;
        (group as CustomFabricObject)._customType = "zone";
        const objects = fabricCanvas.getObjects();
        objects.forEach((obj: any) => {
           if ((obj instanceof Circle && obj.radius === 4) || obj.id === 'temp-poly-line') fabricCanvas.remove(obj);
        });
        if (guideLine) { fabricCanvas.remove(guideLine); setGuideLine(null); }
        fabricCanvas.add(group);
        fabricCanvas.setActiveObject(group);
        fabricCanvas.renderAll();
        setZones(prev => [...prev, { id: zoneId, name: `Zona Personalizada ${zones.length + 1}`, color: activeColor, type: "custom", visible: true }]);
        setPolygonPoints([]);
        setActiveTool("select");
        toast.success("Zona creada");
        saveHistory();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && polygonPoints.length >= 3) finishPolygon(polygonPoints);
      else if (e.key === "Escape") {
        setPolygonPoints([]);
        if (guideLine) { fabricCanvas.remove(guideLine); setGuideLine(null); }
        const objects = fabricCanvas.getObjects();
        objects.forEach((obj: any) => { if ((obj instanceof Circle && obj.radius === 4)) fabricCanvas.remove(obj); });
        fabricCanvas.requestRenderAll();
        toast.info("Polígono cancelado");
      }
    };
    fabricCanvas.on("mouse:down", handleCanvasClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => { fabricCanvas.off("mouse:down", handleCanvasClick); window.removeEventListener("keydown", handleKeyDown); };
  }, [fabricCanvas, activeTool, polygonPoints, activeColor, zones, isDragging, guideLine, saveHistory]);

  const handleDuplicate = useCallback(() => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    
    if (!activeObjects.length) {
        toast.warning("Selecciona algo para duplicar");
        return;
    }

    if (activeObjects.length === 1) {
        const obj = activeObjects[0] as CustomFabricObject;
        obj.clone().then((cloned: CustomFabricObject) => {
            cloned.set({
                left: (obj.left || 0) + 20,
                top: (obj.top || 0) + 20,
                evented: true,
                id: `clone-${Date.now()}`,
                name: `${obj.name} (Copia)`,
                zoneId: obj.zoneId, 
                price: obj.price,
                capacity: obj.capacity,
                _customType: obj._customType
            });
            fabricCanvas.discardActiveObject();
            fabricCanvas.add(cloned);
            fabricCanvas.setActiveObject(cloned);
            fabricCanvas.requestRenderAll();
            saveHistory();
            toast.success("Elemento duplicado");
        });
    } else {
        const activeSelection = fabricCanvas.getActiveObject();
        if(!activeSelection) return;

        activeSelection.clone().then((clonedSelection: any) => {
            fabricCanvas.discardActiveObject();
            
            clonedSelection.set({
                left: clonedSelection.left + 20,
                top: clonedSelection.top + 20,
                evented: true,
                canvas: fabricCanvas 
            });

            clonedSelection.forEachObject((obj: CustomFabricObject) => {
                obj.set({
                    id: `clone-${Date.now()}-${Math.random()}`,
                });
                fabricCanvas.add(obj);
            });
            
            const newSelection = new ActiveSelection(clonedSelection.getObjects(), { canvas: fabricCanvas });
            fabricCanvas.setActiveObject(newSelection);
            fabricCanvas.requestRenderAll();
            saveHistory();
            toast.success("Elementos duplicados");
        });
    }
  }, [fabricCanvas, saveHistory]);

  const handleUndo = () => {
      if (historyIndex <= 0 || !fabricCanvas) return;
      isHistoryLocked.current = true;
      const prevIndex = historyIndex - 1;
      const prevState = history[prevIndex];
      fabricCanvas.loadFromJSON(prevState.canvasJSON, () => {
          fabricCanvas.requestRenderAll();
          setZones(prevState.zones);
          setHistoryIndex(prevIndex);
          isHistoryLocked.current = false;
          toast.info("Deshacer");
      });
  };

  const handleRedo = () => {
      if (historyIndex >= history.length - 1 || !fabricCanvas) return;
      isHistoryLocked.current = true;
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];
      fabricCanvas.loadFromJSON(nextState.canvasJSON, () => {
          fabricCanvas.requestRenderAll();
          setZones(nextState.zones);
          setHistoryIndex(nextIndex);
          isHistoryLocked.current = false;
          toast.info("Rehacer");
      });
  };

  const handleMoveLayer = (zoneId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects() as CustomFabricObject[];
    const zoneObjects = objects.filter(obj => obj.zoneId === zoneId);
    zoneObjects.forEach(obj => {
        if (direction === 'top') obj.bringToFront();
        if (direction === 'bottom') obj.sendToBack();
        if (direction === 'up') obj.bringForward();
        if (direction === 'down') obj.sendBackwards();
    });
    fabricCanvas.requestRenderAll();
    saveHistory();
  };
  
  const handleUpdateProperties = (properties: Record<string, any>) => {
    if (!fabricCanvas || selectedObjects.length === 0) return;

    selectedObjects.forEach(obj => {
        Object.entries(properties).forEach(([key, value]) => {
            if (value !== undefined && value !== "") {
                (obj as any)[key] = value;
            }
        });
    });

    if (properties.name) {
        setZones(prevZones => prevZones.map(z => {
            const isSelected = selectedObjects.some(o => o.zoneId === z.id && o._customType === 'zone');
            return isSelected ? { ...z, name: properties.name } : z;
        }));
    }

    fabricCanvas.requestRenderAll();
    toast.success("Propiedades actualizadas");
    saveHistory();
  };

  const handleToolClick = (tool: ToolType) => {
    setActiveTool(tool);
    if (!fabricCanvas) return;

    const center = fabricCanvas.getCenterPoint();
    const vpt = fabricCanvas.viewportTransform || [1,0,0,1,0,0];
    const realCenter = { x: (center.x - vpt[4]) / vpt[0], y: (center.y - vpt[5]) / vpt[3] };

    if (tool === "rectangle") {
      const zoneId = `zone-${Date.now()}`;
      const rect = new Rect({ left: realCenter.x - 50, top: realCenter.y - 50, fill: activeColor + "80", width: 100, height: 100, stroke: activeColor, strokeWidth: 2 });
      (rect as CustomFabricObject).id = `rect-${Date.now()}`;
      (rect as CustomFabricObject).zoneId = zoneId;
      (rect as CustomFabricObject).name = `Rectángulo ${zones.length + 1}`;
      (rect as CustomFabricObject)._customType = "zone";
      fabricCanvas.add(rect);
      
      setZones([...zones, { id: zoneId, name: `Zona ${zones.length + 1}`, color: activeColor, type: "section", visible: true }]);
      setActiveTool("select");
      toast.success("Zona rectangular agregada");
      saveHistory();
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
    let startX = 0, startY = 0, endX = 0, endY = 0;
    let polygonVertices: { x: number; y: number }[] | null = null;
    let isZoneSelected = false;
    let selectionTransform = null; 
    
    const targetObj = selectedObjects.length > 0 ? selectedObjects[0] : null;

    if (targetObj && (targetObj._customType === "zone" || targetObj.type === "rect" || targetObj.type === "group")) {
        isZoneSelected = true;
        if (targetObj.zoneId) targetZoneId = targetObj.zoneId;
        const br = targetObj.getBoundingRect();
        startX = br.left; startY = br.top; endX = br.left + br.width; endY = br.top + br.height;

        if (targetObj.type === 'group') {
            const group = targetObj as Group;
            const polygon = group.getObjects().find(o => o.type === 'polygon') as Polygon;
            if (polygon) {
                const matrix = polygon.calcTransformMatrix();
                polygonVertices = polygon.points.map(p => util.transformPoint(p, matrix));
            }
        } else if (targetObj.type === 'polygon') {
            const polygon = targetObj as Polygon;
            const matrix = polygon.calcTransformMatrix();
            polygonVertices = polygon.points.map(p => util.transformPoint(p, matrix));
        } else { selectionTransform = targetObj; }
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
                if (!isPointInPolygon({x: testPoint.x, y: testPoint.y}, polygonVertices)) shouldAdd = false;
            } else if (selectionTransform) {
                if (!selectionTransform.containsPoint(testPoint)) shouldAdd = false;
            }
        }

        if (shouldAdd) {
            colIndex++;
            let seatObject;
            
            if (grid.seatShape === 'square') {
                seatObject = new Rect({
                    left: x, top: y, width: seatRadius * 2, height: seatRadius * 2,
                    fill: getSeatColor(grid.seatType), stroke: "#1e293b", strokeWidth: 1
                });
            } else {
                seatObject = new Circle({
                    left: x, top: y, radius: seatRadius,
                    fill: getSeatColor(grid.seatType), stroke: "#1e293b", strokeWidth: 1
                });
            }

            (seatObject as CustomFabricObject).id = `seat-${targetZoneId}-${rowIndex}-${colIndex}`;
            (seatObject as CustomFabricObject).zoneId = targetZoneId;
            (seatObject as CustomFabricObject).name = `${rowLetter}${colIndex}`;
            (seatObject as CustomFabricObject)._customType = "seat";

            const seatNumber = new IText(`${rowLetter}${colIndex}`, {
              left: x + seatRadius - 6,
              top: y + seatRadius - 5,
              fontSize: 10, fill: "#ffffff", fontFamily: "Arial",
              selectable: false, evented: false, originX: 'center', originY: 'center'
            });
            
            fabricCanvas.add(seatObject);
            fabricCanvas.add(seatNumber);
            addedSeats++;
        }
      }
    }

    fabricCanvas.renderAll();
    
    if (isZoneSelected) {
        setZones(prev => prev.map(z => z.id === targetZoneId ? { ...z, capacity: (z.capacity || 0) + addedSeats } : z));
        toast.success(`${addedSeats} asientos agregados a la zona seleccionada`);
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
    saveHistory();
    setActiveTool("select");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result as string;
      FabricImage.fromURL(data).then((img) => {
        const scale = Math.min(fabricCanvas.width / (img.width || 1), fabricCanvas.height / (img.height || 1));
        img.set({ scaleX: scale, scaleY: scale, originX: 'left', originY: 'top', opacity: bgOpacity });
        img.set({ left: (fabricCanvas.width - (img.width||0)*scale)/2, top: (fabricCanvas.height - (img.height||0)*scale)/2 });
        fabricCanvas.backgroundImage = img;
        fabricCanvas.requestRenderAll();
        toast.success("Fondo cargado");
        saveHistory();
      });
    };
    reader.readAsDataURL(file);
  };

  const handleOpacityChange = (val: number[]) => {
      setBgOpacity(val[0]);
      if (fabricCanvas && fabricCanvas.backgroundImage) {
          (fabricCanvas.backgroundImage as FabricObject).opacity = val[0];
          fabricCanvas.requestRenderAll();
      }
  };

  const handleToggleZoneVisibility = (zoneId: string) => {
    if (!fabricCanvas) return;
    const zoneIndex = zones.findIndex(z => z.id === zoneId);
    if (zoneIndex === -1) return;
    const newVisibility = !zones[zoneIndex].visible;
    const objects = fabricCanvas.getObjects() as CustomFabricObject[];
    objects.forEach(obj => { if (obj.zoneId === zoneId) obj.set('visible', newVisibility); });
    const newZones = [...zones];
    newZones[zoneIndex].visible = newVisibility;
    setZones(newZones);
    fabricCanvas.requestRenderAll();
    fabricCanvas.discardActiveObject(); 
    saveHistory();
  };

  const handleDeleteZone = (zoneId: string) => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects() as CustomFabricObject[];
    const objectsToRemove = objects.filter(obj => obj.zoneId === zoneId);
    objectsToRemove.forEach(obj => fabricCanvas.remove(obj));
    setZones(zones.filter(z => z.id !== zoneId));
    fabricCanvas.requestRenderAll();
    toast.success("Zona eliminada");
    saveHistory();
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
    if (!savedData) { toast.error("No hay datos"); return; }
    const parsed = JSON.parse(savedData);
    fabricCanvas.loadFromJSON(parsed.canvas, () => {
        fabricCanvas.requestRenderAll();
        setZones(parsed.zones || []);
        toast.success("Mapa cargado");
        saveHistory();
    });
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#f8fafc";
    fabricCanvas.requestRenderAll();
    setZones([]);
    toast.success("Lienzo limpio");
    saveHistory();
  };

  return (
    <div className="flex gap-4 p-4 min-h-[calc(100vh-80px)] bg-background h-full">
      <div className="flex flex-col gap-4">
        <Toolbar 
            activeTool={activeTool} 
            onToolClick={handleToolClick} 
            onClear={handleClear}
            onSave={handleSaveCanvas}
            onLoad={handleLoadCanvas}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onDuplicate={handleDuplicate}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
        />
        
        <div className="bg-card rounded-xl shadow-lg p-4 border border-border w-[240px]">
            <h3 className="text-sm font-semibold mb-2 text-foreground">Fondo</h3>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="w-full text-xs bg-secondary hover:bg-secondary/80 py-2 rounded mb-3 text-foreground">Cargar Imagen</button>
            <Slider value={[bgOpacity]} max={1} step={0.05} onValueChange={handleOpacityChange} />
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
        <PropertiesPanel selectedObjects={selectedObjects} onUpdate={handleUpdateProperties} />
        <ZoneManager 
          zones={zones}
          onToggleVisibility={handleToggleZoneVisibility}
          onDeleteZone={handleDeleteZone}
          onSelectZone={handleSelectZone}
          onMoveLayer={handleMoveLayer}
        />
      </div>
    </div>
  );
};