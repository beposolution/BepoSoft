import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Modal,
  ModalHeader,
  ModalBody,
  Button,
  Input,
  Table,
  Spinner,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddProduct = ({ isOpen, toggle, warehouseId, ProductsFetch }) => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [quantity, setQuantity] = useState({});
  const [lockedInvoices, setLockedInvoices] = useState({});
  const token = localStorage.getItem("token");

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_KEY}all/products/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();

      if (data && Array.isArray(data.data)) {
        setProducts(data.data);
      } else {
        setError("Data structure is not as expected");
      }
    } catch (error) {
      setError(error.message || "An error occurred while fetching products.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLockedInvoices = async (productId) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_KEY}product/${productId}/locked-invoices/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setLockedInvoices((prev) => ({
        ...prev,
        [productId]: res.data.locked_invoices || [],
      }));
    } catch (err) {
      console.error("Failed to fetch locked invoices", err);
    }
  };

  const fetchwarehouseProduct = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}warehouse/products/${warehouseId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      if (data && Array.isArray(data.data)) {
        setProducts(data.data);
      } else {
        throw new Error("Unexpected data structure received from API");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "An error occurred while fetching products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!warehouseId || warehouseId === "" || warehouseId === undefined) {
      if (isOpen) {
        fetchProducts();
      }
    } else {
      fetchwarehouseProduct();
    }
  }, [isOpen, warehouseId]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const toggleExpand = (productId) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null);
    } else {
      fetchLockedInvoices(productId);
      setExpandedProductId(productId);
    }
  };

  const handleQuantityChange = (productId, value) => {
    const parsedValue = parseInt(value, 10);
    const product = products.find(
      (p) => p.id === productId || p.variantIDs?.some((v) => v.id === productId)
    );

    const stock =
      product?.id === productId
        ? product.stock
        : product?.variantIDs.find((v) => v.id === productId)?.stock || 0;

    if (parsedValue > stock) {
      setQuantity((prev) => ({
        ...prev,
        [productId]: stock,
      }));
      alert(`Quantity cannot exceed available stock of ${stock}.`);
    } else {
      setQuantity((prev) => ({
        ...prev,
        [productId]: parsedValue,
      }));
    }
  };

  const addToCart = async (product, variant = null) => {
    const selectedId = variant ? variant.id : product.id;
    const selectedQuantity = quantity[selectedId] || 1;

    const cartItem = {
      product: selectedId,
      quantity: selectedQuantity,
    };

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_KEY}cart/product/`,
        cartItem,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        alert("Product added to cart successfully!");
        ProductsFetch();
      }
    } catch (error) {
      toast.error("Failed to add product to cart");
    }
  };

  const filteredProducts = Array.isArray(products)
    ? products.filter((product) => {
        const parentMatches =
          product.approval_status === "Approved" &&
          product.name.toLowerCase().includes(searchQuery.toLowerCase());

        const parentHasStock = product.stock > 0;

        const variantsHaveStock = Array.isArray(product.variantIDs)
          ? product.variantIDs.some((variant) => variant.stock > 0)
          : false;

        return parentMatches && (parentHasStock || variantsHaveStock);
      })
    : [];

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      size="lg"
      style={{ maxWidth: "90%", width: "90%" }}
    >
      <ModalHeader toggle={toggle}>Search Products</ModalHeader>
      <ModalBody>
        {loading ? (
          <div className="text-center">
            <Spinner />
            <p>Loading products...</p>
          </div>
        ) : error ? (
          <div className="text-center text-danger">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <Input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="mb-3"
            />
            <Table className="mt-3" responsive bordered hover>
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Locked Stock</th>
                  <th>Quantity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.flatMap((product, index) => {
                    const rows = [];

                    // Parent row
                    if (product.stock > 0) {
                      rows.push(
                        <tr
                          key={`parent-${product.id}`}
                          onClick={() => toggleExpand(product.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{index + 1}</td>
                          <td>
                            <img
                              src={`${import.meta.env.VITE_APP_IMAGE}${
                                product.image
                              }`}
                              style={{ width: "50px", height: "50px" }}
                              alt={product.name}
                            />
                          </td>
                          <td>{product.name}</td>
                          <td>₹{product.selling_price?.toFixed(2)}</td>
                          <td>{product.stock}</td>
                          <td>{product.locked_stock}</td>
                          <td>
                            <Input
                              type="number"
                              min="1"
                              max={product.stock}
                              value={quantity[product.id] || 1}
                              onChange={(e) =>
                                handleQuantityChange(product.id, e.target.value)
                              }
                              className="form-control"
                            />
                          </td>
                          <td>
                            <Button
                              color="success"
                              size="sm"
                              onClick={() => addToCart(product)}
                              disabled={product.stock === 0}
                            >
                              Add
                            </Button>
                          </td>
                        </tr>
                      );

                      if (
                        expandedProductId === product.id &&
                        lockedInvoices[product.id]?.length > 0
                      ) {
                        rows.push(
                          <tr key={`locked-${product.id}`}>
                            <td colSpan="8">
                              <div
                                style={{
                                  backgroundColor: "#f8f9fa",
                                  padding: "10px",
                                  borderRadius: "5px",
                                }}
                              >
                                <strong>🔒 Locked by Invoices:</strong>
                                <ul style={{ marginTop: 5, paddingLeft: 20 }}>
                                  {lockedInvoices[product.id].map((inv, idx) => (
                                    <li key={idx}>
                                      🧾 <b>{inv.invoice}</b> — 🔢{" "}
                                      {inv.quantity_locked}, 📦 {inv.status}, 📅{" "}
                                      {inv.order_date}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    }

                    // Variants
                    if (Array.isArray(product.variantIDs)) {
                      product.variantIDs.forEach((variant, variantIndex) => {
                        if (variant.stock > 0) {
                          rows.push(
                            <tr
                              key={`variant-${variant.id}`}
                              onClick={() => toggleExpand(variant.id)}
                              style={{ cursor: "pointer" }}
                            >
                              <td>{index + 1}.{variantIndex + 1}</td>
                              <td>
                                <img
                                  src={`${import.meta.env.VITE_APP_IMAGE}${
                                    variant.image
                                  }`}
                                  style={{ width: "50px", height: "50px" }}
                                  alt={variant.name}
                                />
                              </td>
                              <td>{variant.name}</td>
                              <td>₹{variant.selling_price?.toFixed(2)}</td>
                              <td>{variant.stock}</td>
                              <td>{variant.locked_stock}</td>
                              <td>
                                <Input
                                  type="number"
                                  min="1"
                                  max={variant.stock}
                                  value={quantity[variant.id] || 1}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      variant.id,
                                      e.target.value
                                    )
                                  }
                                  className="form-control"
                                />
                              </td>
                              <td>
                                <Button
                                  color="success"
                                  size="sm"
                                  onClick={() => addToCart(product, variant)}
                                  disabled={variant.stock === 0}
                                >
                                  Add
                                </Button>
                              </td>
                            </tr>
                          );

                          if (
                            expandedProductId === variant.id &&
                            lockedInvoices[variant.id]?.length > 0
                          ) {
                            rows.push(
                              <tr key={`locked-variant-${variant.id}`}>
                                <td colSpan="8">
                                  <div
                                    style={{
                                      backgroundColor: "#f8f9fa",
                                      padding: "10px",
                                      borderRadius: "5px",
                                    }}
                                  >
                                    <strong>🔒 Locked by Invoices:</strong>
                                    <ul
                                      style={{ marginTop: 5, paddingLeft: 20 }}
                                    >
                                      {lockedInvoices[variant.id].map(
                                        (inv, idx) => (
                                          <li key={idx}>
                                            🧾 <b>{inv.invoice}</b> — 🔢{" "}
                                            {inv.quantity_locked}, 📦 {inv.status}
                                            , 📅 {inv.order_date}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                        }
                      });
                    }

                    return rows;
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </>
        )}
      </ModalBody>
    </Modal>
  );
};

export default AddProduct;
