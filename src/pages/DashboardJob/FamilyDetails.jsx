import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row } from "reactstrap";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FamilyDetails = () => {
    const [orders, setOrders] = useState([]);
    console.log("Orders:", orders);
    const [loading, setLoading] = useState(true);
    const [familyStats, setFamilyStats] = useState({});
    const navigate = useNavigate();
    const todayDate = new Date().toISOString().split('T')[0];

    useEffect(() => {
        // Fetch all orders
        const fetchOrdersData = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}orders/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrders(response?.data?.results || []);
                setLoading(false);
            } catch (error) {
                toast.error('Error fetching order data:');
                setLoading(false);
            }
        };
        fetchOrdersData();
    }, []);

    // Calculate division-wise statistics
    useEffect(() => {
        if (!orders.length) return;

        // Get current month date range
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Only this month's orders
        const ordersThisMonth = orders.filter(order => {
            if (!order.order_date) return false;
            const orderDate = new Date(order.order_date);
            return orderDate >= firstDayOfMonth && orderDate <= lastDayOfMonth;
        });

        // Calculate family-wise stats
        const stats = ordersThisMonth.reduce((acc, order) => {
            const orderDate = new Date(order.order_date);
            const orderDay = orderDate.toISOString().split('T')[0];
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];

            const family = order.family_name || "Unknown";
            const amount = parseFloat(order.total_amount) || 0;

            if (!acc[family]) {
                acc[family] = {
                    todayAmount: 0,
                    todayOrders: 0,
                    monthAmount: 0,
                    monthOrders: 0
                };
            }

            if (orderDay === todayStr) {
                acc[family].todayAmount += amount;
                acc[family].todayOrders += 1;
            }
            acc[family].monthAmount += amount;
            acc[family].monthOrders += 1;

            return acc;
        }, {});

        setFamilyStats(stats);
    }, [orders]);

    // Loading state
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
                <span>Loading...</span>
            </div>
        );
    }

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="FAMILY-WISE DETAILS" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <h4 className="text-center mb-4 fw-bold text-primary">
                                        📊 Division-wise Order Statistics
                                    </h4>
                                    <div className="row g-4 justify-content-center">
                                        {Object.entries(familyStats).length > 0 ? (
                                            Object.entries(familyStats).map(([family, stats]) => {
                                                // Calculate COD stats
                                                const codFamilyOrders = orders.filter(order => {
                                                    if (!order.order_date) return false;
                                                    const orderDate = new Date(order.order_date);
                                                    return (
                                                        order.family_name === family &&
                                                        order.payment_status === "COD" &&
                                                        orderDate >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                                                    );
                                                });
                                                const codFamilyCount = codFamilyOrders.length;
                                                const codFamilyVolume = codFamilyOrders.reduce(
                                                    (sum, order) => sum + Number(order.total_amount || 0), 0
                                                );
                                                // Today's COD
                                                const todayCodFamilyOrders = orders.filter(
                                                    order =>
                                                        order.family_name === family &&
                                                        order.payment_status === "COD" &&
                                                        new Date(order.order_date).toISOString().split('T')[0] === todayDate
                                                );
                                                const todayCodFamilyCount = todayCodFamilyOrders.length;
                                                const todayCodFamilyVolume = todayCodFamilyOrders.reduce(
                                                    (sum, order) => sum + Number(order.total_amount || 0), 0
                                                );
                                                // Today's Paid
                                                const todayPaidFamilyOrders = orders.filter(
                                                    order =>
                                                        order.family_name === family &&
                                                        order.payment_status === "paid" &&
                                                        new Date(order.order_date).toISOString().split('T')[0] === todayDate
                                                );
                                                const todayPaidFamilyCount = todayPaidFamilyOrders.length;
                                                const todayPaidFamilyVolume = todayPaidFamilyOrders.reduce(
                                                    (sum, order) => sum + Number(order.total_amount || 0), 0
                                                );

                                                // This Month Paid
                                                const monthPaidFamilyOrders = orders.filter(order => {
                                                    if (!order.order_date) return false;
                                                    const orderDate = new Date(order.order_date);
                                                    return (
                                                        order.family_name === family &&
                                                        order.payment_status === "paid" &&
                                                        orderDate >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                                                    );
                                                });
                                                const monthPaidFamilyCount = monthPaidFamilyOrders.length;
                                                const monthPaidFamilyVolume = monthPaidFamilyOrders.reduce(
                                                    (sum, order) => sum + Number(order.total_amount || 0), 0
                                                );
                                                return (
                                                    <div className="col-12 col-md-6 col-xl-4" key={family}>
                                                        <div
                                                            className="card border-0 shadow-sm p-2 rounded-4 h-100"
                                                            style={{
                                                                width: "100%",
                                                                minHeight: "260px",
                                                                background: "#f9fcff",
                                                                cursor: "pointer",
                                                                transition: "0.3s"
                                                            }}
                                                            onClick={() => navigate("/dashboard/family/details")}
                                                        >
                                                            <div className="card-body text-center p-0">
                                                                <h5 className="card-title text-uppercase fw-semibold text-secondary mb-3 mt-2">
                                                                    {family}
                                                                </h5>
                                                                <div className="table-responsive">
                                                                    <table
                                                                        className="table table-sm mb-0"
                                                                        style={{
                                                                            background: "#f5faff",
                                                                            borderRadius: "14px",
                                                                            overflow: "hidden",
                                                                            boxShadow: "0 2px 6px 0 rgba(0,0,0,0.03)"
                                                                        }}
                                                                    >
                                                                        <tbody>
                                                                            {/* Today's Total */}
                                                                            <tr style={{ borderBottom: "1px solid #e0f1ff" }}>
                                                                                <td className="text-start fw-semibold" style={{ width: "60%", padding: "0.6rem 0.6rem" }}>
                                                                                    <span style={{ color: "#2d8a44" }}>Today's Total</span>
                                                                                </td>
                                                                                <td className="text-end" style={{ padding: "0.6rem 0.6rem" }}>
                                                                                    <span className="fw-bold" style={{ color: "#27ae60", fontSize: "1.08rem" }}>
                                                                                        ₹{stats?.todayAmount?.toLocaleString()}
                                                                                    </span>
                                                                                    <br />
                                                                                    <span className="text-muted small">
                                                                                        ({stats?.todayOrders} orders)
                                                                                    </span>
                                                                                </td>
                                                                            </tr>

                                                                            {/* Today's COD */}
                                                                            <tr style={{ borderBottom: "1px solid #e0f1ff", background: "#f9f9fb" }}>
                                                                                <td className="text-start fw-semibold" style={{ padding: "0.6rem 0.6rem" }}>
                                                                                    <span style={{ color: "#c47a00" }}>Today's COD</span>
                                                                                </td>
                                                                                <td className="text-end" style={{ padding: "0.6rem 0.6rem" }}>
                                                                                    <span className="fw-bold" style={{ color: "#ff9800", fontSize: "1.08rem" }}>
                                                                                        ₹{todayCodFamilyVolume.toLocaleString()}
                                                                                    </span>
                                                                                    <br />
                                                                                    <span className="text-muted small">
                                                                                        ({todayCodFamilyCount} orders)
                                                                                    </span>
                                                                                </td>
                                                                            </tr>

                                                                            {/* Today's Paid */}
                                                                            <tr style={{ borderBottom: "1px solid #e0f1ff" }}>
                                                                                <td className="text-start fw-semibold" style={{ padding: "0.6rem 0.6rem" }}>
                                                                                    <span style={{ color: "#1967d2" }}>Today's Paid</span>
                                                                                </td>
                                                                                <td className="text-end" style={{ padding: "0.6rem 0.6rem" }}>
                                                                                    <span className="fw-bold" style={{ color: "#1967d2", fontSize: "1.08rem" }}>
                                                                                        ₹{todayPaidFamilyVolume.toLocaleString()}
                                                                                    </span>
                                                                                    <br />
                                                                                    <span className="text-muted small">
                                                                                        ({todayPaidFamilyCount} orders)
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                            {/* --- SPACER --- */}
                                                                            <tr>
                                                                                <td colSpan={2} style={{
                                                                                    border: 0,
                                                                                    height: "16px",
                                                                                    background: "transparent"
                                                                                }}></td>
                                                                            </tr>
                                                                            {/* This Month */}
                                                                            <tr style={{ borderBottom: "1px solid #e0f1ff" }}>
                                                                                <td className="text-start fw-semibold" style={{ padding: "0.6rem 0.6rem" }}>
                                                                                    <span style={{ color: "#2464a3" }}>This Month</span>
                                                                                </td>
                                                                                <td className="text-end" style={{ padding: "0.6rem 0.6rem" }}>
                                                                                    <span className="fw-bold" style={{ color: "#2464a3", fontSize: "1.08rem" }}>
                                                                                        ₹{stats?.monthAmount?.toLocaleString()}
                                                                                    </span>
                                                                                    <br />
                                                                                    <span className="text-muted small">
                                                                                        ({stats?.monthOrders} orders)
                                                                                    </span>
                                                                                </td>
                                                                            </tr>

                                                                            {/* This Month COD */}
                                                                            <tr style={{ background: "#f9f9fb", borderBottom: "1px solid #e0f1ff" }}>
                                                                                <td className="text-start fw-semibold" style={{ padding: "0.6rem 0.6rem" }}>
                                                                                    <span style={{ color: "#c47a00" }}>This Month COD</span>
                                                                                </td>
                                                                                <td className="text-end" style={{ padding: "0.6rem 0.6rem" }}>
                                                                                    <span className="fw-bold" style={{ color: "#ff9800", fontSize: "1.08rem" }}>
                                                                                        ₹{codFamilyVolume.toLocaleString()}
                                                                                    </span>
                                                                                    <br />
                                                                                    <span className="text-muted small">
                                                                                        ({codFamilyCount} orders)
                                                                                    </span>
                                                                                </td>
                                                                            </tr>

                                                                            {/* This Month Paid */}
                                                                            <tr>
                                                                                <td className="text-start fw-semibold" style={{ padding: "0.6rem 0.6rem" }}>
                                                                                    <span style={{ color: "#1967d2" }}>This Month Paid</span>
                                                                                </td>
                                                                                <td className="text-end" style={{ padding: "0.6rem 0.6rem" }}>
                                                                                    <span className="fw-bold" style={{ color: "#1967d2", fontSize: "1.08rem" }}>
                                                                                        ₹{monthPaidFamilyVolume.toLocaleString()}
                                                                                    </span>
                                                                                    <br />
                                                                                    <span className="text-muted small">
                                                                                        ({monthPaidFamilyCount} orders)
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="w-100 text-center text-muted">
                                                No orders found for this month.
                                            </div>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </React.Fragment>
    );
};

export default FamilyDetails;
