import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { PageLoader, RouteProgress } from './components/RouteLoader';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Book = lazy(() => import('./pages/Book'));
const Gst = lazy(() => import('./pages/Gst'));

function AnimatedRoutes() {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="route-enter">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/book" element={<Book />} />
          <Route path="/gst" element={<Gst />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteProgress />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
