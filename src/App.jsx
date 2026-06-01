import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { PiCameraLight, PiEnvelopeSimpleLight, PiFlowerLotusLight, PiHeartLight, PiHouseLight, PiImagesLight, PiBabyLight, PiCrownLight } from 'react-icons/pi';
import Home from './pages/Home';
import Galeria from './pages/Galeria';
import GaleriaCloudinary from './components/GaleriaCloudinary';
import Estudio from './pages/Estudio';
import Contato from './pages/Contato';
import './App.css';

const MENU = [
  { label: 'Home', path: '/', icon: <PiHouseLight size={18} /> },
  { label: 'Galeria', path: '/galeria', icon: <PiImagesLight size={18} /> },
  { label: 'Infantil', path: '/galeria-infantil', icon: <PiBabyLight size={18} /> },
  { label: 'Casamentos', path: '/galeria-casamentos', icon: <PiHeartLight size={18} /> },
  { label: 'Femininos', path: '/galeria-femininos', icon: <PiFlowerLotusLight size={18} /> },
  { label: 'Pre-Weding', path: '/galeria-pre-weding', icon: <PiCameraLight size={18} /> },
  { label: 'Noivas', path: '/galeria-noivas', icon: <PiCrownLight size={18} /> },
  { label: 'Estudio', path: '/estudio', icon: <PiCameraLight size={18} /> },
  { label: 'Contato', path: '/contato', icon: <PiEnvelopeSimpleLight size={18} /> },
];

function Shell() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff7fb] via-[#fff] to-[#fff7ef] text-[#4d2a3a]">
      <header className="sticky top-0 z-50 border-b border-pink-100/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-sm font-semibold uppercase tracking-[0.22em] text-pink-600">Photo Vitoria</Link>
          <nav className="hidden gap-4 md:flex">
            {MENU.map((item) => (
              <Link key={item.path} to={item.path} className="text-xs uppercase tracking-[0.16em] text-[#7f5b6b] hover:text-pink-600">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-2 pb-10 pt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/galeria" element={<Galeria />} />
          <Route path="/galeria-infantil" element={<GaleriaCloudinary pasta="infantil" semSetasDots={true} />} />
          <Route path="/galeria-casamentos" element={<GaleriaCloudinary pasta="casamentos" semSetasDots={true} />} />
          <Route path="/galeria-femininos" element={<GaleriaCloudinary pasta="femininos" semSetasDots={true} />} />
          <Route path="/galeria-pre-weding" element={<GaleriaCloudinary pasta="pre-weding" semSetasDots={true} />} />
          <Route path="/galeria-noivas" element={<GaleriaCloudinary pasta="noivas" semSetasDots={true} />} />
          <Route path="/estudio" element={<Estudio />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
