import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Card,
    CardBody,
    Row,
    Col,
    Table,
    Button,
    Spinner,
} from "reactstrap";

const SalesCDReport = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const familyData = location.state?.familyData || null;
    const createdDate = location.state?.createdDate || "";
    const overallData = location.state?.overallData || null;

    const [datewiseFamilyData, setDatewiseFamilyData] = useState([]);
    const [loadingDatewise, setLoadingDatewise] = useState(false);

    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        "";

    const formatCurrency = (value) => {
        return `₹ ${Number(value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const getInitials = (name) => {
        if (!name) return "BD";
        return name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const summaryCardStyle = (bg, border, color) => ({
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: "18px",
        padding: "18px",
        minHeight: "110px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxShadow: "0 6px 16px rgba(15, 23, 42, 0.06)",
    });

    const labelStyle = {
        fontSize: "13px",
        color: "#5f6b7a",
        fontWeight: "600",
        marginBottom: "6px",
    };

    const valueStyle = {
        fontSize: "24px",
        fontWeight: "800",
        color: "#16324f",
        margin: 0,
        lineHeight: 1.2,
    };

    useEffect(() => {
        const fetchDatewiseFamilyData = async () => {
            if (!familyData?.family_id || !token) return;

            setLoadingDatewise(true);

            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}bdm/daily/overall/report/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const apiData = response?.data?.results?.data || [];

                const filteredFamilyDatewise = apiData
                    .map((dayItem) => {
                        const matchedFamily = Array.isArray(dayItem.family_data)
                            ? dayItem.family_data.find(
                                (family) =>
                                    Number(family.family_id) ===
                                    Number(familyData.family_id)
                            )
                            : null;

                        if (!matchedFamily) return null;

                        return {
                            created_date: dayItem.created_date || "",
                            bdo_present_count: dayItem.bdo_present_count || 0,
                            bdo_absent_count: dayItem.bdo_absent_count || 0,
                            bdo_half_day_count: dayItem.bdo_half_day_count || 0,
                            day_total_bill: dayItem.total_bill || 0,
                            day_total_volume: dayItem.total_volume || 0,
                            day_total_call_duration:
                                dayItem.total_call_duration || "00:00:00",
                            day_call_duration_average:
                                dayItem.call_duration_average || 0,
                            day_average_call_duration_minutes:
                                dayItem.average_call_duration_minutes || 0,

                            family_id: matchedFamily.family_id,
                            family_name: matchedFamily.family_name,
                            bdm_count: matchedFamily.bdm_count || 0,
                            total_bill: matchedFamily.total_bill || 0,
                            total_order_count:
                                matchedFamily.total_order_count || 0,
                            total_volume: matchedFamily.total_volume || 0,
                            total_call_duration:
                                matchedFamily.total_call_duration || "00:00:00",
                            call_duration_average:
                                matchedFamily.call_duration_average || 0,
                            average_call_duration_minutes:
                                matchedFamily.average_call_duration_minutes || 0,
                            bdm_data: Array.isArray(matchedFamily.bdm_data)
                                ? matchedFamily.bdm_data
                                : [],
                        };
                    })
                    .filter(Boolean);

                setDatewiseFamilyData(filteredFamilyDatewise);
            } catch (error) {
                console.error("Datewise family report API error:", error);
                setDatewiseFamilyData([]);
            } finally {
                setLoadingDatewise(false);
            }
        };

        fetchDatewiseFamilyData();
    }, [familyData?.family_id, token]);

    const datewiseTotals = useMemo(() => {
        return datewiseFamilyData.reduce(
            (acc, item) => {
                acc.total_bill += Number(item.total_bill || 0);
                acc.total_order_count += Number(item.total_order_count || 0);
                acc.total_volume += Number(item.total_volume || 0);
                acc.bdm_count += Number(item.bdm_count || 0);
                return acc;
            },
            {
                total_bill: 0,
                total_order_count: 0,
                total_volume: 0,
                bdm_count: 0,
            }
        );
    }, [datewiseFamilyData]);

    if (!familyData) {
        return (
            <div
                className="container-fluid py-5"
                style={{
                    minHeight: "100vh",
                    background:
                        "linear-gradient(135deg, #f7fbfc 0%, #eef7f7 100%)",
                }}
            >
                <Row className="justify-content-center">
                    <Col md={8} lg={6}>
                        <Card
                            className="border-0"
                            style={{
                                borderRadius: "24px",
                                boxShadow: "0 14px 40px rgba(15, 23, 42, 0.08)",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    background:
                                        "linear-gradient(90deg, #16324f 0%, #1f6f8b 100%)",
                                    padding: "20px 24px",
                                    color: "#fff",
                                }}
                            >
                                <h3 className="mb-1 fw-bold">
                                    Sales Call Detail Report
                                </h3>
                                <p
                                    className="mb-0"
                                    style={{ opacity: 0.85 }}
                                >
                                    Family report detail view
                                </p>
                            </div>

                            <CardBody className="text-center p-5">
                                <div
                                    style={{
                                        width: "82px",
                                        height: "82px",
                                        borderRadius: "50%",
                                        margin: "0 auto 18px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background:
                                            "linear-gradient(135deg, #fdecec, #f8d7da)",
                                        color: "#b42318",
                                        fontSize: "30px",
                                        fontWeight: "800",
                                    }}
                                >
                                    !
                                </div>

                                <h4
                                    className="mb-2"
                                    style={{
                                        color: "#b42318",
                                        fontWeight: "800",
                                    }}
                                >
                                    No Data Found
                                </h4>
                                <p
                                    className="text-muted mb-4"
                                    style={{ fontSize: "15px" }}
                                >
                                    No family detail data was passed to this
                                    page.
                                </p>

                                <Button
                                    onClick={() => navigate(-1)}
                                    style={{
                                        background:
                                            "linear-gradient(90deg, #1f6f8b, #2ba3b5)",
                                        border: "none",
                                        borderRadius: "12px",
                                        padding: "10px 24px",
                                        fontWeight: "700",
                                    }}
                                >
                                    Go Back
                                </Button>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }

    return (
        <React.Fragment>
            <div className="page-content">
                <Card
                    className="border-0"
                    style={{
                        borderRadius: "26px",
                        overflow: "hidden",
                        boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
                    }}
                >
                    <div
                        style={{
                            background:
                                "linear-gradient(90deg, #16324f 0%, #1f6f8b 55%, #2ba3b5 100%)",
                            color: "#fff",
                            padding: "26px 28px",
                        }}
                    >
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                            <div>
                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                    <div
                                        style={{
                                            width: "58px",
                                            height: "58px",
                                            borderRadius: "16px",
                                            background:
                                                "rgba(255,255,255,0.16)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: "800",
                                            fontSize: "20px",
                                            backdropFilter: "blur(4px)",
                                        }}
                                    >
                                        {getInitials(familyData.family_name)}
                                    </div>

                                    <div>
                                        <h2 className="mb-1 fw-bold text-capitalize">
                                            {familyData.family_name} BDO Call
                                            Details
                                        </h2>
                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                            <div
                                                style={{
                                                    background: "rgba(211, 67, 67, 0.18)",
                                                    color: "#f4eeee",
                                                    padding: "8px 14px",
                                                    fontSize: "12px",
                                                    fontWeight: "700",
                                                    borderRadius: "999px",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                Report Date: {createdDate || "-"}
                                            </div>
                                            <div
                                                style={{
                                                    background: "rgba(255,255,255,0.18)",
                                                    color: "#fff",
                                                    padding: "8px 14px",
                                                    fontSize: "12px",
                                                    fontWeight: "700",
                                                    borderRadius: "999px",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                Family Summary View
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex gap-2 flex-wrap">
                                <Button
                                    onClick={() => navigate(-1)}
                                    style={{
                                        background: "#ffffff",
                                        color: "#16324f",
                                        border: "none",
                                        borderRadius: "12px",
                                        padding: "10px 18px",
                                        fontWeight: "700",
                                        boxShadow:
                                            "0 8px 20px rgba(0,0,0,0.12)",
                                    }}
                                >
                                    Back
                                </Button>
                            </div>
                        </div>
                    </div>

                    <CardBody className="p-4 p-md-4">
                        <div
                            className="mb-4"
                            style={{
                                display: "flex",
                                gap: "16px",
                                overflowX: "auto",
                                flexWrap: "nowrap",
                                paddingBottom: "4px",
                            }}
                        >
                            <div
                                style={{
                                    ...summaryCardStyle(
                                        "#f4fbfd",
                                        "#b8e3ea",
                                        "#1f6f8b"
                                    ),
                                    minWidth: "220px",
                                    flex: 1,
                                }}
                            >
                                <div style={labelStyle}>BDM Count</div>
                                <h3 style={valueStyle}>
                                    {familyData.bdm_count || 0}
                                </h3>
                            </div>

                            <div
                                style={{
                                    ...summaryCardStyle(
                                        "#f2fbf7",
                                        "#b9e7d0",
                                        "#1f7a5c"
                                    ),
                                    minWidth: "220px",
                                    flex: 1,
                                }}
                            >
                                <div style={labelStyle}>Total Bill</div>
                                <h3 style={valueStyle}>
                                    {familyData.total_bill || 0}
                                </h3>
                            </div>

                            <div
                                style={{
                                    ...summaryCardStyle(
                                        "#fff8f1",
                                        "#f2cf9f",
                                        "#b76e18"
                                    ),
                                    minWidth: "220px",
                                    flex: 1,
                                }}
                            >
                                <div style={labelStyle}>Total Orders</div>
                                <h3 style={valueStyle}>
                                    {familyData.total_order_count || 0}
                                </h3>
                            </div>

                            <div
                                style={{
                                    ...summaryCardStyle(
                                        "#eef7fb",
                                        "#b7d7e8",
                                        "#275d8c"
                                    ),
                                    minWidth: "220px",
                                    flex: 1,
                                }}
                            >
                                <div style={labelStyle}>Total Volume</div>
                                <h3 style={{ ...valueStyle, fontSize: "22px" }}>
                                    {formatCurrency(familyData.total_volume)}
                                </h3>
                            </div>

                            <div
                                style={{
                                    ...summaryCardStyle(
                                        "#f6f3fb",
                                        "#d6c6ec",
                                        "#6f42a6"
                                    ),
                                    minWidth: "220px",
                                    flex: 1,
                                }}
                            >
                                <div style={labelStyle}>Call Duration</div>
                                <h3 style={valueStyle}>
                                    {familyData.total_call_duration ||
                                        "00:00:00"}
                                </h3>
                            </div>

                            <div
                                style={{
                                    ...summaryCardStyle(
                                        "#f1fbfa",
                                        "#b9ebe6",
                                        "#1b7f79"
                                    ),
                                    minWidth: "220px",
                                    flex: 1,
                                }}
                            >
                                <div style={labelStyle}>Call Avg %</div>
                                <h3 style={valueStyle}>
                                    {familyData.call_duration_average || 0}
                                </h3>
                            </div>

                            <div
                                style={{
                                    ...summaryCardStyle(
                                        "#fffdf5",
                                        "#efe1a8",
                                        "#9d7a12"
                                    ),
                                    minWidth: "220px",
                                    flex: 1,
                                }}
                            >
                                <div style={labelStyle}>
                                    Avg Call Duration (Minutes)
                                </div>
                                <h3 style={valueStyle}>
                                    {familyData.average_call_duration_minutes ||
                                        0}
                                </h3>
                            </div>
                        </div>

                        <Card
                            className="border-0 mb-4"
                            style={{
                                borderRadius: "22px",
                                boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    padding: "20px 22px",
                                    borderBottom: "1px solid #e3eaee",
                                    background:
                                        "linear-gradient(90deg, #ffffff, #f6fbfc)",
                                }}
                                className="d-flex justify-content-between align-items-center flex-wrap gap-2"
                            >
                                <div>
                                    <h4
                                        className="mb-1 fw-bold"
                                        style={{ color: "#16324f" }}
                                    >
                                        BDM Wise Details
                                    </h4>
                                    <p
                                        className="mb-0 text-muted"
                                        style={{ fontSize: "14px" }}
                                    >
                                        Detailed breakdown of bills, orders,
                                        volume and call metrics
                                    </p>
                                </div>

                                <div
                                    style={{
                                        background: "#dff3f6",
                                        color: "#1f6f8b",
                                        padding: "9px 14px",
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        borderRadius: "999px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                    }}
                                >
                                    Total BDM:{" "}
                                    {Array.isArray(familyData.bdm_data)
                                        ? familyData.bdm_data.length
                                        : 0}
                                </div>
                            </div>

                            <CardBody className="p-0">
                                <div className="table-responsive">
                                    <Table className="align-middle mb-0" hover>
                                        <thead>
                                            <tr
                                                style={{
                                                    background:
                                                        "linear-gradient(90deg, #16324f, #1f6f8b)",
                                                    color: "#fff",
                                                }}
                                            >
                                                <th className="py-3 px-3 border-0">
                                                    #
                                                </th>
                                                <th className="py-3 px-3 border-0">
                                                    BDM Name
                                                </th>
                                                <th className="py-3 px-3 border-0 text-center">
                                                    Total Bill
                                                </th>
                                                <th className="py-3 px-3 border-0 text-center">
                                                    Total Orders
                                                </th>
                                                <th className="py-3 px-3 border-0 text-center">
                                                    Total Volume
                                                </th>
                                                <th className="py-3 px-3 border-0 text-center">
                                                    Call Duration
                                                </th>
                                                <th className="py-3 px-3 border-0 text-center">
                                                    Call Avg %
                                                </th>
                                                <th className="py-3 px-3 border-0 text-center">
                                                    Avg Call Duration (Minutes)
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {Array.isArray(familyData.bdm_data) &&
                                                familyData.bdm_data.length > 0 ? (
                                                familyData.bdm_data.map(
                                                    (bdm, index) => (
                                                        <tr
                                                            key={
                                                                bdm.bdm_id ||
                                                                index
                                                            }
                                                            style={{
                                                                borderBottom:
                                                                    "1px solid #edf2f5",
                                                            }}
                                                        >
                                                            <td className="px-3 py-3 fw-bold">
                                                                {index + 1}
                                                            </td>

                                                            <td className="px-3 py-3">
                                                                <div className="d-flex align-items-center gap-3">
                                                                    <div
                                                                        style={{
                                                                            width: "42px",
                                                                            height: "42px",
                                                                            borderRadius:
                                                                                "12px",
                                                                            background:
                                                                                "linear-gradient(135deg, #dff3f6, #c7e7ee)",
                                                                            color: "#1f6f8b",
                                                                            fontWeight:
                                                                                "800",
                                                                            display:
                                                                                "flex",
                                                                            alignItems:
                                                                                "center",
                                                                            justifyContent:
                                                                                "center",
                                                                            fontSize:
                                                                                "14px",
                                                                        }}
                                                                    >
                                                                        {getInitials(
                                                                            bdm.bdm_name
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div
                                                                            className="fw-bold"
                                                                            style={{
                                                                                color: "#16324f",
                                                                            }}
                                                                        >
                                                                            {bdm.bdm_name ||
                                                                                "-"}
                                                                        </div>
                                                                        <small className="text-muted">
                                                                            BDM
                                                                            Performance
                                                                            Detail
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td className="px-3 py-3 text-center fw-semibold">
                                                                {bdm.total_bill ||
                                                                    0}
                                                            </td>

                                                            <td className="px-3 py-3 text-center fw-semibold">
                                                                {bdm.total_order_count ||
                                                                    0}
                                                            </td>

                                                            <td className="px-3 py-3 text-center fw-semibold">
                                                                {formatCurrency(
                                                                    bdm.total_volume
                                                                )}
                                                            </td>

                                                            <td className="px-3 py-3 text-center">
                                                                <div
                                                                    style={{
                                                                        background: "#efe9fb",
                                                                        color: "#6f42a6",
                                                                        padding: "8px 12px",
                                                                        fontSize: "12px",
                                                                        fontWeight: "700",
                                                                        borderRadius: "999px",
                                                                        display: "inline-flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                    }}
                                                                >
                                                                    {bdm.total_call_duration || "00:00:00"}
                                                                </div>
                                                            </td>

                                                            <td className="px-3 py-3 text-center fw-semibold">
                                                                {bdm.call_duration_average ||
                                                                    0}
                                                            </td>

                                                            <td className="px-3 py-3 text-center fw-semibold">
                                                                {bdm.average_call_duration_minutes ||
                                                                    0}
                                                            </td>
                                                        </tr>
                                                    )
                                                )
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan="8"
                                                        className="text-center py-5 text-muted"
                                                        style={{
                                                            fontSize: "15px",
                                                        }}
                                                    >
                                                        No BDM detail data
                                                        available
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </CardBody>
                        </Card>

                        <Card
                            className="border-0 mb-4"
                            style={{
                                borderRadius: "22px",
                                boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    padding: "20px 22px",
                                    borderBottom: "1px solid #e3eaee",
                                    background:
                                        "linear-gradient(90deg, #ffffff, #f6fbfc)",
                                }}
                                className="d-flex justify-content-between align-items-center flex-wrap gap-2"
                            >
                                <div>
                                    <h4
                                        className="mb-1 fw-bold"
                                        style={{ color: "#16324f" }}
                                    >
                                        Date Wise Family Report
                                    </h4>
                                    <p
                                        className="mb-0 text-muted"
                                        style={{ fontSize: "14px" }}
                                    >
                                        Full API data filtered datewise for{" "}
                                        <span className="text-capitalize fw-bold">
                                            {familyData.family_name}
                                        </span>
                                    </p>
                                </div>
                                <div
                                    style={{
                                        background: "#e6f7fa",
                                        color: "#1f6f8b",
                                        padding: "9px 14px",
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        borderRadius: "999px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                    }}
                                >
                                    Total Dates: {datewiseFamilyData.length}
                                </div>
                            </div>

                            <CardBody className="p-4">
                                <div
                                    className="mb-4"
                                    style={{
                                        display: "flex",
                                        gap: "16px",
                                        overflowX: "auto",
                                        flexWrap: "nowrap",
                                        paddingBottom: "4px",
                                    }}
                                >
                                    <div
                                        style={{
                                            ...summaryCardStyle(
                                                "#eef8fb",
                                                "#b8dceb",
                                                "#275d8c"
                                            ),
                                            minWidth: "220px",
                                        }}
                                    >
                                        <div style={labelStyle}>
                                            Combined Total Bill
                                        </div>
                                        <h3 style={valueStyle}>
                                            {datewiseTotals.total_bill}
                                        </h3>
                                    </div>

                                    <div
                                        style={{
                                            ...summaryCardStyle(
                                                "#f2fbf7",
                                                "#b7e7cf",
                                                "#1f7a5c"
                                            ),
                                            minWidth: "220px",
                                        }}
                                    >
                                        <div style={labelStyle}>
                                            Combined Total Orders
                                        </div>
                                        <h3 style={valueStyle}>
                                            {datewiseTotals.total_order_count}
                                        </h3>
                                    </div>

                                    <div
                                        style={{
                                            ...summaryCardStyle(
                                                "#fff8f1",
                                                "#f2cf9f",
                                                "#b76e18"
                                            ),
                                            minWidth: "220px",
                                        }}
                                    >
                                        <div style={labelStyle}>
                                            Combined Total Volume
                                        </div>
                                        <h3
                                            style={{
                                                ...valueStyle,
                                                fontSize: "20px",
                                            }}
                                        >
                                            {formatCurrency(
                                                datewiseTotals.total_volume
                                            )}
                                        </h3>
                                    </div>
                                </div>

                                {loadingDatewise ? (
                                    <div className="text-center py-5">
                                        <Spinner color="primary" />
                                        <div className="mt-3 text-muted">
                                            Loading datewise family report...
                                        </div>
                                    </div>
                                ) : datewiseFamilyData.length > 0 ? (
                                    datewiseFamilyData.map((item, index) => (
                                        <Card
                                            key={`${item.created_date}-${index}`}
                                            className="border-0 mb-4"
                                            style={{
                                                borderRadius: "20px",
                                                boxShadow:
                                                    "0 8px 24px rgba(15,23,42,0.06)",
                                                overflow: "hidden",
                                                border: "1px solid #e3eaee",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    padding: "18px 20px",
                                                    background:
                                                        "linear-gradient(90deg, #f7fbfc, #eef7f7)",
                                                    borderBottom:
                                                        "1px solid #e3eaee",
                                                }}
                                                className="d-flex justify-content-between align-items-center flex-wrap gap-2"
                                            >
                                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                                    <div
                                                        style={{
                                                            width: "46px",
                                                            height: "46px",
                                                            borderRadius: "14px",
                                                            background:
                                                                "linear-gradient(135deg, #dff3f6, #c7e7ee)",
                                                            color: "#1f6f8b",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            fontWeight: "800",
                                                            fontSize: "14px",
                                                        }}
                                                    >
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <h5
                                                            className="mb-1 fw-bold"
                                                            style={{
                                                                color: "#16324f",
                                                            }}
                                                        >
                                                            Date:{" "}
                                                            {item.created_date ||
                                                                "-"}
                                                        </h5>
                                                        <p
                                                            className="mb-0 text-muted"
                                                            style={{
                                                                fontSize: "13px",
                                                            }}
                                                        >
                                                            Family:{" "}
                                                            <span className="text-capitalize fw-bold">
                                                                {item.family_name}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="d-flex gap-2 flex-wrap">
                                                    <div
                                                        style={{
                                                            background: "#ffffff",
                                                            color: "#1f6f8b",
                                                            padding: "8px 14px",
                                                            fontSize: "12px",
                                                            fontWeight: "700",
                                                            border: "1px solid #d9eaf0",
                                                            borderRadius: "30px",
                                                            boxShadow: "0 3px 10px rgba(31, 111, 139, 0.08)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                        }}
                                                    >
                                                        <span>📊</span>
                                                        <span>BDM Count</span>
                                                        <span
                                                            style={{
                                                                background: "#eaf7fb",
                                                                color: "#1f6f8b",
                                                                borderRadius: "50%",
                                                                minWidth: "22px",
                                                                height: "22px",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "11px",
                                                                fontWeight: "800",
                                                            }}
                                                        >
                                                            {item.bdm_count || 0}
                                                        </span>
                                                    </div>

                                                    <div
                                                        style={{
                                                            background: "#ffffff",
                                                            color: "#1f7a5c",
                                                            padding: "8px 14px",
                                                            fontSize: "12px",
                                                            fontWeight: "700",
                                                            border: "1px solid #d9eaf0",
                                                            borderRadius: "30px",
                                                            boxShadow: "0 3px 10px rgba(31, 122, 92, 0.08)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                        }}
                                                    >
                                                        <span>✅</span>
                                                        <span>BDO Present</span>
                                                        <span
                                                            style={{
                                                                background: "#ecfbf4",
                                                                color: "#1f7a5c",
                                                                borderRadius: "50%",
                                                                minWidth: "22px",
                                                                height: "22px",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "11px",
                                                                fontWeight: "800",
                                                            }}
                                                        >
                                                            {item.bdo_present_count || 0}
                                                        </span>
                                                    </div>

                                                    <div
                                                        style={{
                                                            background: "#ffffff",
                                                            color: "#c2412d",
                                                            padding: "8px 14px",
                                                            fontSize: "12px",
                                                            fontWeight: "700",
                                                            border: "1px solid #d9eaf0",
                                                            borderRadius: "30px",
                                                            boxShadow: "0 3px 10px rgba(194, 65, 45, 0.08)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                        }}
                                                    >
                                                        <span>❌</span>
                                                        <span>BDO Absent</span>
                                                        <span
                                                            style={{
                                                                background: "#fff1ee",
                                                                color: "#c2412d",
                                                                borderRadius: "50%",
                                                                minWidth: "22px",
                                                                height: "22px",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "11px",
                                                                fontWeight: "800",
                                                            }}
                                                        >
                                                            {item.bdo_absent_count || 0}
                                                        </span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            background: "#ffffff",
                                                            color: "#b76e18",
                                                            padding: "8px 14px",
                                                            fontSize: "12px",
                                                            fontWeight: "700",
                                                            border: "1px solid #d9eaf0",
                                                            borderRadius: "30px",
                                                            boxShadow: "0 3px 10px rgba(161, 153, 144, 0.08)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                        }}
                                                    >
                                                        <span>⏳</span>
                                                        <span>Half Day</span>
                                                        <span
                                                            style={{
                                                                background: "#fff7eb",
                                                                color: "#b76e18",
                                                                borderRadius: "50%",
                                                                minWidth: "22px",
                                                                height: "22px",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "11px",
                                                                fontWeight: "800",
                                                            }}
                                                        >
                                                            {item.bdo_half_day_count || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <CardBody className="p-4">
                                                <Row className="g-3 mb-4">
                                                    <Col md={6} lg={3}>
                                                        <div
                                                            style={summaryCardStyle(
                                                                "#f4fbfd",
                                                                "#b8e3ea",
                                                                "#1f6f8b"
                                                            )}
                                                        >
                                                            <div
                                                                style={
                                                                    labelStyle
                                                                }
                                                            >
                                                                Total Bill
                                                            </div>
                                                            <h3
                                                                style={
                                                                    valueStyle
                                                                }
                                                            >
                                                                {item.total_bill ||
                                                                    0}
                                                            </h3>
                                                        </div>
                                                    </Col>

                                                    <Col md={6} lg={3}>
                                                        <div
                                                            style={summaryCardStyle(
                                                                "#f2fbf7",
                                                                "#b9e7d0",
                                                                "#1f7a5c"
                                                            )}
                                                        >
                                                            <div
                                                                style={
                                                                    labelStyle
                                                                }
                                                            >
                                                                Total Orders
                                                            </div>
                                                            <h3
                                                                style={
                                                                    valueStyle
                                                                }
                                                            >
                                                                {item.total_order_count ||
                                                                    0}
                                                            </h3>
                                                        </div>
                                                    </Col>

                                                    <Col md={6} lg={3}>
                                                        <div
                                                            style={summaryCardStyle(
                                                                "#eef8fb",
                                                                "#b8dceb",
                                                                "#275d8c"
                                                            )}
                                                        >
                                                            <div
                                                                style={
                                                                    labelStyle
                                                                }
                                                            >
                                                                Total Volume
                                                            </div>
                                                            <h3
                                                                style={{
                                                                    ...valueStyle,
                                                                    fontSize:
                                                                        "20px",
                                                                }}
                                                            >
                                                                {formatCurrency(
                                                                    item.total_volume
                                                                )}
                                                            </h3>
                                                        </div>
                                                    </Col>

                                                    <Col md={6} lg={3}>
                                                        <div
                                                            style={summaryCardStyle(
                                                                "#f6f3fb",
                                                                "#d6c6ec",
                                                                "#6f42a6"
                                                            )}
                                                        >
                                                            <div
                                                                style={
                                                                    labelStyle
                                                                }
                                                            >
                                                                Call Duration
                                                            </div>
                                                            <h3
                                                                style={
                                                                    valueStyle
                                                                }
                                                            >
                                                                {item.total_call_duration ||
                                                                    "00:00:00"}
                                                            </h3>
                                                        </div>
                                                    </Col>

                                                    <Col md={6} lg={3}>
                                                        <div
                                                            style={summaryCardStyle(
                                                                "#f1fbfa",
                                                                "#b9ebe6",
                                                                "#1b7f79"
                                                            )}
                                                        >
                                                            <div
                                                                style={
                                                                    labelStyle
                                                                }
                                                            >
                                                                Call Avg %
                                                            </div>
                                                            <h3
                                                                style={
                                                                    valueStyle
                                                                }
                                                            >
                                                                {item.call_duration_average ||
                                                                    0}
                                                            </h3>
                                                        </div>
                                                    </Col>

                                                    <Col md={6} lg={3}>
                                                        <div
                                                            style={summaryCardStyle(
                                                                "#fffdf5",
                                                                "#efe1a8",
                                                                "#9d7a12"
                                                            )}
                                                        >
                                                            <div
                                                                style={
                                                                    labelStyle
                                                                }
                                                            >
                                                                Avg Call Duration
                                                                (Minutes)
                                                            </div>
                                                            <h3
                                                                style={
                                                                    valueStyle
                                                                }
                                                            >
                                                                {item.average_call_duration_minutes ||
                                                                    0}
                                                            </h3>
                                                        </div>
                                                    </Col>

                                                    <Col md={6} lg={3}>
                                                        <div
                                                            style={summaryCardStyle(
                                                                "#f7fafc",
                                                                "#d5dee6",
                                                                "#4b5d6b"
                                                            )}
                                                        >
                                                            <div
                                                                style={
                                                                    labelStyle
                                                                }
                                                            >
                                                                Overall Day Bill
                                                            </div>
                                                            <h3
                                                                style={
                                                                    valueStyle
                                                                }
                                                            >
                                                                {item.day_total_bill ||
                                                                    0}
                                                            </h3>
                                                        </div>
                                                    </Col>

                                                    <Col md={6} lg={3}>
                                                        <div
                                                            style={summaryCardStyle(
                                                                "#faf5fb",
                                                                "#e0c9ea",
                                                                "#8b4da7"
                                                            )}
                                                        >
                                                            <div
                                                                style={
                                                                    labelStyle
                                                                }
                                                            >
                                                                Overall Day
                                                                Duration
                                                            </div>
                                                            <h3
                                                                style={{
                                                                    ...valueStyle,
                                                                    fontSize:
                                                                        "20px",
                                                                }}
                                                            >
                                                                {item.day_total_call_duration ||
                                                                    "00:00:00"}
                                                            </h3>
                                                        </div>
                                                    </Col>
                                                </Row>

                                                <div className="table-responsive">
                                                    <Table
                                                        className="align-middle mb-0"
                                                        hover
                                                    >
                                                        <thead>
                                                            <tr
                                                                style={{
                                                                    background:
                                                                        "linear-gradient(90deg, #16324f, #1f6f8b)",
                                                                    color: "#fff",
                                                                }}
                                                            >
                                                                <th className="py-3 px-3 border-0">
                                                                    #
                                                                </th>
                                                                <th className="py-3 px-3 border-0">
                                                                    BDM Name
                                                                </th>
                                                                <th className="py-3 px-3 border-0 text-center">
                                                                    Total Bill
                                                                </th>
                                                                <th className="py-3 px-3 border-0 text-center">
                                                                    Total Orders
                                                                </th>
                                                                <th className="py-3 px-3 border-0 text-center">
                                                                    Total Volume
                                                                </th>
                                                                <th className="py-3 px-3 border-0 text-center">
                                                                    Call
                                                                    Duration
                                                                </th>
                                                                <th className="py-3 px-3 border-0 text-center">
                                                                    Call Avg %
                                                                </th>
                                                                <th className="py-3 px-3 border-0 text-center">
                                                                    Avg Call
                                                                    Duration
                                                                    (Minutes)
                                                                </th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {Array.isArray(
                                                                item.bdm_data
                                                            ) &&
                                                                item.bdm_data
                                                                    .length > 0 ? (
                                                                item.bdm_data.map(
                                                                    (
                                                                        bdm,
                                                                        bdmIndex
                                                                    ) => (
                                                                        <tr
                                                                            key={`${item.created_date}-${bdm.bdm_id}-${bdmIndex}`}
                                                                            style={{
                                                                                borderBottom:
                                                                                    "1px solid #edf2f5",
                                                                            }}
                                                                        >
                                                                            <td className="px-3 py-3 fw-bold">
                                                                                {bdmIndex +
                                                                                    1}
                                                                            </td>

                                                                            <td className="px-3 py-3">
                                                                                <div className="d-flex align-items-center gap-3">
                                                                                    <div
                                                                                        style={{
                                                                                            width: "42px",
                                                                                            height: "42px",
                                                                                            borderRadius:
                                                                                                "12px",
                                                                                            background:
                                                                                                "linear-gradient(135deg, #dff3f6, #c7e7ee)",
                                                                                            color: "#1f6f8b",
                                                                                            fontWeight:
                                                                                                "800",
                                                                                            display:
                                                                                                "flex",
                                                                                            alignItems:
                                                                                                "center",
                                                                                            justifyContent:
                                                                                                "center",
                                                                                            fontSize:
                                                                                                "14px",
                                                                                        }}
                                                                                    >
                                                                                        {getInitials(
                                                                                            bdm.bdm_name
                                                                                        )}
                                                                                    </div>
                                                                                    <div>
                                                                                        <div
                                                                                            className="fw-bold"
                                                                                            style={{
                                                                                                color: "#16324f",
                                                                                            }}
                                                                                        >
                                                                                            {bdm.bdm_name ||
                                                                                                "-"}
                                                                                        </div>
                                                                                        <small className="text-muted">
                                                                                            Datewise
                                                                                            BDM
                                                                                            Detail
                                                                                        </small>
                                                                                    </div>
                                                                                </div>
                                                                            </td>

                                                                            <td className="px-3 py-3 text-center fw-semibold">
                                                                                {bdm.total_bill ||
                                                                                    0}
                                                                            </td>

                                                                            <td className="px-3 py-3 text-center fw-semibold">
                                                                                {bdm.total_order_count ||
                                                                                    0}
                                                                            </td>

                                                                            <td className="px-3 py-3 text-center fw-semibold">
                                                                                {formatCurrency(
                                                                                    bdm.total_volume
                                                                                )}
                                                                            </td>

                                                                            <td className="px-3 py-3 text-center">
                                                                                <div
                                                                                    style={{
                                                                                        background: "#efe9fb",
                                                                                        color: "#6f42a6",
                                                                                        padding: "8px 12px",
                                                                                        fontSize: "12px",
                                                                                        fontWeight: "700",
                                                                                        borderRadius: "999px",
                                                                                        display: "inline-flex",
                                                                                        alignItems: "center",
                                                                                        justifyContent: "center",
                                                                                    }}
                                                                                >
                                                                                    {bdm.total_call_duration || "00:00:00"}
                                                                                </div>
                                                                            </td>

                                                                            <td className="px-3 py-3 text-center fw-semibold">
                                                                                {bdm.call_duration_average ||
                                                                                    0}
                                                                            </td>

                                                                            <td className="px-3 py-3 text-center fw-semibold">
                                                                                {bdm.average_call_duration_minutes ||
                                                                                    0}
                                                                            </td>
                                                                        </tr>
                                                                    )
                                                                )
                                                            ) : (
                                                                <tr>
                                                                    <td
                                                                        colSpan="8"
                                                                        className="text-center py-4 text-muted"
                                                                    >
                                                                        No BDM
                                                                        data
                                                                        available
                                                                        for this
                                                                        date
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-5 text-muted">
                                        No datewise family data available
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </CardBody>
                </Card>
            </div>
        </React.Fragment>
    );
};

export default SalesCDReport;