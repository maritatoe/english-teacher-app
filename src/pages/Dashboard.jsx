import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Users, BookOpen, Clock, DollarSign } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGroups: 0,
    classesThisWeek: 0,
    classesThisMonth: 0,
    pendingPayments: 0
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
      const [{ count: studentsCount }, { count: groupsCount }] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('teacher_id', userId),
        supabase.from('groups').select('*', { count: 'exact', head: true }).eq('teacher_id', userId)
      ]);

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

      const monthNum = now.getMonth() + 1;
      const { count: pendingPayouts } = await supabase.from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', userId).eq('paid', false).eq('month', monthNum);

      setStats({
        totalStudents: studentsCount || 0,
        totalGroups: groupsCount || 0,
        classesThisWeek: classesWeek || 0,
        classesThisMonth: classesMonth || 0,
        pendingPayments: pendingPayouts || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <div style={{ backgroundColor: color, color: 'white', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)' }}>
        <Icon size={24} />
      </div>
      <div>
        <div className="text-light text-sm">{title}</div>
        <div className="heading-2">{value}</div>
      </div>
    </Card>
  );

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h1 className="heading-1">Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="var(--color-primary)" />
        <StatCard title="Total Groups" value={stats.totalGroups} icon={BookOpen} color="var(--color-success)" />
        <StatCard title="Classes This Week" value={stats.classesThisWeek} icon={Clock} color="var(--color-warning)" />
        <StatCard title="Classes This Month" value={stats.classesThisMonth} icon={Clock} color="var(--color-text)" />
        <StatCard title="Pending Payments (This Month)" value={stats.pendingPayments} icon={DollarSign} color="var(--color-danger)" />
      </div>
    </div>
  );
}
