const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultPresets = [
  // kg (Unit id: 1)
  { unitSymbol: 'kg', value: 0.25, label: '250 g', labelSi: 'ග්‍රෑ. 250', sortOrder: 1 },
  { unitSymbol: 'kg', value: 0.5, label: '500 g (1/2 kg)', labelSi: 'කි.ග්‍රෑ. 1/2', sortOrder: 2 },
  { unitSymbol: 'kg', value: 1.0, label: '1 kg', labelSi: 'කි.ග්‍රෑ. 1', sortOrder: 3 },
  { unitSymbol: 'kg', value: 2.0, label: '2 kg', labelSi: 'කි.ග්‍රෑ. 2', sortOrder: 4 },
  { unitSymbol: 'kg', value: 5.0, label: '5 kg', labelSi: 'කි.ග්‍රෑ. 5', sortOrder: 5 },
  { unitSymbol: 'kg', value: 10.0, label: '10 kg', labelSi: 'කි.ග්‍රෑ. 10', sortOrder: 6 },
  { unitSymbol: 'kg', value: 25.0, label: '25 kg', labelSi: 'කි.ග්‍රෑ. 25', sortOrder: 7 },

  // g (Unit id: 2)
  { unitSymbol: 'g', value: 50.0, label: '50 g', labelSi: 'ග්‍රෑ. 50', sortOrder: 1 },
  { unitSymbol: 'g', value: 100.0, label: '100 g', labelSi: 'ග්‍රෑ. 100', sortOrder: 2 },
  { unitSymbol: 'g', value: 250.0, label: '250 g', labelSi: 'ග්‍රෑ. 250', sortOrder: 3 },
  { unitSymbol: 'g', value: 500.0, label: '500 g', labelSi: 'ග්‍රෑ. 500', sortOrder: 4 },

  // L (Unit id: 3)
  { unitSymbol: 'l', value: 0.5, label: '500 ml (1/2 L)', labelSi: 'ලී. 1/2', sortOrder: 1 },
  { unitSymbol: 'l', value: 1.0, label: '1 L', labelSi: 'ලී. 1', sortOrder: 2 },
  { unitSymbol: 'l', value: 2.0, label: '2 L', labelSi: 'ලී. 2', sortOrder: 3 },
  { unitSymbol: 'l', value: 5.0, label: '5 L', labelSi: 'ලී. 5', sortOrder: 4 },

  // ml (Unit id: 4)
  { unitSymbol: 'ml', value: 100.0, label: '100 ml', labelSi: 'මි.ලී. 100', sortOrder: 1 },
  { unitSymbol: 'ml', value: 250.0, label: '250 ml', labelSi: 'මි.ලී. 250', sortOrder: 2 },
  { unitSymbol: 'ml', value: 500.0, label: '500 ml', labelSi: 'මි.ලී. 500', sortOrder: 3 },

  // parcel (Unit id: 5)
  { unitSymbol: 'parcel', value: 1.0, label: '1 parcel', labelSi: 'පාර්සල් 1', sortOrder: 1 },
  { unitSymbol: 'parcel', value: 5.0, label: '5 parcels', labelSi: 'පාර්සල් 5', sortOrder: 2 },
  { unitSymbol: 'parcel', value: 10.0, label: '10 parcels', labelSi: 'පාර්සල් 10', sortOrder: 3 },
  { unitSymbol: 'parcel', value: 25.0, label: '25 parcels', labelSi: 'පාර්සල් 25', sortOrder: 4 },
  { unitSymbol: 'parcel', value: 50.0, label: '50 parcels', labelSi: 'පාර්සල් 50', sortOrder: 5 },
  { unitSymbol: 'parcel', value: 100.0, label: '100 parcels', labelSi: 'පාර්සල් 100', sortOrder: 6 },

  // piece (Unit id: 6)
  { unitSymbol: 'piece', value: 1.0, label: '1 piece', labelSi: 'කෑලි 1', sortOrder: 1 },
  { unitSymbol: 'piece', value: 5.0, label: '5 pieces', labelSi: 'කෑලි 5', sortOrder: 2 },
  { unitSymbol: 'piece', value: 10.0, label: '10 pieces', labelSi: 'කෑලි 10', sortOrder: 3 },
  { unitSymbol: 'piece', value: 20.0, label: '20 pieces', labelSi: 'කෑලි 20', sortOrder: 4 },
  { unitSymbol: 'piece', value: 50.0, label: '50 pieces', labelSi: 'කෑලි 50', sortOrder: 5 },
];

async function seed() {
  console.log('Seeding unit quantity presets...');
  const units = await prisma.unit.findMany();

  for (const preset of defaultPresets) {
    const matchedUnit = units.find(
      (u) => u.symbol.toLowerCase() === preset.unitSymbol.toLowerCase()
    );
    if (!matchedUnit) continue;

    const existing = await prisma.unitQuantityPreset.findFirst({
      where: {
        unitId: matchedUnit.id,
        value: preset.value,
      },
    });

    if (!existing) {
      await prisma.unitQuantityPreset.create({
        data: {
          unitId: matchedUnit.id,
          value: preset.value,
          label: preset.label,
          labelSi: preset.labelSi,
          sortOrder: preset.sortOrder,
          isActive: true,
        },
      });
      console.log(`Created preset: ${preset.label} (${preset.value}) for ${matchedUnit.name}`);
    }
  }

  const allPresets = await prisma.unitQuantityPreset.findMany({
    include: { unit: true },
  });
  console.log(`\nTotal Presets in DB: ${allPresets.length}`);
  await prisma.$disconnect();
}

seed().catch(console.error);
