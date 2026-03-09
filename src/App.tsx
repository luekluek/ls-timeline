import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { routes } from './router'
import { ProfileProvider } from './features/profile'
import { WatchlistProvider } from './features/watchlist'

const router = createBrowserRouter(routes, { basename: '/ls-timeline/' })

function App() {
  return (
    <ProfileProvider>
      <WatchlistProvider>
        <RouterProvider router={router} />
      </WatchlistProvider>
    </ProfileProvider>
  )
}

export default App
