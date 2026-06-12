import axios from "axios";

let intervalId = null;
let isLoggingOut = false;

export const startAuthStatusChecker = (navigate) => {
  if (intervalId) clearInterval(intervalId);

  const checkAuthStatus = async () => {
    if (isLoggingOut) return;

    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      await axios.get(`${import.meta.env.VITE_APP_KEY}auth/status/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      const status = error?.response?.status;

      if (status === 401 || status === 403 || status === 404) {
        isLoggingOut = true;

        clearInterval(intervalId);
        intervalId = null;

        localStorage.clear();
        sessionStorage.clear();

        navigate("/login", { replace: true });
      }
    }
  };

  checkAuthStatus();

  intervalId = setInterval(checkAuthStatus, 20000);
};

export const stopAuthStatusChecker = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};