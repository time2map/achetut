import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

// Legacy map design kept for possible reuse.
// const DesktopMapScreen = lazy(() => import('@features/web-map/DesktopMapScreen').then((module) => ({ default: module.DesktopMapScreen })));
const MapScreen = lazy(() => import('@features/web-map/MapScreen').then((module) => ({ default: module.MapScreen })));
const PrivacyPolicyPage = lazy(() => import('@features/legal/PrivacyPolicyPage').then((module) => ({ default: module.PrivacyPolicyPage })));

export function App() {
  return (
    <Suspense fallback={<main className="route-loading" role="status"><span />Loading Archi2go…</main>}>
      <Routes>
        {/* <Route path="/design-1/*" element={<DesktopMapScreen routeBase="/design-1" />} /> */}
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/*" element={<MapScreen />} />
      </Routes>
    </Suspense>
  );
}
