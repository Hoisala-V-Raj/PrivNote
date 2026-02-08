import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreateNoteForm from './components/CreateNoteForm';
import ViewNote from './pages/ViewNote';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Routes>
          <Route path="/" element={<CreateNoteForm />} />
          <Route path="/note/:noteId" element={<ViewNote />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
