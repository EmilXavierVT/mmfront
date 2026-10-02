export const PUBLIC_PRODUCT_YEAR = 2026;

const pexelsImage = id => (
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1400`
);

const pexelsPage = slug => `https://www.pexels.com/photo/${slug}/`;

const PRODUCT_IMAGES = {
  breakfastFull: {
    src: pexelsImage('26654306'),
    sourceUrl: pexelsPage('top-view-of-plate-with-breakfast-ingredients-26654306'),
    alt: 'Professional breakfast plate with bread, jam, cheese, and eggs',
  },
  breakfastYogurt: {
    src: pexelsImage('6133453'),
    sourceUrl: pexelsPage('healthy-breakfast-bowl-of-granola-and-fruits-6133453'),
    alt: 'Yogurt breakfast bowl with granola and fresh berries',
  },
  breakfastBmo: {
    src: pexelsImage('11461078'),
    sourceUrl: pexelsPage('a-bread-with-cheese-topping-on-ceramic-plate-11461078'),
    alt: 'Breakfast bread with cheese and eggs on a ceramic plate',
  },
  cake: {
    src: pexelsImage('1146409'),
    sourceUrl: pexelsPage('dessert-topped-with-berries-1146409'),
    alt: 'Elegant cake dessert with berries on a plate',
  },
  cakeFruit: {
    src: pexelsImage('18955555'),
    sourceUrl: pexelsPage('variety-of-desserts-in-glass-cups-18955555'),
    alt: 'Professional dessert cups topped with fresh fruit',
  },
  cardamomBuns: {
    src: pexelsImage('4946614'),
    sourceUrl: pexelsPage('delicious-sweet-pastry-placed-on-counter-4946614'),
    alt: 'Fresh cinnamon-style bakery buns in a professional pastry display',
  },
  cookingClass: {
    src: pexelsImage('18115910'),
    sourceUrl: pexelsPage('chef-learning-how-to-cook-18115910'),
    alt: 'Hands-on cooking class with a chef teaching participants',
  },
  dinnerCourses: {
    src: pexelsImage('6605778'),
    sourceUrl: pexelsPage('assorted-healthy-dishes-with-various-roasted-and-fresh-vegetables-in-kitchen-6605778'),
    alt: 'Vegetarian dinner spread with roasted cauliflower, grilled carrots, eggplant, and salads',
  },
  dinnerSpread: {
    src: pexelsImage('18058361'),
    sourceUrl: pexelsPage('dinner-served-on-a-plate-in-a-restaurant-18058361'),
    alt: 'Elegant restaurant dinner plate with vegetables and sauce',
  },
  eveningMeal: {
    src: pexelsImage('18446102'),
    sourceUrl: pexelsPage('delicious-dish-on-plate-on-restaurant-table-18446102'),
    alt: 'Professional vegetable-forward dinner plate with root vegetables',
  },
  fishCourse: {
    src: pexelsImage('3655916'),
    sourceUrl: pexelsPage('salmon-dish-on-a-ceramic-plate-3655916'),
    alt: 'Professional plated salmon dish with grains, herbs, and sauce',
  },
  fishStarter: {
    src: pexelsImage('31261425'),
    sourceUrl: pexelsPage('elegant-salmon-dish-in-citrus-sauce-on-white-plate-31261425'),
    alt: 'Elegant fish starter with citrus sauce on a white plate',
  },
  fruit: {
    src: pexelsImage('34891879'),
    sourceUrl: pexelsPage('colorful-fruit-salad-served-at-catering-event-34891879'),
    alt: 'Colorful fruit salad cups prepared for a catering event',
  },
  lunchBowl: {
    src: pexelsImage('19381529'),
    sourceUrl: pexelsPage('meal-with-vegetables-on-plate-19381529'),
    alt: 'Professional lunch plate with bright salad and vegetables',
  },
  muesliBar: {
    src: pexelsImage('3026806'),
    sourceUrl: pexelsPage('top-view-photo-of-granola-bars-3026806'),
    alt: 'Professional top-view photo of homemade granola bars',
  },
  pastaSalad: {
    src: pexelsImage('8385550'),
    sourceUrl: pexelsPage('a-vegetable-salad-on-a-ceramic-bowl-8385550'),
    alt: 'Professional pasta salad with fresh vegetables and feta in a ceramic bowl',
  },
  porridge: {
    src: pexelsImage('10421049'),
    sourceUrl: pexelsPage('spoon-in-a-bowl-with-yogurt-and-berries-10421049'),
    alt: 'Bowl of yogurt, granola, nuts, and berries',
  },
  roastedChicken: {
    src: pexelsImage('18058361'),
    sourceUrl: pexelsPage('dinner-served-on-a-plate-in-a-restaurant-18058361'),
    alt: 'Elegant restaurant dinner plate with vegetables and sauce',
  },
  steakCourse: {
    src: pexelsImage('299347'),
    sourceUrl: pexelsPage('well-done-beef-steak-and-vegetables-on-plate-299347'),
    alt: 'Wide professional beef plate with vegetables, herbs, and sauce',
  },
  smorrebrod: {
    src: pexelsImage('28537826'),
    sourceUrl: pexelsPage('delicious-asparagus-and-poached-egg-toast-28537826'),
    alt: 'Vegetarian open sandwich with asparagus, avocado, peas, and poached egg',
  },
  smorrebrodVegetarian: {
    src: pexelsImage('28537826'),
    sourceUrl: pexelsPage('delicious-asparagus-and-poached-egg-toast-28537826'),
    alt: 'Vegetarian open sandwich with asparagus, avocado, peas, and poached egg',
  },
  snacks: {
    src: pexelsImage('34644302'),
    sourceUrl: pexelsPage('colorful-veggie-sticks-with-creamy-hummus-dip-34644302'),
    alt: 'Professional vegetable snack sticks with creamy hummus dip',
  },
};

const ECONOMIC_PRODUCT_IMAGE_BY_NUMBER = {
  1092: PRODUCT_IMAGES.breakfastYogurt,
  1093: PRODUCT_IMAGES.breakfastBmo,
  1094: PRODUCT_IMAGES.pastaSalad,
  1095: PRODUCT_IMAGES.eveningMeal,
  1096: PRODUCT_IMAGES.steakCourse,
  1097: PRODUCT_IMAGES.breakfastFull,
  1098: PRODUCT_IMAGES.porridge,
  1099: PRODUCT_IMAGES.cardamomBuns,
  1101: PRODUCT_IMAGES.snacks,
  1102: PRODUCT_IMAGES.fruit,
  1103: PRODUCT_IMAGES.cake,
  1104: PRODUCT_IMAGES.cakeFruit,
  1105: PRODUCT_IMAGES.muesliBar,
  1107: PRODUCT_IMAGES.smorrebrod,
  1108: PRODUCT_IMAGES.smorrebrodVegetarian,
  1109: PRODUCT_IMAGES.dinnerCourses,
  1110: PRODUCT_IMAGES.cake,
  1111: PRODUCT_IMAGES.dinnerSpread,
  1112: PRODUCT_IMAGES.fishCourse,
  1113: PRODUCT_IMAGES.fishStarter,
  1114: PRODUCT_IMAGES.cookingClass,
};

const PRODUCT_IMAGE_RULES = [
  { terms: ['kardemomme', 'snurre'], image: PRODUCT_IMAGES.cardamomBuns },
  { terms: ['kage og frugt'], image: PRODUCT_IMAGES.cakeFruit },
  { terms: ['myslibar'], image: PRODUCT_IMAGES.muesliBar },
  { terms: ['dessert', 'kage'], image: PRODUCT_IMAGES.cake },
  { terms: ['smørrebrød', 'smoerrebroed'], image: PRODUCT_IMAGES.smorrebrod },
  { terms: ['frokost', 'pastasalat'], image: PRODUCT_IMAGES.pastaSalad },
  { terms: ['fisk'], image: PRODUCT_IMAGES.fishCourse },
  { terms: ['kød', 'kod', 'hovedret', 'forret'], image: PRODUCT_IMAGES.steakCourse },
  { terms: ['den lille middag'], image: PRODUCT_IMAGES.dinnerCourses },
  { terms: ['social middag'], image: PRODUCT_IMAGES.dinnerSpread },
  { terms: ['aftensmad', 'aften'], image: PRODUCT_IMAGES.eveningMeal },
  { terms: ['grød', 'groed'], image: PRODUCT_IMAGES.porridge },
  { terms: ['bmo', 'bolle'], image: PRODUCT_IMAGES.breakfastBmo },
  { terms: ['morgenmad'], image: PRODUCT_IMAGES.breakfastFull },
  { terms: ['sunde og sprøde', 'snack'], image: PRODUCT_IMAGES.snacks },
  { terms: ['frugt'], image: PRODUCT_IMAGES.fruit },
  { terms: ['kokkeskole'], image: PRODUCT_IMAGES.cookingClass },
  { terms: ['rengøring', 'cleaning'], image: PRODUCT_IMAGES.breakfastFull },
  { terms: ['dagsmøde', 'firmafest', 'diverse', 'tillæg'], image: PRODUCT_IMAGES.dinnerSpread },
];

const FALLBACK_IMAGES = [
  PRODUCT_IMAGES.lunchBowl,
  PRODUCT_IMAGES.roastedChicken,
  PRODUCT_IMAGES.dinnerSpread,
  PRODUCT_IMAGES.snacks,
];

export function isPublicProduct(product) {
  const titleYear = String(product?.name || '').match(/\b20\d{2}\b/)?.[0];
  return Number(titleYear) === PUBLIC_PRODUCT_YEAR;
}

export function getPublicProductName(product) {
  const rawName = String(product?.name || 'Untitled product');
  const cleaned = rawName
    .replace(/^\s*2026\s*[-–:]?\s*/i, '')
    .replace(/\s*[-–:]?\s*2026\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return rawName;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function getPublicProductImage(product, index = 0) {
  const economicProductNumber = String(product?.economicProductNumber || '').trim();
  const exactMatch = ECONOMIC_PRODUCT_IMAGE_BY_NUMBER[economicProductNumber];
  if (exactMatch) {
    return exactMatch;
  }

  const haystack = [
    product?.name,
    product?.desc,
    product?.description,
    product?.economicProductGroupName,
  ].join(' ').toLowerCase();

  const match = PRODUCT_IMAGE_RULES.find(rule => (
    rule.terms.some(term => haystack.includes(term))
  ));

  if (match) {
    return match.image;
  }

  const image = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  return { ...image, alt: `${getPublicProductName(product)} from Morgendagens Måltid` };
}

export function toPublicProduct(product, index = 0) {
  const image = getPublicProductImage(product, index);
  return {
    ...product,
    publicName: getPublicProductName(product),
    name: getPublicProductName(product),
    imageUrl: image.src,
    imageAlt: image.alt,
    imageSourceUrl: image.sourceUrl,
  };
}
