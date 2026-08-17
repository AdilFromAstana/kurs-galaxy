const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const MODELS = require('./models');
const OUT_DIR = path.join(__dirname, '..', '..', 'mocks');

async function main() {
  const prisma = new PrismaClient();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const model of MODELS) {
    const rows = await prisma[model].findMany();
    const file = path.join(OUT_DIR, `${model}.json`);
    fs.writeFileSync(file, JSON.stringify(rows, null, 2) + '\n');
    console.log(`  ${model}: ${rows.length}`);
  }

  await prisma.$disconnect();
  console.log(`\n==> Фикстуры записаны в mocks/`);
}

main().catch((e) => {
  console.error('export error:', e.message);
  process.exit(1);
});
