export const CLEANING_PRODUCT_TYPE = 42;

export const PRODUCT_TYPE_LABELS = {
  1: 'Drinks',
  2: 'Mains',
  3: 'Sides',
  4: 'Sweets',
  [CLEANING_PRODUCT_TYPE]: 'Cleaning',
};

const PRODUCT_COLORS = ['#0496ff', '#efab6c', '#a8f2a2', '#fa5d5d', '#ff1dff', '#1c1a1c'];

export const normalizeProduct = (product, index) => ({
  id: product.id,
  name: product.name || 'Untitled product',
  desc: product.description || '',
  price: product.price || 0,
  type: product.type,
  productInRequestIds: product.productInRequestIds || [],
  color: PRODUCT_COLORS[index % PRODUCT_COLORS.length],
  tags: [],
});
