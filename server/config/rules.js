/**
 * Reglas de asignación de tickets.
 * Gemini clasificará el correo en una de estas categorías.
 */
module.exports = {
  // Mapeo Categoría -> Email del Responsable
  assignments: {
    "Soporte Técnico": "soporte@tuempresa.com",
    Facturación: "finanzas@tuempresa.com",
    Ventas: "ventas@tuempresa.com",
    "Recursos Humanos": "rrhh@tuempresa.com",
    Otro: "general@tuempresa.com", // Default
  },

  // Categorías válidas para pasarle al prompt de Gemini
  getCategories: function () {
    return Object.keys(this.assignments).join(", ");
  },
};
