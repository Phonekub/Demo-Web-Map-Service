import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from 'react-router-dom';
import { Header } from '@/components';
import { BlankLayout } from '@/components/layouts';
import { routes } from '@/config/routes';
import './App.scss';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLanguageStore } from './stores/languageStore';
import { useEffect } from 'react';
import { useUserStore } from './stores/userStore';

// Set a demo user so the app works without login
const DEMO_USER = {
  id: 1,
  employeeId: 99999,
  fullName: 'Demo User',
  permissions: ['MAP'],
};

// Root layout component
function RootLayout() {
  return (
    <div data-theme="light" className="flex flex-col min-h-screen relative bg-gray-50">
      <div className="fixed top-0 left-0 right-0 z-40">
        <Header className="header" />
      </div>
      <main className="flex-1 relative">
        <Outlet />
      </main>
    </div>
  );
}

const defaultLayoutRoutes = routes.filter(route => route.layout !== 'blank');
const blankLayoutRoutes = routes.filter(route => route.layout === 'blank');

// Set demo user on startup
useUserStore.getState().setUser(DEMO_USER);

const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: defaultLayoutRoutes.map(route => {
      const Component = route.element;
      return {
        path: route.path.replace('/', ''),
        Component,
      };
    }),
  },
  ...blankLayoutRoutes.map(route => {
    const Component = route.element;
    return {
      path: route.path,
      element: (
        <BlankLayout>
          <Component />
        </BlankLayout>
      ),
    };
  }),
]);

function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

// Component to initialize language
const AppWithLanguage = () => {
  const initLanguage = useLanguageStore(state => state.initLanguage);

  useEffect(() => {
    initLanguage();
  }, [initLanguage]);

  return <App />;
};

export default AppWithLanguage;
