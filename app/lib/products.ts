export type Product = {
  id: number;
  name: string;
  slug: string;
  country: string;
  process: string;
  roast: string;
  gtin: string;
  weight: string;
  price: string;
  roastProfile: string;
  machine: string;
  image: string;
};

export const products: Product[] = [
  {
    id: 1,
    name: "Brazil Santa Alina",
    slug: "brazil-santa-alina",
    country: "Brazil",
    process: "Washed",
    roast: "Light-Medium",
    gtin: "4595433537125",
    weight: "500g",
    price: "¥2,800",
    roastProfile: "Charge 180°C → Drop 213°C → DTR 3:00",
    machine: "Probat P05iii",
    image: "/images/brazil.jpg",
  },
  {
    id: 2,
    name: "Ethiopia Yirgacheffe G1",
    slug: "ethiopia-yirgacheffe-g1",
    country: "Ethiopia",
    process: "Natural",
    roast: "Light",
    gtin: "4595433537194",
    weight: "100g",
    price: "¥1,800",
    roastProfile: "FC 198–200°C → Drop 204–206°C → DTR 12%",
    machine: "Roest L100plus",
    image: "/images/ethiopia.jpg",
  },
  {
    id: 3,
    name: "Papua New Guinea Sucafina",
    slug: "papua-new-guinea-sucafina",
    country: "Papua New Guinea",
    process: "Washed",
    roast: "Medium",
    gtin: "4595433537507",
    weight: "200g",
    price: "¥2,200",
    roastProfile: "Fill 169.5°C → Drop 211.75°C → DTR ~110s",
    machine: "Probat P05iii",
    image: "/images/papua.jpg",
  },
];
