import axios from "axios";
import toast from "react-hot-toast";

// Create a custom Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api", // ✅ works for local + production
  withCredentials: true, // ✅ IMPORTANT: sends HTTP-only cookies automatically
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = window.location.pathname === "/login";

    if (error.response?.status === 401 && !isAuthRoute) {
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
