import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { routes } from './router'

const router = createBrowserRouter(routes, { basename: '/ls-timeline/' })

function App() {
  return <RouterProvider router={router} />
}

export default App
