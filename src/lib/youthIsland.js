const SPECIAL_PRODUCT_NUMBERS = new Set(['1019', 'DIVERSE']);

function searchText(value) {
  return String(value || '').toLocaleLowerCase('da').normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/ø/g, 'o').replace(/æ/g, 'ae');
}

export function searchYouthProducts(products, query) {
  const terms = searchText(query).trim().split(/\s+/).filter(Boolean);
  return products.filter(product => {
    const text = searchText(`${product.name} ${product.economicProductNumber}`);
    return terms.every(term => text.includes(term));
  });
}

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
