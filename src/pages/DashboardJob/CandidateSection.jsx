import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, CardBody, Col, Row } from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CandidateSection = () => {
    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedHourSlot, setSelectedHourSlot] = useState("");
    const [startDate, setStartDate] = useState(getTodayDate());
    const [endDate, setEndDate] = useState(getTodayDate());
    const [role, setRole] = useState("");
    const token = localStorage.getItem("token");

    useEffect(() => {
        const storedRole = localStorage.getItem("active");
        setRole(storedRole);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) {
                toast.error("Token not found");
                return;
            }

            if (!startDate || !endDate) {
                toast.error("Please select both start date and end date");
                return;
            }

            setLoading(true);
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}my/sales/team/detailed/summary/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        params: {
                            start_date: startDate,
                            end_date: endDate,
                            ...(selectedHourSlot ? { time_duration: selectedHourSlot } : {}),
                        },
                    }
                );

                setData(response?.data?.data || []);
            } catch (error) {
                console.error(error);
                toast.error("Error fetching data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, startDate, endDate, selectedHourSlot]);

    const teamData = data?.[0] || {};
    const team = teamData?.team || {};
    const summary = teamData?.summary || {};
    const members = Array.isArray(teamData?.members) ? teamData.members : [];

    const formatDoubleValue = (value) => {
        const number = Number(value || 0);
        return number.toFixed(2).replace(/\.00$/, "");
    };

    const getBusinessHourValue = (hour) => {
        const numericHour = Number(hour);

        if (numericHour >= 9 && numericHour <= 12) return numericHour;
        if (numericHour >= 1 && numericHour <= 8) return numericHour + 12;
        if (numericHour === 0) return 12;

        return numericHour;
    };

    const sortHourSlots = (slots = []) => {
        return [...slots].sort((a, b) => {
            const [aStart] = a.split("-");
            const [bStart] = b.split("-");
            const [aHour] = aStart.split(":");
            const [bHour] = bStart.split(":");

            return getBusinessHourValue(aHour) - getBusinessHourValue(bHour);
        });
    };

    const hourSlots = useMemo(() => {
        let slots = Object.keys(summary?.hourly_durations || {});

        if (slots.length === 0 && members.length > 0) {
            slots = Object.keys(members?.[0]?.summary?.hourly_durations || {});
        }

        if (slots.length === 0) {
            slots = [
                "09:00-10:00",
                "10:00-11:00",
                "11:00-12:00",
                "12:00-01:00",
                "01:00-02:00",
                "02:00-03:00",
                "03:00-04:00",
                "04:00-05:00",
                "05:00-06:00",
                "06:00-07:00",
            ];
        }

        return sortHourSlots(slots);
    }, [summary, members]);

    const formatHourSlotLabel = (slot) => {
        if (!slot || !slot.includes("-")) return slot;

        const [start, end] = slot.split("-");

        const formatBusinessTime = (timeStr) => {
            if (!timeStr) return "";

            const [hourStr, minuteStr = "00"] = timeStr.split(":");
            const hour = Number(hourStr);
            const minute = Number(minuteStr);

            let displayHour = hour;
            let period = "AM";

            if (hour === 9 || hour === 10 || hour === 11) {
                displayHour = hour;
                period = "AM";
            } else if (hour === 12) {
                displayHour = 12;
                period = "PM";
            } else if (hour >= 1 && hour <= 8) {
                displayHour = hour;
                period = "PM";
            } else if (hour === 0) {
                displayHour = 12;
                period = "AM";
            } else if (hour > 12) {
                displayHour = hour % 12;
                if (displayHour === 0) displayHour = 12;
                period = "PM";
            }

            return `${displayHour}${minute > 0 ? `:${String(minute).padStart(2, "0")}` : ""} ${period}`;
        };

        return `${formatBusinessTime(start)} - ${formatBusinessTime(end)}`;
    };

    const getAttendanceStatus = (member) => {
        const attendanceDetails = Array.isArray(member?.attendance_details)
            ? member.attendance_details
            : [];

        if (attendanceDetails.length === 0) return "Not Marked";

        const latestAttendance = attendanceDetails[0];
        const rawStatus = (latestAttendance?.status || "").toLowerCase();

        if (rawStatus === "present") return "Present";
        if (rawStatus === "half_day") return "Half Day";
        return "Absent";
    };

    const getAttendanceStatusColor = (status) => {
        if (status === "Present") {
            return {
                color: "#16a34a",
                bg: "rgba(22, 163, 74, 0.10)",
                border: "rgba(22, 163, 74, 0.18)",
            };
        }

        if (status === "Half Day") {
            return {
                color: "#ea580c",
                bg: "rgba(234, 88, 12, 0.10)",
                border: "rgba(234, 88, 12, 0.18)",
            };
        }

        if (status === "Absent") {
            return {
                color: "#dc2626",
                bg: "rgba(220, 38, 38, 0.10)",
                border: "rgba(220, 38, 38, 0.18)",
            };
        }

        return {
            color: "#64748b",
            bg: "rgba(100, 116, 139, 0.10)",
            border: "rgba(100, 116, 139, 0.18)",
        };
    };

    const selectedTeamHourDuration =
        selectedHourSlot && summary?.hourly_durations
            ? Number(summary?.hourly_durations?.[selectedHourSlot] || 0)
            : null;

    const sectionTitleStyle = {
        margin: 0,
        fontWeight: 800,
        fontSize: "22px",
        color: "#0f172a",
        letterSpacing: "-0.3px",
    };

    const sectionSubtitleStyle = {
        fontSize: "13px",
        color: "#64748b",
        marginTop: "4px",
        fontWeight: 500,
    };

    const filterInputStyle = {
        width: "100%",
        height: "46px",
        borderRadius: "14px",
        padding: "0 14px",
        border: "1px solid #dbe4f0",
        outline: "none",
        fontSize: "13px",
        fontWeight: 600,
        background: "#ffffff",
        color: "#0f172a",
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
    };

    const buildKpiCard = ({ title, value, sub, accent, icon }) => {
        return (
            <div
                style={{
                    background: "#ffffff",
                    borderRadius: "22px",
                    padding: "18px",
                    border: "1px solid #e8eef6",
                    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.05)",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "4px",
                        background: accent,
                    }}
                />
                <div
                    style={{
                        width: "46px",
                        height: "46px",
                        borderRadius: "14px",
                        background: `${accent}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "14px",
                        color: accent,
                        fontSize: "18px",
                        fontWeight: 900,
                    }}
                >
                    {icon}
                </div>
                <div
                    style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "8px",
                    }}
                >
                    {title}
                </div>
                <div
                    style={{
                        fontSize: "28px",
                        fontWeight: 800,
                        color: "#0f172a",
                        lineHeight: 1.1,
                        marginBottom: "8px",
                    }}
                >
                    {value}
                </div>
                <div
                    style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                        fontWeight: 500,
                    }}
                >
                    {sub}
                </div>
            </div>
        );
    };

    const buildMiniStat = ({ label, value, color, bg }) => {
        return (
            <div
                style={{
                    background: bg || "#f8fafc",
                    borderRadius: "16px",
                    padding: "14px 15px",
                    border: "1px solid #e8eef6",
                    height: "100%",
                }}
            >
                <div
                    style={{
                        fontSize: "12px",
                        color: "#64748b",
                        fontWeight: 700,
                        marginBottom: "7px",
                    }}
                >
                    {label}
                </div>
                <div
                    style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: color || "#0f172a",
                        lineHeight: 1.2,
                    }}
                >
                    {value}
                </div>
            </div>
        );
    };

    if (role !== "BDM" && role !== "SD" && role !== "ASD") return null;

    return (
        <>
            <ToastContainer />
            <div
                style={{
                    minHeight: "100vh",
                    padding: "24px",
                    background:
                        "linear-gradient(180deg, #eef4fb 0%, #f8fbff 35%, #f5f8fc 100%)",
                }}
            >
                <Row>
                    <Col xl={12}>
                        <Card
                            style={{
                                border: "none",
                                borderRadius: "30px",
                                overflow: "hidden",
                                background: "transparent",
                                boxShadow: "none",
                            }}
                        >
                            <CardBody style={{ padding: 0 }}>
                                {loading ? (
                                    <div
                                        className="text-center py-5"
                                        style={{
                                            background: "#ffffff",
                                            borderRadius: "28px",
                                            border: "1px solid #e8eef6",
                                            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
                                            fontSize: "16px",
                                            fontWeight: 700,
                                            color: "#64748b",
                                            padding: "60px 20px",
                                        }}
                                    >
                                        Loading dashboard...
                                    </div>
                                ) : !teamData || Object.keys(teamData).length === 0 ? (
                                    <div
                                        className="text-center py-5"
                                        style={{
                                            background: "#ffffff",
                                            borderRadius: "28px",
                                            border: "1px solid #e8eef6",
                                            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
                                            fontSize: "16px",
                                            fontWeight: 700,
                                            color: "#64748b",
                                            padding: "60px 20px",
                                        }}
                                    >
                                        No team summary available
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #0f172a 0%, #173f7a 50%, #1d78d6 100%)",
                                                borderRadius: "30px",
                                                padding: "26px",
                                                color: "#ffffff",
                                                boxShadow: "0 18px 45px rgba(15, 23, 42, 0.18)",
                                                position: "relative",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: "-80px",
                                                    right: "-80px",
                                                    width: "220px",
                                                    height: "220px",
                                                    borderRadius: "50%",
                                                    background: "rgba(255,255,255,0.08)",
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    bottom: "-50px",
                                                    left: "-50px",
                                                    width: "170px",
                                                    height: "170px",
                                                    borderRadius: "50%",
                                                    background: "rgba(255,255,255,0.06)",
                                                }}
                                            />

                                            <Row className="g-4 align-items-stretch" style={{ position: "relative", zIndex: 2 }}>
                                                <Col xl={7} lg={7} md={12}>
                                                    <div
                                                        style={{
                                                            height: "100%",
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            justifyContent: "space-between",
                                                        }}
                                                    >
                                                        <div>
                                                            <div
                                                                style={{
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    padding: "7px 14px",
                                                                    borderRadius: "999px",
                                                                    background: "rgba(255,255,255,0.12)",
                                                                    border: "1px solid rgba(255,255,255,0.16)",
                                                                    fontSize: "11px",
                                                                    fontWeight: 800,
                                                                    letterSpacing: "0.8px",
                                                                    textTransform: "uppercase",
                                                                    marginBottom: "14px",
                                                                }}
                                                            >
                                                                Performance Dashboard
                                                            </div>

                                                            <h2
                                                                style={{
                                                                    margin: 0,
                                                                    fontWeight: 800,
                                                                    fontSize: "30px",
                                                                    lineHeight: 1.15,
                                                                    color: "#ffffff",
                                                                }}
                                                            >
                                                                {team?.team_name || "Team Dashboard"}
                                                            </h2>

                                                            <div
                                                                style={{
                                                                    marginTop: "10px",
                                                                    fontSize: "14px",
                                                                    lineHeight: 1.7,
                                                                    color: "rgba(255,255,255,0.80)",
                                                                    maxWidth: "600px",
                                                                    fontWeight: 500,
                                                                }}
                                                            >
                                                                Track overall team performance, call duration, member-level metrics,
                                                                and attendance from one dashboard.
                                                            </div>
                                                        </div>

                                                        <div
                                                            style={{
                                                                marginTop: "20px",
                                                                display: "flex",
                                                                flexWrap: "wrap",
                                                                gap: "10px",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    padding: "10px 14px",
                                                                    borderRadius: "14px",
                                                                    background: "rgba(255,255,255,0.10)",
                                                                    border: "1px solid rgba(255,255,255,0.15)",
                                                                    fontSize: "12px",
                                                                    fontWeight: 700,
                                                                    color: "#ffffff",
                                                                }}
                                                            >
                                                                Date: {startDate} to {endDate}
                                                            </div>

                                                            <div
                                                                style={{
                                                                    padding: "10px 14px",
                                                                    borderRadius: "14px",
                                                                    background: "rgba(255,255,255,0.10)",
                                                                    border: "1px solid rgba(255,255,255,0.15)",
                                                                    fontSize: "12px",
                                                                    fontWeight: 700,
                                                                    color: "#ffffff",
                                                                }}
                                                            >
                                                                {selectedHourSlot
                                                                    ? `Slot: ${formatHourSlotLabel(selectedHourSlot)}`
                                                                    : "Slot: Full Summary"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Col>

                                                <Col xl={5} lg={5} md={12}>
                                                    <div
                                                        style={{
                                                            height: "100%",
                                                            background: "rgba(255,255,255,0.10)",
                                                            border: "1px solid rgba(255,255,255,0.14)",
                                                            borderRadius: "22px",
                                                            padding: "18px",
                                                            backdropFilter: "blur(10px)",
                                                            WebkitBackdropFilter: "blur(10px)",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize: "15px",
                                                                fontWeight: 800,
                                                                color: "#ffffff",
                                                                marginBottom: "14px",
                                                            }}
                                                        >
                                                            Filters
                                                        </div>

                                                        <Row className="g-3">
                                                            <Col md={6}>
                                                                <label
                                                                    style={{
                                                                        fontSize: "12px",
                                                                        fontWeight: 700,
                                                                        marginBottom: "6px",
                                                                        display: "block",
                                                                        color: "rgba(255,255,255,0.90)",
                                                                    }}
                                                                >
                                                                    Start Date
                                                                </label>
                                                                <input
                                                                    type="date"
                                                                    value={startDate}
                                                                    onChange={(e) => setStartDate(e.target.value)}
                                                                    style={filterInputStyle}
                                                                />
                                                            </Col>

                                                            <Col md={6}>
                                                                <label
                                                                    style={{
                                                                        fontSize: "12px",
                                                                        fontWeight: 700,
                                                                        marginBottom: "6px",
                                                                        display: "block",
                                                                        color: "rgba(255,255,255,0.90)",
                                                                    }}
                                                                >
                                                                    End Date
                                                                </label>
                                                                <input
                                                                    type="date"
                                                                    value={endDate}
                                                                    min={startDate}
                                                                    onChange={(e) => setEndDate(e.target.value)}
                                                                    style={filterInputStyle}
                                                                />
                                                            </Col>

                                                            <Col md={12}>
                                                                <label
                                                                    style={{
                                                                        fontSize: "12px",
                                                                        fontWeight: 700,
                                                                        marginBottom: "6px",
                                                                        display: "block",
                                                                        color: "rgba(255,255,255,0.90)",
                                                                    }}
                                                                >
                                                                    Time Duration
                                                                </label>
                                                                <select
                                                                    value={selectedHourSlot}
                                                                    onChange={(e) => setSelectedHourSlot(e.target.value)}
                                                                    style={filterInputStyle}
                                                                >
                                                                    <option value="">Select Time Duration</option>
                                                                    {hourSlots.map((slot) => (
                                                                        <option key={slot} value={slot}>
                                                                            {formatHourSlotLabel(slot)}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </Col>
                                                        </Row>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        <div style={{ marginTop: "24px" }}>
                                            <Row className="g-4">
                                                <Col xl={2} lg={4} md={6} sm={6}>
                                                    {buildKpiCard({
                                                        title: "Team Bill",
                                                        value: summary?.total_bill ?? 0,
                                                        sub: "Complete billed value",
                                                        accent: "#2563eb",
                                                        icon: "C",
                                                    })}
                                                </Col>

                                                <Col xl={2} lg={4} md={6} sm={6}>
                                                    {buildKpiCard({
                                                        title: "Team Volume",
                                                        value: summary?.total_volume ?? 0,
                                                        sub: "Complete team volume",
                                                        accent: "#16a34a",
                                                        icon: "₹",
                                                    })}
                                                </Col>

                                                <Col xl={2} lg={4} md={6} sm={6}>
                                                    {buildKpiCard({
                                                        title: selectedHourSlot ? "Selected Hour CD" : "Total Team CD",
                                                        value: selectedHourSlot
                                                            ? `${formatDoubleValue(selectedTeamHourDuration)} mins`
                                                            : `${formatDoubleValue(summary?.total_call_duration ?? 0)} mins`,
                                                        sub: selectedHourSlot
                                                            ? "Duration for selected slot"
                                                            : "Total team call duration",
                                                        accent: "#7c3aed",
                                                        icon: "CD",
                                                    })}
                                                </Col>

                                                <Col xl={2} lg={4} md={6} sm={6}>
                                                    {buildKpiCard({
                                                        title: "Total Calls",
                                                        value: summary?.total_call_count ?? 0,
                                                        sub: "Calls completed",
                                                        accent: "#dc2626",
                                                        icon: "C",
                                                    })}
                                                </Col>

                                                <Col xl={2} lg={4} md={6} sm={6}>
                                                    {buildKpiCard({
                                                        title: "Average CD",
                                                        value: `${formatDoubleValue(summary?.call_duration_average ?? 0)} mins`,
                                                        sub: "Average call duration",
                                                        accent: "#ea580c",
                                                        icon: "AVG",
                                                    })}
                                                </Col>

                                                <Col xl={2} lg={4} md={6} sm={6}>
                                                    {buildKpiCard({
                                                        title: "Members",
                                                        value: members.length,
                                                        sub: "Total listed members",
                                                        accent: "#0891b2",
                                                        icon: "M",
                                                    })}
                                                </Col>
                                            </Row>
                                        </div>

                                        <div
                                            style={{
                                                marginTop: "28px",
                                                background: "#ffffff",
                                                borderRadius: "28px",
                                                padding: "24px",
                                                border: "1px solid #e8eef6",
                                                boxShadow: "0 14px 35px rgba(15, 23, 42, 0.05)",
                                            }}
                                        >
                                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                                                <div>
                                                    <h4 style={sectionTitleStyle}>Team Members</h4>
                                                    <div style={sectionSubtitleStyle}>
                                                        Individual performance summary for each team member
                                                    </div>
                                                </div>
                                            </div>

                                            <Row className="g-4">
                                                {members.length > 0 ? (
                                                    members.map((member, index) => {
                                                        const memberSummary = member?.summary || {};
                                                        const memberHourlyDurations =
                                                            memberSummary?.hourly_durations || {};
                                                        const selectedHourValue = selectedHourSlot
                                                            ? Number(memberHourlyDurations?.[selectedHourSlot] || 0)
                                                            : null;

                                                        return (
                                                            <Col xl={6} key={member?.staff_id || index}>
                                                                <div
                                                                    style={{
                                                                        background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
                                                                        border: "1px solid #e8eef6",
                                                                        borderRadius: "24px",
                                                                        padding: "20px",
                                                                        boxShadow: "0 10px 25px rgba(15, 23, 42, 0.04)",
                                                                        height: "100%",
                                                                    }}
                                                                >
                                                                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                                                                        <div>
                                                                            <div
                                                                                style={{
                                                                                    display: "inline-flex",
                                                                                    alignItems: "center",
                                                                                    padding: "5px 10px",
                                                                                    borderRadius: "999px",
                                                                                    background: "#eff6ff",
                                                                                    color: "#2563eb",
                                                                                    fontSize: "11px",
                                                                                    fontWeight: 800,
                                                                                    marginBottom: "10px",
                                                                                }}
                                                                            >
                                                                                Member {index + 1}
                                                                            </div>
                                                                            <div
                                                                                style={{
                                                                                    fontSize: "20px",
                                                                                    fontWeight: 800,
                                                                                    color: "#0f172a",
                                                                                }}
                                                                            >
                                                                                {member?.staff_name || "-"}
                                                                            </div>
                                                                        </div>

                                                                        <div
                                                                            style={{
                                                                                padding: "8px 12px",
                                                                                borderRadius: "12px",
                                                                                background: "#f8fafc",
                                                                                color: "#475569",
                                                                                fontSize: "12px",
                                                                                fontWeight: 700,
                                                                                border: "1px solid #e2e8f0",
                                                                            }}
                                                                        >
                                                                            {selectedHourSlot
                                                                                ? formatHourSlotLabel(selectedHourSlot)
                                                                                : "Full Summary"}
                                                                        </div>
                                                                    </div>

                                                                    <Row className="g-3">
                                                                        <Col md={6}>
                                                                            {buildMiniStat({
                                                                                label: selectedHourSlot
                                                                                    ? "Selected Hour CD"
                                                                                    : "Total CD",
                                                                                value: selectedHourSlot
                                                                                    ? `${formatDoubleValue(selectedHourValue)} mins`
                                                                                    : `${formatDoubleValue(
                                                                                          memberSummary?.total_call_duration ?? 0
                                                                                      )} mins`,
                                                                                color: "#1d4ed8",
                                                                                bg: "#eff6ff",
                                                                            })}
                                                                        </Col>

                                                                        <Col md={6}>
                                                                            {buildMiniStat({
                                                                                label: "Calls",
                                                                                value: memberSummary?.total_call_count ?? 0,
                                                                                color: "#7c3aed",
                                                                                bg: "#faf5ff",
                                                                            })}
                                                                        </Col>

                                                                        <Col md={6}>
                                                                            {buildMiniStat({
                                                                                label: "Bill",
                                                                                value: memberSummary?.total_bill ?? 0,
                                                                                color: "#dc2626",
                                                                                bg: "#fef2f2",
                                                                            })}
                                                                        </Col>

                                                                        <Col md={6}>
                                                                            {buildMiniStat({
                                                                                label: "Volume",
                                                                                value: memberSummary?.total_volume ?? 0,
                                                                                color: "#059669",
                                                                                bg: "#ecfdf5",
                                                                            })}
                                                                        </Col>
                                                                    </Row>
                                                                </div>
                                                            </Col>
                                                        );
                                                    })
                                                ) : (
                                                    <Col xl={12}>
                                                        <div
                                                            style={{
                                                                background: "#ffffff",
                                                                borderRadius: "20px",
                                                                padding: "30px",
                                                                border: "1px solid #edf1f7",
                                                                textAlign: "center",
                                                                color: "#64748b",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            No team member data available
                                                        </div>
                                                    </Col>
                                                )}
                                            </Row>
                                        </div>

                                        <div
                                            style={{
                                                marginTop: "28px",
                                                background: "#ffffff",
                                                borderRadius: "28px",
                                                border: "1px solid #e8eef6",
                                                overflow: "hidden",
                                                boxShadow: "0 14px 35px rgba(15, 23, 42, 0.05)",
                                            }}
                                        >
                                            <div style={{ padding: "24px 24px 14px 24px" }}>
                                                <h4 style={sectionTitleStyle}>Attendance Overview</h4>
                                                <div style={sectionSubtitleStyle}>
                                                    Daily attendance status of all team members
                                                </div>
                                            </div>

                                            <div className="table-responsive">
                                                <table className="table align-middle mb-0" style={{ marginBottom: 0 }}>
                                                    <thead>
                                                        <tr style={{ background: "#f8fbff" }}>
                                                            <th
                                                                style={{
                                                                    padding: "16px 20px",
                                                                    fontSize: "13px",
                                                                    color: "#475569",
                                                                    fontWeight: 800,
                                                                    borderBottom: "1px solid #e2e8f0",
                                                                }}
                                                            >
                                                                #
                                                            </th>
                                                            <th
                                                                style={{
                                                                    padding: "16px 20px",
                                                                    fontSize: "13px",
                                                                    color: "#475569",
                                                                    fontWeight: 800,
                                                                    borderBottom: "1px solid #e2e8f0",
                                                                }}
                                                            >
                                                                Staff Name
                                                            </th>
                                                            <th
                                                                style={{
                                                                    padding: "16px 20px",
                                                                    fontSize: "13px",
                                                                    color: "#475569",
                                                                    fontWeight: 800,
                                                                    borderBottom: "1px solid #e2e8f0",
                                                                }}
                                                            >
                                                                Status
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {members.length > 0 ? (
                                                            members.map((member, index) => {
                                                                const status = getAttendanceStatus(member);
                                                                const statusStyle =
                                                                    getAttendanceStatusColor(status);

                                                                return (
                                                                    <tr key={member?.staff_id || index}>
                                                                        <td
                                                                            style={{
                                                                                padding: "16px 20px",
                                                                                fontWeight: 700,
                                                                                color: "#64748b",
                                                                                borderBottom: "1px solid #f1f5f9",
                                                                            }}
                                                                        >
                                                                            {index + 1}
                                                                        </td>
                                                                        <td
                                                                            style={{
                                                                                padding: "16px 20px",
                                                                                fontWeight: 700,
                                                                                color: "#0f172a",
                                                                                borderBottom: "1px solid #f1f5f9",
                                                                            }}
                                                                        >
                                                                            {member?.staff_name || "-"}
                                                                        </td>
                                                                        <td
                                                                            style={{
                                                                                padding: "16px 20px",
                                                                                borderBottom: "1px solid #f1f5f9",
                                                                            }}
                                                                        >
                                                                            <span
                                                                                style={{
                                                                                    display: "inline-flex",
                                                                                    alignItems: "center",
                                                                                    gap: "8px",
                                                                                    padding: "8px 14px",
                                                                                    borderRadius: "999px",
                                                                                    background: statusStyle.bg,
                                                                                    color: statusStyle.color,
                                                                                    border: `1px solid ${statusStyle.border}`,
                                                                                    fontWeight: 800,
                                                                                    fontSize: "12px",
                                                                                }}
                                                                            >
                                                                                <span
                                                                                    style={{
                                                                                        width: "8px",
                                                                                        height: "8px",
                                                                                        borderRadius: "50%",
                                                                                        background: statusStyle.color,
                                                                                    }}
                                                                                />
                                                                                {status}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })
                                                        ) : (
                                                            <tr>
                                                                <td
                                                                    colSpan="3"
                                                                    className="text-center"
                                                                    style={{
                                                                        padding: "24px",
                                                                        color: "#64748b",
                                                                        fontWeight: 600,
                                                                    }}
                                                                >
                                                                    No attendance data available
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default CandidateSection;