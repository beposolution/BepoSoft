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
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddProduct = ({ isOpen, toggle, ProductsFetch }) => {
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState({});

    const [role, setRole] = useState(null);
    const token = localStorage.getItem("token");

    const [lockedInvoices, setLockedInvoices] = useState({});
    const [expandedProductId, setExpandedProductId] = useState(null);
    const [lockedInvoicesLoading, setLockedInvoicesLoading] = useState({});

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

    // products in invoices
    const fetchLockedInvoices = async (productId) => {
        setLockedInvoicesLoading((prev) => ({
            ...prev,
            [productId]: true,
        }));

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}product/${productId}/locked-invoices/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setLockedInvoices((prev) => ({
                ...prev,
                [productId]: response?.data?.locked_invoices || [],
            }));
        } catch (error) {
            console.error("Failed to fetch locked invoices:", error);

            setLockedInvoices((prev) => ({
                ...prev,
                [productId]: [],
            }));
        } finally {
            setLockedInvoicesLoading((prev) => ({
                ...prev,
                [productId]: false,
            }));
        }
    };

    const toggleProductDetails = (productId) => {
        if (expandedProductId === productId) {
            setExpandedProductId(null);
            return;
        }

        setExpandedProductId(productId);

        if (!lockedInvoices[productId]) {
            fetchLockedInvoices(productId);
        }
    };

    const fetchProducts = async (search = "") => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}all/products/get/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    params: {
                        search: search,
                    },
                }
            );

            const data = response.data;

            if (data && Array.isArray(data.results)) {
                setProducts(data.results);
            } else {
                setProducts([]);
                setError("No products found");
            }
        } catch (error) {
            console.error("Product fetch error:", error);
            setError(error.message || "An error occurred while fetching products.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            fetchProducts(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleQuantityChange = (productId, value) => {
        const cleanValue = parseInt(value, 10);

        setQuantity((prev) => ({
            ...prev,
            [productId]: cleanValue > 0 ? cleanValue : 1,
        }));
    };

    const addToCart = async (product) => {
        const selectedQuantity = quantity[product.id] || 1;
        const availableStock = Number(product.available_stock || 0);

        if (!product?.id) {
            toast.error("Invalid product selected");
            return;
        }

        if (availableStock <= 0) {
            toast.error("No available stock");
            return;
        }

        if (selectedQuantity > availableStock) {
            toast.error(`Only ${availableStock} available stock`);
            return;
        }

        const cartItem = {
            product: product.id,
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

            if (response.status === 201 || response.status === 200) {
                ProductsFetch();
                toast.success("Product added to cart successfully!");
            }
        } catch (error) {
            console.error("Add to cart error:", error);

            toast.error(
                error?.response?.data?.message ||
                "Failed to add product to cart"
            );
        }
    };

    const filteredProducts = Array.isArray(products) ? products : [];

    const formatPrice = (price) => {
        const value = Number(price);
        return Number.isFinite(value) ? value.toFixed(2) : "0.00";
    };

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
                    <div className="text-center py-4">
                        <Spinner />
                        <p className="mt-2 mb-0">Loading products...</p>
                    </div>
                ) : error ? (
                    <div className="text-center text-danger py-3">
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


                                    {(role === "Accounts / Accounting" ||
                                        role === "CEO" ||
                                        role === "COO" ||
                                        role === "ADMIN") && (
                                            <th>Stock</th>
                                        )}

                                    <th>Available Stock</th>

                                    <th>Quantity</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            {/* <tbody>
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product, index) => (
                                        <tr key={product.id}>
                                            <td>{index + 1}</td>

                                            <td>
                                                {product.image ? (
                                                    <img
                                                        src={`${import.meta.env.VITE_APP_IMAGE}${product.image}`}
                                                        alt={product.name || "Product image"}
                                                        style={{
                                                            width: "50px",
                                                            height: "50px",
                                                            objectFit: "cover",
                                                            borderRadius: "6px",
                                                        }}
                                                    />
                                                ) : (
                                                    <span>No Image</span>
                                                )}
                                            </td>

                                            <td>{product.name || "Unknown Product"}</td>

                                            <td>₹{formatPrice(product.selling_price)}</td>

                                            {(role === "Accounts" ||
                                                role === "CEO" ||
                                                role === "COO") && (
                                                    <td>
                                                        {Number(product.stock || 0)}
                                                    </td>
                                                )}

                                            <td>
                                                {Number(product.available_stock || 0)}
                                            </td>

                                            <td>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max={Number(product.available_stock || 0)}
                                                    value={quantity[product.id] || 1}
                                                    onChange={(e) =>
                                                        handleQuantityChange(
                                                            product.id,
                                                            e.target.value
                                                        )
                                                    }
                                                    className="form-control"
                                                    placeholder="Quantity"
                                                />
                                            </td>

                                            <td>
                                                <Button
                                                    color="success"
                                                    size="sm"
                                                    onClick={() => addToCart(product)}
                                                    disabled={
                                                        Number(product.available_stock || 0) <= 0
                                                    }
                                                >
                                                    Add
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={
                                                role === "Accounts" ||
                                                    role === "CEO" ||
                                                    role === "COO"
                                                    ? "8"
                                                    : "7"
                                            }
                                            className="text-center"
                                        >
                                            No products found.
                                        </td>
                                    </tr>
                                )}
                            </tbody> */}

                            <tbody>
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product, index) => (
                                        <React.Fragment key={product.id}>

                                            {/* PRODUCT ROW */}
                                            <tr
                                                onClick={() => toggleProductDetails(product.id)}
                                                style={{ cursor: "pointer" }}
                                            >
                                                <td>{index + 1}</td>

                                                <td>
                                                    {product.image ? (
                                                        <img
                                                            src={`${import.meta.env.VITE_APP_IMAGE}${product.image}`}
                                                            alt={product.name || "Product image"}
                                                            style={{
                                                                width: "50px",
                                                                height: "50px",
                                                                objectFit: "cover",
                                                                borderRadius: "6px",
                                                            }}
                                                        />
                                                    ) : (
                                                        <span>No Image</span>
                                                    )}
                                                </td>

                                                <td>{product.name || "Unknown Product"}</td>

                                                <td>
                                                    ₹{formatPrice(product.selling_price)}
                                                </td>

                                                {(role === "Accounts / Accounting" ||
                                                    role === "CEO" ||
                                                    role === "COO" ||
                                                    role === "ADMIN") && (
                                                        <td>{Number(product.stock || 0)}</td>
                                                    )}

                                                <td>
                                                    {Number(product.available_stock || 0)}
                                                </td>

                                                <td>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max={Number(product.available_stock || 0)}
                                                        value={quantity[product.id] || 1}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) =>
                                                            handleQuantityChange(
                                                                product.id,
                                                                e.target.value
                                                            )
                                                        }
                                                        className="form-control"
                                                        placeholder="Quantity"
                                                    />
                                                </td>

                                                <td>
                                                    <Button
                                                        color="success"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addToCart(product);
                                                        }}
                                                        disabled={
                                                            Number(product.available_stock || 0) <= 0
                                                        }
                                                    >
                                                        Add
                                                    </Button>
                                                </td>
                                            </tr>

                                            {/* LOCKED INVOICE DETAILS */}
                                            {expandedProductId === product.id && (
                                                <tr>
                                                    <td
                                                        colSpan={
                                                            role === "Accounts" ||
                                                                role === "CEO" ||
                                                                role === "COO"
                                                                ? 8
                                                                : 7
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                backgroundColor: "#f8f9fa",
                                                                padding: "12px 15px",
                                                                borderRadius: "5px",
                                                            }}
                                                        >
                                                            <strong>
                                                                🔒 Product in Invoices:
                                                            </strong>

                                                            {lockedInvoicesLoading[product.id] ? (
                                                                <div className="mt-2">
                                                                    <Spinner size="sm" /> Loading...
                                                                </div>
                                                            ) : lockedInvoices[product.id]?.length > 0 ? (
                                                                <ul
                                                                    style={{
                                                                        marginTop: "8px",
                                                                        marginBottom: 0,
                                                                        paddingLeft: "20px",
                                                                    }}
                                                                >
                                                                    {lockedInvoices[product.id].map(
                                                                        (inv, idx) => (
                                                                            <li key={idx}>
                                                                                🧾 <b>{inv.invoice}</b>
                                                                                {" — "}
                                                                                Quantity:{" "}
                                                                                <b>{inv.quantity_locked}</b>
                                                                                {" | "}
                                                                                Status:{" "}
                                                                                <b>{inv.status}</b>
                                                                                {" | "}
                                                                                Date:{" "}
                                                                                <b>{inv.order_date}</b>
                                                                            </li>
                                                                        )
                                                                    )}
                                                                </ul>
                                                            ) : (
                                                                <div className="mt-2">
                                                                    No locked invoices for this product.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}

                                        </React.Fragment>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={
                                                role === "Accounts" ||
                                                    role === "CEO" ||
                                                    role === "COO"
                                                    ? 8
                                                    : 7
                                            }
                                            className="text-center"
                                        >
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