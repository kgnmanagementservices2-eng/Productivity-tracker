import axios from "axios";
import toast from "react-hot-toast";

// Create a custom Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api", // works for local + production
  withCredentials: true, // IMPORTANT: sends HTTP-only cookies automatically
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isAuthRoute = window.location.pathname === "/login";

    // Catch BOTH 401 (Unauthorized) and 403 (Forbidden/No Token) errors
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403) &&
      !isAuthRoute
    ) {
      // 🟢 NEW: Explicitly hit the backend logout route to force the browser to delete the stuck HttpOnly cookie
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL || "/api"}/auth/logout`,
          {},
          { withCredentials: true },
        );
      } catch (e) {
        // We ignore errors here; the goal is just to attempt the cookie deletion
      }

      // Clear any remaining frontend state
      localStorage.clear();
      sessionStorage.clear();

      toast.error("Your session has expired. Please log in again.", {
        duration: 4000,
      });
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
