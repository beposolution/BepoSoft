import React, { useEffect, useState } from "react";
import axios from "axios";
import { Row, Col, Card, CardBody, CardTitle, Input, Button } from "reactstrap";
import { useLocation, Link } from "react-router-dom";

const CategoryReport = () => {
    const BASE_URL = import.meta.env.VITE_APP_KEY;
    const token = localStorage.getItem("token");
    const location = useLocation();
    const navData = location.state;
    const [categoryId, setCategoryId] = useState(navData?.category_id || "");
    const [startDate, setStartDate] = useState(navData?.start_date || "");
    const [endDate, setEndDate] = useState(navData?.end_date || "");

    const [data, setData] = useState([]);
    console.log("data", data)
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        try {
            if (!categoryId) {
                setData([]);
                return;
            }

            setLoading(true);

            const res = await axios.get(
                `${BASE_URL}counts/product/category/wise/`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        category_id: categoryId, // no fallback ""
                        start_date: startDate || "",
                        end_date: endDate || "",
                    },
                }
            );

            const result = res.data?.data || res.data || [];
            setData(Array.isArray(result) ? result : []);
        } catch (err) {
            console.error(err);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (navData?.category_id) {
            setCategoryId(navData.category_id);
            setStartDate(navData.start_date);
            setEndDate(navData.end_date);
        }
    }, []);

    useEffect(() => {
        if (categoryId) {
            fetchData();
        }
    }, [categoryId]);



    const [expandedCards, setExpandedCards] = React.useState({});

    return (
        <React.Fragment>
            <div className="page-content">


                <Row>
                    <Col lg={12}>
                        {/* Header */}
                        <Card className="shadow-sm border-0">
                            <CardBody
                                className="d-flex justify-content-between align-items-center"
                                style={{
                                    background: "linear-gradient(to right, #0f3d3e, #2c7a7b)",
                                    borderRadius: "12px",
                                    color: "#fff",
                                }}
                            >
                                <div>
                                    <h4 className="mb-1 fw-bold">
                                        {data?.[0]?.category_name || ""}
                                    </h4>                                    <p className="mb-0" style={{ fontSize: "13px", opacity: 0.8 }}>
                                        View Category Wise Sold Product Details
                                    </p>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Filters */}


                        {/* Cards */}
                        <Row className="mt-4">
                            {loading ? (
                                <Col>
                                    <p>Loading...</p>
                                </Col>
                            ) : data.length === 0 ? (
                                <Col>
                                    <p>No data found</p>
                                </Col>
                            ) : (
                                data.map((item, index) => {
                                    const invoices = Array.isArray(item.invoices) ? item.invoices : [];
                                    const showAll = expandedCards[index];

                                    const visibleInvoices = showAll ? invoices : invoices.slice(0, 6);

                                    return (
                                        <Col md={3} key={index} className="mb-4">
                                            <Card
                                                className="shadow-sm border-0 h-100"
                                                style={{
                                                    borderRadius: "16px",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                {/* HEADER */}
                                                <div
                                                    style={{
                                                        background: "linear-gradient(to right, #0f3d3e, #2c7a7b)",
                                                        color: "#fff",
                                                        padding: "12px",
                                                        fontSize: "13px",
                                                        fontWeight: "600",
                                                    }}
                                                >
                                                    {item.product_name}
                                                </div>

                                                {/* BODY */}
                                                <CardBody style={{ padding: "0" }}>
                                                    <table
                                                        style={{
                                                            width: "100%",
                                                            borderCollapse: "collapse",
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        <tbody>
                                                            {/* COUNT */}
                                                            <tr>
                                                                <td style={{ padding: "10px", borderBottom: "1px solid #e5e7eb", color: "#6b7280", width: "40%" }}>
                                                                    Count
                                                                </td>
                                                                <td style={{ padding: "10px", borderBottom: "1px solid #e5e7eb", fontWeight: "600" }}>
                                                                    {item.total_quantity}
                                                                </td>
                                                            </tr>

                                                            {/* HEADER */}
                                                            <tr>
                                                                <td colSpan="2" style={{ padding: "8px 10px", background: "#f8fafc", fontWeight: "600", fontSize: "12px", borderBottom: "1px solid #e5e7eb" }}>
                                                                    Invoices
                                                                </td>
                                                            </tr>

                                                            {/* INVOICES (2 ROWS INITIALLY) */}
                                                            {visibleInvoices.length > 0 ? (
                                                                [...Array(Math.ceil(visibleInvoices.length / 3))].map((_, rowIndex) => (
                                                                    <tr key={rowIndex}>
                                                                        <td colSpan="2" style={{ padding: "6px 10px" }}>
                                                                            <div
                                                                                style={{
                                                                                    display: "grid",
                                                                                    gridTemplateColumns: "repeat(3, 1fr)",
                                                                                    gap: "6px",
                                                                                }}
                                                                            >
                                                                                {visibleInvoices
                                                                                    .slice(rowIndex * 3, rowIndex * 3 + 3)
                                                                                    .map((inv, i) => (
                                                                                        <Link
                                                                                            key={i}
                                                                                            to={`/order/${inv.order__id}/items/`}
                                                                                            state={{ orderIds: invoices.map((o) => o.order__id) }}
                                                                                            style={{
                                                                                                background: "#f1f5f9",
                                                                                                padding: "6px",
                                                                                                borderRadius: "6px",
                                                                                                fontSize: "11px",
                                                                                                textAlign: "center",
                                                                                                border: "1px solid #e2e8f0",
                                                                                                textDecoration: "none",
                                                                                                color: "#111827",
                                                                                                display: "block",
                                                                                            }}
                                                                                        >
                                                                                            {inv.order__invoice}
                                                                                        </Link>
                                                                                    ))}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan="2" style={{ padding: "8px 10px", color: "#9ca3af" }}>
                                                                        No invoices
                                                                    </td>
                                                                </tr>
                                                            )}

                                                            {/* SEE MORE */}
                                                            {invoices.length > 6 && (
                                                                <tr>
                                                                    <td colSpan="2" style={{ textAlign: "center", padding: "8px" }}>
                                                                        <span
                                                                            style={{ cursor: "pointer", fontSize: "12px", color: "#0f3d3e", fontWeight: "600" }}
                                                                            onClick={() =>
                                                                                setExpandedCards((prev) => ({
                                                                                    ...prev,
                                                                                    [index]: !prev[index],
                                                                                }))
                                                                            }
                                                                        >
                                                                            {showAll ? "Show less ▲" : "See more ▼"}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    );
                                })
                            )}
                        </Row>
                    </Col>
                </Row>
            </div>
        </React.Fragment>
    );
};

export default CategoryReport;