/**
 * Reglas de asignación de tickets para Hits Corredora de Seguros.
 * Gemini clasificará el correo en una de estas categorías.
 */
module.exports = {
  // Mapeo Categoría -> Email del Responsable
  assignments: {
    "Responsabilidad Civil Médica": "rodrigo.munoz@hitscorredoraseguros.cl",
    "Otros Seguros": "juan.carmona@hitscorredoraseguros.cl",
    Prueba: "edmundo@spohr.cl",
    Demo: "demo@hitscorredoraseguros.cl",
    Otro: "juan.carmona@hitscorredoraseguros.cl", // Default fallback
  },

  // Categorías válidas para pasarle al prompt de Gemini
  getCategories: function () {
    return Object.keys(this.assignments).join(", ");
  },
};
