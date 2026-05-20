require('dotenv').config();
const { extraerSpecs } = require('./src/servicios/servicioImportacion');

const casos = [
  { cat: 'procesador', nombre: 'procesador amd ryzen 5 5600gt, 3.60 / 4.60 ghz, 16mb l3, 6 core, am4, 7nm, 65w', catProv: 'cpu amd ryzen 5 sam4 5xxx' },
  { cat: 'procesador', nombre: 'procesador intel core i5-12400f, 2.50/4.40ghz, 18mb cache l3, lga1700, 117w', catProv: 'cpu ci5 12xxx s1700' },
  { cat: 'procesador', nombre: 'procesador amd ryzen 9 9950x 4.30 / 5.70 ghz, 64mb l3 cache, 16-cores, 4nm, tdp: 170w', catProv: 'cpu amd ryzen 9 sam5 9xxx' },
  { cat: 'fuente', nombre: 'fuente de alimentacion asrock sl-1200gw, 1200w, atx, 80 plus gold', catProv: 'cases, fuente para gaming' },
];

for (const c of casos) {
  const specs = extraerSpecs(c.cat, c.nombre, c.catProv);
  console.log(`\n[${c.cat}] ${c.nombre.slice(0, 60)}`);
  console.log(JSON.stringify(specs, null, 2));
}
