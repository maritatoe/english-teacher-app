import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { format } from 'date-fns';

export default function ClassesManagement() {
  const [classes, setClasses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  
  const [newClass, setNewClass] = useState({ 
    groupId: '', 
    date: format(new Date(), 'yyyy-MM-dd'), 
    topic: '', 
    notes: '' 
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const [cRes, gRes] = await Promise.all([
      supabase.from('classes').select('*, groups(name)').eq('teacher_id', user.id).order('date', { ascending: false }).limit(50),
      supabase.from('groups').select('*').eq('teacher_id', user.id).order('name')
    ]);
    
    setClasses(cRes.data || []);
    setGroups(gRes.data || []);
    if (gRes.data?.length > 0) setNewClass(prev => ({ ...prev, groupId: gRes.data[0].id }));
    setLoading(false);
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

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="heading-1" style={{ marginBottom: 0 }}>Class Registry</h1>
        <Button onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'Cancel' : '+ New Class'}</Button>
      </div>

      {showAdd && (
        <Card className="mb-4">
          <form onSubmit={handleAddClass}>
            <div className="form-group">
              <label className="form-label">Group</label>
              <select className="form-select" value={newClass.groupId} onChange={e => setNewClass({...newClass, groupId: e.target.value})} required>
                <option value="" disabled>Select a group</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <Input label="Date" type="date" required value={newClass.date} onChange={e => setNewClass({...newClass, date: e.target.value})} />
            <Input label="Topic" required value={newClass.topic} onChange={e => setNewClass({...newClass, topic: e.target.value})} />
            <Input label="Notes" value={newClass.notes} onChange={e => setNewClass({...newClass, notes: e.target.value})} />
            <Button type="submit">Save Class</Button>
          </form>
        </Card>
      )}

      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        {classes.map(c => (
          <Card key={c.id}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="heading-2" style={{ margin: 0, fontSize: '1.1rem' }}>{c.topic}</h3>
                <div className="text-light text-sm">{c.groups?.name} • {c.date}</div>
              </div>
              <Button onClick={() => {}} variant="outline" style={{ padding: '4px 8px', fontSize: '12px' }}>Details</Button>
            </div>
            <p className="text-sm mt-2">{c.notes}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
