import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

function App() {
  const [apiStatus, setApiStatus] = useState({
    loading: true,
    message: "",
    error: ""
  });

  useEffect(() => {
    async function checkApiHealth() {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }

        const result = await response.json();

        setApiStatus({
          loading: false,
          message: result.message,
          error: ""
        });
      } catch (error) {
        setApiStatus({
          loading: false,
          message: "",
          error: error.message
        });
      }
    }

    checkApiHealth();
  }, []);

  return (
    <main className="app">
      <section className="card">
        <p className="eyebrow">MySociety</p>

        <h1>Society Management Platform</h1>

        <p>
          The React client and Express server have been scaffolded successfully.
        </p>

        {apiStatus.loading && <p>Checking backend connection...</p>}

        {apiStatus.message && (
          <p className="success">Backend status: {apiStatus.message}</p>
        )}

        {apiStatus.error && (
          <p className="error">
            Backend connection failed: {apiStatus.error}
          </p>
        )}
      </section>
    </main>
  );
}

export default App;
