const rules = require("../server/config/rules");

console.log("--- Verifying Routing Rules ---");

const expectedAssignments = {
  "Certificados de póliza vigente": "rosa.valera@hitscorredoraseguros.cl",
  Cobranza: "marcela.aranguiz@hitscorredoraseguros.cl",
  Cotizaciones: "eddis.rodriguez@hitscorredoraseguros.cl",
  "Responsabilidad Civil Médica": "eddis.rodriguez@hitscorredoraseguros.cl",
  "Consultas generales (Rodrigo)": "rodrigo.munoz@hitscorredoradeseguros.cl",
  "Consultas generales (Juan Pablo)": "juan.carmona@hitscorredoradeseguros.cl",
  Prueba: "edmundo@spohr.cl",
  Demo: "demo@hitscorredoraseguros.cl",
};

let allPassed = true;

for (const [category, email] of Object.entries(expectedAssignments)) {
  const configuredEmail = rules.assignments[category];
  if (configuredEmail === email) {
    console.log(`[PASS] ${category} -> ${email}`);
  } else {
    console.log(
      `[FAIL] ${category}. Expected: ${email}, Got: ${configuredEmail}`
    );
    allPassed = false;
  }
}

if (allPassed) {
  console.log("\nAll routing rules verified successfully.");
} else {
  console.log("\nSome routing rules failed verification.");
  process.exit(1);
}
