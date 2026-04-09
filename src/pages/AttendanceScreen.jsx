import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { CheckSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function AttendanceScreen() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRecentClasses(); }, []);

  const fetchRecentClasses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch classes from the last 7 days roughly, descending
    const { data: cData } = await supabase.from('classes')
      .select('*, groups(name)')
      .eq('teacher_id', user.id)
      .order('date', { ascending: false })
      .limit(10);
      
    setClasses(cData || []);
    if (cData && cData.length > 0) {
      handleSelectClass(cData[0].id);
    } else {
      setLoading(false);
    }
  };

  const handleSelectClass = async (classId) => {
    setLoading(true);
    setSelectedClass(classes.find(c => c.id === classId));
    
    const { data } = await supabase.from('attendance')
      .select('*, students(name)')
      .eq('class_id', classId)
      .order('students(name)');
      
    setAttendance(data || []);
    setLoading(false);
  };

  const toggleAttendance = async (studentId, currentPresent) => {
    const newPresent = !currentPresent;
    
    // Optimistic UI update
    setAttendance(prev => prev.map(a => a.student_id === studentId ? { ...a, present: newPresent } : a));
    
    // Backend update
    await supabase.from('attendance')
      .update({ present: newPresent })
      .match({ class_id: selectedClass.id, student_id: studentId });
  };

  return (
    <div>
      <h1 className="heading-1 flex items-center gap-2"><CheckSquare /> Mark Attendance</h1>
      
      <div className="form-group">
        <select 
          className="form-select" 
          onChange={(e) => handleSelectClass(e.target.value)} 
          value={selectedClass?.id || ''}
          style={{ padding: '0.75rem', fontSize: '1rem', backgroundColor: 'var(--color-bg)' }}
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.groups?.name} - {c.topic} ({c.date})</option>
          ))}
        </select>
      </div>

      {loading ? <div>Loading attendance...</div> : (
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          {attendance.length === 0 && <p>No students in this class.</p>}
          {attendance.map(a => (
            <div 
              key={a.student_id} 
              onClick={() => toggleAttendance(a.student_id, a.present)}
              style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '1rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: a.present ? 'var(--color-surface)' : 'rgba(239, 68, 68, 0.05)',
                border: a.present ? '1px solid var(--color-success)' : '1px solid rgba(239, 68, 68, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <span style={{ fontSize: '1.1rem', fontWeight: 500, color: a.present ? 'var(--color-text)' : 'var(--color-danger)' }}>
                {a.students?.name}
              </span>
              <div style={{ 
                padding: '0.25rem 0.75rem', 
                borderRadius: 'var(--radius-full)', 
                backgroundColor: a.present ? 'var(--color-success)' : 'var(--color-danger)', 
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.875rem'
              }}>
                {a.present ? 'PRESENT' : 'ABSENT'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
