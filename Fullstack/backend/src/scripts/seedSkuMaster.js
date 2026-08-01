require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const SkuMaster = require('../models/SkuMaster');

const SEEDS = [
  { skuErpCode: '11423', name: 'Mentos Mint Rs 1 Single Candy 100pcs Jar', hsnCode: '17049040', mrp: 1.00, agreedRate: 0.76, uom: 'JAR' },
  { skuErpCode: '11797', name: 'Mentos Mint Rs2 Single Candy 100pcs Jar', hsnCode: '17049040', mrp: 2.00, agreedRate: 1.54, uom: 'JAR' },
  { skuErpCode: '11857', name: 'Mentos Lime Rs 1 Single Candy 100pcs Jar', hsnCode: '17049040', mrp: 1.00, agreedRate: 0.76, uom: 'JAR' },
  { skuErpCode: '11901', name: 'Mentos Watermelon 5pcs Candy x 36units', hsnCode: '17049040', mrp: 5.00, agreedRate: 3.54, uom: 'CTN' },
  { skuErpCode: '12002', name: 'Chupa Chups Assorted 10gm', hsnCode: '17049040', mrp: 10.00, agreedRate: 7.12, uom: 'PCS' },
  { skuErpCode: '12100', name: 'Mentos Mini Rolls Mint 10pcs', hsnCode: '17049040', mrp: 10.00, agreedRate: 7.50, uom: 'PKT' },
  { skuErpCode: '12200', name: 'Fruittella Mixed Bag 120gm', hsnCode: '17049040', mrp: 120.00, agreedRate: 92.00, uom: 'BAG' },
  { skuErpCode: '12300', name: 'Mentos Rainbow Rs5 Multi', hsnCode: '17049040', mrp: 5.00, agreedRate: 3.85, uom: 'PKT' },
  { skuErpCode: '12400', name: 'Mentos Now Mints Spearmint 18gm', hsnCode: '17049040', mrp: 30.00, agreedRate: 23.10, uom: 'BOX' },
  { skuErpCode: '12500', name: 'Mentos Now Mints Orange 18gm', hsnCode: '17049040', mrp: 30.00, agreedRate: 23.10, uom: 'BOX' },
  { skuErpCode: '12600', name: 'Chupa Chups Lemon 11gm', hsnCode: '17049040', mrp: 10.00, agreedRate: 7.12, uom: 'PCS' },
  { skuErpCode: '12700', name: 'Chupa Chups Strawberry 11gm', hsnCode: '17049040', mrp: 10.00, agreedRate: 7.12, uom: 'PCS' },
  { skuErpCode: '12800', name: 'Chupa Chups Cola 11gm', hsnCode: '17049040', mrp: 10.00, agreedRate: 7.12, uom: 'PCS' },
  { skuErpCode: '12900', name: 'Chupa Chups Watermelon 11gm', hsnCode: '17049040', mrp: 10.00, agreedRate: 7.12, uom: 'PCS' },
  { skuErpCode: '13000', name: 'Chupa Chups Best Of 15pcs Lollipop Box', hsnCode: '17049040', mrp: 150.00, agreedRate: 110.00, uom: 'BOX' },
  { skuErpCode: '13100', name: 'Fruittella Strawberry 41gm', hsnCode: '17049040', mrp: 30.00, agreedRate: 23.10, uom: 'PKT' },
  { skuErpCode: '13200', name: 'Fruittella Tropical 41gm', hsnCode: '17049040', mrp: 30.00, agreedRate: 23.10, uom: 'PKT' },
  { skuErpCode: '13300', name: 'Fruittella Multifruit 41gm', hsnCode: '17049040', mrp: 30.00, agreedRate: 23.10, uom: 'PKT' },
  { skuErpCode: '13400', name: 'Mentos Gum Watermelon Box', hsnCode: '17049040', mrp: 20.00, agreedRate: 15.00, uom: 'BOX' },
  { skuErpCode: '13500', name: 'Mentos Gum White Mint Box', hsnCode: '17049040', mrp: 20.00, agreedRate: 15.00, uom: 'BOX' },
  { skuErpCode: '13600', name: 'Mentos Pure Fresh Spearmint 15.5gm', hsnCode: '17049040', mrp: 30.00, agreedRate: 23.10, uom: 'PKT' },
  { skuErpCode: '13700', name: 'Mentos Pure Fresh Green Tea 15.5gm', hsnCode: '17049040', mrp: 30.00, agreedRate: 23.10, uom: 'PKT' },
  { skuErpCode: '13800', name: 'Mentos Pure Fresh Peppermint 15.5gm', hsnCode: '17049040', mrp: 30.00, agreedRate: 23.10, uom: 'PKT' },
  { skuErpCode: '13900', name: 'Fruittella Duo Strawberry Lemon 40gm', hsnCode: '17049040', mrp: 30.00, agreedRate: 23.10, uom: 'PKT' },
  { skuErpCode: '14000', name: 'Chupa Chups Sugar Free 11gm Mixed', hsnCode: '17049040', mrp: 15.00, agreedRate: 11.55, uom: 'PCS' },
  { skuErpCode: '14100', name: 'Mentos Mint Jar Display 100pcs', hsnCode: '17049040', mrp: 100.00, agreedRate: 76.00, uom: 'JAR' },
  { skuErpCode: '14200', name: 'Chupa Chups Party Pack 20pcs', hsnCode: '17049040', mrp: 200.00, agreedRate: 150.00, uom: 'PKT' },
  { skuErpCode: '14300', name: 'Fruittella Jelly Mix 100gm', hsnCode: '17049040', mrp: 80.00, agreedRate: 62.00, uom: 'PKT' },
  { skuErpCode: '14400', name: 'Mentos Spearmint Rolls 5pcs Pack', hsnCode: '17049040', mrp: 50.00, agreedRate: 38.50, uom: 'PKT' },
  { skuErpCode: '14500', name: 'Mentos XXL Mint Jar 200pcs', hsnCode: '17049040', mrp: 200.00, agreedRate: 152.00, uom: 'JAR' },
  { skuErpCode: '14600', name: 'Chupa Chups Sour Belts Strawberry 50gm', hsnCode: '17049040', mrp: 50.00, agreedRate: 38.50, uom: 'PKT' },
  { skuErpCode: '14700', name: 'Fruittella Cream Soft Candy 45gm', hsnCode: '17049040', mrp: 35.00, agreedRate: 27.00, uom: 'PKT' },
  { skuErpCode: '14800', name: 'Mentos Citrus Candy 100pcs Jar', hsnCode: '17049040', mrp: 100.00, agreedRate: 76.00, uom: 'JAR' },
  { skuErpCode: '14900', name: 'Chupa Chups Mega Lollipop 29gm', hsnCode: '17049040', mrp: 30.00, agreedRate: 23.00, uom: 'PCS' },
  { skuErpCode: '15000', name: 'Mentos Fanta Collab Mix Pack', hsnCode: '17049040', mrp: 25.00, agreedRate: 19.25, uom: 'PKT' },
  { skuErpCode: '15100', name: 'Fruittella Peach Gummies 35gm', hsnCode: '17049040', mrp: 30.00, agreedRate: 23.10, uom: 'PKT' },
  { skuErpCode: '15200', name: 'Chupa Chups Mini 50pcs Bag', hsnCode: '17049040', mrp: 250.00, agreedRate: 190.00, uom: 'BAG' },
  { skuErpCode: '15300', name: 'Mentos Grape Candy 100pcs Jar', hsnCode: '17049040', mrp: 100.00, agreedRate: 76.00, uom: 'JAR' },
  { skuErpCode: '15400', name: 'Fruittella Sour Berry Mix 50gm', hsnCode: '17049040', mrp: 40.00, agreedRate: 30.80, uom: 'PKT' },
  { skuErpCode: '15500', name: 'Chupa Chups Strawberry Cream 11gm', hsnCode: '17049040', mrp: 10.00, agreedRate: 7.12, uom: 'PCS' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/three-way-match');
  let inserted = 0, updated = 0;
  for (const item of SEEDS) {
    const res = await SkuMaster.findOneAndUpdate(
      { skuErpCode: item.skuErpCode },
      item,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (res.createdAt && res.updatedAt && res.createdAt.getTime() === res.updatedAt.getTime()) inserted++;
    else updated++;
  }
  console.log(`Seed complete: ${inserted} inserted, ${updated} updated. Total: ${SEEDS.length} SKUs.`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
