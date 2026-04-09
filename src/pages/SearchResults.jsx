import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Search, Users, Layers, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ students: [], groups: [], classes: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setSearched(true);
    const { data: { user } } = await supabase.auth.getUser();

    // In a real app we'd use textSearch or ilike. Here we use ilike for simple substring search
    const searchQuery = `%${query}%`;
    
    const [stRes, grRes, clRes] = await Promise.all([
      supabase.from('students').select('*').eq('teacher_id', user.id).ilike('name', searchQuery),
      supabase.from('groups').select('*').eq('teacher_id', user.id).ilike('name', searchQuery),
      supabase.from('classes').select('*, groups(name)').eq('teacher_id', user.id).ilike('topic', searchQuery)
    ]);

    setResults({
      students: stRes.data || [],
      groups: grRes.data || [],
      classes: clRes.data || []
    });
    
    setLoading(false);
  };

  return (
    <div>
      <h1 className="heading-1 flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}><Search /> Global Search</h1>
      
      <Card className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input 
            placeholder="Search students, groups, topics..." 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            style={{ flex: 1 }}
          />
          <Button type="submit">Search</Button>
        </form>
      </Card>

      {loading ? <div>Searching...</div> : searched ? (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          
          {results.students.length > 0 && (
            <Card>
              <h2 className="heading-2 flex items-center gap-2"><Users size={20}/> Students Found</h2>
              {results.students.map(s => (
                <div key={s.id} className="py-2 border-b border-color-border">
                  <Link to={`/students/${s.id}`} style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{s.name}</Link>
                  <div className="text-light text-sm">{s.level}</div>
                </div>
              ))}
            </Card>
          )}

          {results.groups.length > 0 && (
            <Card>
              <h2 className="heading-2 flex items-center gap-2"><Layers size={20}/> Groups Found</h2>
              {results.groups.map(g => (
                <div key={g.id} className="py-2 border-b border-color-border">
                  <Link to="/groups" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{g.name}</Link>
                  <div className="text-light text-sm">{g.level}</div>
                </div>
              ))}
            </Card>
          )}

          {results.classes.length > 0 && (
            <Card>
              <h2 className="heading-2 flex items-center gap-2"><CalendarDays size={20}/> Classes Found</h2>
              {results.classes.map(c => (
                <div key={c.id} className="py-2 border-b border-color-border">
                  <Link to="/classes" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{c.topic}</Link>
                  <div className="text-light text-sm">{c.groups?.name} • {c.date}</div>
                </div>
              ))}
            </Card>
          )}

          {results.students.length === 0 && results.groups.length === 0 && results.classes.length === 0 && (
            <div className="text-light text-center py-8">No results found for "{query}".</div>
          )}

        </div>
      ) : null}
    </div>
  );
}
