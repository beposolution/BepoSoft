import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const Authmiddleware = ({ children }) => {
  const location = useLocation();  // Get the current location using useLocation hook

  if (!localStorage.getItem("token")) {
    // Redirect to login page if no token is found, passing the current location in state
    return <Navigate to="/login" state={{ from: location }} />;
  }

  // Render the children if the token exists
  return <>{children}</>;
};

export default Authmiddleware;
