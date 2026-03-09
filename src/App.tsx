import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { routes } from './router'
import { ProfileProvider } from './features/profile'

const router = createBrowserRouter(routes, { basename: '/ls-timeline/' })

function App() {
  return (
    <ProfileProvider>
      <RouterProvider router={router} />
    </ProfileProvider>
  )
}

export default App
