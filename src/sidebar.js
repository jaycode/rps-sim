import React, { useState } from 'react';
import './sidebar.css';

const Sidebar = ({children}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      <button className="hamburger-button" onClick={toggleSidebar}>
        ☰
      </button>

      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          {children}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
