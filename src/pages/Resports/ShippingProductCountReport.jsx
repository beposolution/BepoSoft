import React, { useEffect, useMemo, useState } from "react";
import {
    Badge,
    Button,
    Card,
    CardBody,
    Col,
    Input,
    Row,
    Spinner,
    Table,
} from "reactstrap";
import axios from "axios";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx-js-style";

const ShippingProductCountReport = () => {
    const token = localStorage.getItem("token");

    document.title = "Shipping Product Count Report | Beposoft";

    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);

    const [products, setProducts] = useState([]);
    const [productSearch, setProductSearch] = useState("");

    const [customers, setCustomers] = useState([]);
    const [customerSearch, setCustomerSearch] = useState("");

    const [staffs, setStaffs] = useState([]);
    const [staffSearch, setStaffSearch] = useState("");

    const [filters, setFilters] = useState({
        start_date: "",
        end_date: "",
        product_id: "",
        customer_id: "",
        manage_staff_id: "",
        search: "",
    });

    const apiBase = import.meta.env.VITE_APP_KEY;

    const authHeaders = useMemo(
        () => ({
            Authorization: `Bearer ${token}`,
        }),
        [token]
    );

    useEffect(() => {
        if (!token) {
            toast.error("Authentication token not found");
        }
    }, [token]);

    const extractArray = (responseData) => {
        if (Array.isArray(responseData)) return responseData;
        if (Array.isArray(responseData?.data)) return responseData.data;
        if (Array.isArray(responseData?.results)) return responseData.results;
        if (Array.isArray(responseData?.results?.data)) {
            return responseData.results.data;
        }

        return [];
    };

    const fetchProducts = async (search = "") => {
        if (!token) return;

        try {
            const response = await axios.get(`${apiBase}products/`, {
                headers: authHeaders,
                params: {
                    search: search || undefined,
                    page: 1,
                    page_size: 100,
                },
            });

            setProducts(extractArray(response.data));
        } catch (error) {
            console.error(
                "Product API error:",
                error?.response?.data || error?.message
            );
            setProducts([]);
        }
    };

    const fetchCustomers = async (search = "") => {
        if (!token) return;

        try {
            const response = await axios.get(`${apiBase}customers/`, {
                headers: authHeaders,
                params: {
                    search: search || undefined,
                    page: 1,
                    page_size: 100,
                },
            });

            setCustomers(extractArray(response.data));
        } catch (error) {
            console.error(
                "Customer API error:",
                error?.response?.data || error?.message
            );
            setCustomers([]);
        }
    };

    const fetchStaffs = async (search = "") => {
        if (!token) return;

        try {
            const response = await axios.get(`${apiBase}get/staffs/`, {
                headers: authHeaders,
                params: {
                    search: search || undefined,
                    page: 1,
                    page_size: 100,
                },
            });

            setStaffs(extractArray(response.data));
        } catch (error) {
            console.error(
                "Staff API error:",
                error?.response?.data || error?.message
            );
            setStaffs([]);
        }
    };

    useEffect(() => {
        if (!token) return;

        fetchProducts();
        fetchCustomers();
        fetchStaffs();
    }, [token]);

    const handleFilterChange = (key, value) => {
        setFilters((previous) => ({
            ...previous,
            [key]: value,
        }));

        setReport(null);
    };

    const buildParams = () => {
        const params = {};

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== "" && value !== null && value !== undefined) {
                params[key] = value;
            }
        });

        return params;
    };

    const validateFilters = () => {
        if (
            filters.start_date &&
            filters.end_date &&
            filters.start_date > filters.end_date
        ) {
            toast.warning("Start date cannot be after end date");
            return false;
        }

        return true;
    };

    const fetchReport = async () => {
        if (!validateFilters()) return;

        try {
            setLoading(true);

            const response = await axios.get(
                `${apiBase}orders/shipping/product/count/`,
                {
                    headers: authHeaders,
                    params: buildParams(),
                }
            );

            setReport(response.data);
            toast.success(
                response.data?.message ||
                    "Shipping product count report loaded successfully"
            );
        } catch (error) {
            console.error(
                "Shipping report error:",
                error?.response?.data || error?.message
            );

            toast.error(
                error?.response?.data?.message ||
                    error?.response?.data?.errors ||
                    "Failed to fetch shipping product count report"
            );

            setReport(null);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setFilters({
            start_date: "",
            end_date: "",
            product_id: "",
            customer_id: "",
            manage_staff_id: "",
            search: "",
        });

        setProductSearch("");
        setCustomerSearch("");
        setStaffSearch("");
        setReport(null);
    };

    const formatAmount = (amount) => {
        const value = Number(amount || 0);

        return `₹${value.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const formatNumber = (value) => {
        return Number(value || 0).toLocaleString("en-IN");
    };

    const getSummary = (type) => {
        return (
            report?.summary?.[type] || {
                total_orders: 0,
                total_amount: 0,
                total_product_quantity: 0,
                total_distinct_products: 0,
                status_wise: [],
            }
        );
    };

    const productOptions = products.map((product) => ({
        value: String(product.id),
        label:
            product.name ||
            product.product_name ||
            product.title ||
            `Product ${product.id}`,
    }));

    const customerOptions = customers.map((customer) => ({
        value: String(customer.id),
        label:
            customer.name ||
            customer.customer_name ||
            customer.phone ||
            `Customer ${customer.id}`,
    }));

    const staffOptions = staffs.map((staff) => ({
        value: String(staff.id),
        label:
            staff.name ||
            staff.staff_name ||
            staff.username ||
            `Staff ${staff.id}`,
    }));

    const selectedProduct =
        productOptions.find(
            (option) => option.value === String(filters.product_id)
        ) || null;

    const selectedCustomer =
        customerOptions.find(
            (option) => option.value === String(filters.customer_id)
        ) || null;

    const selectedStaff =
        staffOptions.find(
            (option) => option.value === String(filters.manage_staff_id)
        ) || null;

    const selectCommonStyles = {
        control: (base, state) => ({
            ...base,
            minHeight: "48px",
            borderRadius: "10px",
            border: state.isFocused
                ? "1.5px solid #2563eb"
                : "1.5px solid #b8c2d6",
            boxShadow: state.isFocused
                ? "0 0 0 3px rgba(37, 99, 235, 0.12)"
                : "none",
            fontSize: "14px",
            fontWeight: "600",
            backgroundColor: "#ffffff",
            "&:hover": {
                borderColor: "#2563eb",
            },
        }),
        menu: (base) => ({
            ...base,
            zIndex: 9999,
        }),
        option: (base) => ({
            ...base,
            fontSize: "14px",
            fontWeight: "600",
        }),
        placeholder: (base) => ({
            ...base,
            color: "#64748b",
        }),
    };

    const renderSummaryCard = (
        title,
        value,
        subtitle,
        borderColor,
        backgroundColor
    ) => (
        <Card
            className="border-0 h-100"
            style={{
                ...summaryCardStyle,
                borderLeft: `5px solid ${borderColor}`,
                backgroundColor,
            }}
        >
            <CardBody className="p-4">
                <div style={summaryLabelStyle}>{title}</div>
                <div style={summaryValueStyle}>{value}</div>
                <div style={summarySubtitleStyle}>{subtitle}</div>
            </CardBody>
        </Card>
    );

    const renderStatusTable = (title, summary, accentColor) => {
        const rows = summary?.status_wise || [];

        return (
            <Card className="border-0 mb-4" style={tableCardStyle}>
                <CardBody className="p-4">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                        <div>
                            <h4 className="mb-1" style={sectionTitleStyle}>
                                {title}
                            </h4>

                            <p className="mb-0" style={sectionSubtitleStyle}>
                                Status-wise order, amount and product totals
                            </p>
                        </div>

                        <Badge
                            pill
                            className="px-3 py-2"
                            style={{
                                backgroundColor: accentColor,
                                color: "#ffffff",
                            }}
                        >
                            {formatNumber(summary?.total_orders)} Orders
                        </Badge>
                    </div>

                    <div className="table-responsive" style={tableWrapperStyle}>
                        <Table className="mb-0 align-middle">
                            <thead>
                                <tr>
                                    <th style={nameHeaderStyle}>Status</th>
                                    <th style={tableHeaderStyle}>Orders</th>
                                    <th style={tableHeaderStyle}>Amount</th>
                                    <th style={tableHeaderStyle}>
                                        Product Quantity
                                    </th>
                                    <th style={tableHeaderStyle}>
                                        Distinct Products
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="text-center py-4"
                                            style={emptyStyle}
                                        >
                                            No data available
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((item, index) => (
                                        <tr
                                            key={`${item.status}-${index}`}
                                            style={{
                                                backgroundColor:
                                                    index % 2 === 0
                                                        ? "#ffffff"
                                                        : "#f8fafc",
                                            }}
                                        >
                                            <td style={nameTdStyle}>
                                                {item.status || "N/A"}
                                            </td>

                                            <td style={tableTdStyle}>
                                                {formatNumber(item.order_count)}
                                            </td>

                                            <td style={tableTdStyle}>
                                                {formatAmount(item.total_amount)}
                                            </td>

                                            <td style={tableTdStyle}>
                                                {formatNumber(
                                                    item.total_product_quantity
                                                )}
                                            </td>

                                            <td style={tableTdStyle}>
                                                {formatNumber(
                                                    item.total_distinct_products
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}

                                <tr style={{ backgroundColor: "#0f172a" }}>
                                    <td style={totalNameTdStyle}>TOTAL</td>

                                    <td style={totalTdStyle}>
                                        {formatNumber(summary?.total_orders)}
                                    </td>

                                    <td style={totalTdStyle}>
                                        {formatAmount(summary?.total_amount)}
                                    </td>

                                    <td style={totalTdStyle}>
                                        {formatNumber(
                                            summary?.total_product_quantity
                                        )}
                                    </td>

                                    <td style={totalTdStyle}>
                                        {formatNumber(
                                            summary?.total_distinct_products
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                </CardBody>
            </Card>
        );
    };

    const exportToExcel = () => {
        if (!report?.summary) {
            toast.warning("No report data to export");
            return;
        }

        const workbook = XLSX.utils.book_new();
        const sheetData = [];
        const merges = [];
        const titleRows = [];
        const headerRows = [];
        const totalRows = [];

        const addMergedTitle = (title, color) => {
            const rowIndex = sheetData.length;
            sheetData.push([title]);

            merges.push({
                s: { r: rowIndex, c: 0 },
                e: { r: rowIndex, c: 4 },
            });

            titleRows.push({
                rowIndex,
                color,
            });
        };

        addMergedTitle("SHIPPING PRODUCT COUNT REPORT", "1D4ED8");
        sheetData.push([]);

        sheetData.push([
            "Start Date",
            filters.start_date || "All",
            "End Date",
            filters.end_date || "All",
        ]);

        sheetData.push([
            "Product",
            selectedProduct?.label || "All",
            "Customer",
            selectedCustomer?.label || "All",
        ]);

        sheetData.push([
            "Staff",
            selectedStaff?.label || "All",
            "Search",
            filters.search || "-",
        ]);

        sheetData.push([]);

        const summarySections = [
            {
                key: "overall",
                title: "OVERALL SUMMARY",
                color: "2563EB",
            },
            {
                key: "pending",
                title: "PENDING SUMMARY",
                color: "F59E0B",
            },
            {
                key: "dispatched",
                title: "DISPATCHED SUMMARY",
                color: "16A34A",
            },
        ];

        summarySections.forEach((section) => {
            const summary = getSummary(section.key);

            addMergedTitle(section.title, section.color);

            headerRows.push(sheetData.length);

            sheetData.push([
                "Metric",
                "Value",
                "",
                "",
                "",
            ]);

            sheetData.push([
                "Total Orders",
                summary.total_orders || 0,
            ]);

            sheetData.push([
                "Total Amount",
                summary.total_amount || 0,
            ]);

            sheetData.push([
                "Total Product Quantity",
                summary.total_product_quantity || 0,
            ]);

            sheetData.push([
                "Total Distinct Products",
                summary.total_distinct_products || 0,
            ]);

            sheetData.push([]);

            addMergedTitle(
                `${section.title.replace("SUMMARY", "STATUS-WISE")}`,
                section.color
            );

            headerRows.push(sheetData.length);

            sheetData.push([
                "Status",
                "Orders",
                "Amount",
                "Product Quantity",
                "Distinct Products",
            ]);

            (summary.status_wise || []).forEach((item) => {
                sheetData.push([
                    item.status || "N/A",
                    item.order_count || 0,
                    item.total_amount || 0,
                    item.total_product_quantity || 0,
                    item.total_distinct_products || 0,
                ]);
            });

            totalRows.push(sheetData.length);

            sheetData.push([
                "TOTAL",
                summary.total_orders || 0,
                summary.total_amount || 0,
                summary.total_product_quantity || 0,
                summary.total_distinct_products || 0,
            ]);

            sheetData.push([]);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        worksheet["!merges"] = merges;

        worksheet["!cols"] = [
            { wch: 35 },
            { wch: 20 },
            { wch: 22 },
            { wch: 22 },
            { wch: 22 },
        ];

        const borderStyle = {
            top: { style: "thin", color: { rgb: "CBD5E1" } },
            bottom: { style: "thin", color: { rgb: "CBD5E1" } },
            left: { style: "thin", color: { rgb: "CBD5E1" } },
            right: { style: "thin", color: { rgb: "CBD5E1" } },
        };

        Object.keys(worksheet).forEach((cellReference) => {
            if (cellReference.startsWith("!")) return;

            worksheet[cellReference].s = {
                font: {
                    name: "Calibri",
                    size: 11,
                    color: { rgb: "111827" },
                },
                alignment: {
                    horizontal: "center",
                    vertical: "center",
                    wrapText: true,
                },
                border: borderStyle,
            };
        });

        titleRows.forEach(({ rowIndex, color }) => {
            for (let column = 0; column <= 4; column += 1) {
                const reference = XLSX.utils.encode_cell({
                    r: rowIndex,
                    c: column,
                });

                if (!worksheet[reference]) {
                    worksheet[reference] = {
                        t: "s",
                        v: "",
                    };
                }

                worksheet[reference].s = {
                    font: {
                        bold: true,
                        size: rowIndex === 0 ? 16 : 13,
                        color: { rgb: "FFFFFF" },
                    },
                    fill: {
                        fgColor: { rgb: color },
                    },
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                    },
                    border: borderStyle,
                };
            }
        });

        headerRows.forEach((rowIndex) => {
            for (let column = 0; column <= 4; column += 1) {
                const reference = XLSX.utils.encode_cell({
                    r: rowIndex,
                    c: column,
                });

                if (!worksheet[reference]) continue;

                worksheet[reference].s = {
                    font: {
                        bold: true,
                        color: { rgb: "FFFFFF" },
                    },
                    fill: {
                        fgColor: { rgb: "0F172A" },
                    },
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                        wrapText: true,
                    },
                    border: borderStyle,
                };
            }
        });

        totalRows.forEach((rowIndex) => {
            for (let column = 0; column <= 4; column += 1) {
                const reference = XLSX.utils.encode_cell({
                    r: rowIndex,
                    c: column,
                });

                if (!worksheet[reference]) continue;

                worksheet[reference].s = {
                    font: {
                        bold: true,
                        color: { rgb: "FFFFFF" },
                    },
                    fill: {
                        fgColor: { rgb: "0F172A" },
                    },
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                    },
                    border: borderStyle,
                };
            }
        });

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Shipping Summary"
        );

        XLSX.writeFile(
            workbook,
            `Shipping_Product_Count_${filters.start_date || "all"}_to_${
                filters.end_date || "all"
            }.xlsx`
        );
    };

    const overallSummary = getSummary("overall");
    const pendingSummary = getSummary("pending");
    const dispatchedSummary = getSummary("dispatched");

    return (
        <React.Fragment>
            <div
                className="page-content"
                style={{ backgroundColor: "#f3f6fb", minHeight: "100vh" }}
            >
                <ToastContainer />

                <div className="container-fluid">
                    <Row>
                        <Col xl={12}>
                            <Card className="border-0" style={mainCardStyle}>
                                <CardBody className="p-4">
                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                                        <div>
                                            <h4
                                                className="mb-1"
                                                style={mainTitleStyle}
                                            >
                                                Shipping Product Count Report
                                            </h4>

                                            <p
                                                className="mb-0"
                                                style={subTitleStyle}
                                            >
                                                View overall, pending and
                                                dispatched shipping summaries.
                                            </p>
                                        </div>

                                        <div className="d-flex gap-2 flex-wrap">
                                            <Badge
                                                color="primary"
                                                pill
                                                className="px-3 py-2"
                                            >
                                                Summary Report
                                            </Badge>

                                            {report && (
                                                <Badge
                                                    color="success"
                                                    pill
                                                    className="px-3 py-2"
                                                >
                                                    Data Loaded
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <Row className="g-3 align-items-end mb-3">
                                        <Col xl={2} md={6}>
                                            <label
                                                className="form-label"
                                                style={labelStyle}
                                            >
                                                Start Date
                                            </label>

                                            <Input
                                                type="date"
                                                value={filters.start_date}
                                                onChange={(event) =>
                                                    handleFilterChange(
                                                        "start_date",
                                                        event.target.value
                                                    )
                                                }
                                                style={inputStyle}
                                            />
                                        </Col>

                                        <Col xl={2} md={6}>
                                            <label
                                                className="form-label"
                                                style={labelStyle}
                                            >
                                                End Date
                                            </label>

                                            <Input
                                                type="date"
                                                value={filters.end_date}
                                                onChange={(event) =>
                                                    handleFilterChange(
                                                        "end_date",
                                                        event.target.value
                                                    )
                                                }
                                                style={inputStyle}
                                            />
                                        </Col>

                                        <Col xl={4} md={6}>
                                            <label
                                                className="form-label"
                                                style={labelStyle}
                                            >
                                                Product
                                            </label>

                                            <Select
                                                value={selectedProduct}
                                                options={productOptions}
                                                isClearable
                                                isSearchable
                                                placeholder="Search product"
                                                inputValue={productSearch}
                                                onInputChange={(
                                                    value,
                                                    actionMeta
                                                ) => {
                                                    if (
                                                        actionMeta.action ===
                                                        "input-change"
                                                    ) {
                                                        setProductSearch(value);
                                                        fetchProducts(value);
                                                    }
                                                }}
                                                onChange={(selected) =>
                                                    handleFilterChange(
                                                        "product_id",
                                                        selected
                                                            ? selected.value
                                                            : ""
                                                    )
                                                }
                                                styles={selectCommonStyles}
                                                noOptionsMessage={() =>
                                                    "No products found"
                                                }
                                            />
                                        </Col>

                                        <Col xl={4} md={6}>
                                            <label
                                                className="form-label"
                                                style={labelStyle}
                                            >
                                                Search
                                            </label>

                                            <Input
                                                type="text"
                                                value={filters.search}
                                                placeholder="Invoice, customer, staff, company or product"
                                                onChange={(event) =>
                                                    handleFilterChange(
                                                        "search",
                                                        event.target.value
                                                    )
                                                }
                                                onKeyDown={(event) => {
                                                    if (
                                                        event.key === "Enter" &&
                                                        !loading
                                                    ) {
                                                        fetchReport();
                                                    }
                                                }}
                                                style={inputStyle}
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="g-3 align-items-end">
                                        <Col xl={4} md={6}>
                                            <label
                                                className="form-label"
                                                style={labelStyle}
                                            >
                                                Customer
                                            </label>

                                            <Select
                                                value={selectedCustomer}
                                                options={customerOptions}
                                                isClearable
                                                isSearchable
                                                placeholder="Search customer"
                                                inputValue={customerSearch}
                                                onInputChange={(
                                                    value,
                                                    actionMeta
                                                ) => {
                                                    if (
                                                        actionMeta.action ===
                                                        "input-change"
                                                    ) {
                                                        setCustomerSearch(value);
                                                        fetchCustomers(value);
                                                    }
                                                }}
                                                onChange={(selected) =>
                                                    handleFilterChange(
                                                        "customer_id",
                                                        selected
                                                            ? selected.value
                                                            : ""
                                                    )
                                                }
                                                styles={selectCommonStyles}
                                                noOptionsMessage={() =>
                                                    "No customers found"
                                                }
                                            />
                                        </Col>

                                        <Col xl={4} md={6}>
                                            <label
                                                className="form-label"
                                                style={labelStyle}
                                            >
                                                Manage Staff
                                            </label>

                                            <Select
                                                value={selectedStaff}
                                                options={staffOptions}
                                                isClearable
                                                isSearchable
                                                placeholder="Search staff"
                                                inputValue={staffSearch}
                                                onInputChange={(
                                                    value,
                                                    actionMeta
                                                ) => {
                                                    if (
                                                        actionMeta.action ===
                                                        "input-change"
                                                    ) {
                                                        setStaffSearch(value);
                                                        fetchStaffs(value);
                                                    }
                                                }}
                                                onChange={(selected) =>
                                                    handleFilterChange(
                                                        "manage_staff_id",
                                                        selected
                                                            ? selected.value
                                                            : ""
                                                    )
                                                }
                                                styles={selectCommonStyles}
                                                noOptionsMessage={() =>
                                                    "No staff found"
                                                }
                                            />
                                        </Col>

                                        <Col xl={2} md={4}>
                                            <Button
                                                color="primary"
                                                className="w-100"
                                                onClick={fetchReport}
                                                disabled={loading || !token}
                                                style={buttonStyle}
                                            >
                                                {loading ? (
                                                    <>
                                                        <Spinner
                                                            size="sm"
                                                            className="me-2"
                                                        />
                                                        Loading...
                                                    </>
                                                ) : (
                                                    "View Report"
                                                )}
                                            </Button>
                                        </Col>

                                        <Col xl={2} md={4}>
                                            <Button
                                                color="secondary"
                                                className="w-100"
                                                onClick={clearFilters}
                                                disabled={loading}
                                                style={buttonStyle}
                                            >
                                                Clear
                                            </Button>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {report && (
                        <>
                            <Row className="g-3 mt-1 mb-4">
                                <Col xl={3} md={6}>
                                    {renderSummaryCard(
                                        "Overall Orders",
                                        formatNumber(
                                            overallSummary.total_orders
                                        ),
                                        "All pending and dispatched orders",
                                        "#2563eb",
                                        "#eff6ff"
                                    )}
                                </Col>

                                <Col xl={3} md={6}>
                                    {renderSummaryCard(
                                        "Overall Amount",
                                        formatAmount(
                                            overallSummary.total_amount
                                        ),
                                        "Combined order value",
                                        "#7c3aed",
                                        "#f5f3ff"
                                    )}
                                </Col>

                                <Col xl={3} md={6}>
                                    {renderSummaryCard(
                                        "Product Quantity",
                                        formatNumber(
                                            overallSummary.total_product_quantity
                                        ),
                                        "Total item quantity",
                                        "#0891b2",
                                        "#ecfeff"
                                    )}
                                </Col>

                                <Col xl={3} md={6}>
                                    {renderSummaryCard(
                                        "Distinct Products",
                                        formatNumber(
                                            overallSummary.total_distinct_products
                                        ),
                                        "Unique products in selected orders",
                                        "#ea580c",
                                        "#fff7ed"
                                    )}
                                </Col>
                            </Row>

                            <Row className="g-3 mb-4">
                                <Col xl={6}>
                                    <Card
                                        className="border-0 h-100"
                                        style={{
                                            ...groupSummaryCardStyle,
                                            borderTop: "5px solid #f59e0b",
                                        }}
                                    >
                                        <CardBody className="p-4">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div>
                                                    <h4
                                                        className="mb-1"
                                                        style={
                                                            groupSummaryTitleStyle
                                                        }
                                                    >
                                                        Pending Summary
                                                    </h4>
                                                    <p
                                                        className="mb-0"
                                                        style={
                                                            groupSummarySubtitleStyle
                                                        }
                                                    >
                                                        Orders not yet shipped
                                                    </p>
                                                </div>

                                                <Badge
                                                    color="warning"
                                                    pill
                                                    className="px-3 py-2"
                                                >
                                                    Pending
                                                </Badge>
                                            </div>

                                            <Row className="g-3">
                                                <Col md={6}>
                                                    <div style={metricBoxStyle}>
                                                        <span>Orders</span>
                                                        <strong>
                                                            {formatNumber(
                                                                pendingSummary.total_orders
                                                            )}
                                                        </strong>
                                                    </div>
                                                </Col>

                                                <Col md={6}>
                                                    <div style={metricBoxStyle}>
                                                        <span>Amount</span>
                                                        <strong>
                                                            {formatAmount(
                                                                pendingSummary.total_amount
                                                            )}
                                                        </strong>
                                                    </div>
                                                </Col>

                                                <Col md={6}>
                                                    <div style={metricBoxStyle}>
                                                        <span>
                                                            Product Quantity
                                                        </span>
                                                        <strong>
                                                            {formatNumber(
                                                                pendingSummary.total_product_quantity
                                                            )}
                                                        </strong>
                                                    </div>
                                                </Col>

                                                <Col md={6}>
                                                    <div style={metricBoxStyle}>
                                                        <span>
                                                            Distinct Products
                                                        </span>
                                                        <strong>
                                                            {formatNumber(
                                                                pendingSummary.total_distinct_products
                                                            )}
                                                        </strong>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </CardBody>
                                    </Card>
                                </Col>

                                <Col xl={6}>
                                    <Card
                                        className="border-0 h-100"
                                        style={{
                                            ...groupSummaryCardStyle,
                                            borderTop: "5px solid #16a34a",
                                        }}
                                    >
                                        <CardBody className="p-4">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div>
                                                    <h4
                                                        className="mb-1"
                                                        style={
                                                            groupSummaryTitleStyle
                                                        }
                                                    >
                                                        Dispatched Summary
                                                    </h4>
                                                    <p
                                                        className="mb-0"
                                                        style={
                                                            groupSummarySubtitleStyle
                                                        }
                                                    >
                                                        Orders already shipped
                                                    </p>
                                                </div>

                                                <Badge
                                                    color="success"
                                                    pill
                                                    className="px-3 py-2"
                                                >
                                                    Shipped
                                                </Badge>
                                            </div>

                                            <Row className="g-3">
                                                <Col md={6}>
                                                    <div style={metricBoxStyle}>
                                                        <span>Orders</span>
                                                        <strong>
                                                            {formatNumber(
                                                                dispatchedSummary.total_orders
                                                            )}
                                                        </strong>
                                                    </div>
                                                </Col>

                                                <Col md={6}>
                                                    <div style={metricBoxStyle}>
                                                        <span>Amount</span>
                                                        <strong>
                                                            {formatAmount(
                                                                dispatchedSummary.total_amount
                                                            )}
                                                        </strong>
                                                    </div>
                                                </Col>

                                                <Col md={6}>
                                                    <div style={metricBoxStyle}>
                                                        <span>
                                                            Product Quantity
                                                        </span>
                                                        <strong>
                                                            {formatNumber(
                                                                dispatchedSummary.total_product_quantity
                                                            )}
                                                        </strong>
                                                    </div>
                                                </Col>

                                                <Col md={6}>
                                                    <div style={metricBoxStyle}>
                                                        <span>
                                                            Distinct Products
                                                        </span>
                                                        <strong>
                                                            {formatNumber(
                                                                dispatchedSummary.total_distinct_products
                                                            )}
                                                        </strong>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <Col
                                    xl={12}
                                    className="d-flex justify-content-end"
                                >
                                    <Button
                                        color="success"
                                        onClick={exportToExcel}
                                        style={{
                                            ...buttonStyle,
                                            minWidth: "180px",
                                        }}
                                    >
                                        Export Excel
                                    </Button>
                                </Col>
                            </Row>

                            {renderStatusTable(
                                "Pending Status Summary",
                                pendingSummary,
                                "#f59e0b"
                            )}

                            {renderStatusTable(
                                "Dispatched Status Summary",
                                dispatchedSummary,
                                "#16a34a"
                            )}
                        </>
                    )}

                    {!report && !loading && (
                        <Card
                            className="border-0 mt-4"
                            style={emptyCardStyle}
                        >
                            <CardBody className="p-5 text-center">
                                <h4 style={emptyTitleStyle}>
                                    Shipping report is ready
                                </h4>

                                <p className="mb-0" style={emptySubtitleStyle}>
                                    Select the required filters and click View
                                    Report.
                                </p>
                            </CardBody>
                        </Card>
                    )}
                </div>
            </div>
        </React.Fragment>
    );
};

const labelStyle = {
    fontSize: "14px",
    fontWeight: "800",
    color: "#111827",
    marginBottom: "8px",
};

const inputStyle = {
    height: "48px",
    borderRadius: "10px",
    border: "1.5px solid #b8c2d6",
    color: "#111827",
    fontSize: "14px",
    fontWeight: "600",
    backgroundColor: "#ffffff",
};

const mainCardStyle = {
    borderRadius: "18px",
    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.10)",
};

const mainTitleStyle = {
    fontWeight: "900",
    color: "#111827",
    fontSize: "22px",
};

const subTitleStyle = {
    color: "#475569",
    fontSize: "14px",
    fontWeight: "500",
};

const buttonStyle = {
    height: "48px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "800",
};

const summaryCardStyle = {
    borderRadius: "16px",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
};

const summaryLabelStyle = {
    color: "#475569",
    fontSize: "13px",
    fontWeight: "800",
    marginBottom: "8px",
};

const summaryValueStyle = {
    color: "#0f172a",
    fontSize: "25px",
    fontWeight: "900",
    lineHeight: 1.2,
};

const summarySubtitleStyle = {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "600",
    marginTop: "8px",
};

const groupSummaryCardStyle = {
    borderRadius: "18px",
    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.10)",
};

const groupSummaryTitleStyle = {
    fontWeight: "900",
    color: "#111827",
    fontSize: "19px",
};

const groupSummarySubtitleStyle = {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "600",
};

const metricBoxStyle = {
    backgroundColor: "#f8fafc",
    border: "1.5px solid #d7deea",
    borderRadius: "13px",
    padding: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "800",
};

const tableCardStyle = {
    borderRadius: "18px",
    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.10)",
};

const sectionTitleStyle = {
    fontWeight: "900",
    color: "#111827",
    fontSize: "18px",
};

const sectionSubtitleStyle = {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "600",
};

const tableWrapperStyle = {
    border: "1.5px solid #d7deea",
    borderRadius: "14px",
    overflow: "hidden",
    backgroundColor: "#ffffff",
};

const tableHeaderStyle = {
    padding: "14px",
    backgroundColor: "#f8fafc",
    color: "#1e293b",
    fontSize: "13px",
    fontWeight: "900",
    borderBottom: "1.5px solid #cbd5e1",
    whiteSpace: "nowrap",
    textAlign: "center",
};

const nameHeaderStyle = {
    ...tableHeaderStyle,
    textAlign: "left",
    minWidth: "230px",
};

const tableTdStyle = {
    padding: "14px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "800",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
    textAlign: "center",
};

const nameTdStyle = {
    ...tableTdStyle,
    textAlign: "left",
    fontWeight: "900",
    color: "#0f172a",
};

const totalNameTdStyle = {
    padding: "14px",
    color: "#ffffff",
    backgroundColor: "#0f172a",
    fontSize: "13px",
    fontWeight: "900",
    textAlign: "left",
    whiteSpace: "nowrap",
};

const totalTdStyle = {
    padding: "14px",
    color: "#ffffff",
    backgroundColor: "#0f172a",
    fontSize: "13px",
    fontWeight: "900",
    textAlign: "center",
    whiteSpace: "nowrap",
};

const emptyStyle = {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "700",
};

const emptyCardStyle = {
    borderRadius: "18px",
    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.08)",
};

const emptyTitleStyle = {
    color: "#111827",
    fontWeight: "900",
    fontSize: "20px",
};

const emptySubtitleStyle = {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
};

export default ShippingProductCountReport;
