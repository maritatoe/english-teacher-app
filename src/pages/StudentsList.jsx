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
      alert('Error al actualizar la información del alumno');
      return;
    }

    setEditingStudent(null);
    fetchStudents();
  };

  const deleteStudent = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este alumno? Se borrará de forma permanente junto con todos sus registros de asistencia y cobros.')) return;
    await supabase.from('students').delete().eq('id', id);
    fetchStudents();
  };

  if (loading) return <div style={{ padding: 'var(--space-4)' }}>Cargando alumnos...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="heading-1" style={{ marginBottom: 0 }}>Alumnos</h1>
        <Button onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'Cancelar' : '+ Nuevo Alumno'}</Button>
      </div>

      {/* Formulario de Carga */}
      {showAdd && (
        <Card className="mb-4">
          <h2 className="heading-2">Nuevo Alumno</h2>
          <form onSubmit={handleAddStudent}>
            <Input label="Nombre completo" required placeholder="Ej. Juan Pérez" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
            <div className="form-group">
              <label className="form-label">Nivel de inglés</label>
              <select className="form-select" value={newStudent.level} onChange={e => setNewStudent({...newStudent, level: e.target.value})}>
                <option value="Beginner">Beginner</option>
                <option value="Elementary">Elementary</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <Input label="Notas / Observaciones" placeholder="Ej. Contacto del tutor, debilidades, preferencias..." value={newStudent.notes} onChange={e => setNewStudent({...newStudent, notes: e.target.value})} />
            <Button type="submit">Guardar Alumno</Button>
          </form>
        </Card>
      )}

      {/* Listado de Alumnos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {students.map(s => (
          <Card key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <Link to={`/students/${s.id}`} style={{ flex: 1, minWidth: '150px' }}>
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div className="text-light text-sm">{s.level}</div>
            </Link>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="outline" style={{ padding: '6px 12px', fontSize: '0.875rem' }} onClick={() => setEditingStudent(s)}>
                Editar
              </Button>
              <Button variant="danger" style={{ padding: '6px 12px', fontSize: '0.875rem' }} onClick={() => deleteStudent(s.id)}>
                Eliminar
              </Button>
            </div>
          </Card>
        ))}
        {students.length === 0 && !showAdd && <p className="text-light">Aún no hay alumnos registrados.</p>}
      </div>

      {/* Modal de Edición de Alumno */}
      {editingStudent && (
        <div className="modal-backdrop" onClick={() => setEditingStudent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="heading-2" style={{ marginBottom: 0 }}>Editar Información del Alumno</h2>
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
                  label="Nombre completo" 
                  value={editingStudent.name} 
                  onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} 
                  required 
                />
                
                <div className="form-group">
                  <label className="form-label">Nivel de inglés</label>
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
                  label="Notas / Observaciones" 
                  value={editingStudent.notes || ''} 
                  onChange={e => setEditingStudent({...editingStudent, notes: e.target.value})} 
                />
              </div>

              <div className="modal-footer">
                <Button variant="outline" type="button" onClick={() => setEditingStudent(null)}>Cancelar</Button>
                <Button type="submit">Guardar Cambios</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
