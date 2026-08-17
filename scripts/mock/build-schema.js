const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'prisma', 'schema.prisma');
const OUT = path.join(ROOT, 'prisma', 'schema.mock.prisma');

const source = fs.readFileSync(SRC, 'utf8');

const enums = {};
const enumBlock = /enum\s+(\w+)\s*\{([^}]*)\}/g;
let match;
while ((match = enumBlock.exec(source)) !== null) {
  enums[match[1]] = match[2]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//'));
}

let out = source.replace(enumBlock, '');

out = out.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
out = out.replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url      = "file:./mock.db"');
out = out.replace(/^\s*binaryTargets.*\n/m, '');

out = out
  .split('\n')
  .map((line) => {
    for (const [name, values] of Object.entries(enums)) {
      const typePos = new RegExp(`(\\s)${name}(\\?)?(\\s|$)`);
      if (!typePos.test(line)) continue;

      line = line.replace(typePos, (_, before, optional, after) =>
        `${before}String${optional || ''}${after}`
      );

      line = line.replace(/@default\(([A-Z_]+)\)/, (whole, value) =>
        values.includes(value) ? `@default("${value}")` : whole
      );
    }
    return line;
  })
  .join('\n');

out =
  '// СГЕНЕРИРОВАНО scripts/mock/build-schema.js — правь prisma/schema.prisma\n' +
  out.replace(/\n{3,}/g, '\n\n');

fs.writeFileSync(OUT, out);
console.log(`==> prisma/schema.mock.prisma собрана (enum → String: ${Object.keys(enums).join(', ')})`);
