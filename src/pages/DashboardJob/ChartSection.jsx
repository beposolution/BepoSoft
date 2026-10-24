import React, { useState, useEffect } from 'react';
import { Card, CardBody, Col, Row } from 'reactstrap';
import ReactApexChart from "react-apexcharts"
import axios from 'axios';
import { JobWidgetCharts } from './JobCharts';
// import { cryptoReports } from '../../common/data'
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";



const AttendanceCalendar = ({ token }) => {
    const [month, setMonth] = useState(
        () => new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
        )
    );

    const [records, setRecords] = useState([]);
    const [loadingCalendar, setLoadingCalendar] = useState(false);
    const [calendarError, setCalendarError] = useState("");

    const dateKey = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 0);

    const todayKey = dateKey(new Date());

    // Fetch attendance records for the selected month
    useEffect(() => {
        if (!token) return;

        const controller = new AbortController();

        const fetchMonthlyAttendance = async () => {
            setLoadingCalendar(true);
            setCalendarError("");

            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}staff/attendance/my/details/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        params: {
                            start_date: dateKey(
                                new Date(year, monthIndex, 1)
                            ),
                            end_date: dateKey(
                                new Date(year, monthIndex + 1, 0)
                            ),
                        },
                        signal: controller.signal,
                    }
                );

                const payload = response.data?.data;

                const attendanceRecords = Array.isArray(payload)
                    ? payload
                    : payload?.results || [];

                setRecords(attendanceRecords);

            } catch (error) {
                if (error.code !== "ERR_CANCELED") {
                    setRecords([]);
                    setCalendarError("Unable to load attendance");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingCalendar(false);
                }
            }
        };

        fetchMonthlyAttendance();

        return () => controller.abort();

    }, [token, year, monthIndex]);

    // Convert attendance API records into date-wise data
    const attendanceByDate = new Map();

    records.forEach((item) => {
        const date = String(
            item.attendance_date || item.date || ""
        ).slice(0, 10);

        if (date) {
            attendanceByDate.set(
                date,
                String(item.status || "").toLowerCase()
            );
        }
    });

    // Create Monday-first calendar
    const leadingEmptyDays = (monthStart.getDay() + 6) % 7;

    const calendarDays = [
        ...Array.from(
            { length: leadingEmptyDays },
            () => null
        ),
        ...Array.from(
            { length: monthEnd.getDate() },
            (_, index) => index + 1
        ),
    ];

    // Calendar navigation
    const previousMonth = () => {
        setMonth(new Date(year, monthIndex - 1, 1));
    };

    const nextMonth = () => {
        setMonth(new Date(year, monthIndex + 1, 1));
    };

    return (
        <Card
            className="border-0 shadow-sm h-100"
            style={{
                borderRadius: "18px",
                background:
                    "linear-gradient(135deg, #56b0ff, #2873f7)",
                color: "#ffffff",
            }}
        >
            <CardBody style={{ padding: "14px" }}>

                {/* Calendar Header */}
                <div
                    className="d-flex justify-content-between align-items-center mb-2"
                    style={{ gap: "8px" }}
                >
                    <h5
                        className="fw-bold mb-0"
                        style={{
                            color: "#ffffff",
                            fontSize: "18px",
                        }}
                    >
                        Attendance
                    </h5>

                    <div
                        className="d-flex align-items-center"
                        style={{ gap: "4px" }}
                    >
                        <button
                            type="button"
                            className="btn btn-sm btn-light"
                            onClick={previousMonth}
                            aria-label="Previous month"
                        >
                            ‹
                        </button>

                        <span
                            className="fw-semibold text-center"
                            style={{
                                minWidth: "74px",
                                fontSize: "12px",
                            }}
                        >
                            {month.toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                            })}
                        </span>

                        <button
                            type="button"
                            className="btn btn-sm btn-light"
                            onClick={nextMonth}
                            aria-label="Next month"
                        >
                            ›
                        </button>
                    </div>
                </div>

                <p
                    className="mb-2"
                    style={{
                        fontSize: "11px",
                        color: "#ffffff",
                    }}
                >
                    Monthly Attendance Tracking
                </p>

                {/* Calendar White Container */}
                <div
                    style={{
                        background: "#ffffff",
                        color: "#111827",
                        borderRadius: "14px",
                        padding: "11px 8px",
                    }}
                >
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(7, minmax(0, 1fr))",
                            gap: "3px",
                        }}
                    >
                        {/* Weekday headings */}
                        {[
                            "Mon",
                            "Tue",
                            "Wed",
                            "Thu",
                            "Fri",
                            "Sat",
                            "Sun",
                        ].map((day) => (
                            <div
                                key={day}
                                className="text-center fw-semibold"
                                style={{
                                    fontSize: "10px",
                                    color: "#526780",
                                    paddingBottom: "7px",
                                }}
                            >
                                {day}
                            </div>
                        ))}

                        {/* Calendar Dates */}
                        {calendarDays.map((day, index) => {
                            if (day === null) {
                                return (
                                    <div
                                        key={`empty-${index}`}
                                    />
                                );
                            }

                            const date = new Date(
                                year,
                                monthIndex,
                                day
                            );

                            const key = dateKey(date);

                            const isToday = key === todayKey;
                            const isSunday = date.getDay() === 0;

                            const isAbsent =
                                attendanceByDate.get(key) === "absent";

                            // Colour priority:
                            // Today > Sunday > Absent > Regular
                            let background = "#ffffff";
                            let color = "#111827";

                            if (isAbsent) {
                                background = "#111827";
                                color = "#ffffff";
                            }

                            if (isSunday) {
                                background = "#1762ad";
                                color = "#ffffff";
                            }

                            if (isToday) {
                                background = "#ef4a9c";
                                color = "#ffffff";
                            }

                            return (
                                <div
                                    key={key}
                                    title={`${key}: ${attendanceByDate.get(key) ||
                                        "No attendance record"
                                        }`}
                                    className="d-flex align-items-center justify-content-center fw-bold"
                                    style={{
                                        width: "100%",
                                        maxWidth: "37px",
                                        aspectRatio: "1 / 1",
                                        margin: "auto",
                                        borderRadius: "50%",
                                        background,
                                        color,
                                        boxShadow:
                                            background === "#ffffff"
                                                ? "0 1px 5px #00000012"
                                                : "none",
                                        fontSize: "12px",
                                    }}
                                >
                                    {day}
                                </div>
                            );
                        })}
                    </div>

                    {/* Loading */}
                    {loadingCalendar && (
                        <small className="d-block text-center mt-2 text-muted">
                            Loading attendance...
                        </small>
                    )}

                    {/* Error */}
                    {calendarError && (
                        <small className="d-block text-center mt-2 text-danger">
                            {calendarError}
                        </small>
                    )}

                    {/* Colour Legend */}
                    <div
                        className="d-flex flex-wrap justify-content-center mt-2"
                        style={{
                            gap: "5px 11px",
                            fontSize: "10px",
                            color: "#475569",
                        }}
                    >
                        {[
                            ["#111827", "Absent"],
                            ["#ef4a9c", "Today"],
                            ["#1762ad", "Sunday"],
                            ["#ffffff", "Regular"],
                        ].map(([legendColor, name]) => (
                            <span
                                key={name}
                                className="d-inline-flex align-items-center"
                                style={{ gap: "4px" }}
                            >
                                <i
                                    style={{
                                        width: "9px",
                                        height: "9px",
                                        borderRadius: "50%",
                                        display: "inline-block",
                                        background: legendColor,
                                        border:
                                            legendColor === "#ffffff"
                                                ? "1px solid #cbd5e1"
                                                : "none",
                                    }}
                                />

                                {name}
                            </span>
                        ))}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};



const MyGRVCard = ({ token }) => {
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const getCurrentMonthRange = () => {
        const today = new Date();

        return {
            start: formatDate(
                new Date(today.getFullYear(), today.getMonth(), 1)
            ),
            end: formatDate(
                new Date(today.getFullYear(), today.getMonth() + 1, 0)
            ),
        };
    };

    const [dateRange, setDateRange] = useState(getCurrentMonthRange);
    const [draftRange, setDraftRange] = useState(getCurrentMonthRange);
    const [showCalendar, setShowCalendar] = useState(false);

    const [grvData, setGrvData] = useState({
        bill: 0,
        value: 0,
        actualSales: 0,
    });

    const [loadingGRV, setLoadingGRV] = useState(false);
    const [grvError, setGrvError] = useState("");

    useEffect(() => {
        if (!token) return;

        const controller = new AbortController();

        const fetchMyGRV = async () => {
            setLoadingGRV(true);
            setGrvError("");

            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}my/grv/data/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        params: {
                            start_date: dateRange.start,
                            end_date: dateRange.end,
                        },
                        signal: controller.signal,
                    }
                );

                const results = response.data?.results || {};

                const orderSummary = results.order_summary || {};
                const grvSummary = results.summary || {};


                const bill = Number(
                    grvSummary.total_grv_count || 0
                );

                const grvAmount = Number(
                    grvSummary.total_grv_amount || 0
                );

                const invoiceAmount = Number(
                    orderSummary.total_order_amount || 0
                );

                setGrvData({
                    bill: bill,
                    value: grvAmount,
                    actualSales: invoiceAmount - grvAmount,
                });

            } catch (error) {
                if (
                    error.code !== "ERR_CANCELED" &&
                    !controller.signal.aborted
                ) {
                    setGrvError("Unable to load GRV data");
                    setGrvData({
                        bill: 0,
                        value: 0,
                        actualSales: 0,
                    });
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingGRV(false);
                }
            }
        };

        fetchMyGRV();

        return () => controller.abort();
    }, [token, dateRange.start, dateRange.end]);

    const formatAmount = (value) => {
        const amount = Number(value) || 0;
        const absolute = Math.abs(amount);
        const sign = amount < 0 ? "-" : "";

        if (absolute >= 10000000) {
            return `${sign}${(absolute / 10000000).toFixed(2)} Cr`;
        }

        if (absolute >= 100000) {
            return `${sign}${(absolute / 100000).toFixed(2)} L`;
        }

        if (absolute >= 1000) {
            return `${sign}${(absolute / 1000).toFixed(2)} K`;
        }

        return `${sign}${absolute.toFixed(2)}`;
    };

    const applyDateFilter = () => {
        if (
            !draftRange.start ||
            !draftRange.end ||
            draftRange.start > draftRange.end
        ) {
            setGrvError("Please select a valid date range");
            return;
        }

        setDateRange({ ...draftRange });
        setShowCalendar(false);
    };

    const resetToCurrentMonth = () => {
        const range = getCurrentMonthRange();
        setDraftRange(range);
        setDateRange(range);
        setShowCalendar(false);
    };

    const dataRow = (label, value) => (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(255,255,255,0.13)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: "8px",
                padding: "5px 9px",
                minHeight: "25px",
                gap: "5px",
            }}
        >
            <span
                style={{
                    fontSize: "10px",
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
            >
                {label}
            </span>

            <strong
                style={{
                    fontSize: "12px",
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                }}
            >
                {loadingGRV ? "..." : value}
            </strong>
        </div>
    );



    return (
        <Card
            className="border-0 shadow-sm h-100"
            style={{
                borderRadius: "16px",
                background: "linear-gradient(135deg, #55adff 0%, #2878f7 100%)",
                overflow: "visible",
                color: "#ffffff",
            }}
        >
            <CardBody
                style={{
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    gap: "14px",
                }}
            >
                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h5
                            className="mb-1"
                            style={{
                                fontSize: "18px",
                                fontWeight: "800",
                                color: "#ffffff",
                            }}
                        >
                            My GRV
                        </h5>

                        <div
                            style={{
                                fontSize: "12px",
                                color: "#ffffff",
                                opacity: 0.9,
                            }}
                        >
                            GRV & Sales Summary
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setDraftRange({ ...dateRange });
                            setShowCalendar(!showCalendar);
                        }}
                        title="Select date range"
                        aria-label="Select date range"
                        style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "10px",
                            border: "1px solid rgba(255,255,255,0.5)",
                            background: "rgba(255,255,255,0.2)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                        }}
                    >
                        <svg
                            width="21"
                            height="21"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect x="3" y="5" width="18" height="16" rx="2" />
                            <path d="M16 3v4M8 3v4M3 10h18" />
                            <path d="m9 16 2 2 4-4" />
                        </svg>
                    </button>
                </div>

                {/* SELECTED PERIOD */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#ffffff",
                        background: "rgba(255,255,255,0.15)",
                        borderRadius: "8px",
                        padding: "8px 10px",
                    }}
                >
                    <span>Period:</span>
                    <span>
                        {new Date(dateRange.start + "T00:00:00")
                            .toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            })}
                        {" - "}
                        {new Date(dateRange.end + "T00:00:00")
                            .toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            })}
                    </span>
                </div>

                {/* DATE FILTER */}
                {showCalendar && (
                    <div
                        style={{
                            background: "#ffffff",
                            color: "#334155",
                            borderRadius: "12px",
                            padding: "14px",
                            boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                        }}
                    >
                        <div className="row g-2">
                            <div className="col-6">
                                <label
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        marginBottom: "5px",
                                    }}
                                >
                                    From Date
                                </label>

                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    style={{ minWidth: 0 }}
                                    value={draftRange.start}
                                    onChange={(e) =>
                                        setDraftRange({
                                            ...draftRange,
                                            start: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className="col-6">
                                <label
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        marginBottom: "5px",
                                    }}
                                >
                                    To Date
                                </label>

                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    style={{ minWidth: 0 }}
                                    value={draftRange.end}
                                    onChange={(e) =>
                                        setDraftRange({
                                            ...draftRange,
                                            end: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-3">
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={applyDateFilter}
                            >
                                Apply Filter
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={resetToCurrentMonth}
                            >
                                This Month
                            </button>
                        </div>
                    </div>
                )}

                {/* GRV COUNT & VALUE */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: "12px",
                    }}
                >
                    {/* GRV COUNT */}
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "12px",
                            padding: "15px",
                            boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "7px",
                                marginBottom: "10px",
                                color: "#64748b",
                                fontSize: "13px",
                                fontWeight: "600",
                            }}
                        >
                            <i
                                className="ri-file-list-3-line"
                                style={{
                                    color: "#2563eb",
                                    fontSize: "17px",
                                }}
                            />
                            Bill
                        </div>

                        <div
                            style={{
                                color: "#1e40af",
                                fontSize: "30px",
                                fontWeight: "800",
                                lineHeight: "1.2",
                            }}
                        >
                            {loadingGRV ? "..." : grvData.bill}
                        </div>

                        <div
                            style={{
                                fontSize: "11px",
                                color: "#64748b",
                                marginTop: "7px",
                            }}
                        >
                            Total GRV Count
                        </div>
                    </div>

                    {/* GRV AMOUNT */}
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "12px",
                            padding: "15px",
                            boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "7px",
                                marginBottom: "10px",
                                color: "#64748b",
                                fontSize: "13px",
                                fontWeight: "600",
                            }}
                        >
                            <i
                                className="ri-money-rupee-circle-line"
                                style={{
                                    color: "#2563eb",
                                    fontSize: "17px",
                                }}
                            />
                            Value
                        </div>

                        <div
                            style={{
                                color: "#1e40af",
                                fontSize: "27px",
                                fontWeight: "800",
                                lineHeight: "1.2",
                                overflowWrap: "anywhere",
                            }}
                        >
                            {loadingGRV
                                ? "..."
                                : formatAmount(grvData.value)}
                        </div>

                        <div
                            style={{
                                fontSize: "11px",
                                color: "#64748b",
                                marginTop: "7px",
                            }}
                        >
                            Total GRV Amount
                        </div>
                    </div>
                </div>

                {/* ACTUAL SALES - HIGHLIGHT */}
                <div
                    style={{
                        background: "#ffffff",
                        borderRadius: "12px",
                        padding: "18px",
                        boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
                        borderLeft: "5px solid #16a34a",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "10px",
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "7px",
                                    color: "#334155",
                                    fontSize: "14px",
                                    fontWeight: "700",
                                }}
                            >
                                <i
                                    className="ri-line-chart-line"
                                    style={{
                                        color: "#16a34a",
                                        fontSize: "19px",
                                    }}
                                />
                                Actual Sales
                            </div>

                            <div
                                style={{
                                    color: "#64748b",
                                    fontSize: "11px",
                                    marginTop: "5px",
                                }}
                            >
                                Invoice Amount - GRV Amount
                            </div>
                        </div>

                        <div
                            style={{
                                fontSize: "clamp(22px, 2vw, 30px)",
                                fontWeight: "800",
                                color: "#15803d",
                                lineHeight: "1.2",
                                overflowWrap: "anywhere",
                            }}
                        >
                            {loadingGRV
                                ? "..."
                                : formatAmount(grvData.actualSales)}
                        </div>
                    </div>
                </div>

                {/* ERROR */}
                {grvError && (
                    <div
                        style={{
                            background: "#fee2e2",
                            color: "#b91c1c",
                            borderRadius: "8px",
                            padding: "8px 10px",
                            fontSize: "12px",
                        }}
                    >
                        {grvError}
                    </div>
                )}
            </CardBody>
        </Card>
    );
};



const ChartSection = () => {
    const [chartsData, setChartsData] = useState();
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token")
    const [role, setRole] = useState(null)
    const [orders, setOrders] = useState([]);
    const [userData, setUserData] = useState();
    const [orderCount, setOrderCount] = useState();
    const [myOrderData, setMyOrderData] = useState();
    const [todayOrderData, setTodayOrderData] = useState({});
    const [monthOrderData, setMonthOrderData] = useState({});
    const [proforma, setProforma] = useState([]);
    const [uniqueProforma, setUniqueProforma] = useState([]);
    const [grvCount, setGrvCount] = useState([]);
    const navigate = useNavigate();
    const [expense, setExpense] = useState([])
    const [teamSummary, setTeamSummary] = useState(null);
    const [teamLoading, setTeamLoading] = useState(false);
    const [teamAttendance, setTeamAttendance] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [beposoftSummary, setBeposoftSummary] = useState({});
    const [isFinanceLoading, setIsFinanceLoading] = useState(false);
    const [financeError, setFinanceError] = useState(null);

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}profile/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(response?.data?.data?.family);
            } catch (error) {
                toast.error('Error fetching user data:');
            }
        };
        fetchUserData();
    }, []);


    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}company/data/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.status === 200) {
                    setCompanies(
                        (response.data.data || []).filter(
                            company => company.id === 5 || company.id === 6
                        )
                    );
                }
            } catch (error) {
                console.error("Error fetching companies", error);
            }
        };

        fetchCompanies();
    }, []);

    useEffect(() => {
        const fetchBeposoftSummary = async () => {
            setIsFinanceLoading(true);
            setFinanceError(null);

            try {
                const token = localStorage.getItem("token");

                if (!token) {
                    throw new Error("Please log in again to view finance.");
                }

                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}beposoft/summary/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        timeout: 30000,
                    }
                );

                if (response.status === 200) {
                    setBeposoftSummary(response.data);
                }

            } catch (error) {
                console.error("FINANCE SUMMARY ERROR:", error);

                setFinanceError(
                    error.response?.data?.message ||
                    error.message ||
                    "Unable to load finance summary."
                );

            } finally {
                setIsFinanceLoading(false);
            }
        };

        fetchBeposoftSummary();

    }, []);


    useEffect(() => {
        const fetchTeamAttendance = async () => {
            try {
                setTeamLoading(true);

                const today = new Date().toISOString().split("T")[0];

                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}staff/attendance/team/wise/count/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        params: {
                            start_date: today,
                            end_date: today,
                        },
                    }
                );

                setTeamAttendance(response.data.data || []);
                setTeamSummary(response.data.summary || null);

            } catch (error) {
                toast.error("Failed to fetch team attendance");
            } finally {
                setTeamLoading(false);
            }
        };

        if (token) {
            fetchTeamAttendance();
        }
    }, [token]);

    useEffect(() => {
        const fetchMyOrderData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}my/order/summary/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMyOrderData(response?.data);
            } catch (error) {
                toast.error('Error fetching order count:');
            }
        };
        fetchMyOrderData();
    }, []);

    useEffect(() => {
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");

            return `${year}-${month}-${day}`;
        };

        const fetchOrderData = async () => {
            try {
                const todayDate = new Date();

                const today = formatDate(todayDate);

                const monthStart = formatDate(
                    new Date(
                        todayDate.getFullYear(),
                        todayDate.getMonth(),
                        1
                    )
                );

                // =====================================================
                // TODAY STATUS COUNT
                // =====================================================

                const todayResponse = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}shipping/status/history/summary/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        params: {
                            date: today,
                        },
                    }
                );

                setTodayOrderData(
                    todayResponse?.data?.data?.status_counts || {}
                );

                // =====================================================
                // CURRENT MONTH STATUS COUNT
                // =====================================================

                const monthResponse = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}shipping/status/history/summary/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        params: {
                            start_date: monthStart,
                            end_date: today,
                        },
                    }
                );

                setMonthOrderData(monthResponse?.data?.data?.status_counts || {});

            } catch (error) {
                console.error(
                    "Error fetching order count:",
                    error
                );

                toast.error("Error fetching order count");
            }
        };

        if (token) {
            fetchOrderData();
        }
    }, [token]);


    const todayToPrint =
        todayOrderData?.["To Print"] ?? 0;

    const todayPackingunderprogress =
        todayOrderData?.["Packing under progress"] ?? 0;

    const todayPendingForPacking =
        todayOrderData?.["Pending For Packing"] ?? 0;

    const todayPackedForDelivery =
        todayOrderData?.["Packed"] ?? 0;

    const todayOutForDelivery =
        todayOrderData?.["Ready to ship"] ?? 0;

    const todayReturnFromDelivery =
        todayOrderData?.["Return From Delivery"] ?? 0;

    const todayShipped =
        todayOrderData?.["Shipped"] ?? 0;


    const toPrintThisMonth =
        monthOrderData?.["To Print"] ?? 0;

    const PackingunderprogressThisMonth =
        monthOrderData?.["Packing under progress"] ?? 0;

    const pendingForPackingThisMonth =
        monthOrderData?.["Pending For Packing"] ?? 0;

    const packedForDeliveryThisMonth =
        monthOrderData?.["Packed"] ?? 0;

    const outForDeliveryThisMonth =
        monthOrderData?.["Ready to ship"] ?? 0;

    const returnFromDeliveryThisMonth =
        monthOrderData?.["Return From Delivery"] ?? 0;

    const shippedThisMonth =
        monthOrderData?.["Shipped"] ?? 0;



    useEffect(() => {
        const fetchOrderCount = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}orders/status/count/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrderCount(response?.data);
            } catch (error) {
                toast.error('Error fetching order count:');
            }
        };
        fetchOrderCount();
    }, []);

    const getTodayStatusCount = (status) =>
        orderCount?.today?.find(item => item.status === status)?.count || 0;

    const getAllStatusCount = (status) =>
        orderCount?.all?.find(item => item.status === status)?.count || 0;


    // WAITING FOR APPROVAL
    const waitingForApprovalToday =
        getTodayStatusCount("Invoice Created");

    const waitingForApprovalAll =
        getAllStatusCount("Invoice Created");


    // INVOICE APPROVED
    const invoiceApprovedToday =
        getTodayStatusCount("Invoice Approved");

    const invoiceApprovedAll =
        getAllStatusCount("Invoice Approved");


    // PRE BOOKED
    const preBookedToday =
        getTodayStatusCount("Pre Booked");

    const preBookedAll =
        getAllStatusCount("Pre Booked");


    // WAITING FOR CONFIRMATION
    const waitingForConfirmationStatusToday =
        getTodayStatusCount("Waiting For Confirmation");

    const waitingForConfirmationStatusAll =
        getAllStatusCount("Waiting For Confirmation");


    // DELIVERY ORDER
    const toPrintToday =
        getTodayStatusCount("To Print");

    const toPrintAll =
        getAllStatusCount("To Print");


    // PACKING UNDER PROGRESS
    const packingUnderProgressToday =
        getTodayStatusCount("Packing under progress");

    const packingUnderProgressAll =
        getAllStatusCount("Packing under progress");


    // PACKED FOR DELIVERY
    const packedForDeliveryToday =
        getTodayStatusCount("Packed");

    const packedForDeliveryAll =
        getAllStatusCount("Packed");


    // OUT FOR DELIVERY
    const outForDeliveryToday =
        getTodayStatusCount("Ready to ship");

    const outForDeliveryAll =
        getAllStatusCount("Ready to ship");


    // RETURN FROM DELIVERY
    const returnFromDeliveryToday =
        getTodayStatusCount("Return From Delivery");

    const returnFromDeliveryAll =
        getAllStatusCount("Return From Delivery");


    // SHIPPED
    const shippedToday =
        getTodayStatusCount("Shipped");

    const shippedAll =
        getAllStatusCount("Shipped");


    // INVOICE REJECTED
    const invoiceRejectedToday =
        getTodayStatusCount("Invoice Rejected");

    const invoiceRejectedAll =
        getAllStatusCount("Invoice Rejected");


    useEffect(() => {
        const fetchOrdersData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}orders/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                let ordersData = [];

                if (Array.isArray(response.data)) {
                    ordersData = response.data;
                }
                else if (Array.isArray(response.data.results)) {
                    ordersData = response.data.results;
                }
                else if (Array.isArray(response.data.results?.results)) {
                    ordersData = response.data.results.results;
                }

                setOrders(ordersData);


            } catch (error) {
                toast.error("Error fetching order data");
            }
        };

        fetchOrdersData();
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');

        axios.get(`${import.meta.env.VITE_APP_KEY}expense/add/`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((response) => {
                setExpense(response.data.data);
                // setFilteredData(response.data.data);
                // setLoading(false);
            })
            .catch((error) => {
                toast.error("There was an error fetching the data!");
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}dashboard/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setChartsData(response?.data?.data);
                setLoading(false);
            } catch (error) {
                toast.error('Error fetching chart data:');
                setLoading(false);
            }
        };
        fetchChartData();
    }, []);

    useEffect(() => {
        const fetchProformaData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}perfoma/invoices/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProforma(response?.data?.data);
            } catch (error) {
                toast.error("Error fetching proforma data");
            }
        };
        fetchProformaData();
    }, []);

    useEffect(() => {
        const fetchUniqueProformaData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}performa/invoice/staff/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUniqueProforma(response?.data?.data);
            } catch (error) {
                toast.error("Error fetching proforma data");
            }
        };
        fetchUniqueProformaData();
    }, []);

    useEffect(() => {
        const fetchGRVCount = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}grv/data/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setGrvCount(response?.data?.data);
            } catch (error) {
                toast.error("Error fetching GRV count");
            }
        };
        fetchGRVCount();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    const todayBills = chartsData?.find(item => item?.title === "Today Bills");
    const waitingForConfirmation = chartsData?.find(item => item?.title === "Waiting For Confirmation");
    const shipped = chartsData?.find(item => item?.title === "Shipped");
    const proformaInvoices = chartsData?.find(item => item?.title === "Proforma Invoices");
    const goodsReturn = chartsData?.find(item => item?.title === "Goods Return");
    const grvWaitingForConfirmation = chartsData?.find(item => item?.title === "GRV waiting for confirmation");
    const waitingForApproval = chartsData?.find(item => item?.title === "Waiting For Approval");

    const invoiceApprovedCount = orders?.filter(order => order?.status === "Invoice Approved")?.length;

    const proformaCountAdmin = proforma?.length || 0;
    const uniqueProformaCount = uniqueProforma?.length || 0;

    const today = new Date().toISOString().split('T')[0];

    const totalAmountForCurrentUserFamilyToday = orders
        ?.filter(order =>
            order.family_id === userData &&
            order.order_date?.slice(0, 10) === today
        )
        ?.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    const allTodayOrdersCount = orders?.filter(
        order => order?.order_date === today
    )?.length || 0;

    // Destructure from orders
    const familyIds = orders?.map(order => order.family_id);
    const orderDates = orders?.map(order => order.order_date);
    const waitingForConfirmationToday = orders?.filter(
        order => order?.status === "Waiting For Confirmation"
    )?.length;
    const shippedOrdersToday = orders?.filter(
        order => order?.status === "Shipped" && order.order_date === today
    )?.length;
    const shippedOrdersTodayStaff = orders?.filter(
        order =>
            order?.status === "Shipped" &&
            order?.order_date === today &&
            order?.family_id === userData
    ).length;

    const waitingForApprovalStaff = orders?.filter(
        order => order?.status === "Invoice Created" && order?.family_id === userData
    ).length;

    // from grv/data api
    const pendingGRVCount = grvCount?.filter(item => item?.status === "pending" && item?.family === userData)?.length;

    // Filter orders where family_id matches userData AND order_date matches today
    const userFamilyTodayOrderCount = orders?.filter(
        order => order?.family_id === userData && order?.order_date === today
    )?.length;

    const totalAmountSkatingAndCyclingToday = orders?.reduce((sum, order) => {
        const orderDate = order?.order_date?.slice(0, 10);
        if (
            (order.family_name === "skating" || order.family_name === "cycling") &&
            orderDate === today
        ) {
            return sum + (parseFloat(order.total_amount) || 0);
        }
        return sum;
    }, 0);

    const skatingAndCyclingTodayCount = orders?.filter(order =>
        (order.family_name === "skating" || order.family_name === "cycling") &&
        order.order_date === today
    )?.length || 0;

    const skatingTodayCount = orders?.filter(order =>
        (order.family_name === "skating") &&
        order.order_date === today
    )?.length || 0;

    const cyclingTodayCount = orders?.filter(order =>
        (order.family_name === "cycling") &&
        order.order_date === today
    )?.length || 0;

    const totalSkatingTodayAmount = orders?.reduce((sum, order) => {
        const orderDate = order?.order_date?.slice(0, 10);
        if (order.family_name === "skating" && orderDate === today) {
            return sum + (parseFloat(order.total_amount) || 0);
        }
        return sum;
    }, 0);

    const totalCyclingTodayAmount = orders?.reduce((sum, order) => {
        const orderDate = order?.order_date?.slice(0, 10);
        if (order.family_name === "cycling" && orderDate === today) {
            return sum + (parseFloat(order.total_amount) || 0);
        }
        return sum;
    }, 0);

    // ================= FINANCE DATA =================

    const bankSummary = beposoftSummary?.bank_summary || {};

    const todayData = bankSummary?.today_data || {};

    const monthData = bankSummary?.current_month_data || {};

    const todayBank = todayData?.with_internal_transfer || {};

    const monthBank = monthData?.with_internal_transfer || {};


    // ================= TODAY =================

    const todayClosingBalance =
        Number(todayBank?.closing_balance || 0);

    const todayCredit =
        Number(todayBank?.credit || 0);

    const todayDebit =
        Number(todayBank?.debit || 0);

    const todayAmountChange =
        todayCredit - todayDebit;


    // ================= CURRENT MONTH =================

    const monthCredit =
        Number(monthBank?.credit || 0);

    const monthDebit =
        Number(monthBank?.debit || 0);

    const monthAmountChange =
        monthCredit - monthDebit;


    // ================= AMOUNT FORMAT =================

    const formatFinanceAmount = (value) => {

        const number = Number(value) || 0;

        const absolute = Math.abs(number);

        const sign = number < 0 ? "-" : "";

        if (absolute >= 10000000) {
            return `${sign}₹${(absolute / 10000000).toFixed(2)} Cr`;
        }

        if (absolute >= 100000) {
            return `${sign}₹${(absolute / 100000).toFixed(2)} L`;
        }

        if (absolute >= 1000) {
            return `${sign}₹${(absolute / 1000).toFixed(2)}K`;
        }

        return `${sign}₹${absolute.toFixed(2)}`;
    };


    const currentMonthLabel = new Date()
        .toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
        })
        .toUpperCase();


    return (
        <React.Fragment>

            <Row>


                {/* Other roles retain their attendance calendar. For ADMIN,
                    Accounts and COO it is placed in the same grid as the
                    Company Reports and Finance cards below. */}
                <Row className="g-3 mb-3">
                    {!(role === "ADMIN" || role === "Accounts / Accounting" || role === "COO") && (
                        <Col xs={12} sm={6} md={6} lg={4} xl={3}>
                            <AttendanceCalendar token={token} />
                        </Col>
                    )}


                    {(role === "BDM" || role === "BDO") && (
                        <Col xs={12} sm={6} md={6} lg={3} xl={3}>
                            <MyGRVCard token={token} />
                        </Col>
                    )}

                </Row>


                {/* warehouse & Warehouse Admin dashboard */}

                {(role === "warehouse" || role === "Warehouse Admin") && (
                    <>
                        <Row className="g-3 mb-3">

                            {/* DELIVERY ORDER */}
                            <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                                <Card
                                    onClick={() => navigate("/orders/toprint")}
                                    className="h-100 border-0 shadow-sm"
                                    style={{
                                        cursor: "pointer",
                                        borderRadius: "16px",
                                        minHeight: "155px",
                                        background: "#f8fbff",
                                        borderLeft: "5px solid #3b82f6"
                                    }}
                                >
                                    <CardBody className="p-3 p-md-4">

                                        <p
                                            className="fw-semibold mb-2"
                                            style={{
                                                color: "#475569",
                                                fontSize: "14px"
                                            }}
                                        >
                                            Delivery Order (DO)
                                        </p>

                                        <div className="mb-3">
                                            <span
                                                style={{
                                                    color: "#334155",
                                                    fontSize: "clamp(13px, 1vw, 15px)",
                                                    fontWeight: "700",
                                                    letterSpacing: "0.4px",
                                                    lineHeight: "1.5",
                                                    display: "inline-block",
                                                    marginBottom: "4px",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {currentMonthLabel}
                                            </span>

                                            <h2
                                                className="fw-bold mb-3"
                                                style={{
                                                    color: "#1e3a8a",
                                                    fontSize: "30px"
                                                }}
                                            >
                                                {toPrintThisMonth}
                                            </h2>

                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    backgroundColor: "#dbeafe",
                                                    color: "#1d4ed8",
                                                    padding: "7px 12px",
                                                    borderRadius: "8px",
                                                    fontSize: "13px",
                                                    fontWeight: "500"
                                                }}
                                            >
                                                Today:&nbsp;
                                                <strong style={{ fontWeight: "700" }}>
                                                    {todayToPrint}
                                                </strong>
                                            </span>

                                        </div>

                                    </CardBody>
                                </Card>
                            </Col>


                            <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                                <Card
                                    onClick={() => navigate("/orders/packingunderprogress")}
                                    className="h-100 border-0 shadow-sm"
                                    style={{
                                        cursor: "pointer",
                                        borderRadius: "16px",
                                        minHeight: "155px",
                                        background: "#f8fbff",
                                        borderLeft: "5px solid #3b82f6"
                                    }}
                                >
                                    <CardBody className="p-3 p-md-4">

                                        <p
                                            className="fw-semibold mb-2"
                                            style={{
                                                color: "#475569",
                                                fontSize: "14px"
                                            }}
                                        >
                                            Printed List
                                        </p>

                                        <div className="mb-3">
                                            <span
                                                style={{
                                                    color: "#334155",
                                                    fontSize: "clamp(13px, 1vw, 15px)",
                                                    fontWeight: "700",
                                                    letterSpacing: "0.4px",
                                                    lineHeight: "1.5",
                                                    display: "inline-block",
                                                    marginBottom: "4px",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {currentMonthLabel}
                                            </span>

                                            <h2
                                                className="fw-bold mb-3"
                                                style={{
                                                    color: "#1e3a8a",
                                                    fontSize: "30px"
                                                }}
                                            >
                                                {PackingunderprogressThisMonth}
                                            </h2>

                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    backgroundColor: "#dbeafe",
                                                    color: "#1d4ed8",
                                                    padding: "7px 12px",
                                                    borderRadius: "8px",
                                                    fontSize: "13px",
                                                    fontWeight: "500"
                                                }}
                                            >
                                                Today:&nbsp;
                                                <strong style={{ fontWeight: "700" }}>
                                                    {todayPackingunderprogress}
                                                </strong>
                                            </span>

                                        </div>

                                    </CardBody>
                                </Card>
                            </Col>

                            <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                                <Card
                                    onClick={() => navigate("/orders/pendingforpacking")}
                                    className="h-100 border-0 shadow-sm"
                                    style={{
                                        cursor: "pointer",
                                        borderRadius: "16px",
                                        minHeight: "155px",
                                        background: "#f8fbff",
                                        borderLeft: "5px solid #3b82f6"
                                    }}
                                >
                                    <CardBody className="p-3 p-md-4">

                                        <p
                                            className="fw-semibold mb-2"
                                            style={{
                                                color: "#475569",
                                                fontSize: "14px"
                                            }}
                                        >
                                            Pending For Packing
                                        </p>

                                        <div className="mb-3">
                                            <span
                                                style={{
                                                    color: "#334155",
                                                    fontSize: "clamp(13px, 1vw, 15px)",
                                                    fontWeight: "700",
                                                    letterSpacing: "0.4px",
                                                    lineHeight: "1.5",
                                                    display: "inline-block",
                                                    marginBottom: "4px",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {currentMonthLabel}
                                            </span>

                                            <h2
                                                className="fw-bold mb-3"
                                                style={{
                                                    color: "#1e3a8a",
                                                    fontSize: "30px"
                                                }}
                                            >
                                                {pendingForPackingThisMonth}
                                            </h2>

                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    backgroundColor: "#dbeafe",
                                                    color: "#1d4ed8",
                                                    padding: "7px 12px",
                                                    borderRadius: "8px",
                                                    fontSize: "13px",
                                                    fontWeight: "500"
                                                }}
                                            >
                                                Today:&nbsp;
                                                <strong style={{ fontWeight: "700" }}>
                                                    {todayPendingForPacking}
                                                </strong>
                                            </span>

                                        </div>

                                    </CardBody>
                                </Card>
                            </Col>


                            {/* PACKED FOR DELIVERY */}
                            <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                                <Card
                                    onClick={() => navigate("/orders/packed")}
                                    className="h-100 border-0 shadow-sm"
                                    style={{
                                        cursor: "pointer",
                                        borderRadius: "16px",
                                        minHeight: "155px",
                                        background: "#f5fdff",
                                        borderLeft: "5px solid #06b6d4"
                                    }}
                                >
                                    <CardBody className="p-3 p-md-4">

                                        <p
                                            className="fw-semibold mb-2"
                                            style={{
                                                color: "#475569",
                                                fontSize: "14px"
                                            }}
                                        >
                                            Packed For Delivery (PFD)
                                        </p>

                                        <div className="mb-3">
                                            <span
                                                style={{
                                                    color: "#334155",
                                                    fontSize: "clamp(13px, 1vw, 15px)",
                                                    fontWeight: "700",
                                                    letterSpacing: "0.4px",
                                                    lineHeight: "1.5",
                                                    display: "inline-block",
                                                    marginBottom: "4px",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {currentMonthLabel}
                                            </span>

                                            <h2
                                                className="fw-bold mb-3"
                                                style={{
                                                    color: "#155e75",
                                                    fontSize: "30px"
                                                }}
                                            >
                                                {packedForDeliveryThisMonth}
                                            </h2>

                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    backgroundColor: "#cffafe",
                                                    color: "#0e7490",
                                                    padding: "7px 12px",
                                                    borderRadius: "8px",
                                                    fontSize: "13px",
                                                    fontWeight: "500"
                                                }}
                                            >
                                                Today:&nbsp;
                                                <strong style={{ fontWeight: "700" }}>
                                                    {todayPackedForDelivery}
                                                </strong>
                                            </span>

                                        </div>

                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                        <Row className="g-3 mb-3">
                            {/* DGM */}
                            <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                                <Card
                                    onClick={() => navigate("/daily/good/movment/")}
                                    className="h-100 border-0 shadow-sm"
                                    style={{
                                        cursor: "pointer",
                                        borderRadius: "16px",
                                        minHeight: "155px",
                                        background: "#fff7f7",
                                        borderLeft: "5px solid #ef4444"
                                    }}
                                >
                                    <CardBody className="p-3 p-md-4">

                                        <p
                                            className="fw-semibold mb-2"
                                            style={{
                                                color: "#475569",
                                                fontSize: "14px"
                                            }}
                                        >
                                            Daily Goods Movement
                                        </p>

                                        <h2>DGM</h2>
                                        <span>Check daily goods movement</span>

                                    </CardBody>
                                </Card>
                            </Col>


                            {/* OUT FOR DELIVERY */}
                            <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                                <Card
                                    onClick={() => navigate("/orders/readytoship")}
                                    className="h-100 border-0 shadow-sm"
                                    style={{
                                        cursor: "pointer",
                                        borderRadius: "16px",
                                        minHeight: "155px",
                                        background: "#fffaf3",
                                        borderLeft: "5px solid #f59e0b"
                                    }}
                                >
                                    <CardBody className="p-3 p-md-4">

                                        <p
                                            className="fw-semibold mb-2"
                                            style={{
                                                color: "#475569",
                                                fontSize: "14px"
                                            }}
                                        >
                                            Out For Delivery (OFD)
                                        </p>

                                        <div className="mb-3">
                                            <span
                                                style={{
                                                    color: "#334155",
                                                    fontSize: "clamp(13px, 1vw, 15px)",
                                                    fontWeight: "700",
                                                    letterSpacing: "0.4px",
                                                    lineHeight: "1.5",
                                                    display: "inline-block",
                                                    marginBottom: "4px",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {currentMonthLabel}
                                            </span>

                                            <h2
                                                className="fw-bold mb-3"
                                                style={{
                                                    color: "#92400e",
                                                    fontSize: "30px"
                                                }}
                                            >
                                                {outForDeliveryThisMonth}
                                            </h2>

                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    backgroundColor: "#fef3c7",
                                                    color: "#b45309",
                                                    padding: "7px 12px",
                                                    borderRadius: "8px",
                                                    fontSize: "13px",
                                                    fontWeight: "500"
                                                }}
                                            >
                                                Today:&nbsp;
                                                <strong style={{ fontWeight: "700" }}>
                                                    {todayOutForDelivery}
                                                </strong>
                                            </span>

                                        </div>

                                    </CardBody>
                                </Card>
                            </Col>


                            {/* RETURN FROM DELIVERY */}
                            <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                                <Card
                                    onClick={() => navigate("/orders/returnfromdelivery")}
                                    className="h-100 border-0 shadow-sm"
                                    style={{
                                        cursor: "pointer",
                                        borderRadius: "16px",
                                        minHeight: "155px",
                                        background: "#fff7f7",
                                        borderLeft: "5px solid #ef4444"
                                    }}
                                >
                                    <CardBody className="p-3 p-md-4">

                                        <p
                                            className="fw-semibold mb-2"
                                            style={{
                                                color: "#475569",
                                                fontSize: "14px"
                                            }}
                                        >
                                            Return From Delivery (RFD)
                                        </p>

                                        <div className="mb-3">
                                            <span
                                                style={{
                                                    color: "#334155",
                                                    fontSize: "clamp(13px, 1vw, 15px)",
                                                    fontWeight: "700",
                                                    letterSpacing: "0.4px",
                                                    lineHeight: "1.5",
                                                    display: "inline-block",
                                                    marginBottom: "4px",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {currentMonthLabel}
                                            </span>

                                            <h2
                                                className="fw-bold mb-3"
                                                style={{
                                                    color: "#991b1b",
                                                    fontSize: "30px"
                                                }}
                                            >
                                                {returnFromDeliveryThisMonth}
                                            </h2>

                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    backgroundColor: "#fee2e2",
                                                    color: "#b91c1c",
                                                    padding: "7px 12px",
                                                    borderRadius: "8px",
                                                    fontSize: "13px",
                                                    fontWeight: "500"
                                                }}
                                            >
                                                Today:&nbsp;
                                                <strong style={{ fontWeight: "700" }}>
                                                    {todayReturnFromDelivery}
                                                </strong>
                                            </span>

                                        </div>

                                    </CardBody>
                                </Card>
                            </Col>


                            {/* SHIPPED */}
                            <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                                <Card
                                    onClick={() => navigate("/orders/shipped")}
                                    className="h-100 border-0 shadow-sm"
                                    style={{
                                        cursor: "pointer",
                                        borderRadius: "16px",
                                        minHeight: "155px",
                                        background: "#f5fff8",
                                        borderLeft: "5px solid #22c55e"
                                    }}
                                >
                                    <CardBody className="p-3 p-md-4">

                                        <p
                                            className="fw-semibold mb-2"
                                            style={{
                                                color: "#475569",
                                                fontSize: "14px"
                                            }}
                                        >
                                            Shipped
                                        </p>

                                        <div className="mb-3">
                                            <span
                                                style={{
                                                    color: "#334155",
                                                    fontSize: "clamp(13px, 1vw, 15px)",
                                                    fontWeight: "700",
                                                    letterSpacing: "0.4px",
                                                    lineHeight: "1.5",
                                                    display: "inline-block",
                                                    marginBottom: "4px",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {currentMonthLabel}
                                            </span>

                                            <h2
                                                className="fw-bold mb-3"
                                                style={{
                                                    color: "#166534",
                                                    fontSize: "30px"
                                                }}
                                            >
                                                {shippedThisMonth}
                                            </h2>

                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    backgroundColor: "#dcfce7",
                                                    color: "#15803d",
                                                    padding: "7px 12px",
                                                    borderRadius: "8px",
                                                    fontSize: "13px",
                                                    fontWeight: "500"
                                                }}
                                            >
                                                Today:&nbsp;
                                                <strong style={{ fontWeight: "700" }}>
                                                    {todayShipped}
                                                </strong>
                                            </span>

                                        </div>

                                    </CardBody>
                                </Card>
                            </Col>

                        </Row>
                    </>
                )}

                {/* ADMIN & Accounts / Accounting dashboard */}

                {(role === "ADMIN" || role === "Accounts / Accounting" || role === "COO") && (
                    <Row className="g-3 mb-3">

                        {/* Calendar shares the same responsive row and gutters
                            as the other dashboard cards. */}
                        <Col xs={12} sm={6} md={6} lg={3} xl={3}>
                            <AttendanceCalendar token={token} />
                        </Col>

                        {/* One column containing two vertically stacked company cards */}
                        <Col xs={12} sm={6} md={6} lg={3} xl={3}>
                            <div className="d-flex flex-column gap-3 h-100">
                                {companies.map((company) => (

                                    <Card
                                        key={company.id}
                                        onClick={() =>
                                            navigate(
                                                `/finance/company-report/${company.id}`,
                                                {
                                                    state: {
                                                        companyName: company.name
                                                    }
                                                }
                                            )
                                        }

                                        className="flex-fill border-0 shadow-sm"

                                        style={{
                                            cursor: "pointer",
                                            borderRadius: "16px",
                                            minHeight: "155px",
                                            background: "#f8fbff",
                                            borderLeft: "5px solid #3b82f6"
                                        }}
                                    >

                                        <CardBody className="p-3 p-md-4">

                                            <p
                                                className="fw-semibold mb-2"
                                                style={{
                                                    color: "#475569",
                                                    fontSize: "14px"
                                                }}
                                            >
                                                Company Reports
                                            </p>

                                            <h5
                                                className="fw-bold mb-3"
                                                style={{
                                                    color: "#1e3a8a",
                                                    fontSize: "17px",
                                                    lineHeight: "1.5"
                                                }}
                                            >
                                                {company.name}
                                            </h5>

                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    backgroundColor: "#dbeafe",
                                                    color: "#1d4ed8",
                                                    padding: "7px 12px",
                                                    borderRadius: "8px",
                                                    fontSize: "13px",
                                                    fontWeight: "500"
                                                }}
                                            >
                                                View Finance Report →
                                            </span>

                                        </CardBody>

                                    </Card>

                                ))}
                            </div>
                        </Col>

                        {/* ================= FINANCE CARD ================= */}

                        <Col xs={12} sm={12} md={12} lg={6} xl={6}>

                            <Card
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    borderRadius: "20px",
                                    minHeight: "210px",
                                    background:
                                        "linear-gradient(135deg, #56AFFF 0%, #2C74FF 100%)",
                                    color: "#ffffff",
                                    boxShadow: "0 6px 15px rgba(44,116,255,0.25)",
                                }}
                            >

                                <CardBody className="p-3 d-flex flex-column">

                                    {/* HEADER */}

                                    <div className="d-flex justify-content-between align-items-center mb-2">

                                        <h5
                                            className="mb-0 fw-bold"
                                            style={{
                                                color: "#ffffff",
                                                fontSize: "16px",
                                            }}
                                        >
                                            Finance
                                        </h5>

                                        <div
                                            style={{
                                                width: "35px",
                                                height: "35px",
                                                borderRadius: "11px",
                                                background: "rgba(255,255,255,0.15)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "19px",
                                            }}
                                        >
                                            ₹
                                        </div>

                                    </div>

                                    {/* LOADING */}

                                    {isFinanceLoading && !beposoftSummary?.bank_summary ? (

                                        <div className="text-center py-4">

                                            <div
                                                className="spinner-border spinner-border-sm text-white"
                                                role="status"
                                            />

                                            <p className="mt-2 mb-0 text-white">
                                                Loading finance...
                                            </p>

                                        </div>

                                    ) : financeError && !beposoftSummary?.bank_summary ? (

                                        <div className="text-center py-4 text-white">
                                            Unable to load finance
                                        </div>

                                    ) : (

                                        <>

                                            {/* Closing balance hero */}
                                            <div style={{
                                                background: "rgba(255,255,255,0.18)",
                                                border: "1px solid rgba(255,255,255,0.22)",
                                                borderRadius: 14,
                                                padding: "15px 18px",
                                                marginBottom: 14,
                                            }}>
                                                <div className="d-flex justify-content-between align-items-center flex-wrap" style={{ gap: 8 }}>
                                                    <div>
                                                        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.92 }}>Today's Closing Balance (TCB)</div>
                                                        <div style={{ fontSize: "clamp(22px, 2.2vw, 30px)", fontWeight: 800, lineHeight: 1.3, color: "#fff" }}>
                                                            {formatFinanceAmount(todayClosingBalance)}
                                                        </div>
                                                    </div>
                                                    <span style={{ fontSize: 11, background: "rgba(255,255,255,0.2)", padding: "6px 10px", borderRadius: 999 }}>Current balance</span>
                                                </div>
                                            </div>

                                            {/* Separate today and monthly numbers for easier scanning */}
                                            <Row className="g-3 flex-grow-1">
                                                {[
                                                    {
                                                        title: "Today",
                                                        items: [
                                                            ["TCT", "Total Credit", todayCredit],
                                                            ["TDT", "Total Debit", todayDebit],
                                                            ["DAC", "Amount Change", todayAmountChange],
                                                        ],
                                                    },
                                                    {
                                                        title: "This Month",
                                                        items: [
                                                            ["MCT", "Monthly Credit", monthCredit],
                                                            ["MDT", "Monthly Debit", monthDebit],
                                                            ["MAC", "Amount Change", monthAmountChange],
                                                        ],
                                                    },
                                                ].map(group => (
                                                    <Col xs={12} sm={6} key={group.title}>
                                                        <div className="h-100" style={{
                                                            background: "rgba(14,55,139,0.13)",
                                                            border: "1px solid rgba(255,255,255,0.2)",
                                                            borderRadius: 14,
                                                            padding: "12px",
                                                        }}>
                                                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, opacity: 0.98 }}>
                                                                {group.title}
                                                            </div>
                                                            <div className="d-flex flex-column" style={{ gap: 8 }}>
                                                                {group.items.map(([code, label, value]) => (
                                                                    <div key={code} className="d-flex align-items-center justify-content-between" style={{
                                                                        gap: 10,
                                                                        padding: "8px 10px",
                                                                        background: "rgba(255,255,255,0.11)",
                                                                        borderRadius: 10,
                                                                    }}>
                                                                        <div style={{ minWidth: 0 }}>
                                                                            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.75 }}>{code}</div>
                                                                            <div style={{ fontSize: 11, opacity: 0.95 }}>{label}</div>
                                                                        </div>
                                                                        <span style={{ fontSize: 13, fontWeight: 800, textAlign: "right", whiteSpace: "nowrap" }}>
                                                                            {formatFinanceAmount(value)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>

                                        </>

                                    )}

                                </CardBody>

                            </Card>

                        </Col>

                        {/* ================= END FINANCE CARD ================= */}

                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/dashboard/todaysbill-details")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f8fbff",
                                    borderLeft: "5px solid #3b82f6"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Today's Bill
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#1e3a8a",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {allTodayOrdersCount}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#dbeafe",
                                            color: "#1d4ed8",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today's Orders
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                        {/* WAITING FOR APPROVAL */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/orders/invoicecreated")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f8fbff",
                                    borderLeft: "5px solid #3b82f6"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Waiting For Approval
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#1e3a8a",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {waitingForApprovalAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#dbeafe",
                                            color: "#1d4ed8",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {waitingForApprovalToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>


                        {/* INVOICE APPROVED */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/orders/invoiceapproved")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f5fdff",
                                    borderLeft: "5px solid #06b6d4"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Invoice Approved
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#155e75",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {invoiceApprovedAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#cffafe",
                                            color: "#0e7490",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {invoiceApprovedToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                        {/* Waiting For Confirmation */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/orders/waitingforconfirmation")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fff7f7",
                                    borderLeft: "5px solid #ef4444"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Waiting For Confirmation
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#155e75",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {waitingForConfirmationStatusAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#cffafe",
                                            color: "#0e7490",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {waitingForConfirmationStatusToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>


                        {/* Delivery Order */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/orders/toprint")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fffaf3",
                                    borderLeft: "5px solid #f59e0b"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Delivery Order (DO)
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#92400e",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {toPrintAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#fef3c7",
                                            color: "#b45309",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {toPrintToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                        {/* Packing Under Progress */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/orders/packingunderprogress")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fffaf3",
                                    borderLeft: "5px solid #f59e0b"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Printed
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#92400e",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {packingUnderProgressAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#fef3c7",
                                            color: "#b45309",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {packingUnderProgressToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>


                        {/* PACKED FOR DELIVERY */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/orders/packed")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f5fdff",
                                    borderLeft: "5px solid #06b6d4"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Packed For Delivery (PFD)
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#155e75",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {packedForDeliveryAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#cffafe",
                                            color: "#0e7490",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {packedForDeliveryToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                        {/* DGM */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/daily/good/movment/")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fff7f7",
                                    borderLeft: "5px solid #ef4444"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Daily Goods Movement
                                    </p>

                                    <h2>DGM</h2>
                                    <span>Check daily goods movement</span>

                                </CardBody>
                            </Card>
                        </Col>


                        {/* OUT FOR DELIVERY */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/orders/readytoship")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fffaf3",
                                    borderLeft: "5px solid #f59e0b"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Out For Delivery (OFD)
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#92400e",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {outForDeliveryAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#fef3c7",
                                            color: "#b45309",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {outForDeliveryToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>


                        {/* RETURN FROM DELIVERY */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/orders/returnfromdelivery")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fff7f7",
                                    borderLeft: "5px solid #ef4444"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Return From Delivery (RFD)
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#991b1b",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {returnFromDeliveryAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#fee2e2",
                                            color: "#b91c1c",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {returnFromDeliveryToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>


                        {/* SHIPPED */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/orders/shipped")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f5fff8",
                                    borderLeft: "5px solid #22c55e"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Shipped
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#166534",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {shippedAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#dcfce7",
                                            color: "#15803d",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {shippedToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                            <Card
                                onClick={() => navigate("/orders/returnfromdelivery")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fff7f7",
                                    borderLeft: "5px solid #ef4444"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Pre Booked
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#991b1b",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {preBookedAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#fee2e2",
                                            color: "#b91c1c",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {preBookedToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/perfoma/invoices/")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f5fdff",
                                    borderLeft: "5px solid #06b6d4"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Proforma Invoices
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#155e75",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {proformaCountAdmin}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#cffafe",
                                            color: "#0e7490",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        View Proforma
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/beposoft/grv/view/")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fff7f7",
                                    borderLeft: "5px solid #ef4444"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Goods Return
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#991b1b",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {goodsReturn?.order || 0}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#fee2e2",
                                            color: "#b91c1c",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        View Returns
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/dashboard/grvwaitingforconfirmation-details")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fffaf3",
                                    borderLeft: "5px solid #f59e0b"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        GRV Waiting for Confirmation
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#92400e",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {(grvWaitingForConfirmation?.order || 0)}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#fef3c7",
                                            color: "#b45309",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        View Pending GRV
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                    </Row>
                )}

                {/* HR dashboard */}
                {(role === "HR") && (
                    <Row className="g-3 mb-3">

                        <div className="p-3 border rounded-4 shadow-sm bg-white" onClick={() => navigate("/staff-attendance/")}>
                            <h5 className="text-center mb-3 text-primary fw-bold">
                                Daily Staff Attendance Summary
                            </h5>

                            {teamLoading ? (
                                <div className="text-center py-3">Loading...</div>
                            ) : (
                                <Row className="g-3">

                                    <Col md={3}>
                                        <div className="bg-light rounded p-3 text-center">
                                            <small className="text-muted">Attendance %</small>
                                            <h4 className="mb-0 text-success">
                                                {teamSummary?.attendance_percentage || 0}
                                            </h4>
                                        </div>
                                    </Col>

                                    <Col md={3}>
                                        <div className="bg-light rounded p-3 text-center">
                                            <small className="text-muted">No. of Staffs</small>
                                            <h4 className="mb-0 text-success">
                                                {teamSummary?.total_members || 0}
                                            </h4>
                                        </div>
                                    </Col>

                                    <Col md={2}>
                                        <div className="bg-light rounded p-3 text-center">
                                            <small className="text-muted">Present</small>
                                            <h4 className="mb-0 text-success">
                                                {teamSummary?.total_present || 0}
                                            </h4>
                                        </div>
                                    </Col>

                                    <Col md={2}>
                                        <div className="bg-light rounded p-3 text-center">
                                            <small className="text-muted">Absent</small>
                                            <h4 className="mb-0 text-danger">
                                                {teamSummary?.total_absent || 0}
                                            </h4>
                                        </div>
                                    </Col>

                                    <Col md={2}>
                                        <div className="bg-light rounded p-3 text-center">
                                            <small className="text-muted">Half Day</small>
                                            <h4 className="mb-0 text-warning">
                                                {teamSummary?.total_half_day || 0}
                                            </h4>
                                        </div>
                                    </Col>
                                </Row>
                            )}
                        </div>

                    </Row>
                )}

                {(role === 'Marketing') && (
                    <Row>
                        <Col lg={3}>
                            <div style={{ cursor: "pointer" }}
                                onClick={() => navigate("/dashboard/todaysbill-details")}>
                                <Card className="mini-stats-wid">
                                    <CardBody>
                                        <div className="d-flex">
                                            <div className="flex-grow-1">
                                                <p className="text-muted fw-medium">Todays Bill</p>
                                                <h4 className="mb-0">
                                                    {role === "CEO"
                                                        ? allTodayOrdersCount
                                                        : role === "CSO"
                                                            ? skatingAndCyclingTodayCount
                                                            : userFamilyTodayOrderCount}
                                                </h4>
                                            </div>
                                        </div>
                                    </CardBody>
                                    <div className="card-body border-top py-3">
                                        <p className="mb-0">
                                            <span className="badge badge-soft-success me-2">
                                                {/* <i className="bx bx-trending-up align-bottom me-1 text-success"></i> {todayBills?.percentageValue} */}
                                            </span>
                                            {/* Increase last month */}
                                        </p>
                                    </div>
                                </Card>
                            </div>
                        </Col>
                        <Col lg={3}>
                            <div style={{ cursor: "pointer" }}>
                                <Card className="mini-stats-wid">
                                    <CardBody>
                                        <div className="d-flex">
                                            <div className="flex-grow-1">
                                                <p className="text-muted fw-medium">Todays Total Volume</p>
                                                <h4>
                                                    ₹ {role === "CSO"
                                                        ? totalAmountSkatingAndCyclingToday
                                                        : totalAmountForCurrentUserFamilyToday}
                                                </h4>
                                            </div>
                                            <div className="flex-shrink-0 align-self-center">
                                                {/* Optional Chart */}
                                            </div>
                                        </div>
                                    </CardBody>
                                    <div className="card-body border-top py-3">
                                        <p className="mb-0">
                                            <span className="badge badge-soft-success me-2">
                                                {/* <i className="bx bx-trending-up align-bottom me-1 text-success"></i> {todayBills?.percentageValue} */}
                                            </span>
                                            {/* Increase last month */}
                                        </p>
                                    </div>
                                </Card>
                            </div>
                        </Col>
                    </Row>
                )}


                {role === "CSO" && (
                    <Row className="g-3 mb-3">

                        {/* TODAY'S BILL */}
                        <Col xs={12} sm={6} lg={3}>
                            <Card
                                onClick={() => navigate("/dashboard/todaysbill-details")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "160px",
                                    background: "#f8fbff",
                                    borderLeft: "5px solid #3b82f6",
                                }}
                            >
                                <CardBody className="p-3 p-md-4">
                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px",
                                        }}
                                    >
                                        Today's Bill
                                    </p>

                                    <h2
                                        className="fw-bold mb-0"
                                        style={{
                                            color: "#1e3a8a",
                                            fontSize: "30px",
                                        }}
                                    >
                                        {role === "CEO"
                                            ? allTodayOrdersCount
                                            : role === "CSO"
                                                ? skatingAndCyclingTodayCount
                                                : userFamilyTodayOrderCount}
                                    </h2>
                                </CardBody>
                            </Card>
                        </Col>


                        {/* SKATING */}
                        <Col xs={12} sm={6} lg={3}>
                            <Card
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    borderRadius: "16px",
                                    minHeight: "160px",
                                    background: "#f5fdff",
                                    borderLeft: "5px solid #06b6d4",
                                }}
                            >
                                <CardBody className="p-3 p-md-4">
                                    <p
                                        className="fw-semibold mb-3"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px",
                                        }}
                                    >
                                        SKATING
                                    </p>

                                    <div className="mb-2">
                                        <span
                                            style={{
                                                color: "#64748b",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                            }}
                                        >
                                            Today's Bill
                                        </span>

                                        <h4
                                            className="fw-bold mb-0"
                                            style={{
                                                color: "#155e75",
                                            }}
                                        >
                                            {skatingTodayCount}
                                        </h4>
                                    </div>

                                    <div>
                                        <span
                                            style={{
                                                color: "#64748b",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                            }}
                                        >
                                            Today's Volume
                                        </span>

                                        <h5
                                            className="fw-bold mb-0"
                                            style={{
                                                color: "#155e75",
                                            }}
                                        >
                                            ₹ {totalSkatingTodayAmount?.toFixed(2)}
                                        </h5>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>


                        {/* CYCLING */}
                        <Col xs={12} sm={6} lg={3}>
                            <Card
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    borderRadius: "16px",
                                    minHeight: "160px",
                                    background: "#fffaf3",
                                    borderLeft: "5px solid #f59e0b",
                                }}
                            >
                                <CardBody className="p-3 p-md-4">
                                    <p
                                        className="fw-semibold mb-3"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px",
                                        }}
                                    >
                                        CYCLING
                                    </p>

                                    <div className="mb-2">
                                        <span
                                            style={{
                                                color: "#64748b",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                            }}
                                        >
                                            Today's Bill
                                        </span>

                                        <h4
                                            className="fw-bold mb-0"
                                            style={{
                                                color: "#92400e",
                                            }}
                                        >
                                            {cyclingTodayCount}
                                        </h4>
                                    </div>

                                    <div>
                                        <span
                                            style={{
                                                color: "#64748b",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                            }}
                                        >
                                            Today's Volume
                                        </span>

                                        <h5
                                            className="fw-bold mb-0"
                                            style={{
                                                color: "#92400e",
                                            }}
                                        >
                                            ₹ {totalCyclingTodayAmount?.toFixed(2)}
                                        </h5>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>


                        {/* TODAY'S TOTAL VOLUME */}
                        <Col xs={12} sm={6} lg={3}>
                            <Card
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    borderRadius: "16px",
                                    minHeight: "160px",
                                    background: "#f5fff8",
                                    borderLeft: "5px solid #22c55e",
                                }}
                            >
                                <CardBody className="p-3 p-md-4">
                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px",
                                        }}
                                    >
                                        Today's Total Volume
                                    </p>

                                    <h2
                                        className="fw-bold mb-0"
                                        style={{
                                            color: "#166534",
                                            fontSize: "27px",
                                        }}
                                    >
                                        ₹{" "}
                                        {role === "CSO"
                                            ? totalAmountSkatingAndCyclingToday
                                            : totalAmountForCurrentUserFamilyToday}
                                    </h2>
                                </CardBody>
                            </Card>
                        </Col>

                    </Row>
                )}


                {(role === "BDO" || role === "BDM" || role === "SD") && (
                    <>
                        <style>{`
                            .custom-dash-card {
                                transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
                            }
                            .custom-dash-card:hover {
                                transform: translateY(-4px);
                                box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.1) !important;
                            }
                        `}</style>

                        {/* PERFORMANCE OVERVIEW CARD */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} className="mb-4">
                            <Card
                                className="h-100 border-0 shadow-sm custom-dash-card"
                                style={{
                                    borderRadius: "16px",
                                    background: "#ffffff",
                                    border: "1px solid #e8edf3",
                                    overflow: "hidden",
                                }}
                            >
                                <CardBody className="p-3 p-md-4 d-flex flex-column justify-content-between">
                                    {/* TOP HEADER */}
                                    <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                        <div className="d-flex align-items-center gap-2">
                                            <div
                                                style={{
                                                    width: "34px",
                                                    height: "34px",
                                                    borderRadius: "10px",
                                                    background: "#eef2ff",
                                                    color: "#4f46e5",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontWeight: "700",
                                                    fontSize: "16px"
                                                }}
                                            >
                                                <i className="bx bx-trophy"></i>
                                            </div>
                                            <div>
                                                <span
                                                    style={{
                                                        fontSize: "10px",
                                                        color: "#94a3b8",
                                                        fontWeight: "700",
                                                        letterSpacing: "0.8px",
                                                        display: "block",
                                                        lineHeight: "1"
                                                    }}
                                                >
                                                    PERFORMANCE
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: "14px",
                                                        color: "#334155",
                                                        fontWeight: "700"
                                                    }}
                                                >
                                                    Overview
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* METRICS ROW */}
                                    <div className="d-flex align-items-center justify-content-between gap-2">
                                        {/* RANK */}
                                        <div
                                            className="flex-fill p-2 rounded-3"
                                            style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}
                                        >
                                            <div className="d-flex align-items-center justify-content-between mb-1">
                                                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>
                                                    Rank
                                                </span>
                                                <div
                                                    style={{
                                                        width: "24px",
                                                        height: "24px",
                                                        borderRadius: "7px",
                                                        background: "#eef2ff",
                                                        color: "#4f46e5",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontWeight: "800",
                                                        fontSize: "12px",
                                                    }}
                                                >
                                                    #
                                                </div>
                                            </div>
                                            <div style={{ fontSize: "22px", fontWeight: "800", color: "#4f46e5", lineHeight: "1.1" }}>
                                                {myOrderData?.rank ?? 0}
                                            </div>
                                        </div>

                                        {/* POINTS */}
                                        <div
                                            className="flex-fill p-2 rounded-3"
                                            style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}
                                        >
                                            <div className="d-flex align-items-center justify-content-between mb-1">
                                                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>
                                                    Points
                                                </span>
                                                <div
                                                    style={{
                                                        width: "24px",
                                                        height: "24px",
                                                        borderRadius: "7px",
                                                        background: "#ecfdf5",
                                                        color: "#059669",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontWeight: "800",
                                                        fontSize: "12px",
                                                    }}
                                                >
                                                    P
                                                </div>
                                            </div>
                                            <div style={{ fontSize: "22px", fontWeight: "800", color: "#059669", lineHeight: "1.1" }}>
                                                {myOrderData?.points ?? 0}
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                                {/* BOTTOM ACCENT GRADIENT */}
                                <div
                                    style={{
                                        height: "4px",
                                        width: "100%",
                                        background: "linear-gradient(90deg, #4f46e5 0%, #818cf8 48%, #10b981 52%, #34d399 100%)",
                                    }}
                                />
                            </Card>
                        </Col>

                        {/* WAITING FOR APPROVAL */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} className="mb-4">
                            <Card
                                onClick={() => navigate("/staff/order/list/")}
                                className="h-100 border-0 shadow-sm custom-dash-card"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                                    borderLeft: "5px solid #3b82f6",
                                    borderTop: "1px solid #e2e8f0",
                                    borderRight: "1px solid #e2e8f0",
                                    borderBottom: "1px solid #e2e8f0",
                                }}
                            >
                                <CardBody className="p-3 p-md-4 d-flex flex-column justify-content-between">
                                    <div>
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <p
                                                className="fw-semibold mb-0"
                                                style={{ color: "#475569", fontSize: "13px", letterSpacing: "0.3px" }}
                                            >
                                                Waiting For Approval
                                            </p>
                                            <div
                                                style={{
                                                    width: "34px",
                                                    height: "34px",
                                                    borderRadius: "10px",
                                                    backgroundColor: "#dbeafe",
                                                    color: "#1d4ed8",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "17px"
                                                }}
                                            >
                                                <i className="bx bx-time-five"></i>
                                            </div>
                                        </div>

                                        <h2
                                            className="fw-bold mb-3"
                                            style={{
                                                color: "#1e3a8a",
                                                fontSize: "26px",
                                                letterSpacing: "-0.5px"
                                            }}
                                        >
                                            ₹ {myOrderData?.invoice_created?.total_amount ? myOrderData.invoice_created.total_amount.toFixed(1) : "0.0"}
                                        </h2>
                                    </div>

                                    <div>
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                backgroundColor: "#dbeafe",
                                                color: "#1d4ed8",
                                                padding: "6px 12px",
                                                borderRadius: "8px",
                                                fontSize: "12px",
                                                fontWeight: "600"
                                            }}
                                        >
                                            Bills:&nbsp;
                                            <strong style={{ fontWeight: "700" }}>
                                                {myOrderData?.invoice_created?.count ?? 0}
                                            </strong>
                                        </span>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        {/* TODAYS BILLS */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} className="mb-4">
                            <Card
                                onClick={() => navigate("/staff/order/list/")}
                                className="h-100 border-0 shadow-sm custom-dash-card"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "linear-gradient(135deg, #ffffff 0%, #f5fdff 100%)",
                                    borderLeft: "5px solid #06b6d4",
                                    borderTop: "1px solid #e2e8f0",
                                    borderRight: "1px solid #e2e8f0",
                                    borderBottom: "1px solid #e2e8f0",
                                }}
                            >
                                <CardBody className="p-3 p-md-4 d-flex flex-column justify-content-between">
                                    <div>
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <p
                                                className="fw-semibold mb-0"
                                                style={{ color: "#475569", fontSize: "13px", letterSpacing: "0.3px" }}
                                            >
                                                Todays Bills
                                            </p>
                                            <div
                                                style={{
                                                    width: "34px",
                                                    height: "34px",
                                                    borderRadius: "10px",
                                                    backgroundColor: "#cffafe",
                                                    color: "#0e7490",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "17px"
                                                }}
                                            >
                                                <i className="bx bx-receipt"></i>
                                            </div>
                                        </div>

                                        <h2
                                            className="fw-bold mb-3"
                                            style={{
                                                color: "#155e75",
                                                fontSize: "26px",
                                                letterSpacing: "-0.5px"
                                            }}
                                        >
                                            ₹ {myOrderData?.today_orders?.total_amount ? myOrderData.today_orders.total_amount.toFixed(1) : "0.0"}
                                        </h2>
                                    </div>

                                    <div>
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                backgroundColor: "#cffafe",
                                                color: "#0e7490",
                                                padding: "6px 12px",
                                                borderRadius: "8px",
                                                fontSize: "12px",
                                                fontWeight: "600"
                                            }}
                                        >
                                            Bills:&nbsp;
                                            <strong style={{ fontWeight: "700" }}>
                                                {myOrderData?.today_orders?.count ?? 0}
                                            </strong>
                                        </span>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        {/* CURRENT MONTH BILLS */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} className="mb-4">
                            <Card
                                onClick={() => navigate("/staff/order/list/")}
                                className="h-100 border-0 shadow-sm custom-dash-card"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "linear-gradient(135deg, #ffffff 0%, #fffaf3 100%)",
                                    borderLeft: "5px solid #f59e0b",
                                    borderTop: "1px solid #e2e8f0",
                                    borderRight: "1px solid #e2e8f0",
                                    borderBottom: "1px solid #e2e8f0",
                                }}
                            >
                                <CardBody className="p-3 p-md-4 d-flex flex-column justify-content-between">
                                    <div>
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <p
                                                className="fw-semibold mb-0"
                                                style={{ color: "#475569", fontSize: "13px", letterSpacing: "0.3px" }}
                                            >
                                                Current Month Bills
                                            </p>
                                            <div
                                                style={{
                                                    width: "34px",
                                                    height: "34px",
                                                    borderRadius: "10px",
                                                    backgroundColor: "#fef3c7",
                                                    color: "#b45309",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "17px"
                                                }}
                                            >
                                                <i className="bx bx-calendar-event"></i>
                                            </div>
                                        </div>

                                        <h2
                                            className="fw-bold mb-3"
                                            style={{
                                                color: "#92400e",
                                                fontSize: "26px",
                                                letterSpacing: "-0.5px"
                                            }}
                                        >
                                            ₹ {myOrderData?.current_month_orders?.total_amount ? myOrderData.current_month_orders.total_amount.toFixed(1) : "0.0"}
                                        </h2>
                                    </div>

                                    <div>
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                backgroundColor: "#fef3c7",
                                                color: "#b45309",
                                                padding: "6px 12px",
                                                borderRadius: "8px",
                                                fontSize: "12px",
                                                fontWeight: "600"
                                            }}
                                        >
                                            Bills:&nbsp;
                                            <strong style={{ fontWeight: "700" }}>
                                                {myOrderData?.current_month_orders?.count ?? 0}
                                            </strong>
                                        </span>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        {/* ORDERS */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} className="mb-4">
                            <Card
                                onClick={() => navigate("/staff/order/list/")}
                                className="h-100 border-0 shadow-sm custom-dash-card"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
                                    borderLeft: "5px solid #6366f1",
                                    borderTop: "1px solid #e2e8f0",
                                    borderRight: "1px solid #e2e8f0",
                                    borderBottom: "1px solid #e2e8f0",
                                }}
                            >
                                <CardBody className="p-3 p-md-4 d-flex flex-column justify-content-between">
                                    <div>
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <p
                                                className="fw-semibold mb-0"
                                                style={{ color: "#475569", fontSize: "13px", letterSpacing: "0.3px" }}
                                            >
                                                ORDERS
                                            </p>
                                            <div
                                                style={{
                                                    width: "34px",
                                                    height: "34px",
                                                    borderRadius: "10px",
                                                    backgroundColor: "#e0e7ff",
                                                    color: "#4338ca",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "17px"
                                                }}
                                            >
                                                <i className="bx bx-shopping-bag"></i>
                                            </div>
                                        </div>

                                        <h2
                                            className="fw-bold mb-3"
                                            style={{
                                                color: "#312e81",
                                                fontSize: "26px",
                                                letterSpacing: "-0.5px"
                                            }}
                                        >
                                            Orders
                                        </h2>
                                    </div>

                                    <div>
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                backgroundColor: "#e0e7ff",
                                                color: "#4338ca",
                                                padding: "6px 12px",
                                                borderRadius: "8px",
                                                fontSize: "12px",
                                                fontWeight: "600"
                                            }}
                                        >
                                            View Orders <i className="bx bx-right-arrow-alt font-size-14"></i>
                                        </span>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        {/* CUSTOMERS */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} className="mb-4">
                            <Card
                                onClick={() => navigate("/all/staff/customers/")}
                                className="h-100 border-0 shadow-sm custom-dash-card"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
                                    borderLeft: "5px solid #10b981",
                                    borderTop: "1px solid #e2e8f0",
                                    borderRight: "1px solid #e2e8f0",
                                    borderBottom: "1px solid #e2e8f0",
                                }}
                            >
                                <CardBody className="p-3 p-md-4 d-flex flex-column justify-content-between">
                                    <div>
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <p
                                                className="fw-semibold mb-0"
                                                style={{ color: "#475569", fontSize: "13px", letterSpacing: "0.3px" }}
                                            >
                                                CUSTOMERS
                                            </p>
                                            <div
                                                style={{
                                                    width: "34px",
                                                    height: "34px",
                                                    borderRadius: "10px",
                                                    backgroundColor: "#d1fae5",
                                                    color: "#047857",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "17px"
                                                }}
                                            >
                                                <i className="bx bx-group"></i>
                                            </div>
                                        </div>

                                        <h2
                                            className="fw-bold mb-3"
                                            style={{
                                                color: "#064e3b",
                                                fontSize: "26px",
                                                letterSpacing: "-0.5px"
                                            }}
                                        >
                                            Customers
                                        </h2>
                                    </div>

                                    <div>
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                backgroundColor: "#d1fae5",
                                                color: "#047857",
                                                padding: "6px 12px",
                                                borderRadius: "8px",
                                                fontSize: "12px",
                                                fontWeight: "600"
                                            }}
                                        >
                                            View Customers <i className="bx bx-right-arrow-alt font-size-14"></i>
                                        </span>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </>
                )}
            </Row>
        </React.Fragment>
    );
}

export default ChartSection;