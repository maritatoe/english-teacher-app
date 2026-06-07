import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { CreditCard, Filter, Calendar, Check, X, AlertTriangle, Info } from 'lucide-react';
import { format } from 'date-fns';

export default function PaymentsManagement() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  // Metrics
  const [monthlyDebt, setMonthlyDebt] = useState(0);
  const [historicalDebt, setHistoricalDebt] = useState(0);
  const [monthlyCollected, setMonthlyCollected] = useState(0);

  // Forms & Modal
  const [showAdd, setShowAdd] = useState(false);
  const [newRow, setNewRow] = useState({ studentId: '', amount: '50.00' });
  const [payingRecord, setPayingRecord] = useState(null); // Record currently editing in modal
  const [modalPaidState, setModalPaidState] = useState(false);
  const [modalDatePaid, setModalDatePaid] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [modalMethod, setModalMethod] = useState('Efectivo');

  useEffect(() => { 
    fetchData(); 
  }, [filterMonth, filterYear, selectedStudentId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Fetch Students
    const { data: sData } = await supabase
      .from('students')
      .select('*')
      .eq('teacher_id', user.id)
      .order('name');
    setStudents(sData || []);
    
    if (sData?.length > 0 && !newRow.studentId) {
      setNewRow(prev => ({ ...prev, studentId: sData[0].id }));
    }

    // 2. Fetch Payments based on filter
    let pQuery = supabase
      .from('payments')
      .select('*, students(name)')
      .eq('teacher_id', user.id);

    if (selectedStudentId) {
      // If student is selected, show all their payment history
      pQuery = pQuery.eq('student_id', selectedStudentId).order('year', { ascending: false }).order('month', { ascending: false });
    } else {
      // Otherwise filter by selected month/year
      pQuery = pQuery.eq('month', filterMonth).eq('year', filterYear).order('paid');
    }

    const { data: pData } = await pQuery;
    setPayments(pData || []);

    // 3. Fetch all payments to compute debt metrics
    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount, paid, month, year')
      .eq('teacher_id', user.id);

    if (allPayments) {
      let mDebt = 0;
      let hDebt = 0;
      let mColl = 0;

      allPayments.forEach(p => {
        // Current filtered month metrics
        if (p.month === filterMonth && p.year === filterYear) {
          if (p.paid) {
            mColl += Number(p.amount);
          } else {
            mDebt += Number(p.amount);
          }
        }
        
        // Historical debt metrics (unpaid payments before filtered month/year)
        if (!p.paid) {
          const isBefore = p.year < filterYear || (p.year === filterYear && p.month < filterMonth);
          if (isBefore) {
            hDebt += Number(p.amount);
          }
        }
      });

      setMonthlyDebt(mDebt);
      setHistoricalDebt(hDebt);
      setMonthlyCollected(mColl);
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

  const handleOpenPaymentModal = (record) => {
    setPayingRecord(record);
    setModalPaidState(record.paid);
    setModalDatePaid(record.date_paid ? format(new Date(record.date_paid), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    setModalMethod(record.payment_method || 'Efectivo');
  };

  const handleSavePaymentDetails = async (e) => {
    e.preventDefault();
    
    const updateData = {
      paid: modalPaidState,
      date_paid: modalPaidState ? new Date(modalDatePaid + 'T12:00:00').toISOString() : null,
      payment_method: modalPaidState ? modalMethod : null
    };

    const { error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', payingRecord.id);

    if (error) {
      alert('Error al guardar el pago');
      return;
    }

    setPayingRecord(null);
    fetchData();
  };

  const formatPaymentDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="heading-1 flex items-center gap-2" style={{ marginBottom: 0 }}><CreditCard /> Cobros y Pagos</h1>
        <Button onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'Cancelar' : '+ Generar Cuota'}</Button>
      </div>

      {/* Resumen Financiero y Deudas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <div className="text-light text-sm">Recaudado (Mes {filterMonth}/{filterYear})</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-success)' }}>${monthlyCollected.toFixed(2)}</div>
        </div>
        <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <div className="text-light text-sm">Adeudado (Mes {filterMonth}/{filterYear})</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-danger)' }}>${monthlyDebt.toFixed(2)}</div>
        </div>
        <div style={{ padding: 'var(--space-3)', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-lg)' }}>
          <div className="text-light text-sm" style={{ color: 'var(--color-danger)' }}>Deuda Histórica (Meses anteriores)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-danger)' }}>${historicalDebt.toFixed(2)}</div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <Card className="mb-4">
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Filter size={18}/> Filtros:
          </div>

          {/* Filtro por Alumno */}
          <div className="form-group" style={{ marginBottom: 0, minWidth: '200px', flex: 1 }}>
            <select 
              className="form-select" 
              value={selectedStudentId} 
              onChange={(e) => setSelectedStudentId(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
            >
              <option value="">Todos los alumnos (Ver mes filtrado)</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Si NO se filtra por alumno, habilitamos filtros de fecha */}
          {!selectedStudentId && (
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <select className="form-select" value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))} style={{ padding: '0.5rem', fontSize: '0.875rem' }}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Mes {m}</option>
                ))}
              </select>
              <select className="form-select" value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))} style={{ padding: '0.5rem', fontSize: '0.875rem' }}>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Creación de Cuota Manual */}
      {showAdd && (
        <Card className="mb-4">
          <h2 className="heading-2">Crear Registro de Cobro</h2>
          <form onSubmit={handleAddPayment} className="flex gap-2 items-end flex-wrap">
            <div className="form-group" style={{ marginBottom: 0, flex: 2, minWidth: '150px' }}>
              <label className="form-label">Estudiante</label>
              <select className="form-select" value={newRow.studentId} onChange={e => setNewRow({...newRow, studentId: e.target.value})} required>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <Input label="Monto ($)" type="number" step="0.01" value={newRow.amount} onChange={e=>setNewRow({...newRow, amount: e.target.value})} required style={{ flex: 1, minWidth: '100px' }} />
            <Button type="submit">Generar</Button>
          </form>
        </Card>
      )}

      {/* Listado de Cobros */}
      {loading ? (<div>Cargando registros...</div>) : (
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          {payments.length === 0 && (
            <p className="text-light">
              {selectedStudentId ? 'No se registran cobros para este alumno.' : 'No hay cuotas registradas para este mes.'}
            </p>
          )}
          {payments.map(p => (
            <div key={p.id} className="flex justify-between items-center flex-wrap gap-2" style={{ 
              padding: '1rem', 
              backgroundColor: 'var(--color-surface)',
              border: `1px solid ${p.paid ? 'var(--color-success)' : 'var(--color-danger)'}`,
              borderRadius: 'var(--radius-lg)'
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{p.students?.name}</div>
                <div className="text-light text-sm">
                  ${p.amount} • Mes {p.month}/{p.year}
                </div>
                {p.paid && (
                  <div style={{ marginTop: '4px' }}>
                    <span className="badge badge-success">
                      Pagado el {formatPaymentDate(p.date_paid)} vía {p.payment_method || 'Efectivo'}
                    </span>
                  </div>
                )}
              </div>
              <Button 
                variant={p.paid ? 'outline' : 'primary'}
                style={{ 
                  backgroundColor: p.paid ? 'transparent' : 'var(--color-danger)', 
                  borderColor: p.paid ? 'var(--color-success)' : 'var(--color-danger)', 
                  color: p.paid ? 'var(--color-success)' : 'white' 
                }}
                onClick={() => handleOpenPaymentModal(p)}
              >
                {p.paid ? 'Detalles / Editar' : 'Registrar Pago'}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Modal para Registrar/Editar Pago */}
      {payingRecord && (
        <div className="modal-backdrop" onClick={() => setPayingRecord(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="heading-2" style={{ marginBottom: 0 }}>Registrar / Editar Pago</h2>
              <button onClick={() => setPayingRecord(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSavePaymentDetails}>
              <div className="modal-body">
                <div style={{ marginBottom: 'var(--space-4)', backgroundColor: 'var(--color-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                  <div><strong>Alumno:</strong> {payingRecord.students?.name}</div>
                  <div><strong>Período:</strong> Mes {payingRecord.month}/{payingRecord.year}</div>
                  <div><strong>Monto a pagar:</strong> ${payingRecord.amount}</div>
                </div>

                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    id="paid-checkbox" 
                    checked={modalPaidState} 
                    onChange={e => setModalPaidState(e.target.checked)} 
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="paid-checkbox" style={{ fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>
                    Marcar como cobrado (PAGADO)
                  </label>
                </div>

                {modalPaidState && (
                  <div style={{ marginTop: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}>
                    <Input 
                      label="Fecha de cobro" 
                      type="date" 
                      value={modalDatePaid} 
                      onChange={e => setModalDatePaid(e.target.value)} 
                      required 
                    />
                    
                    <div className="form-group">
                      <label className="form-label">Medio de Pago</label>
                      <select 
                        className="form-select" 
                        value={modalMethod} 
                        onChange={e => setModalMethod(e.target.value)}
                        required
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Mercado Pago">Mercado Pago</option>
                        <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <Button variant="outline" type="button" onClick={() => setPayingRecord(null)}>Cancelar</Button>
                <Button type="submit">Guardar Cambios</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
