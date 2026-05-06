import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import logo from '../assets/logo.png';
import { Search, Download, Filter, MessageSquare, Clock } from 'lucide-react';
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

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, segment, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('loyalty_profiles')
      .select('*')
      .order('last_purchase', { ascending: false });

    if (data) {
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
    setLoading(false);
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
                  <th style={{ padding: '1.2rem' }}>Carimbos</th>
                  <th style={{ padding: '1.2rem' }}>Ações</th>
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
                      <button 
                        onClick={() => {
                          const phone = customer.phone?.replace(/\D/g, '');
                          const cleanPhone = phone?.startsWith('55') ? phone : `55${phone}`;
                          let message = '';
                          
                          if (customer.daysInactive <= 15) {
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
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          borderRadius: '999px',
                          background: '#25D366',
                          color: 'white',
                          textDecoration: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <MessageSquare size={16} />
                        WHATSAPP
                      </button>
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
