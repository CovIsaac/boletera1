import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { 
    Settings, Save, Tag, Layers, Lock, Unlock, 
    // Iconos corregidos de Lucide React:
    AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, 
    AlignStartVertical, AlignCenterVertical, AlignEndVertical 
} from "lucide-react";
import { CustomFabricObject } from "@/types/canvas";
import { Separator } from "./ui/separator";

interface PropertiesPanelProps {
  selectedObjects: CustomFabricObject[];
  onUpdate: (properties: Record<string, any>) => void;
  onAlign: (direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
}

export const PropertiesPanel = ({ selectedObjects, onUpdate, onAlign }: PropertiesPanelProps) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (selectedObjects.length === 1) {
      const obj = selectedObjects[0];
      setName(obj.name || "");
      setPrice(obj.price?.toString() || "");
      setCapacity(obj.capacity?.toString() || "");
      setIsLocked(!!obj.lockMovementX);
    } else if (selectedObjects.length > 1) {
      const firstPrice = selectedObjects[0].price;
      const samePrice = selectedObjects.every(o => o.price === firstPrice);
      setPrice(samePrice ? firstPrice?.toString() || "" : "");

      const firstName = selectedObjects[0].name;
      const sameName = selectedObjects.every(o => o.name === firstName);
      setName(sameName ? firstName || "" : "");
      
      setCapacity("");
      setIsLocked(selectedObjects.every(o => !!o.lockMovementX));
    } else {
      setName("");
      setPrice("");
      setCapacity("");
      setIsLocked(false);
    }
  }, [selectedObjects]);

  const handleSave = () => {
    const updates: Record<string, any> = {};
    if (name) updates.name = name;
    if (price) updates.price = parseFloat(price);
    if (capacity) updates.capacity = parseInt(capacity);
    onUpdate(updates);
  };

  const toggleLock = () => {
      const newState = !isLocked;
      setIsLocked(newState);
      onUpdate({
          lockMovementX: newState,
          lockMovementY: newState,
          lockRotation: newState,
          lockScalingX: newState,
          lockScalingY: newState,
          selectable: true, 
          hasControls: !newState, 
          hoverCursor: newState ? 'default' : 'move'
      });
  };

  if (selectedObjects.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-lg p-4 border border-border w-[280px]">
        <div className="flex items-center gap-2 mb-4 text-muted-foreground">
          <Settings className="h-5 w-5" />
          <h3 className="text-sm font-semibold">Propiedades</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/50 border-2 border-dashed border-muted rounded-lg">
            <Tag className="h-8 w-8 mb-2" />
            <p className="text-xs text-center px-4">
            Selecciona elementos para editar
            </p>
        </div>
      </div>
    );
  }

  const isMultiple = selectedObjects.length > 1;

  return (
    <div className="bg-card rounded-xl shadow-lg p-4 border border-border w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            {isMultiple ? <Layers className="h-5 w-5 text-primary" /> : <Settings className="h-5 w-5 text-primary" />}
            <h3 className="text-sm font-semibold text-foreground">
                {isMultiple ? `${selectedObjects.length} Elementos` : (selectedObjects[0]._customType || 'Objeto')}
            </h3>
        </div>
        <Button 
            variant={isLocked ? "destructive" : "ghost"} 
            size="icon" 
            className="h-6 w-6" 
            onClick={toggleLock}
            title={isLocked ? "Desbloquear" : "Bloquear posición"}
        >
            {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-xs font-medium">Nombre / Etiqueta</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isMultiple ? "Varios nombres..." : "Ej: Zona VIP"}
            className="h-8 text-sm mt-1"
            disabled={isLocked}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
            <div>
            <Label htmlFor="price" className="text-xs font-medium">Precio ($)</Label>
            <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={isMultiple ? "Varios..." : "0.00"}
                className="h-8 text-sm mt-1"
                disabled={isLocked}
            />
            </div>

            <div>
            <Label htmlFor="capacity" className="text-xs font-medium">Capacidad</Label>
            <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder={isMultiple ? "-" : "-"}
                className="h-8 text-sm mt-1"
                disabled={selectedObjects[0]._customType === 'seat' || isLocked}
            />
            </div>
        </div>

        <Button onClick={handleSave} className="w-full gap-2 mt-2" size="sm" disabled={isLocked}>
          <Save className="h-4 w-4" />
          {isMultiple ? "Aplicar a Todos" : "Guardar Cambios"}
        </Button>
        
        {isMultiple && !isLocked && (
            <>
                <Separator className="my-2" />
                <Label className="text-xs font-medium mb-2 block">Alineación</Label>
                <div className="grid grid-cols-6 gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-full" onClick={() => onAlign('left')} title="Izquierda">
                        <AlignStartHorizontal className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-full" onClick={() => onAlign('center')} title="Centro Horizontal">
                        <AlignCenterHorizontal className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-full" onClick={() => onAlign('right')} title="Derecha">
                        <AlignEndHorizontal className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-full" onClick={() => onAlign('top')} title="Arriba">
                        <AlignStartVertical className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-full" onClick={() => onAlign('middle')} title="Centro Vertical">
                        <AlignCenterVertical className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-full" onClick={() => onAlign('bottom')} title="Abajo">
                        <AlignEndVertical className="h-3 w-3" />
                    </Button>
                </div>
            </>
        )}

        {!isMultiple && (
            <div className="text-[10px] text-muted-foreground text-center mt-2">
                ID: {selectedObjects[0].id?.slice(0, 15)}...
            </div>
        )}
      </div>
    </div>
  );
};