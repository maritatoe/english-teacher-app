import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Users, BookOpen, Clock, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGroups: 0,
    classesThisWeek: 0,
    classesThisMonth: 0,
    pendingMonthCount: 0,
    pendingMonthAmount: 0,
    pendingHistCount: 0,
    pendingHistAmount: 0,
    collectedMonthAmount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const userId = user.id;

    try {
      // 1. Fetch total counts
      const [{ count: studentsCount }, { count: groupsCount }] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('teacher_id', userId),
        supabase.from('groups').select('*', { count: 'exact', head: true }).eq('teacher_id', userId)
      ]);

      // 2. Fetch class counts for week and month
      const now = new Date();
      const sWeek = format(startOfWeek(now), 'yyyy-MM-dd');
      const eWeek = format(endOfWeek(now), 'yyyy-MM-dd');
      const sMonth = format(startOfMonth(now), 'yyyy-MM-dd');
      const eMonth = format(endOfMonth(now), 'yyyy-MM-dd');

      const [{ count: classesWeek }, { count: classesMonth }] = await Promise.all([
        supabase.from('classes').select('*', { count: 'exact', head: true })
          .eq('teacher_id', userId).gte('date', sWeek).lte('date', eWeek),
        supabase.from('classes').select('*', { count: 'exact', head: true })
          .eq('teacher_id', userId).gte('date', sMonth).lte('date', eMonth)
      ]);

      // 3. Fetch all payments to compute financial metrics
      const { data: allPayments } = await supabase
        .from('payments')
        .select('amount, paid, month, year')
        .eq('teacher_id', userId);

      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      let pendingMCount = 0;
      let pendingMAmount = 0;
      let pendingHCount = 0;
      let pendingHAmount = 0;
      let collectedMAmount = 0;

      if (allPayments) {
        allPayments.forEach(p => {
          if (p.year === currentYear && p.month === currentMonth) {
            if (p.paid) {
              collectedMAmount += Number(p.amount);
            } else {
              pendingMCount++;
              pendingMAmount += Number(p.amount);
            }
          } else if (!p.paid) {
            const isBefore = p.year < currentYear || (p.year === currentYear && p.month < currentMonth);
            if (isBefore) {
              pendingHCount++;
              pendingHAmount += Number(p.amount);
            }
          }
        });
      }

      setStats({
        totalStudents: studentsCount || 0,
        totalGroups: groupsCount || 0,
        classesThisWeek: classesWeek || 0,
        classesThisMonth: classesMonth || 0,
        pendingMonthCount: pendingMCount,
        pendingMonthAmount: pendingMAmount,
        pendingHistCount: pendingHCount,
        pendingHistAmount: pendingHAmount,
        collectedMonthAmount: collectedMAmount
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, detail, icon: Icon, color }) => (
    <Card style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <div style={{ backgroundColor: color, color: 'white', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} />
      </div>
      <div>
        <div className="text-light text-sm">{title}</div>
        <div className="heading-2" style={{ margin: 0, fontSize: '1.4rem' }}>{value}</div>
        {detail && <div className="text-light text-sm" style={{ marginTop: '2px' }}>{detail}</div>}
      </div>
    </Card>
  );

  if (loading) return <div style={{ padding: 'var(--space-4)' }}>Loading dashboard...</div>;

  return (
    <div>
      <h1 className="heading-1">Dashboard</h1>
      
      {/* Financial Section */}
      <h2 className="heading-2" style={{ marginTop: 'var(--space-4)', fontSize: '1.1rem', color: 'var(--color-primary)' }}>Financial Summary (Current Month)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <StatCard 
          title="Collected Income" 
          value={`$${stats.collectedMonthAmount.toFixed(2)}`} 
          detail="Collected this month"
          icon={TrendingUp} 
          color="var(--color-success)" 
        />
        <StatCard 
          title="Owed this Month" 
          value={`$${stats.pendingMonthAmount.toFixed(2)}`} 
          detail={`${stats.pendingMonthCount} pending invoices`}
          icon={DollarSign} 
          color="var(--color-warning)" 
        />
        <StatCard 
          title="Accumulated Historical Debt" 
          value={`$${stats.pendingHistAmount.toFixed(2)}`} 
          detail={`${stats.pendingHistCount} previous pending invoices`}
          icon={AlertCircle} 
          color="var(--color-danger)" 
        />
      </div>

      {/* Academic Section */}
      <h2 className="heading-2" style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>Academic Summary</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents} 
          detail="Active students"
          icon={Users} 
          color="var(--color-primary)" 
        />
        <StatCard 
          title="Study Groups" 
          value={stats.totalGroups} 
          detail="Registered groups"
          icon={BookOpen} 
          color="var(--color-success)" 
        />
        <StatCard 
          title="Classes Given (This Week)" 
          value={stats.classesThisWeek} 
          detail="Current week"
          icon={Clock} 
          color="var(--color-warning)" 
        />
        <StatCard 
          title="Classes Given (This Month)" 
          value={stats.classesThisMonth} 
          detail="Current month"
          icon={Clock} 
          color="var(--color-text)" 
        />
      </div>
    </div>
  );
}
