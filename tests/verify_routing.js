const rules = require("../server/config/rules");
const assert = require("assert");

console.log("--- Verifying Email Routing Rules ---");

const expectedMappings = [
  {
    category: "Certificados RCM / Término",
    email: "rosa.valera@hitscorredoraseguros.cl",
  },
  {
    category: "Cotizaciones Generales / No RCM",
    email: "eddis.rodriguez@hitscorredoraseguros.cl",
  },
  { category: "Cobranza", email: "marcela.aranguiz@hitscorredoraseguros.cl" },
  {
    category: "RC Médica Mapfre/Aspor",
    email: "ivana.acosta@hitscorredoradeseguros.cl",
  },
  {
    category: "Grandes Clientes / Riesgos",
    email: "juan.carmona@hitscorredoradeseguros.cl",
  },
  {
    category: "Consultas Generales",
    email: "rodrigo.munoz@hitscorredoradeseguros.cl",
  },
  { category: "Prueba", email: "edmundo@spohr.cl" },
  { category: "Demo", email: "edmundo@spohr.cl" },
  { category: "Otro", email: "rodrigo.munoz@hitscorredoradeseguros.cl" },
];

let errors = 0;

expectedMappings.forEach((item) => {
  const actualEmail = rules.assignments[item.category];
  if (actualEmail === item.email) {
    console.log(`[PASS] Category '${item.category}' -> ${item.email}`);
  } else {
    console.error(
      `[FAIL] Category '${item.category}' expected ${item.email}, got ${actualEmail}`
    );
    errors++;
  }
});

console.log("\n--- Checking Categories List ---");
const categories = rules.getCategories();
console.log("Categories string:", categories);

if (errors === 0) {
  console.log("\n✅ All static routing rules verified successfully.");
} else {
  console.error(`\n❌ Found ${errors} errors in routing rules.`);
  process.exit(1);
}
