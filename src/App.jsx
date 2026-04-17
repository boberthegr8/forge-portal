import { Routes, Route } from 'react-router-dom'
import RepView from './pages/RepView.jsx'
import ClientPortal from './pages/ClientPortal.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RepView />} />
      <Route path="/portal/:token" element={<ClientPortal />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
