import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar, User, Clock, Trash2, X, Check, Filter, AlertCircle } from 'lucide-react';

export default function ClassesManagement() {
  const [classes, setClasses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  
  // Filters
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentAttendance, setStudentAttendance] = useState([]); // Array of { class_id, present }
  const [weeklyOnly, setWeeklyOnly] = useState(false);

  // New Class Form
  const [newClass, setNewClass] = useState({ 
    groupId: '', 
    date: format(new Date(), 'yyyy-MM-dd'), 
    topic: '', 
    notes: '' 
  });

  // Edit / Details Modal State
  const [editingClass, setEditingClass] = useState(null);
  const [modalAttendance, setModalAttendance] = useState([]);
  const [loadingModalAttendance, setLoadingModalAttendance] = useState(false);

  useEffect(() => { 
    fetchData(); 
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentAttendance();
    } else {
      setStudentAttendance([]);
    }
  }, [selectedStudentId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const [cRes, gRes, sRes] = await Promise.all([
      supabase.from('classes').select('*, groups(name)').eq('teacher_id', user.id).order('date', { ascending: false }).limit(100),
      supabase.from('groups').select('*').eq('teacher_id', user.id).order('name'),
      supabase.from('students').select('*').eq('teacher_id', user.id).order('name')
    ]);
    
    setClasses(cRes.data || []);
    setGroups(gRes.data || []);
    setStudents(sRes.data || []);
    
    if (gRes.data?.length > 0) {
      setNewClass(prev => ({ ...prev, groupId: gRes.data[0].id }));
    }
    setLoading(false);
  };

  const fetchStudentAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance')
      .select('class_id, present')
      .eq('student_id', selectedStudentId);
    if (!error) {
      setStudentAttendance(data || []);
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Insert class
    const { data: classData, error } = await supabase.from('classes').insert([{
      teacher_id: user.id,
      group_id: newClass.groupId,
      date: newClass.date,
      topic: newClass.topic,
      notes: newClass.notes
    }]).select();

    if (error) { alert('Error adding class'); return; }

    // Init attendance
    if (classData && classData.length > 0) {
      const cls = classData[0];
      const { data: stData } = await supabase.from('group_students').select('student_id').eq('group_id', cls.group_id);
      
      if (stData && stData.length > 0) {
        const attRecords = stData.map(st => ({
          class_id: cls.id,
          student_id: st.student_id,
          present: true // Default to true
        }));
        await supabase.from('attendance').insert(attRecords);
      }
    }

    setShowAdd(false);
    setNewClass({ groupId: groups[0]?.id || '', date: format(new Date(), 'yyyy-MM-dd'), topic: '', notes: '' });
    fetchData();
  };

  const handleOpenDetails = async (cls) => {
    setEditingClass({
      id: cls.id,
      group_id: cls.group_id,
      groupName: cls.groups?.name || 'Group',
      date: cls.date,
      topic: cls.topic,
      notes: cls.notes || ''
    });
    
    // Fetch attendance for this class
    setLoadingModalAttendance(true);
    const { data, error } = await supabase
      .from('attendance')
      .select('*, students(name)')
      .eq('class_id', cls.id)
      .order('students(name)');
    if (!error) {
      setModalAttendance(data || []);
    }
    setLoadingModalAttendance(false);
  };

  const toggleModalAttendance = async (studentId, currentPresent) => {
    const newPresent = !currentPresent;
    
    // Optimistic UI update
    setModalAttendance(prev => prev.map(a => a.student_id === studentId ? { ...a, present: newPresent } : a));
    
    // DB Update
    await supabase.from('attendance')
      .update({ present: newPresent })
      .match({ class_id: editingClass.id, student_id: studentId });
      
    // Refresh the attendance filter if filtering by this student
    if (selectedStudentId === studentId) {
      fetchStudentAttendance();
    }
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('classes')
      .update({
        topic: editingClass.topic,
        date: editingClass.date,
        notes: editingClass.notes
      })
      .eq('id', editingClass.id);

    if (error) {
      alert('Error saving class changes');
      return;
    }

    setEditingClass(null);
    fetchData();
    if (selectedStudentId) {
      fetchStudentAttendance();
    }
  };

  const handleDeleteClass = async (id) => {
    if (!confirm('Are you sure you want to delete this class? All attendance records will be permanently deleted.')) return;
    
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);
      
    if (error) {
      alert('Error deleting class');
      return;
    }
    
    setEditingClass(null);
    fetchData();
    if (selectedStudentId) {
      fetchStudentAttendance();
    }
  };

  // Client-side filtering of classes
  const filteredClasses = classes.filter(c => {
    // 1. Filter by week
    if (weeklyOnly) {
      const classDate = new Date(c.date + 'T00:00:00');
      const now = new Date();
      const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      const end = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
      if (classDate < start || classDate > end) return false;
    }

    // 2. Filter by student
    if (selectedStudentId) {
      return studentAttendance.some(att => att.class_id === c.id);
    }

    return true;
  });

  const getStudentStatusForClass = (classId) => {
    const att = studentAttendance.find(a => a.class_id === classId);
    return att ? (att.present ? 'Present' : 'Absent') : null;
  };

  if (loading && classes.length === 0) return <div>Loading class registry...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="heading-1" style={{ marginBottom: 0 }}>Class Registry</h1>
        <Button onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'Cancel' : '+ New Class'}</Button>
      </div>

      {/* Add Class Form */}
      {showAdd && (
        <Card className="mb-4">
          <h2 className="heading-2">Create Class</h2>
          <form onSubmit={handleAddClass}>
            <div className="form-group">
              <label className="form-label">Group</label>
              <select className="form-select" value={newClass.groupId} onChange={e => setNewClass({...newClass, groupId: e.target.value})} required>
                <option value="" disabled>Select a group</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <Input label="Date" type="date" required value={newClass.date} onChange={e => setNewClass({...newClass, date: e.target.value})} />
            <Input label="Topic / Content" required placeholder="e.g. Present Simple vs Present Continuous" value={newClass.topic} onChange={e => setNewClass({...newClass, topic: e.target.value})} />
            <Input label="Notes" placeholder="e.g. Workbook page 24, homework due..." value={newClass.notes} onChange={e => setNewClass({...newClass, notes: e.target.value})} />
            <Button type="submit">Save Class</Button>
          </form>
        </Card>
      )}

      {/* Filters Bar */}
      <Card className="mb-4">
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Filter size={18} /> Filters:
          </div>
          
          {/* Student Filter */}
          <div className="form-group" style={{ marginBottom: 0, minWidth: '200px', flex: 1 }}>
            <select 
              className="form-select" 
              value={selectedStudentId} 
              onChange={e => setSelectedStudentId(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
            >
              <option value="">All students</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.level})</option>
              ))}
            </select>
          </div>

          {/* Weekly Filter */}
          <button 
            type="button"
            onClick={() => setWeeklyOnly(!weeklyOnly)}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${weeklyOnly ? 'var(--color-primary)' : 'var(--color-border)'}`,
              backgroundColor: weeklyOnly ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-surface)',
              color: weeklyOnly ? 'var(--color-primary)' : 'var(--color-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Calendar size={16} />
            {weeklyOnly ? 'View: This Week' : 'View: All'}
          </button>
        </div>
      </Card>

      {/* Classes List */}
      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        {filteredClasses.map(c => (
          <Card key={c.id}>
            <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
              <div>
                <h3 className="heading-2" style={{ margin: 0, fontSize: '1.1rem' }}>{c.topic}</h3>
                <div className="text-light text-sm">
                  {c.groups?.name} • {c.date}
                </div>
                {/* Student Attendance indicator */}
                {selectedStudentId && (
                  <div style={{ marginTop: 'var(--space-1)' }}>
                    {getStudentStatusForClass(c.id) === 'Present' ? (
                      <span className="badge badge-success">Attended (Present)</span>
                    ) : getStudentStatusForClass(c.id) === 'Absent' ? (
                      <span className="badge badge-danger">Missed (Absent)</span>
                    ) : (
                      <span className="badge badge-warning">No record</span>
                    )}
                  </div>
                )}
              </div>
              <Button onClick={() => handleOpenDetails(c)} variant="outline" style={{ padding: '4px 12px', fontSize: '12px' }}>
                Details / Edit
              </Button>
            </div>
            {c.notes && (
              <p className="text-sm mt-2 text-light" style={{ borderLeft: '3px solid var(--color-border)', paddingLeft: 'var(--space-2)', fontStyle: 'italic' }}>
                {c.notes}
              </p>
            )}
          </Card>
        ))}
        {filteredClasses.length === 0 && (
          <p className="text-light text-center py-6">No classes found with the current filters.</p>
        )}
      </div>

      {/* Class Details and Attendance Modal */}
      {editingClass && (
        <div className="modal-backdrop" onClick={() => setEditingClass(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="heading-2" style={{ marginBottom: 0 }}>Class Details: {editingClass.groupName}</h2>
              <button 
                onClick={() => setEditingClass(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)' }}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* Edit Class Info */}
              <form onSubmit={handleUpdateClass} style={{ marginBottom: 'var(--space-6)' }}>
                <h3 className="heading-3" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--color-primary)' }}>
                  General Information
                </h3>
                <Input 
                  label="Topic / Content" 
                  value={editingClass.topic} 
                  onChange={e => setEditingClass({...editingClass, topic: e.target.value})} 
                  required 
                />
                <Input 
                  label="Date" 
                  type="date" 
                  value={editingClass.date} 
                  onChange={e => setEditingClass({...editingClass, date: e.target.value})} 
                  required 
                />
                <Input 
                  label="Notes" 
                  value={editingClass.notes} 
                  onChange={e => setEditingClass({...editingClass, notes: e.target.value})} 
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>

              <hr style={{ border: '0', borderTop: '1px solid var(--color-border)', margin: 'var(--space-4) 0' }} />

              {/* Attendance Registry */}
              <div>
                <h3 className="heading-3" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--color-primary)' }}>
                  Student Attendance
                </h3>
                {loadingModalAttendance ? (
                  <div className="text-light">Loading attendance...</div>
                ) : (
                  <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                    {modalAttendance.length === 0 && (
                      <p className="text-light text-sm">No students assigned to this group.</p>
                    )}
                    {modalAttendance.map(att => (
                      <div 
                        key={att.student_id}
                        onClick={() => toggleModalAttendance(att.student_id, att.present)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 'var(--space-2) var(--space-3)',
                          border: `1px solid ${att.present ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          backgroundColor: att.present ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{att.students?.name}</span>
                        <span className={`badge ${att.present ? 'badge-success' : 'badge-danger'}`}>
                          {att.present ? 'PRESENT' : 'ABSENT'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <Button 
                variant="danger" 
                onClick={() => handleDeleteClass(editingClass.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={16} /> Delete Class
              </Button>
              <Button variant="outline" onClick={() => setEditingClass(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
