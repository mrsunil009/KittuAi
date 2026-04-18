import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import "./App.css";
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import VerifyOtp from './VerifyOtp';
import ResetPassword from './ResetPassword';
import Chat from "./Chat"; 

// ProtectedRoute agar aap use kar rahe hain toh import rakhein, varna hata dein
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Home Page - Ab error nahi aayega */}
        <Route path="/" element={<Chat />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Profile route ko abhi comment kar dete hain jab tak file na ban jaye */}
        {/* <Route path="/profile" element={<Profile />} /> */}

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App;