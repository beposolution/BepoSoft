import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    UncontrolledDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Input,
    Button,
} from "reactstrap";
import { FaSearch } from "react-icons/fa";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";

const truncateText = (text, length) => {
    if (!text) return "";
    return text.length > length ? `${text.substring(0, length)}...` : text;
};

const BasicTable = () => {
    const [products, setProducts] = useState([]);
    const [summary, setSummary] = useState({});
    const [warehouseName, setWarehouseName] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [categories, setCategories] = useState([]);
    const [warehouseID, setWarehouseID] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [previousPageUrl, setPreviousPageUrl] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const isFetchingRef = useRef(false);
    const pageSize = 50;

    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    document.title = "Product Tables | Beposoft";

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                if (!token) {
                    navigate("/login");
                    return;
                }

                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}profile/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setWarehouseID(response?.data?.data?.warehouse_id);
            } catch (error) {
                toast.error("Error fetching user data");
            }
        };

        fetchUserData();
    }, [token, navigate]);

    const buildProductsUrl = (
        page = 1,
        search = searchTerm,
        category = selectedCategory
    ) => {
        let url = `${import.meta.env.VITE_APP_KEY}warehouse/products/gets/${warehouseID}/?page=${page}`;

        if (search && search.trim() !== "") {
            url += `&search=${encodeURIComponent(search.trim())}`;
        }

        if (category && category !== "ALL") {
            url += `&category_id=${category}`;
        }

        return url;
    };

    const fetchProducts = async (
        page = currentPage,
        search = searchTerm,
        category = selectedCategory,
        append = false
    ) => {
        try {
            if (!token || !warehouseID) return;

            if (isFetchingRef.current) return;
            isFetchingRef.current = true;

            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }

            setError(null);

            const response = await fetch(buildProductsUrl(page, search, category), {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                const backendMessage =
                    data?.message ||
                    data?.detail ||
                    `HTTP error! Status: ${response.status}`;

                if (!append) {
                    setProducts([]);
                    setSummary({});
                    setWarehouseName("");
                    setTotalCount(0);
                    setNextPageUrl(null);
                    setPreviousPageUrl(null);
                    setCurrentPage(page);
                }

                throw new Error(backendMessage);
            }

            // const productList = data?.results?.data || [];
            // const apiSummary = data?.results?.summary || {};

            // setProducts((prevProducts) => {
            //     if (append) {
            //         return [...prevProducts, ...productList];
            //     }

            //     return productList;
            // });
            const productList = data?.results?.data || [];
            const apiSummary = data?.results?.summary || {};

            setProducts((prevProducts) => {
                if (append) {
                    const productMap = new Map();

                    [...prevProducts, ...productList].forEach((product) => {
                        productMap.set(product.id, product);
                    });

                    return Array.from(productMap.values());
                }

                return productList;
            });

            setSummary(apiSummary);
            setWarehouseName(data?.results?.warehouse_name || "");
            setTotalCount(data?.count || 0);
            setNextPageUrl(data?.next || null);
            setPreviousPageUrl(data?.previous || null);
            setCurrentPage(page);

            setCategories((prevCategories) => {
                const categoryMap = new Map();

                categoryMap.set("ALL", "ALL");

                prevCategories.forEach((cat) => {
                    const id = String(cat.id);

                    if (id !== "ALL" && cat.name) {
                        categoryMap.set(id, cat.name);
                    }
                });

                productList.forEach((product) => {
                    const id = String(product?.product_category || "");
                    const name = product?.product_category_name;

                    if (id && name) {
                        categoryMap.set(id, name);
                    }
                });

                return Array.from(categoryMap.entries()).map(([id, name]) => ({
                    id,
                    name,
                }));
            });
        } catch (err) {
            setError(err.message || "Unknown error occurred");
        } finally {
            setLoading(false);
            setLoadingMore(false);
            isFetchingRef.current = false;
        }
    };

    useEffect(() => {
        if (!token || !warehouseID) return;

        setProducts([]);
        setCurrentPage(1);
        setSearchTerm("");
        setSelectedCategory("ALL");

        fetchProducts(1, "", "ALL", false);
    }, [token, warehouseID]);

    useEffect(() => {
        const handleScroll = () => {
            if (loading || loadingMore || !nextPageUrl) return;

            const scrollTop = window.scrollY;
            const windowHeight = window.innerHeight;
            const fullHeight = document.documentElement.scrollHeight;

            const isNearBottom = scrollTop + windowHeight >= fullHeight - 300;

            if (isNearBottom) {
                fetchProducts(currentPage + 1, searchTerm, selectedCategory, true);
            }
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [
        loading,
        loadingMore,
        nextPageUrl,
        currentPage,
        searchTerm,
        selectedCategory,
        token,
        warehouseID,
    ]);

    const handleCategoryChange = (e) => {
        const value = e.target.value;

        setSelectedCategory(value);
        setCurrentPage(1);

        fetchProducts(1, searchTerm, value, false);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();

        setCurrentPage(1);

        fetchProducts(1, searchTerm, selectedCategory, false);
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setSelectedCategory("ALL");
        setCurrentPage(1);

        fetchProducts(1, "", "ALL", false);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    const handleEditVie = (productId) => {
        navigate(`/ecommerce-product-edit/${productId}/`);
    };

    const handleProductClick = (productId, productType) => {
        if (productType === "single") {
            navigate(`/product/${productId}/images/`);
        } else if (productType === "variant") {
            navigate(`/ecommerce-product-variant/${productId}/${productType}/`);
        } else {
            toast.error("Unknown product type");
        }
    };

    const handleViewProduct = (productId, productType) => {
        navigate(`/ecommerce-product-detail/${productId}/${productType}/`);
    };

    const onClickDelete = async (productId) => {
        try {
            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.delete(
                `${import.meta.env.VITE_APP_KEY}product/update/${productId}/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200) {
                setProducts((prev) =>
                    prev.filter((product) => product.id !== productId)
                );
                toast.success("Product deleted successfully");
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        } catch (err) {
            setError(err.message || "Failed to delete product");
        }
    };

    const getProductImage = (product) => {
        if (product?.image) {
            if (product.image.startsWith("http")) {
                return product.image;
            }

            return `${import.meta.env.VITE_APP_IMAGE}${product.image}`;
        }

        if (Array.isArray(product?.images) && product.images.length > 0) {
            const firstImage = product.images[0];

            if (typeof firstImage === "string") {
                return firstImage.startsWith("http")
                    ? firstImage
                    : `${import.meta.env.VITE_APP_IMAGE}${firstImage}`;
            }

            if (firstImage?.image) {
                return firstImage.image.startsWith("http")
                    ? firstImage.image
                    : `${import.meta.env.VITE_APP_IMAGE}${firstImage.image}`;
            }
        }

        return "/no-image.png";
    };

    const toNumber = (value) => {
        const numberValue = Number(value);
        return Number.isFinite(numberValue) ? numberValue : 0;
    };

    const getCalculatedStock = (product) => {
        if (
            product?.type === "variant" &&
            Array.isArray(product?.variantIDs) &&
            product.variantIDs.length > 0
        ) {
            return product.variantIDs.reduce(
                (total, variant) => total + toNumber(variant?.stock),
                0
            );
        }

        return toNumber(product?.stock);
    };

    const getCalculatedLockedStock = (product) => {
        if (
            product?.type === "variant" &&
            Array.isArray(product?.variantIDs) &&
            product.variantIDs.length > 0
        ) {
            return product.variantIDs.reduce(
                (total, variant) => total + toNumber(variant?.locked_stock),
                0
            );
        }

        return toNumber(product?.locked_stock);
    };

    const formatNumber = (value) => {
        return Number(value || 0).toLocaleString("en-IN");
    };

    const formatCurrency = (value) => {
        return `₹${Number(value || 0).toLocaleString("en-IN", {
            maximumFractionDigits: 2,
        })}`;
    };

    const getCalculatedDamagedStock = (product) => {
        if (
            product?.type === "variant" &&
            Array.isArray(product?.variantIDs) &&
            product.variantIDs.length > 0
        ) {
            return product.variantIDs.reduce(
                (total, variant) => total + Number(variant?.damaged_stock || 0),
                0
            );
        }

        return Number(product?.damaged_stock || 0);
    };

    const getCalculatedPartiallyDamagedStock = (product) => {
        if (
            product?.type === "variant" &&
            Array.isArray(product?.variantIDs) &&
            product.variantIDs.length > 0
        ) {
            return product.variantIDs.reduce(
                (total, variant) => total + Number(variant?.partially_damaged_stock || 0),
                0
            );
        }

        return Number(product?.partially_damaged_stock || 0);
    };


    const getCalculatedLiquidationStock = (product) => {
        if (
            product?.type === "variant" &&
            Array.isArray(product?.variantIDs) &&
            product.variantIDs.length > 0
        ) {
            return product.variantIDs.reduce(
                (total, variant) => total + Number(variant?.liquidation_stock || 0),
                0
            );
        }

        return Number(product?.liquidation_stock || 0);
    };

    const exportToExcel = () => {
        const exportData = [];

        products.forEach((product, index) => {
            exportData.push({
                "#": index + 1,
                ID: product.id,
                Name: product.name,
                Type: product.type,
                HSN_Code: product.hsn_code,
                Category: product.product_category_name,
                Unit: product.unit,
                Purchase_Rate: product.purchase_rate,
                Tax_Percent: product.tax,
                Landing_Cost: product.landing_cost,
                Excluded_Price: Math.floor(product.exclude_price || 0),
                Wholesale_Price: product.selling_price,
                Retail_Price: product.retail_price,
                Purchase_Type:
                    product.purchase_type === "International" ? "IN" : "Local",
                Variant: "Main Product",
                Size: product.size || "",
                Color: product.color || "",
                Stock: product.stock,
                Locked_Stock: product.locked_stock,
            });

            if (Array.isArray(product.variantIDs) && product.variantIDs.length > 0) {
                product.variantIDs.forEach((variant) => {
                    exportData.push({
                        "#": "",
                        ID: variant.id,
                        Name: variant.name,
                        Type: "variant",
                        HSN_Code: product.hsn_code,
                        Category: product.product_category_name,
                        Unit: product.unit,
                        Purchase_Rate: "",
                        Tax_Percent: "",
                        Landing_Cost: "",
                        Excluded_Price: "",
                        Wholesale_Price: variant.selling_price,
                        Retail_Price: variant.retail_price,
                        Purchase_Type:
                            product.purchase_type === "International" ? "IN" : "Local",
                        Variant: "Variant",
                        Size: variant.size || "",
                        Color: variant.color || "",
                        Stock: variant.stock,
                        Locked_Stock: variant.locked_stock,
                    });
                });
            }
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Warehouse_Products");
        XLSX.writeFile(workbook, "Product_Details.xlsx");
    };

    const renderSummaryCard = (title, value, subText, icon, bgColor, iconColor) => {
        return (
            <Col xl={3} lg={4} md={6} sm={6} xs={12} className="mb-3">
                <div
                    className="card border-0 h-100"
                    style={{
                        borderRadius: "14px",
                        boxShadow: "0 5px 16px rgba(15, 23, 42, 0.05)",
                        minHeight: "92px",
                    }}
                >
                    <div
                        className="card-body"
                        style={{
                            padding: "14px 16px",
                        }}
                    >
                        <div className="d-flex align-items-center justify-content-between gap-2">
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p
                                    className="text-muted mb-1"
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        lineHeight: "1.2",
                                    }}
                                >
                                    {title}
                                </p>

                                <h4
                                    className="mb-1 fw-bold"
                                    style={{
                                        fontSize: "20px",
                                        lineHeight: "1.2",
                                        color: "#334155",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                    title={String(value)}
                                >
                                    {value}
                                </h4>

                                {subText && (
                                    <small
                                        style={{
                                            color: "#475569",
                                            fontWeight: 500,
                                            fontSize: "10px",
                                            lineHeight: "1.25",
                                            display: "block",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                        title={subText}
                                    >
                                        {subText}
                                    </small>
                                )}
                            </div>

                            <div
                                style={{
                                    width: "38px",
                                    height: "38px",
                                    borderRadius: "12px",
                                    background: bgColor,
                                    color: iconColor,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "20px",
                                    flexShrink: 0,
                                }}
                            >
                                <i className={icon}></i>
                            </div>
                        </div>
                    </div>
                </div>
            </Col>
        );
    };

    return (
        <React.Fragment>
            <ToastContainer />

            <div
                className="page-content"
                style={{
                    background: "#f5f7fb",
                    minHeight: "100vh",
                }}
            >
                <div className="container-fluid">

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
                                            <i className="bx bx-store"></i>
                                        </div>

                                        <div>
                                            <h4 className="mb-1 text-white fw-bold">
                                                Warehouse Product Center
                                            </h4>

                                            <p
                                                className="mb-0"
                                                style={{
                                                    color: "rgba(255,255,255,0.72)",
                                                }}
                                            >
                                                View products, stock, locked stock, pricing,
                                                variants, and export warehouse inventory data.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-4 mt-4 mt-lg-0">
                                    <div className="d-flex justify-content-lg-end gap-2 flex-wrap">
                                        <span
                                            className="badge"
                                            style={{
                                                background: "rgba(59,130,246,0.18)",
                                                color: "#bfdbfe",
                                                padding: "10px 14px",
                                                borderRadius: "999px",
                                                fontSize: "13px",
                                                fontWeight: 500,
                                            }}
                                        >
                                            {warehouseName || "Warehouse"}
                                        </span>

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
                                            Total:{" "}
                                            {formatNumber(summary?.total_products || totalCount)}
                                        </span>

                                        {/* <Button
                                            color="success"
                                            onClick={exportToExcel}
                                            style={{
                                                borderRadius: "999px",
                                                padding: "9px 16px",
                                                fontWeight: 700,
                                                border: "none",
                                                boxShadow:
                                                    "0 8px 20px rgba(34, 197, 94, 0.25)",
                                            }}
                                        >
                                            <i className="bx bx-download me-1"></i>
                                            Export to Excel
                                        </Button> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Row className="mb-3">
                        {renderSummaryCard(
                            "Total Products",
                            formatNumber(summary?.total_products || totalCount),
                            `Single ${formatNumber(
                                summary?.single_product_count
                            )} | Variant ${formatNumber(summary?.variant_product_count)}`,
                            "bx bx-grid-alt",
                            "#eef2ff",
                            "#4f46e5"
                        )}

                        {renderSummaryCard(
                            "Total Stock",
                            formatNumber(summary?.total_stock),
                            `Single ${formatNumber(summary?.single_stock)} | Variant ${formatNumber(
                                summary?.variant_stock
                            )}`,
                            "bx bx-package",
                            "#ecfdf5",
                            "#10b981"
                        )}

                        {renderSummaryCard(
                            "Locked Stock",
                            formatNumber(summary?.total_locked_stock),
                            `Single ${formatNumber(
                                summary?.single_locked_stock
                            )} | Variant ${formatNumber(summary?.variant_locked_stock)}`,
                            "bx bx-lock-alt",
                            "#fff7ed",
                            "#f97316"
                        )}

                        {renderSummaryCard(
                            "Retail Amount",
                            formatCurrency(summary?.total_retail_amount),
                            `Single ${formatCurrency(
                                summary?.single_retail_amount
                            )} | Variant ${formatCurrency(summary?.variant_retail_amount)}`,
                            "bx bx-rupee",
                            "#fdf2f8",
                            "#db2777"
                        )}

                        {renderSummaryCard(
                            "Selling Amount",
                            formatCurrency(summary?.total_selling_amount),
                            `Single ${formatCurrency(
                                summary?.single_selling_amount
                            )} | Variant ${formatCurrency(summary?.variant_selling_amount)}`,
                            "bx bx-money",
                            "#f0fdf4",
                            "#16a34a"
                        )}

                        {renderSummaryCard(
                            "Landing Cost",
                            formatCurrency(summary?.total_landing_cost_amount),
                            `Single ${formatCurrency(
                                summary?.single_landing_cost_amount
                            )} | Variant ${formatCurrency(summary?.variant_landing_cost_amount)}`,
                            "bx bx-purchase-tag-alt",
                            "#eff6ff",
                            "#2563eb"
                        )}

                        {renderSummaryCard(
                            "Exclude Price Amount",
                            formatCurrency(summary?.total_exclude_price_amount),
                            `Single ${formatCurrency(
                                summary?.single_exclude_price_amount
                            )} | Variant ${formatCurrency(summary?.variant_exclude_price_amount)}`,
                            "bx bx-minus-circle",
                            "#fefce8",
                            "#ca8a04"
                        )}

                        {renderSummaryCard(
                            "Damaged Stock",
                            formatNumber(summary?.damaged_stock_summary?.total_damaged_stock),
                            `Single ${formatNumber(
                                summary?.damaged_stock_summary?.single_damaged_stock
                            )} | Variant ${formatNumber(
                                summary?.damaged_stock_summary?.variant_damaged_stock
                            )}`,
                            "bx bx-error",
                            "#fef2f2",
                            "#dc2626"
                        )}

                        {renderSummaryCard(
                            "Damaged Retail Amount",
                            formatCurrency(
                                summary?.damaged_stock_summary?.total_damaged_retail_amount
                            ),
                            `Selling ${formatCurrency(
                                summary?.damaged_stock_summary?.total_damaged_selling_amount
                            )}`,
                            "bx bx-rupee",
                            "#fff1f2",
                            "#e11d48"
                        )}

                        {renderSummaryCard(
                            "Partially Damaged Stock",
                            formatNumber(
                                summary?.partially_damaged_stock_summary
                                    ?.total_partially_damaged_stock
                            ),
                            `Single ${formatNumber(
                                summary?.partially_damaged_stock_summary
                                    ?.single_partially_damaged_stock
                            )} | Variant ${formatNumber(
                                summary?.partially_damaged_stock_summary
                                    ?.variant_partially_damaged_stock
                            )}`,
                            "bx bx-error-alt",
                            "#fff7ed",
                            "#ea580c"
                        )}

                        {renderSummaryCard(
                            "Partial Damage Retail",
                            formatCurrency(
                                summary?.partially_damaged_stock_summary
                                    ?.total_partially_damaged_retail_amount
                            ),
                            `Selling ${formatCurrency(
                                summary?.partially_damaged_stock_summary
                                    ?.total_partially_damaged_selling_amount
                            )}`,
                            "bx bx-rupee",
                            "#fffbeb",
                            "#d97706"
                        )}

                        {renderSummaryCard(
                            "Partial Damage Landing",
                            formatCurrency(
                                summary?.partially_damaged_stock_summary
                                    ?.total_partially_damaged_landing_cost_amount
                            ),
                            `Exclude ${formatCurrency(
                                summary?.partially_damaged_stock_summary
                                    ?.total_partially_damaged_exclude_price_amount
                            )}`,
                            "bx bx-receipt",
                            "#f8fafc",
                            "#475569"
                        )}
                    </Row>

                    <Row>
                        <Col xl={12}>
                            <Card
                                className="border-0"
                                style={{
                                    borderRadius: "22px",
                                    boxShadow: "0 10px 35px rgba(15, 23, 42, 0.08)",
                                    overflow: "hidden",
                                }}
                            >
                                <CardBody className="p-0">
                                    <div
                                        style={{
                                            background: "#fff",
                                            padding: "22px 24px",
                                            borderBottom: "1px solid #edf0f4",
                                        }}
                                    >
                                        <Row className="align-items-center">
                                            <Col lg={5}>
                                                <h5 className="mb-1 fw-bold text-dark">
                                                    Product Table
                                                </h5>

                                                <p className="text-muted mb-0">
                                                    Loaded {formatNumber(products.length)} of{" "}
                                                    {formatNumber(totalCount)} products.
                                                </p>
                                            </Col>

                                            <Col lg={7} className="mt-3 mt-lg-0">
                                                <form onSubmit={handleSearchSubmit}>
                                                    <div className="d-flex gap-2 flex-wrap justify-content-lg-end">
                                                        <div
                                                            className="position-relative"
                                                            style={{
                                                                width: "100%",
                                                                maxWidth: "360px",
                                                            }}
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

                                                            <Input
                                                                type="text"
                                                                placeholder="Search with product name, HSN code..."
                                                                aria-label="Search products"
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

                                                        <Input
                                                            type="select"
                                                            value={selectedCategory}
                                                            onChange={handleCategoryChange}
                                                            style={{
                                                                maxWidth: "190px",
                                                                borderRadius: "14px",
                                                                padding: "12px 14px",
                                                                border: "1px solid #e5e7eb",
                                                                background: "#f8fafc",
                                                            }}
                                                        >
                                                            {categories.map((cat) => (
                                                                <option key={cat.id} value={cat.id}>
                                                                    {cat.name}
                                                                </option>
                                                            ))}
                                                        </Input>

                                                        <Button
                                                            color="secondary"
                                                            type="submit"
                                                            style={{
                                                                borderRadius: "12px",
                                                                padding: "10px 16px",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            <FaSearch />
                                                        </Button>

                                                        <Button
                                                            color="light"
                                                            onClick={handleClearFilters}
                                                            style={{
                                                                borderRadius: "12px",
                                                                padding: "10px 16px",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            Clear
                                                        </Button>
                                                    </div>
                                                </form>
                                            </Col>
                                        </Row>
                                    </div>

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
                                    ) : error ? (
                                        <div
                                            className="text-center"
                                            style={{
                                                padding: "60px 20px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "76px",
                                                    height: "76px",
                                                    borderRadius: "24px",
                                                    background: "#fee2e2",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    margin: "0 auto 18px",
                                                    color: "#dc2626",
                                                    fontSize: "34px",
                                                }}
                                            >
                                                <i className="bx bx-error-circle"></i>
                                            </div>

                                            <h5 className="fw-bold text-dark mb-2">
                                                Failed to load products
                                            </h5>

                                            <p className="text-danger mb-0">{error}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="table-responsive">
                                                <Table className="table align-middle mb-0">
                                                    <thead>
                                                        <tr
                                                            className="text-center"
                                                            style={{
                                                                background: "#f8fafc",
                                                                borderTop: "1px solid #edf0f4",
                                                            }}
                                                        >
                                                            {[
                                                                "#",
                                                                "Image",
                                                                "Name",
                                                                "HSN\nCode",
                                                                "Category",
                                                                "Type",
                                                                "Unit",
                                                                "Usable\nStock",
                                                                "Partially\nDamaged\nStock",
                                                                "Damaged\nStock",
                                                                "Liquidation\nStock",
                                                                "Purchase\nRate",
                                                                "Tax %",
                                                                "Landing\nCost",
                                                                // "Excluded\nPrice",
                                                                "Wholesale\nPrice",
                                                                "Retail\nPrice",
                                                                "Purchase\nType",
                                                                "Actions",
                                                            ].map((heading) => (
                                                                <th
                                                                    key={heading}
                                                                    style={{
                                                                        padding: "14px 16px",
                                                                        color: "#1f2937",
                                                                        fontSize: "12px",
                                                                        fontWeight: 800,
                                                                        letterSpacing: "0.03em",
                                                                        textTransform: "uppercase",
                                                                        borderBottom: "1px solid #edf0f4",
                                                                        whiteSpace: "pre-line",
                                                                        lineHeight: "1.35",
                                                                        textAlign: "center",
                                                                        verticalAlign: "middle",
                                                                    }}
                                                                >
                                                                    {heading}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {products.length > 0 ? (
                                                            products.map((product, index) => (
                                                                <tr
                                                                    key={product.id}
                                                                    className="text-center"
                                                                    style={{
                                                                        borderBottom: "1px solid #f1f5f9",
                                                                    }}
                                                                >
                                                                    <th
                                                                        scope="row"
                                                                        style={{
                                                                            padding: "18px",
                                                                            color: "#64748b",
                                                                            fontWeight: 600,
                                                                        }}
                                                                    >
                                                                        {index + 1}
                                                                    </th>

                                                                    <td style={{ padding: "18px" }}>
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
                                                                                margin: "0 auto",
                                                                            }}
                                                                        >
                                                                            <img
                                                                                src={getProductImage(product)}
                                                                                alt={product.name}
                                                                                style={{
                                                                                    width: "100%",
                                                                                    height: "100%",
                                                                                    objectFit: "cover",
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </td>

                                                                    <td
                                                                        style={{
                                                                            padding: "18px",
                                                                            cursor: "pointer",
                                                                            minWidth: "220px",
                                                                        }}
                                                                        onClick={() =>
                                                                            handleProductClick(
                                                                                product.id,
                                                                                product.type
                                                                            )
                                                                        }
                                                                    >
                                                                        <div className="fw-bold text-dark">
                                                                            {truncateText(product.name, 35)}
                                                                        </div>

                                                                        {product?.type === "variant" && (
                                                                            <small className="text-muted">
                                                                                Variant product
                                                                            </small>
                                                                        )}
                                                                    </td>

                                                                    <td style={{ padding: "18px" }}>
                                                                        {product?.hsn_code}
                                                                    </td>

                                                                    <td style={{ padding: "18px" }}>
                                                                        {product?.product_category_name}
                                                                    </td>

                                                                    <td style={{ padding: "18px" }}>
                                                                        <span
                                                                            className="badge"
                                                                            style={{
                                                                                background:
                                                                                    product?.type === "variant"
                                                                                        ? "#eef2ff"
                                                                                        : "#ecfdf5",
                                                                                color:
                                                                                    product?.type === "variant"
                                                                                        ? "#4f46e5"
                                                                                        : "#15803d",
                                                                                borderRadius: "999px",
                                                                                padding: "8px 12px",
                                                                                fontSize: "12px",
                                                                            }}
                                                                        >
                                                                            {product?.type}
                                                                        </span>
                                                                    </td>

                                                                    <td style={{ padding: "18px" }}>
                                                                        {product?.unit}
                                                                    </td>

                                                                    <td
                                                                        style={{
                                                                            padding: "18px",
                                                                            minWidth: "130px",
                                                                        }}
                                                                    >
                                                                        <div className="fw-bold text-dark">
                                                                            {formatNumber(
                                                                                getCalculatedStock(product)
                                                                            )}
                                                                        </div>

                                                                        {product?.type === "variant" && (
                                                                            <small className="text-muted">
                                                                                Including all variants
                                                                            </small>
                                                                        )}

                                                                        <div>
                                                                            <small className="text-muted">
                                                                                Locked:{" "}
                                                                                {formatNumber(
                                                                                    getCalculatedLockedStock(product)
                                                                                )}
                                                                            </small>
                                                                        </div>
                                                                    </td>

                                                                    <td style={{ padding: "18px" }}>
                                                                        {getCalculatedPartiallyDamagedStock(product)}
                                                                    </td>

                                                                    <td style={{ padding: "18px" }}>
                                                                        {getCalculatedDamagedStock(product)}
                                                                    </td>

                                                                    <td style={{ padding: "18px" }}>
                                                                        {getCalculatedLiquidationStock(product)}
                                                                    </td>

                                                                    <td style={{ padding: "18px" }}>
                                                                        {product?.purchase_rate}
                                                                    </td>

                                                                    <td style={{ padding: "18px" }}>
                                                                        {product?.tax}%
                                                                    </td>

                                                                    <td style={{ padding: "18px" }}>
                                                                        {product?.landing_cost}
                                                                    </td>

                                                                    {/* <td style={{ padding: "18px" }}>
                                                                        {Math.floor(product?.exclude_price || 0)}
                                                                    </td> */}

                                                                    <td style={{ padding: "18px" }}>
                                                                        <strong>₹{product?.selling_price}</strong>
                                                                    </td>

                                                                    <td style={{ padding: "18px" }}>
                                                                        <strong>₹{product?.retail_price}</strong>
                                                                    </td>

                                                                    <td style={{ padding: "18px" }}>
                                                                        {product?.purchase_type === "International"
                                                                            ? "IN"
                                                                            : "Local"}
                                                                    </td>

                                                                    <td style={{ padding: "18px" }}>
                                                                        <Button
                                                                            color="primary"
                                                                            size="sm"
                                                                            onClick={() => handleEditVie(product.id)}
                                                                            style={{
                                                                                borderRadius: "10px",
                                                                                padding: "7px 14px",
                                                                                fontWeight: 700,
                                                                                display: "inline-flex",
                                                                                alignItems: "center",
                                                                                gap: "6px",
                                                                                border: "none",
                                                                                boxShadow: "0 6px 14px rgba(34, 124, 197, 0.22)",
                                                                            }}
                                                                        >
                                                                            <i className="mdi mdi-pencil font-size-16"></i>
                                                                            Edit
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="16" className="text-center">
                                                                    <div
                                                                        style={{
                                                                            padding: "60px 20px",
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
                                                                            <i className="bx bx-box"></i>
                                                                        </div>

                                                                        <h5 className="fw-bold text-dark mb-2">
                                                                            No products available
                                                                        </h5>

                                                                        <p className="text-muted mb-0">
                                                                            No products found for the selected filters.
                                                                        </p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </div>

                                            <div
                                                className="d-flex align-items-center justify-content-between flex-wrap gap-3"
                                                style={{
                                                    padding: "18px 24px",
                                                    background: "#fff",
                                                    borderTop: "1px solid #edf0f4",
                                                }}
                                            >
                                                {/* <div className="text-muted">
                                                    Loaded{" "}
                                                    <strong className="text-dark">
                                                        {formatNumber(products.length)}
                                                    </strong>{" "}
                                                    of{" "}
                                                    <strong className="text-dark">
                                                        {formatNumber(totalCount)}
                                                    </strong>{" "}
                                                    products
                                                    {totalPages > 0 && (
                                                        <>
                                                            {" "}
                                                            | Page{" "}
                                                            <strong className="text-dark">
                                                                {currentPage}
                                                            </strong>{" "}
                                                            of{" "}
                                                            <strong className="text-dark">
                                                                {totalPages}
                                                            </strong>
                                                        </>
                                                    )}
                                                </div> */}

                                                <div className="text-muted">
                                                    {loadingMore ? (
                                                        <span>Loading more products...</span>
                                                    ) : nextPageUrl ? (
                                                        <span>Scroll down to load more products</span>
                                                    ) : (
                                                        <span>All products loaded</span>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
                <Button
                    color="success"
                    onClick={exportToExcel}
                    disabled={loading || products.length === 0}
                    style={{
                        position: "fixed",
                        right: "28px",
                        bottom: "28px",
                        zIndex: 1050,
                        borderRadius: "999px",
                        padding: "13px 22px",
                        fontWeight: 700,
                        border: "none",
                        boxShadow: "0 12px 30px rgba(34, 197, 94, 0.35)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <i className="bx bx-download" style={{ fontSize: "20px" }}></i>
                    <span className="d-none d-sm-inline">Export to Excel</span>
                </Button>
            </div>
        </React.Fragment>
    );
};

export default BasicTable;