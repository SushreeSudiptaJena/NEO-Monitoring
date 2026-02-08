import { useState } from "react";
import API from "../api/api";
import Galaxy from "../components/Galaxy";

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
    <div className="page auth-page">
      <div className="auth-bg" aria-hidden="true">
        <Galaxy
          mouseRepulsion
          mouseInteraction
          density={1}
          glowIntensity={0.3}
          saturation={0}
          hueShift={140}
          twinkleIntensity={0.3}
          rotationSpeed={0.1}
          repulsionStrength={2}
          autoCenterRepulsion={0}
          starSpeed={0.5}
          speed={1}
        />
      </div>

      <div className="container auth-content">
        <div className="auth-grid">
          <section className="auth-info">
            <div className="auth-hero">
              <h1 className="auth-title">NEO Monitoring</h1>
              <p className="subtitle" style={{ marginTop: 10 }}>
                Monitor Near-Earth Objects (NEOs), track risk signals, and save objects for future alerts.
              </p>
            </div>

            <div className="card">
              <h2 className="h2">Know your space rocks</h2>
              <p className="muted" style={{ marginTop: 6 }}>
                These terms get mixed up a lot — here’s the quick difference between the most common “stuff in the
                sky” you’ll hear about.
              </p>
              <div className="auth-facts">
                <div className="auth-fact">
                  <div className="auth-fact-text">
                    <div className="auth-fact-k">Asteroid</div>
                    <div className="auth-fact-v">A rocky body orbiting the Sun (most are in the asteroid belt).</div>
                  </div>
                  <div className="auth-fact-media">
                    <img src="/space-rocks/asteroid.jpeg" alt="Asteroid" loading="lazy" />
                  </div>
                </div>
                <div className="auth-fact">
                  <div className="auth-fact-text">
                    <div className="auth-fact-k">Comet</div>
                    <div className="auth-fact-v">An icy body that can form a glowing coma and tail near the Sun.</div>
                  </div>
                  <div className="auth-fact-media">
                    <img src="/space-rocks/comet.jpeg" alt="Comet" loading="lazy" />
                  </div>
                </div>
                <div className="auth-fact">
                  <div className="auth-fact-text">
                    <div className="auth-fact-k">Meteor</div>
                    <div className="auth-fact-v">The streak of light when a small object burns in our atmosphere.</div>
                  </div>
                  <div className="auth-fact-media">
                    <img src="/space-rocks/meteor.jpeg" alt="Meteor streak" loading="lazy" />
                  </div>
                </div>
                <div className="auth-fact">
                  <div className="auth-fact-text">
                    <div className="auth-fact-k">Meteorite</div>
                    <div className="auth-fact-v">A fragment that survives the atmosphere and lands on Earth.</div>
                  </div>
                  <div className="auth-fact-media">
                    <img src="/space-rocks/meteorite.jpeg" alt="Meteorite" loading="lazy" />
                  </div>
                </div>
                <div className="auth-fact">
                  <div className="auth-fact-text">
                    <div className="auth-fact-k">Bolide</div>
                    <div className="auth-fact-v">An exceptionally bright fireball (often linked to fragmentation).</div>
                  </div>
                  <div className="auth-fact-media">
                    <img src="/space-rocks/bolide.jpeg" alt="Bright bolide fireball" loading="lazy" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="auth-form">
            <div className="card">
              <div style={{ marginBottom: 14 }}>
                <h2 className="h2">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
                <p className="subtitle">
                  {mode === "login"
                    ? "Sign in to monitor NEO risk and alerts."
                    : "Create an account to start watching NEOs."}
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
          </section>
        </div>
      </div>
    </div>
  );
}
