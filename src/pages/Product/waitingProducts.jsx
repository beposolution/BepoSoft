import React, { Fragment, useState, useEffect } from "react";
import axios from "axios";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const WaitingProducts = () => {
    const warehouseId = localStorage.getItem("warehouseId");
    const token = localStorage.getItem("token");

    const [waitingProducts, setWaitingProducts] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedVariants, setSelectedVariants] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    const [count, setCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [previousPage, setPreviousPage] = useState(null);
    const [loading, setLoading] = useState(false);

    const perPage = 50;

    const apiBaseUrl = import.meta.env.VITE_APP_KEY;
    const apiBaseImageUrl = import.meta.env.VITE_APP_IMAGE;

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchWaitingProducts();
        }, 400);

        return () => clearTimeout(delayDebounce);
    }, [token, warehouseId, refresh, currentPage, searchTerm]);

    const fetchWaitingProducts = async () => {
        if (!warehouseId) {
            return;
        }

        try {
            setLoading(true);

            const apiUrl = `${apiBaseUrl}warehouse/products/${warehouseId}/get/`;

            const response = await axios.get(apiUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    page: currentPage,
                    search: searchTerm,
                },
            });

            const productsData = response.data?.results?.data || [];

            setWaitingProducts(productsData);
            setCount(response.data?.count || 0);
            setNextPage(response.data?.next || null);
            setPreviousPage(response.data?.previous || null);
        } catch (error) {
            toast.error("Error fetching waiting products.");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (productId) => {
        try {
            await axios.put(
                `${apiBaseUrl}product/update/${productId}/`,
                { approval_status: "Approved" },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast.success("Product approved successfully.");
            setRefresh((prev) => !prev);
        } catch (error) {
            toast.error("Failed to approve product.");
        }
    };

    const handleView = (product) => {
        setSelectedVariants(product.variantIDs || []);
        setShowModal(true);
    };

    const handleVariantApprove = async (variantId) => {
        try {
            await axios.put(
                `${apiBaseUrl}product/update/${variantId}/`,
                { approval_status: "Approved" },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast.success("Variant approved successfully.");

            setSelectedVariants((prevVariants) =>
                prevVariants.map((v) =>
                    v.id === variantId ? { ...v, approval_status: "Approved" } : v
                )
            );

            setRefresh((prev) => !prev);
        } catch (error) {
            toast.error("Failed to approve variant.");
        }
    };

    const totalPages = Math.ceil(count / perPage);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handlePreviousPage = () => {
        if (previousPage && currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    const handleNextPage = () => {
        if (nextPage) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const getPendingCount = () => {
        return waitingProducts.filter(
            (product) => product.approval_status !== "Approved"
        ).length;
    };

    const getApprovedCount = () => {
        return waitingProducts.filter(
            (product) => product.approval_status === "Approved"
        ).length;
    };

    const getVariantProductCount = () => {
        return waitingProducts.filter(
            (product) => product.variantIDs && product.variantIDs.length > 0
        ).length;
    };

    const renderProductImage = (image, name) => {
        return (
            <div
                style={{
                    width: "58px",
                    height: "58px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    background: "#f3f6f9",
                    border: "1px solid #edf0f4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <img
                    src={image ? `${apiBaseImageUrl}${image}` : "/no-image.png"}
                    alt={name || "Product image"}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            </div>
        );
    };

    const renderVariantImage = (image, name) => {
        return (
            <div
                style={{
                    width: "54px",
                    height: "54px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    background: "#f3f6f9",
                    border: "1px solid #edf0f4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <img
                    src={image ? `${apiBaseImageUrl}${image}` : "/no-image.png"}
                    alt={name || "Product image"}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            </div>
        );
    };

    document.title = "Products Waiting for Approval | BEPOSOFT";

    return (
        <Fragment>
            <div className="page-content" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
                <div className="container-fluid">
                    {/* <Breadcrumbs title="CRM" breadcrumbItem="Products Waiting for Approval" /> */}

                    <div
                        className="card border-0 mb-4"
                        style={{
                            borderRadius: "22px",
                            background:
                                "linear-gradient(135deg, #1f2937 0%, #334155 45%, #0f172a 100%)",
                            boxShadow: "0 12px 35px rgba(15, 23, 42, 0.18)",
                            overflow: "hidden",
                        }}
                    >
                        <div className="card-body p-4">
                            <div className="row align-items-center">
                                <div className="col-lg-8">
                                    <div className="d-flex align-items-center gap-3">
                                        <div
                                            style={{
                                                width: "58px",
                                                height: "58px",
                                                borderRadius: "18px",
                                                background: "rgba(255,255,255,0.12)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#fff",
                                                fontSize: "26px",
                                            }}
                                        >
                                            <i className="bx bx-package"></i>
                                        </div>

                                        <div>
                                            <h4 className="mb-1 text-white fw-bold">
                                                Product Approval Center
                                            </h4>
                                            <p className="mb-0" style={{ color: "rgba(255,255,255,0.72)" }}>
                                                Review warehouse products, approve items, and manage variants from one CRM workspace.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-4 mt-4 mt-lg-0">
                                    <div
                                        className="d-flex justify-content-lg-end gap-2 flex-wrap"
                                    >

                                        <span
                                            className="badge"
                                            style={{
                                                background: "rgba(34,197,94,0.18)",
                                                color: "#bbf7d0",
                                                padding: "10px 14px",
                                                borderRadius: "999px",
                                                fontSize: "13px",
                                                fontWeight: 500,
                                            }}
                                        >
                                            Total: {count}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {warehouseId ? (
                        <div>
                            <div className="row mb-4">
                                <div className="col-xl-3 col-md-6 mb-3">
                                    <div
                                        className="card border-0 h-100"
                                        style={{
                                            borderRadius: "18px",
                                            boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)",
                                        }}
                                    >
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    <p className="text-muted mb-1">Total Products</p>
                                                    <h3 className="mb-0 fw-bold">{count}</h3>
                                                </div>
                                                <div
                                                    style={{
                                                        width: "48px",
                                                        height: "48px",
                                                        borderRadius: "15px",
                                                        background: "#eef2ff",
                                                        color: "#4f46e5",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: "24px",
                                                    }}
                                                >
                                                    <i className="bx bx-grid-alt"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-3 col-md-6 mb-3">
                                    <div
                                        className="card border-0 h-100"
                                        style={{
                                            borderRadius: "18px",
                                            boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)",
                                        }}
                                    >
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    <p className="text-muted mb-1">Pending This Page</p>
                                                    <h3 className="mb-0 fw-bold">{getPendingCount()}</h3>
                                                </div>
                                                <div
                                                    style={{
                                                        width: "48px",
                                                        height: "48px",
                                                        borderRadius: "15px",
                                                        background: "#fff7ed",
                                                        color: "#f97316",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: "24px",
                                                    }}
                                                >
                                                    <i className="bx bx-time-five"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-3 col-md-6 mb-3">
                                    <div
                                        className="card border-0 h-100"
                                        style={{
                                            borderRadius: "18px",
                                            boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)",
                                        }}
                                    >
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    <p className="text-muted mb-1">Approved This Page</p>
                                                    <h3 className="mb-0 fw-bold">{getApprovedCount()}</h3>
                                                </div>
                                                <div
                                                    style={{
                                                        width: "48px",
                                                        height: "48px",
                                                        borderRadius: "15px",
                                                        background: "#ecfdf5",
                                                        color: "#10b981",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: "24px",
                                                    }}
                                                >
                                                    <i className="bx bx-check-circle"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-3 col-md-6 mb-3">
                                    <div
                                        className="card border-0 h-100"
                                        style={{
                                            borderRadius: "18px",
                                            boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)",
                                        }}
                                    >
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    <p className="text-muted mb-1">With Variants</p>
                                                    <h3 className="mb-0 fw-bold">{getVariantProductCount()}</h3>
                                                </div>
                                                <div
                                                    style={{
                                                        width: "48px",
                                                        height: "48px",
                                                        borderRadius: "15px",
                                                        background: "#fdf2f8",
                                                        color: "#db2777",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: "24px",
                                                    }}
                                                >
                                                    <i className="bx bx-layer"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="card border-0"
                                style={{
                                    borderRadius: "22px",
                                    boxShadow: "0 10px 35px rgba(15, 23, 42, 0.08)",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    className="card-header border-0"
                                    style={{
                                        background: "#fff",
                                        padding: "22px 24px",
                                    }}
                                >
                                    <div className="row align-items-center">
                                        <div className="col-lg-6">
                                            <h5 className="mb-1 fw-bold text-dark">
                                                Waiting Products
                                            </h5>
                                            <p className="text-muted mb-0">
                                                Approve products and verify variant-level details.
                                            </p>
                                        </div>

                                        <div className="col-lg-6 mt-3 mt-lg-0">
                                            <div className="d-flex justify-content-lg-end">
                                                <div
                                                    className="position-relative"
                                                    style={{ width: "100%", maxWidth: "380px" }}
                                                >
                                                    <i
                                                        className="bx bx-search"
                                                        style={{
                                                            position: "absolute",
                                                            left: "16px",
                                                            top: "50%",
                                                            transform: "translateY(-50%)",
                                                            color: "#94a3b8",
                                                            fontSize: "20px",
                                                        }}
                                                    ></i>

                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Search by product name & hsn..."
                                                        value={searchTerm}
                                                        onChange={handleSearchChange}
                                                        style={{
                                                            borderRadius: "14px",
                                                            padding: "12px 16px 12px 45px",
                                                            border: "1px solid #e5e7eb",
                                                            background: "#f8fafc",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-body p-0">
                                    {loading ? (
                                        <div className="p-4">
                                            {[1, 2, 3, 4, 5].map((item) => (
                                                <div
                                                    key={item}
                                                    className="d-flex align-items-center mb-3"
                                                    style={{
                                                        padding: "16px",
                                                        background: "#f8fafc",
                                                        borderRadius: "16px",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: "58px",
                                                            height: "58px",
                                                            borderRadius: "14px",
                                                            background: "#e5e7eb",
                                                        }}
                                                    ></div>

                                                    <div className="flex-grow-1 ms-3">
                                                        <div
                                                            style={{
                                                                height: "14px",
                                                                width: "40%",
                                                                background: "#e5e7eb",
                                                                borderRadius: "10px",
                                                                marginBottom: "10px",
                                                            }}
                                                        ></div>
                                                        <div
                                                            style={{
                                                                height: "12px",
                                                                width: "25%",
                                                                background: "#edf2f7",
                                                                borderRadius: "10px",
                                                            }}
                                                        ></div>
                                                    </div>

                                                    <div
                                                        style={{
                                                            width: "100px",
                                                            height: "34px",
                                                            background: "#e5e7eb",
                                                            borderRadius: "10px",
                                                        }}
                                                    ></div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : waitingProducts.length > 0 ? (
                                        <>
                                            <div className="table-responsive">
                                                <table className="table align-middle mb-0">
                                                    <thead>
                                                        <tr
                                                            style={{
                                                                background: "#f8fafc",
                                                                borderTop: "1px solid #edf0f4",
                                                            }}
                                                        >
                                                            <th
                                                                style={{
                                                                    padding: "16px 22px",
                                                                    color: "#64748b",
                                                                    fontSize: "12px",
                                                                    letterSpacing: "0.04em",
                                                                    textTransform: "uppercase",
                                                                    borderBottom: "1px solid #edf0f4",
                                                                }}
                                                            >
                                                                #
                                                            </th>
                                                            <th
                                                                style={{
                                                                    padding: "16px 22px",
                                                                    color: "#64748b",
                                                                    fontSize: "12px",
                                                                    letterSpacing: "0.04em",
                                                                    textTransform: "uppercase",
                                                                    borderBottom: "1px solid #edf0f4",
                                                                }}
                                                            >
                                                                Product
                                                            </th>
                                                            <th
                                                                style={{
                                                                    padding: "16px 22px",
                                                                    color: "#64748b",
                                                                    fontSize: "12px",
                                                                    letterSpacing: "0.04em",
                                                                    textTransform: "uppercase",
                                                                    borderBottom: "1px solid #edf0f4",
                                                                }}
                                                            >
                                                                Stock
                                                            </th>
                                                            <th
                                                                style={{
                                                                    padding: "16px 22px",
                                                                    color: "#64748b",
                                                                    fontSize: "12px",
                                                                    letterSpacing: "0.04em",
                                                                    textTransform: "uppercase",
                                                                    borderBottom: "1px solid #edf0f4",
                                                                }}
                                                            >
                                                                Variants
                                                            </th>
                                                            <th
                                                                style={{
                                                                    padding: "16px 22px",
                                                                    color: "#64748b",
                                                                    fontSize: "12px",
                                                                    letterSpacing: "0.04em",
                                                                    textTransform: "uppercase",
                                                                    borderBottom: "1px solid #edf0f4",
                                                                }}
                                                            >
                                                                Status
                                                            </th>
                                                            <th
                                                                className="text-end"
                                                                style={{
                                                                    padding: "16px 22px",
                                                                    color: "#64748b",
                                                                    fontSize: "12px",
                                                                    letterSpacing: "0.04em",
                                                                    textTransform: "uppercase",
                                                                    borderBottom: "1px solid #edf0f4",
                                                                }}
                                                            >
                                                                Action
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {waitingProducts.map((product, index) => (
                                                            <tr
                                                                key={product.id}
                                                                style={{
                                                                    borderBottom: "1px solid #f1f5f9",
                                                                }}
                                                            >
                                                                <td
                                                                    style={{
                                                                        padding: "18px 22px",
                                                                        color: "#64748b",
                                                                        fontWeight: 600,
                                                                    }}
                                                                >
                                                                    {(currentPage - 1) * perPage + index + 1}
                                                                </td>

                                                                <td style={{ padding: "18px 22px" }}>
                                                                    <div className="d-flex align-items-center">
                                                                        {renderProductImage(product.image, product.name)}

                                                                        <div className="ms-3">
                                                                            <h6 className="mb-1 fw-bold text-dark">
                                                                                {product.name || "Unnamed Product"}
                                                                            </h6>

                                                                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                                                                <span
                                                                                    style={{
                                                                                        fontSize: "12px",
                                                                                        color: "#64748b",
                                                                                    }}
                                                                                >
                                                                                    HSN: {product.hsn_code}
                                                                                </span>

                                                                                {product.variantIDs &&
                                                                                    product.variantIDs.length > 0 && (
                                                                                        <span
                                                                                            className="badge"
                                                                                            style={{
                                                                                                background: "#eef2ff",
                                                                                                color: "#4f46e5",
                                                                                                borderRadius: "999px",
                                                                                                padding: "6px 9px",
                                                                                            }}
                                                                                        >
                                                                                            Variant Product
                                                                                        </span>
                                                                                    )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                <td style={{ padding: "18px 22px" }}>
                                                                    <span
                                                                        className="badge"
                                                                        style={{
                                                                            background: "#f1f5f9",
                                                                            color: "#334155",
                                                                            borderRadius: "999px",
                                                                            padding: "8px 12px",
                                                                            fontSize: "13px",
                                                                        }}
                                                                    >
                                                                        {product.stock ?? 0}
                                                                    </span>
                                                                </td>

                                                                <td style={{ padding: "18px 22px" }}>
                                                                    <span
                                                                        style={{
                                                                            color: "#475569",
                                                                            fontWeight: 600,
                                                                        }}
                                                                    >
                                                                        {product.variantIDs
                                                                            ? product.variantIDs.length
                                                                            : 0}
                                                                    </span>
                                                                </td>

                                                                <td style={{ padding: "18px 22px" }}>
                                                                    {product.approval_status === "Approved" ? (
                                                                        <span
                                                                            className="badge"
                                                                            style={{
                                                                                background: "#dcfce7",
                                                                                color: "#15803d",
                                                                                borderRadius: "999px",
                                                                                padding: "8px 12px",
                                                                                fontSize: "12px",
                                                                            }}
                                                                        >
                                                                            <i className="bx bx-check me-1"></i>
                                                                            Approved
                                                                        </span>
                                                                    ) : (
                                                                        <span
                                                                            className="badge"
                                                                            style={{
                                                                                background: "#ffedd5",
                                                                                color: "#c2410c",
                                                                                borderRadius: "999px",
                                                                                padding: "8px 12px",
                                                                                fontSize: "12px",
                                                                            }}
                                                                        >
                                                                            <i className="bx bx-time-five me-1"></i>
                                                                            Pending
                                                                        </span>
                                                                    )}
                                                                </td>

                                                                <td
                                                                    className="text-end"
                                                                    style={{ padding: "18px 22px" }}
                                                                >
                                                                    {(!product.variantIDs ||
                                                                        product.variantIDs.length === 0) ? (
                                                                        product.approval_status !== "Approved" ? (
                                                                            <button
                                                                                className="btn btn-success btn-sm"
                                                                                onClick={() => handleApprove(product.id)}
                                                                                style={{
                                                                                    borderRadius: "10px",
                                                                                    padding: "8px 14px",
                                                                                    fontWeight: 600,
                                                                                }}
                                                                            >
                                                                                <i className="bx bx-check-circle me-1"></i>
                                                                                Approve
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                className="btn btn-light btn-sm"
                                                                                disabled
                                                                                style={{
                                                                                    borderRadius: "10px",
                                                                                    padding: "8px 14px",
                                                                                    fontWeight: 600,
                                                                                    color: "#15803d",
                                                                                }}
                                                                            >
                                                                                Approved
                                                                            </button>
                                                                        )
                                                                    ) : (
                                                                        <div className="d-flex justify-content-end gap-2 flex-wrap">
                                                                            {product.approval_status !== "Approved" ? (
                                                                                <button
                                                                                    className="btn btn-success btn-sm"
                                                                                    onClick={() => handleApprove(product.id)}
                                                                                    style={{
                                                                                        borderRadius: "10px",
                                                                                        padding: "8px 14px",
                                                                                        fontWeight: 600,
                                                                                    }}
                                                                                >
                                                                                    <i className="bx bx-check-circle me-1"></i>
                                                                                    Approve
                                                                                </button>
                                                                            ) : (
                                                                                <button
                                                                                    className="btn btn-light btn-sm"
                                                                                    disabled
                                                                                    style={{
                                                                                        borderRadius: "10px",
                                                                                        padding: "8px 14px",
                                                                                        fontWeight: 600,
                                                                                        color: "#15803d",
                                                                                    }}
                                                                                >
                                                                                    Approved
                                                                                </button>
                                                                            )}

                                                                            <button
                                                                                className="btn btn-primary btn-sm"
                                                                                onClick={() => handleView(product)}
                                                                                style={{
                                                                                    borderRadius: "10px",
                                                                                    padding: "8px 14px",
                                                                                    fontWeight: 600,
                                                                                }}
                                                                            >
                                                                                <i className="bx bx-show me-1"></i>
                                                                                View Variants
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div
                                                className="d-flex align-items-center justify-content-between flex-wrap gap-3"
                                                style={{
                                                    padding: "18px 24px",
                                                    background: "#fff",
                                                    borderTop: "1px solid #edf0f4",
                                                }}
                                            >
                                                <div className="text-muted">
                                                    Showing page{" "}
                                                    <strong className="text-dark">{currentPage}</strong>
                                                    {totalPages > 0 ? (
                                                        <>
                                                            {" "}
                                                            of{" "}
                                                            <strong className="text-dark">{totalPages}</strong>
                                                        </>
                                                    ) : (
                                                        ""
                                                    )}
                                                    {" "} | Total records:{" "}
                                                    <strong className="text-dark">{count}</strong>
                                                </div>

                                                <ul className="pagination pagination-sm mb-0">
                                                    <li
                                                        className={`page-item ${!previousPage ? "disabled" : ""}`}
                                                    >
                                                        <button
                                                            className="page-link"
                                                            onClick={handlePreviousPage}
                                                            disabled={!previousPage}
                                                            style={{
                                                                borderRadius: "10px",
                                                                marginRight: "6px",
                                                                padding: "8px 14px",
                                                            }}
                                                        >
                                                            Previous
                                                        </button>
                                                    </li>

                                                    <li className="page-item active">
                                                        <button
                                                            className="page-link"
                                                            style={{
                                                                borderRadius: "10px",
                                                                marginRight: "6px",
                                                                padding: "8px 14px",
                                                            }}
                                                        >
                                                            {currentPage}
                                                        </button>
                                                    </li>

                                                    <li
                                                        className={`page-item ${!nextPage ? "disabled" : ""}`}
                                                    >
                                                        <button
                                                            className="page-link"
                                                            onClick={handleNextPage}
                                                            disabled={!nextPage}
                                                            style={{
                                                                borderRadius: "10px",
                                                                padding: "8px 14px",
                                                            }}
                                                        >
                                                            Next
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
                                        </>
                                    ) : (
                                        <div
                                            className="text-center"
                                            style={{
                                                padding: "70px 20px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "82px",
                                                    height: "82px",
                                                    borderRadius: "26px",
                                                    background: "#f1f5f9",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    margin: "0 auto 18px",
                                                    color: "#64748b",
                                                    fontSize: "38px",
                                                }}
                                            >
                                                <i className="bx bx-box"></i>
                                            </div>

                                            <h5 className="fw-bold text-dark mb-2">
                                                No disapproved products found
                                            </h5>
                                            <p className="text-muted mb-0">
                                                There are no products waiting for approval right now.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="card border-0"
                            style={{
                                borderRadius: "22px",
                                boxShadow: "0 10px 35px rgba(15, 23, 42, 0.08)",
                            }}
                        >
                            <div
                                className="card-body text-center"
                                style={{ padding: "70px 20px" }}
                            >
                                <div
                                    style={{
                                        width: "82px",
                                        height: "82px",
                                        borderRadius: "26px",
                                        background: "#fee2e2",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        margin: "0 auto 18px",
                                        color: "#dc2626",
                                        fontSize: "38px",
                                    }}
                                >
                                    <i className="bx bx-error-circle"></i>
                                </div>

                                <h5 className="fw-bold text-dark mb-2">
                                    No warehouse ID found
                                </h5>
                                <p className="text-muted mb-0">
                                    Please login with a valid warehouse account to view products.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <>
                    <div
                        className="modal-backdrop show"
                        style={{
                            opacity: 0.45,
                        }}
                    ></div>

                    <div
                        className="modal show d-block"
                        tabIndex="-1"
                        role="dialog"
                        style={{
                            background: "rgba(15, 23, 42, 0.12)",
                        }}
                    >
                        <div
                            className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
                            role="document"
                        >
                            <div
                                className="modal-content border-0"
                                style={{
                                    borderRadius: "22px",
                                    overflow: "hidden",
                                    boxShadow: "0 25px 60px rgba(15, 23, 42, 0.25)",
                                }}
                            >
                                <div
                                    className="modal-header border-0"
                                    style={{
                                        padding: "22px 24px",
                                        background:
                                            "linear-gradient(135deg, #1f2937 0%, #334155 100%)",
                                    }}
                                >
                                    <div>
                                        <h5 className="modal-title text-white fw-bold mb-1">
                                            Product Variants
                                        </h5>
                                        <p
                                            className="mb-0"
                                            style={{
                                                color: "rgba(255,255,255,0.7)",
                                                fontSize: "13px",
                                            }}
                                        >
                                            Review and approve individual product variants.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => setShowModal(false)}
                                        style={{
                                            width: "38px",
                                            height: "38px",
                                            borderRadius: "12px",
                                            background: "rgba(255,255,255,0.12)",
                                            color: "#fff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "24px",
                                            lineHeight: 1,
                                        }}
                                    >
                                        <span>&times;</span>
                                    </button>
                                </div>

                                <div
                                    className="modal-body"
                                    style={{
                                        padding: "24px",
                                        background: "#f8fafc",
                                    }}
                                >
                                    {selectedVariants.length > 0 ? (
                                        <div
                                            className="card border-0 mb-0"
                                            style={{
                                                borderRadius: "18px",
                                                overflow: "hidden",
                                                boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)",
                                            }}
                                        >
                                            <div className="table-responsive">
                                                <table className="table align-middle mb-0">
                                                    <thead>
                                                        <tr style={{ background: "#fff" }}>
                                                            <th
                                                                style={{
                                                                    padding: "16px 18px",
                                                                    color: "#64748b",
                                                                    fontSize: "12px",
                                                                    letterSpacing: "0.04em",
                                                                    textTransform: "uppercase",
                                                                    borderBottom: "1px solid #edf0f4",
                                                                }}
                                                            >
                                                                Image
                                                            </th>
                                                            <th
                                                                style={{
                                                                    padding: "16px 18px",
                                                                    color: "#64748b",
                                                                    fontSize: "12px",
                                                                    letterSpacing: "0.04em",
                                                                    textTransform: "uppercase",
                                                                    borderBottom: "1px solid #edf0f4",
                                                                }}
                                                            >
                                                                Name
                                                            </th>
                                                            <th
                                                                style={{
                                                                    padding: "16px 18px",
                                                                    color: "#64748b",
                                                                    fontSize: "12px",
                                                                    letterSpacing: "0.04em",
                                                                    textTransform: "uppercase",
                                                                    borderBottom: "1px solid #edf0f4",
                                                                }}
                                                            >
                                                                Color
                                                            </th>
                                                            <th
                                                                style={{
                                                                    padding: "16px 18px",
                                                                    color: "#64748b",
                                                                    fontSize: "12px",
                                                                    letterSpacing: "0.04em",
                                                                    textTransform: "uppercase",
                                                                    borderBottom: "1px solid #edf0f4",
                                                                }}
                                                            >
                                                                Stock
                                                            </th>
                                                            <th
                                                                style={{
                                                                    padding: "16px 18px",
                                                                    color: "#64748b",
                                                                    fontSize: "12px",
                                                                    letterSpacing: "0.04em",
                                                                    textTransform: "uppercase",
                                                                    borderBottom: "1px solid #edf0f4",
                                                                }}
                                                            >
                                                                Wholesale Price
                                                            </th>
                                                            <th
                                                                style={{
                                                                    padding: "16px 18px",
                                                                    color: "#64748b",
                                                                    fontSize: "12px",
                                                                    letterSpacing: "0.04em",
                                                                    textTransform: "uppercase",
                                                                    borderBottom: "1px solid #edf0f4",
                                                                }}
                                                            >
                                                                Retail Price
                                                            </th>
                                                            <th
                                                                className="text-end"
                                                                style={{
                                                                    padding: "16px 18px",
                                                                    color: "#64748b",
                                                                    fontSize: "12px",
                                                                    letterSpacing: "0.04em",
                                                                    textTransform: "uppercase",
                                                                    borderBottom: "1px solid #edf0f4",
                                                                }}
                                                            >
                                                                Action
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {selectedVariants.map((variant) => (
                                                            <tr
                                                                key={variant.id}
                                                                style={{
                                                                    borderBottom: "1px solid #f1f5f9",
                                                                }}
                                                            >
                                                                <td style={{ padding: "16px 18px" }}>
                                                                    {renderVariantImage(variant.image, variant.name)}
                                                                </td>

                                                                <td style={{ padding: "16px 18px" }}>
                                                                    <h6 className="mb-1 fw-bold text-dark">
                                                                        {variant.name || "Unnamed Variant"}
                                                                    </h6>
                                                                    <span
                                                                        style={{
                                                                            fontSize: "12px",
                                                                            color: "#64748b",
                                                                        }}
                                                                    >
                                                                        Variant ID: {variant.id}
                                                                    </span>
                                                                </td>

                                                                <td style={{ padding: "16px 18px" }}>
                                                                    <span
                                                                        className="badge"
                                                                        style={{
                                                                            background: "#f1f5f9",
                                                                            color: "#334155",
                                                                            borderRadius: "999px",
                                                                            padding: "8px 12px",
                                                                        }}
                                                                    >
                                                                        {variant.color || "N/A"}
                                                                    </span>
                                                                </td>

                                                                <td style={{ padding: "16px 18px" }}>
                                                                    <strong>{variant.stock ?? 0}</strong>
                                                                </td>

                                                                <td style={{ padding: "16px 18px" }}>
                                                                    <strong>
                                                                        ₹{variant.selling_price ?? "0"}
                                                                    </strong>
                                                                </td>

                                                                <td style={{ padding: "16px 18px" }}>
                                                                    <strong>
                                                                        ₹{variant.retail_price ?? "0"}
                                                                    </strong>
                                                                </td>

                                                                <td
                                                                    className="text-end"
                                                                    style={{ padding: "16px 18px" }}
                                                                >
                                                                    {variant.approval_status !== "Approved" ? (
                                                                        <button
                                                                            className="btn btn-success btn-sm"
                                                                            onClick={() =>
                                                                                handleVariantApprove(variant.id)
                                                                            }
                                                                            style={{
                                                                                borderRadius: "10px",
                                                                                padding: "8px 14px",
                                                                                fontWeight: 600,
                                                                            }}
                                                                        >
                                                                            <i className="bx bx-check-circle me-1"></i>
                                                                            Approve
                                                                        </button>
                                                                    ) : (
                                                                        <span
                                                                            className="badge"
                                                                            style={{
                                                                                background: "#dcfce7",
                                                                                color: "#15803d",
                                                                                borderRadius: "999px",
                                                                                padding: "8px 12px",
                                                                                fontSize: "12px",
                                                                            }}
                                                                        >
                                                                            <i className="bx bx-check me-1"></i>
                                                                            Approved
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="text-center"
                                            style={{
                                                padding: "60px 20px",
                                                background: "#fff",
                                                borderRadius: "18px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "76px",
                                                    height: "76px",
                                                    borderRadius: "24px",
                                                    background: "#f1f5f9",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    margin: "0 auto 18px",
                                                    color: "#64748b",
                                                    fontSize: "34px",
                                                }}
                                            >
                                                <i className="bx bx-layer"></i>
                                            </div>

                                            <h5 className="fw-bold text-dark mb-2">
                                                No variants available
                                            </h5>
                                            <p className="text-muted mb-0">
                                                This product does not have variants to review.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div
                                    className="modal-footer border-0"
                                    style={{
                                        padding: "18px 24px",
                                        background: "#fff",
                                    }}
                                >
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowModal(false)}
                                        style={{
                                            borderRadius: "10px",
                                            padding: "9px 18px",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <ToastContainer />
        </Fragment>
    );
};

export default WaitingProducts;