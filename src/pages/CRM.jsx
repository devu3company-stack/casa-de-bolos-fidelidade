import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import logo from '../assets/logo.png';
import { Search, Download, Filter, MessageSquare, Clock, Trash2, Edit } from 'lucide-react';
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
  const [sortBy, setSortBy] = useState('recent');
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', birthday: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, segment, customers, sortBy]);

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
          const createdAt = new Date(customer.created_at);
          const now = new Date();
          
          const diffInactive = Math.abs(now - lastPurchase);
          const daysInactive = Math.ceil(diffInactive / (1000 * 60 * 60 * 24));
          
          const diffLife = Math.abs(now - createdAt);
          const daysLife = Math.ceil(diffLife / (1000 * 60 * 60 * 24));
          
          return {
            ...customer,
            daysInactive,
            daysLife
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
  const handleOpenDetails = async (customer) => {
    setSelectedCustomer(customer);
    setEditForm({
      full_name: customer.full_name,
      phone: customer.phone || '',
      birthday: customer.birthday || ''
    });
    setShowModal(true);
    
    // Fetch History
    const { data, error } = await supabase
      .from('stamp_transactions')
      .select('*')
      .eq('profile_id', customer.id)
      .order('created_at', { ascending: false });
    
    if (!error) setHistory(data);
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('loyalty_profiles')
      .update(editForm)
      .eq('id', selectedCustomer.id);

    if (!error) {
      alert('Cliente atualizado com sucesso!');
      fetchCustomers();
      setShowModal(false);
    } else {
      alert('Erro ao atualizar: ' + error.message);
    }
    setSaving(false);
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

    // Sort filter
    if (sortBy === 'name_asc') {
      result.sort((a, b) => a.full_name.localeCompare(b.full_name));
    } else if (sortBy === 'phone_asc') {
      result.sort((a, b) => (a.phone || '').localeCompare(b.phone || ''));
    } else {
      result.sort((a, b) => new Date(b.last_purchase) - new Date(a.last_purchase));
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

      {/* Quick Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '0.8rem', 
        marginBottom: '1rem', 
        flexWrap: 'wrap',
        justifyContent: 'center' 
      }}>
        <button 
          onClick={() => setSegment('all')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '999px',
            border: 'none',
            background: segment === 'all' ? '#599242' : 'white',
            color: segment === 'all' ? 'white' : '#555',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            transition: 'all 0.2s'
          }}
        >
          Todos
        </button>
        <button 
          onClick={() => setSegment('birthday_today')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '999px',
            border: 'none',
            background: segment === 'birthday_today' ? '#EAB308' : 'white',
            color: segment === 'birthday_today' ? 'white' : '#555',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            transition: 'all 0.2s',
            border: segment === 'birthday_today' ? 'none' : '2px solid #EAB308'
          }}
        >
          🎂 ANIVERSARIANTES DE HOJE
        </button>
        <button 
          onClick={() => setSegment('churn')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '999px',
            border: 'none',
            background: segment === 'churn' ? '#B85252' : 'white',
            color: segment === 'churn' ? 'white' : '#555',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            transition: 'all 0.2s'
          }}
        >
          ⚠️ Recuperar Inativos
        </button>
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
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
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
            <option value="recent">Mais Recentes</option>
            <option value="name_asc">Nome (A-Z)</option>
            <option value="phone_asc">Telefone (A-Z)</option>
          </select>
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
                  <th style={{ padding: '1.2rem' }}>LTV (Total)</th>
                  <th style={{ padding: '1.2rem' }}>Vida (Dias)</th>
                  <th style={{ padding: '1.2rem' }}>Status</th>
                  <th style={{ padding: '1.2rem' }}>Última Compra</th>
                  <th style={{ padding: '1.2rem' }}>Carimbos</th>
                  <th style={{ padding: '1.2rem', minWidth: '180px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} style={{ borderBottom: '1px solid #eee', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1.2rem' }}>
                      <div 
                        onClick={() => handleOpenDetails(customer)}
                        style={{ fontWeight: 'bold', color: '#599242', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {customer.full_name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#777' }}>{customer.phone || 'Sem telefone'}</div>
                    </td>
                    <td style={{ padding: '1.2rem', fontWeight: 'bold' }}>
                      R$ {(customer.total_spent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '1.2rem', fontSize: '0.9rem' }}>
                      {customer.daysLife} dias
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                        <button 
                          onClick={() => handleOpenDetails(customer)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            padding: '0.5rem 0.8rem',
                            borderRadius: '8px',
                            background: '#e0f2fe',
                            color: '#0369a1',
                            border: '1px solid #bae6fd',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            width: '100%'
                          }}
                        >
                          <Edit size={14} />
                          EDITAR
                        </button>
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

      {/* Modal de Detalhes e Edição */}
      {showModal && selectedCustomer && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              ×
            </button>
            
            <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Detalhes do Cliente</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {/* Coluna Edição */}
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#599242' }}>Editar Cadastro</h3>
                <form onSubmit={handleUpdateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>NOME COMPLETO</label>
                    <input 
                      type="text" 
                      className="input-pill" 
                      value={editForm.full_name}
                      onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>TELEFONE</label>
                    <input 
                      type="text" 
                      className="input-pill" 
                      value={editForm.phone}
                      onChange={e => setEditForm({...editForm, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>ANIVERSÁRIO</label>
                    <input 
                      type="date" 
                      className="input-pill" 
                      value={editForm.birthday}
                      onChange={e => setEditForm({...editForm, birthday: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="btn-green-pill" disabled={saving}>
                    {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                  </button>
                </form>
              </div>

              {/* Coluna Histórico */}
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#599242' }}>Histórico de Compras</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {history.length === 0 ? (
                    <p style={{ fontSize: '0.9rem', color: '#777' }}>Nenhuma transação encontrada.</p>
                  ) : (
                    history.map(item => (
                      <div key={item.id} style={{ padding: '0.8rem', border: '1px solid #eee', borderRadius: '10px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                          <span>{item.action === 'ADD' ? '➕ Carimbo Adicionado' : '🎁 Prêmio Resgatado'}</span>
                          <span>R$ {(item.purchase_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ color: '#888', marginTop: '0.2rem' }}>
                          {new Date(item.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="footer-section">
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFFFFF' }}>Casa de Bolos - Fidelidade</h3>
        <div className="footer-line"></div>
      </div>
    </div>
  );
};

export default CRM;
