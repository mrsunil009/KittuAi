import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const email = new URLSearchParams(useLocation().search).get("email");

  const handleVerify = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json();
    setMessage(data.msg);
    if (res.ok) {
      localStorage.setItem("resetToken", data.resetToken);
      navigate("/reset-password");
    }
  };

  return (
    <div className="login-container">
      <h2>Verify OTP</h2>
      <form onSubmit={handleVerify}>
        <input type="text" placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} required />
        <button type="submit">Verify OTP</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
