/**
 * Reglas de asignación de tickets para Hits Corredora de Seguros.
 * Gemini clasificará el correo en una de estas categorías.
 */
module.exports = {
  // Mapeo Categoría -> Email del Responsable
  assignments: {
    "Certificados RCM": "rosa.valera@hitscorredoraseguros.cl",
    "Certificados No RCM": "eddis.rodriguez@hitscorredoraseguros.cl",
    Cobranza: "marcela.aranguiz@hitscorredoraseguros.cl",
    Cotizaciones: "eddis.rodriguez@hitscorredoraseguros.cl",
    "RC Médica Mapfre/Aspor": "ivana.acosta@hitscorredoradeseguros.cl",
    "Consultas generales (Rodrigo)": "rodrigo.munoz@hitscorredoradeseguros.cl",
    "Consultas generales (Juan Pablo)":
      "juan.carmona@hitscorredoradeseguros.cl",
    Prueba: "edmundo@spohr.cl",
    Demo: "edmundo@spohr.cl",
    Otro: "rodrigo.munoz@hitscorredoradeseguros.cl", // Default fallback
  },

  // Observaciones detalladas para el prompt de IA
  rulesDetail: `
    1. "Certificados RCM" -> Rosa Valera. Pólizas vigentes de Responsabilidad Civil Médica.
    2. "Certificados No RCM" -> Eddis Rodriguez. Pólizas de OTROS seguros (Auto, Hogar, etc) que NO sean RCM.
    3. "Cobranza" -> Marcela Aránguiz. Pagos, facturación, deudas.
    4. "Cotizaciones" -> Eddis Rodriguez. Solicitudes de nuevos seguros o asesoría.
    5. "RC Médica Mapfre/Aspor" -> Ivana Acosta. Específicamente temas comerciales de Mapfre o Aspor en RC Médica.
    6. "Consultas generales (Juan Pablo)" -> Temas comerciales de potenciales clientes de gran tamaño.
    7. "Consultas generales (Rodrigo)" -> Consultas generales, operativas o casos no definidos.
    8. "Prueba" o "Demo" -> Edmundo Spohr. Si dice explícitamente "prueba" o "demo".
  `,

  // Categorías válidas para pasarle al prompt de Gemini
  getCategories: function () {
    return Object.keys(this.assignments).join(", ");
  },
};
