import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { TerminalSquare } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../../styles/portfolio.css";

export default function AdminLogin() {
  const { login, isAuthenticated, ready } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (ready && isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="modal-card glow-border" style={{ maxWidth: 400, width: "100%" }}>
        <div className="modal-head">
          <span className="modal-eyebrow">
            <TerminalSquare size={14} /> ADMIN PORT
          </span>
        </div>
        <h3>Admin access</h3>
        <p className="modal-sub">
          Restricted maintenance port. Sign in with your backend credentials.
        </p>
        <form onSubmit={onSubmit} className="admin-form">
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Authenticating…" : "Authenticate"}
          </button>
        </form>
        {error && <p className="admin-err">{error}</p>}
      </div>
    </div>
  );
}
