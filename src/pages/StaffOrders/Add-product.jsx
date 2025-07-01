import React, { useState, useEffect } from "react";
import axios from "axios"; // Import Axios
import {
    Modal,
    ModalHeader,
    ModalBody,
    Button,
    Input,
    Table,
    Spinner,
    Collapse,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddProduct = ({ isOpen, toggle }) => {
    const [products, setProducts] = useState([]); // Initialize products state with an empty array
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedProductId, setExpandedProductId] = useState(null);
    const [quantity, setQuantity] = useState({});
    const token = localStorage.getItem("token");
    const [userData, setUserData] = useState("");
    const [sortedProducts, setSortedProducts] = useState([]);

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}all/products/`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch products");
            }

            const data = await response.json();// Log the data to verify

            // Ensure the data is an array and properly set it
            if (data && Array.isArray(data.data)) {
                setProducts(data.data);
            } else {
                setError('Data structure is not as expected');
            }

        } catch (error) {
            toast.error("Error fetching products");
            setError(error.message || "An error occurred while fetching products.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}profile/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(response?.data?.data?.warehouse_id);
            } catch (error) {
                toast.error('Error fetching user data');
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        const fetchSortedProducts = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}warehouse/products/${userData}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSortedProducts(response?.data)
            } catch (error) {
                toast.error("Error fetching sorted products. ")
            }
        }
        fetchSortedProducts();
    });

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
        }
    }, [isOpen]);

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const toggleExpand = (productId) => {
        setExpandedProductId(expandedProductId === productId ? null : productId);
    };

    const handleQuantityChange = (productId, value) => {
        setQuantity((prev) => ({
            ...prev,
            [productId]: value,
        }));
    };

    const addToCart = async (product, variant = null) => {
        const selectedQuantity = variant ? quantity[variant.id] || 1 : quantity[product.id] || 1;

        // Check if the entered quantity is greater than available stock
        if (selectedQuantity > product.stock) {
            alert("Entered quantity is greater than available stock.");
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

            if (response.status === 201) {
                alert("Product added to cart successfully!");
            }
        } catch (error) {
            toast.error("Failed to add product to cart");
        }
    };


    // Filter products based on the search query
    const filteredProducts = Array.isArray(products)
        ? products.filter(
            (product) =>
                product.approval_status === "Approved" &&
                product.stock > 0 &&
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg" style={{ maxWidth: "90%", width: "90%" }}>
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
                                    <th>Quantity</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.length >= 0 ? (
                                    filteredProducts.map((product, index) => (
                                        <React.Fragment key={product.id}>
                                            <tr>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <img
                                                        src={`${import.meta.env.VITE_APP_IMAGE}${product.image}`}
                                                        alt={product.name}
                                                        style={{ width: "50px", height: "50px", objectFit: "cover" }}
                                                    />
                                                </td>
                                                <td>{product.name}</td>
                                                <td>₹{product.selling_price ? product.selling_price.toFixed(2) : "N/A"}</td>
                                                <td>{product.stock || 0}</td>
                                                <td>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={quantity[product.id] || 1}
                                                        onChange={(e) =>
                                                            handleQuantityChange(product.id, e.target.value)
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
                                                        disabled={product.stock === 0}
                                                    >
                                                        Add
                                                    </Button>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center">
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
