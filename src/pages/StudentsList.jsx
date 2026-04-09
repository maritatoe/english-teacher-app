import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Search } from 'lucide-react';

export default function StudentsList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', level: 'Beginner', notes: '' });

  useEffect(() => { fetchStudents(); }, []);

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

  const deleteStudent = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    await supabase.from('students').delete().eq('id', id);
    fetchStudents();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="heading-1" style={{ marginBottom: 0 }}>Students</h1>
        <Button onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'Cancel' : '+ Add Student'}</Button>
      </div>

      {showAdd && (
        <Card className="mb-4">
          <h2 className="heading-2">New Student</h2>
          <form onSubmit={handleAddStudent}>
            <Input label="Name" required value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
            <div className="form-group">
              <label className="form-label">Level</label>
              <select className="form-select" value={newStudent.level} onChange={e => setNewStudent({...newStudent, level: e.target.value})}>
                <option>Beginner</option>
                <option>Elementary</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <Input label="Notes" value={newStudent.notes} onChange={e => setNewStudent({...newStudent, notes: e.target.value})} />
            <Button type="submit">Save Student</Button>
          </form>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {students.map(s => (
          <Card key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to={`/students/${s.id}`} style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div className="text-light text-sm">{s.level}</div>
            </Link>
            <Button variant="danger" onClick={() => deleteStudent(s.id)}>Delete</Button>
          </Card>
        ))}
        {students.length === 0 && !showAdd && <p className="text-light">No students yet.</p>}
      </div>
    </div>
  );
}
