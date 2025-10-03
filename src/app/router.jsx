import { Routes, Route } from 'react-router-dom';
import RootLayout from './layout/RootLayout';
import HomePage from './pages/home/HomePage';
import PlannerPage from './pages/planning/PlannerPage';
import ComingSoon from './pages/_partials/ComingSoon';

export default function AppRouter() {
  return (
    <RootLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/planning" element={<PlannerPage />} />
        <Route path="/vineyards" element={<ComingSoon title="Vineyards" blurb="Blocks, maps, activities, health." />} />
        <Route path="/resources" element={<ComingSoon title="Resources" blurb="Guides, benchmarks, research." />} />
        <Route path="/account" element={<ComingSoon title="Account" blurb="Teams, billing, settings." />} />
        <Route path="*" element={<ComingSoon title="Not Found" blurb="That page doesn’t exist (yet)." />} />
      </Routes>
    </RootLayout>
  );
}
