export const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export interface SeedData {
  name: string;
  category: 'Kräuter' | 'Gemüse' | 'Salat' | 'Blumen';
  origin?: string;
  calendar: Record<string, string>;
  instructions: string;
  nutrientConsumption?: 'Starkzehrer' | 'Mittelzehrer' | 'Schwachzehrer';
  goodNeighbors?: string[];
  badNeighbors?: string[];
}

// Vite magic: Load all JSON files in src/seeds/
const seedFiles = import.meta.glob('./seeds/*.json', { eager: true });

let loadedSeeds: SeedData[] = [];
try {
  loadedSeeds = Object.values(seedFiles).flatMap((module: any) => {
    const data = module.default || module;
    return Array.isArray(data) ? data : [data];
  });
} catch (e) {
  console.error("Error loading seeds:", e);
}

export const seedData: SeedData[] = loadedSeeds;
