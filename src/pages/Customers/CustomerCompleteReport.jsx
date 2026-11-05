import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
    FiArrowLeft as ArrowLeft,
    FiSearch as Search,
    FiFilter as Filter,
    FiRefreshCw as RefreshCw,
    FiDownload as Download,
    FiTrendingUp as TrendingUp,
    FiShoppingCart as ShoppingCart,
    FiPackage as Package,
    FiBriefcase as Wallet,
    FiCreditCard as CreditCard,
    FiRotateCcw as RotateCcw,
    FiFileText as FileText,
    FiCalendar as CalendarDays,
    FiChevronLeft as ChevronLeft,
    FiChevronRight as ChevronRight,
    FiUser as UserRound,
    FiBarChart2 as BarChart3,
    FiDollarSign as IndianRupee,
    FiClipboard as Receipt,
    FiX as X,
} from "react-icons/fi";
import * as XLSX from "xlsx-js-style";

// ==========================================
// API CONFIGURATION
// ==========================================

const API_BASE = (import.meta.env.VITE_APP_KEY || "").replace(/\/+$/, "");

const API_URL = `${API_BASE}/customer/complete/report/`;

// If VITE_APP_KEY does not include /api,
// change the URL above to:
// `${API_BASE}/api/customer/complete/report/`

const formatMoney = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const formatNumber = (value) =>
    Number(value || 0).toLocaleString("en-IN");

const formatLabel = (value) =>
    String(value || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

const displayValue = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
};

const getReportExportData = (report) => {
    const customer = report?.customer || {};
    const summary = report?.overall_summary || {};
    const sections = report?.sections || {};

    const summaryRows = Object.entries(summary)
        .filter(([, value]) => value !== null && typeof value !== "object")
        .map(([key, value]) => ({
            Particulars: formatLabel(key),
            Value: value,
        }));

    const transactionSections = Object.entries(TABLE_COLUMNS).map(
        ([key, columns]) => {
            const section = sections[key] || {};
            const rows = Array.isArray(section.data) ? section.data : [];

            return {
                key,
                title: SECTIONS.find((item) => item.key === key)?.label || formatLabel(key),
                columns,
                rows,
                summary: section.summary || {},
            };
        }
    );

    return { customer, summaryRows, transactionSections };
};

const SECTIONS = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "orders", label: "Orders", icon: ShoppingCart },
    { key: "order_items", label: "Order Items", icon: Package },
    { key: "advance_receipts", label: "Advances", icon: Wallet },
    { key: "payment_receipts", label: "Payments", icon: CreditCard },
    { key: "commission_receipts", label: "Commissions", icon: Receipt },
    { key: "refund_receipts", label: "Refunds", icon: RotateCcw },
    { key: "advance_transfers", label: "Transfers", icon: TrendingUp },
    { key: "grv", label: "GRV / Returns", icon: FileText },
];

const TABLE_COLUMNS = {
    orders: [
        "invoice", "order_date", "status",
        "payment_status", "total_amount", "staff_name",
    ],
    order_items: [
        "invoice", "product_name", "quantity",
        "rate", "discount_total", "tax_amount", "total_with_tax",
    ],
    advance_receipts: [
        "payment_receipt", "received_at", "amount",
        "bank_name", "transactionID", "remark",
    ],
    payment_receipts: [
        "invoice", "payment_receipt", "received_at",
        "amount", "bank_name", "transactionID",
    ],
    commission_receipts: [
        "invoice", "payment_receipt", "received_at",
        "amount", "bank_name",
    ],
    refund_receipts: [
        "refund_no", "invoice", "date",
        "amount", "bank_name", "note",
    ],
    advance_transfers: [
        "send_from_name", "send_to_name",
        "direction", "date", "amount",
    ],
    grv: [
        "invoice", "product_name", "quantity",
        "returnreason", "remark", "status", "total_value",
    ],
};

// ==========================================
// SUMMARY CARD
// ==========================================

function SummaryCard({ title, value, icon: Icon, color = "blue", subtitle }) {
    return (
        <div className={`cr-summary-card cr-${color}`}>
            <div className="cr-summary-top">
                <div className="cr-summary-icon">
                    <Icon size={21} />
                </div>
            </div>

            <div className="cr-summary-title">{title}</div>
            <div className="cr-summary-value">{value}</div>

            {subtitle && (
                <div className="cr-summary-subtitle">{subtitle}</div>
            )}
        </div>
    );
}

// ==========================================
// LINE CHART
// ==========================================

function LineChart({
    title,
    data = [],
    primaryKey,
    secondaryKey,
    primaryLabel = "Current",
    secondaryLabel = "Previous",
    currency = true,
}) {
    const [selected, setSelected] = useState("all");

    const points = Array.isArray(data) ? data : [];

    const values = points.flatMap((item) => [
        Number(item[primaryKey] || 0),
        ...(secondaryKey ? [Number(item[secondaryKey] || 0)] : []),
    ]);

    const maximum = Math.max(1, ...values);

    const width = 800;
    const height = 280;
    const left = 70;
    const right = 22;
    const top = 25;
    const bottom = 45;

    const x = (index) =>
        left +
        (points.length <= 1
            ? (width - left - right) / 2
            : (index / (points.length - 1)) * (width - left - right));

    const y = (value) =>
        height -
        bottom -
        (Number(value || 0) / maximum) * (height - top - bottom);

    const getPath = (key) =>
        points
            .map((point, index) => {
                return `${index === 0 ? "M" : "L"} ${x(index)} ${y(point[key])}`;
            })
            .join(" ");

    const axisValue = (value) => {
        if (currency) {
            if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
            if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
            return `₹${Math.round(value)}`;
        }
        return formatNumber(Math.round(value));
    };

    return (
        <div className="cr-panel">
            <div className="cr-panel-header">
                <div>
                    <h3>{title}</h3>
                    <p>Performance over the selected period</p>
                </div>

                <div className="cr-chart-switch">
                    <button
                        className={selected === "all" ? "active" : ""}
                        onClick={() => setSelected("all")}
                    >
                        All
                    </button>
                    <button
                        className={selected === "current" ? "active" : ""}
                        onClick={() => setSelected("current")}
                    >
                        Current
                    </button>
                    {secondaryKey && (
                        <button
                            className={selected === "previous" ? "active" : ""}
                            onClick={() => setSelected("previous")}
                        >
                            Previous
                        </button>
                    )}
                </div>
            </div>

            {points.length === 0 ? (
                <div className="cr-empty">No chart data available</div>
            ) : (
                <div className="cr-chart-container">
                    <svg
                        viewBox={`0 0 ${width} ${height}`}
                        role="img"
                        aria-label={title}
                    >
                        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
                            <g key={fraction}>
                                <line
                                    x1={left}
                                    x2={width - right}
                                    y1={y(maximum * fraction)}
                                    y2={y(maximum * fraction)}
                                    stroke="#e9eef5"
                                />
                                <text
                                    x={left - 12}
                                    y={y(maximum * fraction) + 4}
                                    textAnchor="end"
                                    fill="#94a3b8"
                                    fontSize="12"
                                >
                                    {axisValue(maximum * fraction)}
                                </text>
                            </g>
                        ))}

                        {(selected === "all" || selected === "current") && (
                            <path
                                d={getPath(primaryKey)}
                                stroke="#2563eb"
                                strokeWidth="3.5"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        )}

                        {secondaryKey &&
                            (selected === "all" || selected === "previous") && (
                                <path
                                    d={getPath(secondaryKey)}
                                    stroke="#94a3b8"
                                    strokeWidth="3"
                                    strokeDasharray="8 7"
                                    fill="none"
                                    strokeLinecap="round"
                                />
                            )}

                        <text x={left} y={height - 12} fill="#64748b" fontSize="12">
                            {points[0]?.date}
                        </text>
                        <text
                            x={width - right}
                            y={height - 12}
                            textAnchor="end"
                            fill="#64748b"
                            fontSize="12"
                        >
                            {points[points.length - 1]?.date}
                        </text>
                    </svg>
                </div>
            )}

            <div className="cr-chart-legend">
                <span><i className="cr-dot blue" />{primaryLabel}</span>
                {secondaryKey && (
                    <span><i className="cr-dot gray" />{secondaryLabel}</span>
                )}
            </div>
        </div>
    );
}

// ==========================================
// HORIZONTAL BAR CHART
// ==========================================

function HorizontalBarChart({
    title,
    data = [],
    labelKey,
    valueKey,
    currency = true,
}) {
    const rows = Array.isArray(data) ? data.slice(0, 8) : [];

    const maxValue = Math.max(
        1,
        ...rows.map((row) => Number(row[valueKey] || 0))
    );

    return (
        <div className="cr-panel">
            <div className="cr-panel-header">
                <div>
                    <h3>{title}</h3>
                    <p>Top performance breakdown</p>
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="cr-empty">No data available</div>
            ) : (
                <div className="cr-bars">
                    {rows.map((row, index) => {
                        const value = Number(row[valueKey] || 0);
                        const percentage = Math.max(0, (value / maxValue) * 100);

                        return (
                            <div className="cr-bar-item" key={index}>
                                <div className="cr-bar-label">
                                    <span>{row[labelKey] || "Unspecified"}</span>
                                    <strong>
                                        {currency ? formatMoney(value) : formatNumber(value)}
                                    </strong>
                                </div>

                                <div className="cr-bar-track">
                                    <div
                                        className="cr-bar-fill"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ==========================================
// CSV EXPORT
// ==========================================

function exportCSV(rows, filename) {
    if (!rows.length) return;

    const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];

    const escapeCSV = (value) => {
        const text =
            value === null || value === undefined
                ? ""
                : typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value);

        const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
        return `"${safe.replace(/"/g, '""')}"`;
    };

    const csv = [
        keys.map(escapeCSV).join(","),
        ...rows.map((row) =>
            keys.map((key) => escapeCSV(row[key])).join(",")
        ),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

// ==========================================
// TRANSACTION TABLE
// ==========================================

function TransactionTable({ sectionKey, section, customerId }) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const rows = Array.isArray(section?.data) ? section.data : [];
    const summary = section?.summary || {};
    const columns = TABLE_COLUMNS[sectionKey] || [];

    useEffect(() => {
        setSearch("");
        setPage(1);
    }, [sectionKey, section]);

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return rows;

        return rows.filter((row) =>
            columns.some((column) =>
                displayValue(row[column]).toLowerCase().includes(query)
            )
        );
    }, [rows, search, columns]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredRows.length / pageSize)
    );

    const safePage = Math.min(page, totalPages);

    const visibleRows = filteredRows.slice(
        (safePage - 1) * pageSize,
        safePage * pageSize
    );

    const sectionName =
        SECTIONS.find((item) => item.key === sectionKey)?.label || sectionKey;

    return (
        <div className="cr-panel">
            <div className="cr-panel-header">
                <div>
                    <h3>{sectionName}</h3>
                    <p>{formatNumber(rows.length)} total records</p>
                </div>

                <button
                    className="cr-btn cr-btn-outline"
                    disabled={!filteredRows.length}
                    onClick={() =>
                        exportCSV(
                            filteredRows,
                            `customer_${customerId}_${sectionKey}.csv`
                        )
                    }
                >
                    <Download size={16} />
                    Export CSV
                </button>
            </div>

            <div className="cr-section-summary">
                {Object.entries(summary)
                    .filter(
                        ([, value]) =>
                            value !== null && typeof value !== "object"
                    )
                    .map(([key, value]) => (
                        <div className="cr-small-stat" key={key}>
                            <span>{formatLabel(key)}</span>
                            <strong>{displayValue(value)}</strong>
                        </div>
                    ))}
            </div>

            <div className="cr-table-toolbar">
                <div className="cr-search">
                    <Search size={17} />
                    <input
                        placeholder={`Search ${sectionName.toLowerCase()}...`}
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                    {search && (
                        <button onClick={() => setSearch("")}>
                            <X size={15} />
                        </button>
                    )}
                </div>

                <select
                    value={pageSize}
                    onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                    }}
                >
                    <option value={10}>10 rows</option>
                    <option value={25}>25 rows</option>
                    <option value={50}>50 rows</option>
                    <option value={100}>100 rows</option>
                </select>
            </div>

            <div className="cr-table-scroll">
                <table className="cr-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            {columns.map((column) => (
                                <th key={column}>{formatLabel(column)}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {visibleRows.map((row, index) => (
                            <tr key={row.id ?? index}>
                                <td>{(safePage - 1) * pageSize + index + 1}</td>

                                {columns.map((column) => {
                                    const value = row[column];

                                    if (
                                        column === "status" ||
                                        column === "payment_status" ||
                                        column === "direction"
                                    ) {
                                        return (
                                            <td key={column}>
                                                <span className="cr-status">
                                                    {displayValue(value)}
                                                </span>
                                            </td>
                                        );
                                    }

                                    return (
                                        <td key={column}>{displayValue(value)}</td>
                                    );
                                })}
                            </tr>
                        ))}

                        {visibleRows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={columns.length + 1}
                                    className="cr-table-empty"
                                >
                                    No matching records found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="cr-pagination">
                <span>
                    Showing {filteredRows.length ? (safePage - 1) * pageSize + 1 : 0}
                    {"–"}
                    {Math.min(safePage * pageSize, filteredRows.length)}
                    {" of "}
                    {filteredRows.length}
                </span>

                <div>
                    <button
                        disabled={safePage === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        <ChevronLeft size={17} />
                    </button>

                    <span>Page {safePage} of {totalPages}</span>

                    <button
                        disabled={safePage === totalPages}
                        onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                        }
                    >
                        <ChevronRight size={17} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function CustomerCompleteReport() {
    const { customerId } = useParams();
    const navigate = useNavigate();

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview");

    const [productId, setProductId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [appliedFilters, setAppliedFilters] = useState({
        product_id: "",
        start_date: "",
        end_date: "",
    });

    const [refreshKey, setRefreshKey] = useState(0);

    // ==========================================
    // FETCH API
    // ==========================================

    useEffect(() => {
        const controller = new AbortController();

        const fetchReport = async () => {
            if (!customerId) {
                setError("Customer ID is required.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(API_URL, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params: {
                        customer_id: customerId,
                        ...(appliedFilters.product_id && {
                            product_id: appliedFilters.product_id,
                        }),
                        ...(appliedFilters.start_date && {
                            start_date: appliedFilters.start_date,
                        }),
                        ...(appliedFilters.end_date && {
                            end_date: appliedFilters.end_date,
                        }),
                    },
                    signal: controller.signal,
                });

                if (!controller.signal.aborted) {
                    setReport(response.data);
                }
            } catch (err) {
                if (controller.signal.aborted || axios.isCancel(err)) return;

                setError(
                    err.response?.data?.message ||
                    err.message ||
                    "Unable to load customer report."
                );
                setReport(null);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        fetchReport();
        return () => controller.abort();
    }, [customerId, appliedFilters, refreshKey]);

    // ==========================================
    // FILTER HANDLERS
    // ==========================================

    const applyFilters = (e) => {
        e.preventDefault();

        if (startDate && endDate && startDate > endDate) {
            setError("Start date cannot be after end date.");
            return;
        }

        if (
            productId &&
            (!/^\d+$/.test(productId) || Number(productId) <= 0)
        ) {
            setError("Enter a valid product ID.");
            return;
        }

        setError("");
        setAppliedFilters({
            product_id: productId,
            start_date: startDate,
            end_date: endDate,
        });
    };

    const clearFilters = () => {
        setProductId("");
        setStartDate("");
        setEndDate("");
        setError("");

        setAppliedFilters({
            product_id: "",
            start_date: "",
            end_date: "",
        });
    };



    const exportReportExcel = () => {
        if (!report || loading) return;

        const wb = XLSX.utils.book_new();
        const name = report.customer?.name || `Customer ${customerId}`;

        // SAME COLORS AS THE REACT UI
        const COLORS = {
            navy: "101F3E",
            blue: "2858DF",
            lightBlue: "EAF1FF",
            green: "10A977",
            lightGreen: "E7F8EF",
            purple: "8B5CF6",
            lightPurple: "F1EAFF",
            orange: "F3A03C",
            lightOrange: "FFF3E5",
            red: "ED6179",
            lightRed: "FFEBEE",
            background: "F4F7FC",
            white: "FFFFFF",
            dark: "14213D",
            muted: "64748B",
            border: "E5EAF3",
        };

        const fill = (color) => ({
            patternType: "solid",
            fgColor: { rgb: color },
        });

        const border = {
            top: { style: "thin", color: { rgb: COLORS.border } },
            bottom: { style: "thin", color: { rgb: COLORS.border } },
            left: { style: "thin", color: { rgb: COLORS.border } },
            right: { style: "thin", color: { rgb: COLORS.border } },
        };

        const titleStyle = {
            fill: fill(COLORS.navy),
            font: {
                name: "Calibri",
                sz: 17,
                bold: true,
                color: { rgb: COLORS.white },
            },
            alignment: {
                horizontal: "left",
                vertical: "center",
                indent: 1,
            },
        };

        const headerStyle = {
            fill: fill(COLORS.blue),
            font: {
                name: "Calibri",
                sz: 11,
                bold: true,
                color: { rgb: COLORS.white },
            },
            alignment: {
                horizontal: "left",
                vertical: "center",
                wrapText: true,
            },
            border,
        };

        const bodyStyle = (index) => ({
            fill: fill(
                index % 2 === 0 ? COLORS.white : COLORS.background
            ),
            font: {
                name: "Calibri",
                sz: 10,
                color: { rgb: COLORS.dark },
            },
            alignment: {
                vertical: "center",
                wrapText: true,
            },
            border,
        });

        const sectionStyle = (color = COLORS.blue) => ({
            fill: fill(color),
            font: {
                name: "Calibri",
                sz: 12,
                bold: true,
                color: { rgb: COLORS.white },
            },
            alignment: {
                vertical: "center",
                indent: 1,
            },
        });

        const summaryStyle = (color = COLORS.lightBlue) => ({
            fill: fill(color),
            font: {
                name: "Calibri",
                sz: 10,
                bold: true,
                color: { rgb: COLORS.dark },
            },
            alignment: {
                vertical: "center",
            },
            border,
        });

        const setCellStyle = (ws, row, col, style) => {
            const address = XLSX.utils.encode_cell({
                r: row,
                c: col,
            });

            if (!ws[address]) {
                ws[address] = { t: "s", v: "" };
            }

            ws[address].s = style;
        };

        const styleRow = (ws, row, columnCount, style) => {
            for (let col = 0; col < columnCount; col++) {
                setCellStyle(ws, row, col, style);
            }
        };

        const safeValue = (value) => {
            if (value === null || value === undefined) return "";
            if (typeof value === "object") return JSON.stringify(value);

            // Keep text values as text, including IDs and codes.
            return value;
        };

        const getSummaryColor = (key) => {
            const text = key.toLowerCase();

            if (text.includes("refund") || text.includes("grv")) {
                return COLORS.lightRed;
            }

            if (text.includes("payment") || text.includes("sales")) {
                return COLORS.lightGreen;
            }

            if (text.includes("discount") || text.includes("tax")) {
                return COLORS.lightOrange;
            }

            if (text.includes("order") || text.includes("quantity")) {
                return COLORS.lightPurple;
            }

            return COLORS.lightBlue;
        };

        // ==========================================
        // OVERVIEW WORKSHEET
        // ==========================================

        const summaryEntries = Object.entries(
            report.overall_summary || {}
        );

        const overviewData = [
            ["CUSTOMER COMPLETE REPORT", ""],
            ["Customer", name],
            ["Start Date", appliedFilters.start_date || "All"],
            ["End Date", appliedFilters.end_date || "All"],
            [],
            ["FINANCIAL OVERVIEW", ""],
            ["Metric", "Value"],
            ...summaryEntries.map(([key, value]) => [
                formatLabel(key),
                safeValue(value),
            ]),
        ];

        const overview = XLSX.utils.aoa_to_sheet(overviewData);

        overview["!cols"] = [
            { wch: 38 },
            { wch: 32 },
        ];

        overview["!rows"] = [
            { hpt: 36 },
            { hpt: 27 },
            { hpt: 25 },
            { hpt: 25 },
            { hpt: 12 },
            { hpt: 30 },
            { hpt: 28 },
        ];

        overview["!merges"] = [
            {
                s: { r: 0, c: 0 },
                e: { r: 0, c: 1 },
            },
            {
                s: { r: 5, c: 0 },
                e: { r: 5, c: 1 },
            },
        ];

        styleRow(overview, 0, 2, titleStyle);

        for (let row = 1; row <= 3; row++) {
            setCellStyle(
                overview,
                row,
                0,
                summaryStyle(COLORS.lightBlue)
            );

            setCellStyle(
                overview,
                row,
                1,
                bodyStyle(row)
            );
        }

        styleRow(
            overview,
            5,
            2,
            sectionStyle(COLORS.navy)
        );

        styleRow(overview, 6, 2, headerStyle);

        summaryEntries.forEach(([key, value], index) => {
            const row = index + 7;
            const color = getSummaryColor(key);

            setCellStyle(
                overview,
                row,
                0,
                summaryStyle(color)
            );

            setCellStyle(
                overview,
                row,
                1,
                {
                    ...bodyStyle(index),
                    font: {
                        name: "Calibri",
                        sz: 11,
                        bold: true,
                        color: { rgb: COLORS.dark },
                    },
                }
            );

            if (typeof value === "number") {
                const address = XLSX.utils.encode_cell({
                    r: row,
                    c: 1,
                });

                overview[address].z = "#,##0.00";
            }

            overview["!rows"][row] = { hpt: 25 };
        });

        XLSX.utils.book_append_sheet(
            wb,
            overview,
            "Overview"
        );

        // ==========================================
        // TRANSACTION WORKSHEETS
        // ==========================================

        const sectionColors = {
            orders: COLORS.blue,
            order_items: COLORS.purple,
            advance_receipts: COLORS.green,
            payment_receipts: COLORS.green,
            commission_receipts: COLORS.purple,
            refund_receipts: COLORS.red,
            advance_transfers: COLORS.orange,
            grv: COLORS.red,
        };

        Object.entries(report.sections || {}).forEach(
            ([key, section]) => {
                const rows = Array.isArray(section?.data)
                    ? section.data
                    : [];

                const columns = [
                    ...new Set([
                        ...(TABLE_COLUMNS[key] || []),
                        ...rows.flatMap((row) => Object.keys(row)),
                    ]),
                ];

                const summaryRows = Object.entries(
                    section?.summary || {}
                ).map(([k, v]) => [
                    formatLabel(k),
                    safeValue(v),
                ]);

                const sectionName =
                    SECTIONS.find((item) => item.key === key)?.label ||
                    formatLabel(key);

                const columnCount = Math.max(2, columns.length);

                const sheetData = [
                    [sectionName.toUpperCase()],
                    ["Customer", name],
                    ["Total Records", rows.length],
                    ...summaryRows,
                    [],
                    columns.map(formatLabel),
                    ...rows.map((row) =>
                        columns.map((column) =>
                            safeValue(row[column])
                        )
                    ),
                ];

                const ws = XLSX.utils.aoa_to_sheet(sheetData);

                const headerRow = 3 + summaryRows.length + 1;
                const dataStartRow = headerRow + 1;

                ws["!cols"] = Array.from(
                    { length: columnCount },
                    (_, index) => ({
                        wch: index === 0 ? 30 : 23,
                    })
                );

                ws["!rows"] = [];

                ws["!rows"][0] = { hpt: 36 };
                ws["!rows"][1] = { hpt: 27 };
                ws["!rows"][2] = { hpt: 27 };

                ws["!merges"] = [
                    {
                        s: { r: 0, c: 0 },
                        e: { r: 0, c: columnCount - 1 },
                    },
                ];

                const themeColor =
                    sectionColors[key] || COLORS.blue;

                styleRow(
                    ws,
                    0,
                    columnCount,
                    sectionStyle(themeColor)
                );

                for (let row = 1; row <= 2; row++) {
                    setCellStyle(
                        ws,
                        row,
                        0,
                        summaryStyle(COLORS.lightBlue)
                    );

                    setCellStyle(
                        ws,
                        row,
                        1,
                        bodyStyle(row)
                    );
                }

                summaryRows.forEach(([summaryKey], index) => {
                    const row = index + 3;

                    setCellStyle(
                        ws,
                        row,
                        0,
                        summaryStyle(
                            getSummaryColor(summaryKey)
                        )
                    );

                    setCellStyle(
                        ws,
                        row,
                        1,
                        {
                            ...bodyStyle(index),
                            font: {
                                name: "Calibri",
                                sz: 10,
                                bold: true,
                                color: {
                                    rgb: COLORS.dark,
                                },
                            },
                        }
                    );

                    ws["!rows"][row] = { hpt: 25 };
                });

                // Column headers
                styleRow(
                    ws,
                    headerRow,
                    columnCount,
                    headerStyle
                );

                ws["!rows"][headerRow] = { hpt: 32 };

                // Transaction data
                rows.forEach((row, rowIndex) => {
                    const excelRow = dataStartRow + rowIndex;

                    columns.forEach((column, colIndex) => {
                        const address = XLSX.utils.encode_cell({
                            r: excelRow,
                            c: colIndex,
                        });

                        let cellStyle = bodyStyle(rowIndex);

                        // Status column styling
                        if (
                            column === "status" ||
                            column === "payment_status" ||
                            column === "direction"
                        ) {
                            cellStyle = {
                                ...cellStyle,
                                fill: fill(COLORS.lightBlue),
                                font: {
                                    name: "Calibri",
                                    sz: 10,
                                    bold: true,
                                    color: {
                                        rgb: COLORS.blue,
                                    },
                                },
                            };
                        }

                        setCellStyle(
                            ws,
                            excelRow,
                            colIndex,
                            cellStyle
                        );

                        if (
                            typeof row[column] === "number" &&
                            ws[address]
                        ) {
                            ws[address].z = "#,##0.00";
                        }
                    });

                    ws["!rows"][excelRow] = { hpt: 25 };
                });

                // Enable Excel filtering
                if (columns.length > 0) {
                    ws["!autofilter"] = {
                        ref: XLSX.utils.encode_range({
                            s: {
                                r: headerRow,
                                c: 0,
                            },
                            e: {
                                r: Math.max(
                                    headerRow,
                                    dataStartRow + rows.length - 1
                                ),
                                c: columns.length - 1,
                            },
                        }),
                    };
                }

                XLSX.utils.book_append_sheet(
                    wb,
                    ws,
                    sectionName
                        .replace(/[\\/?*[\]:]/g, "")
                        .slice(0, 31)
                );
            }
        );

        XLSX.writeFile(
            wb,
            `Customer_Complete_Report_${customerId}.xlsx`
        );
    };


    const refreshReport = () => setRefreshKey((key) => key + 1);

    // ==========================================
    // RESPONSE DATA
    // ==========================================

    const customer = report?.customer || {};
    const summary = report?.overall_summary || {};
    const sections = report?.sections || {};
    const graphs = report?.graphs || {};

    const salesComparison = graphs.sales_comparison?.data || [];
    const comparisonSummary = graphs.sales_comparison?.summary || {};
    const salesData = graphs.sales_over_time?.data || [];
    const productPerformance = graphs.product_performance?.data || [];
    const orderStatus = graphs.order_status_distribution?.data || [];

    const cards = [
        {
            title: "Total Sales",
            value: formatMoney(summary.total_sales),
            icon: IndianRupee,
            color: "blue",
            subtitle: "Invoice sales",
        },
        {
            title: "Total Orders",
            value: formatNumber(summary.total_orders),
            icon: ShoppingCart,
            color: "purple",
            subtitle: "Customer orders",
        },
        {
            title: "Average Order Value",
            value: formatMoney(summary.average_order_value),
            icon: TrendingUp,
            color: "green",
        },
        {
            title: "Quantity Sold",
            value: formatNumber(summary.total_product_quantity),
            icon: Package,
            color: "orange",
        },
        {
            title: "Gross Product Value",
            value: formatMoney(summary.total_gross_value),
            icon: Wallet,
            color: "blue",
        },
        {
            title: "Total Discount",
            value: formatMoney(summary.total_discount),
            icon: Receipt,
            color: "orange",
        },
        {
            title: "Tax Amount",
            value: formatMoney(summary.total_tax_amount),
            icon: FileText,
            color: "purple",
        },
        {
            title: "Item Value With Tax",
            value: formatMoney(summary.total_items_with_tax),
            icon: IndianRupee,
            color: "green",
        },
        {
            title: "Payment Receipts",
            value: formatMoney(summary.total_payment_receipts),
            icon: CreditCard,
            color: "green",
        },
        {
            title: "Advance Receipts",
            value: formatMoney(summary.total_advance_receipts),
            icon: Wallet,
            color: "blue",
        },
        {
            title: "Refund Amount",
            value: formatMoney(summary.total_refunds),
            icon: RotateCcw,
            color: "red",
        },
        {
            title: "GRV Value",
            value: formatMoney(summary.total_grv_value),
            icon: Package,
            color: "red",
        },
    ];

    return (
        <div className="cr-page">
            <style>{`
        .cr-page {
          --cr-blue: #2563eb;
          --cr-dark: #0f172a;
          --cr-muted: #64748b;
          --cr-border: #e5eaf1;
          font-family: Inter, Poppins, Arial, sans-serif;
          background: #f5f7fb;
          color: #172033;
          min-height: 100vh;
          padding: 24px;
        }

        .cr-page * { box-sizing: border-box; }

        .cr-container {
          max-width: 1600px;
          margin: 0 auto;
        }

        .cr-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 22px;
        }

        .cr-topbar h1 {
          font-size: 23px;
          font-weight: 750;
          margin: 0 0 5px;
          color: #0f172a;
        }

        .cr-topbar p {
          margin: 0;
          font-size: 13px;
          color: #64748b;
        }

        .cr-top-actions {
          display: flex;
          gap: 9px;
        }

        .cr-btn {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: .2s;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .cr-btn-primary {
          color: white;
          background: #2563eb;
        }

        .cr-btn-primary:hover { background: #1d4ed8; }

        .cr-btn-outline {
          color: #334155;
          background: white;
          border-color: #dce3ed;
        }

        .cr-btn-outline:hover { background: #f1f5f9; }

        .cr-btn:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .cr-profile {
          background: linear-gradient(120deg, #102c59, #1e4d92);
          color: white;
          padding: 26px 30px;
          border-radius: 16px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .cr-avatar {
          width: 66px;
          height: 66px;
          border-radius: 15px;
          background: rgba(255,255,255,.14);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cr-profile-info { flex: 1; min-width: 180px; }

        .cr-profile-info h2 {
          font-size: 22px;
          font-weight: 750;
          margin: 0 0 8px;
          color: white;
        }

        .cr-profile-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 12px;
          color: #dbeafe;
        }

        .cr-profile-badge {
          background: rgba(255,255,255,.15);
          padding: 7px 12px;
          border-radius: 20px;
          font-size: 12px;
        }

        .cr-filter-panel, .cr-panel {
          background: white;
          border: 1px solid #e7ecf3;
          border-radius: 14px;
          box-shadow: 0 3px 14px rgba(15,23,42,.035);
        }

        .cr-filter-panel {
          padding: 20px;
          margin-bottom: 22px;
        }

        .cr-filter-heading {
          display: flex;
          align-items: center;
          gap: 9px;
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 17px;
        }

        .cr-filter-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
          gap: 14px;
          align-items: end;
        }

        .cr-field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 7px;
        }

        .cr-field input, .cr-table-toolbar select {
          width: 100%;
          border: 1px solid #dce3ed;
          border-radius: 9px;
          background: white;
          color: #1e293b;
          padding: 11px 12px;
          font-size: 13px;
          outline: none;
        }

        .cr-field input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px #2563eb15;
        }

        .cr-filter-actions {
          display: flex;
          gap: 8px;
        }

        .cr-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 24px;
        }

        .cr-summary-card {
          background: white;
          border: 1px solid #e7ecf3;
          border-radius: 13px;
          padding: 19px;
          min-width: 0;
          box-shadow: 0 3px 12px rgba(15,23,42,.025);
        }

        .cr-summary-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
        }

        .cr-summary-icon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .cr-blue .cr-summary-icon { background: #eaf1ff; color: #2563eb; }
        .cr-green .cr-summary-icon { background: #e7f8ef; color: #15945c; }
        .cr-purple .cr-summary-icon { background: #f1eaff; color: #8052c9; }
        .cr-orange .cr-summary-icon { background: #fff3e5; color: #d78b24; }
        .cr-red .cr-summary-icon { background: #ffebee; color: #d94b5e; }

        .cr-summary-title {
          color: #64748b;
          font-size: 12px;
          margin-bottom: 7px;
        }

        .cr-summary-value {
          font-size: 22px;
          font-weight: 750;
          color: #0f172a;
          overflow-wrap: anywhere;
        }

        .cr-summary-subtitle {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 7px;
        }

        .cr-tabs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding: 6px;
          background: white;
          border: 1px solid #e7ecf3;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .cr-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 0;
          border-radius: 8px;
          padding: 11px 15px;
          background: transparent;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .cr-tab:hover { background: #f1f5f9; }

        .cr-tab.active {
          background: #eaf1ff;
          color: #2563eb;
        }

        .cr-grid-two {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 18px;
        }

        .cr-grid-wide {
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) minmax(280px, 1fr);
          gap: 18px;
          margin-bottom: 18px;
        }

        .cr-panel {
          padding: 22px;
          min-width: 0;
          margin-bottom: 18px;
        }

        .cr-grid-two .cr-panel,
        .cr-grid-wide .cr-panel { margin-bottom: 0; }

        .cr-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 22px;
        }

        .cr-panel-header h3 {
          font-size: 16px;
          font-weight: 750;
          margin: 0 0 5px;
          color: #0f172a;
        }

        .cr-panel-header p {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
        }

        .cr-chart-switch {
          display: flex;
          gap: 3px;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 9px;
        }

        .cr-chart-switch button {
          background: transparent;
          border: 0;
          border-radius: 7px;
          padding: 7px 11px;
          color: #64748b;
          font-size: 11px;
          cursor: pointer;
        }

        .cr-chart-switch button.active {
          background: white;
          color: #2563eb;
          box-shadow: 0 1px 4px #00000012;
        }

        .cr-chart-container { width: 100%; overflow-x: auto; }
        .cr-chart-container svg { width: 100%; min-width: 340px; }

        .cr-chart-legend {
          display: flex;
          gap: 20px;
          margin-top: 12px;
          color: #64748b;
          font-size: 12px;
        }

        .cr-chart-legend span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .cr-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          display: inline-block;
        }

        .cr-dot.blue { background: #2563eb; }
        .cr-dot.gray { background: #94a3b8; }

        .cr-comparison-stat {
          padding: 15px 0;
          border-bottom: 1px solid #edf1f5;
        }

        .cr-comparison-stat:last-child { border-bottom: 0; }
        .cr-comparison-stat span {
          color: #64748b;
          font-size: 12px;
          display: block;
          margin-bottom: 8px;
        }

        .cr-comparison-stat strong {
          font-size: 23px;
          color: #0f172a;
          overflow-wrap: anywhere;
        }

        .cr-bars { display: grid; gap: 20px; }
        .cr-bar-label {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 9px;
          font-size: 12px;
        }

        .cr-bar-label span {
          color: #475569;
          overflow-wrap: anywhere;
        }

        .cr-bar-label strong { color: #0f172a; }

        .cr-bar-track {
          height: 9px;
          background: #edf1f6;
          border-radius: 20px;
          overflow: hidden;
        }

        .cr-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          border-radius: 20px;
        }

        .cr-details-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .cr-detail-label {
          color: #94a3b8;
          font-size: 12px;
          margin-bottom: 7px;
        }

        .cr-detail-value {
          font-size: 13px;
          color: #1e293b;
          font-weight: 600;
          overflow-wrap: anywhere;
        }

        .cr-section-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 22px;
        }

        .cr-small-stat {
          border: 1px solid #e7ecf3;
          background: #f8fafc;
          padding: 14px;
          border-radius: 10px;
          min-width: 0;
        }

        .cr-small-stat span {
          display: block;
          font-size: 11px;
          color: #64748b;
          margin-bottom: 7px;
        }

        .cr-small-stat strong {
          font-size: 15px;
          color: #0f172a;
          overflow-wrap: anywhere;
        }

        .cr-table-toolbar {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .cr-search {
          display: flex;
          align-items: center;
          gap: 9px;
          border: 1px solid #dce3ed;
          border-radius: 9px;
          padding: 0 12px;
          max-width: 350px;
          flex: 1;
          color: #94a3b8;
        }

        .cr-search input {
          border: 0;
          outline: 0;
          padding: 11px 0;
          flex: 1;
          min-width: 0;
          background: transparent;
          font-size: 13px;
        }

        .cr-search button {
          border: 0;
          background: none;
          cursor: pointer;
          color: #94a3b8;
        }

        .cr-table-toolbar select { width: auto; }

        .cr-table-scroll { overflow-x: auto; }

        .cr-table {
          width: 100%;
          border-collapse: collapse;
          white-space: nowrap;
          font-size: 12px;
        }

        .cr-table th {
          background: #f8fafc;
          color: #64748b;
          font-weight: 700;
          text-align: left;
          padding: 14px;
          border-bottom: 1px solid #e7ecf3;
        }

        .cr-table td {
          padding: 14px;
          border-bottom: 1px solid #edf1f5;
          color: #334155;
        }

        .cr-table tbody tr:hover { background: #f8fbff; }

        .cr-status {
          background: #edf4ff;
          color: #2563eb;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .cr-table-empty {
          text-align: center;
          padding: 45px !important;
          color: #94a3b8 !important;
        }

        .cr-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          padding-top: 18px;
          color: #64748b;
          font-size: 12px;
        }

        .cr-pagination > div {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .cr-pagination button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid #dce3ed;
          border-radius: 7px;
          background: white;
          cursor: pointer;
        }

        .cr-pagination button:disabled {
          opacity: .35;
          cursor: not-allowed;
        }

        .cr-empty {
          padding: 55px 15px;
          text-align: center;
          color: #94a3b8;
          font-size: 13px;
        }

        .cr-alert {
          padding: 15px 18px;
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-radius: 10px;
          color: #be123c;
          margin-bottom: 18px;
          font-size: 13px;
        }

        .cr-loading {
          text-align: center;
          padding: 85px 15px;
          color: #64748b;
        }

        .cr-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #dbeafe;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: cr-spin .7s linear infinite;
          margin: 0 auto 14px;
        }

        @keyframes cr-spin { to { transform: rotate(360deg); } }

        @media (max-width: 1100px) {
          .cr-summary-grid { grid-template-columns: repeat(3, 1fr); }
          .cr-filter-grid { grid-template-columns: repeat(2, 1fr); }
          .cr-grid-wide { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .cr-page { padding: 14px; }
          .cr-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .cr-grid-two { grid-template-columns: 1fr; }
          .cr-details-grid { grid-template-columns: repeat(2, 1fr); }
          .cr-section-summary { grid-template-columns: repeat(2, 1fr); }
          .cr-profile { padding: 20px; }
          .cr-profile-info h2 { font-size: 19px; }
          .cr-topbar { align-items: flex-start; }
          .cr-panel { padding: 17px; }
        }

        @media (max-width: 480px) {
          .cr-topbar { flex-direction: column; }
          .cr-filter-grid { grid-template-columns: 1fr; }
          .cr-summary-card { padding: 14px; }
          .cr-summary-value { font-size: 17px; }
          .cr-details-grid { grid-template-columns: 1fr; }
          .cr-filter-actions { width: 100%; }
          .cr-filter-actions button { flex: 1; }
        }

/* Beposoft premium dashboard redesign — scoped to this page */
.cr-page { --cr-blue:#2754d7; --cr-dark:#101d36; --cr-muted:#75849c; --cr-border:#e5eaf3; background:#f4f7fc; padding:28px 30px 55px; letter-spacing:-.01em; }
.cr-container { max-width:1700px; }
.cr-topbar { margin-bottom:24px; align-items:center; }
.cr-topbar h1 { font-size:27px; font-weight:800; letter-spacing:-.035em; }
.cr-topbar p { font-size:13px; color:#8090a6; }
.cr-btn { min-height:40px; border-radius:10px; font-weight:700; transition:transform .16s,box-shadow .16s,background .16s; }
.cr-btn:hover:not(:disabled) { transform:translateY(-1px); }
.cr-btn-primary { background:#2858df; box-shadow:0 4px 12px #2858df22; }
.cr-btn-primary:hover { background:#1d47be; }
.cr-btn-outline { border-color:#e1e7f1; }
.cr-profile { position:relative; overflow:hidden; border-radius:20px; padding:28px 32px; margin-bottom:20px; background:linear-gradient(112deg,#101f3e 0%,#173a77 58%,#2459a9 100%); box-shadow:0 12px 30px #122b6022; min-height:140px; }
.cr-profile:after { content:""; position:absolute; width:290px; height:290px; right:9%; top:-185px; border:1px solid #ffffff20; border-radius:50%; box-shadow:0 0 0 52px #ffffff08,0 0 0 110px #ffffff05; pointer-events:none; }
.cr-avatar { width:72px; height:72px; border-radius:20px; background:#ffffff19; border:1px solid #ffffff25; }
.cr-profile-info h2 { font-size:24px; letter-spacing:-.035em; }
.cr-profile-meta { gap:9px; align-items:center; }
.cr-profile-meta span { background:#ffffff12; border:1px solid #ffffff12; padding:6px 10px; border-radius:7px; color:#e5efff; }
.cr-profile-badge { background:#ffffff22; border:1px solid #ffffff28; text-transform:capitalize; font-weight:700; position:relative; z-index:1; }
.cr-filter-panel,.cr-panel { border:1px solid #e6ebf4; border-radius:17px; box-shadow:0 5px 24px #152f5908; }
.cr-filter-panel { padding:22px 24px; margin-bottom:25px; }
.cr-filter-heading { font-size:15px; margin-bottom:18px; }
.cr-filter-grid { gap:15px; }
.cr-field label { font-weight:700; color:#65758e; }
.cr-field input,.cr-table-toolbar select { min-height:43px; background:#fbfcff; border-color:#e2e8f2; border-radius:10px; }
.cr-field input:focus { background:#fff; }
.cr-summary-grid { gap:15px; margin-bottom:27px; }
.cr-summary-card { position:relative; overflow:hidden; border:1px solid #e5eaf4; border-radius:17px; min-height:154px; padding:20px 21px; box-shadow:0 4px 20px #152f5908; transition:transform .18s,box-shadow .18s; }
.cr-summary-card:hover { transform:translateY(-3px); box-shadow:0 10px 28px #152f5915; }
.cr-summary-card:before { content:""; position:absolute; inset:0 auto 0 0; width:3px; background:#3569e9; opacity:.85; }
.cr-green.cr-summary-card:before { background:#10a977; }
.cr-orange.cr-summary-card:before { background:#f3a03c; }
.cr-purple.cr-summary-card:before { background:#8b5cf6; }
.cr-red.cr-summary-card:before { background:#ed6179; }
.cr-summary-top { margin-bottom:15px; }
.cr-summary-icon { width:43px; height:43px; border-radius:12px; }
.cr-summary-title { font-size:12px; font-weight:650; color:#72819a; }
.cr-summary-value { font-size:clamp(17px,1.55vw,25px); font-weight:800; letter-spacing:-.04em; color:#14213d; font-variant-numeric:tabular-nums; }
.cr-summary-subtitle { font-size:11px; }
.cr-tabs { padding:7px; border-radius:14px; gap:5px; box-shadow:0 4px 18px #152f5908; scrollbar-width:thin; }
.cr-tab { border-radius:9px; padding:12px 14px; font-weight:700; }
.cr-tab.active { background:#2858df; color:white; box-shadow:0 4px 12px #2858df28; }
.cr-tab.active:hover { background:#244fc8; }
.cr-panel { padding:24px; }
.cr-panel-header h3 { font-size:17px; font-weight:800; letter-spacing:-.025em; }
.cr-panel-header p { color:#8996a9; }
.cr-chart-container { padding:8px 0; }
.cr-chart-switch { border:1px solid #e8edf5; background:#f7f9fd; }
.cr-chart-switch button.active { color:#234fcf; font-weight:700; }
.cr-bar-track { height:10px; }
.cr-bar-fill { background:linear-gradient(90deg,#4f7dff,#2454d7); }
.cr-comparison-stat { padding:18px 0; }
.cr-comparison-stat strong { font-weight:800; }
.cr-details-grid { gap:16px; }
.cr-details-grid > div { padding:14px 16px; background:#f8faff; border:1px solid #edf1f8; border-radius:11px; }
.cr-detail-label { font-weight:650; }
.cr-section-summary { gap:12px; }
.cr-small-stat { border-radius:12px; background:#f8faff; }
.cr-small-stat strong { font-size:16px; font-weight:800; }
.cr-table-scroll { border:1px solid #e9edf5; border-radius:12px; }
.cr-table th { background:#f4f7fc; color:#62718a; font-size:11px; text-transform:uppercase; letter-spacing:.035em; }
.cr-table td { font-size:12px; padding:15px 14px; }
.cr-table tbody tr:nth-child(even) { background:#fbfcff; }
.cr-table tbody tr:hover { background:#eff5ff; }
.cr-status { font-weight:700; }
.cr-pagination button { border-radius:9px; }
.cr-loading { background:white; border-radius:17px; border:1px solid #e5eaf4; }
.cr-dashboard-heading { display:flex; align-items:center; justify-content:space-between; gap:10px; margin:0 0 15px; }
.cr-dashboard-heading h2 { font-size:17px; font-weight:800; color:#17233e; margin:0; letter-spacing:-.025em; }
.cr-dashboard-heading span { font-size:12px; color:#8a97ab; }
@media(max-width:1200px){ .cr-summary-grid{grid-template-columns:repeat(3,minmax(0,1fr));} }
@media(max-width:768px){ .cr-page{padding:15px;} .cr-profile{padding:22px;} .cr-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr));} .cr-summary-card{min-height:140px;} .cr-summary-value{font-size:19px;} .cr-filter-panel{padding:18px;} .cr-panel{padding:18px;} }
@media(max-width:480px){ .cr-summary-grid{gap:10px;} .cr-summary-card{padding:15px;min-height:145px;} .cr-summary-value{font-size:17px;} .cr-profile-meta{gap:6px;} .cr-profile-meta span{font-size:11px;} .cr-dashboard-heading{align-items:flex-start;flex-direction:column;} }

      `}</style>

            <div className="cr-container">

                {/* PAGE HEADER */}
                <div className="cr-topbar">


                    <div className="cr-top-actions">
                        <button className="cr-btn cr-btn-outline" onClick={() => navigate(-1)}>
                            <ArrowLeft size={16} /> Back
                        </button>

                        <button className="cr-btn cr-btn-outline" onClick={refreshReport}>
                            <RefreshCw size={16} /> Refresh
                        </button>
                    </div>
                </div>

                {/* CUSTOMER PROFILE */}
                <div className="cr-profile">
                    <div className="cr-avatar">
                        <UserRound size={31} />
                    </div>

                    <div className="cr-profile-info">
                        <h2>{customer.name || `Customer #${customerId}`}</h2>

                        <div className="cr-profile-meta">
                            {/* <span>ID: {customer.id || customerId}</span> */}
                            <span>{customer.phone || "No phone"}</span>
                            <span>{customer.city || "City unavailable"}</span>
                            <span>{customer.customer_type_name || "Customer"}</span>
                        </div>
                    </div>

                    <div className="cr-profile-badge">
                        {customer.customer_status || "Customer"}
                    </div>
                </div>

                {/* FILTER PANEL */}
                <div className="cr-filter-panel">
                    <div className="cr-filter-heading">
                        <Filter size={18} color="#2563eb" />
                        Report Filters
                    </div>

                    <form onSubmit={applyFilters} className="cr-filter-grid">
                        {/* <div className="cr-field">
              <label>Product ID</label>
              <input
                type="number"
                min="1"
                placeholder="All products"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              />
            </div> */}

                        <div className="cr-field">
                            <label>Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="cr-field">
                            <label>End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        <div className="cr-filter-actions">
                            <button type="submit" className="cr-btn cr-btn-primary">
                                <Filter size={15} /> Apply
                            </button>

                            <button
                                type="button"
                                className="cr-btn cr-btn-outline"
                                onClick={clearFilters}
                            >
                                Clear
                            </button>

                            {/* EXCEL EXPORT */}
                            <button
                                type="button"
                                className="cr-btn"
                                onClick={exportReportExcel}
                                disabled={!report || loading}
                                style={{
                                    background: "#16834a",
                                    color: "white",
                                }}
                            >
                                <Download size={15} />
                                Export Excel
                            </button>

                        </div>
                    </form>
                </div>

                {error && <div className="cr-alert">{error}</div>}

                {loading ? (
                    <div className="cr-loading">
                        <div className="cr-spinner" />
                        Loading customer analytics...
                    </div>
                ) : report ? (
                    <>
                        {/* SUMMARY CARDS */}
                        <div className="cr-dashboard-heading"><h2>Financial overview</h2><span>Key performance indicators for the selected period</span></div>
                        <div className="cr-summary-grid">
                            {cards.map((card, index) => (
                                <SummaryCard key={index} {...card} />
                            ))}
                        </div>

                        {/* NAVIGATION TABS */}
                        <div className="cr-dashboard-heading"><h2>Detailed analytics</h2><span>Explore transactions, trends and customer activity</span></div>
                        <div className="cr-tabs">
                            {SECTIONS.map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    className={`cr-tab ${activeTab === key ? "active" : ""}`}
                                    onClick={() => setActiveTab(key)}
                                >
                                    <Icon size={16} />
                                    {label}
                                </button>
                            ))}
                        </div>

                        {activeTab === "overview" ? (
                            <>
                                {/* SALES COMPARISON */}
                                <div className="cr-grid-wide">
                                    <LineChart
                                        title="Sales Performance"
                                        data={salesComparison}
                                        primaryKey="current_cumulative_sales"
                                        secondaryKey="previous_cumulative_sales"
                                        primaryLabel="Selected Period"
                                        secondaryLabel="Previous Period"
                                    />

                                    <div className="cr-panel">
                                        <div className="cr-panel-header">
                                            <div>
                                                <h3>Period Comparison</h3>
                                                <p>Selected vs previous period</p>
                                            </div>
                                            <TrendingUp size={20} color="#2563eb" />
                                        </div>

                                        <div className="cr-comparison-stat">
                                            <span>Selected Period Sales</span>
                                            <strong>
                                                {formatMoney(comparisonSummary.current_period_sales)}
                                            </strong>
                                        </div>

                                        <div className="cr-comparison-stat">
                                            <span>Previous Period Sales</span>
                                            <strong>
                                                {formatMoney(comparisonSummary.previous_period_sales)}
                                            </strong>
                                        </div>

                                        <div className="cr-comparison-stat">
                                            <span>Growth</span>
                                            <strong>
                                                {comparisonSummary.growth_percentage == null
                                                    ? "N/A"
                                                    : `${comparisonSummary.growth_percentage}%`}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                {/* DAILY CHARTS */}
                                <div className="cr-grid-two">
                                    <LineChart
                                        title="Daily Sales"
                                        data={salesData}
                                        primaryKey="sales"
                                        primaryLabel="Sales"
                                    />

                                    <LineChart
                                        title="Order Trends"
                                        data={salesData}
                                        primaryKey="orders"
                                        primaryLabel="Orders"
                                        currency={false}
                                    />
                                </div>

                                {/* PRODUCT AND STATUS */}
                                <div className="cr-grid-two">
                                    <HorizontalBarChart
                                        title="Top Selling Products"
                                        data={productPerformance}
                                        labelKey="product_name"
                                        valueKey="total_with_tax"
                                    />

                                    <HorizontalBarChart
                                        title="Order Status"
                                        data={orderStatus}
                                        labelKey="status"
                                        valueKey="count"
                                        currency={false}
                                    />
                                </div>

                                {/* PAYMENTS AND QUANTITY */}
                                <div className="cr-grid-two">
                                    <LineChart
                                        title="Payment Trends"
                                        data={salesData}
                                        primaryKey="payments"
                                        primaryLabel="Payments"
                                    />

                                    <LineChart
                                        title="Quantity Trends"
                                        data={salesData}
                                        primaryKey="quantity"
                                        primaryLabel="Quantity"
                                        currency={false}
                                    />
                                </div>

                                {/* CUSTOMER DETAILS */}
                                <div className="cr-panel">
                                    <div className="cr-panel-header">
                                        <div>
                                            <h3>Customer Information</h3>
                                            <p>Registered customer details</p>
                                        </div>
                                        <UserRound size={20} color="#2563eb" />
                                    </div>

                                    <div className="cr-details-grid">
                                        {[
                                            ["Customer Name", customer.name],
                                            ["Phone", customer.phone],
                                            ["Alternative Phone", customer.alt_phone],
                                            ["Email", customer.email],
                                            ["GST Number", customer.gst],
                                            ["GST Confirmation", customer.gst_confirm],
                                            ["Customer Type", customer.customer_type_name],
                                            ["Manager", customer.manager_name],
                                            ["Family", customer.family_name],
                                            ["State", customer.state_name],
                                            ["City", customer.city],
                                            ["ZIP Code", customer.zip_code],
                                            ["Created At", customer.created_at],
                                            ["Address", customer.address],
                                            ["Comment", customer.comment],
                                        ].map(([label, value]) => (
                                            <div key={label}>
                                                <div className="cr-detail-label">{label}</div>
                                                <div className="cr-detail-value">
                                                    {displayValue(value)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <TransactionTable
                                sectionKey={activeTab}
                                section={sections[activeTab]}
                                customerId={customerId}
                            />
                        )}

                        <p
                            style={{
                                fontSize: 12,
                                color: "#94a3b8",
                                marginTop: 18,
                                lineHeight: 1.7,
                            }}
                        >
                            Financial data reflects the selected API filters.
                            Product-filtered invoice totals and receipts may represent
                            full invoices containing the selected product.
                            This report is not a reconciled outstanding-balance statement.
                        </p>
                    </>
                ) : (
                    <div className="cr-empty">No customer report available.</div>
                )}
            </div>
        </div>
    );
}
