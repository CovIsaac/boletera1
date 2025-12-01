import { FabricObject } from "fabric";

export type SeatType = "regular" | "vip" | "accessible" | "blocked";

// Extendemos la clase base de Fabric para incluir nuestros metadatos personalizados
export interface CustomFabricObject extends FabricObject {
  id: string;
  name?: string;
  zoneId?: string;
  price?: number;
  capacity?: number;
  type?: string; // "rect", "circle", "polygon", etc.
  _customType?: "section" | "seat" | "text" | "zone"; // Para distinguir tipos lógicos
}

export interface Seat {
  id: string;
  row: string;
  number: number;
  type: SeatType;
  zoneId: string;
  x: number;
  y: number;
  price?: number;
}

export interface Zone {
  id: string;
  name: string;
  color: string;
  type: "section" | "stage" | "aisle" | "custom";
  price?: number;
  capacity?: number;
  visible?: boolean; // Nuevo campo para controlar visibilidad en UI
}

export interface SeatingGrid {
  rows: number;
  columns: number;
  rowSpacing: number;
  seatSpacing: number;
  startRow: string;
  seatType: SeatType;
  zoneId: string;
}

export type ToolType = 
  | "select" 
  | "draw" 
  | "rectangle" 
  | "circle" 
  | "polygon"
  | "seating-grid"
  | "text"
  | "hand"; // Herramienta para paneo manual