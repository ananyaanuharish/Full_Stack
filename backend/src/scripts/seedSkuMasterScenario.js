require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const SkuMaster = require('../models/SkuMaster');

// Baseline: correct master data matching PO CI4PO05788's real momos/meat catalog.
const BASELINE = [
  { skuErpCode: '11423', name: 'Cheesy Spicy Veg Momos 24.0 Pieces', hsnCode: '19022010', mrp: 305.00, agreedRate: 220.762, uom: 'PKT', altCodes: ['FG-P-F-0503'] },
  { skuErpCode: '11797', name: 'Meatigo Hot Wings 250.0g', hsnCode: '02071400', mrp: 175.00, agreedRate: 126.667, uom: 'PKT', altCodes: ['FG-M-F-1703'] },
  { skuErpCode: '18003', name: 'Meatigo Chicken Curry Cut Skinless Frozen 450.0g', hsnCode: '02071300', mrp: 195.00, agreedRate: 141.143, uom: 'PKT', altCodes: ['FG-M-F-0620'] },
  { skuErpCode: '18004', name: 'Meatigo Chicken Boneless Breast Frozen 450.0g', hsnCode: '02071300', mrp: 275.00, agreedRate: 199.048, uom: 'PKT', altCodes: ['FG-M-F-0619'] },
  { skuErpCode: '18906', name: 'Spring Rolls Veg Frozen 240.0g', hsnCode: '20049000', mrp: 170.00, agreedRate: 123.048, uom: 'PKT' },
  { skuErpCode: '253430', name: 'Pork Salami 200.0g', hsnCode: '16010000', mrp: 260.00, agreedRate: 188.190, uom: 'PKT', altCodes: ['FG-P-F-0249'] },
  { skuErpCode: '33387', name: 'Frozen Chicken Chilli Salami 200.0g', hsnCode: '16010000', mrp: 175.00, agreedRate: 126.667, uom: 'PKT', altCodes: ['FG-P-F-0234'] },
  { skuErpCode: '33388', name: 'Frozen Chicken Pepperoni Salami 100.0g', hsnCode: '16010000', mrp: 150.00, agreedRate: 108.571, uom: 'PKT' },
  { skuErpCode: '33390', name: 'Chicken Seekh Kebab 500.0g', hsnCode: '16010000', mrp: 315.00, agreedRate: 228.000, uom: 'PKT', altCodes: ['FG-P-F-0413'] },
  { skuErpCode: '398656', name: 'Meatigo Chicken Drumsticks 450.0g', hsnCode: '02071400', mrp: 260.00, agreedRate: 188.190, uom: 'PKT', altCodes: ['FG-M-F-0602'] },
  { skuErpCode: '414867', name: 'Chinese Veg Spring Rolls 240.0g', hsnCode: '20049000', mrp: 165.00, agreedRate: 119.429, uom: 'PKT', altCodes: ['FG-P-F-1707'] },
  { skuErpCode: '432518', name: 'Meatigo Chicken Kheema 450.0g', hsnCode: '02071400', mrp: 275.00, agreedRate: 199.048, uom: 'PKT', altCodes: ['FG-M-F-0622'] },
  { skuErpCode: '4459', name: 'Original Chicken Momos 24.0 Pieces', hsnCode: '21069099', mrp: 305.00, agreedRate: 220.762, uom: 'PKT', altCodes: ['FG-P-F-0505'] },
  { skuErpCode: '4460', name: 'Spicy Chicken Momos 24.0 Pieces', hsnCode: '21069099', mrp: 305.00, agreedRate: 220.762, uom: 'PKT', altCodes: ['FG-P-F-0512'] },
  { skuErpCode: '4461', name: 'Veg & Paneer Momos 24.0 Pieces', hsnCode: '21069099', mrp: 280.00, agreedRate: 202.667, uom: 'PKT', altCodes: ['FG-P-F-0514'] },
  { skuErpCode: '453259', name: 'Chicken Cheese & Onion Sausage 250.0g', hsnCode: '16010000', mrp: 200.00, agreedRate: 144.762, uom: 'PKT', altCodes: ['FG-P-F-0335'] },
  { skuErpCode: '4694', name: 'Original Chicken Momos 10.0 Pieces', hsnCode: '21069099', mrp: 185.00, agreedRate: 133.905, uom: 'PKT', altCodes: ['FG-P-F-0504'] },
  { skuErpCode: '4695', name: 'Spicy Chicken Momos 10.0 Pieces', hsnCode: '21069099', mrp: 185.00, agreedRate: 133.905, uom: 'PKT' },
  { skuErpCode: '4697', name: 'Veg & Paneer Momos 10.0 Pieces', hsnCode: '21069099', mrp: 155.00, agreedRate: 112.190, uom: 'PKT', altCodes: ['FG-P-F-0513'] },
  { skuErpCode: '469735', name: 'Meatigo Everyday Chicken Breast (Frozen) 150.0g', hsnCode: '16021000', mrp: 165.00, agreedRate: 119.429, uom: 'PKT', altCodes: ['FG-M-F-1728'] },
  { skuErpCode: '4698', name: 'Chicken Ham 200.0g', hsnCode: '16023200', mrp: 185.00, agreedRate: 133.905, uom: 'PKT' },
  { skuErpCode: '4699', name: 'Pork Sausage 250.0g', hsnCode: '16010000', mrp: 235.00, agreedRate: 170.095, uom: 'PKT', altCodes: ['FG-P-F-0323'] },
  { skuErpCode: '4700', name: 'Pork Ham 200.0g', hsnCode: '16024900', mrp: 245.00, agreedRate: 177.333, uom: 'PKT', altCodes: ['FG-P-F-0236'] },
  { skuErpCode: '4701', name: 'Pork Breakfast Bacon 300.0g', hsnCode: '16024900', mrp: 370.00, agreedRate: 267.810, uom: 'PKT' },
  { skuErpCode: '470663', name: 'Whole Wheat Momos - Veg & Paneer 330.0g', hsnCode: '16021000', mrp: 225.00, agreedRate: 162.857, uom: 'PKT', altCodes: ['FG-P-F-0580'] },
  { skuErpCode: '489632', name: 'Tandoori Momos - Chicken 280.0g', hsnCode: '19022010', mrp: 220.00, agreedRate: 159.238, uom: 'PKT' },
  { skuErpCode: '49168', name: 'Peri Peri Veg Momos 15.0 Pieces', hsnCode: '19022010', mrp: 245.00, agreedRate: 88.667, uom: 'PKT', altCodes: ['FG-P-F-0527'] },
  { skuErpCode: '498695', name: 'Chicken Salami 200.0g', hsnCode: '16010000', mrp: 190.00, agreedRate: 137.524, uom: 'PKT', altCodes: ['FG-P-F-0247'] },
  { skuErpCode: '526303', name: 'Chicken Pepper & Herb Sausage 250.0g', hsnCode: '16010000', mrp: 195.00, agreedRate: 141.143, uom: 'PKT' },
  { skuErpCode: '598770', name: 'Pork Breakfast Bacon 150.0g', hsnCode: '16010000', mrp: 210.00, agreedRate: 152.000, uom: 'PKT', altCodes: ['FG-P-F-0102'] },
  { skuErpCode: '6664', name: 'Chicken Sausages 250.0g', hsnCode: '16010000', mrp: 180.00, agreedRate: 130.286, uom: 'PKT', altCodes: ['FG-P-F-0321'] },
  { skuErpCode: '6665', name: 'Chicken Cheese & Chilli Sausages 250.0g', hsnCode: '16010000', mrp: 185.00, agreedRate: 133.905, uom: 'PKT' },
  { skuErpCode: '730016', name: 'Whole Wheat Chicken Momos 330.0g', hsnCode: '16021000', mrp: 235.00, agreedRate: 170.095, uom: 'PKT', altCodes: ['FG-P-F-0581'] },
  { skuErpCode: '750414', name: 'Super Saver Chicken Momo Pack (Chef Momos) 1.0kg', hsnCode: '19022010', mrp: 650.00, agreedRate: 247.619, uom: 'PKT', altCodes: ['FG-P-F-0501'] },
  { skuErpCode: '755774', name: 'Chicken & Cheese Momos 540.0g', hsnCode: '16021000', mrp: 330.00, agreedRate: 238.857, uom: 'PKT', altCodes: ['FG-P-F-0564'] },
  { skuErpCode: '790919', name: 'Meatigo Everyday Fish Fillet 200.0g', hsnCode: '16042000', mrp: 260.00, agreedRate: 188.190, uom: 'PKT', altCodes: ['FG-M-F-1729'] },
  { skuErpCode: '81521', name: 'Peri Peri Chicken Momos 250.0g', hsnCode: '19022010', mrp: 199.00, agreedRate: 72.019, uom: 'PKT', altCodes: ['FG-P-F-0542'] },
  { skuErpCode: '89201', name: 'Chicken English Breakfast Sausage 1.0kg', hsnCode: '16010000', mrp: 585.00, agreedRate: 222.857, uom: 'PKT' },
  { skuErpCode: '205950', name: 'Frozen Pork Pepperoni Salami 100.0g', hsnCode: '16010000', mrp: 185.00, agreedRate: 133.905, uom: 'PKT', altCodes: ['FG-P-F-0237'] },
  { skuErpCode: '507809', name: 'Pizza Minis - Chicken Tikka 180.0g', hsnCode: '19059090', mrp: 159.00, agreedRate: 115.086, uom: 'PKT', altCodes: ['FG-P-F-1911'] },
];

// Each scenario is a set of { skuErpCode, ...fieldOverrides } applied on top of BASELINE.
// altCodes: [] (explicit empty array) removes the invoice alias -> invoice line becomes unresolved.
const SCENARIOS = {
  clean: [],

  'price-mismatch': [
    { skuErpCode: '4459', agreedRate: 260.00 },   // invoice rate 220.76 vs agreed 260.00 -> >5% diff
    { skuErpCode: '18003', agreedRate: 180.00 },  // invoice rate 141.14 vs agreed 180.00 -> >5% diff
  ],

  'mrp-mismatch': [
    { skuErpCode: '4460', mrp: 250.00 },   // GRN/Invoice mrp 305.00 vs master 250.00 -> >1% diff
    { skuErpCode: '89201', mrp: 500.00 },  // GRN/Invoice mrp 585.00 vs master 500.00 -> >1% diff
  ],

  unmapped: [
    { skuErpCode: '750414', altCodes: [] }, // invoice code FG-P-F-0501 no longer aliased -> unmapped
    { skuErpCode: '81521', altCodes: [] },  // invoice code FG-P-F-0542 no longer aliased -> unmapped
  ],

  mixed: [
    { skuErpCode: '4459', agreedRate: 260.00 },
    { skuErpCode: '4460', mrp: 250.00 },
    { skuErpCode: '750414', altCodes: [] },
  ],
};

async function seed(scenarioName) {
  const overrides = SCENARIOS[scenarioName];
  if (!overrides) {
    console.error(`Unknown scenario "${scenarioName}". Available: ${Object.keys(SCENARIOS).join(', ')}`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/three-way-match');

  const merged = BASELINE.map(item => {
    const override = overrides.find(o => o.skuErpCode === item.skuErpCode);
    return override ? { ...item, ...override } : item;
  });

  let inserted = 0, updated = 0;
  for (const item of merged) {
    const res = await SkuMaster.findOneAndUpdate(
      { skuErpCode: item.skuErpCode },
      item,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (res.createdAt && res.updatedAt && res.createdAt.getTime() === res.updatedAt.getTime()) inserted++;
    else updated++;
  }

  console.log(`Scenario "${scenarioName}" seeded: ${inserted} inserted, ${updated} updated. Total: ${merged.length} SKUs.`);
  if (overrides.length) {
    console.log('Overrides applied:');
    overrides.forEach(o => console.log(' -', JSON.stringify(o)));
  }
  await mongoose.disconnect();
}

const scenarioName = process.argv[2] || 'clean';
seed(scenarioName).catch(err => { console.error(err); process.exit(1); });
