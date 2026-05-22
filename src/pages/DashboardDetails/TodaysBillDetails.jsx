import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Table } from "reactstrap";
import axios from "axios";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TodaysBillDetails = () => {
    const [orders, setOrders] = useState([]);
    const [invoiceCreatedCount, setInvoiceCreatedCount] = useState(0);
    const [invoiceApprovedCount, setInvoiceApprovedCount] = useState(0);
    const [todayDate, setTodayDate] = useState("");

    const token = localStorage.getItem("token");
    const [role, setRole] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);

    document.title = "Todays Bill | Beposoft";

    useEffect(() => {
        const activeRole = localStorage.getItem("active");
        setRole(activeRole);
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}profile/`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                setUserData(response?.data?.data?.family);
            } catch (error) {
                toast.error("Error fetching user data");
            }
        };

        fetchUserData();
    }, [token]);

    useEffect(() => {
        const fetchOrdersData = async () => {
            try {
                setLoading(true);

                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}orders/today/`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                const responseResults = response?.data?.results;

                setOrders(
                    Array.isArray(responseResults?.results)
                        ? responseResults.results
                        : []
                );

                setInvoiceCreatedCount(responseResults?.invoice_created_count || 0);
                setInvoiceApprovedCount(responseResults?.invoice_approved_count || 0);
                setTodayDate(responseResults?.today_date || "");
            } catch (error) {
                toast.error("Error fetching order data");
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrdersData();
    }, [token]);

    const getStatusColor = (status) => {
        switch (status) {
            case "Pending":
                return { color: "red" };
            case "Invoice Rejected":
                return { color: "red" };
            case "Processing":
                return { color: "orange" };
            case "Invoice Created":
                return { color: "green" };
            case "Waiting For Confirmation":
                return { color: "#0d6efd" };
            case "Cancelled":
                return { color: "gray" };
            default:
                return { color: "black" };
        }
    };

    const today = todayDate || new Date().toISOString().split("T")[0];

    const todaysOrders = Array.isArray(orders)
        ? orders.filter((order) => {
            const isToday = order.order_date === today;

            if (role === "ADMIN" || role === "COO" || role === "CEO") {
                return isToday;
            }

            if (role === "CSO") {
                return (
                    isToday &&
                    (
                        order.family_name === "cycling" ||
                        order.family_name === "skating"
                    )
                );
            }

            if (order.family_id && userData) {
                return isToday && Number(order.family_id) === Number(userData);
            }

            if (order.family_name && userData) {
                return isToday && order.family_name === userData;
            }

            if (
                typeof order.family === "object" &&
                order.family !== null &&
                typeof userData === "object" &&
                userData !== null
            ) {
                return (
                    isToday &&
                    (
                        order.family.id === userData.id ||
                        order.family.name === userData.name
                    )
                );
            }

            return false;
        })
        : [];

    return (
        <React.Fragment>
            <ToastContainer />

            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="TODAYS BILL" />

                    <Row className="mb-3">
                        <Col md={6} xl={3}>
                            <Card>
                                <CardBody>
                                    <h6 className="text-muted mb-2">
                                        Invoice Created
                                    </h6>
                                    <h4 className="mb-0 text-success">
                                        {invoiceCreatedCount}
                                    </h4>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col md={6} xl={3}>
                            <Card>
                                <CardBody>
                                    <h6 className="text-muted mb-2">
                                        Waiting For Confirmation
                                    </h6>
                                    <h4 className="mb-0 text-primary">
                                        {invoiceApprovedCount}
                                    </h4>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col md={6} xl={3}>
                            <Card>
                                <CardBody>
                                    <h6 className="text-muted mb-2">
                                        Today Date
                                    </h6>
                                    <h4 className="mb-0">
                                        {today}
                                    </h4>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col md={6} xl={3}>
                            <Card>
                                <CardBody>
                                    <h6 className="text-muted mb-2">
                                        Total Bills
                                    </h6>
                                    <h4 className="mb-0">
                                        {todaysOrders.length}
                                    </h4>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <div className="table-responsive">
                                        {loading && (
                                            <div className="mb-2">
                                                Loading...
                                            </div>
                                        )}

                                        <Table className="table mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>INVOICE NO</th>
                                                    <th>STAFF</th>
                                                    <th>CUSTOMER</th>
                                                    <th>FAMILY</th>
                                                    <th>STATUS</th>
                                                    <th>BILL AMOUNT</th>
                                                    <th>CREATED AT</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {todaysOrders.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan="8"
                                                            className="text-center"
                                                        >
                                                            No orders for today
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    todaysOrders.map((order, index) => (
                                                        <tr key={order?.id}>
                                                            <td>{index + 1}</td>

                                                            <td>
                                                                <Link to={`/order/${order.id}/items/`}>
                                                                    {order.invoice}
                                                                </Link>
                                                            </td>

                                                            <td>
                                                                {order?.manage_staff?.name ||
                                                                    order?.manage_staff ||
                                                                    "-"}
                                                            </td>

                                                            <td>
                                                                {order?.customer?.name ||
                                                                    order?.customer ||
                                                                    "-"}
                                                            </td>

                                                            <td>
                                                                {order?.family_name ||
                                                                    order?.family ||
                                                                    "-"}
                                                            </td>

                                                            <td style={getStatusColor(order.status)}>
                                                                {order.status}
                                                            </td>

                                                            <td>
                                                                ₹ {Number(order?.total_amount || 0).toLocaleString("en-IN")}
                                                            </td>

                                                            <td>
                                                                {order?.order_date || "-"}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </Table>
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

export default TodaysBillDetails;