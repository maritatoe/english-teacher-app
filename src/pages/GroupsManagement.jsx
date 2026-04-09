import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export default function GroupsManagement() {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [groupStudents, setGroupStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const [newGroup, setNewGroup] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch Groups, Students, and mappings
    const [groupsRes, studentsRes, mapRes] = await Promise.all([
      supabase.from('groups').select('*').eq('teacher_id', user.id).order('name'),
      supabase.from('students').select('*').eq('teacher_id', user.id).order('name'),
      supabase.from('group_students').select('*')
    ]);

    setGroups(groupsRes.data || []);
    setStudents(studentsRes.data || []);
    
    const mapping = {};
    (mapRes.data || []).forEach(row => {
      if (!mapping[row.group_id]) mapping[row.group_id] = [];
      mapping[row.group_id].push(row.student_id);
    });
    setGroupStudents(mapping);
    setLoading(false);
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('groups').insert([{ name: newGroup.name, level: newGroup.level, teacher_id: user.id }]);
    setNewGroup(null);
    fetchData();
  };

  const deleteGroup = async (id) => {
    if (!confirm('Delete this group?')) return;
    await supabase.from('groups').delete().eq('id', id);
    fetchData();
  };

  const toggleStudentInGroup = async (groupId, studentId, inGroup) => {
    if (inGroup) {
      await supabase.from('group_students').delete().match({ group_id: groupId, student_id: studentId });
    } else {
      await supabase.from('group_students').insert([{ group_id: groupId, student_id: studentId }]);
    }
    fetchData();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="heading-1" style={{ marginBottom: 0 }}>Groups</h1>
        <Button onClick={() => setNewGroup(newGroup ? null : { name: '', level: 'Intermediate' })}>
          {newGroup ? 'Cancel' : '+ Add Group'}
        </Button>
      </div>

      {newGroup && (
        <Card className="mb-4">
          <form onSubmit={handleAddGroup} className="flex gap-2 items-center flex-wrap">
            <Input label="Group Name" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} required style={{ flex: 1, minWidth: '200px' }} />
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Level</label>
              <select className="form-select" value={newGroup.level} onChange={e => setNewGroup({...newGroup, level: e.target.value})}>
                <option>Beginner</option>
                <option>Elementary</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <Button type="submit" style={{ marginTop: '1.25rem' }}>Save</Button>
          </form>
        </Card>
      )}

      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        {groups.map(g => (
          <Card key={g.id}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="heading-2" style={{ margin: 0 }}>{g.name}</h2>
                <div className="text-light text-sm">{g.level}</div>
              </div>
              <Button variant="danger" onClick={() => deleteGroup(g.id)}>Delete</Button>
            </div>
            
            <details>
              <summary style={{ cursor: 'pointer', padding: 'var(--space-2) 0', fontWeight: 500, color: 'var(--color-primary)' }}>Manage Students</summary>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: 'var(--space-2)' }}>
                {students.map(s => {
                  const inGroup = groupStudents[g.id]?.includes(s.id);
                  return (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        checked={inGroup || false} 
                        onChange={() => toggleStudentInGroup(g.id, s.id, inGroup)} 
                      />
                      <span className="text-sm">{s.name}</span>
                    </label>
                  );
                })}
              </div>
            </details>
          </Card>
        ))}
      </div>
    </div>
  );
}
