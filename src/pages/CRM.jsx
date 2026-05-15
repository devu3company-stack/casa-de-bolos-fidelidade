import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import logo from '../assets/logo.png';
import { Search, Download, Filter, MessageSquare, Clock, Trash2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const CRM = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSegment = queryParams.get('segment') || 'all';

  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [segment, setSegment] = useState(initialSegment);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, segment, customers]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_profiles')
        .select('*')
        .order('last_purchase', { ascending: false });

      if (error) {
        console.error('Erro ao buscar clientes:', error);
        alert('Erro ao carregar clientes do banco de dados.');
      } else if (data) {
        const processed = data.map(customer => {
          const lastPurchase = new Date(customer.last_purchase);
          const now = new Date();
          const diffTime = Math.abs(now - lastPurchase);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          return {
            ...customer,
            daysInactive: diffDays
          };
        });
        setCustomers(processed);
      }
    } catch (err) {
      console.error('Exceção capturada:', err);
      if (err.message === 'Failed to fetch') {
        setError('Erro de conexão: Possível bloqueio por AdBlock ou Firewall. Tente desativar extensões.');
      } else {
        setError('Erro de conexão com o servidor. Verifique sua internet.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Tem certeza que deseja apagar o cliente ${name}? Todos os carimbos e histórico serão perdidos.`)) {
      setLoading(true);
      const { error } = await supabase
        .from('loyalty_profiles')
        .delete()
        .eq('id', id);

      if (!error) {
        setCustomers(customers.filter(c => c.id !== id));
        alert('Cliente removido com sucesso.');
      } else {
        alert('Erro ao apagar cliente: ' + error.message);
      }
      setLoading(false);
    }
  };

  const filterData = () => {
    let result = [...customers];

    // Search filter
    if (searchTerm) {
      result = result.filter(c => 
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.cpf.includes(searchTerm) ||
        (c.phone && c.phone.includes(searchTerm))
      );
    }

    // Segment filter
    if (segment === 'active') {
      result = result.filter(c => c.daysInactive <= 15);
    } else if (segment === 'warning') {
      result = result.filter(c => c.daysInactive > 15 && c.daysInactive <= 30);
    } else if (segment === 'churn') {
      result = result.filter(c => c.daysInactive > 30);
    } else if (segment === 'birthday_today') {
      const today = new Date();
      result = result.filter(c => {
        if (!c.birthday) return false;
        const bday = new Date(c.birthday + 'T00:00:00'); // Garante fuso horário local
        return bday.getDate() === today.getDate() && bday.getMonth() === today.getMonth();
      });
    } else if (segment === 'birthday_month') {
      const today = new Date();
      result = result.filter(c => {
        if (!c.birthday) return false;
        const bday = new Date(c.birthday + 'T00:00:00');
        return bday.getMonth() === today.getMonth();
      });
    }

    setFilteredCustomers(result);
  };

  const exportCSV = () => {
    if (filteredCustomers.length === 0) return;

    const headers = ['Nome', 'Telefone', 'CPF', 'Ultima Compra', 'Dias Inativo'];
    const rows = filteredCustomers.map(c => [
      c.full_name,
      c.phone || '',
      c.cpf,
      new Date(c.last_purchase).toLocaleDateString('pt-BR'),
      c.daysInactive
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `campanha_crm_${segment}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (days) => {
    if (days <= 15) return '#599242'; // Green
    if (days <= 30) return '#EAB308'; // Yellow
    return '#B85252'; // Red
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '1200px' }}>
      <div className="header">
        <img src={logo} alt="Casa de Bolos" className="logo-main" />
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div className="analytics-pill">CRM - FIDELIZAÇÃO & CAMPANHAS</div>
      </div>

      {/* Filters & Actions */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.9)', 
        borderRadius: '1.5rem', 
        padding: '1.5rem', 
        marginBottom: '2rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input 
              type="text" 
              placeholder="Buscar por nome, CPF ou tel..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.8rem 1rem 0.8rem 2.8rem',
                borderRadius: '999px',
                border: '1px solid #ddd',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
          </div>
          <select 
            value={segment} 
            onChange={(e) => setSegment(e.target.value)}
            style={{
              padding: '0.8rem 1rem',
              borderRadius: '999px',
              border: '1px solid #ddd',
              background: 'white',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            <option value="all">Todos Clientes</option>
            <option value="active">Ativos (até 15 d)</option>
            <option value="warning">Atenção (15-30 d)</option>
            <option value="churn">Inativos (+30 d)</option>
            <option value="birthday_today">Aniversariantes (Hoje)</option>
            <option value="birthday_month">Aniversariantes (Mês)</option>
          </select>
        </div>

        <button 
          onClick={exportCSV} 
          disabled={filteredCustomers.length === 0}
          className="btn-green-pill" 
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 2rem' }}
        >
          <Download size={18} />
          EXPORTAR PARA CAMPANHA
        </button>
      </div>

      {/* Customer List */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        borderRadius: '1.5rem', 
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#555' }}>Carregando dados...</div>
        ) : error ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#b85252', fontWeight: 'bold' }}>{error}</div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#555' }}>Nenhum cliente encontrado nesta segmentação.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#333' }}>
              <thead>
                <tr style={{ background: '#f8f8f8', textAlign: 'left', borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '1.2rem' }}>Cliente</th>
                  <th style={{ padding: '1.2rem' }}>Status</th>
                  <th style={{ padding: '1.2rem' }}>Última Compra</th>
                  <th style={{ padding: '1.2rem' }}>Aniversário</th>
                  <th style={{ padding: '1.2rem' }}>Carimbos</th>
                  <th style={{ padding: '1.2rem', minWidth: '180px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} style={{ borderBottom: '1px solid #eee', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1.2rem' }}>
                      <div style={{ fontWeight: 'bold' }}>{customer.full_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#777' }}>{customer.phone || 'Sem telefone'}</div>
                    </td>
                    <td style={{ padding: '1.2rem' }}>
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.4rem', 
                        padding: '0.3rem 0.8rem', 
                        borderRadius: '999px',
                        background: getStatusColor(customer.daysInactive) + '20',
                        color: getStatusColor(customer.daysInactive),
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        <Clock size={14} />
                        {customer.daysInactive} dias inativo
                      </div>
                    </td>
                    <td style={{ padding: '1.2rem', fontSize: '0.9rem' }}>
                      {new Date(customer.last_purchase).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '1.2rem', fontSize: '0.9rem' }}>
                      {customer.birthday ? new Date(customer.birthday + 'T00:00:00').toLocaleDateString('pt-BR').substring(0, 5) : '-'}
                    </td>
                    <td style={{ padding: '1.2rem' }}>
                      <div style={{ 
                        width: '30px', 
                        height: '30px', 
                        borderRadius: '50%', 
                        background: '#599242', 
                        color: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        {customer.stamps}
                      </div>
                    </td>
                    <td style={{ padding: '1.2rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                        <button 
                          onClick={() => {
                            const phone = customer.phone?.replace(/\D/g, '');
                            const cleanPhone = phone?.startsWith('55') ? phone : `55${phone}`;
                            let message = '';
                            
                            const today = new Date();
                            const bday = customer.birthday ? new Date(customer.birthday + 'T00:00:00') : null;
                            const isBirthday = bday && bday.getDate() === today.getDate() && bday.getMonth() === today.getMonth();

                            if (isBirthday) {
                              message = `Parabéns, ${customer.full_name}! 🎉 A Casa de Bolos deseja um feliz aniversário! Venha comemorar conosco e garantir seu carimbo de hoje! 🎂✨`;
                            } else if (customer.daysInactive <= 15) {
                              message = `Olá, ${customer.full_name}! Notamos que você é um cliente frequente da Casa de Bolos. Você já tem ${customer.stamps} carimbos! Continue assim para ganhar seu bolo grátis em breve! 🍰✨`;
                            } else if (customer.daysInactive <= 30) {
                              message = `Oi, ${customer.full_name}! Estamos com saudades de você aqui na Casa de Bolos! 🏠🧁 Você tem ${customer.stamps} carimbos acumulados. Que tal passar aqui hoje e garantir mais um?`;
                            } else {
                              message = `Olá, ${customer.full_name}! Faz um tempo que não vemos você na Casa de Bolos. 😢 Temos uma seleção especial de bolos fresquinhos esperando por você! Você já possui ${customer.stamps} carimbos no nosso programa de fidelidade. Vem conferir as novidades! 🎂❤️`;
                            }

                            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            padding: '0.5rem 0.8rem',
                            borderRadius: '8px',
                            background: '#25D366',
                            color: 'white',
                            textDecoration: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            width: '100%'
                          }}
                        >
                          <MessageSquare size={14} />
                          WHATSAPP
                        </button>
                        
                        <button 
                          onClick={() => handleDelete(customer.id, customer.full_name)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            padding: '0.5rem 0.8rem',
                            borderRadius: '8px',
                            background: '#fee2e2',
                            color: '#b85252',
                            border: '1px solid #fecaca',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            width: '100%'
                          }}
                        >
                          <Trash2 size={14} />
                          EXCLUIR CLIENTE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="footer-section">
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFFFFF' }}>Casa de Bolos - Fidelidade</h3>
        <div className="footer-line"></div>
      </div>
    </div>
  );
};

export default CRM;
