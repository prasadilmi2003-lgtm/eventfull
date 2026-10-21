import { Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/layout/DashboardLayout'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import About from './pages/About'
import Categories from './pages/Categories'
import Contact from './pages/Contact'
import EventDetails from './pages/EventDetails'
import Explore from './pages/Explore'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminEvents from './pages/admin/AdminEvents'
import AdminReports from './pages/admin/AdminReports'
import AdminUsers from './pages/admin/AdminUsers'
import AttendeeDashboard from './pages/attendee/AttendeeDashboard'
import BookingDetails from './pages/attendee/BookingDetails'
import MyTickets from './pages/attendee/MyTickets'
import SavedEvents from './pages/attendee/SavedEvents'
import ForgotPassword from './pages/auth/ForgotPassword'
import Login from './pages/auth/Login'
import ResetPassword from './pages/auth/ResetPassword'
import Signup from './pages/auth/Signup'
import CheckIn from './pages/organizer/CheckIn'
import EventAnalytics from './pages/organizer/EventAnalytics'
import EventAttendees from './pages/organizer/EventAttendees'
import EventForm from './pages/organizer/EventForm'
import ManageEvents from './pages/organizer/ManageEvents'
import OrganizerDashboard from './pages/organizer/OrganizerDashboard'

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="events" element={<Explore />} />
        <Route path="events/:id" element={<EventDetails />} />
        <Route path="categories" element={<Categories />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Logged-in pages: sidebar layout, then a role check per group */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="profile" element={<Profile />} />

          <Route element={<ProtectedRoute roles={['attendee']} />}>
            <Route path="attendee" element={<AttendeeDashboard />} />
            <Route path="attendee/tickets" element={<MyTickets />} />
            <Route path="attendee/bookings/:id" element={<BookingDetails />} />
            <Route path="attendee/saved" element={<SavedEvents />} />
          </Route>

          <Route element={<ProtectedRoute roles={['organizer']} />}>
            <Route path="organizer" element={<OrganizerDashboard />} />
            <Route path="organizer/events" element={<ManageEvents />} />
            <Route path="organizer/events/new" element={<EventForm />} />
            <Route path="organizer/events/:id/edit" element={<EventForm />} />
            <Route path="organizer/events/:id/attendees" element={<EventAttendees />} />
            <Route path="organizer/events/:id/analytics" element={<EventAnalytics />} />
            <Route path="organizer/checkin" element={<CheckIn />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/events" element={<AdminEvents />} />
            <Route path="admin/reports" element={<AdminReports />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
