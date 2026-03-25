import React, { useEffect, useState } from "react";
import axios from "axios";
import { Row, Col, Card, CardBody, CardTitle, Input, Button } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const CategoryReport = () => {
    const BASE_URL = import.meta.env.VITE_APP_KEY;
    const token = localStorage.getItem("token");

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [categoryId, setCategoryId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchData = async () => {
        try {
            // ✅ FIX: stop API call if categoryId is empty
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

    useEffect(() => { }, []);

    const handleFilter = () => {
        fetchData();
    };

    const handleReset = () => {
        setCategoryId("");
        setStartDate("");
        setEndDate("");
        setTimeout(fetchData, 0);
    };
    const [expandedCards, setExpandedCards] = React.useState({});

    return (
        <React.Fragment>
            <div className="page-content">
                <Breadcrumbs
                    title="Daily Sales Report"
                    breadcrumbItem="Category Report"
                />

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
                                    <h4 className="mb-1 fw-bold">Daily Sales Report</h4>
                                    <p className="mb-0" style={{ fontSize: "13px", opacity: 0.8 }}>
                                        View family wise daily sales report
                                    </p>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Filters */}
                        <Card className="mt-4 shadow-sm">
                            <CardBody>
                                <CardTitle className="h5 mb-3">Filters</CardTitle>

                                <Row className="g-3">
                                    <Col md={3}>
                                        <Input
                                            placeholder="Category ID"
                                            value={categoryId}
                                            onChange={(e) => setCategoryId(e.target.value)}
                                        />
                                    </Col>

                                    <Col md={3}>
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </Col>

                                    <Col md={3}>
                                        <Input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </Col>

                                    <Col md={3} className="d-flex gap-2">
                                        <Button
                                            color="primary"
                                            onClick={handleFilter}
                                            disabled={!categoryId}
                                        >
                                            Apply
                                        </Button>
                                        <Button color="secondary" onClick={handleReset}>
                                            Reset
                                        </Button>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>

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
                                                                <div
                                                                    key={i}
                                                                    style={{
                                                                        background: "#f1f5f9",
                                                                        padding: "6px",
                                                                        borderRadius: "6px",
                                                                        fontSize: "11px",
                                                                        textAlign: "center",
                                                                        border: "1px solid #e2e8f0",
                                                                    }}
                                                                >
                                                                    {inv.order__invoice}
                                                                </div>
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