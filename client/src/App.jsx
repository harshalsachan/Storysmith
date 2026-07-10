import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import StoriesPage from './pages/StoriesPage';
import GamePage from './pages/GamePage';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stories" element={<StoriesPage />} />
        <Route path="/play/:id" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}
