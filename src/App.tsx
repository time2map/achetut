import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const DesktopMapScreen = lazy(() => import('@features/web-map/DesktopMapScreen').then((module) => ({ default: module.DesktopMapScreen })));
const DesignTwoMapScreen = lazy(() => import('@features/web-map/DesignTwoMapScreen').then((module) => ({ default: module.DesignTwoMapScreen })));
const PrivacyPolicyPage = lazy(() => import('@features/legal/PrivacyPolicyPage').then((module) => ({ default: module.PrivacyPolicyPage })));

export function App() {
  return (
    <Suspense fallback={<main className="route-loading" role="status"><span />Loading Achetut…</main>}>
      <Routes>
        <Route path="/" element={<Navigate to="/design-1" replace />} />
        <Route path="/design-1/*" element={<DesktopMapScreen routeBase="/design-1" />} />
        <Route path="/design-2/*" element={<DesignTwoMapScreen />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="*" element={<Navigate to="/design-1" replace />} />
      </Routes>
    </Suspense>
  );
}
