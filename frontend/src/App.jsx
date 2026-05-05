import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { AppointmentProvider } from "@/context/AppointmentContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import JoinMeeting from "./pages/JoinMeeting";

import ProtectedRoute from "./routes/ProtectedRoute";
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/Dashboard";
import FacultyList from "./pages/student/FacultyList";
import FacultyProfilePage from "./pages/student/FacultyProfile";
import MyAppointments from "./pages/student/MyAppointments";
import StudentNotifications from "./pages/student/Notifications";
import StudentProfile from "./pages/student/Profile";

import FacultyLayout from "./layouts/FacultyLayout";
import FacultyDashboard from "./pages/faculty/Dashboard";
import MySlots from "./pages/faculty/MySlots";
import FacultyRequests from "./pages/faculty/Requests";
import FacultyNotifications from "./pages/faculty/Notifications";
import FacultyProfile from "./pages/faculty/Profile";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageFaculty from "./pages/admin/ManageFaculty";
import AllAppointments from "./pages/admin/AllAppointments";
import Reports from "./pages/admin/Reports";
import AdminNotifications from "./pages/admin/Notifications";
import AdminProfile from "./pages/admin/Profile";

const App = () =>
  <AuthProvider>
    <AppointmentProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/join/:meetingId" element={<JoinMeeting />} />

            <Route path="/student" element={<ProtectedRoute allowedRole="student"><StudentLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="faculty" element={<FacultyList />} />
              <Route path="faculty/:id" element={<FacultyProfilePage />} />
              <Route path="appointments" element={<MyAppointments />} />
              <Route path="notifications" element={<StudentNotifications />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>

            <Route path="/faculty" element={<ProtectedRoute allowedRole="faculty"><FacultyLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<FacultyDashboard />} />
              <Route path="slots" element={<MySlots />} />
              <Route path="requests" element={<FacultyRequests />} />
              <Route path="notifications" element={<FacultyNotifications />} />
              <Route path="profile" element={<FacultyProfile />} />
            </Route>

            <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="faculty" element={<ManageFaculty />} />
              <Route path="appointments" element={<AllAppointments />} />
              <Route path="reports" element={<Reports />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppointmentProvider>
  </AuthProvider>;

export default App;
// Route update: admin notifications + profile