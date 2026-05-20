// import React, { useEffect, useState } from "react";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    UncontrolledDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    // UncontrolledTooltip,
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

    const buildProductsUrl = (page = 1, search = searchTerm, category = selectedCategory) => {
        let url = `${import.meta.env.VITE_APP_KEY}warehouse/products/gets/${warehouseID}/?page=${page}`;

        if (search && search.trim() !== "") {
            url += `&search=${encodeURIComponent(search.trim())}`;
        }

        if (category && category !== "ALL") {
            url += `&category_id=${category}`;
        }

        return url;
    };

    // const fetchProducts = async (
    //     page = currentPage,
    //     search = searchTerm,
    //     category = selectedCategory
    // ) => {
    //     try {
    //         if (!token || !warehouseID) return;

    //         setLoading(true);
    //         setError(null);

    //         const response = await fetch(buildProductsUrl(page, search, category), {
    //             method: "GET",
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //                 "Content-Type": "application/json",
    //             },
    //         });

    //         const data = await response.json();

    //         if (!response.ok) {
    //             const backendMessage =
    //                 data?.message ||
    //                 data?.detail ||
    //                 `HTTP error! Status: ${response.status}`;

    //             setProducts([]);
    //             setTotalCount(0);
    //             setNextPageUrl(null);
    //             setPreviousPageUrl(null);
    //             setCurrentPage(page);

    //             throw new Error(backendMessage);
    //         }

    //         const productList = data?.results?.data || [];

    //         setProducts(productList);
    //         setTotalCount(data?.count || 0);
    //         setNextPageUrl(data?.next || null);
    //         setPreviousPageUrl(data?.previous || null);
    //         setCurrentPage(page);

    //         const categoryMap = new Map();

    //         productList.forEach((product) => {
    //             if (product?.product_category && product?.product_category_name) {
    //                 categoryMap.set(product.product_category, product.product_category_name);
    //             }
    //         });

    //         setCategories((prevCategories) => {
    //             const oldMap = new Map();

    //             prevCategories.forEach((cat) => {
    //                 if (cat.id && cat.name) {
    //                     oldMap.set(cat.id, cat.name);
    //                 }
    //             });

    //             categoryMap.forEach((name, id) => {
    //                 oldMap.set(id, name);
    //             });

    //             return [
    //                 { id: "ALL", name: "ALL" },
    //                 ...Array.from(oldMap.entries()).map(([id, name]) => ({
    //                     id,
    //                     name,
    //                 })),
    //             ];
    //         });
    //     } catch (err) {
    //         setError(err.message || "Unknown error occurred");
    //     } finally {
    //         setLoading(false);
    //     }
    // };


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
                    setTotalCount(0);
                    setNextPageUrl(null);
                    setPreviousPageUrl(null);
                    setCurrentPage(page);
                }

                throw new Error(backendMessage);
            }

            const productList = data?.results?.data || [];

            setProducts((prevProducts) => {
                if (append) {
                    return [...prevProducts, ...productList];
                }

                return productList;
            });

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
    // useEffect(() => {
    //     if (!token || !warehouseID) return;
    //     fetchProducts(1, "", "ALL");
    // }, [token, warehouseID]);

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

    // const handleCategoryChange = (e) => {
    //     const value = e.target.value;
    //     setSelectedCategory(value);
    //     fetchProducts(1, searchTerm, value);
    // };

    // const handleSearchChange = (e) => {
    //     setSearchTerm(e.target.value);
    // };

    // const handleSearchSubmit = (e) => {
    //     e.preventDefault();
    //     fetchProducts(1, searchTerm, selectedCategory);
    // };

    // const handleClearFilters = () => {
    //     setSearchTerm("");
    //     setSelectedCategory("ALL");
    //     fetchProducts(1, "", "ALL");
    // };

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

    // const handleNextPage = () => {
    //     if (nextPageUrl) {
    //         fetchProducts(currentPage + 1, searchTerm, selectedCategory);
    //     }
    // };

    // const handlePreviousPage = () => {
    //     if (previousPageUrl && currentPage > 1) {
    //         fetchProducts(currentPage - 1, searchTerm, selectedCategory);
    //     }
    // };

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
                setProducts((prev) => prev.filter((product) => product.id !== productId));
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

        return "fallback-image-url";
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

    const exportToExcel = () => {
        const exportData = [];

        products.forEach((product, index) => {
            exportData.push({
                // "#": (currentPage - 1) * pageSize + index + 1,
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
                Purchase_Type: product.purchase_type === "International" ? "IN" : "Local",
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

    return (
        <React.Fragment>
            <ToastContainer />
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="Product Tables" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <Row className="mb-3 align-items-center">
                                        <Col md={7}>
                                            <form onSubmit={handleSearchSubmit}>
                                                <div className="hstack gap-3">
                                                    <Input
                                                        className="form-control me-auto"
                                                        type="text"
                                                        placeholder="Search with Product Name, HSN code..."
                                                        aria-label="Search products"
                                                        value={searchTerm}
                                                        onChange={handleSearchChange}
                                                    />

                                                    <Button color="secondary" type="submit">
                                                        <FaSearch />
                                                    </Button>
                                                </div>
                                            </form>
                                        </Col>
                                        <Col md={3}>
                                            <Input
                                                type="select"
                                                value={selectedCategory}
                                                onChange={handleCategoryChange}
                                            >
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </Input>
                                        </Col>
                                        <Col md={2}>
                                            <Button
                                                color="light"
                                                className="w-100"
                                                onClick={handleClearFilters}
                                            >
                                                Clear
                                            </Button>
                                        </Col>
                                    </Row>
                                    <CardTitle className="h4 text-center">
                                        Product Table
                                    </CardTitle>

                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : error ? (
                                        <p className="text-danger">{error}</p>
                                    ) : (
                                        <>
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                {/* <div>
                                                    <strong>Total Products:</strong> {totalCount}
                                                    <span className="ms-3">
                                                        Page {currentPage} of {totalPages || 1}
                                                    </span>
                                                </div> */}

                                                <div>
                                                    <strong>Total Products:</strong> {totalCount}
                                                    <span className="ms-3">
                                                        Loaded {products.length} of {totalCount}
                                                    </span>
                                                </div>

                                                <Button color="success" onClick={exportToExcel}>
                                                    Export to Excel
                                                </Button>
                                            </div>

                                            <div className="table-responsive">
                                                <Table className="table mb-0">
                                                    <thead>
                                                        <tr className="text-center">
                                                            <th>#</th>
                                                            <th>Image</th>
                                                            <th>Name</th>
                                                            <th>HSN CODE</th>
                                                            <th>Category</th>
                                                            <th>TYPE</th>
                                                            <th>UNIT</th>
                                                            <th>STOCK</th>
                                                            <th>PURCHASE RATE</th>
                                                            <th>TAX %</th>
                                                            <th>LANDING COST</th>
                                                            <th>EXCLUDED PRICE</th>
                                                            <th>WHOLESALE PRICE</th>
                                                            <th>RETAIL PRICE</th>
                                                            <th>PURCHASE TYPE</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {products.length > 0 ? (
                                                            products.map((product, index) => (
                                                                <tr
                                                                    key={product.id}
                                                                    className="text-center"
                                                                >
                                                                    {/* <th scope="row">
                                                                        {(currentPage - 1) * pageSize +
                                                                            index +
                                                                            1}
                                                                    </th> */}
                                                                    <th scope="row">
                                                                        {index + 1}
                                                                    </th>

                                                                    <td>
                                                                        <img
                                                                            src={getProductImage(product)}
                                                                            alt={product.name}
                                                                            style={{
                                                                                width: "60px",
                                                                                height: "60px",
                                                                                objectFit: "cover",
                                                                                borderRadius: "5px",
                                                                            }}
                                                                        />
                                                                    </td>

                                                                    <td
                                                                        style={{ cursor: "pointer" }}
                                                                        onClick={() =>
                                                                            handleProductClick(
                                                                                product.id,
                                                                                product.type
                                                                            )
                                                                        }
                                                                    >
                                                                        {truncateText(product.name, 30)}
                                                                    </td>

                                                                    <td>{product?.hsn_code}</td>
                                                                    <td>{product?.product_category_name}</td>
                                                                    <td>{product?.type}</td>
                                                                    <td>{product?.unit}</td>
                                                                    <td>
                                                                        <div className="fw-semibold">
                                                                            {getCalculatedStock(product)}
                                                                        </div>

                                                                        {product?.type === "variant" && (
                                                                            <small className="text-muted">
                                                                                Including all variants
                                                                            </small>
                                                                        )}
                                                                    </td>
                                                                    <td>{product?.purchase_rate}</td>
                                                                    <td>{product?.tax}%</td>
                                                                    <td>{product?.landing_cost}</td>
                                                                    <td>
                                                                        {Math.floor(
                                                                            product?.exclude_price || 0
                                                                        )}
                                                                    </td>
                                                                    <td>{product?.selling_price}</td>
                                                                    <td>{product?.retail_price}</td>
                                                                    <td>
                                                                        {product?.purchase_type ===
                                                                            "International"
                                                                            ? "IN"
                                                                            : "Local"}
                                                                    </td>

                                                                    <td>
                                                                        <UncontrolledDropdown>
                                                                            <DropdownToggle
                                                                                tag="a"
                                                                                className="card-drop"
                                                                            >
                                                                                <i className="mdi mdi-dots-horizontal font-size-18"></i>
                                                                            </DropdownToggle>

                                                                            <DropdownMenu className="dropdown-menu-end">
                                                                                {/* <DropdownItem
                                                                                    onClick={() =>
                                                                                        handleEditVie(product.id)
                                                                                    }
                                                                                >
                                                                                    <i
                                                                                        className="mdi mdi-pencil font-size-16 text-success me-1"
                                                                                        id={`edittooltip-${product.id}`}
                                                                                    ></i>
                                                                                    Edit
                                                                                    <UncontrolledTooltip
                                                                                        placement="top"
                                                                                        target={`edittooltip-${product.id}`}
                                                                                    >
                                                                                        Edit
                                                                                    </UncontrolledTooltip>
                                                                                </DropdownItem> */}
                                                                                
                                                                                <DropdownItem
                                                                                    onClick={() => handleEditVie(product.id)}
                                                                                >
                                                                                    <i className="mdi mdi-pencil font-size-16 text-success me-1"></i>
                                                                                    Edit
                                                                                </DropdownItem>
                                                                            </DropdownMenu>
                                                                        </UncontrolledDropdown>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td
                                                                    colSpan="16"
                                                                    className="text-center"
                                                                >
                                                                    No products available
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </div>

                                            {/* <div className="d-flex justify-content-between align-items-center mt-3">
                                                <div>
                                                    Showing {products.length} products on this page
                                                </div>

                                                <div className="d-flex gap-2">
                                                    <Button
                                                        color="secondary"
                                                        disabled={!previousPageUrl || loading}
                                                        onClick={handlePreviousPage}
                                                    >
                                                        Previous
                                                    </Button>

                                                    <Button color="light" disabled>
                                                        Page {currentPage}
                                                    </Button>

                                                    <Button
                                                        color="secondary"
                                                        disabled={!nextPageUrl || loading}
                                                        onClick={handleNextPage}
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            </div> */}

                                            <div className="text-center mt-3">
                                                {loadingMore ? (
                                                    <p className="text-muted mb-0">Loading more products...</p>
                                                ) : nextPageUrl ? (
                                                    <p className="text-muted mb-0">Scroll down to load more products</p>
                                                ) : (
                                                    <p className="text-muted mb-0">All products loaded</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </React.Fragment>
    );
};

export default BasicTable;