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
  Search,
  GraduationCap
} from 'lucide-react';

export function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    <div className="layout-wrapper">
      <header className="top-header">
        <div className="header-logo">
          <GraduationCap size={28} color="var(--color-primary)" />
          <span>Teacher App</span>
        </div>
        <div className="header-user">
          {user?.email && <span className="user-email">{user.email}</span>}
          <button onClick={handleLogout} className="header-logout">
            <LogOut size={20} />
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </header>
      
      <div className="app-container">
        {/* Desktop Sidebar */}
        <nav className="side-nav">
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
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav">
        {navItems.slice(0, 6).map(item => (
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
    </div>
  );
}
