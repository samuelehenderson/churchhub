import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import TopBar from './components/TopBar.jsx';
import TabBar from './components/TabBar.jsx';
import Home from './pages/Home.jsx';
import Live from './pages/Live.jsx';
import Directory from './pages/Directory.jsx';
import Profile from './pages/Profile.jsx';
import Quiz from './pages/Quiz.jsx';
import MapPage from './pages/Map.jsx';
import Admin from './pages/Admin.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="app-shell">
      <ScrollToTop />
      <TopBar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/live" element={<Live />} />
          <Route path="/churches" element={<Directory />} />
          <Route path="/church/:id" element={<Profile />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  );
}
