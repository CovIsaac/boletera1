import { Palette } from "lucide-react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export const ColorPicker = ({ color, onChange }: ColorPickerProps) => {
  const presetColors = [
    { name: "Azul", value: "#0EA5E9" },
    { name: "Verde", value: "#10B981" },
    { name: "Rojo", value: "#EF4444" },
    { name: "Amarillo", value: "#F59E0B" },
    { name: "Púrpura", value: "#8B5CF6" },
    { name: "Rosa", value: "#EC4899" },
    { name: "Naranja", value: "#F97316" },
    { name: "Turquesa", value: "#06B6D4" },
    { name: "Índigo", value: "#6366F1" },
  ];

  return (
    <div className="bg-card rounded-xl shadow-lg p-4 border border-border w-[240px]">
      <h3 className="text-sm font-semibold mb-4 text-foreground flex items-center gap-2">
        <Palette className="h-4 w-4" />
        Colores de Zona
      </h3>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {presetColors.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onChange(preset.value)}
              className="h-12 rounded-lg border-2 transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: preset.value,
                borderColor: color === preset.value ? "#1e293b" : "transparent",
              }}
              title={preset.name}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <label htmlFor="custom-color" className="text-sm text-muted-foreground flex-1">
            Personalizado:
          </label>
          <input
            id="custom-color"
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-20 rounded-md border border-border cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
