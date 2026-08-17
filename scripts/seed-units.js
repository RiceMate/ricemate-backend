const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const unitData = [
  {
    name: 'Weight',
    nameSi: 'බර',
    description: 'Weight measurement units',
    descriptionSi: 'බර මනින ඒකක',
    units: [
      { name: 'Kilogram', nameSi: 'කිලෝග්‍රෑම්', symbol: 'kg', symbolSi: 'කි.ග්‍රෑ.' },
      { name: 'Gram', nameSi: 'ග්‍රෑම්', symbol: 'g', symbolSi: 'ග්‍රෑ.' },
    ],
  },
  {
    name: 'Volume',
    nameSi: 'පරිමාව',
    description: 'Liquid and volume measurement units',
    descriptionSi: 'දියර සහ පරිමාව මනින ඒකක',
    units: [
      { name: 'Liter', nameSi: 'ලීටර්', symbol: 'L', symbolSi: 'ලී.' },
      { name: 'Milliliter', nameSi: 'මිලිලීටර්', symbol: 'mL', symbolSi: 'මි.ලී.' },
    ],
  },
  {
    name: 'Count',
    nameSi: 'ගණනය',
    description: 'Discrete quantity and item counts',
    descriptionSi: 'වෙනම ගණනය කරන ඒකක',
    units: [
      { name: 'Parcel', nameSi: 'පාර්සල්', symbol: 'parcel', symbolSi: 'පාර්සල්' },
      { name: 'Piece', nameSi: 'කෑලි', symbol: 'piece', symbolSi: 'කෑලි' },
    ],
  },
];

async function seedUnits() {
  console.log('Seeding Unit Categories and Units...');

  for (const cat of unitData) {
    let category = await prisma.unitCategory.findFirst({
      where: { name: cat.name },
    });

    if (!category) {
      category = await prisma.unitCategory.create({
        data: {
          name: cat.name,
          nameSi: cat.nameSi,
          description: cat.description,
          descriptionSi: cat.descriptionSi,
          isActive: true,
        },
      });
      console.log(`Created Unit Category: ${cat.name} (${cat.nameSi})`);
    } else {
      category = await prisma.unitCategory.update({
        where: { id: category.id },
        data: {
          nameSi: cat.nameSi,
          description: cat.description,
          descriptionSi: cat.descriptionSi,
        },
      });
      console.log(`Updated Unit Category: ${cat.name} (${cat.nameSi})`);
    }

    for (const u of cat.units) {
      let unit = await prisma.unit.findFirst({
        where: { unitCategoryId: category.id, symbol: u.symbol },
      });

      if (!unit) {
        unit = await prisma.unit.create({
          data: {
            unitCategoryId: category.id,
            name: u.name,
            nameSi: u.nameSi,
            symbol: u.symbol,
            symbolSi: u.symbolSi,
            isActive: true,
          },
        });
        console.log(`  + Created Unit: ${u.symbol} - ${u.name} (${u.symbolSi})`);
      } else {
        unit = await prisma.unit.update({
          where: { id: unit.id },
          data: {
            name: u.name,
            nameSi: u.nameSi,
            symbol: u.symbol,
            symbolSi: u.symbolSi,
            isActive: true,
          },
        });
        console.log(`  * Updated Unit: ${u.symbol} - ${u.name} (${u.symbolSi})`);
      }
    }
  }

  console.log('Unit Categories and Units seeded successfully!');
  await prisma.$disconnect();
}

seedUnits().catch((e) => {
  console.error(e);
  process.exit(1);
});
