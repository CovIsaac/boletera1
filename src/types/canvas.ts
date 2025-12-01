import { FabricObject } from "fabric";

export type SeatType = "regular" | "vip" | "accessible" | "blocked";
export type SeatShape = "circle" | "square" | "icon";

// Extendemos la clase base de Fabric para incluir nuestros metadatos personalizados
export interface CustomFabricObject extends FabricObject {
  id: string;
  name?: string;
  zoneId?: string;
  price?: number;
  capacity?: number;
  type?: string; 
  _customType?: "section" | "seat" | "text" | "zone" | "guide"; // guide para líneas temporales
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
  visible?: boolean; 
}

export interface SeatingGrid {
  rows: number;
  columns: number;
  rowSpacing: number;
  seatSpacing: number;
  startRow: string;
  seatType: SeatType;
  seatShape: SeatShape; // Nuevo campo para la forma
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
  | "hand";

// Interfaz para el estado del historial
export interface CanvasState {
    canvasJSON: any;
    zones: Zone[];
}