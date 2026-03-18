import type { RouteConfig } from '@/types';
import {
  MapsPage,
  NotFoundPage,
} from '@/pages';

export const routes: RouteConfig[] = [
  {
    path: '/',
    element: MapsPage,
    title: 'Maps',
    description: 'Interactive maps and location data visualization',
    permission: [],
  },
  {
    path: '*',
    element: NotFoundPage,
    title: '404 - Not Found',
    description: 'Page not found',
    layout: 'blank',
    permission: [],
  },
];
