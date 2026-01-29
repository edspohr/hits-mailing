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
    "RC Médica Mapfre/Aspor": "ivana.acosta@hitscorredoraseguros.cl",
    "Grandes Clientes / Riesgos": "juan.carmona@hitscorredoraseguros.cl",
    "Consultas Generales": "rodrigo.munoz@hitscorredoraseguros.cl",
    Prueba: "edmundo@spohr.cl",
    Demo: "edmundo@spohr.cl",
    Otro: "rodrigo.munoz@hitscorredoraseguros.cl", // Default fallback
  },

  // Observaciones detalladas para el prompt de IA
  rulesDetail: `
    1. "Certificados RCM / Término" -> Rosa Valera.
       - Palabras clave: "Certificado", "Vigencia", "RCM", "Responsabilidad Civil Médica", "Mala Praxis", "Término", "Anulación", "Dar de baja".
       - REGLA DE ORO: Si el correo menciona "Responsabilidad Civil Médica", "RCM", "Médico" o "Clínica" en contexto de seguro, es AQUÍ.

    2. "Cotizaciones Generales / No RCM" -> Eddis Rodriguez.
       - Palabras clave: "Cotizar", "Seguro Auto", "Seguro Hogar", "Incendio Sismo" (si es habitacional), "Vida", "Accidentes", "Viaje".
       - REGLA DE ORO: Todo lo que sea venta nueva o renovación que NO SEA de Responsabilidad Civil Médica. Si no es RCM, va aquí.

    3. "Cobranza" -> Marcela Aránguiz.
       - Palabras clave: "Pago", "Factura", "Transferencia", "Deuda", "Cuota", "Comprobante", "Cuenta Corriente", "Status de pago".
       - REGLA DE ORO: Cualquier tema relacionado con dinero, pagos pendientes o confirmación de transferencias.

    4. "RC Médica Mapfre/Aspor" -> Ivana Acosta.
       - Palabras clave: "Mapfre", "Aspor", "Falmed" CON mención de "RC Médica".
       - REGLA DE ORO: Específico para pólizas de estas compañías. Si es RCM pero no menciona compañía, prefiere a Rosa.

    5. "Grandes Clientes / Riesgos" -> Juan Pablo Carmona.
       - Palabras clave: "Póliza de Garantía", "TRC", "Todo Riesgo Construcción", "Equipo Móvil", "Flota", "Empresa", "Licuitación".
       - REGLA DE ORO: Seguros corporativos complejos o de ingeniería.

    6. "Consultas Generales" -> Rodrigo Muñoz.
       - ÚLTIMO RECURSO: Solo asignar aquí si es imposible clasificar en las anteriores (ej. un "Hola" sin más texto, spam confuso que parece real, o reclamos genéricos sin contexto). NO usar para cotizaciones ni pagos.

    7. "Prueba" o "Demo" -> Edmundo Spohr. Solo si dice explícitamente "Prueba de sistema" o "Demo".
  `,

  // Categorías válidas para pasarle al prompt de Gemini
  getCategories: function () {
    return Object.keys(this.assignments).join(", ");
  },
};
