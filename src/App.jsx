import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import AllGuidesPage from './pages/AllGuidesPage'
import GuidePage from './pages/GuidePage'
import HomePage from './pages/HomePage'

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
