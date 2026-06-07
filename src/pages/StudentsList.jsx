import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Search, X } from 'lucide-react';

export default function StudentsList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', level: 'Beginner', notes: '' });
  const [editingStudent, setEditingStudent] = useState(null);

  useEffect(() => { 
    fetchStudents(); 
  }, []);

  const fetchStudents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('students').select('*').eq('teacher_id', user.id).order('name');
    setStudents(data || []);
    setLoading(false);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('students').insert([{ ...newStudent, teacher_id: user.id }]);
    setShowAdd(false);
    setNewStudent({ name: '', level: 'Beginner', notes: '' });
    fetchStudents();
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('students')
      .update({
        name: editingStudent.name,
        level: editingStudent.level,
        notes: editingStudent.notes
      })
      .eq('id', editingStudent.id);

    if (error) {
      alert('Error updating student information');
      return;
    }

    setEditingStudent(null);
    fetchStudents();
  };

  const deleteStudent = async (id) => {
    if (!confirm('Are you sure you want to delete this student? They will be permanently deleted along with all attendance and payment records.')) return;
    await supabase.from('students').delete().eq('id', id);
    fetchStudents();
  };

  if (loading) return <div style={{ padding: 'var(--space-4)' }}>Loading students...</div>;

  return (
    <div>
      <div className="flex justify-end items-center mb-4">
        <Button onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'Cancel' : '+ Add Student'}</Button>
      </div>

      {/* Add Student Form */}
      {showAdd && (
        <Card className="mb-4">
          <h2 className="heading-2">New Student</h2>
          <form onSubmit={handleAddStudent}>
            <Input label="Full Name" required placeholder="e.g. John Doe" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
            <div className="form-group">
              <label className="form-label">English Level</label>
              <select className="form-select" value={newStudent.level} onChange={e => setNewStudent({...newStudent, level: e.target.value})}>
                <option value="Beginner">Beginner</option>
                <option value="Elementary">Elementary</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <Input label="Notes" placeholder="e.g. Parent contact, preferences..." value={newStudent.notes} onChange={e => setNewStudent({...newStudent, notes: e.target.value})} />
            <Button type="submit">Save Student</Button>
          </form>
        </Card>
      )}

      {/* Students List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {students.map(s => (
          <Card key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <Link to={`/students/${s.id}`} style={{ flex: 1, minWidth: '150px' }}>
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div className="text-light text-sm">{s.level}</div>
            </Link>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="outline" style={{ padding: '6px 12px', fontSize: '0.875rem' }} onClick={() => setEditingStudent(s)}>
                Edit
              </Button>
              <Button variant="danger" style={{ padding: '6px 12px', fontSize: '0.875rem' }} onClick={() => deleteStudent(s.id)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
        {students.length === 0 && !showAdd && <p className="text-light">No students registered yet.</p>}
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="modal-backdrop" onClick={() => setEditingStudent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="heading-2" style={{ marginBottom: 0 }}>Edit Student Details</h2>
              <button 
                onClick={() => setEditingStudent(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)' }}
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateStudent}>
              <div className="modal-body">
                <Input 
                  label="Full Name" 
                  value={editingStudent.name} 
                  onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} 
                  required 
                />
                
                <div className="form-group">
                  <label className="form-label">English Level</label>
                  <select 
                    className="form-select" 
                    value={editingStudent.level} 
                    onChange={e => setEditingStudent({...editingStudent, level: e.target.value})}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Elementary">Elementary</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                
                <Input 
                  label="Notes" 
                  value={editingStudent.notes || ''} 
                  onChange={e => setEditingStudent({...editingStudent, notes: e.target.value})} 
                />
              </div>

              <div className="modal-footer">
                <Button variant="outline" type="button" onClick={() => setEditingStudent(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
