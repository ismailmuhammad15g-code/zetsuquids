import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import GuidePage from './pages/GuidePage'
import AllGuidesPage from './pages/AllGuidesPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="guides" element={<AllGuidesPage />} />
        <Route path="guide/:slug" element={<GuidePage />} />
      </Route>
    </Routes>
  )
}

export default App
