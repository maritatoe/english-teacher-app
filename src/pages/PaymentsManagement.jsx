import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { CreditCard, Filter } from 'lucide-react';

export default function PaymentsManagement() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [showAdd, setShowAdd] = useState(false);
  const [newRow, setNewRow] = useState({ studentId: '', amount: '50.00' });

  useEffect(() => { fetchData(); }, [filterMonth, filterYear]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const [pRes, sRes] = await Promise.all([
      supabase.from('payments').select('*, students(name)').eq('teacher_id', user.id).eq('month', filterMonth).eq('year', filterYear).order('paid'),
      supabase.from('students').select('*').eq('teacher_id', user.id).order('name')
    ]);

    setPayments(pRes.data || []);
    setStudents(sRes.data || []);
    if (sRes.data?.length > 0 && !newRow.studentId) {
      setNewRow(prev => ({ ...prev, studentId: sRes.data[0].id }));
    }
    setLoading(false);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('payments').insert([{
      teacher_id: user.id,
      student_id: newRow.studentId,
      month: filterMonth,
      year: filterYear,
      amount: parseFloat(newRow.amount),
      paid: false
    }]);
    setShowAdd(false);
    fetchData();
  };

  const togglePaid = async (id, currentStatus) => {
    await supabase.from('payments').update({ 
      paid: !currentStatus, 
      date_paid: !currentStatus ? new Date().toISOString() : null 
    }).eq('id', id);
    fetchData();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="heading-1 flex items-center gap-2" style={{ marginBottom: 0 }}><CreditCard /> Payments</h1>
        <Button onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'Cancel' : '+ Generate Invoice'}</Button>
      </div>

      <Card className="mb-4 flex gap-4 items-center">
        <div style={{ fontWeight: 600 }} className="flex items-center gap-2"><Filter size={18}/> Filter:</div>
        <select className="form-select" value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>Month {m}</option>
          ))}
        </select>
        <select className="form-select" value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))}>
          <option value={2026}>2026</option>
          <option value={2027}>2027</option>
        </select>
      </Card>

      {showAdd && (
        <Card className="mb-4">
          <h2 className="heading-2">Create Record</h2>
          <form onSubmit={handleAddPayment} className="flex gap-2 items-end flex-wrap">
            <div className="form-group" style={{ marginBottom: 0, flex: 2, minWidth: '150px' }}>
              <label className="form-label">Student</label>
              <select className="form-select" value={newRow.studentId} onChange={e => setNewRow({...newRow, studentId: e.target.value})} required>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <Input label="Amount ($)" type="number" step="0.01" value={newRow.amount} onChange={e=>setNewRow({...newRow, amount: e.target.value})} required style={{ flex: 1, minWidth: '100px' }} />
            <Button type="submit">Create</Button>
          </form>
        </Card>
      )}

      {loading ? (<div>Loading payments...</div>) : (
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          {payments.length === 0 && <p className="text-light">No payments recorded for this month.</p>}
          {payments.map(p => (
            <div key={p.id} className="flex justify-between items-center" style={{ 
              padding: '1rem', 
              backgroundColor: 'var(--color-surface)',
              border: `1px solid ${p.paid ? 'var(--color-success)' : 'var(--color-danger)'}`,
              borderRadius: 'var(--radius-lg)'
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{p.students?.name}</div>
                <div className="text-light text-sm">${p.amount} • {filterMonth}/{filterYear}</div>
              </div>
              <Button 
                variant={p.paid ? 'outline' : 'primary'}
                style={{ backgroundColor: p.paid ? 'transparent' : 'var(--color-danger)', borderColor: p.paid ? 'var(--color-success)' : 'var(--color-danger)', color: p.paid ? 'var(--color-success)' : 'white' }}
                onClick={() => togglePaid(p.id, p.paid)}
              >
                {p.paid ? 'Paid' : 'Mark as Paid'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
