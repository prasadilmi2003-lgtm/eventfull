import { Route, Routes } from 'react-router-dom'
import DesignSystem from './pages/DesignSystem'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DesignSystem />} />
    </Routes>
  )
}
