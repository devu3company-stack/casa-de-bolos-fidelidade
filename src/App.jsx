import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import PDV from './pages/PDV'
import Dashboard from './pages/Dashboard'
import RegisterCustomer from './pages/RegisterCustomer'
import Scanner from './pages/Scanner'
import CRM from './pages/CRM'
import { LayoutDashboard, ShoppingCart, UserPlus, Camera, Users } from 'lucide-react'

const Navigation = () => {
  const location = useLocation();
  
  return (
    <nav style={{
      position: 'fixed',
      bottom: '15px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '400px',
      zIndex: 50,
      background: '#FFFFFF',
      padding: '0.6rem 1.2rem',
      borderRadius: '9999px',
      display: 'flex',
      gap: '1rem',
      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
      alignItems: 'center',
      justifyContent: 'space-around'
    }}>
      <Link 
        to="/" 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
          textDecoration: 'none',
          color: location.pathname === '/' ? '#B85252' : '#888',
          transition: 'all 0.2s'
        }}
      >
        <ShoppingCart size={20} />
        <span style={{ fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase' }}>PDV</span>
      </Link>
      
      <Link 
        to="/register" 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
          textDecoration: 'none',
          color: location.pathname === '/register' ? '#B85252' : '#888',
          transition: 'all 0.2s'
        }}
      >
        <UserPlus size={20} />
        <span style={{ fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Cadastro</span>
      </Link>

      <Link 
        to="/scanner" 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
          textDecoration: 'none',
          color: location.pathname === '/scanner' ? '#B85252' : '#888',
          transition: 'all 0.2s'
        }}
      >
        <Camera size={20} />
        <span style={{ fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Scanner</span>
      </Link>

      <Link 
        to="/crm" 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
          textDecoration: 'none',
          color: location.pathname === '/crm' ? '#B85252' : '#888',
          transition: 'all 0.2s'
        }}
      >
        <Users size={20} />
        <span style={{ fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase' }}>CRM</span>
      </Link>
      
      <Link 
        to="/dashboard" 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
          textDecoration: 'none',
          color: location.pathname === '/dashboard' ? '#B85252' : '#888',
          transition: 'all 0.2s'
        }}
      >
        <LayoutDashboard size={20} />
        <span style={{ fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Admin</span>
      </Link>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div style={{ paddingBottom: '100px' }}>
        <Routes>
          <Route path="/" element={<PDV />} />
          <Route path="/register" element={<RegisterCustomer />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/crm" element={<CRM />} />
        </Routes>
        <Navigation />
      </div>
    </Router>
  )
}

export default App
