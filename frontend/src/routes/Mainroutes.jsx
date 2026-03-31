import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar       from '../components/Navbar';
import HomePage     from '../pages/HomePage';
import LoginPage    from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import SubscribePage from '../pages/SubscribePage';
import Dashboard    from '../pages/Dashboard';
import CharitiesPage from  '../pages/CharitiesPage';
import AdminPage    from '../pages/AdminPage';
import DrawResults  from '../pages/DrawResults';

const PrivateRoute = ({ children }) => {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const isAdmin = localStorage.getItem('userRole') === 'admin';
  return isAdmin ? children : <Navigate to="/dashboard" />;
};
const SubscribeRoute = ({ children }) => {
  const token     = localStorage.getItem('token');
  const subStatus = localStorage.getItem('subStatus');

  if (!token)                  return <Navigate to="/login" />;
  if (subStatus === 'active')  return <Navigate to="/dashboard" />;  // already subscribed
  return children;
};

export default function  Mainroutes() {
  return (
      
      <Routes>
        <Route path="/"              element={<HomePage />} />
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/register"      element={<RegisterPage />} />
        <Route path="/charities"     element={<CharitiesPage />} />
        <Route path="/draw-results"  element={<DrawResults />} />
        <Route path="/subscribe"     element={<SubscribeRoute><SubscribePage /></SubscribeRoute>} />
        <Route path="/dashboard"     element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/admin"         element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Routes>
  );
}
