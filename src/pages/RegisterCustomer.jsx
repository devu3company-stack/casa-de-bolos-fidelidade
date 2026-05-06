import React, { useState } from 'react';
import { supabase } from '../supabase';
import { UserPlus, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

const RegisterCustomer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const prefilledCpf = queryParams.get('cpf') || '';
  const prefilledName = queryParams.get('name') || '';
  const prefilledPhone = queryParams.get('phone') || '';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: prefilledName,
    cpf: prefilledCpf,
    phone: prefilledPhone,
    birthday: '',
    marketing_consent: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: err } = await supabase
      .from('loyalty_profiles')
      .insert([formData])
      .select()
      .single();

    if (!err) {
      setSuccess(true);
      // Opcional: remover o timeout ou aumentar para dar tempo de enviar o zap
    } else {
      setError(err.message.includes('unique') ? 'Este CPF já está cadastrado no sistema.' : 'Erro ao realizar cadastro. Verifique os dados.');
    }
    setLoading(false);
  };

  const sendWhatsApp = () => {
    const phone = formData.phone.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('55') ? phone : `55${phone}`;
    const text = encodeURIComponent(`Olá, ${formData.full_name}! Bem-vindo ao Programa de Fidelidade da Casa de Bolos. Agora você já está pontuando para ganhar seu bolo grátis! 🎉`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const sendSMS = () => {
    alert(`SMS Enviado para ${formData.phone}: "Casa de Bolos: Voce foi cadastrado no nosso clube de fidelidade! Ganhe bolos gratis comprando conosco."`);
  };

  return (
    <div className="page-wrapper">
      <div className="header">
        <img src={logo} alt="Casa de Bolos" className="logo-main" />
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <div className="stamp-grey-card" style={{ padding: '3rem 2rem', position: 'relative' }}>
          <Link to="/" style={{ position: 'absolute', top: '20px', left: '20px', color: '#555' }}>
            <ArrowLeft size={24} />
          </Link>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              background: 'var(--salmon-bg)', 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              color: 'white',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}>
              <UserPlus size={32} />
            </div>
            <h2 style={{ color: '#333', fontSize: '1.8rem', fontWeight: '800', textTransform: 'uppercase' }}>Novo Cadastro</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>Cadastre o cliente para iniciar o programa de fidelidade</p>
          </div>

          {success ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <CheckCircle size={64} color="var(--btn-green)" style={{ marginBottom: '1.5rem' }} />
              <h3 style={{ color: 'var(--btn-green)', fontSize: '1.5rem', fontWeight: 'bold' }}>Cadastro Realizado!</h3>
              
              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Deseja notificar o cliente agora?</p>
                <button className="btn-green-pill" onClick={sendWhatsApp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                   ENVIAR BOAS-VINDAS (WHATSAPP)
                </button>
                <button className="btn-salmon-pill" onClick={sendSMS} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                   NOTIFICAR VIA SMS
                </button>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#888', marginTop: '1rem', cursor: 'pointer', textDecoration: 'underline' }}>
                   Voltar para o PDV
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: '#555', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', marginLeft: '0.5rem' }}>Nome Completo</label>
                <input 
                  required 
                  className="input-base" 
                  style={{ border: 'none', background: '#eee', padding: '1rem', borderRadius: '1rem' }}
                  placeholder="Ex: João da Silva" 
                  value={formData.full_name} 
                  onChange={e => setFormData({...formData, full_name: e.target.value})} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: '#555', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', marginLeft: '0.5rem' }}>CPF</label>
                  <input 
                    required 
                    className="input-base" 
                    style={{ border: 'none', background: '#eee', padding: '1rem', borderRadius: '1rem' }}
                    placeholder="000.000.000-00" 
                    value={formData.cpf} 
                    onChange={e => setFormData({...formData, cpf: e.target.value})} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: '#555', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', marginLeft: '0.5rem' }}>WhatsApp</label>
                  <input 
                    required 
                    className="input-base" 
                    style={{ border: 'none', background: '#eee', padding: '1rem', borderRadius: '1rem' }}
                    placeholder="(00) 00000-0000" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: '#555', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', marginLeft: '0.5rem' }}>Data de Nascimento</label>
                <input 
                  required 
                  type="date"
                  className="input-base" 
                  style={{ border: 'none', background: '#eee', padding: '1rem', borderRadius: '1rem' }}
                  value={formData.birthday} 
                  onChange={e => setFormData({...formData, birthday: e.target.value})} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', padding: '0.5rem 0' }}>
                <input 
                  type="checkbox" 
                  style={{ marginTop: '0.3rem' }}
                  checked={formData.marketing_consent}
                  onChange={e => setFormData({...formData, marketing_consent: e.target.checked})}
                />
                <p style={{ color: '#777', fontSize: '0.75rem', lineHeight: '1.4' }}>
                  Autorizo o envio de novidades e promoções via WhatsApp pela Casa de Bolos.
                </p>
              </div>

              {error && <div style={{ color: '#b85252', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}

              <button 
                className="btn-green-pill" 
                style={{ height: '56px', fontSize: '1.1rem', marginTop: '1rem' }} 
                disabled={loading}
              >
                {loading ? 'CADASTRANDO...' : 'FINALIZAR CADASTRO'}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="footer-section">
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Casa de Bolos - Baixa Mogiana</h3>
        <div className="footer-line"></div>
      </div>
    </div>
  );
};

export default RegisterCustomer;
