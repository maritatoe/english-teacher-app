import React, { useState } from 'react';
import StudentsList from './StudentsList';
import GroupsManagement from './GroupsManagement';

export default function StudentsDirectory() {
  const [activeTab, setActiveTab] = useState('students');

  return (
    <div>
      <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Students
        </button>
        <button 
          className={`tab-button ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          Groups
        </button>
      </div>

      <div>
        {activeTab === 'students' ? <StudentsList /> : <GroupsManagement />}
      </div>
    </div>
  );
}
