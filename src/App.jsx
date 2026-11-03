import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Stock from './pages/Stock'
import Projets from './pages/Projets'
import Projet from './pages/Projet'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Stock />} />
        <Route path="projets" element={<Projets />} />
        <Route path="projets/:slug" element={<Projet />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
