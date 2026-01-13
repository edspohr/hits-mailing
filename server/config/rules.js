/**
 * Reglas de asignación de tickets para Hits Corredora de Seguros.
 * Gemini clasificará el correo en una de estas categorías.
 */
module.exports = {
  // Mapeo Categoría -> Email del Responsable
  assignments: {
    "Certificados RCM / Término": "rosa.valera@hitscorredoraseguros.cl",
    "Cotizaciones Generales / No RCM":
      "eddis.rodriguez@hitscorredoraseguros.cl",
    Cobranza: "marcela.aranguiz@hitscorredoraseguros.cl",
    "RC Médica Mapfre/Aspor": "ivana.acosta@hitscorredoradeseguros.cl",
    "Grandes Clientes / Riesgos": "juan.carmona@hitscorredoradeseguros.cl",
    "Consultas Generales": "rodrigo.munoz@hitscorredoradeseguros.cl",
    Prueba: "edmundo@spohr.cl",
    Demo: "edmundo@spohr.cl",
    Otro: "rodrigo.munoz@hitscorredoradeseguros.cl", // Default fallback
  },

  // Observaciones detalladas para el prompt de IA
  rulesDetail: `
    1. "Certificados RCM / Término" -> Rosa Valera. Certificados de póliza vigente y seguros SI son RCM. También solicitudes de "Término de Servicio". Plazo 4 días.
    2. "Cotizaciones Generales / No RCM" -> Eddis Rodriguez. Cotizaciones generales y seguros que NO sean Responsabilidad Civil Médica.
    3. "Cobranza" -> Marcela Aránguiz. Inquietudes de pagos. IMPORTANTE: Si se usa el concepto "Status", se refiere a status de pago y va aquí.
    4. "RC Médica Mapfre/Aspor" -> Ivana Acosta. RC Médica específicamente asociada a Mapfre y Aspor.
    5. "Grandes Clientes / Riesgos" -> Juan Pablo Carmona. Temas comerciales potenciales clientes de gran tamaño (Ej: Incendio, Sismo, Pólizas de Garantía).
    6. "Consultas Generales" -> Rodrigo Muñoz. Consultas generales o casos no definidos que no entren en lo anterior.
    7. "Prueba" o "Demo" -> Edmundo Spohr. Correos de prueba explícitos.
  `,

  // Categorías válidas para pasarle al prompt de Gemini
  getCategories: function () {
    return Object.keys(this.assignments).join(", ");
  },
};
