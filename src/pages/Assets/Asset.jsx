import React, { useState, useEffect } from "react";
import axios from "axios";

const AssetManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCategory, setExpandedCategory] = useState(null);

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
        console.error("Error fetching assets:", err);
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
    <div className="container mt-4">
      <h2 className="text-center mb-4">Asset Management</h2>

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

          {/* Total Quantity & Total Price */}
          <div className="text-end mt-3">
            <h5>Total Quantity: <strong>{totalOverallQuantity}</strong></h5>
            <h5>Total Price: <strong>₹{totalOverallPrice.toFixed(2)}</strong></h5>
          </div>
        </>
      )}
    </div>
  );
};

export default AssetManagement;
