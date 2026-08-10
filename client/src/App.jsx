import useAuth from "./modules/auth/hooks/useAuth.js";

function App() {
  const {
    user,
    token,
    loading,
    isAuthenticated,
  } = useAuth();


  if (loading) {
    return <h1>Auth is loading...</h1>;
  }

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>MySociety Auth Test</h1>

      <hr />

      <p>
        <strong>AuthProvider:</strong> ✅ Working
      </p>

      <p>
        <strong>useAuth:</strong> ✅ Working
      </p>

      <p>
        <strong>Loading:</strong> {loading ? "true" : "false"}
      </p>

      <p>
        <strong>Authenticated:</strong>{" "}
        {isAuthenticated ? "true" : "false"}
      </p>

      <p>
        <strong>Token:</strong>{" "}
        {token ? token : "No token stored"}
      </p>

      <p>
        <strong>User:</strong>{" "}
        {user ? JSON.stringify(user) : "No user loaded"}
      </p>
    </div>
  );
}

export default App;
