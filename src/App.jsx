import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Layout } from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentsDirectory from './pages/StudentsDirectory';
import StudentProfile from './pages/StudentProfile';
import ClassesManagement from './pages/ClassesManagement';
import AttendanceScreen from './pages/AttendanceScreen';
import PaymentsManagement from './pages/PaymentsManagement';
import SearchResults from './pages/SearchResults';

function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<StudentsDirectory />} />
          <Route path="students/:id" element={<StudentProfile />} />
          <Route path="classes" element={<ClassesManagement />} />
          <Route path="attendance" element={<AttendanceScreen />} />
          <Route path="payments" element={<PaymentsManagement />} />
          <Route path="search" element={<SearchResults />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
