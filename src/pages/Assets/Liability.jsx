import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const LiabilityManagement = () => {
  const [liabilities, setLiabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLiabilities = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${import.meta.env.VITE_APP_IMAGE}/apis/liability/get/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLiabilities(response.data.liabilities || []);
      } catch (err) {
        toast.error("Failed to load liabilities");
        setError("Failed to load liabilities");
      } finally {
        setLoading(false);
      }
    };

    fetchLiabilities();
  }, []);

  // Calculate total pending amount
  const totalPendingAmount = liabilities.reduce((acc, liability) => acc + (liability.pending_amount || 0), 0);

  return (
    <div className="container mt-4">
      <h2 style={{ paddingTop: "50px" }} className="text-center mb-4">Liability Management</h2>

      {loading ? (
        <p className="text-center">Loading liabilities...</p>
      ) : error ? (
        <p className="text-danger text-center">{error}</p>
      ) : (
        <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>EMI Name</th>
                <th>Pending Amount</th>
              </tr>
            </thead>
            <tbody>
              {liabilities.map((liability, index) => (
                <tr key={index}>
                  <td>{liability.emi_name}</td>
                  <td>₹{liability.pending_amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Show Total only if there are valid liabilities */}
      {liabilities.length > 0 && (
        <div className="text-end mt-3">
          <h5>Total Pending Amount: <strong>₹{totalPendingAmount.toFixed(2)}</strong></h5>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default LiabilityManagement;
