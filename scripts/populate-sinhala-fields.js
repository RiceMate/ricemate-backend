const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categoryTranslations = {
  'Cost': { nameSi: 'පිරිවැය', descriptionSi: 'ව්‍යාපාරික පිරිවැය' },
  'Food Need Coverage': { nameSi: 'ආහාර අවශ්‍යතා ආවරණය', descriptionSi: 'ආවරණ අයිතම' },
  'Ingredients': { nameSi: 'අමුද්‍රව්‍ය', descriptionSi: 'අමුද්‍රව්‍ය පිරිවැය' },
  'Resources': { nameSi: 'සම්පත්', descriptionSi: 'විදුලිය, ගෑස් ආදී සම්පත්' },
  'Transport': { nameSi: 'ප්‍රවාහනය', descriptionSi: 'ගමන් බිමන් සහ ප්‍රවාහන වියදම්' },
  'Rice': { nameSi: 'සහල්', descriptionSi: 'සහල් තොග' },
  'Coconut': { nameSi: 'පොල්', descriptionSi: 'පොල් මිලදී ගැනීම්' },
  'Dhull': { nameSi: 'පරිප්පු', descriptionSi: 'පරිප්පු තොග' },
  'Electricity': { nameSi: 'විදුලිය', descriptionSi: 'විදුලි බිල්පත්' },
  'Gas': { nameSi: 'ගෑස්', descriptionSi: 'ගෑස් සිලින්ඩර්' },
  'Daily Coverage': { nameSi: 'දෛනික ආවරණය', descriptionSi: 'දෛනික අවශ්‍යතා' },
  'Extra Items': { nameSi: 'අමතර අයිතම', descriptionSi: 'විවිධ අමතර වියදම්' },
};

const sourceTranslations = {
  'Homagama Junction Eatery': { nameSi: 'හෝමාගම හන්දිය ආපනශාලාව', descriptionSi: 'පළමු වෙළඳසැල' },
  'Homagama Bus stand Eatery': { nameSi: 'හෝමාගම බස් නැවතුම්පොළ ආපනශාලාව', descriptionSi: 'දෙවන වෙළඳසැල' },
};

async function main() {
  console.log('Populating Sinhala names & descriptions...');

  // Update categories
  const categories = await prisma.expense.findMany();
  for (const cat of categories) {
    const tr = categoryTranslations[cat.name];
    if (tr) {
      await prisma.expense.update({
        where: { id: cat.id },
        data: {
          nameSi: tr.nameSi,
          descriptionSi: tr.descriptionSi,
        },
      });
      console.log(`Updated Expense Category: ${cat.name} -> ${tr.nameSi}`);
    }
  }

  // Update income sources
  const sources = await prisma.incomeSource.findMany();
  for (const src of sources) {
    const tr = sourceTranslations[src.name];
    if (tr) {
      await prisma.incomeSource.update({
        where: { id: src.id },
        data: {
          nameSi: tr.nameSi,
          descriptionSi: tr.descriptionSi,
        },
      });
      console.log(`Updated Income Source: ${src.name} -> ${tr.nameSi}`);
    }
  }

  console.log('Finished populating Sinhala fields.');
  await prisma.$disconnect();
}

main().catch(console.error);
