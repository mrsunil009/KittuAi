import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./App.css";

function Chat() {
  const [prompt, setPrompt] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState("📋");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [history, setHistory] = useState([]);
  const [editUserName, setEditUserName] = useState(localStorage.getItem("userName") || "User");
  const [editUserPhoto, setEditUserPhoto] = useState(localStorage.getItem("userPhoto") || null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const scrollRef = useRef(null);
  const userName = localStorage.getItem("userName") || "User";
  const userPhoto = localStorage.getItem("userPhoto") || null;

  const handleEditProfile = () => {
    const newName = prompt("Enter your name:", editUserName);
    if (newName && newName.trim()) {
      setEditUserName(newName);
      localStorage.setItem("userName", newName);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditUserPhoto(reader.result);
      localStorage.setItem("userPhoto", reader.result);
    };
    reader.readAsDataURL(file);
  };

  const triggerPhotoUpload = () => {
    document.getElementById("photoInput").click();
  };

  // Auto session check on app load
  useEffect(() => {
    const checkSession = async () => {
      console.log('🔐 Checking session status...');
      console.log('📝 Token from localStorage:', token ? 'Present' : 'Missing');
      
      try {
        const res = await fetch('/api/session-status', {
          credentials: 'include',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        const data = await res.json();
        console.log('📊 Session status response:', data);
        
        if (!res.ok || !data.authenticated) {
          console.log('❌ Session invalid, checking token...');
          if (!token) {
            console.log('❌ No token found, redirecting to login');
            navigate('/login');
          } else {
            console.log('✅ Token available, continuing...');
          }
        } else {
          console.log('✅ Session is valid');
        }
      } catch (err) {
        console.error('❌ Session check error:', err);
        if (!token) {
          navigate('/login');
        }
      }
    };
    
    checkSession();
  }, [token, navigate]);

  const fetchHistory = async () => {
    console.log('📚 Fetching chat history...');
    if (!token) {
      console.log('❌ No token found for history fetch');
      return;
    }
    try {
      const res = await fetch('/api/chat/history', {
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        }
      });
      const data = await res.json();
      console.log('📊 History response:', data);
      
      if (res.ok) {
        setHistory(data.chats || []);
        console.log('✅ History loaded successfully:', data.chats?.length || 0, 'items');
      } else {
        console.error('❌ History fetch failed:', data.msg);
      }
    } catch (err) {
      console.error('❌ History load error:', err);
    }
  };

  useEffect(() => { fetchHistory(); }, [token]);

  useEffect(() => {
    const closeMenu = (e) => {
      if (!e.target.closest(".profile-wrapper")) setShowProfile(false);
    };
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [response, loading]);

  const copyToClipboard = () => {
    if (!response) return;
    navigator.clipboard.writeText(response).then(() => {
      setCopyStatus("✅");
      setTimeout(() => setCopyStatus("📋"), 2000);
    });
  };

  const summarizeResponse = () => {
    if (!response || response.includes("📝 Summary:")) return;
    const cleanResponse = response.replace(/\*\*|\*|#|>|`/g, "").replace(/\n/g, " ");
    const sentences = cleanResponse.split(/[.!?]/).filter(s => s.trim().length > 5);
    if (sentences.length === 0) return;
    const summary = sentences.slice(0, Math.min(3, sentences.length)).join(". ") + "...";
    setResponse(`📝 Summary: \n\n${summary}`);
  };

  const downloadPDF = async () => {
    if (!response) return;
    const element = document.getElementById("pdf-content");
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("kittu-ai-response.pdf");
  };

  const cleanText = () => {
    if (!response) return;
    const cleaned = response
      .replace(/\s+/g, " ")
      .replace(/[^\w\s.,!?]/g, "")
      .trim();
    setResponse(cleaned);
  };

  const analyzeTone = () => {
    if (!response) return;
    let tone = "Neutral";
    if (/please|kindly|regards/i.test(response)) tone = "Formal";
    else if (/hey|bro|lol|haha/i.test(response)) tone = "Casual";
    else if (/sad|happy|angry|love/i.test(response)) tone = "Emotional";
    setResponse(`📊 Tone: ${tone}\n\n${response}`);
  };

  const extractKeywords = () => {
    if (!response) return;
    const words = response.toLowerCase().match(/\b\w+\b/g);
    const freq = {};
    words.forEach(w => {
      if (w.length > 4) freq[w] = (freq[w] || 0) + 1;
    });
    const keywords = Object.keys(freq)
      .sort((a, b) => freq[b] - freq[a])
      .slice(0, 5);
    setResponse(`🔑 Keywords: ${keywords.join(", ")}\n\n${response}`);
  };

  const handleNewChat = () => {
    console.log('🆕 Starting new chat...');
    setLastPrompt("");
    setResponse("");
    setPrompt("");
    setHistory([]);
    console.log('✅ Chat state cleared');
  };

  const sendPrompt = async (e) => {
    if (e) e.preventDefault();

    if (!token) {
      if (window.confirm("Kittu AI se baat karne ke liye login karein?")) {
        navigate("/login");
      }
      return;
    }

    if (!prompt.trim()) return;

    const userQuery = prompt;
    setLastPrompt(prompt);
    setLoading(true);
    setResponse("");
    setPrompt("");

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ prompt: userQuery }),
      });

      const data = await res.json();
      console.log('📊 Chat API response:', data);
      
      setResponse(data.result || "Maaf kijiye, main samajh nahi paayi.");
      console.log('✅ Text response received');
      
      fetchHistory();

    } catch (err) {
      setResponse("❌ Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`chat-wrapper ${isSidebarOpen ? "side-open" : "side-closed"}`} style={{ background: "var(--bg-dark)", backgroundImage: "none" }}>
      <input
        type="file"
        accept="image/*"
        id="photoInput"
        style={{ display: "none" }}
        onChange={handlePhotoChange}
      />
      <div id="pdf-content" style={{ position: "absolute", left: "-9999px", maxWidth: "600px", padding: "20px", background: "white", color: "black" }}>
        {response}
      </div>
      
      <aside className="gemini-sidebar">
        <div className="sidebar-top">
          <button className="menu-icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>☰</button>

          <div className="new-chat-action" onClick={handleNewChat}>
            <span className="plus">+</span>
            {isSidebarOpen && <span className="fade-in">New Chat</span>}
          </div>
        </div>

        <div className="sidebar-history">
          {isSidebarOpen && (
            <div className="fade-in">
              <p className="recent-text">Recent</p>

              {history.length > 0 ? history.map((item, index) => (
                <div key={index} className="history-link">
                  <span>💬</span>
                  <span className="truncate">{item.prompt || item.title}</span>
                </div>
              )) : (
                <p className="no-history">No recent chats</p>
              )}
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <div className="header-left">
            <span className="brand-title">Kittu AI</span>
          </div>

          <div className="header-right" style={{ marginLeft: "auto" }}>
            {token ? (
              <div className="profile-wrapper">

                {/* ✅ UPDATED AVATAR */}
                <div 
                  className={`user-avatar ${showProfile ? "active-avatar" : ""}`}
                  onClick={() => setShowProfile(!showProfile)}
                >
                  {editUserName[0]}
                </div>

                {showProfile && (
                  <div className="profile-dropdown-box fade-in" style={{ 
                    position: "absolute", 
                    right: "10px", 
                    top: "60px",
                    background: "#1a1a2e",
                    borderRadius: "12px",
                    padding: "16px",
                    minWidth: "220px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    zIndex: 1000
                  }}>

                    <div className="profile-header" style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "12px",
                      paddingBottom: "12px",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      marginBottom: "12px"
                    }}>
                      <div className="profile-avatar-large" style={{ 
                        width: "48px", 
                        height: "48px", 
                        borderRadius: "50%", 
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "white"
                      }}>
                        {editUserPhoto ? <img src={editUserPhoto} alt="User" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : editUserName[0]}
                      </div>
                      <div className="profile-info">
                        <p className="profile-name" style={{ 
                          margin: 0, 
                          fontWeight: 600, 
                          fontSize: "15px",
                          color: "#fff"
                        }}>{editUserName}</p>
                        <p className="profile-status" style={{ 
                          margin: 0, 
                          fontSize: "12px", 
                          color: "#888",
                          marginTop: "2px"
                        }}>Active User</p>
                      </div>
                    </div>

                    <div className="profile-menu-links" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <button className="profile-menu-item" onClick={handleEditProfile} style={{
                        background: "transparent",
                        border: "none",
                        color: "#e0e0e0",
                        padding: "10px 12px",
                        textAlign: "left",
                        cursor: "pointer",
                        borderRadius: "8px",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        transition: "all 0.2s ease"
                      }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)" }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}>
                        <span>👤</span> Edit Profile
                      </button>
                      
                      <div style={{ 
                        height: "1px", 
                        background: "rgba(255,255,255,0.1)", 
                        margin: "8px 0" 
                      }}></div>
                      
                      <button className="profile-menu-item" style={{
                        background: "transparent",
                        border: "none",
                        color: "#e0e0e0",
                        padding: "10px 12px",
                        textAlign: "left",
                        cursor: "pointer",
                        borderRadius: "8px",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        transition: "all 0.2s ease"
                      }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)" }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}>
                        <span>⚙️</span> Settings
                      </button>
                      <button className="profile-menu-item" style={{
                        background: "transparent",
                        border: "none",
                        color: "#e0e0e0",
                        padding: "10px 12px",
                        textAlign: "left",
                        cursor: "pointer",
                        borderRadius: "8px",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        transition: "all 0.2s ease"
                      }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)" }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}>
                        <span>❓</span> Help & Support
                      </button>
                      
                      <div style={{ 
                        height: "1px", 
                        background: "rgba(255,255,255,0.1)", 
                        margin: "8px 0" 
                      }}></div>
                      
                      <button 
                        className="profile-menu-item logout-btn"
                        onClick={() => {
                          localStorage.clear();
                          window.location.reload();
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#ff6b6b",
                          padding: "10px 12px",
                          textAlign: "left",
                          cursor: "pointer",
                          borderRadius: "8px",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          transition: "all 0.2s ease",
                          fontWeight: 500
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,107,107,0.15)" }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                      >
                        <span>🚪</span> Logout
                      </button>
                    </div>

                  </div>
                )}

              </div>
            ) : (
              <div className="auth-buttons">
                <button className="login-nav-btn" onClick={() => navigate("/login")}>Login</button>
                <button className="signup-nav-btn" onClick={() => navigate("/signup")}>Signup</button>
              </div>
            )}
          </div>
        </header>

        <div className="scroll-area" ref={scrollRef}>
          {!lastPrompt ? (
            <div className="welcome-box" style={{ background: "none", backgroundImage: "none" }}>
              <h1 className="name-gradient">Hello, {editUserName}</h1>
              <h2 className="help-text-grey">How can I help you today?</h2>
            </div>
          ) : (
            <div className="chat-container">

              <div className="user-row-msg">
                <div className="bubble user-bubble">{lastPrompt}</div>
              </div>

              {loading && (
                <div className="ai-row-msg">
                  <div className="typing">
                    KittuAI is thinking...
                  </div>
                </div>
              )}

              {response && (
                <div className="ai-row-msg">
                  <div className="ai-res-box">
                    <span className="ai-name-tag">KittuAI</span>
                    
                    <div className="ai-text-content">{response}</div>

                    <div className="button-group">
                      <button className="tool-btn" onClick={copyToClipboard} title="Copy">{copyStatus}</button>
                      <button className="tool-btn" onClick={summarizeResponse} title="Summarize">📝</button>
                      <button className="tool-btn" onClick={downloadPDF} title="Download PDF">📄</button>
                      <button className="tool-btn" onClick={cleanText} title="Cleanup Text">✨</button>
                      <button className="tool-btn" onClick={analyzeTone} title="Analyze Tone">🎨</button>
                      <button className="tool-btn" onClick={extractKeywords} title="Extract Keywords">🔑</button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        <div className="input-container-fixed">
          <form className="pill-input-box" onSubmit={sendPrompt}>
            <input 
              type="text" 
              placeholder="Enter a prompt here" 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)} 
            />
            <button type="submit" className="send-arrow">➤</button>
          </form>

          <p className="disclaimer">Kittu AI may provide inaccurate info.</p>
        </div>

      </main>
    </div>
  );
}

export default Chat;