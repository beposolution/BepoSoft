import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const TotalComponyAssets = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [liabilities, setLiabilities] = useState([]);


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
        toast.error("Failed to load company assets");
        setError("Failed to load company assets");
      } finally {
        setLoading(false);
      }
    };

    fetchLiabilities();
  }, []);

  const totalPendingAmount = liabilities.reduce((acc, liability) => acc + (liability.pending_amount || 0), 0);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_APP_IMAGE}/apis/get/asset/report/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCategories(response.data.assets || []);
      } catch (err) {
        toast.error("Error fetching assets:");
        setError("Failed to load assets");
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  let totalOverallQuantity = 0;
  let totalOverallPrice = 0;

  categories.forEach((category) => {
    category.products.forEach((product) => {
      const quantity = product.stock || product.quantity || 0;
      const price = parseFloat(product.landing_cost || product.amount || 0);
      totalOverallQuantity += quantity;
      totalOverallPrice += quantity * price;
    });
  });

  return (
    <div style={{ marginTop: "80px", paddingBottom: "5rem" }} className="container">
      <div
        className="card mb-4"
        style={{
          maxWidth: "500px",
          margin: "0 auto 30px auto",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          borderRadius: "12px",
          background: "#f8f9fa",
        }}
      >
        <div className="card-body">
          <h4 className="card-title mb-3 text-center" style={{ fontWeight: "bold" }}>Summary</h4>
          <div className="text-center">
            {/* <h5>Total Quantity: <strong>{totalOverallQuantity}</strong></h5> */}
            <h5>Total Price: <strong>₹{totalOverallPrice.toFixed(2)}</strong></h5>
            {liabilities.length > 0 && (
              <>
                <h5>Total Liability: <strong>₹{totalPendingAmount.toFixed(2)}</strong></h5>
                <h5>
                  Capital: <strong style={{ color: "green" }}>₹{(totalOverallPrice - totalPendingAmount).toFixed(2)}</strong>
                </h5>
              </>
            )}
          </div>
        </div>
      </div>
      <h2 className="text-center mb-4 ">Asset Mangement Information</h2>

      {loading ? (
        <p className="text-center">Loading assets...</p>
      ) : error ? (
        <p className="text-danger text-center">{error}</p>
      ) : (
        <>
          <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
            <table className="table table-bordered table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Category</th>
                  <th>Total Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => {
                  const totalCategoryPrice = category.products.reduce((acc, product) => {
                    const quantity = product.stock || product.quantity || 0;
                    const price = parseFloat(product.landing_cost || product.amount || 0);
                    return acc + quantity * price;
                  }, 0);

                  return (
                    <>
                      <tr key={index}>
                        <td>{category.category}</td>
                        <td>₹{totalCategoryPrice.toFixed(2)}</td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => toggleCategory(category.category)}
                          >
                            {expandedCategory === category.category ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>
                      {expandedCategory === category.category && (
                        <tr>
                          <td colSpan="3">
                            <table className="table table-bordered mt-2">
                              <thead>
                                <tr>
                                  <th>Product Name</th>
                                  <th>Quantity</th>
                                  <th>Price (Per Item)</th>
                                  <th>Total Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {category.products.map((product, idx) => {
                                  const quantity = product.stock || product.quantity || 0;
                                  const price = parseFloat(product.landing_cost || product.amount || 0);
                                  const total = quantity * price;

                                  return (
                                    <tr key={idx}>
                                      <td>{product.name}</td>
                                      <td>{quantity}</td>
                                      <td>₹{price.toFixed(2)}</td>
                                      <td>₹{total.toFixed(2)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div className="container mt-2 pb-4">
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
      </div>
      <ToastContainer />
    </div>
  );
};

export default TotalComponyAssets;
