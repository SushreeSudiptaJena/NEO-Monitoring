import { useState } from "react";
import API from "../api/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("login");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await API.post(
        "/auth/login",
        new URLSearchParams({
          username: email,
          password,
        })
      );

      // 🔐 SAVE TOKEN
      localStorage.setItem("token", res.data.access_token);

      // 🚀 Redirect
      window.location.href = "/dashboard";
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail) {
        setError(detail);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError("Login failed");
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await API.post("/auth/register", null, {
        params: {
          email,
          password,
        },
      });
      setMessage("Registered. Now log in.");
      setMode("login");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail) {
        setError(detail);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError("Registration failed");
      }
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="card">
          <div style={{ marginBottom: 14 }}>
            <h1 className="title">Cosmic Watch</h1>
            <p className="subtitle">
              {mode === "login" ? "Sign in to monitor NEO risk and alerts." : "Create an account to start watching asteroids."}
            </p>
          </div>

          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}

          <form className="form" onSubmit={mode === "login" ? handleLogin : handleRegister}>
            <div className="field">
              <div className="label">Email</div>
              <input
                className="input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="field">
              <div className="label">Password</div>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
            </div>

            <div className="btnRow">
              <button className="btn" type="submit">
                {mode === "login" ? "Login" : "Register"}
              </button>

              <button
                className="btn btnSecondary"
                type="button"
                onClick={() => {
                  setError("");
                  setMessage("");
                  setMode((m) => (m === "login" ? "register" : "login"));
                }}
              >
                {mode === "login" ? "Create account" : "Back to login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
