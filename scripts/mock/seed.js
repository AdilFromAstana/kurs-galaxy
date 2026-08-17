const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const MODELS = require('./models');
const DIR = path.join(__dirname, '..', '..', 'mocks');

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function revive(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = typeof value === 'string' && ISO.test(value) ? new Date(value) : value;
  }
  return out;
}

async function main() {
  const prisma = new PrismaClient();

  for (const model of [...MODELS].reverse()) {
    await prisma[model].deleteMany();
  }

  for (const model of MODELS) {
    const file = path.join(DIR, `${model}.json`);
    if (!fs.existsSync(file)) {
      console.log(`  ${model}: нет ${path.relative(process.cwd(), file)}, пропускаю`);
      continue;
    }

    const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const row of rows) {
      await prisma[model].create({ data: revive(row) });
    }
    console.log(`  ${model}: ${rows.length}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('mock seed error:', e.message);
  process.exit(1);
});
