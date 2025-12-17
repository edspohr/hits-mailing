import React, { useState, useEffect, useCallback } from 'react';

// User database with passwords
const USERS = [
  { name: 'Edmundo Spohr', email: 'edmundo@spohr.cl', password: 'hits2025', role: 'manager' },
  { name: 'Rodrigo Muñoz', email: 'rodrigo.munoz@hitscorredoraseguros.cl', password: 'hits2025', role: 'manager' },
  { name: 'Juan Pablo Carmona', email: 'juan.carmona@hitscorredoraseguros.cl', password: 'hits2025', role: 'manager' },
  { name: 'Demo Gestor', email: 'demo@hitscorredoraseguros.cl', password: 'hits2025', role: 'agent' }
];

function App() {
  // Auth State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hits_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Tickets State
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Sorting State
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  // Login handler
  const handleLogin = (e) => {
    e.preventDefault();
    const foundUser = USERS.find(u => u.email.toLowerCase() === loginEmail.toLowerCase() && u.password === loginPassword);
    if (foundUser) {
      const userData = { name: foundUser.name, email: foundUser.email, role: foundUser.role };
      setUser(userData);
      localStorage.setItem('hits_user', JSON.stringify(userData));
      setLoginError('');
    } else {
      setLoginError('Email o contraseña incorrectos');
    }
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    setTickets([]);
    localStorage.removeItem('hits_user');
  };

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    }
  }, [user]);

  // Initial fetch and polling
  useEffect(() => {
    if (!user) return;
    
    let isMounted = true;
    
    const loadTickets = async () => {
      try {
        const res = await fetch('/api/tickets');
        const data = await res.json();
        if (isMounted) setTickets(data);
      } catch (err) {
        console.error("Failed to fetch tickets", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    setLoading(true);
    loadTickets();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (isMounted) loadTickets();
    }, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  // Close ticket manually
  const closeTicket = async (ticketId) => {
    try {
      await fetch(`/api/tickets/${ticketId}/close`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closedBy: user?.email })
      });
      fetchTickets();
      setSelectedTicket(null);
    } catch (err) {
      console.error("Failed to close ticket", err);
    }
  };

  // Get unique assignees for filter
  const uniqueAssignees = [...new Set(tickets.map(t => t.assignedTo))];

  // Filter and sort logic
  const filteredTickets = tickets
    .filter(t => {
      // Agents only see their own assigned tickets
      if (user?.role === 'agent' && t.assignedTo !== user?.email) return false;
      
      // Apply status filter
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      
      // Apply assignee filter (for managers)
      if (user?.role === 'manager') {
        if (assigneeFilter === 'MINE' && t.assignedTo !== user?.email) return false;
        if (assigneeFilter !== 'ALL' && assigneeFilter !== 'MINE' && t.assignedTo !== assigneeFilter) return false;
      }
      
      // Apply search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          t.id?.toString().includes(q) ||
          t.summary?.toLowerCase().includes(q) ||
          t.originalSubject?.toLowerCase().includes(q) ||
          t.from?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'createdAt' || sortField === 'closedAt') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Counts
  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const closedCount = tickets.filter(t => t.status === 'CLOSED').length;

  // Sort handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Login Screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-96">
          <div className="flex flex-col items-center mb-6">
            <img src="/logo-hits.png" alt="Hits Corredora" className="h-20 mb-4" />
            <p className="text-sm text-gray-500">Portal de Gestión de Tickets</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="tu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input 
                type="password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                required
              />
            </div>
            {loginError && (
              <p className="text-red-600 text-sm text-center">{loginError}</p>
            )}
            <button 
              type="submit"
              className="w-full bg-blue-900 text-white py-2.5 px-4 rounded-lg hover:bg-blue-800 transition font-medium"
            >
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo-hits.png" alt="Hits" className="h-10" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold leading-tight text-blue-900">Panel de Control</h1>
              <p className="text-xs text-gray-500">Gestión de Tickets</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 sm:p-6">
        {/* Stats Badges */}
        <div className="flex gap-4 mb-6">
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="text-2xl font-bold">{openCount}</span>
            <span className="text-sm">Abiertos</span>
          </div>
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="text-2xl font-bold">{closedCount}</span>
            <span className="text-sm">Resueltos</span>
          </div>
          <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="text-2xl font-bold">{tickets.length}</span>
            <span className="text-sm">Total</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Cargando tickets...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 items-center justify-between">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Buscar por ID, asunto, remitente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Estado: Todos</option>
                  <option value="OPEN">Abiertos</option>
                  <option value="CLOSED">Resueltos</option>
                </select>

                <select 
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Asignado: Todos</option>
                  <option value="MINE">Mis Tickets</option>
                  {uniqueAssignees.map(email => (
                    <option key={email} value={email}>{email.split('@')[0]}</option>
                  ))}
                </select>

                <button 
                  onClick={fetchTickets}
                  className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg transition"
                >
                  🔄 Refrescar
                </button>
              </div>
            </div>

            {/* Table (Desktop) */}
            <div className="overflow-x-auto hidden md:block">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th onClick={() => handleSort('id')} className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Solicitud</th>
                    <th onClick={() => handleSort('category')} className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      Categoría {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('urgency')} className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      Prioridad {sortField === 'urgency' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Asignado</th>
                    <th onClick={() => handleSort('createdAt')} className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      Creado {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-blue-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-gray-500">#{ticket.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{ticket.summary}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{ticket.originalSubject}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {ticket.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          ticket.urgency === 'Alta' ? 'bg-red-100 text-red-800' : 
                          ticket.urgency === 'Media' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {ticket.urgency}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{ticket.assignedTo?.split('@')[0]}</td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {new Date(ticket.createdAt).toLocaleString('es-CL')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ticket.status === 'CLOSED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ticket.status === 'CLOSED' ? '✓ Resuelto' : '● Abierto'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button 
                          onClick={() => setSelectedTicket(ticket)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-gray-400 text-sm">
                        No hay tickets que coincidan con los filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Cards (Mobile) */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredTickets.map(ticket => (
                <div key={ticket.id} className="p-4" onClick={() => setSelectedTicket(ticket)}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs text-gray-400">#{ticket.id}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      ticket.status === 'CLOSED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {ticket.status === 'CLOSED' ? '✓' : '●'}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{ticket.summary}</h3>
                  <p className="text-xs text-gray-500 mb-2">{ticket.originalSubject}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{ticket.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      ticket.urgency === 'Alta' ? 'bg-red-100 text-red-700' : 
                      ticket.urgency === 'Media' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>{ticket.urgency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Ticket #{selectedTicket.id}</h2>
                <p className="text-sm text-gray-500">{selectedTicket.originalSubject}</p>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Categoría</p>
                  <p className="font-medium">{selectedTicket.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Urgencia</p>
                  <p className="font-medium">{selectedTicket.urgency}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Asignado a</p>
                  <p className="font-medium">{selectedTicket.assignedTo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Estado</p>
                  <p className="font-medium">{selectedTicket.status === 'CLOSED' ? 'Resuelto' : 'Abierto'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Remitente</p>
                  <p className="font-medium">{selectedTicket.from}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Creado</p>
                  <p className="font-medium">{new Date(selectedTicket.createdAt).toLocaleString('es-CL')}</p>
                </div>
                {selectedTicket.closedAt && (
                  <div className="col-span-2 bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase">Resuelto</p>
                    <p className="font-medium text-green-800">
                      Por: {selectedTicket.closedBy || 'Sistema'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedTicket.closedAt).toLocaleString('es-CL')}
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase mb-2">Resumen IA</p>
                <p className="text-gray-800 bg-blue-50 p-3 rounded-lg">{selectedTicket.summary}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Contenido Original</p>
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedTicket.emailBody || 'No disponible'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between">
              <button 
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cerrar
              </button>
              {selectedTicket.status !== 'CLOSED' && (
                <button 
                  onClick={() => closeTicket(selectedTicket.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  ✓ Marcar como Resuelto
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
