
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

                        <div
                            style={{
                                position: "relative",
                                width: "100%",
                                maxWidth: 300,
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
