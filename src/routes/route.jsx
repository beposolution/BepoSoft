// import React from "react";
// import { Navigate, useLocation } from "react-router-dom";

// const Authmiddleware = ({ children }) => {
//   const location = useLocation();  // Get the current location using useLocation hook

//   if (!localStorage.getItem("token")) {
//     // Redirect to login page if no token is found, passing the current location in state
//     return <Navigate to="/login" state={{ from: location }} />;
//   }

//   // Render the children if the token exists
//   return <>{children}</>;
// };

// export default Authmiddleware;


import React, { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  startAuthStatusChecker,
  stopAuthStatusChecker,
} from "../utils/authStatusChecker";

const Authmiddleware = ({ children }) => {
  const location = useLocation();  // Get the current location using useLocation hook
  const navigate = useNavigate();

  // Get token from localStorage
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    startAuthStatusChecker(navigate);

    return () => {
      stopAuthStatusChecker();
    };
  }, [token, navigate]);

  if (!localStorage.getItem("token")) {
    // Redirect to login page if no token is found, passing the current location in state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render the children if the token exists
  return <>{children}</>;
};

export default Authmiddleware;