
import React, { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(null); 
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock Login Users for Demo
  const users = [
    { name: 'Edmundo Spohr', email: 'edmundo@spohr.cl', role: 'manager' },
    { name: 'Rodrigo Muñoz', email: 'rodrigo.munoz@hitscorredoraseguros.cl', role: 'manager' },
    { name: 'Juan Pablo Carmona', email: 'juan.carmona@hitscorredoraseguros.cl', role: 'manager' }
  ];

  const login = (selectedUser) => {
    setUser(selectedUser);
  };

  const logout = () => {
    setUser(null);
    setTickets([]);
  };

  // Fetch Tickets
  useEffect(() => {
    if (user) {
      setLoading(true);
      fetch('/api/tickets') // Relative path now that we are served by backend
        .then(res => res.json())
        .then(data => {
          setTickets(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch tickets", err);
          setLoading(false);
        });
    }
  }, [user]);

  // Filter Logic (All show everything as they are Managers, but helpful for future)
  const filteredTickets = user?.role === 'manager' 
    ? tickets 
    : tickets.filter(t => t.assignedTo === user?.email || t.status === 'OPEN');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-96">
          <div className="flex flex-col items-center mb-6">
             <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2">H</div>
             <h1 className="text-xl font-bold text-center text-gray-800">Hits Corredora de Seguros</h1>
             <p className="text-xs text-gray-500 uppercase tracking-wide">Portal de Gestión</p>
          </div>
          
          <p className="mb-4 text-gray-600 text-sm text-center">Selecciona un usuario para la demo:</p>
          <div className="space-y-3">
            {users.map(u => (
                <button 
                  key={u.email}
                  onClick={() => login(u)} 
                  className="w-full bg-blue-900 text-white py-2 px-4 rounded hover:bg-blue-800 transition text-sm flex justify-between items-center"
                >
                  <span>{u.name}</span>
                  <span className="opacity-50 text-xs">Gerencia</span>
                </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-900 rounded flex items-center justify-center text-white font-bold text-sm">H</div>
                <div>
                    <h1 className="text-lg font-bold leading-tight">Hits Corredora</h1>
                    <p className="text-xs text-gray-500">Panel de Control</p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                 <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                 </div>
                 <button onClick={logout} className="text-sm text-red-600 hover:text-red-800 border border-red-200 px-3 py-1 rounded hover:bg-red-50">Salir</button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Cargando tickets...</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Solicitud</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prioridad</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Asignado</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredTickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-blue-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-gray-500">#{ticket.id}</td>
                        <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{ticket.summary}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs" title={ticket.originalSubject}>{ticket.originalSubject}</div>
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
                        <td className="py-3 px-4 text-sm text-gray-600">{ticket.assignedTo}</td>
                        <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            ticket.status === 'CLOSED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                            {ticket.status === 'CLOSED' ? 'Resuelto' : 'Abierto'}
                        </span>
                        </td>
                    </tr>
                    ))}
                    {filteredTickets.length === 0 && (
                    <tr>
                        <td colSpan="6" className="py-12 text-center text-gray-400 text-sm">
                        No hay tickets pendientes. ¡Buen trabajo!
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
