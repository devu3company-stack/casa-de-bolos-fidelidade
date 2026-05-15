import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Search, UserPlus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const PDV = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const searchCustomer = async (e) => {
    e?.preventDefault();
    if (!searchQuery) return;
    
    setLoading(true);
    setError('');
    
    const cleanQuery = searchQuery.replace(/\D/g, '');
    const isNumeric = /^\d+$/.test(cleanQuery) && cleanQuery.length > 0;

    try {
      let query = supabase.from('loyalty_profiles').select('*');
      
      if (isNumeric) {
        query = query.or(`cpf.eq.${cleanQuery},phone.eq.${cleanQuery}`);
      } else {
        query = query.ilike('full_name', `%${searchQuery}%`);
      }

      // Usamos limit(1) em vez de single() para evitar erro 406 se houver múltiplos resultados
      const { data, error: err } = await query.limit(1);

      if (err) {
        console.error('Erro na busca:', err);
        setError('Erro ao buscar cliente.');
      } else if (data && data.length > 0) {
        setCustomer(data[0]);
        setShowAddForm(false);
      } else {
        setCustomer(null);
        setShowAddForm(true);
      }
    } catch (err) {
      console.error('Exceção na busca:', err);
      if (err.message === 'Failed to fetch') {
        setError('Erro: Conexão bloqueada. Desative o AdBlock ou mude de rede.');
      } else {
        setError('Erro de conexão com o banco de dados.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddStamp = async () => {
    if (!customer) return;
    if (customer.stamps >= 12) return;

    setLoading(true);
    const newStamps = customer.stamps + 1;
    
    const { error: err } = await supabase
      .from('loyalty_profiles')
      .update({ stamps: newStamps, last_purchase: new Date().toISOString() })
      .eq('id', customer.id);

    if (!err) {
      await supabase.from('stamp_transactions').insert({
        profile_id: customer.id,
        action: 'ADD',
        amount: 1
      });
      setCustomer({ ...customer, stamps: newStamps });
    }
    setLoading(false);
  };

  const handleNotify = async (type) => {
    if (!customer) return;

    const phone = customer.phone.replace(/\D/g, '');
    const message = `Olá, ${customer.full_name}! Você tem ${customer.stamps} carimbos na Casa de Bolos. Falta pouco para o seu bolo grátis! 🎉`;

    if (type === 'whatsapp_manual') {
      // Abre o WhatsApp normalmente com o prefixo 55 se não houver
      const cleanPhone = phone.startsWith('55') ? phone : `55${phone}`;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      // Aqui integrariamos com Twilio (SMS) ou Z-API (WhatsApp Automático)
      setLoading(true);
      
      // SIMULAÇÃO DE ENVIO TRANSPARENTE
      console.log(`Enviando ${type} para ${phone}: ${message}`);
      
      // No futuro, você trocaria este alert por uma chamada de API real
      setTimeout(() => {
        alert(`${type.toUpperCase()} enviado com sucesso para ${customer.phone}! (Modo Transparente Simulado)`);
        setLoading(false);
      }, 1500);

      /* 
      EXEMPLO DE CÓDIGO REAL PARA SMS (TWILIO):
      fetch('https://SUA_URL_SUPABASE_FUNCTION/send-sms', {
        method: 'POST',
        body: JSON.stringify({ to: phone, message: message })
      });
      */
    }
  };

  const handleRedeem = async () => {
    if (!customer || customer.stamps < 12) return;

    setLoading(true);
    const { error: err } = await supabase
      .from('loyalty_profiles')
      .update({ stamps: 0, last_purchase: new Date().toISOString() })
      .eq('id', customer.id);

    if (!err) {
      await supabase.from('stamp_transactions').insert({
        profile_id: customer.id,
        action: 'REDEEM',
        amount: 12
      });
      setCustomer({ ...customer, stamps: 0 });
      alert('PRÊMIO RESGATADO COM SUCESSO! O cartão do cliente foi zerado.');
    } else {
      alert('Erro ao resgatar prêmio.');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!customer) return;
    if (window.confirm(`Tem certeza que deseja apagar o cliente ${customer.full_name}? Todos os dados serão perdidos permanentemente.`)) {
      setLoading(true);
      const { error } = await supabase
        .from('loyalty_profiles')
        .delete()
        .eq('id', customer.id);

      if (!error) {
        alert('Cliente removido com sucesso.');
        setCustomer(null);
        setSearchQuery('');
      } else {
        alert('Erro ao apagar cliente: ' + error.message);
      }
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="header">
        <img src={logo} alt="Casa de Bolos" className="logo-main" />
      </div>

      <div className="search-container">
        <input 
          type="text" 
          placeholder="NOME, CPF OU TELEFONE" 
          className="input-pill"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') searchCustomer(); }}
        />
        <button className="btn-icon" onClick={searchCustomer} disabled={loading}>
          <Search size={24} />
        </button>
      </div>

      {error && <p style={{color: '#b85252', textAlign: 'center', marginBottom: '1rem', fontWeight: 'bold'}}>{error}</p>}

      {customer && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', animate: 'fadeIn 0.5s' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#333', marginBottom: '0.2rem' }}>
              {customer.full_name}
            </h2>
            <p style={{ color: '#666', fontSize: '0.9rem', fontWeight: '600' }}>📞 {customer.phone}</p>
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '1.5rem', 
            justifyContent: 'center',
            width: '100%'
          }}>
            <div className="stamp-grey-card" style={{ width: '100%', maxWidth: '500px' }}>
              <div className="stamp-grid">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={`stamp-circle ${i < customer.stamps ? 'active' : ''}`}></div>
                ))}
              </div>
              <div style={{ color: 'var(--salmon-text)', fontWeight: '800', fontSize: '1.1rem', textTransform: 'uppercase', textAlign: 'center', marginTop: '1.5rem' }}>
                {customer.stamps < 12 
                  ? `FALTA ${12 - customer.stamps} PARA GANHAR UM BOLO` 
                  : '🔥 RESGATE SEU BOLO AGORA!'}
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr', 
              gap: '1rem', 
              width: '100%', 
              maxWidth: '500px' 
            }}>
              {customer.stamps >= 12 ? (
                <button 
                  className="btn-green-pill" 
                  onClick={handleRedeem}
                  disabled={loading}
                  style={{ height: '70px', fontSize: '1.4rem', background: '#FFD700', color: '#333', border: 'none' }}
                >
                  {loading ? 'PROCESSANDO...' : '🎁 RESGATAR BOLO GRÁTIS'}
                </button>
              ) : (
                <button 
                  className="btn-green-pill" 
                  onClick={handleAddStamp}
                  disabled={loading}
                  style={{ height: '60px', fontSize: '1.2rem' }}
                >
                  {loading ? 'PROCESSANDO...' : '+1 CARIMBO'}
                </button>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button className="btn-salmon-pill" onClick={() => handleNotify('whatsapp_manual')} style={{ fontSize: '0.8rem', padding: '0.8rem' }}>
                  WHATSAPP (ABRIR)
                </button>
                <button className="btn-salmon-pill" onClick={() => handleNotify('sms')} style={{ fontSize: '0.8rem', padding: '0.8rem' }}>
                  NOTIFICAR SMS
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {!customer && showAddForm && (
        <div className="stamp-grey-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ 
            background: 'var(--salmon-bg)', 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            color: 'white'
          }}>
            <UserPlus size={24} />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#333', fontWeight: '800' }}>Cliente não encontrado</h3>
          <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Este CPF ou Telefone não consta na nossa base de fidelidade.</p>
          <button 
            className="btn-green-pill" 
            onClick={() => navigate('/register')}
          >
            CADASTRAR NOVO CLIENTE
          </button>
        </div>
      )}

      <div className="footer-section">
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Casa de Bolos - Baixa Mogiana</h3>
        <div className="footer-line"></div>
      </div>
    </div>
  );
};

export default PDV;
