import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import logo from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ 
    totalProfiles: 0, 
    totalStamps: 0, 
    totalRedeems: 0,
    churn: 0 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      // 1. Total de Perfis
      const { count: profileCount } = await supabase
        .from('loyalty_profiles')
        .select('*', { count: 'exact', head: true });

      // 2. Transações (Carimbos e Resgates)
      const { data: transactions } = await supabase
        .from('stamp_transactions')
        .select('action, amount');

      // 3. Perfis para Churn
      const { data: profiles } = await supabase
        .from('loyalty_profiles')
        .select('last_purchase');
      
      if (transactions) {
        const totalStamps = transactions
          .filter(t => t.action === 'ADD')
          .reduce((acc, t) => acc + (t.amount || 0), 0);
          
        const totalRedeems = transactions
          .filter(t => t.action === 'REDEEM')
          .length;

        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const churn = profiles ? profiles.filter(p => new Date(p.last_purchase) < thirtyDaysAgo).length : 0;

        setStats({ 
          totalProfiles: profileCount || 0, 
          totalStamps, 
          totalRedeems, 
          churn 
        });
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const sendGeneralCampaign = () => {
    navigate('/crm?segment=all');
  };

  const sendChurnCampaign = () => {
    navigate('/crm?segment=churn');
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '1100px' }}>
      <div className="header">
        <img src={logo} alt="Casa de Bolos" className="logo-main" />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div className="analytics-pill">ADMIN - RELATÓRIOS</div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '3rem' 
      }}>
        <div className="analytics-card">
          <p style={{ color: '#555', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Total Clientes</p>
          <h3 style={{ color: '#333', fontSize: '2.5rem', fontWeight: '800' }}>{loading ? '-' : stats.totalProfiles}</h3>
        </div>
        <div className="analytics-card">
          <p style={{ color: '#555', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Carimbos Dados</p>
          <h3 style={{ color: '#333', fontSize: '2.5rem', fontWeight: '800' }}>{loading ? '-' : stats.totalStamps}</h3>
        </div>
        <div className="analytics-card">
          <p style={{ color: '#555', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Prêmios Entregues</p>
          <h3 style={{ color: '#333', fontSize: '2.5rem', fontWeight: '800' }}>{loading ? '-' : stats.totalRedeems}</h3>
        </div>
        <div className="analytics-card">
          <p style={{ color: '#555', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Clientes Inativos</p>
          <h3 style={{ color: '#333', fontSize: '2.5rem', fontWeight: '800' }}>{loading ? '-' : stats.churn}</h3>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '2rem',
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%'
      }}>
        <button className="btn-salmon-pill" onClick={sendGeneralCampaign}>
          DISPARAR CAMPANHA (TODOS)
        </button>
        <button className="btn-salmon-pill" onClick={sendChurnCampaign}>
          DISPARAR CAMPANHA (INATIVOS)
        </button>
      </div>

      <div className="footer-section">
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Casa de Bolos - Baixa Mogiana</h3>
        <div className="footer-line"></div>
      </div>
    </div>
  );
};

export default Dashboard;
