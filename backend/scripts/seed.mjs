import mongoose from 'mongoose';
import connectDB from '../lib/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import MenuItem from '../models/MenuItem.js';
import SiteSetting from '../models/SiteSetting.js';
import Inquiry from '../models/Inquiry.js';

export async function runSeed() {
  console.log('[Seed] Connecting to MongoDB...');
  await connectDB();

  // 1. Seed Admin User
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@avxbs.com';
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    console.log('[Seed] Creating default Admin user...');
    await User.create({
      name: 'AVXBS Administrator',
      email: adminEmail,
      password: process.env.ADMIN_DEFAULT_PASSWORD || 'admin123',
      role: 'superadmin',
      isActive: true,
    });
    console.log('[Seed] Admin user created with email:', adminEmail);
  } else {
    console.log('[Seed] Admin user already exists.');
  }

  // 2. Seed Default Products
  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    console.log('[Seed] Seeding initial water treatment products...');
    const defaultProducts = [
      {
        slug: 'water-softener',
        name: 'Water Softener',
        titleWater: 'WATER ',
        titleSoftner: 'SOFTNER',
        category: 'Residential',
        description: 'Automated ion-exchange unit with metered regeneration and smart scale reduction.',
        badge: 'Most Popular',
        showInSlider: true,
        sortOrder: 1,
      },
      {
        slug: 'whole-house-filter',
        name: 'Whole-House Filter',
        titleWater: 'WATER ',
        titleSoftner: 'FILTER',
        category: 'Residential',
        description: 'Multi-media sediment, turbidity, and chlorine reduction for entire residence.',
        badge: 'Whole Home',
        showInSlider: true,
        sortOrder: 2,
      },
      {
        slug: 'ro-purification',
        name: 'RO & UV Purifier',
        titleWater: 'RO & UV ',
        titleSoftner: 'PURIFIER',
        category: 'Residential',
        description: 'High-recovery reverse osmosis with germicidal UV sterilizer.',
        badge: 'Purity Standard',
        showInSlider: true,
        sortOrder: 3,
      },
      {
        slug: 'commercial-duplex-plant',
        name: 'Commercial Duplex Softening Plant',
        titleWater: 'DUPLEX ',
        titleSoftner: 'PLANT',
        category: 'Commercial',
        description: '24/7 continuous uninterrupted softened water supply for hospitality & manufacturing.',
        badge: 'Heavy Duty',
        showInSlider: false,
        sortOrder: 4,
      },
    ];

    await Product.insertMany(defaultProducts);
    console.log('[Seed] Products seeded successfully.');
  }

  // 3. Seed Mega Menu Items
  const menuCount = await MenuItem.countDocuments();
  if (menuCount === 0) {
    console.log('[Seed] Seeding navigation mega menu items...');
    const defaultMenuItems = [
      // Residential - Softening
      {
        scope: 'Residential',
        columnId: 'softening',
        columnTitle: 'Water Softening',
        name: 'Water Softener (System 06)',
        description: 'Automated ion-exchange unit with metered regeneration',
        productName: 'Water Softener',
        badge: 'Most Popular',
        sortOrder: 1,
      },
      {
        scope: 'Residential',
        columnId: 'softening',
        columnTitle: 'Water Softening',
        name: 'Whole-House Softener',
        description: 'High-capacity dual-tank continuous soft water system',
        productName: 'Whole-House Softener',
        sortOrder: 2,
      },
      {
        scope: 'Residential',
        columnId: 'softening',
        columnTitle: 'Water Softening',
        name: 'Compact Cabinet Softener',
        description: 'Space-saving integrated brine cabinet for modern homes',
        productName: 'Compact Cabinet Softener',
        sortOrder: 3,
      },
      {
        scope: 'Residential',
        columnId: 'softening',
        columnTitle: 'Water Softening',
        name: 'Bathroom Hard Water Softener',
        description: 'Point-of-entry protection for geysers, showers & fixtures',
        productName: 'Bathroom Softener',
        sortOrder: 4,
      },
      // Residential - Filtration
      {
        scope: 'Residential',
        columnId: 'filtration',
        columnTitle: 'Filtration & Purity',
        name: 'Whole-House Water Filter',
        description: 'Multi-media sediment, turbidity, and chlorine reduction',
        productName: 'Whole-House Filter',
        sortOrder: 1,
      },
      {
        scope: 'Residential',
        columnId: 'filtration',
        columnTitle: 'Filtration & Purity',
        name: 'Iron & Rust Removal Column',
        description: 'Catalytic media extraction for borewell & groundwater',
        productName: 'Iron Removal Filter',
        sortOrder: 2,
      },
      {
        scope: 'Residential',
        columnId: 'filtration',
        columnTitle: 'Filtration & Purity',
        name: 'Activated Carbon Filter',
        description: 'Removes volatile organics, foul odor, and unpleasant taste',
        productName: 'Activated Carbon Filter',
        sortOrder: 3,
      },
      {
        scope: 'Residential',
        columnId: 'filtration',
        columnTitle: 'Filtration & Purity',
        name: 'Sediment Pre-Filter Cartridge',
        description: 'High-flow sediment trapping for incoming municipal supply',
        productName: 'Sediment Pre-Filter',
        sortOrder: 4,
      },
      // Residential - Purification
      {
        scope: 'Residential',
        columnId: 'purification',
        columnTitle: 'Drinking Water & RO',
        name: 'RO & UV Purifier Station',
        description: 'High-recovery reverse osmosis with germicidal UV sterilizer',
        productName: 'RO & UV Purifier',
        sortOrder: 1,
      },
      {
        scope: 'Residential',
        columnId: 'purification',
        columnTitle: 'Drinking Water & RO',
        name: 'Multi-Stage Alkaline Purifier',
        description: 'Mineral-balanced pure drinking water for healthy families',
        productName: 'Alkaline RO Purifier',
        sortOrder: 2,
      },
      {
        scope: 'Residential',
        columnId: 'purification',
        columnTitle: 'Drinking Water & RO',
        name: 'Under-Sink Drinking System',
        description: 'Dedicated high-purity kitchen tap water unit',
        productName: 'Under-Sink RO System',
        sortOrder: 3,
      },
      {
        scope: 'Residential',
        columnId: 'purification',
        columnTitle: 'Drinking Water & RO',
        name: 'Free Home Hardness Test',
        description: 'Book our certified water test kit and analysis',
        productName: 'Free Water Hardness Test',
        badge: 'Complimentary',
        sortOrder: 4,
      },
      // Commercial - Softening
      {
        scope: 'Commercial',
        columnId: 'comm-softening',
        columnTitle: 'Commercial Softening',
        name: 'Commercial Duplex Softening Plant',
        description: '24/7 non-stop uninterrupted softened water supply',
        productName: 'Commercial Softening Plant',
        badge: 'Heavy Duty',
        sortOrder: 1,
      },
      {
        scope: 'Commercial',
        columnId: 'comm-softening',
        columnTitle: 'Commercial Softening',
        name: 'Triplex Industrial Softening Unit',
        description: 'High-throughput manifold for multi-facility operations',
        productName: 'Triplex Softening Unit',
        sortOrder: 2,
      },
      {
        scope: 'Commercial',
        columnId: 'comm-softening',
        columnTitle: 'Commercial Softening',
        name: 'Boiler Feed Water Softener',
        description: 'Zero-hardness feed protection for HVAC boilers & cooling towers',
        productName: 'Boiler Feed Softener',
        sortOrder: 3,
      },
      {
        scope: 'Commercial',
        columnId: 'comm-softening',
        columnTitle: 'Commercial Softening',
        name: 'Hospitality & Hotel Softener',
        description: 'Engineered scale prevention for laundry, kitchen & guest rooms',
        productName: 'Hotel Water Softener',
        sortOrder: 4,
      },
      // Commercial - Filtration
      {
        scope: 'Commercial',
        columnId: 'comm-filtration',
        columnTitle: 'Commercial Filtration',
        name: 'Multi-Media Pressure Sand Filter',
        description: 'Graded silica bed for high-volume suspended solids removal',
        productName: 'Pressure Sand Filter',
        sortOrder: 1,
      },
      {
        scope: 'Commercial',
        columnId: 'comm-filtration',
        columnTitle: 'Commercial Filtration',
        name: 'Commercial Carbon Adsorption',
        description: 'Large-scale dechlorination and organic contaminant removal',
        productName: 'Commercial Carbon Filter',
        sortOrder: 2,
      },
      {
        scope: 'Commercial',
        columnId: 'comm-filtration',
        columnTitle: 'Commercial Filtration',
        name: 'Industrial Catalytic Iron Unit',
        description: 'Heavy borewell iron and manganese precipitation system',
        productName: 'Industrial Iron Filter',
        sortOrder: 3,
      },
      {
        scope: 'Commercial',
        columnId: 'comm-filtration',
        columnTitle: 'Commercial Filtration',
        name: 'Automatic Backwash Pre-Filter',
        description: 'Automated differential pressure flushing for main inlets',
        productName: 'Auto Backwash Filter',
        sortOrder: 4,
      },
      // Commercial - RO
      {
        scope: 'Commercial',
        columnId: 'comm-ro',
        columnTitle: 'Commercial RO & DM',
        name: 'Commercial RO Plant (500-50,000 LPH)',
        description: 'High-recovery semi-permeable spiral wound membrane system',
        productName: 'Commercial RO Plant',
        sortOrder: 1,
      },
      {
        scope: 'Commercial',
        columnId: 'comm-ro',
        columnTitle: 'Commercial RO & DM',
        name: 'Industrial Demineralizer (DM)',
        description: 'Two-bed & mixed-bed ion exchange for ultra-low conductivity',
        productName: 'DM Plant',
        sortOrder: 2,
      },
      {
        scope: 'Commercial',
        columnId: 'comm-ro',
        columnTitle: 'Commercial RO & DM',
        name: 'Ultrafiltration & UV Skids',
        description: 'Physical barrier filtration with 0.02-micron hollow fiber membranes',
        productName: 'UF & UV Skid',
        sortOrder: 3,
      },
      {
        scope: 'Commercial',
        columnId: 'comm-ro',
        columnTitle: 'Commercial RO & DM',
        name: 'Site Hardness & Flow Audit',
        description: 'Schedule certified on-site commercial engineering survey',
        productName: 'Commercial Site Hardness Audit',
        badge: 'On-Site',
        sortOrder: 4,
      },
    ];

    await MenuItem.insertMany(defaultMenuItems);
    console.log('[Seed] Menu items seeded successfully.');
  }

  // 4. Seed Site Settings
  const settingsCount = await SiteSetting.countDocuments();
  if (settingsCount === 0) {
    console.log('[Seed] Seeding site content settings...');
    const defaultSettings = [
      {
        key: 'headline_title',
        value: 'Now Just Put Your Inquiry And Get the Solution. At Door step',
        group: 'hero',
        description: 'Animated 4-line headline text',
      },
      {
        key: 'contact_address',
        value: 'AVXBS Regional Tech Park, Industrial Sector, Gurugram, HR, India',
        group: 'contact',
        description: 'Corporate headquarters address',
      },
      {
        key: 'contact_phone',
        value: '+91 1800 200 4882',
        group: 'contact',
        description: 'Toll-free helpline direct line',
      },
      {
        key: 'contact_email',
        value: 'support@avxbs.com',
        group: 'contact',
        description: 'Official technical support email',
      },
      {
        key: 'operating_hours',
        value: 'Monday – Saturday: 9:00 AM – 6:00 PM IST',
        group: 'contact',
        description: 'Operating business hours',
      },
      {
        key: 'footer_company_desc',
        value: 'AVXBS is an advanced water treatment and softening solutions engineering platform, delivering state-of-the-art ion-exchange softeners, filtration, and water purification systems for residential and commercial infrastructures.',
        group: 'footer',
        description: 'Footer company summary',
      },
    ];

    await SiteSetting.insertMany(defaultSettings);
    console.log('[Seed] Site settings seeded.');
  }

  // 5. Seed Initial Inquiry if none exists
  const inquiryCount = await Inquiry.countDocuments();
  if (inquiryCount === 0) {
    console.log('[Seed] Seeding sample initial inquiry to start counter...');
    await Inquiry.create({
      type: 'Residential',
      product: 'Water Softener',
      name: 'Aditya Sharma',
      mobile: '9876543210',
      email: 'aditya.sharma@example.com',
      remarks: 'Interested in Whole-House Water Softening System 06 for independent villa.',
      status: 'New',
      source: 'Direct',
    });
    console.log('[Seed] Sample inquiry created.');
  }

  console.log('[Seed] Finished running seed script.');
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seed.mjs') || process.argv[1]?.endsWith('seed.js')) {
  runSeed().then(() => process.exit(0)).catch((err) => {
    console.error('[Seed Error]:', err);
    process.exit(1);
  });
}

