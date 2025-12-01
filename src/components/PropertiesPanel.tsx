import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Settings, Save, Tag, Layers } from "lucide-react";
import { CustomFabricObject } from "@/types/canvas";

interface PropertiesPanelProps {
  selectedObjects: CustomFabricObject[]; // Cambiado a array
  onUpdate: (properties: Record<string, any>) => void;
}

export const PropertiesPanel = ({ selectedObjects, onUpdate }: PropertiesPanelProps) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");

  useEffect(() => {
    if (selectedObjects.length === 1) {
      const obj = selectedObjects[0];
      setName(obj.name || "");
      setPrice(obj.price?.toString() || "");
      setCapacity(obj.capacity?.toString() || "");
    } else if (selectedObjects.length > 1) {
      // Lógica para selección múltiple:
      // Mostrar valor solo si es idéntico en todos los objetos seleccionados
      const firstPrice = selectedObjects[0].price;
      const samePrice = selectedObjects.every(o => o.price === firstPrice);
      setPrice(samePrice ? firstPrice?.toString() || "" : "");

      const firstName = selectedObjects[0].name;
      const sameName = selectedObjects.every(o => o.name === firstName);
      setName(sameName ? firstName || "" : "");
      
      // Capacidad generalmente no se edita en grupo para asientos individuales, lo dejamos vacío
      setCapacity(""); 
    } else {
      setName("");
      setPrice("");
      setCapacity("");
    }
  }, [selectedObjects]);

  const handleSave = () => {
    const updates: Record<string, any> = {};
    
    // Solo enviamos las propiedades que tienen valor
    // Esto evita sobrescribir con "" propiedades que no queremos tocar en edición masiva
    if (name) updates.name = name;
    if (price) updates.price = parseFloat(price);
    if (capacity) updates.capacity = parseInt(capacity);
    
    onUpdate(updates);
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
      <div className="flex items-center gap-2 mb-4">
        {isMultiple ? <Layers className="h-5 w-5 text-primary" /> : <Settings className="h-5 w-5 text-primary" />}
        <h3 className="text-sm font-semibold text-foreground">
            {isMultiple ? `${selectedObjects.length} Elementos` : (selectedObjects[0]._customType || 'Objeto')}
        </h3>
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
                disabled={selectedObjects[0]._customType === 'seat'}
            />
            </div>
        </div>

        <Button onClick={handleSave} className="w-full gap-2 mt-2" size="sm">
          <Save className="h-4 w-4" />
          {isMultiple ? "Aplicar a Todos" : "Guardar Cambios"}
        </Button>
        
        {!isMultiple && (
            <div className="text-[10px] text-muted-foreground text-center mt-2">
                ID: {selectedObjects[0].id?.slice(0, 15)}...
            </div>
        )}
      </div>
    </div>
  );
};