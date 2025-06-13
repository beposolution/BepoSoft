import React, { useState, useEffect } from "react";
import axios from "axios"; // Import Axios
import { useParams } from "react-router-dom";

import {
    Modal,
    ModalHeader,
    ModalBody,
    Button,
    Input,
    Table,
    Spinner,
    Collapse,
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem
} from "reactstrap";

const AddProduct = ({ isOpen, toggle, onSelectProduct, onCartUpdate }) => {
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedProductId, setExpandedProductId] = useState(null);
    const [selectedSize, setSelectedSize] = useState({});
    const [quantity, setQuantity] = useState({});
    const token = localStorage.getItem("token");
    const { id } = useParams();


    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}products/`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch products");
            }

            const data = await response.json();
            setProducts(data.data);
        } catch (error) {
            setError("An error occurred while fetching products.");
        } finally {
            setLoading(false);
        }
    };

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

    // Function to handle size selection
    // Function to handle size selection
    const handleSizeSelect = (variantId, sizeId) => {
        // Find the selected size object based on the provided sizeId
        const variant = products.find(product =>
            product.variant_products.some(variant => variant.id === variantId)
        )?.variant_products.find(variant => variant.id === variantId);
        const selectedSizeObject = variant?.sizes.find((size) => size.id === sizeId);

        if (selectedSizeObject) {
            // Update the state with the selected size for the specific variant
            setSelectedSize((prevState) => ({
                ...prevState,
                [variantId]: {
                    ...selectedSizeObject,
                    isOpen: false, // Close the dropdown after selection
                },
            }));
        }
    };

    // Function to toggle the dropdown
    const toggleDropdown = (variantId) => {
        setSelectedSize((prevState) => ({
            ...prevState,
            [variantId]: {
                ...prevState[variantId],
                isOpen: !prevState[variantId]?.isOpen, // Toggle the dropdown open/close state
            },
        }));
    };



    const handleQuantityChange = (productId, value) => {
        setQuantity((prev) => ({
            ...prev,
            [productId]: value,
        }));
    };

    const addToCart = async (product, variant = null) => {
        // Prepare the cart item data based on the product type
        const cartItem = {
            product: product.id,
            quantity: variant ? quantity[variant.id] || 1 : quantity[product.id] || 1,
        };

        // Log the product ID and quantity
        console.log("Product ID:", product.id);
        console.log("Quantity:", quantity[product.id] || 1);

        // If the product is a variant, add the variant ID
        if (variant) {
            cartItem.variant = variant.id;
             // Include the variant ID

            // Log the variant ID
            console.log("Variant ID:", variant.id);

            // If the product has a size variant selected, include the size ID
            const selectedSizeForVariant = selectedSize[variant.id];
            if (selectedSizeForVariant) {
                cartItem.size = selectedSizeForVariant.id; // Include the size ID if selected

                // Log the selected size ID
                console.log("Selected Size ID:", selectedSizeForVariant.id);
            }
        }

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_APP_KEY}add/order/${id}/product/`,
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
                onCartUpdate();
            }
        } catch (error) {
            console.error("Failed to add product to cart", error);
        }
    };


    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                                    {filteredProducts.some(product => product.type === "single") && <th>Quantity</th>}
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.length > 0 ? (
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
                                                <td>₹{product.selling_price.toFixed(2)}</td>
                                                <td>{product.stock}</td>
                                                {product.type === "single" && (
                                                    <td>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={quantity[product.id] || 1}
                                                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                                            className="form-control"
                                                            placeholder="Quantity"
                                                        />
                                                    </td>
                                                )}
                                                <td>
                                                    {product.type === "single" ? (
                                                        <Button
                                                            color="success"
                                                            size="sm"
                                                            onClick={() => addToCart(product)}
                                                            disabled={product.stock === 0} // Disable if stock is 0
                                                        >
                                                            Add
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            color="info"
                                                            size="sm"
                                                            onClick={() => toggleExpand(product.id)}
                                                        >
                                                            {expandedProductId === product.id ? "Hide Variants" : "Show Variants"}
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                            {product.type === "variant" && (
                                                <tr>
                                                    <td colSpan={7} className="p-0">
                                                        <Collapse isOpen={expandedProductId === product.id}>
                                                            <Table size="sm" className="mb-0" bordered>
                                                                <thead>
                                                                    <tr>
                                                                        <th>#</th>
                                                                        <th>Image</th>
                                                                        <th>Variant Name</th>
                                                                        <th>Color</th>
                                                                        <th>Size</th>
                                                                        <th>Stock</th>
                                                                        <th>Quantity</th>
                                                                        <th>Action</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {product.variant_products.map((variant, variantIndex) => (
                                                                        <tr key={variant.id}>
                                                                            <td>{variantIndex + 1}</td>
                                                                            <td>
                                                                                <img
                                                                                    src={variant.variant_images && variant.variant_images.length > 0
                                                                                        ? `${variant.variant_images[0].image}`
                                                                                        : "https://via.placeholder.com/50"
                                                                                    }
                                                                                    alt={variant.name}
                                                                                    style={{ width: "50px", height: "50px", objectFit: "cover" }}
                                                                                />
                                                                            </td>
                                                                            <td>{variant.name}</td>
                                                                            <td>{variant.color}</td>
                                                                            <td>
                                                                                {variant.is_variant ? (
                                                                                    <Dropdown
                                                                                        isOpen={selectedSize[variant.id]?.isOpen || false}
                                                                                        toggle={() => toggleDropdown(variant.id)} // Use toggleDropdown here
                                                                                    >
                                                                                        <DropdownToggle caret>
                                                                                            {selectedSize[variant.id]?.attribute || "Select Size"}
                                                                                        </DropdownToggle>
                                                                                        <DropdownMenu>
                                                                                            {variant.sizes.map((size) => (
                                                                                                <DropdownItem
                                                                                                    key={size.id}
                                                                                                    onClick={() => handleSizeSelect(variant.id, size.id)} // Select size on click
                                                                                                >
                                                                                                    {size.attribute} - Stock: {size.stock}
                                                                                                </DropdownItem>
                                                                                            ))}
                                                                                        </DropdownMenu>
                                                                                    </Dropdown>

                                                                                ) : (
                                                                                    <span>{variant.color}</span>
                                                                                )}
                                                                            </td>
                                                                            <td>
                                                                                {variant.is_variant && selectedSize[variant.id]
                                                                                    ? selectedSize[variant.id].stock
                                                                                    : !variant.is_variant
                                                                                        ? variant.stock
                                                                                        : "N/A"}
                                                                            </td>
                                                                            <td>
                                                                                <Input
                                                                                    type="number"
                                                                                    min="1"
                                                                                    value={quantity[variant.id] || 1}
                                                                                    onChange={(e) => handleQuantityChange(variant.id, e.target.value)}
                                                                                    className="form-control"
                                                                                    placeholder="Quantity"
                                                                                />
                                                                            </td>
                                                                            <td>
                                                                                <Button
                                                                                    color="success"
                                                                                    size="sm"
                                                                                    onClick={() => addToCart(product, variant)}
                                                                                >
                                                                                    Add
                                                                                </Button>
                                                                            </td>

                                                                            {/* <td>
                                                                                {variant.is_variant && (
                                                                                    <Button
                                                                                        color="success"
                                                                                        size="sm"
                                                                                        onClick={() => addToCart(product, variant)}
                                                                                        disabled={!selectedSize[variant.id] || selectedSize[variant.id].stock === 0}
                                                                                    >
                                                                                        Add
                                                                                    </Button>
                                                                                )}
                                                                            </td> */}

                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </Table>
                                                        </Collapse>
                                                    </td>
                                                </tr>
                                            )}
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
