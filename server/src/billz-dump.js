// Saves raw BILLZ products + the mapped catalog, so field mapping can be checked on real data.
//   npm run billz:dump
import fs from 'node:fs';
import { fetchBillzProducts, mapBillzCatalog } from './billz.js';

const raw = await fetchBillzProducts();
fs.writeFileSync('billz-sample.json', JSON.stringify(raw.slice(0, 20), null, 2));
const catalog = mapBillzCatalog(raw);
fs.writeFileSync('billz-catalog.json', JSON.stringify(catalog, null, 2));
console.log(`BILLZ: ${raw.length} raw products → ${catalog.products.length} storefront products, ${catalog.categories.length} categories`);
console.log('Written: billz-sample.json (raw, first 20), billz-catalog.json (mapped)');
