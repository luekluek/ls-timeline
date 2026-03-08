import type { RouteObject } from 'react-router-dom'
import HomePage from './routes/HomePage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
]
