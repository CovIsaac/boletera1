import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Settings, Save, Tag } from "lucide-react";
import { CustomFabricObject } from "@/types/canvas";

interface PropertiesPanelProps {
  selectedObject: CustomFabricObject | null;
  onUpdate: (properties: Record<string, any>) => void;
}

export const PropertiesPanel = ({ selectedObject, onUpdate }: PropertiesPanelProps) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");

  useEffect(() => {
    if (selectedObject) {
      setName(selectedObject.name || "");
      setPrice(selectedObject.price?.toString() || "");
      setCapacity(selectedObject.capacity?.toString() || "");
    } else {
        setName("");
        setPrice("");
        setCapacity("");
    }
  }, [selectedObject]);

  const handleSave = () => {
    if (selectedObject) {
      onUpdate({
        name,
        price: price ? parseFloat(price) : undefined,
        capacity: capacity ? parseInt(capacity) : undefined,
      });
    }
  };

  if (!selectedObject) {
    return (
      <div className="bg-card rounded-xl shadow-lg p-4 border border-border w-[280px]">
        <div className="flex items-center gap-2 mb-4 text-muted-foreground">
          <Settings className="h-5 w-5" />
          <h3 className="text-sm font-semibold">Propiedades</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/50 border-2 border-dashed border-muted rounded-lg">
            <Tag className="h-8 w-8 mb-2" />
            <p className="text-xs text-center px-4">
            Selecciona un elemento para editar sus detalles
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-lg p-4 border border-border w-[280px]">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Propiedades: {selectedObject._customType || 'Objeto'}</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-xs font-medium">Nombre / Etiqueta</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Zona VIP, Fila A..."
            className="h-8 text-sm mt-1"
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
                placeholder="0.00"
                className="h-8 text-sm mt-1"
            />
            </div>

            <div>
            <Label htmlFor="capacity" className="text-xs font-medium">Capacidad</Label>
            <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="-"
                className="h-8 text-sm mt-1"
                disabled={selectedObject._customType === 'seat'}
            />
            </div>
        </div>

        <Button onClick={handleSave} className="w-full gap-2 mt-2" size="sm">
          <Save className="h-4 w-4" />
          Aplicar Cambios
        </Button>
        
        <div className="text-[10px] text-muted-foreground text-center mt-2">
            ID: {selectedObject.id?.slice(0, 15)}...
        </div>
      </div>
    </div>
  );
};