import { NUTRIENT_KEYS, type Nutrients } from "./nutrition";

// Yaklaşık değerler (USDA FoodData Central ve TürKomp'a yakın ortalamalar).
// Tüm değerler 100 g (içeceklerde 100 ml) başınadır.
// Sütun sırası: kcal, protein, karbonhidrat, yağ, lif, şeker, doymuş yağ,
// sodyum mg, potasyum mg, kalsiyum mg, demir mg, magnezyum mg,
// A vit µg, C vit mg, D vit µg, B12 µg

export type Food = {
  id: string;
  name: string;
  category: string;
  per100: Nutrients;
  portion: { grams: number; label: string };
  drink?: boolean;
};

type Row = [string, string, number[], number, string];

const ROWS: Row[] = [
  // Kahvaltılık
  ["Yumurta (haşlanmış)", "Kahvaltılık", [155, 12.6, 1.1, 10.6, 0, 1.1, 3.3, 124, 126, 50, 1.2, 10, 149, 0, 2.2, 1.1], 50, "1 adet"],
  ["Yumurta akı", "Kahvaltılık", [52, 10.9, 0.7, 0.2, 0, 0.7, 0, 166, 163, 7, 0.1, 11, 0, 0, 0, 0.1], 33, "1 adet"],
  ["Menemen", "Kahvaltılık", [100, 5.5, 4, 7, 1, 2.5, 1.8, 250, 250, 30, 1, 15, 80, 15, 1, 0.5], 200, "1 porsiyon"],
  ["Beyaz peynir", "Kahvaltılık", [264, 14.2, 4.1, 21.3, 0, 4.1, 15, 1116, 62, 493, 0.65, 19, 125, 0, 0.4, 1.7], 30, "1 dilim"],
  ["Kaşar peyniri", "Kahvaltılık", [370, 26, 1.5, 29, 0, 0.5, 18, 700, 90, 720, 0.4, 27, 260, 0, 0.6, 1.2], 30, "1 dilim"],
  ["Lor peyniri", "Kahvaltılık", [98, 11, 3.4, 4.3, 0, 2.7, 1.7, 364, 104, 83, 0.1, 8, 37, 0, 0.1, 0.4], 50, "2 yemek kaşığı"],
  ["Siyah zeytin", "Kahvaltılık", [115, 0.8, 6, 10.7, 3.2, 0, 1.4, 735, 8, 88, 3.3, 4, 20, 0.9, 0, 0], 30, "~6 adet"],
  ["Yeşil zeytin", "Kahvaltılık", [145, 1, 3.8, 15.3, 3.3, 0.5, 2, 1556, 42, 52, 0.5, 11, 20, 0, 0, 0], 30, "~6 adet"],
  ["Tereyağı", "Kahvaltılık", [717, 0.9, 0.1, 81, 0, 0.1, 51, 11, 24, 24, 0, 2, 684, 0, 1.5, 0.2], 10, "1 tatlı kaşığı"],
  ["Bal", "Kahvaltılık", [304, 0.3, 82, 0, 0.2, 82, 0, 4, 52, 6, 0.4, 2, 0, 0.5, 0, 0], 20, "1 yemek kaşığı"],
  ["Reçel", "Kahvaltılık", [278, 0.4, 69, 0.1, 1, 60, 0, 30, 77, 20, 0.5, 5, 0, 9, 0, 0], 20, "1 yemek kaşığı"],
  ["Tahin", "Kahvaltılık", [595, 17, 21, 54, 9.3, 0.5, 7.5, 115, 414, 426, 8.9, 95, 3, 0, 0, 0], 15, "1 yemek kaşığı"],
  ["Fıstık ezmesi", "Kahvaltılık", [588, 25, 20, 50, 6, 9, 10, 150, 650, 45, 1.9, 170, 0, 0, 0, 0], 15, "1 yemek kaşığı"],
  ["Yulaf ezmesi", "Kahvaltılık", [379, 13, 68, 6.5, 10, 1, 1.1, 6, 362, 52, 4.3, 138, 0, 0, 0, 0], 40, "4 yemek kaşığı"],
  ["Kaşarlı tost", "Kahvaltılık", [290, 13, 30, 13, 1.5, 3, 7, 650, 120, 250, 1.6, 25, 90, 0, 0.2, 0.6], 130, "1 adet"],
  ["Peynirli börek", "Kahvaltılık", [280, 10, 25, 15, 1, 1, 7, 450, 100, 150, 1.5, 20, 100, 0, 0.2, 0.5], 150, "1 dilim"],
  ["Sucuk", "Kahvaltılık", [420, 20, 2, 37, 0, 0.5, 15, 1500, 250, 15, 2, 15, 0, 0, 0.5, 1.5], 30, "4-5 dilim"],
  ["Hindi füme", "Kahvaltılık", [105, 17, 3, 2.5, 0, 2, 0.8, 1000, 300, 10, 1, 20, 0, 0, 0.2, 0.4], 30, "3 dilim"],

  // Ekmek ve tahıllar
  ["Beyaz ekmek", "Ekmek ve tahıl", [265, 9, 49, 3.2, 2.7, 5, 0.7, 490, 115, 40, 1.5, 25, 0, 0, 0, 0], 30, "1 dilim"],
  ["Tam buğday ekmeği", "Ekmek ve tahıl", [247, 13, 41, 3.4, 7, 6, 0.7, 450, 250, 80, 2.5, 75, 0, 0, 0, 0], 30, "1 dilim"],
  ["Simit", "Ekmek ve tahıl", [300, 10, 52, 6, 3, 3, 1, 500, 120, 60, 2.5, 40, 0, 0, 0, 0], 110, "1 adet"],
  ["Pirinç pilavı", "Ekmek ve tahıl", [160, 2.8, 28, 4, 0.4, 0, 2, 250, 40, 10, 0.3, 12, 30, 0, 0, 0], 150, "1 porsiyon"],
  ["Bulgur pilavı", "Ekmek ve tahıl", [120, 3.3, 20, 3, 4.5, 1, 0.8, 250, 90, 12, 1, 32, 10, 1, 0, 0], 150, "1 porsiyon"],
  ["Makarna (haşlanmış)", "Ekmek ve tahıl", [158, 5.8, 31, 0.9, 1.8, 0.6, 0.2, 1, 44, 7, 0.5, 18, 0, 0, 0, 0], 200, "1 porsiyon"],
  ["Patates (haşlanmış)", "Ekmek ve tahıl", [87, 1.9, 20, 0.1, 1.8, 0.9, 0, 4, 379, 5, 0.3, 22, 0, 13, 0, 0], 150, "1 orta boy"],
  ["Patates kızartması", "Ekmek ve tahıl", [312, 3.4, 41, 15, 3.8, 0.3, 2.3, 210, 579, 18, 0.8, 35, 0, 4.7, 0, 0], 120, "1 porsiyon"],

  // Et, tavuk, balık
  ["Tavuk göğsü (ızgara)", "Et, tavuk, balık", [165, 31, 0, 3.6, 0, 0, 1, 74, 256, 15, 1, 29, 6, 0, 0.1, 0.3], 150, "1 porsiyon"],
  ["Tavuk but (derisiz)", "Et, tavuk, balık", [209, 26, 0, 10.9, 0, 0, 3, 90, 240, 12, 1.1, 23, 20, 0, 0.1, 0.3], 120, "1 adet"],
  ["Dana eti (ızgara)", "Et, tavuk, balık", [250, 26, 0, 15, 0, 0, 6, 72, 318, 18, 2.6, 21, 0, 0, 0.1, 2.6], 120, "1 porsiyon"],
  ["Izgara köfte", "Et, tavuk, balık", [230, 18, 6, 15, 0.5, 1, 6, 450, 280, 25, 2.2, 20, 10, 1, 0.1, 2], 150, "~6 adet"],
  ["Somon (fırın)", "Et, tavuk, balık", [206, 22, 0, 12, 0, 0, 2.5, 61, 384, 15, 0.3, 30, 58, 3.7, 11, 3.2], 150, "1 porsiyon"],
  ["Ton balığı (konserve, suda)", "Et, tavuk, balık", [116, 25.5, 0, 0.8, 0, 0, 0.2, 338, 237, 11, 1.5, 27, 17, 0, 1.7, 2.5], 80, "1 kutu (süzülmüş)"],
  ["Hamsi tava", "Et, tavuk, balık", [200, 20, 5, 11, 0.2, 0, 2.5, 200, 350, 150, 2.5, 40, 15, 0, 3, 0.6], 150, "1 porsiyon"],
  ["Tavuk döner (et)", "Et, tavuk, balık", [190, 22, 3, 10, 0, 1, 2.5, 600, 280, 15, 1, 25, 20, 0, 0.1, 0.3], 120, "1 porsiyon"],

  // Yemekler
  ["Mercimek çorbası", "Yemekler", [65, 3.5, 9, 1.8, 1.8, 1, 0.5, 300, 150, 15, 1.2, 20, 30, 1, 0, 0], 250, "1 kase"],
  ["Ezogelin çorbası", "Yemekler", [60, 2.8, 9, 1.6, 1.8, 1, 0.4, 300, 140, 15, 1, 18, 30, 2, 0, 0], 250, "1 kase"],
  ["Kuru fasulye", "Yemekler", [110, 6, 14, 3, 5, 1.5, 0.6, 300, 350, 50, 2, 45, 15, 3, 0, 0], 250, "1 porsiyon"],
  ["Nohut (haşlanmış)", "Yemekler", [164, 8.9, 27, 2.6, 7.6, 4.8, 0.3, 7, 291, 49, 2.9, 48, 1, 1.3, 0, 0], 100, "yarım kase"],
  ["Kırmızı mercimek (haşlanmış)", "Yemekler", [116, 9, 20, 0.4, 7.9, 1.8, 0.1, 2, 369, 19, 3.3, 36, 0, 1.5, 0, 0], 100, "yarım kase"],
  ["Zeytinyağlı taze fasulye", "Yemekler", [80, 1.8, 7, 5, 2.7, 3, 0.7, 250, 220, 35, 0.9, 22, 35, 10, 0, 0], 200, "1 porsiyon"],
  ["Ispanak yemeği", "Yemekler", [70, 3, 5, 4.5, 2.5, 1, 1, 250, 450, 100, 2.5, 70, 400, 15, 0, 0], 200, "1 porsiyon"],
  ["Karnıyarık", "Yemekler", [130, 5, 8, 9, 2.5, 4, 2.5, 300, 280, 20, 1, 20, 30, 6, 0, 0.5], 250, "1 porsiyon"],
  ["Mantı (yoğurtlu)", "Yemekler", [170, 7, 20, 7, 1, 1.5, 3, 350, 150, 70, 1.3, 18, 40, 1, 0, 0.4], 250, "1 porsiyon"],
  ["Lahmacun", "Yemekler", [230, 10, 30, 7, 2, 2, 2.5, 500, 250, 30, 2, 25, 30, 5, 0, 0.6], 130, "1 adet"],
  ["Kıymalı pide", "Yemekler", [260, 12, 30, 10, 1.5, 2, 4, 550, 200, 40, 2, 25, 30, 2, 0, 0.8], 250, "1 adet"],
  ["Tavuk dürüm", "Yemekler", [230, 13, 25, 9, 1.5, 2, 2, 550, 220, 40, 1.5, 25, 20, 3, 0, 0.2], 300, "1 adet"],
  ["Pizza", "Yemekler", [266, 11, 33, 10, 2.3, 3.6, 4.5, 598, 172, 188, 2.5, 24, 70, 1, 0.2, 0.6], 107, "1 dilim"],
  ["Hamburger", "Yemekler", [254, 12.8, 28, 10.5, 1.4, 5, 4, 450, 230, 80, 2.7, 22, 5, 0.5, 0.1, 1], 220, "1 adet"],

  // Sebze ve salata
  ["Çoban salatası", "Sebze ve salata", [50, 0.9, 4, 3.5, 1.3, 2.5, 0.5, 150, 200, 15, 0.3, 11, 25, 25, 0, 0], 200, "1 kase"],
  ["Cacık", "Sebze ve salata", [45, 2.2, 3.5, 2.3, 0.3, 3, 1.3, 200, 160, 80, 0.1, 12, 20, 2, 0, 0.2], 150, "1 kase"],
  ["Domates", "Sebze ve salata", [18, 0.9, 3.9, 0.2, 1.2, 2.6, 0, 5, 237, 10, 0.3, 11, 42, 13.7, 0, 0], 120, "1 orta boy"],
  ["Salatalık", "Sebze ve salata", [15, 0.7, 3.6, 0.1, 0.5, 1.7, 0, 2, 147, 16, 0.3, 13, 5, 2.8, 0, 0], 100, "1 adet"],
  ["Sivri biber", "Sebze ve salata", [20, 0.9, 4.6, 0.2, 1.7, 2.4, 0, 3, 175, 10, 0.3, 10, 18, 80, 0, 0], 30, "2 adet"],
  ["Marul", "Sebze ve salata", [15, 1.4, 2.9, 0.2, 1.3, 0.8, 0, 28, 194, 36, 0.9, 13, 370, 9.2, 0, 0], 50, "birkaç yaprak"],
  ["Brokoli", "Sebze ve salata", [35, 2.4, 7.2, 0.4, 3.3, 1.4, 0.1, 41, 293, 40, 0.7, 21, 77, 64.9, 0, 0], 100, "1 kase"],
  ["Havuç", "Sebze ve salata", [41, 0.9, 9.6, 0.2, 2.8, 4.7, 0, 69, 320, 33, 0.3, 12, 835, 5.9, 0, 0], 70, "1 adet"],
  ["Soğan", "Sebze ve salata", [40, 1.1, 9.3, 0.1, 1.7, 4.2, 0, 4, 146, 23, 0.2, 10, 0, 7.4, 0, 0], 50, "yarım adet"],
  ["Avokado", "Sebze ve salata", [160, 2, 8.5, 14.7, 6.7, 0.7, 2.1, 7, 485, 12, 0.6, 29, 7, 10, 0, 0], 70, "yarım adet"],
  ["Zeytinyağı", "Sebze ve salata", [884, 0, 0, 100, 0, 0, 14, 2, 1, 1, 0.6, 0, 0, 0, 0, 0], 13, "1 yemek kaşığı"],

  // Meyve ve kuruyemiş
  ["Elma", "Meyve ve kuruyemiş", [52, 0.3, 13.8, 0.2, 2.4, 10.4, 0, 1, 107, 6, 0.1, 5, 3, 4.6, 0, 0], 180, "1 orta boy"],
  ["Muz", "Meyve ve kuruyemiş", [89, 1.1, 22.8, 0.3, 2.6, 12.2, 0.1, 1, 358, 5, 0.3, 27, 3, 8.7, 0, 0], 120, "1 adet"],
  ["Portakal", "Meyve ve kuruyemiş", [47, 0.9, 11.8, 0.1, 2.4, 9.4, 0, 0, 181, 40, 0.1, 10, 11, 53, 0, 0], 150, "1 adet"],
  ["Mandalina", "Meyve ve kuruyemiş", [53, 0.8, 13.3, 0.3, 1.8, 10.6, 0, 2, 166, 37, 0.15, 12, 34, 27, 0, 0], 80, "1 adet"],
  ["Çilek", "Meyve ve kuruyemiş", [32, 0.7, 7.7, 0.3, 2, 4.9, 0, 1, 153, 16, 0.4, 13, 1, 59, 0, 0], 150, "1 kase"],
  ["Üzüm", "Meyve ve kuruyemiş", [69, 0.7, 18, 0.2, 0.9, 15.5, 0.1, 2, 191, 10, 0.4, 7, 3, 3.2, 0, 0], 150, "1 salkım"],
  ["Karpuz", "Meyve ve kuruyemiş", [30, 0.6, 7.6, 0.2, 0.4, 6.2, 0, 1, 112, 7, 0.2, 10, 28, 8.1, 0, 0], 300, "1 dilim"],
  ["Kuru kayısı", "Meyve ve kuruyemiş", [241, 3.4, 63, 0.5, 7.3, 53, 0, 10, 1162, 55, 2.7, 32, 180, 1, 0, 0], 30, "4 adet"],
  ["Hurma", "Meyve ve kuruyemiş", [282, 2.5, 75, 0.4, 8, 63, 0, 2, 656, 39, 1, 43, 0, 0.4, 0, 0], 25, "3 adet"],
  ["Ceviz", "Meyve ve kuruyemiş", [654, 15.2, 13.7, 65.2, 6.7, 2.6, 6.1, 2, 441, 98, 2.9, 158, 1, 1.3, 0, 0], 30, "1 avuç"],
  ["Badem", "Meyve ve kuruyemiş", [579, 21, 21.6, 49.9, 12.5, 4.4, 3.8, 1, 733, 269, 3.7, 270, 0, 0, 0, 0], 30, "1 avuç"],
  ["Fındık", "Meyve ve kuruyemiş", [628, 15, 16.7, 60.8, 9.7, 4.3, 4.5, 0, 680, 114, 4.7, 163, 1, 6.3, 0, 0], 30, "1 avuç"],

  // Süt ürünleri
  ["Yoğurt (tam yağlı)", "Süt ürünleri", [61, 3.5, 4.7, 3.3, 0, 4.7, 2.1, 46, 155, 121, 0.05, 12, 27, 0.5, 0.1, 0.4], 150, "1 kase"],
  ["Süzme yoğurt", "Süt ürünleri", [73, 10, 3.9, 1.9, 0, 3.6, 1.2, 34, 141, 115, 0.1, 11, 10, 0, 0, 0.75], 150, "1 kase"],

  // Tatlılar
  ["Sütlü çikolata", "Tatlı ve atıştırmalık", [535, 7.7, 59, 30, 3.4, 52, 18.5, 79, 372, 189, 2.4, 63, 59, 0, 0, 0.75], 25, "4 kare"],
  ["Bitter çikolata (%70)", "Tatlı ve atıştırmalık", [598, 7.8, 46, 43, 11, 24, 24.5, 20, 715, 73, 11.9, 228, 2, 0, 0, 0.3], 20, "3 kare"],
  ["Baklava", "Tatlı ve atıştırmalık", [430, 7, 50, 23, 2, 30, 8, 250, 220, 40, 1.6, 50, 60, 0, 0, 0], 60, "2 dilim"],
  ["Sütlaç", "Tatlı ve atıştırmalık", [130, 3.5, 22, 3, 0.1, 15, 1.8, 60, 150, 110, 0.1, 13, 30, 0, 0, 0.3], 200, "1 kase"],
  ["Protein tozu (whey)", "Tatlı ve atıştırmalık", [400, 80, 8, 6, 0, 4, 3, 200, 500, 400, 1, 100, 0, 0, 0, 1], 30, "1 ölçek"],
];

const DRINK_ROWS: Row[] = [
  ["Çay (şekersiz)", "İçecekler", [1, 0, 0.3, 0, 0, 0, 0, 3, 37, 0, 0, 3, 0, 0, 0, 0], 100, "1 çay bardağı"],
  ["Türk kahvesi (şekersiz)", "İçecekler", [7, 0.2, 1, 0.1, 0, 0, 0, 2, 90, 3, 0.1, 6, 0, 0, 0, 0], 65, "1 fincan"],
  ["Filtre kahve", "İçecekler", [1, 0.1, 0, 0, 0, 0, 0, 2, 49, 2, 0, 3, 0, 0, 0, 0], 250, "1 kupa"],
  ["Latte", "İçecekler", [42, 2.8, 4.1, 1.5, 0, 4, 1, 40, 140, 105, 0.05, 11, 25, 0, 0.05, 0.35], 350, "1 orta boy"],
  ["Süt (tam yağlı)", "İçecekler", [61, 3.2, 4.8, 3.3, 0, 5, 1.9, 43, 132, 113, 0.03, 10, 46, 0, 0.1, 0.45], 200, "1 su bardağı"],
  ["Süt (yarım yağlı)", "İçecekler", [47, 3.4, 4.9, 1.5, 0, 4.9, 1, 44, 150, 120, 0.03, 11, 25, 0, 0.05, 0.45], 200, "1 su bardağı"],
  ["Ayran", "İçecekler", [37, 1.8, 2.5, 2, 0, 2.5, 1.3, 250, 80, 60, 0.03, 6, 15, 0, 0, 0.2], 200, "1 bardak"],
  ["Kefir", "İçecekler", [55, 3.4, 4.5, 2.5, 0, 4.5, 1.5, 40, 160, 120, 0.05, 11, 30, 0.5, 0.1, 0.3], 200, "1 bardak"],
  ["Portakal suyu", "İçecekler", [45, 0.7, 10.4, 0.2, 0.2, 8.4, 0, 1, 200, 11, 0.2, 11, 10, 50, 0, 0], 200, "1 bardak"],
  ["Kola", "İçecekler", [42, 0, 10.6, 0, 0, 10.6, 0, 4, 2, 2, 0, 0, 0, 0, 0, 0], 330, "1 kutu"],
  ["Kola (şekersiz)", "İçecekler", [0.3, 0, 0, 0, 0, 0, 0, 10, 4, 2, 0, 0, 0, 0, 0, 0], 330, "1 kutu"],
  ["Bira", "İçecekler", [43, 0.5, 3.6, 0, 0, 0, 0, 4, 27, 4, 0, 6, 0, 0, 0, 0.02], 500, "1 büyük"],
  ["Kırmızı şarap", "İçecekler", [85, 0.1, 2.6, 0, 0, 0.6, 0, 4, 127, 8, 0.5, 12, 0, 0, 0, 0], 150, "1 kadeh"],
  ["Rakı", "İçecekler", [250, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 50, "1 tek"],
];

function slug(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toFood([name, category, values, grams, label]: Row, drink = false): Food {
  const per100: Nutrients = {};
  NUTRIENT_KEYS.forEach((k, i) => (per100[k] = values[i]));
  return { id: slug(name), name, category, per100, portion: { grams, label }, drink };
}

export const FOODS: Food[] = [
  ...ROWS.map((r) => toFood(r)),
  ...DRINK_ROWS.map((r) => toFood(r, true)),
];

/** Türkçe karakterlere duyarsız arama için normalize eder. */
export function normalize(s: string): string {
  return slug(s).replace(/-/g, " ");
}

export function searchFoods(query: string): Food[] {
  const q = normalize(query).trim();
  if (!q) return FOODS;
  const words = q.split(" ");
  return FOODS.filter((f) => {
    const hay = normalize(`${f.name} ${f.category}`);
    return words.every((w) => hay.includes(w));
  });
}
