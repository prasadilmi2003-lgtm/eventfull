import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import Navbar from './Navbar'

// Every public page renders inside <Outlet /> between the navbar and footer.
export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  )
}
