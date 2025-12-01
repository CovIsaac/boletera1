import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Settings, Save } from "lucide-react";
import { FabricObject } from "fabric";

interface PropertiesPanelProps {
  selectedObject: FabricObject | null;
  onUpdate: (properties: Record<string, any>) => void;
}

export const PropertiesPanel = ({ selectedObject, onUpdate }: PropertiesPanelProps) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");

  useEffect(() => {
    if (selectedObject) {
      setName((selectedObject as any).name || "");
      setPrice((selectedObject as any).price || "");
      setCapacity((selectedObject as any).capacity || "");
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
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground">Propiedades</h3>
        </div>
        <p className="text-xs text-muted-foreground text-center py-8">
          Selecciona un elemento para editar sus propiedades
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-lg p-4 border border-border w-[280px]">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Propiedades</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-xs">Nombre/Etiqueta</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Zona VIP, Platea, etc."
            className="h-9"
          />
        </div>

        <div>
          <Label htmlFor="price" className="text-xs">Precio ($)</Label>
          <Input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="h-9"
          />
        </div>

        <div>
          <Label htmlFor="capacity" className="text-xs">Capacidad</Label>
          <Input
            id="capacity"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Número de asientos"
            className="h-9"
          />
        </div>

        <Button onClick={handleSave} className="w-full gap-2" size="lg">
          <Save className="h-4 w-4" />
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
};
