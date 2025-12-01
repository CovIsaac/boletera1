import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Grid3x3, Plus } from "lucide-react";
import { SeatType, SeatingGrid } from "@/types/canvas";

interface SeatingGeneratorProps {
  onGenerate: (grid: SeatingGrid) => void;
}

export const SeatingGenerator = ({ onGenerate }: SeatingGeneratorProps) => {
  const [rows, setRows] = useState(5);
  const [columns, setColumns] = useState(10);
  const [rowSpacing, setRowSpacing] = useState(40);
  const [seatSpacing, setSeatSpacing] = useState(35);
  const [startRow, setStartRow] = useState("A");
  const [seatType, setSeatType] = useState<SeatType>("regular");

  const handleGenerate = () => {
    onGenerate({
      rows,
      columns,
      rowSpacing,
      seatSpacing,
      startRow,
      seatType,
      zoneId: `zone-${Date.now()}`,
    });
  };

  return (
    <div className="bg-card rounded-xl shadow-lg p-4 border border-border w-[280px]">
      <div className="flex items-center gap-2 mb-4">
        <Grid3x3 className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Generador de Asientos</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="rows" className="text-xs">Filas</Label>
            <Input
              id="rows"
              type="number"
              min="1"
              max="50"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value) || 1)}
              className="h-9"
            />
          </div>
          <div>
            <Label htmlFor="columns" className="text-xs">Columnas</Label>
            <Input
              id="columns"
              type="number"
              min="1"
              max="50"
              value={columns}
              onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
              className="h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="rowSpacing" className="text-xs">Espacio Filas</Label>
            <Input
              id="rowSpacing"
              type="number"
              min="20"
              max="100"
              value={rowSpacing}
              onChange={(e) => setRowSpacing(parseInt(e.target.value) || 20)}
              className="h-9"
            />
          </div>
          <div>
            <Label htmlFor="seatSpacing" className="text-xs">Espacio Asientos</Label>
            <Input
              id="seatSpacing"
              type="number"
              min="20"
              max="100"
              value={seatSpacing}
              onChange={(e) => setSeatSpacing(parseInt(e.target.value) || 20)}
              className="h-9"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="startRow" className="text-xs">Letra Inicial</Label>
          <Input
            id="startRow"
            type="text"
            maxLength={1}
            value={startRow}
            onChange={(e) => setStartRow(e.target.value.toUpperCase())}
            className="h-9"
          />
        </div>

        <div>
          <Label htmlFor="seatType" className="text-xs">Tipo de Asiento</Label>
          <Select value={seatType} onValueChange={(value) => setSeatType(value as SeatType)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="accessible">Accesible</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleGenerate} 
          className="w-full gap-2"
          size="lg"
        >
          <Plus className="h-4 w-4" />
          Generar Asientos
        </Button>
      </div>
    </div>
  );
};
