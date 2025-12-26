/**
 * Reglas de asignación de tickets para Hits Corredora de Seguros.
 * Gemini clasificará el correo en una de estas categorías.
 */
module.exports = {
  // Mapeo Categoría -> Email del Responsable
  assignments: {
    "Certificados de póliza vigente": "rosa.valera@hitscorredoraseguros.cl",
    Cobranza: "marcela.aranguiz@hitscorredoraseguros.cl",
    Cotizaciones: "eddis.rodriguez@hitscorredoraseguros.cl", // Default quote handler
    "Responsabilidad Civil Médica": "eddis.rodriguez@hitscorredoraseguros.cl", // Specific Quote type
    "Consultas generales (Rodrigo)": "rodrigo.munoz@hitscorredoradeseguros.cl",
    "Consultas generales (Juan Pablo)":
      "juan.carmona@hitscorredoradeseguros.cl",
    Prueba: "edmundo@spohr.cl",
    Demo: "edmundo@spohr.cl",
    Otro: "rodrigo.munoz@hitscorredoradeseguros.cl", // Default fallback
  },

  // Observaciones detalladas para el prompt de IA
  rulesDetail: `
    - "Certificados de póliza vigente" y seguros NO RCM -> Rosa Valera. Plazo 4 días hábiles.
    - "Cobranza" -> Marcela Aránguiz. Pagos de médicos.
    - "Cotizaciones" (RCM o Venta) -> Eddis Rodriguez.
    - "Consultas generales" o casos no definidos -> Rodrigo Muñoz (Default operational) o Juan Pablo Carmona (Comercial / Grandes Clientes).
    - "Prueba" -> Correos de prueba (edmundo@spohr.cl).
    - "Demo" -> Correos de demostración (edmundo@spohr.cl).
  `,

  // Categorías válidas para pasarle al prompt de Gemini
  getCategories: function () {
    return Object.keys(this.assignments).join(", ");
  },
};
