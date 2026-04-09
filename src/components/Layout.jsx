import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  LayoutDashboard, 
  Layers, 
  CheckSquare, 
  CalendarDays, 
  CreditCard,
  LogOut,
  Search
} from 'lucide-react';

export function Layout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={24} />, label: 'Dashboard' },
    { to: '/students', icon: <Users size={24} />, label: 'Students' },
    { to: '/groups', icon: <Layers size={24} />, label: 'Groups' },
    { to: '/classes', icon: <CalendarDays size={24} />, label: 'Classes' },
    { to: '/attendance', icon: <CheckSquare size={24} />, label: 'Attend' },
    { to: '/payments', icon: <CreditCard size={24} />, label: 'Payments' },
    { to: '/search', icon: <Search size={24} />, label: 'Search' },
  ];

  return (
    <div className="app-container">
      {/* Desktop Sidebar */}
      <nav className="side-nav">
        <div style={{ padding: 'var(--space-4)', fontWeight: 'bold', fontSize: '1.25rem', marginBottom: 'var(--space-4)' }}>
          Teacher App
        </div>
        {navItems.map(item => (
          <NavLink 
            key={item.to} 
            to={item.to} 
            className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
        <div style={{ flex: 1 }}></div>
        <button 
          onClick={handleLogout} 
          className="nav-item" 
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          <LogOut size={24} />
          <span>Logout</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav">
        {navItems.slice(0, 5).map(item => (
          <NavLink 
            key={item.to} 
            to={item.to} 
            className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
