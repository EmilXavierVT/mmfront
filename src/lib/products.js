export const CLEANING_PRODUCT_TYPE = 42;

export const PRODUCT_TYPE_LABELS = {
  1: 'Drinks',
  2: 'Mains',
  3: 'Sides',
  4: 'Sweets',
  [CLEANING_PRODUCT_TYPE]: 'Cleaning',
};

export function getProductYear(product) {
  const titleYear = String(product?.name || '').match(/\b20\d{2}\b/)?.[0];
  if (titleYear) return Number(titleYear);

  if (!product?.economicLastUpdated) return null;
  const updatedYear = new Date(product.economicLastUpdated).getFullYear();
  return Number.isFinite(updatedYear) ? updatedYear : null;
}

const PRODUCT_COLORS = ['#497da6', '#d9a35f', '#9fc7a4', '#d86f64', '#c13a86', '#342f33'];

export const normalizeProduct = (product, index) => ({
  id: product.economicProductNumber || product.id,
  economicProductNumber: product.economicProductNumber || String(product.id || ''),
  economicProductGroupName: product.economicProductGroupName || '',
  economicProductGroupNumber: product.economicProductGroupNumber ?? null,
  economicLastUpdated: product.economicLastUpdated || null,
  name: product.name || 'Untitled product',
  desc: product.description || '',
  price: product.price || 0,
  type: product.type,
  productInRequestIds: product.productInRequestIds || [],
  color: PRODUCT_COLORS[index % PRODUCT_COLORS.length],
  tags: [],
});
