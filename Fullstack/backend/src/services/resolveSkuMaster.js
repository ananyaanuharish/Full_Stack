const SkuMaster = require('../models/SkuMaster');

async function resolveSkuMaster(items) {
  // Build lookup maps once
  const allSkus = await SkuMaster.find({});
  const byErpCode = new Map(allSkus.map(s => [s.skuErpCode.trim(), s]));
  const byEanCode = new Map(allSkus.filter(s => s.eanCode).map(s => [s.eanCode.trim(), s]));

  return items.map(item => {
    const code = (item.itemCode || '').trim();
    let sku = byErpCode.get(code) || byEanCode.get(code) || null;

    const flags = [...(item.flags || [])];
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
