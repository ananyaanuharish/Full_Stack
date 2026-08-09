const SkuMaster = require('../models/SkuMaster');

async function resolveSkuMaster(items) {
  // Build lookup maps once
  const allSkus = await SkuMaster.find({});
  const byErpCode = new Map(allSkus.map(s => [s.skuErpCode.trim().toLowerCase(), s]));
  const byEanCode = new Map(allSkus.filter(s => s.eanCode).map(s => [s.eanCode.trim().toLowerCase(), s]));
  const byAltCode = new Map();
  for (const s of allSkus) {
    for (const alt of s.altCodes || []) {
      if (alt) byAltCode.set(alt.trim().toLowerCase(), s);
    }
  }

  return items.map(item => {
    const code = (item.itemCode || '').trim().toLowerCase();
    let sku = byErpCode.get(code) || byEanCode.get(code) || byAltCode.get(code) || null;

    const flags = (item.flags || []).filter(f => f !== 'unmapped_master_sku');
    if (!sku) {
      flags.push('unmapped_master_sku');
    }

    return {
      ...item,
      skuMaster: sku ? sku._id : null,
      flags,
    };
  });
}

module.exports = { resolveSkuMaster };
