import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Engineering from './pages/Engineering';
import Budget from './pages/Budget';
import CRM from './pages/CRM';
import Admin from './pages/Admin';
import Export from './pages/Export';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/engineering" replace />} />
          <Route path="engineering" element={<Engineering />} />
          <Route path="budget" element={<Budget />} />
          <Route path="crm" element={<CRM />} />
          <Route path="admin" element={<Admin />} />
          <Route path="export" element={<Export />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
