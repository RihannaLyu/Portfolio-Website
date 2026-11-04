// 16-season color analysis data.
// vec = [warmth, depth, clarity, contrast], each roughly -1..1
//   warmth:   -1 cool (blue/pink base)   ... +1 warm (golden/yellow base)
//   depth:    -1 light                   ... +1 deep
//   clarity:  -1 soft / muted            ... +1 bright / clear
//   contrast: -1 low (blended features)  ... +1 high (striking features)

export const FAMILIES = {
  Spring: { temp: "Warm", note: "Warm · light to clear", accent: "#F28C7A" },
  Summer: { temp: "Cool", note: "Cool · light to soft", accent: "#B38AB8" },
  Autumn: { temp: "Warm", note: "Warm · soft to deep", accent: "#C0703A" },
  Winter: { temp: "Cool", note: "Cool · clear to deep", accent: "#3B3F8C" },
};

export const SEASONS = [
  {
    id: "light-spring", name: "Light Spring", family: "Spring",
    vec: [0.35, -0.9, 0.2, -0.4],
    words: ["Delicate", "Sunlit", "Fresh"],
    desc: "Delicate and sunlit. Your coloring is light and warm-leaning, like peach blossoms in morning light. Soft, clear pastels with a golden glow make your skin look luminous.",
    colors: [
      ["#F7D9C4", "Peach Cream"], ["#FBC5A8", "Apricot Blush"], ["#F9A98B", "Light Coral"], ["#F48F8B", "Coral Pink"],
      ["#F6D57A", "Butter"], ["#CDE6A0", "Pistachio"], ["#9ED9C8", "Aqua Mint"], ["#8CCBE6", "Lagoon"],
      ["#A9B9EE", "Periwinkle"], ["#C8A2D9", "Sweet Violet"], ["#E8C9A1", "Light Camel"], ["#F7F0E1", "Ivory"],
    ],
  },
  {
    id: "warm-spring", name: "Warm Spring", family: "Spring",
    vec: [1.0, -0.2, 0.25, 0.0],
    words: ["Golden", "Sunny", "Honeyed"],
    desc: "Golden through and through. Warmth is your defining quality. Honeyed skin and a sunny glow come alive in apricot, marigold and warm turquoise.",
    colors: [
      ["#F5A04C", "Apricot"], ["#F07E5B", "Warm Coral"], ["#E8573A", "Tomato"], ["#F3C845", "Marigold"],
      ["#A7C957", "Spring Leaf"], ["#4DB6A0", "Warm Turquoise"], ["#2FA4A4", "Peacock"], ["#E9897E", "Salmon"],
      ["#D9A066", "Camel"], ["#B07548", "Golden Brown"], ["#F6E3C3", "Cream"], ["#6E8B3D", "Fern"],
    ],
  },
  {
    id: "bright-spring", name: "Bright Spring", family: "Spring",
    vec: [0.3, -0.1, 1.0, 0.55],
    words: ["Vivid", "Sparkling", "Lively"],
    desc: "Vivid and sparkling. High clarity and lively contrast mean you shine in clear, saturated colors with a warm twist: coral, poppy and tropical turquoise.",
    colors: [
      ["#FF5A5F", "Poppy"], ["#FF7F50", "Coral"], ["#FFC93C", "Sunflower"], ["#7ED957", "Bright Lime"],
      ["#00B894", "Jade"], ["#00BCD4", "Turquoise"], ["#2F80ED", "Clear Blue"], ["#8E5CF7", "Violet"],
      ["#FF4F9A", "Warm Fuchsia"], ["#FF9F68", "Bright Peach"], ["#1F3A93", "Bright Navy"], ["#FFF6E5", "Warm White"],
    ],
  },
  {
    id: "true-spring", name: "True Spring", family: "Spring",
    vec: [0.7, -0.45, 0.6, 0.1],
    words: ["Radiant", "Cheerful", "Clear"],
    desc: "Warm, fresh and radiant. Clear, cheerful colors with golden undertones, like a spring garden in full bloom, bring out your natural vibrance.",
    colors: [
      ["#F96E46", "Orange Coral"], ["#FF8C69", "Salmon"], ["#F4D35E", "Daffodil"], ["#9BC53D", "Leaf Green"],
      ["#3FB08F", "Jade"], ["#3AB7D0", "Aqua"], ["#4F8FD8", "Cornflower"], ["#E26D8E", "Warm Pink"],
      ["#F7B267", "Apricot"], ["#C68B59", "Caramel"], ["#2E5E8C", "Warm Navy"], ["#FDF1DC", "Cream"],
    ],
  },
  {
    id: "light-summer", name: "Light Summer", family: "Summer",
    vec: [-0.4, -0.9, -0.2, -0.45],
    words: ["Airy", "Powdery", "Gentle"],
    desc: "Soft and airy. Your light, cool-leaning coloring glows in powdery pastels like rose, lavender and sky blue, much like a watercolor painting.",
    colors: [
      ["#F2D7DE", "Pale Rose"], ["#E8B4C4", "Powder Pink"], ["#D99BB4", "Soft Raspberry"], ["#C5A3D2", "Lavender"],
      ["#B5C7E8", "Powder Blue"], ["#9FB8D9", "Sky"], ["#A8D5D1", "Sea Glass"], ["#B9D7B3", "Mint Sage"],
      ["#E6E1F0", "Lilac Mist"], ["#C9C1B8", "Light Taupe"], ["#8E9CB8", "Blue Gray"], ["#F7F3F5", "Soft White"],
    ],
  },
  {
    id: "cool-summer", name: "Cool Summer", family: "Summer",
    vec: [-1.0, -0.25, -0.05, -0.1],
    words: ["Serene", "Rosy", "Cool"],
    desc: "Cool and serene. Rosy undertones and gentle depth come alive in berry, periwinkle and sea-glass shades with a blue base.",
    colors: [
      ["#B25A86", "Berry"], ["#E79CB6", "Rose Pink"], ["#A94D63", "Cool Cherry"], ["#8E7CC3", "Lavender Purple"],
      ["#5A7DBF", "Periwinkle"], ["#3E5C93", "Slate Navy"], ["#6BA7B9", "Cool Aqua"], ["#4E9C9A", "Sea Teal"],
      ["#9BB7D4", "Cool Sky"], ["#CBB7D9", "Lilac"], ["#7A8597", "Blue Gray"], ["#F1EEF3", "Cool White"],
    ],
  },
  {
    id: "soft-summer", name: "Soft Summer", family: "Summer",
    vec: [-0.3, -0.05, -1.0, -0.35],
    words: ["Misty", "Elegant", "Muted"],
    desc: "Misty and elegant. Your coloring is gently blended and low in contrast, so muted, dusty colors like mauve, slate and sage look effortlessly refined on you.",
    colors: [
      ["#A88497", "Dusty Mauve"], ["#C3A1A8", "Rose Taupe"], ["#B28A8E", "Dusty Rose"], ["#8C6F86", "Smoky Plum"],
      ["#7B8DAA", "Dusty Blue"], ["#5F7385", "Slate"], ["#87A3A0", "Sage Teal"], ["#9AAE98", "Muted Sage"],
      ["#B7AFA3", "Mushroom"], ["#CFC4C7", "Gray Rose"], ["#6E6870", "Charcoal Mauve"], ["#4F5D6E", "Muted Navy"],
    ],
  },
  {
    id: "true-summer", name: "True Summer", family: "Summer",
    vec: [-0.7, -0.4, -0.5, -0.2],
    words: ["Graceful", "Soft", "Classic"],
    desc: "Classic summer grace. You are cool, medium-light and softly blended, and you look best in rose, cornflower and soft raspberry.",
    colors: [
      ["#C06C84", "Rose"], ["#D995AA", "Soft Pink"], ["#A35A72", "Soft Raspberry"], ["#9A7FB5", "Soft Violet"],
      ["#6F8BC2", "Cornflower"], ["#4B6A9B", "Summer Blue"], ["#6FA3A8", "Muted Teal"], ["#8FB3C9", "Powder Blue"],
      ["#7FA08F", "Cool Sage"], ["#9D8E9E", "Gray Mauve"], ["#3D4E6E", "Navy"], ["#ECE8EC", "Soft White"],
    ],
  },
  {
    id: "soft-autumn", name: "Soft Autumn", family: "Autumn",
    vec: [0.3, 0.05, -1.0, -0.35],
    words: ["Earthy", "Gentle", "Golden-hour"],
    desc: "Warm and gently muted. Like golden hour through linen, your best colors are soft and earthy: camel, sage and dusty terracotta.",
    colors: [
      ["#C8A27C", "Camel"], ["#C59A84", "Rose Brown"], ["#B8746A", "Dusty Brick"], ["#D9A391", "Peach Clay"],
      ["#D6B58A", "Wheat"], ["#A59A6A", "Khaki Olive"], ["#8C9F82", "Sage"], ["#6F8C7E", "Eucalyptus"],
      ["#6E8A9A", "Soft Teal Blue"], ["#8C7462", "Taupe Brown"], ["#9C7A86", "Muted Plum"], ["#EDE0CC", "Oatmeal"],
    ],
  },
  {
    id: "warm-autumn", name: "Warm Autumn", family: "Autumn",
    vec: [1.0, 0.3, -0.3, 0.0],
    words: ["Spiced", "Rich", "Golden"],
    desc: "Rich and golden. Your warmth glows in spice tones like pumpkin, mustard, olive and rust, the colors of a harvest afternoon.",
    colors: [
      ["#C8662E", "Pumpkin"], ["#B5472E", "Rust"], ["#CC7A55", "Terracotta"], ["#E0A23A", "Mustard Gold"],
      ["#D9B34A", "Ochre"], ["#8A8A2E", "Olive"], ["#5E7E3A", "Moss"], ["#2F6B5E", "Deep Teal"],
      ["#A0522D", "Sienna"], ["#7B3F2A", "Chestnut"], ["#E9C79A", "Butterscotch"], ["#F2E3C6", "Warm Cream"],
    ],
  },
  {
    id: "deep-autumn", name: "Deep Autumn", family: "Autumn",
    vec: [0.4, 1.0, -0.15, 0.35],
    words: ["Luxurious", "Deep", "Warm"],
    desc: "Deep, warm and luxurious. Your depth carries rich colors with ease, such as mahogany, forest green, bronze and burgundy.",
    colors: [
      ["#6B2E1F", "Mahogany"], ["#8B3A2B", "Brick"], ["#7A1F2B", "Warm Burgundy"], ["#A8412F", "Paprika"],
      ["#B8862B", "Bronze Gold"], ["#5C5A24", "Dark Olive"], ["#2F4F3A", "Forest"], ["#1F4E4F", "Deep Teal"],
      ["#4A2C4A", "Aubergine"], ["#3E2A20", "Chocolate"], ["#C29458", "Caramel"], ["#EAD7B7", "Cream"],
    ],
  },
  {
    id: "true-autumn", name: "True Autumn", family: "Autumn",
    vec: [0.75, 0.5, -0.5, 0.1],
    words: ["Grounded", "Earthy", "Glowing"],
    desc: "Earthy and warm. Burnt orange, olive and teal echo the warmth of your skin and give you a grounded, glowing look.",
    colors: [
      ["#CC5500", "Burnt Orange"], ["#B7410E", "Rust"], ["#9C3D2E", "Brick Red"], ["#E1A63B", "Marigold"],
      ["#8E7F3A", "Olive Gold"], ["#6B8E23", "Olive Green"], ["#3E6B48", "Hunter Green"], ["#2E7D74", "Teal"],
      ["#8B4513", "Saddle Brown"], ["#D2A679", "Camel"], ["#5B3A29", "Espresso"], ["#F0DEC0", "Cream"],
    ],
  },
  {
    id: "deep-winter", name: "Deep Winter", family: "Winter",
    vec: [-0.4, 1.0, 0.2, 0.6],
    words: ["Dramatic", "Jeweled", "Deep"],
    desc: "Dark, dramatic and cool-leaning. Your striking depth suits jewel tones like midnight, deep berry, emerald and crisp black.",
    colors: [
      ["#8B0F2E", "Deep Red"], ["#5B1A3A", "Dark Berry"], ["#C2185B", "Deep Fuchsia"], ["#2E1A47", "Deep Plum"],
      ["#4B0082", "Indigo"], ["#26408B", "Royal"], ["#0E3B5C", "Sapphire"], ["#0B5C4E", "Deep Emerald"],
      ["#1B1B3A", "Midnight"], ["#5A5A66", "Charcoal"], ["#111111", "Black"], ["#F5F5F7", "Icy White"],
    ],
  },
  {
    id: "cool-winter", name: "Cool Winter", family: "Winter",
    vec: [-1.0, 0.4, 0.45, 0.6],
    words: ["Icy", "Regal", "Crisp"],
    desc: "Icy and regal. A blue-based undertone and strong contrast make you dazzle in magenta, cobalt, pine and pure white.",
    colors: [
      ["#D1006F", "Magenta"], ["#A0004F", "Cool Berry"], ["#6A1B9A", "Purple"], ["#2338A8", "Cobalt"],
      ["#0E5FA6", "Sapphire"], ["#00875A", "Cool Emerald"], ["#00796B", "Pine"], ["#C9D6F2", "Icy Blue"],
      ["#F3D1E6", "Icy Pink"], ["#2B2D42", "Charcoal Navy"], ["#000000", "Black"], ["#FFFFFF", "Pure White"],
    ],
  },
  {
    id: "bright-winter", name: "Bright Winter", family: "Winter",
    vec: [-0.3, 0.1, 1.0, 0.85],
    words: ["Electric", "Crystal", "Striking"],
    desc: "Electric and crystal clear. Your high contrast and clarity let you wear the most vivid colors: hot pink, true red and electric blue.",
    colors: [
      ["#FF1F70", "Hot Pink"], ["#E0002A", "True Red"], ["#C51162", "Cerise"], ["#8C1EFF", "Electric Violet"],
      ["#0057FF", "Electric Blue"], ["#00B3E6", "Bright Cyan"], ["#00C37A", "Bright Emerald"], ["#F4F06A", "Icy Lemon"],
      ["#FF6EC7", "Bright Orchid"], ["#1A237E", "Deep Navy"], ["#000000", "Black"], ["#FFFFFF", "Pure White"],
    ],
  },
  {
    id: "true-winter", name: "True Winter", family: "Winter",
    vec: [-0.7, 0.5, 0.6, 0.7],
    words: ["Bold", "Pristine", "Iconic"],
    desc: "Bold and pristine. Your coloring is cool, clear and high in contrast, so cherry red, royal blue, emerald and black-and-white look iconic on you.",
    colors: [
      ["#C8102E", "Cherry"], ["#E30B5C", "Raspberry"], ["#7B1FA2", "Royal Purple"], ["#1F3FBF", "Royal Blue"],
      ["#003B6F", "Navy"], ["#007A5E", "Emerald"], ["#00A3AD", "Icy Teal"], ["#DDE6F3", "Icy Blue"],
      ["#F7E1EC", "Icy Pink"], ["#50525A", "Charcoal"], ["#000000", "Black"], ["#FFFFFF", "Pure White"],
    ],
  },
];

export function metalsFor(vec) {
  const w = vec[0];
  if (w > 0.45) return [["Yellow gold", "#D4AF37"], ["Bronze", "#B08D57"], ["Copper", "#B87333"]];
  if (w < -0.45) return [["Silver", "#C0C4CC"], ["Platinum", "#E5E4E2"], ["White gold", "#E8E3D6"]];
  return w >= 0
    ? [["Rose gold", "#C9967A"], ["Soft gold", "#D8BE7A"], ["Brushed silver", "#BFC3C8"]]
    : [["Rose gold", "#C9967A"], ["Silver", "#C0C4CC"], ["Pewter", "#9A9A9E"]];
}
