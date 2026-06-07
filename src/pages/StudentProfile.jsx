import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { ArrowLeft, User, BarChart, CreditCard, CalendarDays, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState({ totalAttended: 0, totalClasses: 0, attendanceRate: 0 });
  const [payments, setPayments] = useState([]);
  const [classHistory, setClassHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchProfile(); 
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    // Student data
    const { data: stuData } = await supabase.from('students').select('*').eq('id', id).single();
    if (!stuData) {
      setLoading(false);
      return;
    }
    setStudent(stuData);

    // Groups
    const { data: stGroups } = await supabase.from('group_students').select('group_id').eq('student_id', id);
    if (stGroups && stGroups.length > 0) {
      const gIds = stGroups.map(g => g.group_id);
      const { data: gData } = await supabase.from('groups').select('*').in('id', gIds);
      setGroups(gData || []);
    }

    // Attendance and class history
    const { data: attData } = await supabase
      .from('attendance')
      .select('present, class_id, classes(*, groups(name))')
      .eq('student_id', id);

    const formattedHistory = (attData || [])
      .filter(item => item.classes)
      .map(item => ({
        present: item.present,
        classId: item.class_id,
        date: item.classes.date,
        topic: item.classes.topic,
        groupName: item.classes.groups?.name || 'Group'
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    setClassHistory(formattedHistory);

    const attended = formattedHistory.filter(h => h.present).length;
    const total = formattedHistory.length;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
    
    setStats({ 
      totalAttended: attended, 
      totalClasses: total,
      attendanceRate: rate
    });

    // Payments
    const { data: payData } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', id)
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    setPayments(payData || []);
    
    setLoading(false);
  };

  const formatPaymentDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) return <div style={{ padding: 'var(--space-4)' }}>Loading student profile...</div>;
  if (!student) return <div style={{ padding: 'var(--space-4)' }}>Student not found.</div>;

  return (
    <div>
      <Link to="/students" className="flex items-center gap-2 mb-4 text-primary" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
        <ArrowLeft size={20} /> Back to list
      </Link>
      
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        {/* General Info Card */}
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: '50%' }}>
              <User size={32} />
            </div>
            <div>
              <h1 className="heading-1" style={{ margin: 0 }}>{student.name}</h1>
              <div className="badge badge-info">{student.level}</div>
            </div>
          </div>
          <div style={{ whiteSpace: 'pre-line' }} className="text-sm">
            <strong>Notes:</strong><br />
            {student.notes || 'No notes added.'}
          </div>
          <div className="mt-4 text-sm" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
            <strong>Groups:</strong> {groups.length > 0 ? groups.map(g => g.name).join(', ') : 'Not assigned'}
          </div>
        </Card>

        {/* Attendance Stats Card */}
        <Card>
          <h2 className="heading-2 flex items-center gap-2"><BarChart size={20}/> Attendance Stats</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
            <div style={{ textAlign: 'center', padding: 'var(--space-3)', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
              <div className="text-light text-sm">Classes Attended</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>{stats.totalAttended} / {stats.totalClasses}</div>
            </div>
            <div style={{ textAlign: 'center', padding: 'var(--space-3)', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
              <div className="text-light text-sm">Attendance Rate</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{stats.attendanceRate}%</div>
            </div>
          </div>
        </Card>

        {/* Payment History Card */}
        <Card>
          <h2 className="heading-2 flex items-center gap-2"><CreditCard size={20}/> Payment History</h2>
          {payments.length === 0 ? (
            <p className="text-light text-sm">No payments recorded for this student.</p>
          ) : (
             <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                {payments.map(p => (
                   <div 
                     key={p.id} 
                     className="flex justify-between items-center p-3" 
                     style={{ 
                       backgroundColor: 'var(--color-bg)', 
                       borderLeft: `4px solid ${p.paid ? 'var(--color-success)' : 'var(--color-danger)'}`,
                       borderRadius: 'var(--radius-md)' 
                     }}
                   >
                     <div>
                       <div style={{ fontWeight: 600 }}>Month {p.month}/{p.year}</div>
                       <div className="text-sm text-light">
                         {p.paid ? (
                           <span>Paid on {formatPaymentDate(p.date_paid)} via <strong>{p.payment_method || 'Cash'}</strong></span>
                         ) : (
                           <span style={{ color: 'var(--color-danger)' }}>Pending</span>
                         )}
                       </div>
                     </div>
                     <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: p.paid ? 'var(--color-success)' : 'var(--color-danger)' }}>
                       ${p.amount}
                     </span>
                   </div>
                ))}
             </div>
          )}
        </Card>

        {/* Class History Card */}
        <Card>
          <h2 className="heading-2 flex items-center gap-2"><CalendarDays size={20}/> Class & Attendance History</h2>
          {classHistory.length === 0 ? (
            <p className="text-light text-sm">No classes recorded for this student.</p>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-2)', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
              {classHistory.map(h => (
                <div 
                  key={h.classId}
                  className="flex justify-between items-center p-3"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{h.topic}</div>
                    <div className="text-light text-sm">
                      {h.groupName} • {h.date}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {h.present ? (
                      <span className="badge badge-success" style={{ gap: '4px' }}><CheckCircle size={14} /> PRESENT</span>
                    ) : (
                      <span className="badge badge-danger" style={{ gap: '4px' }}><XCircle size={14} /> ABSENT</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
