import React, { Fragment, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination"

const WaitingProducts = () => {
    const warehouseId = localStorage.getItem('warehouseId');
    const token = localStorage.getItem('token');
    const [waitingProducts, setWaitingProducts] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedVariants, setSelectedVariants] = useState([]);
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(10);


    useEffect(() => {
        const fetchWaitingProducts = async () => {
            if (!warehouseId) {
                return;
            }

            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}warehouse/products/${warehouseId}/`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                // Filter only disapproved products
                const disapprovedProducts = response.data.data.filter(product =>
                    product.approval_status === "Disapproved" ||
                    Array.isArray(product.variantIDs) ||
                    product.variantIDs.some(variant => variant.approval_status === "Disapproved")
                );
                setWaitingProducts(disapprovedProducts);
            } catch (error) {
                toast.error("Error fetching waiting products:");
            }
        };

        fetchWaitingProducts();
    }, [token, warehouseId, refresh]);

    const handleApprove = async (productId) => {
        try {
            await axios.put(`${import.meta.env.VITE_APP_KEY}product/update/${productId}/`,
                { approval_status: "Approved" },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );
            alert("Product approved successfully.");
            window.location.reload();
        } catch (error) {
            alert("Failed to approve product.");
        }
    };

    const handleView = (product) => {
        setSelectedVariants(product.variantIDs);
        setShowModal(true);
    };

    const handleVariantApprove = async (variantId) => {
        try {
            await axios.put(`${import.meta.env.VITE_APP_KEY}product/update/${variantId}/`,
                { approval_status: "Approved" },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            toast.success("Variant approved successfully.");

            // Update local state for the approved variant without closing modal
            setSelectedVariants((prevVariants) =>
                prevVariants.map((v) =>
                    v.id === variantId ? { ...v, approval_status: "Approved" } : v
                )
            );

            // Optional: Trigger parent refresh to refetch all products
            setRefresh(prev => !prev);

        } catch (error) {
            toast.error("Failed to approve variant.");
        }
    };

    const indexOfLastProduct = currentPage * perPage;
    const indexOfFirstProduct = indexOfLastProduct - perPage;
    const currentProducts = waitingProducts.slice(indexOfFirstProduct, indexOfLastProduct);

    return (
        <Fragment>
            <div className="page-content">
                <div className="container-fluid">

                    <Breadcrumbs title="Tables" breadcrumbItem="Products Waiting for Approval" />

                    {warehouseId ? (
                        waitingProducts.length > 0 ? (
                            <div>
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>IMAGE</th>
                                            <th>PRODUCT NAME</th>
                                            <th>STOCK</th>
                                            <th>ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentProducts.map((product, index) => (
                                            <tr key={product.id}>
                                                <td>{indexOfFirstProduct + index + 1}</td>
                                                <td>
                                                    <img
                                                        src={`${import.meta.env.VITE_APP_IMAGE}${product.image}`}
                                                        alt={product.name || "Product image"}
                                                        style={{ width: "50px", height: "50px" }}
                                                    />
                                                </td>
                                                <td>{product.name}</td>
                                                <td>{product.stock}</td>
                                                <td>
                                                    {(!product.variantIDs || product.variantIDs.length === 0) ? (
                                                        product.approval_status !== "Approved" ? (
                                                            <button
                                                                className="btn btn-success"
                                                                onClick={() => handleApprove(product.id)}
                                                            >
                                                                Approve
                                                            </button>
                                                        ) : (
                                                            <span className="badge bg-success">Approved</span>
                                                        )
                                                    ) : (
                                                        <>
                                                            {product.approval_status !== "Approved" ? (
                                                                <button
                                                                    className="btn btn-success"
                                                                    onClick={() => handleApprove(product.id)}
                                                                >
                                                                    Approve
                                                                </button>
                                                            ) : (
                                                                <span className="badge bg-success">Approved</span>
                                                            )}
                                                            <button
                                                                className="btn btn-primary me-2 m-2"
                                                                onClick={() => handleView(product)}
                                                            >
                                                                View
                                                            </button>
                                                        </>

                                                    )}

                                                </td>

                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <Paginations
                                    perPageData={perPage}
                                    data={waitingProducts}
                                    currentPage={currentPage}
                                    setCurrentPage={setCurrentPage}
                                    isShowingPageLength={true}
                                    paginationDiv="col-auto"
                                    paginationClass="pagination-sm"
                                    indexOfFirstItem={indexOfFirstProduct}
                                    indexOfLastItem={indexOfLastProduct}
                                />
                            </div>
                        ) : (
                            <p style={{ textAlign: "center" }}>No disapproved products found.</p>
                        )
                    ) : (
                        <p style={{ textAlign: "center", color: "red" }}>No warehouse ID found.</p>
                    )}
                </div>
            </div>
            {showModal && (
                <div className="modal show d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-lg" role="document">
                        <div className="modal-content" style={{ border: "2px solid black" }}>
                            <div className="modal-header">
                                <h5 className="modal-title">Product Variants</h5>
                                <button type="button" className="close" onClick={() => setShowModal(false)}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                {selectedVariants.length > 0 ? (
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>NAME</th>
                                                <th>COLOR</th>
                                                <th>STOCK</th>
                                                <th>WHOLESALE PRICE</th>
                                                <th>RETAIL PRICE</th>
                                                <th>IMAGE</th>
                                                <th>ACTION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedVariants.map((variant) => (
                                                <tr key={variant.id}>
                                                    <td>{variant.name}</td>
                                                    <td>{variant.color || "N/A"}</td>
                                                    <td>{variant.stock}</td>
                                                    <td>{variant.selling_price}</td>
                                                    <td>{variant.retail_price}</td>
                                                    <img
                                                        src={`${import.meta.env.VITE_APP_IMAGE}${variant.image}`}
                                                        alt={variant.name || "Product image"}
                                                        style={{ width: "50px", height: "50px" }}
                                                    />
                                                    <td>
                                                        {variant.approval_status !== "Approved" ? (
                                                            <button
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => handleVariantApprove(variant.id)}
                                                            >
                                                                Approve
                                                            </button>
                                                        ) : (
                                                            <span className="badge bg-success">Approved</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p>No variants available.</p>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </Fragment>
    );
};

export default WaitingProducts;
