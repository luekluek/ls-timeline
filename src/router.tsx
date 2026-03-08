import type { RouteObject } from 'react-router-dom'
import AppLayout from './shared/components/AppLayout'
import HomePage from './routes/HomePage'

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
    ],
  },
]
