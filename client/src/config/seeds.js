export const SEEDS = [
  { id: 'carrot', name: 'Carrot', cost: 1, growTime: 60000, type: 'renewable', sellPrice: 2 },
  { id: 'strawberry', name: 'Strawberry', cost: 3, growTime: 120000, type: 'renewable', sellPrice: 5 },
  { id: 'blueberry', name: 'Blueberry', cost: 5, growTime: 180000, type: 'renewable', sellPrice: 8 },
  { id: 'tulip', name: 'Tulip', cost: 4, growTime: 90000, type: 'single', sellPrice: 7 },
  { id: 'tomato', name: 'Tomato', cost: 6, growTime: 240000, type: 'renewable', sellPrice: 10 },
  { id: 'apple', name: 'Apple', cost: 10, growTime: 300000, type: 'renewable', sellPrice: 15 },
  { id: 'bamboo', name: 'Bamboo', cost: 8, growTime: 150000, type: 'renewable', sellPrice: 12 },
  { id: 'corn', name: 'Corn', cost: 7, growTime: 200000, type: 'single', sellPrice: 14 },
  { id: 'cactus', name: 'Cactus', cost: 12, growTime: 360000, type: 'renewable', sellPrice: 18 },
  { id: 'pineapple', name: 'Pineapple', cost: 15, growTime: 420000, type: 'renewable', sellPrice: 22 },
  { id: 'mushroom', name: 'Mushroom', cost: 9, growTime: 180000, type: 'single', sellPrice: 16 },
  { id: 'green_bean', name: 'Green Bean', cost: 11, growTime: 270000, type: 'renewable', sellPrice: 17 },
  { id: 'banana', name: 'Banana', cost: 14, growTime: 330000, type: 'renewable', sellPrice: 20 },
  { id: 'coconut', name: 'Coconut', cost: 18, growTime: 480000, type: 'renewable', sellPrice: 25 },
  { id: 'mango', name: 'Mango', cost: 20, growTime: 540000, type: 'renewable', sellPrice: 28 },
  { id: 'dragon_fruit', name: 'Dragon Fruit', cost: 25, growTime: 600000, type: 'renewable', sellPrice: 35 },
  { id: 'cherry', name: 'Cherry', cost: 16, growTime: 300000, type: 'renewable', sellPrice: 24 },
  { id: 'sunflower', name: 'Sunflower', cost: 13, growTime: 240000, type: 'single', sellPrice: 20 },
  { id: 'venus_fire_trap', name: 'Venus Fire Trap', cost: 30, growTime: 720000, type: 'renewable', sellPrice: 40 },
  { id: 'pomegranate', name: 'Pomegranate', cost: 22, growTime: 450000, type: 'renewable', sellPrice: 30 },
  { id: 'poison_apple', name: 'Poison Apple', cost: 28, growTime: 600000, type: 'renewable', sellPrice: 38 },
  { id: 'venom_spitter', name: 'Venom Spitter', cost: 35, growTime: 780000, type: 'renewable', sellPrice: 45 },
  { id: 'moon_bloom', name: 'Moon Bloom', cost: 40, growTime: 900000, type: 'renewable', sellPrice: 50 },
  { id: 'dragons_breath', name: "Dragon's Breath", cost: 50, growTime: 1200000, type: 'renewable', sellPrice: 60 },
];

export const RESTOCK_INTERVAL = 300000;

export function getRandomRestock() {
  const count = 3 + Math.floor(Math.random() * 5);
  const shuffled = [...SEEDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
