
import React, { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(null); // 'manager' | 'agent' | null
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock Login
  const login = (role) => {
    setUser({ role, email: role === 'manager' ? 'gerente@empresa.com' : 'soporte@empresa.com' });
  };

  const logout = () => {
    setUser(null);
    setTickets([]);
  };

  // Fetch Tickets
  useEffect(() => {
    if (user) {
      setLoading(true);
      fetch('http://localhost:3000/api/tickets')
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

  // Filter Logic
  const filteredTickets = user?.role === 'manager' 
    ? tickets 
    : tickets.filter(t => t.assignedTo === user?.email || t.status === 'OPEN');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center">Hits AutoMail Portal</h1>
          <p className="mb-4 text-gray-600 text-center">Selecciona tu perfil de prueba:</p>
          <div className="space-y-3">
            <button 
              onClick={() => login('manager')} 
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Ingresar como Gerente
            </button>
            <button 
              onClick={() => login('agent')} 
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            >
              Ingresar como Gestor
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">AutoMail Dashboard</h1>
          <span className="text-sm text-gray-500 capitalize">Rol: {user.role} ({user.email})</span>
        </div>
        <button onClick={logout} className="text-red-500 hover:text-red-700">Salir</button>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        {loading ? (
          <div className="text-center py-10">Cargando tickets...</div>
        ) : (
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="py-2 px-4 text-left">ID</th>
                  <th className="py-2 px-4 text-left">Asunto / Resumen</th>
                  <th className="py-2 px-4 text-left">Categoría</th>
                  <th className="py-2 px-4 text-left">Urgencia</th>
                  <th className="py-2 px-4 text-left">Asignado a</th>
                  <th className="py-2 px-4 text-left">Estado</th>
                  {user.role === 'manager' && <th className="py-2 px-4 text-left">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 font-mono text-sm">{ticket.id}</td>
                    <td className="py-2 px-4">
                      <div className="font-semibold">{ticket.summary}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{ticket.originalSubject}</div>
                    </td>
                    <td className="py-2 px-4">
                      <span className="px-2 py-1 bg-gray-200 rounded text-xs">{ticket.category}</span>
                    </td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        ticket.urgency === 'Alta' ? 'bg-red-100 text-red-800' : 
                        ticket.urgency === 'Media' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {ticket.urgency}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-sm">{ticket.assignedTo}</td>
                    <td className="py-2 px-4">
                      <span className={`font-bold text-xs ${ticket.status === 'CLOSED' ? 'text-green-600' : 'text-blue-600'}`}>
                        {ticket.status}
                      </span>
                    </td>
                    {user.role === 'manager' && (
                      <td className="py-2 px-4">
                        <button className="text-blue-600 hover:underline text-xs">Reasignar</button>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500">
                      No hay tickets para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
