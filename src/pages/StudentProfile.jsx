import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { ArrowLeft, User, BarChart, CreditCard } from 'lucide-react';

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState({ totalAttended: 0, attendedThisMonth: 0 });
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProfile(); }, [id]);

  const fetchProfile = async () => {
    // Student data
    const { data: stuData } = await supabase.from('students').select('*').eq('id', id).single();
    setStudent(stuData);

    // Groups
    const { data: stGroups } = await supabase.from('group_students').select('group_id').eq('student_id', id);
    if (stGroups && stGroups.length > 0) {
      const gIds = stGroups.map(g => g.group_id);
      const { data: gData } = await supabase.from('groups').select('*').in('id', gIds);
      setGroups(gData || []);
    }

    // Attendance stats
    const { data: totalAtt } = await supabase.from('attendance').select('class_id').eq('student_id', id).eq('present', true);
    
    // Payments
    const { data: payData } = await supabase.from('payments').select('*').eq('student_id', id).order('year', { ascending: false }).order('month', { ascending: false });
    setPayments(payData || []);
    
    setStats({ totalAttended: totalAtt?.length || 0, attendedThisMonth: 0 }); // Note: simplified for display
    setLoading(false);
  };

  if (loading) return <div>Loading profile...</div>;
  if (!student) return <div>Student not found.</div>;

  return (
    <div>
      <Link to="/students" className="flex items-center gap-2 mb-4 text-primary" style={{ color: 'var(--color-primary)' }}>
        <ArrowLeft size={20} /> Back to list
      </Link>
      
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: '50%' }}>
              <User size={32} />
            </div>
            <div>
              <h1 className="heading-1" style={{ margin: 0 }}>{student.name}</h1>
              <div className="text-light">{student.level}</div>
            </div>
          </div>
          <div style={{ whiteSpace: 'pre-line' }} className="text-sm">
            <strong>Notes:</strong><br />
            {student.notes || 'No notes added.'}
          </div>
          <div className="mt-4 text-sm">
            <strong>Groups:</strong> {groups.length > 0 ? groups.map(g => g.name).join(', ') : 'Not assigned'}
          </div>
        </Card>

        <Card>
          <h2 className="heading-2 flex items-center gap-2"><BarChart size={20}/> Attendance Stats</h2>
          <div className="flex justify-between items-center" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
            <span>Total Classes Attended</span>
            <strong>{stats.totalAttended}</strong>
          </div>
          {/* <div className="flex justify-between items-center" style={{ padding: 'var(--space-2) 0' }}>
            <span>Classes Attended This Month</span>
            <strong>{stats.attendedThisMonth}</strong>
          </div> */}
        </Card>

        <Card>
          <h2 className="heading-2 flex items-center gap-2"><CreditCard size={20}/> Payment History</h2>
          {payments.length === 0 ? <p className="text-light text-sm">No payments recorded.</p> : (
             <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                {payments.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-2" style={{ backgroundColor: p.paid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
                    <span>Month {p.month}/{p.year}</span>
                    <span style={{ fontWeight: 'bold', color: p.paid ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      ${p.amount} - {p.paid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                ))}
             </div>
          )}
        </Card>
      </div>
    </div>
  );
}
