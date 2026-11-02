
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    Button,
    Input,
    Spinner,
} from "reactstrap";
import * as XLSX from "xlsx-js-style";
import {
    FaArrowLeft,
    FaTrophy,
    FaCrown,
    FaMedal,
    FaAward,
    FaUsers,
    FaStar,
    FaCalendarAlt,
    FaSearch,
    FaSyncAlt,
    FaFilter,
    FaChevronDown,
    FaChevronUp,
    FaChartLine,
    FaExclamationTriangle,
    FaFileExcel,
} from "react-icons/fa";

// =====================================================
// DATE HELPERS
// =====================================================

const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const getFirstDayOfMonth = () => {
    const now = new Date();

    return getLocalDateString(
        new Date(now.getFullYear(), now.getMonth(), 1)
    );
};

const formatPoints = (value) => {
    const number = Number(value);

    return (Number.isFinite(number) ? number : 0).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    );
};

const getInitials = (name) => {
    return String(name || "?")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase();
};

// =====================================================
// RANK THEMES
// =====================================================

const getRankTheme = (rank) => {
    if (rank === 1) {
        return {
            icon: FaCrown,
            accent: "#D69E22",
            background: "#FFF7DF",
            border: "#F8D77A",
            label: "TOP PERFORMER",
        };
    }

    if (rank === 2) {
        return {
            icon: FaMedal,
            accent: "#64748B",
            background: "#F1F5F9",
            border: "#CBD5E1",
            label: "SECOND PLACE",
        };
    }

    if (rank === 3) {
        return {
            icon: FaAward,
            accent: "#C47A45",
            background: "#FFF0E4",
            border: "#FED7AA",
            label: "THIRD PLACE",
        };
    }

    return {
        icon: FaStar,
        accent: "#2878F4",
        background: "#EAF2FF",
        border: "#D5E5FF",
        label: "STAFF RANKING",
    };
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const SalesPointRankingAllPage = () => {
    const navigate = useNavigate();

    const [startDate, setStartDate] = useState(
        getFirstDayOfMonth()
    );

    const [endDate, setEndDate] = useState(
        getLocalDateString()
    );

    const [appliedDates, setAppliedDates] = useState({
        start_date: getFirstDayOfMonth(),
        end_date: getLocalDateString(),
    });

    const [rankingData, setRankingData] = useState([]);
    const [summary, setSummary] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [expandedStaff, setExpandedStaff] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const pageSize = 25;

    // Match this to the token key used in your login page.
    const token = localStorage.getItem("token");

    useEffect(() => {
        const controller = new AbortController();

        const fetchRanking = async () => {
            setLoading(true);
            setError("");

            try {
                if (!token) {
                    throw new Error(
                        "Authentication token not found. Please log in again."
                    );
                }

                const baseUrl = String(
                    import.meta.env.VITE_APP_KEY || ""
                ).replace(/\/+$/, "");

                if (!baseUrl) {
                    throw new Error(
                        "VITE_APP_KEY is not configured."
                    );
                }

                const response = await axios.get(
                    `${baseUrl}/sales/point/ranking/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        params: appliedDates,
                        signal: controller.signal,
                    }
                );

                const payload = response.data;

                if (
                    payload?.status &&
                    payload.status !== "success"
                ) {
                    throw new Error(
                        payload.message || "Failed to load ranking."
                    );
                }

                // Supports common response shapes.
                // Adjust if your backend uses a different list key.
                const list = Array.isArray(payload?.data)
                    ? payload.data
                    : Array.isArray(payload?.rankings)
                        ? payload.rankings
                        : Array.isArray(payload?.results)
                            ? payload.results
                            : Array.isArray(payload?.staff)
                                ? payload.staff
                                : Array.isArray(payload?.data?.rankings)
                                    ? payload.data.rankings
                                    : Array.isArray(payload?.data?.results)
                                        ? payload.data.results
                                        : [];

                const normalized = list.map((item, index) => ({
                    ...item,
                    staff_id:
                        item.staff_id ??
                        item.user_id ??
                        item.id ??
                        index,

                    staff_name:
                        item.staff_name ??
                        item.name ??
                        item.user_name ??
                        "Unknown Staff",

                    department:
                        item.department ??
                        item.department_name ??
                        "-",

                    family:
                        item.family ??
                        item.family_name ??
                        "-",

                    rank:
                        Number(item.rank) || index + 1,

                    total_points:
                        Number(item.total_points ?? item.points ?? 0),
                })).filter((staff) => Number.isFinite(staff.total_points) && staff.total_points > 0);

                normalized.sort((a, b) => {
                    if (a.rank !== b.rank) {
                        return a.rank - b.rank;
                    }

                    return b.total_points - a.total_points;
                });

                setRankingData(normalized);
                setSummary(payload.summary || null);
                setCurrentPage(1);
                setExpandedStaff(null);

            } catch (err) {
                if (
                    err?.code === "ERR_CANCELED" ||
                    err?.name === "CanceledError"
                ) {
                    return;
                }

                console.error("Sales ranking error:", err);

                setError(
                    err?.response?.data?.message ||
                    err.message ||
                    "Unable to fetch sales ranking."
                );

                setRankingData([]);
                setSummary(null);

            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchRanking();

        return () => controller.abort();

    }, [appliedDates, token]);


    const applyDateFilter = () => {
        if (!startDate || !endDate) {
            setError("Please select both dates.");
            return;
        }

        if (startDate > endDate) {
            setError(
                "Start date cannot be later than end date."
            );
            return;
        }

        setError("");

        setAppliedDates({
            start_date: startDate,
            end_date: endDate,
        });
    };

    const resetDateFilter = () => {
        const firstDay = getFirstDayOfMonth();
        const today = getLocalDateString();

        setStartDate(firstDay);
        setEndDate(today);

        setAppliedDates({
            start_date: firstDay,
            end_date: today,
        });

        setSearch("");
        setCurrentPage(1);
        setError("");
    };

    const filteredRanking = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return rankingData;

        return rankingData.filter((staff) => {
            return [
                staff.staff_name,
                staff.department,
                staff.family,
                String(staff.rank),
            ].some((value) =>
                String(value ?? "")
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [rankingData, search]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredRanking.length / pageSize)
    );

    const paginatedRanking = filteredRanking.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const totalStaff =
        summary?.total_staff != null
            ? Number(summary.total_staff)
            : rankingData.length;

    const totalPoints = rankingData.reduce(
        (sum, staff) => sum + staff.total_points,
        0
    );

    const topPerformer = rankingData.find(
        (staff) => staff.rank === 1
    );


    const blueGradient =
        "linear-gradient(120deg, #4BA3FA, #2878F4)";

    const panelStyle = {
        background: "#FFFFFF",
        border: "1px solid #E9EFF7",
        borderRadius: 16,
        boxShadow: "0 4px 16px rgba(15,23,42,0.035)",
    };

    const inputStyle = {
        borderRadius: 10,
        border: "1px solid #DBE5F1",
        minHeight: 40,
        fontSize: 13,
        color: "#1E293B",
    };


    const exportTeamPointsExcel = async () => {
        if (exporting || loading) return;

        setExporting(true);

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("Authentication token not found.");
            }

            const baseUrl = String(
                import.meta.env.VITE_APP_KEY || ""
            ).replace(/\/+$/, "");

            if (!baseUrl) {
                throw new Error("VITE_APP_KEY is not configured.");
            }

            const apiRoot = baseUrl.endsWith("/api")
                ? baseUrl
                : `${baseUrl}/api`;

            const response = await axios.get(
                `${apiRoot}/sales/point/team/ranking/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                    params: {
                        start_date: appliedDates.start_date,
                        end_date: appliedDates.end_date,
                    },
                    timeout: 45000,
                }
            );

            const payload =
                response.data?.results &&
                    !Array.isArray(response.data.results)
                    ? response.data.results
                    : response.data;

            if (
                payload?.status !== "success" ||
                !Array.isArray(payload?.data)
            ) {
                throw new Error(
                    payload?.message || "Invalid team ranking response."
                );
            }

            const teams = payload.data;

            if (teams.length === 0) {
                alert("No team points found for selected dates.");
                return;
            }

            const num = (value) => {
                const n = Number(value);
                return Number.isFinite(n) ? n : 0;
            };

            const objects = (value) =>
                Array.isArray(value) ? value : [];

            const members = teams.flatMap(
                (team) => objects(team.members)
            );

            // Product categories matching Flutter report.
            const categories = [
                { label: "HELMETS", boxes: true, products: [] },
                { label: "CH", boxes: true, products: [] },
                { label: "BAG", boxes: false, products: [] },
                { label: "NEBULA CL", boxes: false, products: [] },
                { label: "NEBULA PRO", boxes: false, products: [] },
            ];

            const catalogue = new Map();

            [...teams, ...members].forEach((source) => {
                objects(source.products).forEach((product) => {
                    catalogue.set(
                        String(product.product_id),
                        product
                    );
                });
            });

            catalogue.forEach((product) => {
                const name = String(
                    product.product_name || ""
                ).toUpperCase();

                const id = String(product.product_id);

                let index = -1;

                if (name.includes("HELMET")) {
                    index = 0;
                } else if (
                    id === "667" ||
                    /\bCH\s*1\b/.test(name)
                ) {
                    index = 1;
                } else if (name.includes("BAG")) {
                    index = 2;
                } else if (
                    id === "902" ||
                    name.includes("NEBULA CL")
                ) {
                    index = 3;
                } else if (
                    id === "940" ||
                    name.includes("NEBULA PRO")
                ) {
                    index = 4;
                }

                if (index >= 0) {
                    categories[index].products.push(product);
                } else {
                    categories.push({
                        label: String(
                            product.product_name || "PRODUCT"
                        ),
                        boxes: false,
                        products: [product],
                    });
                }
            });

            const headers = [
                "TEAM",
                "TEAM POINTS",
                "BDO NAME",
                "BDO POINTS",
                "BILL",
                "1 BILL 1 POINT",
            ];

            const widths = [25, 18, 28, 18, 14, 21];

            const pointColumns = new Set([3, 5]);
            const quantityColumns = new Set([4]);

            categories.forEach((category) => {
                headers.push(
                    category.label === "CH"
                        ? "CH PAIRS"
                        : `${category.label} PCS`
                );

                quantityColumns.add(headers.length - 1);
                widths.push(19);

                if (category.boxes) {
                    headers.push(
                        category.label === "CH"
                            ? "CH1 BOX"
                            : "BOX"
                    );
                    widths.push(15);
                }

                const rules = [
                    ...new Set(
                        category.products.map((product) =>
                            `${num(product.required_quantity).toFixed(0)} PC ` +
                            `(${num(product.point_per_block).toFixed(2)} POINTS)`
                        )
                    ),
                ];

                headers.push(
                    rules.length === 1
                        ? rules[0]
                        : `${category.label} POINTS`
                );

                pointColumns.add(headers.length - 1);
                widths.push(23);
            });

            const extraFields = [
                ["M DEALER", "md_count"],
                ["MD POINTS", "md_points"],
                ["S DEALER", "sd_count"],
                ["SD POINTS", "sd_points"],
                ["NEW LEADS", "new_leads"],
                ["LEAD POINTS", "new_lead_points"],
                ["NEW CUSTOMERS", "new_customers"],
                ["CUSTOMER POINTS", "new_customer_points"],
                ["CONVERSIONS", "new_conversions"],
                ["CONVERSION POINTS", "new_conversion_points"],
            ];

            extraFields.forEach(([label]) => {
                headers.push(label);
                widths.push(19);

                if (label.endsWith("POINTS")) {
                    pointColumns.add(headers.length - 1);
                }
            });

            const columnCount = headers.length;

            const rows = [];
            const merges = [];

            const backgrounds = [];
            const foregrounds = [];

            const RED = "FF0000";
            const WHITE = "FFFFFF";
            const BLACK = "000000";
            const PEACH = "FCE4D6";
            const YELLOW = "FFFF00";
            const GREEN = "C6E0B4";
            const LIGHT_GREEN = "E2EFDA";

            const addRow = (values, type = "data") => {
                const rowIndex = rows.length;

                const row = Array.from(
                    { length: columnCount },
                    (_, i) => values[i] ?? ""
                );

                rows.push(row);

                const bg = [];
                const fg = [];

                for (let c = 0; c < columnCount; c++) {
                    if (type === "header") {
                        bg.push(RED);
                        fg.push(WHITE);
                    } else if (type === "total") {
                        bg.push(c < 3 ? LIGHT_GREEN : RED);
                        fg.push(c < 3 ? BLACK : WHITE);
                    } else if (type === "blank") {
                        bg.push(WHITE);
                        fg.push(BLACK);
                    } else {
                        let color = WHITE;

                        if (c === 1 || c === 3) {
                            color = YELLOW;
                        } else if (
                            c === 0 ||
                            c === 2 ||
                            pointColumns.has(c)
                        ) {
                            color = PEACH;
                        } else if (
                            quantityColumns.has(c) ||
                            (
                                c >= columnCount - 10 &&
                                !pointColumns.has(c)
                            )
                        ) {
                            color = GREEN;
                        }

                        bg.push(color);
                        fg.push(
                            pointColumns.has(c) && c !== 5
                                ? RED
                                : BLACK
                        );
                    }
                }

                backgrounds.push(bg);
                foregrounds.push(fg);

                return rowIndex;
            };

            addRow(headers, "header");

            const totals = Array(columnCount).fill(0);

            const getMemberValues = (member) => {
                const values = [
                    "",
                    "",
                    member.staff_name || "Unnamed staff",
                    num(member.total_points),
                    num(member.invoice_count),
                    num(member.invoice_points),
                ];

                const products = objects(member.products);

                categories.forEach((category) => {
                    const ids = new Set(
                        category.products.map((product) =>
                            String(product.product_id)
                        )
                    );

                    const matches = products.filter((product) =>
                        ids.has(String(product.product_id))
                    );

                    let quantity = 0;
                    let boxes = 0;
                    let points = 0;

                    matches.forEach((product) => {
                        const sold = num(product.sold_quantity);
                        const required = num(product.required_quantity);

                        quantity += sold;

                        if (required > 0) {
                            boxes += sold / required;
                        }

                        points += num(product.earned_points);
                    });

                    values.push(quantity);

                    if (category.boxes) {
                        values.push(boxes);
                    }

                    values.push(points);
                });

                extraFields.forEach(([, key]) => {
                    values.push(num(member[key]));
                });

                return values;
            };

            // Team-wise data.
            teams.forEach((team) => {
                const teamMembers = objects(team.members);
                const firstRow = rows.length;

                if (teamMembers.length === 0) {
                    const values = Array(columnCount).fill("");

                    values[0] = team.team_name || "Team";
                    values[1] = num(team.total_points);
                    values[2] = "No eligible members";

                    addRow(values);
                }

                teamMembers.forEach((member, index) => {
                    const values = getMemberValues(member);

                    if (index === 0) {
                        values[0] = team.team_name || "Team";
                        values[1] = num(team.total_points);
                    }

                    for (let c = 3; c < columnCount; c++) {
                        totals[c] += num(values[c]);
                    }

                    addRow(values);
                });

                const lastRow = rows.length - 1;

                if (teamMembers.length > 1) {
                    merges.push({
                        s: { r: firstRow, c: 0 },
                        e: { r: lastRow, c: 0 },
                    });

                    merges.push({
                        s: { r: firstRow, c: 1 },
                        e: { r: lastRow, c: 1 },
                    });
                }
            });

            const teamPoints = teams.reduce(
                (sum, team) => sum + num(team.total_points),
                0
            );

            // Grand total.
            const grandTotal = Array(columnCount).fill("");

            grandTotal[0] = "TOTAL";
            grandTotal[1] = teamPoints;

            for (let c = 3; c < columnCount; c++) {
                grandTotal[c] = totals[c];
            }

            addRow(grandTotal, "total");

            // Spacer.
            addRow([], "blank");

            // Quantity and points summary.
            const summaryHeader = Array(columnCount).fill("");

            summaryHeader[2] = "TOTAL";
            summaryHeader[3] = "POINTS";

            quantityColumns.forEach((column) => {
                summaryHeader[column] = headers[column];
            });

            addRow(summaryHeader, "header");

            const summaryValues = Array(columnCount).fill("");

            summaryValues[3] = teamPoints;

            quantityColumns.forEach((column) => {
                summaryValues[column] = totals[column];
            });

            const summaryIndex = addRow(summaryValues, "blank");

            for (let c = 0; c < columnCount; c++) {
                if (c === 3 || quantityColumns.has(c)) {
                    backgrounds[summaryIndex][c] = YELLOW;
                }
            }

            // Spacer.
            addRow([], "blank");

            // Staff ranking section.
            const rankingHeader = Array(columnCount).fill("");

            rankingHeader[2] = "BDO NAME";
            rankingHeader[3] = "BDO POINTS";

            addRow(rankingHeader, "header");

            const rankedMembers = [...members].sort((a, b) => {
                const difference =
                    num(b.total_points) - num(a.total_points);

                if (difference !== 0) {
                    return difference;
                }

                return String(a.staff_name || "").localeCompare(
                    String(b.staff_name || "")
                );
            });

            rankedMembers.forEach((member) => {
                const values = Array(columnCount).fill("");

                values[2] = member.staff_name || "Unnamed staff";
                values[3] = num(member.total_points);

                const index = addRow(values, "blank");

                backgrounds[index][2] = PEACH;
                backgrounds[index][3] = YELLOW;
                foregrounds[index][3] = RED;
            });

            const rankingTotal = Array(columnCount).fill("");

            rankingTotal[2] = "TOTAL";
            rankingTotal[3] = totals[3];

            const rankingTotalIndex = addRow(
                rankingTotal,
                "blank"
            );

            backgrounds[rankingTotalIndex][2] = LIGHT_GREEN;
            backgrounds[rankingTotalIndex][3] = RED;
            foregrounds[rankingTotalIndex][3] = WHITE;

            // Create worksheet.
            const worksheet = XLSX.utils.aoa_to_sheet(rows);

            worksheet["!cols"] = widths.map((width) => ({
                wch: width,
            }));

            worksheet["!merges"] = merges;

            worksheet["!rows"] = rows.map((_, index) => ({
                hpt:
                    index === 0 ||
                        (
                            rows[index][2] === "TOTAL" &&
                            rows[index][3] === "POINTS"
                        ) ||
                        (
                            rows[index][2] === "BDO NAME" &&
                            rows[index][3] === "BDO POINTS"
                        )
                        ? 48
                        : 26,
            }));

            // Apply Excel styles.
            rows.forEach((row, r) => {
                row.forEach((value, c) => {
                    const address = XLSX.utils.encode_cell({
                        r,
                        c,
                    });

                    const cell = worksheet[address];

                    if (!cell) return;

                    cell.s = {
                        font: {
                            name: "Arial",
                            sz: 10,
                            bold: true,
                            color: {
                                rgb: foregrounds[r][c],
                            },
                        },

                        fill: {
                            patternType: "solid",
                            fgColor: {
                                rgb: backgrounds[r][c],
                            },
                        },

                        alignment: {
                            horizontal:
                                c === 0 || c === 2
                                    ? "left"
                                    : "center",
                            vertical: "center",
                            wrapText: true,
                        },

                        border: {
                            top: {
                                style: "thin",
                                color: { rgb: "333333" },
                            },
                            bottom: {
                                style: "thin",
                                color: { rgb: "333333" },
                            },
                            left: {
                                style: "thin",
                                color: { rgb: "333333" },
                            },
                            right: {
                                style: "thin",
                                color: { rgb: "333333" },
                            },
                        },
                    };

                    if (typeof value === "number") {
                        cell.z = "#,##0.00";
                    }
                });
            });

            // Style empty cells too, preserving column positions.
            rows.forEach((row, r) => {
                for (let c = 0; c < columnCount; c++) {
                    const address = XLSX.utils.encode_cell({
                        r,
                        c,
                    });

                    if (!worksheet[address]) {
                        worksheet[address] = {
                            t: "s",
                            v: "",
                            s: {
                                fill: {
                                    patternType: "solid",
                                    fgColor: {
                                        rgb: backgrounds[r][c],
                                    },
                                },
                                border: {
                                    top: { style: "thin" },
                                    bottom: { style: "thin" },
                                    left: { style: "thin" },
                                    right: { style: "thin" },
                                },
                            },
                        };
                    }
                }
            });

            // Ensure worksheet range includes every column.
            worksheet["!ref"] = XLSX.utils.encode_range({
                s: { r: 0, c: 0 },
                e: {
                    r: rows.length - 1,
                    c: columnCount - 1,
                },
            });

            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "POINTS"
            );

            const filename =
                `Team_Points_${appliedDates.start_date}_` +
                `${appliedDates.end_date}.xlsx`;

            XLSX.writeFile(workbook, filename, {
                bookType: "xlsx",
                cellStyles: true,
            });

        } catch (error) {
            console.error("Excel export failed:", error);

            alert(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to export team points."
            );
        } finally {
            setExporting(false);
        }
    };


    return (
        <Container
            fluid
            style={{
                padding: "24px",
                background: "#F7F9FD",
                minHeight: "100vh",
            }}
        >
            {/* PAGE HEADER */}

            <div
                className="d-flex justify-content-between align-items-center flex-wrap"
                style={{
                    gap: 15,
                    marginBottom: 22,
                }}
            >
                <div
                    className="d-flex align-items-center"
                    style={{ gap: 12 }}
                >
                    <Button
                        onClick={() => navigate(-1)}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 11,
                            background: "#FFFFFF",
                            color: "#2878F4",
                            border: "1px solid #E2E8F0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <FaArrowLeft />
                    </Button>

                    <div>
                        <h4
                            style={{
                                fontSize: 22,
                                fontWeight: 800,
                                color: "#102A56",
                                marginBottom: 4,
                            }}
                        >
                            Sales Point Ranking
                        </h4>

                        <div
                            style={{
                                color: "#8492A6",
                                fontSize: 12,
                            }}
                        >
                            Complete staff leaderboard and point performance
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        background: "#EAF2FF",
                        color: "#2878F4",
                        padding: "9px 14px",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                    }}
                >
                    <FaCalendarAlt style={{ marginRight: 7 }} />
                    {appliedDates.start_date}
                    {" to "}
                    {appliedDates.end_date}
                </div>
            </div>

            {/* BLUE SUMMARY SECTION */}

            <div
                style={{
                    background: blueGradient,
                    borderRadius: 18,
                    padding: 22,
                    marginBottom: 20,
                    boxShadow:
                        "0 5px 18px rgba(40,120,244,0.12)",
                }}
            >
                <div
                    className="d-flex align-items-center"
                    style={{
                        gap: 11,
                        marginBottom: 18,
                    }}
                >
                    <div
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: "rgba(255,255,255,0.18)",
                            color: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 19,
                        }}
                    >
                        <FaTrophy />
                    </div>

                    <div>
                        <div
                            style={{
                                color: "#FFFFFF",
                                fontSize: 17,
                                fontWeight: 800,
                            }}
                        >
                            Ranking Overview
                        </div>

                        <div
                            style={{
                                color: "#E4F0FF",
                                fontSize: 11,
                                marginTop: 3,
                            }}
                        >
                            Performance summary for selected dates
                        </div>
                    </div>
                </div>

                <Row className="g-3">
                    {[
                        {
                            title: "Total Points",
                            value: formatPoints(totalPoints),
                            icon: FaStar,
                        },
                        {
                            title: "Top Performer",
                            value:
                                topPerformer?.staff_name || "-",
                            icon: FaCrown,
                        },
                    ].map((item) => {
                        const Icon = item.icon;

                        return (
                            <Col
                                lg={6}
                                md={6}
                                xs={12}
                                key={item.title}
                            >
                                <div
                                    style={{
                                        background:
                                            "rgba(255,255,255,0.15)",
                                        border:
                                            "1px solid rgba(255,255,255,0.22)",
                                        borderRadius: 13,
                                        padding: 17,
                                        minHeight: 104,
                                    }}
                                >
                                    <div
                                        className="d-flex align-items-center"
                                        style={{
                                            gap: 8,
                                            color: "#E4F0FF",
                                            fontSize: 12,
                                            fontWeight: 600,
                                            marginBottom: 12,
                                        }}
                                    >
                                        <Icon size={13} />
                                        {item.title}
                                    </div>

                                    <div
                                        style={{
                                            color: "#FFFFFF",
                                            fontSize:
                                                item.title === "Top Performer"
                                                    ? 17
                                                    : 27,
                                            fontWeight: 800,
                                            overflowWrap: "anywhere",
                                        }}
                                    >
                                        {loading ? "..." : item.value}
                                    </div>
                                </div>
                            </Col>
                        );
                    })}
                </Row>
            </div>

            {/* DATE FILTER */}

            <Card
                className="border-0 mb-4"
                style={panelStyle}
            >
                <CardBody style={{ padding: 20 }}>
                    <div
                        className="d-flex align-items-center"
                        style={{
                            gap: 8,
                            marginBottom: 17,
                            color: "#153A73",
                            fontSize: 15,
                            fontWeight: 800,
                        }}
                    >
                        <FaFilter color="#2878F4" />
                        Filter Rankings
                    </div>

                    <Row className="g-3 align-items-end">
                        <Col lg={4} md={6} xs={12}>
                            <label
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#475569",
                                    marginBottom: 7,
                                    display: "block",
                                }}
                            >
                                From Date
                            </label>

                            <Input
                                type="date"
                                value={startDate}
                                max={endDate || undefined}
                                onChange={(e) =>
                                    setStartDate(e.target.value)
                                }
                                style={inputStyle}
                            />
                        </Col>

                        <Col lg={4} md={6} xs={12}>
                            <label
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#475569",
                                    marginBottom: 7,
                                    display: "block",
                                }}
                            >
                                To Date
                            </label>

                            <Input
                                type="date"
                                value={endDate}
                                min={startDate || undefined}
                                onChange={(e) =>
                                    setEndDate(e.target.value)
                                }
                                style={inputStyle}
                            />
                        </Col>

                        <Col lg={4} md={12} xs={12}>
                            <div
                                className="d-flex"
                                style={{ gap: 9 }}
                            >
                                <Button
                                    onClick={applyDateFilter}
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        background: blueGradient,
                                        border: "none",
                                        borderRadius: 10,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        minHeight: 40,
                                    }}
                                >
                                    <FaSearch
                                        style={{ marginRight: 7 }}
                                    />
                                    Apply Filter
                                </Button>

                                <Button
                                    onClick={resetDateFilter}
                                    disabled={loading}
                                    style={{
                                        background: "#EDF3FC",
                                        color: "#2878F4",
                                        border: "none",
                                        borderRadius: 10,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        minHeight: 40,
                                        padding: "0 15px",
                                    }}
                                >
                                    <FaSyncAlt />
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            {/* RANKING LIST */}

            <Card
                className="border-0"
                style={panelStyle}
            >
                <CardBody style={{ padding: 20 }}>

                    {/* LIST HEADER */}


                    <div
                        className="d-flex justify-content-between align-items-center flex-wrap"
                        style={{
                            gap: 15,
                            marginBottom: 20,
                        }}
                    >
                        {/* LEFT SIDE - TITLE */}
                        <div>
                            <h5
                                style={{
                                    fontSize: 17,
                                    fontWeight: 800,
                                    color: "#153A73",
                                    marginBottom: 5,
                                }}
                            >
                                All Staff Rankings
                            </h5>

                            <div
                                style={{
                                    color: "#94A3B8",
                                    fontSize: 12,
                                }}
                            >
                                {filteredRanking.length} staff displayed
                            </div>
                        </div>

                        {/* RIGHT SIDE - SEARCH AND EXCEL EXPORT */}
                        <div
                            className="d-flex align-items-center flex-wrap"
                            style={{
                                gap: 10,
                            }}
                        >
                            {/* SEARCH FIELD */}
                            <div
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    maxWidth: 300,
                                    minWidth: 220,
                                    flex: "1 1 220px",
                                }}
                            >
                                <FaSearch
                                    style={{
                                        position: "absolute",
                                        top: 13,
                                        left: 13,
                                        color: "#94A3B8",
                                        fontSize: 13,
                                    }}
                                />

                                <Input
                                    type="text"
                                    placeholder="Search staff, department..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    style={{
                                        ...inputStyle,
                                        paddingLeft: 36,
                                    }}
                                />
                            </div>

                            {/* EXPORT EXCEL BUTTON */}
                            <Button
                                onClick={exportTeamPointsExcel}
                                disabled={loading || exporting}
                                style={{
                                    background: "#16834A",
                                    color: "#FFFFFF",
                                    border: "none",
                                    borderRadius: 10,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    minHeight: 40,
                                    padding: "0 16px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {exporting ? (
                                    <>
                                        <Spinner size="sm" />
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <FaFileExcel size={16} />
                                        Export Excel
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>


                    {/* ERROR */}

                    {error && (
                        <div
                            style={{
                                background: "#FEF2F2",
                                color: "#B91C1C",
                                border: "1px solid #FECACA",
                                borderRadius: 10,
                                padding: 14,
                                marginBottom: 18,
                                fontSize: 13,
                            }}
                        >
                            <FaExclamationTriangle
                                style={{ marginRight: 8 }}
                            />
                            {error}
                        </div>
                    )}

                    {/* LOADING */}

                    {loading ? (
                        <div
                            className="d-flex flex-column align-items-center justify-content-center"
                            style={{
                                minHeight: 230,
                                gap: 12,
                            }}
                        >
                            <Spinner color="primary" />

                            <span
                                style={{
                                    color: "#64748B",
                                    fontSize: 13,
                                }}
                            >
                                Loading staff rankings...
                            </span>
                        </div>
                    ) : filteredRanking.length === 0 ? (
                        <div
                            className="text-center"
                            style={{
                                padding: "55px 15px",
                                color: "#94A3B8",
                            }}
                        >
                            <FaUsers
                                size={35}
                                style={{ marginBottom: 13 }}
                            />

                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                }}
                            >
                                No ranking data found
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* STAFF ROWS */}

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 11,
                                }}
                            >
                                {paginatedRanking.map((staff, index) => {
                                    const rank = Number(staff.rank);
                                    const theme = getRankTheme(rank);
                                    const RankIcon = theme.icon;

                                    const rowKey =
                                        staff.staff_id ?? index;

                                    const isExpanded =
                                        expandedStaff === rowKey;

                                    const breakdown =
                                        staff.point_breakdown ??
                                        staff.breakdown ??
                                        staff.points_breakdown ??
                                        null;

                                    const products =
                                        staff.products ??
                                        staff.product_details ??
                                        [];

                                    const hasDetails =
                                        (breakdown &&
                                            typeof breakdown === "object" &&
                                            Object.keys(breakdown).length > 0) ||
                                        (Array.isArray(products) &&
                                            products.length > 0);

                                    return (
                                        <div
                                            key={`${rowKey}-${index}`}
                                            style={{
                                                border:
                                                    "1px solid #E5EDF7",
                                                borderRadius: 13,
                                                background: "#FFFFFF",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                className="d-flex align-items-center flex-wrap"
                                                style={{
                                                    padding: "15px 17px",
                                                    gap: 14,
                                                }}
                                            >
                                                {/* RANK */}

                                                <div
                                                    style={{
                                                        minWidth: 70,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 8,
                                                        color: theme.accent,
                                                        fontWeight: 800,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: 10,
                                                            background:
                                                                theme.background,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <RankIcon size={16} />
                                                    </div>

                                                    <span
                                                        style={{
                                                            fontSize: 13,
                                                        }}
                                                    >
                                                        #{rank}
                                                    </span>
                                                </div>

                                                {/* STAFF AVATAR */}

                                                <div
                                                    style={{
                                                        width: 44,
                                                        height: 44,
                                                        borderRadius: 12,
                                                        background: "#EAF2FF",
                                                        color: "#2878F4",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: 14,
                                                        fontWeight: 800,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {getInitials(
                                                        staff.staff_name
                                                    )}
                                                </div>

                                                {/* STAFF INFORMATION */}

                                                <div
                                                    style={{
                                                        flex: 1,
                                                        minWidth: 150,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            color: "#153A73",
                                                            fontSize: 13,
                                                            fontWeight: 800,
                                                            overflowWrap: "anywhere",
                                                        }}
                                                    >
                                                        {staff.staff_name}
                                                    </div>

                                                    <div
                                                        style={{
                                                            color: "#64748B",
                                                            fontSize: 11,
                                                            marginTop: 5,
                                                            textTransform: "capitalize",
                                                        }}
                                                    >
                                                        {staff.department}
                                                        {" · "}
                                                        {staff.family}
                                                    </div>
                                                </div>

                                                {/* POINTS */}

                                                <div
                                                    style={{
                                                        textAlign: "right",
                                                        minWidth: 105,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            color: "#153A73",
                                                            fontSize: 19,
                                                            fontWeight: 900,
                                                        }}
                                                    >
                                                        {formatPoints(
                                                            staff.total_points
                                                        )}
                                                    </div>

                                                    <div
                                                        style={{
                                                            color: "#94A3B8",
                                                            fontSize: 10,
                                                            fontWeight: 700,
                                                            marginTop: 3,
                                                        }}
                                                    >
                                                        TOTAL POINTS
                                                    </div>
                                                </div>

                                                {/* DETAILS BUTTON */}

                                                {hasDetails && (
                                                    <Button
                                                        onClick={() =>
                                                            setExpandedStaff(
                                                                isExpanded
                                                                    ? null
                                                                    : rowKey
                                                            )
                                                        }
                                                        style={{
                                                            background:
                                                                "#EAF2FF",
                                                            color: "#2878F4",
                                                            border: "none",
                                                            borderRadius: 9,
                                                            width: 34,
                                                            height: 34,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        {isExpanded ? (
                                                            <FaChevronUp />
                                                        ) : (
                                                            <FaChevronDown />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>

                                            {/* EXPANDED DETAILS */}

                                            {isExpanded && hasDetails && (
                                                <div
                                                    style={{
                                                        background: "#F8FAFD",
                                                        borderTop:
                                                            "1px solid #E5EDF7",
                                                        padding: 17,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            color: "#153A73",
                                                            fontSize: 13,
                                                            fontWeight: 800,
                                                            marginBottom: 12,
                                                        }}
                                                    >
                                                        <FaChartLine
                                                            style={{
                                                                color: "#2878F4",
                                                                marginRight: 8,
                                                            }}
                                                        />
                                                        Point Details
                                                    </div>

                                                    {breakdown &&
                                                        typeof breakdown ===
                                                        "object" && (
                                                            <div
                                                                style={{
                                                                    display: "grid",
                                                                    gridTemplateColumns:
                                                                        "repeat(auto-fit, minmax(150px, 1fr))",
                                                                    gap: 10,
                                                                    marginBottom: 12,
                                                                }}
                                                            >
                                                                {Object.entries(
                                                                    breakdown
                                                                ).map(
                                                                    ([
                                                                        key,
                                                                        value,
                                                                    ]) => (
                                                                        <div
                                                                            key={key}
                                                                            style={{
                                                                                background:
                                                                                    "#FFFFFF",
                                                                                border:
                                                                                    "1px solid #E5EDF7",
                                                                                borderRadius: 10,
                                                                                padding: 12,
                                                                            }}
                                                                        >
                                                                            <div
                                                                                style={{
                                                                                    color: "#64748B",
                                                                                    fontSize: 11,
                                                                                    marginBottom: 6,
                                                                                    textTransform:
                                                                                        "capitalize",
                                                                                }}
                                                                            >
                                                                                {key.replace(
                                                                                    /_/g,
                                                                                    " "
                                                                                )}
                                                                            </div>

                                                                            <div
                                                                                style={{
                                                                                    color: "#153A73",
                                                                                    fontWeight: 800,
                                                                                    fontSize: 14,
                                                                                    overflowWrap:
                                                                                        "anywhere",
                                                                                }}
                                                                            >
                                                                                {value !== null &&
                                                                                    typeof value ===
                                                                                    "object"
                                                                                    ? JSON.stringify(
                                                                                        value
                                                                                    )
                                                                                    : String(
                                                                                        value ?? "-"
                                                                                    )}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        )}

                                                    {Array.isArray(products) && products.length > 0 && (
                                                        <div style={{ overflowX: "auto", width: "100%", WebkitOverflowScrolling: "touch" }}>
                                                            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 1100, background: "#FFFFFF", border: "1px solid #E5EDF7", borderRadius: 10, fontSize: 12 }}>
                                                                <thead>
                                                                    <tr style={{ background: "#EAF2FF", color: "#153A73" }}>
                                                                        {[
                                                                            "Product Name", "Quantity",
                                                                            // "Required Qty",
                                                                            // "Completed Blocks", "Remaining Qty", "Points / Block",
                                                                            // "Remaining Points", 
                                                                            "Points"
                                                                        ].map((heading) => (
                                                                            <th key={heading} style={{ padding: "13px 12px", textAlign: "left", whiteSpace: "nowrap", borderBottom: "1px solid #D5E5FF", fontWeight: 800 }}>
                                                                                {heading}
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {products.map((product, productIndex) => (
                                                                        <tr key={product?.product_id ?? productIndex} style={{ background: productIndex % 2 === 0 ? "#FFFFFF" : "#F8FAFD" }}>
                                                                            {[
                                                                                product?.product_name,
                                                                                product?.sold_quantity,
                                                                                // product?.required_quantity,
                                                                                // product?.completed_blocks,
                                                                                // product?.remaining_quantity,
                                                                                // product?.point_per_block ?? product?.points_per_block,
                                                                                // product?.remaining_points,
                                                                                product?.earned_points
                                                                            ].map((value, columnIndex) => (
                                                                                <td key={columnIndex} style={{ padding: "12px", borderBottom: "1px solid #E5EDF7", color: columnIndex === 8 ? "#2878F4" : "#334155", fontWeight: columnIndex === 1 || columnIndex === 8 ? 700 : 500, whiteSpace: columnIndex === 1 ? "normal" : "nowrap", minWidth: columnIndex === 1 ? 190 : undefined }}>
                                                                                    {value == null ? "-" : typeof value === "object" ? JSON.stringify(value) : String(value)}
                                                                                </td>
                                                                            ))}
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* PAGINATION */}

                            {totalPages > 1 && (
                                <div
                                    className="d-flex justify-content-between align-items-center flex-wrap"
                                    style={{
                                        gap: 12,
                                        marginTop: 22,
                                    }}
                                >
                                    <div
                                        style={{
                                            color: "#64748B",
                                            fontSize: 12,
                                        }}
                                    >
                                        Showing{" "}
                                        {(currentPage - 1) * pageSize + 1}
                                        {" - "}
                                        {Math.min(
                                            currentPage * pageSize,
                                            filteredRanking.length
                                        )}
                                        {" of "}
                                        {filteredRanking.length}
                                    </div>

                                    <div
                                        className="d-flex align-items-center"
                                        style={{ gap: 9 }}
                                    >
                                        <Button
                                            disabled={currentPage === 1}
                                            onClick={() =>
                                                setCurrentPage(
                                                    (page) => page - 1
                                                )
                                            }
                                            style={{
                                                background: "#EAF2FF",
                                                color: "#2878F4",
                                                border: "none",
                                                borderRadius: 9,
                                                fontSize: 12,
                                                fontWeight: 700,
                                            }}
                                        >
                                            Previous
                                        </Button>

                                        <span
                                            style={{
                                                color: "#475569",
                                                fontSize: 12,
                                                fontWeight: 700,
                                            }}
                                        >
                                            {currentPage} / {totalPages}
                                        </span>

                                        <Button
                                            disabled={
                                                currentPage === totalPages
                                            }
                                            onClick={() =>
                                                setCurrentPage(
                                                    (page) => page + 1
                                                )
                                            }
                                            style={{
                                                background: "#2878F4",
                                                color: "#FFFFFF",
                                                border: "none",
                                                borderRadius: 9,
                                                fontSize: 12,
                                                fontWeight: 700,
                                            }}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardBody>
            </Card>
        </Container>
    );
};

export default SalesPointRankingAllPage;
