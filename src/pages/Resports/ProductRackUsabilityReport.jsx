import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Badge,
    Button,
    Card,
    CardBody,
    Col,
    Collapse,
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

const ProductRackUsabilityReport = () => {
    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    document.title = "Product Rack Usability Report | Beposoft";

    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);

    const [report, setReport] = useState(null);
    const [expandedProducts, setExpandedProducts] = useState({});

    const [warehouses, setWarehouses] = useState([]);
    const [families, setFamilies] = useState([]);
    const [mainCategories, setMainCategories] = useState([]);
    const [productCategories, setProductCategories] = useState([]);
    const [createdUsers, setCreatedUsers] = useState([]);
    const [approvedUsers, setApprovedUsers] = useState([]);
    const [createdUserLoading, setCreatedUserLoading] = useState(false);
    const [approvedUserLoading, setApprovedUserLoading] = useState(false);

    const tableSectionRef = useRef(null);
    const tableScrollRef = useRef(null);
    const isFetchingRef = useRef(false);
    const createdUserSearchTimerRef = useRef(null);
    const approvedUserSearchTimerRef = useRef(null);

    const [filters, setFilters] = useState({
        usability: "usable",
        start_date: "",
        end_date: "",
        search: "",
        product_id: "",
        warehouse_id: "",
        main_category_id: "",
        product_category_id: "",
        family_id: "",
        created_user_id: "",
        approved_user_id: "",
        product_type: "",
        purchase_type: "",
        approval_status: "",
        unit: "",
        color: "",
        size: "",
        rack_id: "",
        rack_name: "",
        column_name: "",
        min_stock: "",
        max_stock: "",
        min_purchase_rate: "",
        max_purchase_rate: "",
        min_selling_price: "",
        max_selling_price: "",
        min_landing_cost: "",
        max_landing_cost: "",
        min_retail_price: "",
        max_retail_price: "",
        min_final_price: "",
        max_final_price: "",
        tax: "",
        has_stock: "",
        ordering: "-id",
        page: 1,
        page_size: 50,
    });

    const usabilityOptions = [
        {
            value: "usable",
            label: "Usable",
            description: "Products available for normal sale",
        },
        {
            value: "damaged",
            label: "Damaged",
            description: "Completely damaged products",
        },
        {
            value: "partially_damaged",
            label: "Partially Damaged",
            description: "Products with partial damage",
        },
        {
            value: "liquidation_stock",
            label: "Liquidation Stock",
            description: "Products allocated for liquidation",
        },
        {
            value: "all",
            label: "All Types",
            description: "Display all usability categories",
        },
    ];

    const productTypeOptions = [
        { value: "single", label: "Single" },
        { value: "variant", label: "Variant" },
    ];

    const purchaseTypeOptions = [
        { value: "Local", label: "Local" },
        { value: "International", label: "International" },
    ];

    const approvalStatusOptions = [
        { value: "Approved", label: "Approved" },
        { value: "Disapproved", label: "Disapproved" },
    ];

    const unitOptions = [
        { value: "BOX", label: "BOX" },
        { value: "NOS", label: "NOS" },
        { value: "PRS", label: "PRS" },
        { value: "SET", label: "SET" },
        { value: "SET OF 6", label: "SET OF 6" },
        { value: "SET OF 8", label: "SET OF 8" },
        { value: "SET OF 12", label: "SET OF 12" },
        { value: "SET OF 16", label: "SET OF 16" },
    ];

    const hasStockOptions = [
        { value: "true", label: "With Stock" },
        { value: "false", label: "Without Stock" },
    ];

    const orderingOptions = [
        { value: "-id", label: "Newest Products" },
        { value: "id", label: "Oldest Products" },
        { value: "name", label: "Product Name A–Z" },
        { value: "-name", label: "Product Name Z–A" },
        { value: "-date", label: "Latest Product Date" },
        { value: "date", label: "Oldest Product Date" },
        { value: "-rack_quantity", label: "Highest Rack Stock" },
        { value: "rack_quantity", label: "Lowest Rack Stock" },
        {
            value: "-available_quantity",
            label: "Highest Available Stock",
        },
        {
            value: "available_quantity",
            label: "Lowest Available Stock",
        },
        {
            value: "-locked_quantity",
            label: "Highest Locked Stock",
        },
        {
            value: "locked_quantity",
            label: "Lowest Locked Stock",
        },
        {
            value: "-purchase_rate",
            label: "Highest Purchase Rate",
        },
        {
            value: "purchase_rate",
            label: "Lowest Purchase Rate",
        },
        {
            value: "-selling_price",
            label: "Highest Selling Price",
        },
        {
            value: "selling_price",
            label: "Lowest Selling Price",
        },
    ];


    const normalizeData = useCallback((response) => {
        const responseData = response?.data;

        if (Array.isArray(responseData)) {
            return responseData;
        }

        if (Array.isArray(responseData?.data)) {
            return responseData.data;
        }

        if (Array.isArray(responseData?.results)) {
            return responseData.results;
        }

        if (Array.isArray(responseData?.results?.data)) {
            return responseData.results.data;
        }

        return [];
    }, []);

    const fetchCreatedUsers = useCallback(
        async (searchValue = "") => {
            if (!token) {
                return;
            }

            setCreatedUserLoading(true);

            try {
                const response = await axios.get(
                    `${baseUrl}get/staffs/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        params: {
                            page: 1,
                            page_size: 1000,
                            search: searchValue.trim(),
                        },
                    }
                );

                setCreatedUsers(normalizeData(response));
            } catch (error) {
                console.error(
                    "Created user API error:",
                    error?.response?.data || error?.message
                );
                toast.error("Error fetching created users.");
            } finally {
                setCreatedUserLoading(false);
            }
        },
        [baseUrl, normalizeData, token]
    );

    const fetchApprovedUsers = useCallback(
        async (searchValue = "") => {
            if (!token) {
                return;
            }

            setApprovedUserLoading(true);

            try {
                const response = await axios.get(
                    `${baseUrl}get/staffs/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        params: {
                            page: 1,
                            page_size: 1000,
                            search: searchValue.trim(),
                        },
                    }
                );

                setApprovedUsers(normalizeData(response));
            } catch (error) {
                console.error(
                    "Approved user API error:",
                    error?.response?.data || error?.message
                );
                toast.error("Error fetching approved users.");
            } finally {
                setApprovedUserLoading(false);
            }
        },
        [baseUrl, normalizeData, token]
    );

    useEffect(() => {
        const headers = {
            Authorization: `Bearer ${token}`,
        };

        const fetchWarehouses = async () => {
            try {
                const response = await axios.get(
                    `${baseUrl}warehouse/add/`,
                    { headers }
                );


                setWarehouses(normalizeData(response));
            } catch (error) {
                console.error(
                    "Warehouse API error:",
                    error?.response?.data || error?.message
                );
                toast.error("Error fetching warehouse data.");
            }
        };

        const fetchFamilies = async () => {
            try {
                const response = await axios.get(
                    `${baseUrl}familys/`,
                    { headers }
                );


                setFamilies(normalizeData(response));
            } catch (error) {
                console.error(
                    "Family API error:",
                    error?.response?.data || error?.message
                );
                toast.error("Error fetching family data.");
            }
        };

        const fetchMainCategories = async () => {
            try {
                const response = await axios.get(
                    `${baseUrl}main/categories/add/`,
                    { headers }
                );

                setMainCategories(normalizeData(response));
            } catch (error) {
                console.error(
                    "Main category API error:",
                    error?.response?.data || error?.message
                );
                toast.error("Error fetching main category data.");
            }
        };

        const fetchProductCategories = async () => {
            try {
                const response = await axios.get(
                    `${baseUrl}product/category/add/`,
                    { headers }
                );

                setProductCategories(normalizeData(response));
            } catch (error) {
                console.error(
                    "Product category API error:",
                    error?.response?.data || error?.message
                );
                toast.error("Error fetching product category data.");
            }
        };

        const fetchAllLookupData = async () => {
            if (!token) {
                return;
            }

            setLookupLoading(true);

            try {
                await Promise.all([
                    fetchWarehouses(),
                    fetchFamilies(),
                    fetchMainCategories(),
                    fetchProductCategories(),
                    fetchCreatedUsers(),
                    fetchApprovedUsers(),
                ]);
            } finally {
                setLookupLoading(false);
            }
        };

        fetchAllLookupData();
    }, [
        token,
        baseUrl,
        normalizeData,
        fetchCreatedUsers,
        fetchApprovedUsers,
    ]);

    useEffect(() => {
        return () => {
            if (createdUserSearchTimerRef.current) {
                clearTimeout(createdUserSearchTimerRef.current);
            }

            if (approvedUserSearchTimerRef.current) {
                clearTimeout(approvedUserSearchTimerRef.current);
            }
        };
    }, []);

    const handleCreatedUserSearch = (inputValue, actionMeta) => {
        if (actionMeta.action !== "input-change") {
            return inputValue;
        }

        if (createdUserSearchTimerRef.current) {
            clearTimeout(createdUserSearchTimerRef.current);
        }

        createdUserSearchTimerRef.current = setTimeout(() => {
            fetchCreatedUsers(inputValue);
        }, 500);

        return inputValue;
    };

    const handleApprovedUserSearch = (inputValue, actionMeta) => {
        if (actionMeta.action !== "input-change") {
            return inputValue;
        }

        if (approvedUserSearchTimerRef.current) {
            clearTimeout(approvedUserSearchTimerRef.current);
        }

        approvedUserSearchTimerRef.current = setTimeout(() => {
            fetchApprovedUsers(inputValue);
        }, 500);

        return inputValue;
    };

    const handleChange = (key, value) => {
        setFilters((previous) => ({
            ...previous,
            [key]: value,
            page: key === "page" ? value : 1,
        }));
    };

    const buildParams = useCallback(() => {
        const params = {};

        Object.entries(filters).forEach(([key, value]) => {
            if (key === "usability") {
                return;
            }

            if (value !== "" && value !== null && value !== undefined) {
                params[key] = value;
            }
        });

        return params;
    }, [filters]);

    const validateFilters = () => {
        if (
            filters.start_date &&
            filters.end_date &&
            filters.start_date > filters.end_date
        ) {
            toast.warning("Start date cannot be after end date.");
            return false;
        }

        const numericFields = [
            "product_id",
            "warehouse_id",
            "main_category_id",
            "product_category_id",
            "family_id",
            "created_user_id",
            "approved_user_id",
            "rack_id",
            "min_stock",
            "max_stock",
            "min_purchase_rate",
            "max_purchase_rate",
            "min_selling_price",
            "max_selling_price",
            "min_landing_cost",
            "max_landing_cost",
            "min_retail_price",
            "max_retail_price",
            "min_final_price",
            "max_final_price",
            "tax",
        ];

        for (const field of numericFields) {
            const value = filters[field];

            if (
                value !== "" &&
                value !== null &&
                value !== undefined &&
                Number.isNaN(Number(value))
            ) {
                toast.warning(
                    `${field.replaceAll("_", " ")} must be a valid number.`
                );
                return false;
            }
        }

        if (
            filters.min_stock !== "" &&
            filters.max_stock !== "" &&
            Number(filters.min_stock) > Number(filters.max_stock)
        ) {
            toast.warning(
                "Minimum stock cannot be greater than maximum stock."
            );
            return false;
        }

        return true;
    };

    const fetchReport = useCallback(
        async ({
            page = 1,
            append = false,
            showSuccessToast = true,
        } = {}) => {
            if (!token) {
                toast.error("Authentication token is missing.");
                return;
            }

            if (!validateFilters()) {
                return;
            }

            if (isFetchingRef.current) {
                return;
            }

            try {
                isFetchingRef.current = true;

                if (append) {
                    setLoadingMore(true);
                } else {
                    setLoading(true);
                }

                const apiUrl = `${baseUrl}products/rack/usability/${filters.usability}/`;

                const params = {
                    ...buildParams(),
                    page,
                };

                const response = await axios.get(apiUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params,
                });

                const responseData = response?.data || {};
                const nextProducts = Array.isArray(responseData?.data)
                    ? responseData.data
                    : [];

                if (append) {
                    setReport((previousReport) => {
                        const previousProducts = Array.isArray(previousReport?.data)
                            ? previousReport.data
                            : [];

                        const uniqueProducts = new Map();

                        [...previousProducts, ...nextProducts].forEach((product) => {
                            uniqueProducts.set(product.id, product);
                        });

                        return {
                            ...responseData,
                            data: Array.from(uniqueProducts.values()),
                        };
                    });
                } else {
                    setReport(responseData);
                    tableScrollRef.current?.scrollTo({
                        top: 0,
                        behavior: "smooth",
                    });
                }

                setFilters((previous) => ({
                    ...previous,
                    page,
                }));

                setExpandedProducts({});

                if (!append && showSuccessToast) {
                    toast.success(
                        "Product rack usability report loaded successfully."
                    );
                }
            } catch (error) {
                console.error(
                    "Product rack report error:",
                    error?.response?.data || error?.message
                );

                toast.error(
                    error?.response?.data?.message ||
                    error?.response?.data?.detail ||
                    "Failed to fetch product rack usability report."
                );

                if (!append) {
                    setReport(null);
                }
            } finally {
                setLoading(false);
                setLoadingMore(false);
                isFetchingRef.current = false;
            }
        },
        [
            token,
            filters.usability,
            buildParams,
        ]
    );

    const clearFilters = () => {
        setFilters({
            usability: "usable",
            start_date: "",
            end_date: "",
            search: "",
            product_id: "",
            warehouse_id: "",
            main_category_id: "",
            product_category_id: "",
            family_id: "",
            created_user_id: "",
            approved_user_id: "",
            product_type: "",
            purchase_type: "",
            approval_status: "",
            unit: "",
            color: "",
            size: "",
            rack_id: "",
            rack_name: "",
            column_name: "",
            min_stock: "",
            max_stock: "",
            min_purchase_rate: "",
            max_purchase_rate: "",
            min_selling_price: "",
            max_selling_price: "",
            min_landing_cost: "",
            max_landing_cost: "",
            min_retail_price: "",
            max_retail_price: "",
            min_final_price: "",
            max_final_price: "",
            tax: "",
            has_stock: "",
            ordering: "-id",
            page: 1,
            page_size: 50,
        });

        setReport(null);
        setExpandedProducts({});
        setLoadingMore(false);
        isFetchingRef.current = false;

        if (tableScrollRef.current) {
            tableScrollRef.current.scrollTop = 0;
        }
    };

    const toggleProduct = (productId) => {
        setExpandedProducts((previous) => ({
            ...previous,
            [productId]: !previous[productId],
        }));
    };

    const formatNumber = (value) => {
        return Number(value || 0).toLocaleString("en-IN");
    };

    const formatAmount = (value) => {
        return `₹${Number(value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getUsabilityLabel = (value) => {
        return (
            usabilityOptions.find((item) => item.value === value)?.label ||
            value ||
            "-"
        );
    };

    const getUsabilityBadgeColor = (value) => {
        switch (value) {
            case "usable":
                return "success";
            case "damaged":
                return "danger";
            case "partially_damaged":
                return "warning";
            case "liquidation_stock":
                return "info";
            default:
                return "secondary";
        }
    };

    const currentUsability = useMemo(
        () =>
            usabilityOptions.find(
                (item) => item.value === filters.usability
            ),
        [filters.usability]
    );

    const products = report?.data || [];
    const summary = report?.summary || {};
    const pagination = report?.pagination || {};

    const currentPage = Number(
        pagination.current_page || filters.page || 1
    );

    const hasNextPage = Boolean(pagination.has_next);

    const handleTableScroll = useCallback(
        (event) => {
            const element = event.currentTarget;

            if (
                loading ||
                loadingMore ||
                isFetchingRef.current ||
                !report ||
                !hasNextPage
            ) {
                return;
            }

            const distanceFromBottom =
                element.scrollHeight - element.scrollTop - element.clientHeight;

            if (distanceFromBottom <= 220) {
                fetchReport({
                    page: currentPage + 1,
                    append: true,
                    showSuccessToast: false,
                });
            }
        },
        [
            loading,
            loadingMore,
            report,
            hasNextPage,
            currentPage,
            fetchReport,
        ]
    );

    const exportToExcel = () => {
        if (!products.length) {
            toast.warning("No report data available to export.");
            return;
        }

        const workbook = XLSX.utils.book_new();
        const rows = [];
        const merges = [];
        const titleRows = [];
        const headerRows = [];

        const addMergedTitle = (text, color = "1D4ED8") => {
            const rowIndex = rows.length;

            rows.push([text]);
            merges.push({
                s: { r: rowIndex, c: 0 },
                e: { r: rowIndex, c: 17 },
            });

            titleRows.push({
                rowIndex,
                color,
            });
        };

        addMergedTitle("PRODUCT RACK USABILITY REPORT", "1D4ED8");

        rows.push([]);
        rows.push([
            "Usability",
            currentUsability?.label || filters.usability,
        ]);
        rows.push([
            "Date Range",
            filters.start_date || "All",
            filters.end_date || "All",
        ]);
        rows.push(["Search", filters.search || "All"]);
        rows.push([]);

        addMergedTitle("REPORT SUMMARY", "0F766E");

        headerRows.push(rows.length);

        rows.push([
            "Total Products",
            "Rack Entries",
            "Rack Stock",
            "Rack Lock",
            "Available Stock",
            "Usable",
            "Damaged",
            "Partially Damaged",
            "Liquidation",
        ]);

        rows.push([
            summary.total_products || 0,
            summary.total_rack_entries || 0,
            summary.total_rack_stock || 0,
            summary.total_rack_lock || 0,
            summary.total_available_stock || 0,
            summary.usability_stock?.usable || 0,
            summary.usability_stock?.damaged || 0,
            summary.usability_stock?.partially_damaged || 0,
            summary.usability_stock?.liquidation_stock || 0,
        ]);

        rows.push([]);

        addMergedTitle("PRODUCT DETAILS", "7C3AED");

        headerRows.push(rows.length);

        rows.push([
            "Product ID",
            "Product Name",
            "HSN Code",
            "Warehouse",
            "Main Category",
            "Product Category",
            "Division",
            "Type",
            "Unit",
            "Purchase Type",
            "Approval Status",
            "Date",
            "Rack Count",
            "Rack Stock",
            "Rack Lock",
            "Available Stock",
            "Purchase Rate",
            "Selling Price",
        ]);

        products.forEach((product) => {
            rows.push([
                product.id,
                product.name || "",
                product.hsn_code || "",
                product.warehouse?.name || "",
                product.main_category?.name || "",
                product.product_category?.name || "",
                (product.families || [])
                    .map((family) => family.name)
                    .join(", "),
                product.type || "",
                product.unit || "",
                product.purchase_type || "",
                product.approval_status || "",
                product.date || "",
                product.selected_rack_summary?.rack_count || 0,
                product.selected_rack_summary?.rack_stock || 0,
                product.selected_rack_summary?.rack_lock || 0,
                product.selected_rack_summary?.available_stock || 0,
                product.purchase_rate || 0,
                product.selling_price || 0,
            ]);
        });

        const productSheet = XLSX.utils.aoa_to_sheet(rows);

        productSheet["!merges"] = merges;
        productSheet["!cols"] = [
            { wch: 12 },
            { wch: 35 },
            { wch: 16 },
            { wch: 22 },
            { wch: 22 },
            { wch: 24 },
            { wch: 24 },
            { wch: 14 },
            { wch: 15 },
            { wch: 18 },
            { wch: 18 },
            { wch: 15 },
            { wch: 14 },
            { wch: 15 },
            { wch: 15 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
        ];

        applyExcelStyles(
            productSheet,
            titleRows,
            headerRows,
            rows.length,
            18
        );

        XLSX.utils.book_append_sheet(
            workbook,
            productSheet,
            "Product Report"
        );

        const rackRows = [];

        rackRows.push([
            "Product ID",
            "Product Name",
            "Warehouse",
            "Rack ID",
            "Rack Name",
            "Column",
            "Usability",
            "Rack Stock",
            "Rack Lock",
            "Available Stock",
        ]);

        products.forEach((product) => {
            (product.rack_details || []).forEach((rack) => {
                rackRows.push([
                    product.id,
                    product.name || "",
                    product.warehouse?.name || "",
                    rack.rack_id ?? "",
                    rack.rack_name || "",
                    rack.column_name || "",
                    getUsabilityLabel(rack.usability),
                    rack.rack_stock || 0,
                    rack.rack_lock || 0,
                    rack.available_stock || 0,
                ]);
            });
        });

        const rackSheet = XLSX.utils.aoa_to_sheet(rackRows);

        rackSheet["!cols"] = [
            { wch: 12 },
            { wch: 35 },
            { wch: 22 },
            { wch: 12 },
            { wch: 18 },
            { wch: 18 },
            { wch: 22 },
            { wch: 15 },
            { wch: 15 },
            { wch: 18 },
        ];

        applySimpleExcelStyles(rackSheet, rackRows.length, 10);

        XLSX.utils.book_append_sheet(
            workbook,
            rackSheet,
            "Rack Details"
        );

        const fileDate = new Date().toISOString().slice(0, 10);

        XLSX.writeFile(
            workbook,
            `Product_Rack_${filters.usability}_${fileDate}.xlsx`
        );
    };

    const applyExcelStyles = (
        worksheet,
        titleRows,
        headerRows,
        totalRows,
        totalColumns
    ) => {
        const border = {
            top: {
                style: "thin",
                color: { rgb: "CBD5E1" },
            },
            bottom: {
                style: "thin",
                color: { rgb: "CBD5E1" },
            },
            left: {
                style: "thin",
                color: { rgb: "CBD5E1" },
            },
            right: {
                style: "thin",
                color: { rgb: "CBD5E1" },
            },
        };

        for (let row = 0; row < totalRows; row += 1) {
            for (let col = 0; col < totalColumns; col += 1) {
                const reference = XLSX.utils.encode_cell({
                    r: row,
                    c: col,
                });

                if (!worksheet[reference]) {
                    continue;
                }

                worksheet[reference].s = {
                    font: {
                        name: "Calibri",
                        size: 11,
                        color: { rgb: "0F172A" },
                    },
                    alignment: {
                        horizontal: col === 1 ? "left" : "center",
                        vertical: "center",
                        wrapText: true,
                    },
                    border,
                };
            }
        }

        titleRows.forEach(({ rowIndex, color }) => {
            for (let col = 0; col < totalColumns; col += 1) {
                const reference = XLSX.utils.encode_cell({
                    r: rowIndex,
                    c: col,
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
                    border,
                };
            }
        });

        headerRows.forEach((rowIndex) => {
            for (let col = 0; col < totalColumns; col += 1) {
                const reference = XLSX.utils.encode_cell({
                    r: rowIndex,
                    c: col,
                });

                if (!worksheet[reference]) {
                    continue;
                }

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
                    border,
                };
            }
        });
    };

    const applySimpleExcelStyles = (
        worksheet,
        totalRows,
        totalColumns
    ) => {
        const border = {
            top: {
                style: "thin",
                color: { rgb: "CBD5E1" },
            },
            bottom: {
                style: "thin",
                color: { rgb: "CBD5E1" },
            },
            left: {
                style: "thin",
                color: { rgb: "CBD5E1" },
            },
            right: {
                style: "thin",
                color: { rgb: "CBD5E1" },
            },
        };

        for (let row = 0; row < totalRows; row += 1) {
            for (let col = 0; col < totalColumns; col += 1) {
                const reference = XLSX.utils.encode_cell({
                    r: row,
                    c: col,
                });

                if (!worksheet[reference]) {
                    continue;
                }

                worksheet[reference].s = {
                    font: {
                        bold: row === 0,
                        color: {
                            rgb: row === 0 ? "FFFFFF" : "0F172A",
                        },
                    },
                    fill:
                        row === 0
                            ? {
                                fgColor: { rgb: "0F172A" },
                            }
                            : undefined,
                    alignment: {
                        horizontal: col === 1 ? "left" : "center",
                        vertical: "center",
                        wrapText: true,
                    },
                    border,
                };
            }
        }
    };

    const renderInput = (
        label,
        key,
        type = "text",
        placeholder = "",
        xl = 2
    ) => (
        <Col xl={xl} lg={3} md={6}>
            <label className="form-label" style={labelStyle}>
                {label}
            </label>

            <Input
                type={type}
                value={filters[key]}
                placeholder={placeholder}
                onChange={(event) =>
                    handleChange(key, event.target.value)
                }
                style={inputStyle}
            />
        </Col>
    );

    const renderNativeSelect = (
        label,
        key,
        options,
        xl = 2,
        allLabel = "All"
    ) => (
        <Col xl={xl} lg={3} md={6}>
            <label className="form-label" style={labelStyle}>
                {label}
            </label>

            <Input
                type="select"
                value={filters[key]}
                onChange={(event) =>
                    handleChange(key, event.target.value)
                }
                style={inputStyle}
            >
                <option value="">{allLabel}</option>

                {options.map((option) => (
                    <option
                        key={`${key}-${option.value}`}
                        value={option.value}
                    >
                        {option.label}
                    </option>
                ))}
            </Input>
        </Col>
    );

    const selectStyles = {
        control: (base, state) => ({
            ...base,
            minHeight: "48px",
            borderRadius: "10px",
            border: state.isFocused
                ? "1.5px solid #2563eb"
                : "1.5px solid #b8c2d6",
            boxShadow: state.isFocused
                ? "0 0 0 3px rgba(37, 99, 235, 0.10)"
                : "none",
            fontSize: "14px",
            fontWeight: "700",
            "&:hover": {
                borderColor: "#2563eb",
            },
        }),
        menu: (base) => ({
            ...base,
            zIndex: 9999,
        }),
        option: (base, state) => ({
            ...base,
            fontSize: "14px",
            fontWeight: "600",
            backgroundColor: state.isSelected
                ? "#2563eb"
                : state.isFocused
                    ? "#eff6ff"
                    : "#ffffff",
            color: state.isSelected ? "#ffffff" : "#0f172a",
        }),
        placeholder: (base) => ({
            ...base,
            color: "#64748b",
            fontWeight: "600",
        }),
    };

    const renderReactSelect = (
        label,
        key,
        options,
        placeholder,
        xl = 3
    ) => {
        const selectedValue =
            options.find(
                (option) =>
                    String(option.value) === String(filters[key])
            ) || null;

        return (
            <Col xl={xl} lg={4} md={6}>
                <label className="form-label" style={labelStyle}>
                    {label}
                </label>

                <Select
                    value={selectedValue}
                    options={options}
                    onChange={(selected) =>
                        handleChange(
                            key,
                            selected ? selected.value : ""
                        )
                    }
                    placeholder={placeholder}
                    isClearable
                    isSearchable
                    styles={selectStyles}
                    noOptionsMessage={() => "No options found"}
                />
            </Col>
        );
    };

    const summaryCards = [
        {
            title: "Products",
            value: summary.total_products || 0,
            description: "Matching products",
            background: "#eff6ff",
            border: "#2563eb",
            valueColor: "#1d4ed8",
        },
        {
            title: "Rack Entries",
            value: summary.total_rack_entries || 0,
            description: "Matching rack locations",
            background: "#f5f3ff",
            border: "#7c3aed",
            valueColor: "#7c3aed",
        },
        {
            title: "Rack Stock",
            value: summary.total_rack_stock || 0,
            description: "Total physical quantity",
            background: "#ecfdf5",
            border: "#16a34a",
            valueColor: "#15803d",
        },
        {
            title: "Locked Stock",
            value: summary.total_rack_lock || 0,
            description: "Reserved quantity",
            background: "#fff7ed",
            border: "#f97316",
            valueColor: "#c2410c",
        },
        {
            title: "Available Stock",
            value: summary.total_available_stock || 0,
            description: "Stock ready to allocate",
            background: "#ecfeff",
            border: "#0891b2",
            valueColor: "#0e7490",
        },
    ];

    return (
        <React.Fragment>
            <div
                className="page-content"
                style={{
                    backgroundColor: "#f3f6fb",
                    minHeight: "100vh",
                    paddingBottom: "100px",
                }}
            >
                <ToastContainer />

                <div className="container-fluid">
                    <Row>
                        <Col xl={12}>
                            <Card
                                className="border-0"
                                style={mainCardStyle}
                            >
                                <CardBody className="p-4">
                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                                        <div>
                                            <h4
                                                className="mb-1"
                                                style={mainTitleStyle}
                                            >
                                                Product Rack Usability
                                                Report
                                            </h4>

                                            <p
                                                className="mb-0"
                                                style={subTitleStyle}
                                            >
                                                Review product quantities,
                                                rack availability, locked
                                                stock and usability status.
                                            </p>
                                        </div>

                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                            <Badge
                                                color={getUsabilityBadgeColor(
                                                    filters.usability
                                                )}
                                                pill
                                                className="px-3 py-2"
                                            >
                                                {currentUsability?.label ||
                                                    "Usability"}
                                            </Badge>

                                            {lookupLoading && (
                                                <Badge
                                                    color="light"
                                                    pill
                                                    className="px-3 py-2 text-dark"
                                                >
                                                    Loading filters...
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div style={usabilitySelectorStyle}>
                                        <div className="mb-3">
                                            <h5
                                                className="mb-1"
                                                style={filterSectionTitleStyle}
                                            >
                                                Stock Usability
                                            </h5>

                                            <p
                                                className="mb-0"
                                                style={filterSectionSubtitleStyle}
                                            >
                                                Select the stock condition
                                                sent through the API URL.
                                            </p>
                                        </div>

                                        <Row className="g-3">
                                            {usabilityOptions.map(
                                                (option) => {
                                                    const selected =
                                                        filters.usability ===
                                                        option.value;

                                                    return (
                                                        <Col
                                                            xl
                                                            lg={4}
                                                            md={6}
                                                            key={
                                                                option.value
                                                            }
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleChange(
                                                                        "usability",
                                                                        option.value
                                                                    )
                                                                }
                                                                style={{
                                                                    ...usabilityButtonStyle,
                                                                    borderColor:
                                                                        selected
                                                                            ? "#2563eb"
                                                                            : "#d7deea",
                                                                    backgroundColor:
                                                                        selected
                                                                            ? "#eff6ff"
                                                                            : "#ffffff",
                                                                    boxShadow:
                                                                        selected
                                                                            ? "0 0 0 3px rgba(37, 99, 235, 0.10)"
                                                                            : "none",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        ...usabilityIndicatorStyle,
                                                                        backgroundColor:
                                                                            selected
                                                                                ? "#2563eb"
                                                                                : "#cbd5e1",
                                                                    }}
                                                                />

                                                                <div className="text-start">
                                                                    <div
                                                                        style={{
                                                                            ...usabilityTitleStyle,
                                                                            color: selected
                                                                                ? "#1d4ed8"
                                                                                : "#0f172a",
                                                                        }}
                                                                    >
                                                                        {
                                                                            option.label
                                                                        }
                                                                    </div>

                                                                    <div
                                                                        style={
                                                                            usabilityDescriptionStyle
                                                                        }
                                                                    >
                                                                        {
                                                                            option.description
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        </Col>
                                                    );
                                                }
                                            )}
                                        </Row>
                                    </div>

                                    <div style={filterSectionStyle}>
                                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                                            <div>
                                                <h5
                                                    className="mb-1"
                                                    style={
                                                        filterSectionTitleStyle
                                                    }
                                                >
                                                    Basic Filters
                                                </h5>

                                                <p
                                                    className="mb-0"
                                                    style={
                                                        filterSectionSubtitleStyle
                                                    }
                                                >
                                                    Filter products by date,
                                                    keyword and classification.
                                                </p>
                                            </div>
                                        </div>

                                        <Row className="g-3 align-items-end">
                                            {renderInput(
                                                "Start Date",
                                                "start_date",
                                                "date"
                                            )}

                                            {renderInput(
                                                "End Date",
                                                "end_date",
                                                "date"
                                            )}

                                            {renderInput(
                                                "Search",
                                                "search",
                                                "text",
                                                "Product, HSN, variant..."
                                            )}

                                            {renderNativeSelect(
                                                "Product Type",
                                                "product_type",
                                                productTypeOptions
                                            )}

                                            {renderNativeSelect(
                                                "Purchase Type",
                                                "purchase_type",
                                                purchaseTypeOptions
                                            )}

                                            {renderNativeSelect(
                                                "Approval Status",
                                                "approval_status",
                                                approvalStatusOptions
                                            )}

                                            {renderNativeSelect(
                                                "Unit",
                                                "unit",
                                                unitOptions
                                            )}

                                            {renderInput(
                                                "Color",
                                                "color",
                                                "text",
                                                "Product color"
                                            )}

                                            {renderInput(
                                                "Size",
                                                "size",
                                                "text",
                                                "Product size"
                                            )}

                                            {renderNativeSelect(
                                                "Stock Availability",
                                                "has_stock",
                                                hasStockOptions
                                            )}

                                            {renderNativeSelect(
                                                "Order By",
                                                "ordering",
                                                orderingOptions,
                                                3,
                                                "Select ordering"
                                            )}
                                        </Row>
                                    </div>

                                    <div style={filterSectionStyle}>
                                        <div className="mb-3">
                                            <h5
                                                className="mb-1"
                                                style={filterSectionTitleStyle}
                                            >
                                                Category and Staff Filters
                                            </h5>

                                            <p
                                                className="mb-0"
                                                style={filterSectionSubtitleStyle}
                                            >
                                                Narrow the report by warehouse,
                                                category, division or staff.
                                            </p>
                                        </div>

                                        <Row className="g-3 align-items-end">
                                            {renderReactSelect(
                                                "Warehouse",
                                                "warehouse_id",
                                                warehouses.map(
                                                    (warehouse) => ({
                                                        value: warehouse.id,
                                                        label:
                                                            warehouse.name ||
                                                            warehouse.location ||
                                                            `Warehouse ${warehouse.id}`,
                                                    })
                                                ),
                                                "Select warehouse"
                                            )}

                                            {renderReactSelect(
                                                "Main Category",
                                                "main_category_id",
                                                mainCategories.map(
                                                    (category) => ({
                                                        value: category.id,
                                                        label:
                                                            category.name ||
                                                            category.category_name ||
                                                            `Category ${category.id}`,
                                                    })
                                                ),
                                                "Select main category"
                                            )}

                                            {renderReactSelect(
                                                "Product Category",
                                                "product_category_id",
                                                productCategories.map(
                                                    (category) => ({
                                                        value: category.id,
                                                        label:
                                                            category.category_name ||
                                                            category.name ||
                                                            `Category ${category.id}`,
                                                    })
                                                ),
                                                "Select product category"
                                            )}

                                            {renderReactSelect(
                                                "Division",
                                                "family_id",
                                                families.map((family) => ({
                                                    value: family.id,
                                                    label:
                                                        family.name ||
                                                        family.family_name ||
                                                        `Division ${family.id}`,
                                                })),
                                                "Select division"
                                            )}

                                            <Col xl={3} lg={4} md={6}>
                                                <label
                                                    className="form-label"
                                                    style={labelStyle}
                                                >
                                                    Created User
                                                </label>

                                                <Select
                                                    value={
                                                        createdUsers
                                                            .map((staff) => ({
                                                                value: staff.id,
                                                                label:
                                                                    staff.name ||
                                                                    staff.username ||
                                                                    `Staff ${staff.id}`,
                                                            }))
                                                            .find(
                                                                (option) =>
                                                                    String(option.value) ===
                                                                    String(filters.created_user_id)
                                                            ) || null
                                                    }
                                                    options={createdUsers.map(
                                                        (staff) => ({
                                                            value: staff.id,
                                                            label:
                                                                staff.name ||
                                                                staff.username ||
                                                                `Staff ${staff.id}`,
                                                        })
                                                    )}
                                                    onChange={(selected) =>
                                                        handleChange(
                                                            "created_user_id",
                                                            selected
                                                                ? selected.value
                                                                : ""
                                                        )
                                                    }
                                                    onInputChange={
                                                        handleCreatedUserSearch
                                                    }
                                                    placeholder="Search created user"
                                                    isClearable
                                                    isSearchable
                                                    isLoading={createdUserLoading}
                                                    filterOption={null}
                                                    styles={selectStyles}
                                                    noOptionsMessage={({
                                                        inputValue,
                                                    }) =>
                                                        inputValue
                                                            ? "No created users found"
                                                            : "Type to search users"
                                                    }
                                                    loadingMessage={() =>
                                                        "Searching users..."
                                                    }
                                                />
                                            </Col>

                                            <Col xl={3} lg={4} md={6}>
                                                <label
                                                    className="form-label"
                                                    style={labelStyle}
                                                >
                                                    Approved User
                                                </label>

                                                <Select
                                                    value={
                                                        approvedUsers
                                                            .map((staff) => ({
                                                                value: staff.id,
                                                                label:
                                                                    staff.name ||
                                                                    staff.username ||
                                                                    `Staff ${staff.id}`,
                                                            }))
                                                            .find(
                                                                (option) =>
                                                                    String(option.value) ===
                                                                    String(filters.approved_user_id)
                                                            ) || null
                                                    }
                                                    options={approvedUsers.map(
                                                        (staff) => ({
                                                            value: staff.id,
                                                            label:
                                                                staff.name ||
                                                                staff.username ||
                                                                `Staff ${staff.id}`,
                                                        })
                                                    )}
                                                    onChange={(selected) =>
                                                        handleChange(
                                                            "approved_user_id",
                                                            selected
                                                                ? selected.value
                                                                : ""
                                                        )
                                                    }
                                                    onInputChange={
                                                        handleApprovedUserSearch
                                                    }
                                                    placeholder="Search approved user"
                                                    isClearable
                                                    isSearchable
                                                    isLoading={approvedUserLoading}
                                                    filterOption={null}
                                                    styles={selectStyles}
                                                    noOptionsMessage={({
                                                        inputValue,
                                                    }) =>
                                                        inputValue
                                                            ? "No approved users found"
                                                            : "Type to search users"
                                                    }
                                                    loadingMessage={() =>
                                                        "Searching users..."
                                                    }
                                                />
                                            </Col>
                                        </Row>
                                    </div>

                                    <div style={filterSectionStyle}>
                                        <div className="mb-3">
                                            <h5
                                                className="mb-1"
                                                style={filterSectionTitleStyle}
                                            >
                                                Stock Filters
                                            </h5>

                                            <p
                                                className="mb-0"
                                                style={filterSectionSubtitleStyle}
                                            >
                                                Search a specific rack,
                                                column or stock quantity.
                                            </p>
                                        </div>

                                        <Row className="g-3 align-items-end">
                                            

                                            {renderInput(
                                                "Minimum Stock",
                                                "min_stock",
                                                "number",
                                                "Min quantity"
                                            )}

                                            {renderInput(
                                                "Maximum Stock",
                                                "max_stock",
                                                "number",
                                                "Max quantity"
                                            )}

                                            {renderInput(
                                                "Tax %",
                                                "tax",
                                                "number",
                                                "Tax percentage"
                                            )}
                                        </Row>
                                    </div>

                                    <div style={filterSectionStyle}>
                                        <div className="mb-3">
                                            <h5
                                                className="mb-1"
                                                style={filterSectionTitleStyle}
                                            >
                                                Price Filters
                                            </h5>

                                            <p
                                                className="mb-0"
                                                style={filterSectionSubtitleStyle}
                                            >
                                                Apply minimum and maximum
                                                limits to product prices.
                                            </p>
                                        </div>

                                        <Row className="g-3 align-items-end">
                                            {renderInput(
                                                "Min Purchase Rate",
                                                "min_purchase_rate",
                                                "number",
                                                "Minimum"
                                            )}

                                            {renderInput(
                                                "Max Purchase Rate",
                                                "max_purchase_rate",
                                                "number",
                                                "Maximum"
                                            )}

                                            {renderInput(
                                                "Min Selling Price",
                                                "min_selling_price",
                                                "number",
                                                "Minimum"
                                            )}

                                            {renderInput(
                                                "Max Selling Price",
                                                "max_selling_price",
                                                "number",
                                                "Maximum"
                                            )}

                                            {renderInput(
                                                "Min Landing Cost",
                                                "min_landing_cost",
                                                "number",
                                                "Minimum"
                                            )}

                                            {renderInput(
                                                "Max Landing Cost",
                                                "max_landing_cost",
                                                "number",
                                                "Maximum"
                                            )}

                                            {renderInput(
                                                "Min Retail Price",
                                                "min_retail_price",
                                                "number",
                                                "Minimum"
                                            )}

                                            {renderInput(
                                                "Max Retail Price",
                                                "max_retail_price",
                                                "number",
                                                "Maximum"
                                            )}

                                            {renderInput(
                                                "Min Final Price",
                                                "min_final_price",
                                                "number",
                                                "Minimum"
                                            )}

                                            {renderInput(
                                                "Max Final Price",
                                                "max_final_price",
                                                "number",
                                                "Maximum"
                                            )}

                                            {renderNativeSelect(
                                                "Rows Per Page",
                                                "page_size",
                                                [
                                                    {
                                                        value: 25,
                                                        label: "25 Rows",
                                                    },
                                                    {
                                                        value: 50,
                                                        label: "50 Rows",
                                                    },
                                                    {
                                                        value: 100,
                                                        label: "100 Rows",
                                                    },
                                                    {
                                                        value: 250,
                                                        label: "250 Rows",
                                                    },
                                                    {
                                                        value: 500,
                                                        label: "500 Rows",
                                                    },
                                                ],
                                                2,
                                                "Page size"
                                            )}
                                        </Row>
                                    </div>

                                    <Row className="g-3 align-items-end mt-2">
                                        <Col xl={2} md={4}>
                                            <Button
                                                color="primary"
                                                className="w-100"
                                                onClick={() =>
                                                    fetchReport({
                                                        page: 1,
                                                        append: false,
                                                        showSuccessToast: true,
                                                    })
                                                }
                                                disabled={loading || loadingMore}
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
                                                    "Generate Report"
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
                                                Clear Filters
                                            </Button>
                                        </Col>


                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {report && (
                        <>
                            <Row className="g-3 mt-1">
                                {summaryCards.map((card) => (
                                    <Col
                                        xl
                                        lg={4}
                                        md={6}
                                        key={card.title}
                                    >
                                        <Card
                                            className="border-0 h-100"
                                            style={{
                                                ...summaryCardStyle,
                                                backgroundColor:
                                                    card.background,
                                                borderLeft: `5px solid ${card.border}`,
                                            }}
                                        >
                                            <CardBody className="p-4">
                                                <div
                                                    style={
                                                        summaryCardTitleStyle
                                                    }
                                                >
                                                    {card.title}
                                                </div>

                                                <div
                                                    style={{
                                                        ...summaryCardValueStyle,
                                                        color: card.valueColor,
                                                    }}
                                                >
                                                    {formatNumber(
                                                        card.value
                                                    )}
                                                </div>

                                                <div
                                                    style={
                                                        summaryCardDescriptionStyle
                                                    }
                                                >
                                                    {card.description}
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            <Row className="g-3 mt-1">
                                <Col xl={12}>
                                    <Card
                                        className="border-0"
                                        style={usabilitySummaryCardStyle}
                                    >
                                        <CardBody className="p-4">
                                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                                                <div>
                                                    <h4
                                                        className="mb-1"
                                                        style={
                                                            sectionTitleStyle
                                                        }
                                                    >
                                                        Usability Stock
                                                        Summary
                                                    </h4>

                                                    <p
                                                        className="mb-0"
                                                        style={subTitleStyle}
                                                    >
                                                        Quantity distribution
                                                        across all stock
                                                        conditions.
                                                    </p>
                                                </div>

                                                <Badge
                                                    color="primary"
                                                    pill
                                                    className="px-3 py-2"
                                                >
                                                    {
                                                        currentUsability?.label
                                                    }
                                                </Badge>
                                            </div>

                                            <Row className="g-3">
                                                {[
                                                    {
                                                        label: "Usable",
                                                        value:
                                                            summary
                                                                .usability_stock
                                                                ?.usable || 0,
                                                        color: "#15803d",
                                                        background:
                                                            "#ecfdf5",
                                                    },
                                                    {
                                                        label: "Damaged",
                                                        value:
                                                            summary
                                                                .usability_stock
                                                                ?.damaged || 0,
                                                        color: "#b91c1c",
                                                        background:
                                                            "#fef2f2",
                                                    },
                                                    {
                                                        label:
                                                            "Partially Damaged",
                                                        value:
                                                            summary
                                                                .usability_stock
                                                                ?.partially_damaged ||
                                                            0,
                                                        color: "#b45309",
                                                        background:
                                                            "#fffbeb",
                                                    },
                                                    {
                                                        label:
                                                            "Liquidation Stock",
                                                        value:
                                                            summary
                                                                .usability_stock
                                                                ?.liquidation_stock ||
                                                            0,
                                                        color: "#0e7490",
                                                        background:
                                                            "#ecfeff",
                                                    },
                                                ].map((item) => (
                                                    <Col
                                                        xl={3}
                                                        md={6}
                                                        key={item.label}
                                                    >
                                                        <div
                                                            style={{
                                                                ...usabilitySummaryBoxStyle,
                                                                backgroundColor:
                                                                    item.background,
                                                            }}
                                                        >
                                                            <span>
                                                                {item.label}
                                                            </span>

                                                            <strong
                                                                style={{
                                                                    color: item.color,
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    item.value
                                                                )}
                                                            </strong>
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>

                            <div
                                ref={tableSectionRef}
                                style={{
                                    scrollMarginTop: "90px",
                                }}
                            >
                                <Row className="mt-4">
                                    <Col xl={12}>
                                        <Card
                                            className="border-0"
                                            style={tableCardStyle}
                                        >
                                            <CardBody className="p-4">
                                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                                                    <div>
                                                        <h4
                                                            className="mb-1"
                                                            style={
                                                                sectionTitleStyle
                                                            }
                                                        >
                                                            Product Rack Details
                                                        </h4>

                                                        <p
                                                            className="mb-0"
                                                            style={subTitleStyle}
                                                        >
                                                            Click a product row to
                                                            view individual rack
                                                            allocations.
                                                        </p>
                                                    </div>

                                                    <Badge
                                                        color="light"
                                                        pill
                                                        className="px-3 py-2 text-dark"
                                                    >
                                                        Loaded {formatNumber(products.length)} of{" "}
                                                        {formatNumber(
                                                            pagination.total_records ||
                                                            summary.total_products
                                                        )}
                                                    </Badge>
                                                </div>

                                                <div
                                                    ref={tableScrollRef}
                                                    className="table-responsive"
                                                    style={tableWrapperStyle}
                                                    onScroll={handleTableScroll}
                                                >
                                                    <Table className="mb-0 align-middle" style={{ minWidth: "1180px" }}>
                                                        <thead>
                                                            <tr>
                                                                <th
                                                                    style={
                                                                        expandHeaderStyle
                                                                    }
                                                                />

                                                                <th
                                                                    style={
                                                                        productHeaderStyle
                                                                    }
                                                                >
                                                                    Product
                                                                </th>

                                                                <th
                                                                    style={
                                                                        tableHeaderStyle
                                                                    }
                                                                >
                                                                    Warehouse
                                                                </th>

                                                                <th
                                                                    style={
                                                                        tableHeaderStyle
                                                                    }
                                                                >
                                                                    Category
                                                                </th>

                                                                <th
                                                                    style={
                                                                        tableHeaderStyle
                                                                    }
                                                                >
                                                                    Status
                                                                </th>

                                                                <th
                                                                    style={
                                                                        stockHeaderStyle
                                                                    }
                                                                >
                                                                    Rack Stock
                                                                </th>

                                                                <th
                                                                    style={
                                                                        lockedHeaderStyle
                                                                    }
                                                                >
                                                                    Locked
                                                                </th>

                                                                <th
                                                                    style={
                                                                        availableHeaderStyle
                                                                    }
                                                                >
                                                                    Available
                                                                </th>

                                                                <th
                                                                    style={
                                                                        tableHeaderStyle
                                                                    }
                                                                >
                                                                    Price
                                                                </th>

                                                                <th
                                                                    style={
                                                                        tableHeaderStyle
                                                                    }
                                                                >
                                                                    Date
                                                                </th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {loading ? (
                                                                <tr>
                                                                    <td
                                                                        colSpan="10"
                                                                        className="text-center py-5"
                                                                    >
                                                                        <Spinner
                                                                            color="primary"
                                                                            className="mb-3"
                                                                        />

                                                                        <div
                                                                            style={
                                                                                emptyTitleStyle
                                                                            }
                                                                        >
                                                                            Loading
                                                                            report...
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ) : products.length ===
                                                                0 ? (
                                                                <tr>
                                                                    <td
                                                                        colSpan="10"
                                                                        className="text-center py-5"
                                                                    >
                                                                        <div
                                                                            style={
                                                                                emptyIconStyle
                                                                            }
                                                                        >
                                                                            📦
                                                                        </div>

                                                                        <div
                                                                            style={
                                                                                emptyTitleStyle
                                                                            }
                                                                        >
                                                                            No
                                                                            products
                                                                            found
                                                                        </div>

                                                                        <div
                                                                            style={
                                                                                emptyDescriptionStyle
                                                                            }
                                                                        >
                                                                            Change
                                                                            the
                                                                            filters
                                                                            and
                                                                            generate
                                                                            the
                                                                            report
                                                                            again.
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                products.map(
                                                                    (
                                                                        product,
                                                                        index
                                                                    ) => {
                                                                        const isExpanded =
                                                                            Boolean(
                                                                                expandedProducts[
                                                                                product
                                                                                    .id
                                                                                ]
                                                                            );

                                                                        return (
                                                                            <React.Fragment
                                                                                key={
                                                                                    product.id
                                                                                }
                                                                            >
                                                                                <tr
                                                                                    onClick={() =>
                                                                                        toggleProduct(
                                                                                            product.id
                                                                                        )
                                                                                    }
                                                                                    style={{
                                                                                        cursor: "pointer",
                                                                                        backgroundColor:
                                                                                            index %
                                                                                                2 ===
                                                                                                0
                                                                                                ? "#ffffff"
                                                                                                : "#f8fafc",
                                                                                    }}
                                                                                >
                                                                                    <td
                                                                                        style={
                                                                                            expandTdStyle
                                                                                        }
                                                                                    >
                                                                                        <span
                                                                                            style={{
                                                                                                ...expandButtonStyle,
                                                                                                transform:
                                                                                                    isExpanded
                                                                                                        ? "rotate(90deg)"
                                                                                                        : "rotate(0deg)",
                                                                                            }}
                                                                                        >
                                                                                            ›
                                                                                        </span>
                                                                                    </td>

                                                                                    <td
                                                                                        style={
                                                                                            productTdStyle
                                                                                        }
                                                                                    >
                                                                                        <div className="d-flex align-items-center gap-3">
                                                                                            <div
                                                                                                style={
                                                                                                    productImageWrapperStyle
                                                                                                }
                                                                                            >
                                                                                                {product.image ? (
                                                                                                    <img
                                                                                                        src={
                                                                                                            product.image
                                                                                                        }
                                                                                                        alt={
                                                                                                            product.name
                                                                                                        }
                                                                                                        style={
                                                                                                            productImageStyle
                                                                                                        }
                                                                                                        onError={(
                                                                                                            event
                                                                                                        ) => {
                                                                                                            event.currentTarget.style.display =
                                                                                                                "none";
                                                                                                        }}
                                                                                                    />
                                                                                                ) : (
                                                                                                    <span>
                                                                                                        📦
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>

                                                                                            <div>
                                                                                                <div
                                                                                                    style={
                                                                                                        productNameStyle
                                                                                                    }
                                                                                                >
                                                                                                    {product.name ||
                                                                                                        "-"}
                                                                                                </div>

                                                                                                <div
                                                                                                    style={
                                                                                                        productMetaStyle
                                                                                                    }
                                                                                                >
                                                                                                    ID:{" "}
                                                                                                    {
                                                                                                        product.id
                                                                                                    }{" "}
                                                                                                    •
                                                                                                    HSN:{" "}
                                                                                                    {product.hsn_code ||
                                                                                                        "-"}
                                                                                                </div>

                                                                                                <div className="d-flex gap-1 flex-wrap mt-1">
                                                                                                    {product.color && (
                                                                                                        <Badge
                                                                                                            color="light"
                                                                                                            className="text-dark"
                                                                                                        >
                                                                                                            {
                                                                                                                product.color
                                                                                                            }
                                                                                                        </Badge>
                                                                                                    )}

                                                                                                    {product.size && (
                                                                                                        <Badge
                                                                                                            color="light"
                                                                                                            className="text-dark"
                                                                                                        >
                                                                                                            {
                                                                                                                product.size
                                                                                                            }
                                                                                                        </Badge>
                                                                                                    )}

                                                                                                    <Badge
                                                                                                        color="secondary"
                                                                                                        pill
                                                                                                    >
                                                                                                        {product.unit ||
                                                                                                            "-"}
                                                                                                    </Badge>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>

                                                                                    <td
                                                                                        style={
                                                                                            tableTdStyle
                                                                                        }
                                                                                    >
                                                                                        <div
                                                                                            style={
                                                                                                cellPrimaryStyle
                                                                                            }
                                                                                        >
                                                                                            {product
                                                                                                .warehouse
                                                                                                ?.name ||
                                                                                                "-"}
                                                                                        </div>

                                                                                        <div
                                                                                            style={
                                                                                                cellSecondaryStyle
                                                                                            }
                                                                                        >
                                                                                            {product
                                                                                                .warehouse
                                                                                                ?.location ||
                                                                                                ""}
                                                                                        </div>
                                                                                    </td>

                                                                                    <td
                                                                                        style={
                                                                                            tableTdStyle
                                                                                        }
                                                                                    >
                                                                                        <div
                                                                                            style={
                                                                                                cellPrimaryStyle
                                                                                            }
                                                                                        >
                                                                                            {product
                                                                                                .main_category
                                                                                                ?.name ||
                                                                                                "-"}
                                                                                        </div>

                                                                                        <div
                                                                                            style={
                                                                                                cellSecondaryStyle
                                                                                            }
                                                                                        >
                                                                                            {product
                                                                                                .product_category
                                                                                                ?.name ||
                                                                                                ""}
                                                                                        </div>
                                                                                    </td>

                                                                                    <td
                                                                                        style={
                                                                                            tableTdStyle
                                                                                        }
                                                                                    >
                                                                                        <Badge
                                                                                            color={getUsabilityBadgeColor(
                                                                                                filters.usability
                                                                                            )}
                                                                                            pill
                                                                                            className="mb-1"
                                                                                        >
                                                                                            {getUsabilityLabel(
                                                                                                filters.usability
                                                                                            )}
                                                                                        </Badge>

                                                                                        <div>
                                                                                            <Badge
                                                                                                color={
                                                                                                    product.approval_status ===
                                                                                                        "Approved"
                                                                                                        ? "success"
                                                                                                        : "danger"
                                                                                                }
                                                                                                pill
                                                                                            >
                                                                                                {product.approval_status ||
                                                                                                    "-"}
                                                                                            </Badge>
                                                                                        </div>
                                                                                    </td>

                                                                                    <td
                                                                                        style={
                                                                                            stockTdStyle
                                                                                        }
                                                                                    >
                                                                                        {formatNumber(
                                                                                            product
                                                                                                .selected_rack_summary
                                                                                                ?.rack_stock
                                                                                        )}
                                                                                    </td>

                                                                                    <td
                                                                                        style={
                                                                                            lockedTdStyle
                                                                                        }
                                                                                    >
                                                                                        {formatNumber(
                                                                                            product
                                                                                                .selected_rack_summary
                                                                                                ?.rack_lock
                                                                                        )}
                                                                                    </td>

                                                                                    <td
                                                                                        style={
                                                                                            availableTdStyle
                                                                                        }
                                                                                    >
                                                                                        {formatNumber(
                                                                                            product
                                                                                                .selected_rack_summary
                                                                                                ?.available_stock
                                                                                        )}
                                                                                    </td>

                                                                                    <td
                                                                                        style={
                                                                                            tableTdStyle
                                                                                        }
                                                                                    >
                                                                                        <div
                                                                                            style={
                                                                                                priceStyle
                                                                                            }
                                                                                        >
                                                                                            {formatAmount(
                                                                                                product.selling_price
                                                                                            )}
                                                                                        </div>

                                                                                        <div
                                                                                            style={
                                                                                                cellSecondaryStyle
                                                                                            }
                                                                                        >
                                                                                            Purchase:{" "}
                                                                                            {formatAmount(
                                                                                                product.purchase_rate
                                                                                            )}
                                                                                        </div>
                                                                                    </td>

                                                                                    <td
                                                                                        style={
                                                                                            tableTdStyle
                                                                                        }
                                                                                    >
                                                                                        {formatDate(
                                                                                            product.date
                                                                                        )}
                                                                                    </td>
                                                                                </tr>

                                                                                <tr>
                                                                                    <td
                                                                                        colSpan="10"
                                                                                        style={{
                                                                                            padding: 0,
                                                                                            border: 0,
                                                                                        }}
                                                                                    >
                                                                                        <Collapse
                                                                                            isOpen={
                                                                                                isExpanded
                                                                                            }
                                                                                        >
                                                                                            <div
                                                                                                style={
                                                                                                    rackDetailsContainerStyle
                                                                                                }
                                                                                            >
                                                                                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                                                                                                    <div>
                                                                                                        <h6
                                                                                                            className="mb-1"
                                                                                                            style={
                                                                                                                rackDetailsTitleStyle
                                                                                                            }
                                                                                                        >
                                                                                                            Rack
                                                                                                            Allocation
                                                                                                            Details
                                                                                                        </h6>

                                                                                                        <p
                                                                                                            className="mb-0"
                                                                                                            style={
                                                                                                                rackDetailsSubtitleStyle
                                                                                                            }
                                                                                                        >
                                                                                                            {
                                                                                                                product
                                                                                                                    .selected_rack_summary
                                                                                                                    ?.rack_count
                                                                                                            }{" "}
                                                                                                            matching
                                                                                                            rack
                                                                                                            location(s)
                                                                                                        </p>
                                                                                                    </div>

                                                                                                    <div className="d-flex gap-2 flex-wrap">
                                                                                                        {(product.families ||
                                                                                                            []).map(
                                                                                                                (
                                                                                                                    family
                                                                                                                ) => (
                                                                                                                    <Badge
                                                                                                                        key={
                                                                                                                            family.id
                                                                                                                        }
                                                                                                                        color="primary"
                                                                                                                        pill
                                                                                                                    >
                                                                                                                        {
                                                                                                                            family.name
                                                                                                                        }
                                                                                                                    </Badge>
                                                                                                                )
                                                                                                            )}
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div
                                                                                                    className="table-responsive"
                                                                                                    style={
                                                                                                        rackTableWrapperStyle
                                                                                                    }
                                                                                                >
                                                                                                    <Table className="mb-0 align-middle" style={{ minWidth: "760px" }}>
                                                                                                        <thead>
                                                                                                            <tr>
                                                                                                                <th
                                                                                                                    style={
                                                                                                                        rackHeaderStyle
                                                                                                                    }
                                                                                                                >
                                                                                                                    Rack
                                                                                                                    ID
                                                                                                                </th>

                                                                                                                <th
                                                                                                                    style={
                                                                                                                        rackHeaderStyle
                                                                                                                    }
                                                                                                                >
                                                                                                                    Rack
                                                                                                                    Name
                                                                                                                </th>

                                                                                                                <th
                                                                                                                    style={
                                                                                                                        rackHeaderStyle
                                                                                                                    }
                                                                                                                >
                                                                                                                    Column
                                                                                                                </th>

                                                                                                                <th
                                                                                                                    style={
                                                                                                                        rackHeaderStyle
                                                                                                                    }
                                                                                                                >
                                                                                                                    Usability
                                                                                                                </th>

                                                                                                                <th
                                                                                                                    style={
                                                                                                                        rackStockHeaderStyle
                                                                                                                    }
                                                                                                                >
                                                                                                                    Rack
                                                                                                                    Stock
                                                                                                                </th>

                                                                                                                <th
                                                                                                                    style={
                                                                                                                        rackLockedHeaderStyle
                                                                                                                    }
                                                                                                                >
                                                                                                                    Locked
                                                                                                                </th>

                                                                                                                <th
                                                                                                                    style={
                                                                                                                        rackAvailableHeaderStyle
                                                                                                                    }
                                                                                                                >
                                                                                                                    Available
                                                                                                                </th>
                                                                                                            </tr>
                                                                                                        </thead>

                                                                                                        <tbody>
                                                                                                            {(
                                                                                                                product.rack_details ||
                                                                                                                []
                                                                                                            ).map(
                                                                                                                (
                                                                                                                    rack,
                                                                                                                    rackIndex
                                                                                                                ) => (
                                                                                                                    <tr
                                                                                                                        key={`${product.id}-${rack.rack_id}-${rack.column_name}-${rackIndex}`}
                                                                                                                    >
                                                                                                                        <td
                                                                                                                            style={
                                                                                                                                rackTdStyle
                                                                                                                            }
                                                                                                                        >
                                                                                                                            {rack.rack_id ??
                                                                                                                                "-"}
                                                                                                                        </td>

                                                                                                                        <td
                                                                                                                            style={
                                                                                                                                rackTdStyle
                                                                                                                            }
                                                                                                                        >
                                                                                                                            {rack.rack_name ||
                                                                                                                                "-"}
                                                                                                                        </td>

                                                                                                                        <td
                                                                                                                            style={
                                                                                                                                rackTdStyle
                                                                                                                            }
                                                                                                                        >
                                                                                                                            {rack.column_name ||
                                                                                                                                "-"}
                                                                                                                        </td>

                                                                                                                        <td
                                                                                                                            style={
                                                                                                                                rackTdStyle
                                                                                                                            }
                                                                                                                        >
                                                                                                                            <Badge
                                                                                                                                color={getUsabilityBadgeColor(
                                                                                                                                    rack.usability
                                                                                                                                )}
                                                                                                                                pill
                                                                                                                            >
                                                                                                                                {getUsabilityLabel(
                                                                                                                                    rack.usability
                                                                                                                                )}
                                                                                                                            </Badge>
                                                                                                                        </td>

                                                                                                                        <td
                                                                                                                            style={
                                                                                                                                rackStockTdStyle
                                                                                                                            }
                                                                                                                        >
                                                                                                                            {formatNumber(
                                                                                                                                rack.rack_stock
                                                                                                                            )}
                                                                                                                        </td>

                                                                                                                        <td
                                                                                                                            style={
                                                                                                                                rackLockedTdStyle
                                                                                                                            }
                                                                                                                        >
                                                                                                                            {formatNumber(
                                                                                                                                rack.rack_lock
                                                                                                                            )}
                                                                                                                        </td>

                                                                                                                        <td
                                                                                                                            style={
                                                                                                                                rackAvailableTdStyle
                                                                                                                            }
                                                                                                                        >
                                                                                                                            {formatNumber(
                                                                                                                                rack.available_stock
                                                                                                                            )}
                                                                                                                        </td>
                                                                                                                    </tr>
                                                                                                                )
                                                                                                            )}
                                                                                                        </tbody>
                                                                                                    </Table>
                                                                                                </div>
                                                                                            </div>
                                                                                        </Collapse>
                                                                                    </td>
                                                                                </tr>
                                                                            </React.Fragment>
                                                                        );
                                                                    }
                                                                )
                                                            )}
                                                        </tbody>
                                                    </Table>
                                                </div>

                                                {products.length > 0 && (
                                                    <div style={scrollLoadingContainerStyle}>
                                                        {loadingMore ? (
                                                            <div style={scrollLoadingContentStyle}>
                                                                <Spinner size="sm" color="primary" />
                                                                <span>Loading more products...</span>
                                                            </div>
                                                        ) : hasNextPage ? (
                                                            <div style={scrollHintStyle}>
                                                                Scroll inside the table to load more products
                                                            </div>
                                                        ) : (
                                                            <div style={allLoadedStyle}>
                                                                <span>All products loaded</span>
                                                                <span style={loadedCountStyle}>
                                                                    {formatNumber(products.length)} products
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>
                            </div>
                        </>
                    )}
                </div>
                {report && (
                    <div style={stickyExportContainerStyle}>
                        <Button
                            color="success"
                            onClick={exportToExcel}
                            disabled={
                                loading ||
                                products.length === 0
                            }
                            style={stickyExportButtonStyle}
                        >
                            {loading ? (
                                <>
                                    <Spinner
                                        size="sm"
                                        className="me-2"
                                    />
                                    Please Wait
                                </>
                            ) : (
                                <>
                                    <span style={excelIconStyle}>
                                        XLS
                                    </span>
                                    Export Excel
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </React.Fragment>
    );
};

const labelStyle = {
    fontSize: "13px",
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
    fontSize: "23px",
};

const subTitleStyle = {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
};

const filterSectionStyle = {
    marginTop: "18px",
    padding: "20px",
    backgroundColor: "#f8fafc",
    border: "1.5px solid #e2e8f0",
    borderRadius: "15px",
};

const usabilitySelectorStyle = {
    padding: "20px",
    backgroundColor: "#f8fafc",
    border: "1.5px solid #e2e8f0",
    borderRadius: "15px",
};

const filterSectionTitleStyle = {
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: "900",
};

const filterSectionSubtitleStyle = {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "600",
};

const usabilityButtonStyle = {
    width: "100%",
    minHeight: "88px",
    padding: "14px",
    border: "1.5px solid",
    borderRadius: "13px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    transition: "all 0.2s ease",
};

const usabilityIndicatorStyle = {
    width: "11px",
    height: "11px",
    borderRadius: "50%",
    marginTop: "5px",
    flexShrink: 0,
};

const usabilityTitleStyle = {
    fontSize: "14px",
    fontWeight: "900",
};

const usabilityDescriptionStyle = {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "600",
    marginTop: "3px",
    lineHeight: 1.4,
};

const buttonStyle = {
    height: "48px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "800",
};

const summaryCardStyle = {
    borderRadius: "16px",
    boxShadow: "0 7px 20px rgba(15, 23, 42, 0.08)",
};

const summaryCardTitleStyle = {
    color: "#475569",
    fontSize: "13px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
};

const summaryCardValueStyle = {
    fontSize: "29px",
    fontWeight: "900",
    marginTop: "7px",
};

const summaryCardDescriptionStyle = {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "600",
    marginTop: "3px",
};

const usabilitySummaryCardStyle = {
    borderRadius: "18px",
    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.10)",
    borderLeft: "5px solid #0f766e",
};

const sectionTitleStyle = {
    color: "#111827",
    fontSize: "19px",
    fontWeight: "900",
};

const usabilitySummaryBoxStyle = {
    minHeight: "76px",
    padding: "16px",
    borderRadius: "13px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "800",
};

const tableCardStyle = {
    borderRadius: "18px",
    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.10)",
};

const tableWrapperStyle = {
    border: "1.5px solid #d7deea",
    borderRadius: "14px",
    overflowX: "auto",
    overflowY: "auto",
    height: "650px",
    maxHeight: "70vh",
    backgroundColor: "#ffffff",
    position: "relative",
    scrollbarWidth: "thin",
    scrollbarColor: "#94a3b8 #f1f5f9",
};

const tableHeaderStyle = {
    padding: "14px 12px",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontSize: "12px",
    fontWeight: "900",
    borderBottom: "1.5px solid #cbd5e1",
    whiteSpace: "nowrap",
    textAlign: "center",

    position: "sticky",
    top: 0,
    zIndex: 10,
    boxShadow: "0 2px 5px rgba(15, 23, 42, 0.08)",
};

const expandHeaderStyle = {
    ...tableHeaderStyle,
    width: "45px",
};

const productHeaderStyle = {
    ...tableHeaderStyle,
    textAlign: "left",
    minWidth: "285px",
};

const stockHeaderStyle = {
    ...tableHeaderStyle,
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
};

const lockedHeaderStyle = {
    ...tableHeaderStyle,
    backgroundColor: "#fff7ed",
    color: "#c2410c",
};

const availableHeaderStyle = {
    ...tableHeaderStyle,
    backgroundColor: "#ecfdf5",
    color: "#15803d",
};

const tableTdStyle = {
    padding: "14px 12px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
    textAlign: "center",
};

const expandTdStyle = {
    ...tableTdStyle,
    width: "45px",
};

const productTdStyle = {
    ...tableTdStyle,
    minWidth: "285px",
    textAlign: "left",
};

const stockTdStyle = {
    ...tableTdStyle,
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "15px",
    fontWeight: "900",
};

const lockedTdStyle = {
    ...tableTdStyle,
    backgroundColor: "#fff7ed",
    color: "#c2410c",
    fontSize: "15px",
    fontWeight: "900",
};

const availableTdStyle = {
    ...tableTdStyle,
    backgroundColor: "#ecfdf5",
    color: "#15803d",
    fontSize: "15px",
    fontWeight: "900",
};

const expandButtonStyle = {
    width: "27px",
    height: "27px",
    borderRadius: "8px",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
    fontWeight: "900",
    transition: "transform 0.2s ease",
};

const productImageWrapperStyle = {
    width: "52px",
    height: "52px",
    minWidth: "52px",
    borderRadius: "12px",
    backgroundColor: "#f1f5f9",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    fontSize: "23px",
};

const productImageStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
};

const productNameStyle = {
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "900",
    whiteSpace: "normal",
};

const productMetaStyle = {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "700",
    marginTop: "3px",
};

const cellPrimaryStyle = {
    color: "#0f172a",
    fontWeight: "800",
};

const cellSecondaryStyle = {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "600",
    marginTop: "3px",
};

const priceStyle = {
    color: "#0f172a",
    fontWeight: "900",
};

const rackDetailsContainerStyle = {
    padding: "20px 28px 24px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #d7deea",
};

const rackDetailsTitleStyle = {
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "900",
};

const rackDetailsSubtitleStyle = {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "600",
};

const rackTableWrapperStyle = {
    border: "1.5px solid #d7deea",
    borderRadius: "12px",
    overflow: "hidden",
    backgroundColor: "#ffffff",
};

const rackHeaderStyle = {
    padding: "12px",
    backgroundColor: "#e2e8f0",
    color: "#0f172a",
    fontSize: "12px",
    fontWeight: "900",
    textAlign: "center",
    borderBottom: "1px solid #cbd5e1",
    whiteSpace: "nowrap",
};

const rackStockHeaderStyle = {
    ...rackHeaderStyle,
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
};

const rackLockedHeaderStyle = {
    ...rackHeaderStyle,
    backgroundColor: "#ffedd5",
    color: "#c2410c",
};

const rackAvailableHeaderStyle = {
    ...rackHeaderStyle,
    backgroundColor: "#dcfce7",
    color: "#15803d",
};

const rackTdStyle = {
    padding: "12px",
    color: "#334155",
    fontSize: "12px",
    fontWeight: "800",
    textAlign: "center",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
};

const rackStockTdStyle = {
    ...rackTdStyle,
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "14px",
    fontWeight: "900",
};

const rackLockedTdStyle = {
    ...rackTdStyle,
    backgroundColor: "#fff7ed",
    color: "#c2410c",
    fontSize: "14px",
    fontWeight: "900",
};

const rackAvailableTdStyle = {
    ...rackTdStyle,
    backgroundColor: "#ecfdf5",
    color: "#15803d",
    fontSize: "14px",
    fontWeight: "900",
};

const emptyIconStyle = {
    fontSize: "40px",
    marginBottom: "10px",
};

const emptyTitleStyle = {
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: "900",
};

const emptyDescriptionStyle = {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "600",
    marginTop: "4px",
};


const scrollLoadingContainerStyle = {
    position: "sticky",
    bottom: 0,
    zIndex: 12,
    minHeight: "54px",
    padding: "14px 18px",
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "rgba(248, 250, 252, 0.96)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
};

const scrollLoadingContentStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "800",
};

const scrollHintStyle = {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
};

const allLoadedStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    color: "#15803d",
    fontSize: "13px",
    fontWeight: "900",
    flexWrap: "wrap",
};

const loadedCountStyle = {
    padding: "4px 9px",
    borderRadius: "999px",
    backgroundColor: "#dcfce7",
    color: "#15803d",
    fontSize: "11px",
    fontWeight: "900",
};

const stickyExportContainerStyle = {
    position: "fixed",
    right: "28px",
    bottom: "24px",
    zIndex: 1050,
};

const stickyExportButtonStyle = {
    minWidth: "165px",
    height: "52px",
    padding: "0 20px",
    borderRadius: "14px",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    fontSize: "14px",
    fontWeight: "900",
    boxShadow: "0 10px 28px rgba(22, 163, 74, 0.35)",
};

const excelIconStyle = {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    backgroundColor: "rgba(255, 255, 255, 0.20)",
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: "900",
};

export default ProductRackUsabilityReport;