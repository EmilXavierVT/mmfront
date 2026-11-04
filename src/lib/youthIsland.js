const SPECIAL_PRODUCT_NUMBERS = new Set(['1019', 'DIVERSE']);

export function isSpecialServing(item) {
  return SPECIAL_PRODUCT_NUMBERS.has(String(item?.productNumber || '').trim().toUpperCase());
}

export function findSpecialServingProduct(products) {
  const available = products.filter(product => product.economicAvailable !== false);
  return available.find(product => String(product.economicProductNumber).trim() === '1019')
    || available.find(product => String(product.economicProductNumber).trim().toUpperCase() === 'DIVERSE');
}

export function getServingDateTime(item, booking) {
  if (item?.servingDateTime) return item.servingDateTime;
  const date = booking?.eventDate || String(booking?.startDateTime || '').slice(0, 10);
  if (!date || !item?.servingTime) return '';
  return `${date}T${item.servingTime}`;
}
