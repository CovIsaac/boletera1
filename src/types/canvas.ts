export type SeatType = "regular" | "vip" | "accessible" | "blocked";

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
  | "text";
