import type { RouteObject } from 'react-router-dom'
import AppLayout from './shared/components/AppLayout'
import HomePage from './routes/HomePage'
import SchoolPage from './routes/SchoolPage'

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/school/:id',
        element: <SchoolPage />,
      },
    ],
  },
]
