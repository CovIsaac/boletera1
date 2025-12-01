import { Canvas } from "@/components/Canvas";
import { MapPin } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <MapPin className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sistema de Boletería</h1>
            <p className="text-sm text-muted-foreground">Creador de Mapas de Asientos y Zonas</p>
          </div>
        </div>
      </header>
      <Canvas />
    </div>
  );
};

export default Index;
