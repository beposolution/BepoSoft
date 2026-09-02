import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardBody, Col, Row, } from "reactstrap";
import { ToastContainer, toast, } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CandidateSection = () => {

    const token = localStorage.getItem("token");
    const [loading, setLoading] = useState(false);
    const [todaySummary, setTodaySummary] = useState({});
    const [monthSummary, setMonthSummary] = useState({});
    const [role, setRole] = useState(null);

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

    const formatDate = (date) => {
        const year = date.getFullYear();

        const month = String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

        const day = String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

        return `${year}-${month}-${day}`;
    };

    const fetchDailyReportSummary = async () => {

        if (!token) {
            toast.error("Authentication token not found");
            return;
        }

        setLoading(true);

        try {
            const now = new Date();
            const today = formatDate(now);

            const firstDayOfMonth = formatDate(
                new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1
                )
            );

            const apiUrl =
                `${import.meta.env.VITE_APP_KEY}` +
                `sales/team/member/daily/report/add/`;

            const todayRequest = axios.get(
                apiUrl,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        "Cache-Control": "no-cache",
                    },

                    params: {
                        start_date: today,
                        end_date: today,
                    },
                }
            );

            const monthRequest = axios.get(
                apiUrl,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        "Cache-Control": "no-cache",
                    },

                    params: {
                        start_date: firstDayOfMonth,
                        end_date: today,
                    },
                }
            );

            const [
                todayResponse,
                monthResponse,
            ] = await Promise.all([
                todayRequest,
                monthRequest,
            ]);

            const todayData =
                todayResponse?.data?.results?.summary || {};

            const monthData =
                monthResponse?.data?.results?.summary || {};

            setTodaySummary(todayData);
            setMonthSummary(monthData);

        } catch (error) {

            console.error(
                "DAILY REPORT SUMMARY ERROR:",
                error
            );

            console.error(
                "ERROR RESPONSE:",
                error?.response?.data
            );

            toast.error(
                error?.response?.data?.message ||
                "Failed to fetch daily report summary"
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDailyReportSummary();
    }, [token]);

    const formatNumber = (value) => {
        const number = Number(value || 0);

        return number.toLocaleString(
            "en-IN"
        );
    };


    const formatAmount = (value) => {
        const number = Number(value || 0);

        return `₹${number.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }
        )}`;
    };


    const formatDecimal = (value) => {
        const number = Number(value || 0);

        return number
            .toFixed(2)
            .replace(
                /\.00$/,
                ""
            );
    };

    const formatDuration = (value) => {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "00:00:00";
        }
        return value;
    };


    const cards = [
        {
            key: "active_count",
            title: "Active Call",

            monthValue: formatNumber(
                monthSummary?.active_count
            ),

            todayValue: formatNumber(
                todaySummary?.active_count
            ),

            background: "#f8fbff",
            border: "#3b82f6",
            titleColor: "#475569",
            valueColor: "#1e3a8a",
            badgeBackground: "#dbeafe",
            badgeColor: "#1d4ed8",
        },

        {
            key: "productive_count",
            title: "Productive Call",

            monthValue: formatNumber(
                monthSummary?.productive_count
            ),

            todayValue: formatNumber(
                todaySummary?.productive_count
            ),

            background: "#f5fff8",
            border: "#22c55e",
            titleColor: "#475569",
            valueColor: "#166534",
            badgeBackground: "#dcfce7",
            badgeColor: "#15803d",
        },

        {
            key: "new_leads",
            title: "New Leads",

            monthValue: formatNumber(
                monthSummary?.new_leads
            ),

            todayValue: formatNumber(
                todaySummary?.new_leads
            ),

            background: "#faf8ff",
            border: "#8b5cf6",
            titleColor: "#475569",
            valueColor: "#5b21b6",
            badgeBackground: "#ede9fe",
            badgeColor: "#7c3aed",
        },

        {
            key: "call_duration_average_8hrs",
            title: "Avg CD",

            monthValue: `${formatDecimal(
                monthSummary?.call_duration_average_8hrs
            )}%`,

            todayValue: `${formatDecimal(
                todaySummary?.call_duration_average_8hrs
            )}%`,

            background: "#fffaf3",
            border: "#f59e0b",
            titleColor: "#475569",
            valueColor: "#92400e",
            badgeBackground: "#fef3c7",
            badgeColor: "#b45309",
        },
    ];

    const allowedRoles = ["BDM", "BDO", "SD"];

    if (!allowedRoles.includes(role)) {
        return null;
    }


    return (
        <>
            <ToastContainer />

            <div
                style={{
                    width: "100%",
                    padding: "16px",
                }}
            >

                {loading ? (

                    <div
                        className="text-center"
                        style={{
                            padding: "50px 20px",
                            fontWeight: "600",
                            color: "#64748b",
                        }}
                    >
                        Loading daily report summary...
                    </div>

                ) : (

                    <>

                        <div
                            style={{
                                background: "#ffffff",
                                borderRadius: "14px",
                                padding: "14px 20px",
                                marginBottom: "16px",
                                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)",
                                border: "1px solid #edf2f7",
                                textAlign: "center",
                            }}
                        >
                            <h4
                                style={{
                                    margin: 0,
                                    fontSize: "20px",
                                    fontWeight: "800",
                                    color: "#1e293b",
                                }}
                            >
                                CD Call Duration
                            </h4>
                        </div>

                        <Row className="g-3 mb-3">

                            {cards.map((card) => (

                                <Col
                                    key={card.key}
                                    xs={12}
                                    sm={6}
                                    md={6}
                                    lg={4}
                                    xl={3}
                                >

                                    <Card
                                        className="h-100 border-0 shadow-sm"
                                        style={{
                                            borderRadius: "16px",
                                            minHeight: "155px",
                                            background:
                                                card.background,

                                            borderLeft:
                                                `5px solid ${card.border}`,

                                            overflow: "hidden",
                                        }}
                                    >

                                        <CardBody className="p-3 p-md-4">

                                            <p
                                                className="fw-semibold mb-2"
                                                style={{
                                                    color:
                                                        card.titleColor,
                                                    fontSize: "14px",
                                                }}
                                            >
                                                {card.title}
                                            </p>

                                            <div className="mb-2">

                                                <span
                                                    style={{
                                                        color: "#64748b",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                    }}
                                                >
                                                    This Month
                                                </span>

                                                <h2
                                                    className="fw-bold mb-3"
                                                    style={{
                                                        color:
                                                            card.valueColor,

                                                        fontSize: "30px",

                                                        lineHeight: "1.2",

                                                        wordBreak:
                                                            "break-word",
                                                    }}
                                                >
                                                    {card.monthValue}
                                                </h2>

                                                <span
                                                    style={{
                                                        display:
                                                            "inline-flex",

                                                        alignItems:
                                                            "center",

                                                        backgroundColor:
                                                            card.badgeBackground,

                                                        color:
                                                            card.badgeColor,

                                                        padding:
                                                            "7px 12px",

                                                        borderRadius:
                                                            "8px",

                                                        fontSize:
                                                            "13px",

                                                        fontWeight:
                                                            "500",
                                                    }}
                                                >
                                                    Today:&nbsp;

                                                    <strong
                                                        style={{
                                                            fontWeight:
                                                                "700",
                                                        }}
                                                    >
                                                        {card.todayValue}
                                                    </strong>
                                                </span>

                                            </div>

                                        </CardBody>

                                    </Card>

                                </Col>

                            ))}

                        </Row>
                    </>

                )}

            </div>
        </>
    );
};

export default CandidateSection;