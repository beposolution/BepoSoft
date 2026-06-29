import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    Button,
    Badge,
    Spinner,
} from "reactstrap";
import { Link, useParams } from "react-router-dom";
import Paginations from "../../components/Common/Pagination";

const BasicTable = () => {
    const [orders, setOrders] = useState([]);
    const [dateSummary, setDateSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { date } = useParams();

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("active");

    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 10;

    document.title = "COD Orders | Beposoft";

    const formatAmount = (value) => {
        const num = Number(value || 0);
        if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
        if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
        if (num >= 1000) return `₹${(num / 1000).toFixed(2)}k`;
        return `₹${num.toFixed(2)}`;
    };

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}COD/sales/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        params: {
                            start_date: date,
                            end_date: date,
                        },
                    }
                );

                const apiData = response.data || {};
                const reportData = Array.isArray(apiData.data) ? apiData.data : [];

                const selectedDateData = reportData.find(
                    (item) => String(item.date) === String(date)
                );

                let filteredOrders = Array.isArray(selectedDateData?.orders)
                    ? selectedDateData.orders
                    : [];

                if (role === "CSO") {
                    filteredOrders = filteredOrders.filter(
                        (order) =>
                            order.family_name?.toLowerCase() !== "bepocart"
                    );
                }

                setOrders(filteredOrders);

                if (role === "CSO") {
                    const totalAmount = filteredOrders.reduce(
                        (sum, order) => sum + Number(order.total_amount || 0),
                        0
                    );

                    const paidAmount = filteredOrders.reduce(
                        (sum, order) => sum + Number(order.total_paid_amount || 0),
                        0
                    );

                    const balanceAmount = filteredOrders.reduce(
                        (sum, order) => sum + Number(order.balance_amount || 0),
                        0
                    );

                    setDateSummary({
                        total_orders: filteredOrders.length,
                        total_amount: totalAmount,
                        paid_amount: paidAmount,
                        balance_amount: balanceAmount,
                    });
                } else {
                    setDateSummary(selectedDateData?.summary || null);
                }
            } catch (error) {
                console.error(error);
                setError("Error fetching orders data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [date, token, role]);

    const getStatusColor = (status) => {
        const statusColors = {
            Pending: "danger",
            Approved: "primary",
            Shipped: "warning",
            Processing: "warning",
            Completed: "success",
            Cancelled: "secondary",
            "Invoice Created": "primary",
            "Invoice Approved": "success",
            "To Print": "dark",
            Packed: "info",
            "Ready to ship": "warning",
        };

        return statusColors[status] || "secondary";
    };

    const totals = useMemo(() => {
        return {
            totalOrders: dateSummary?.total_orders || orders.length,
            totalAmount:
                dateSummary?.total_amount ??
                orders.reduce(
                    (sum, order) => sum + Number(order.total_amount || 0),
                    0
                ),
            totalPaid:
                dateSummary?.paid_amount ??
                orders.reduce(
                    (sum, order) => sum + Number(order.total_paid_amount || 0),
                    0
                ),
            totalBalance:
                dateSummary?.balance_amount ??
                orders.reduce(
                    (sum, order) => sum + Number(order.balance_amount || 0),
                    0
                ),
        };
    }, [dateSummary, orders]);

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <React.Fragment>
            <style>
                {`
                    .cod-page {
                        background: #f4f7fb;
                        min-height: 100vh;
                    }

                    .cod-header-card {
                        border: 0;
                        border-radius: 18px;
                        background: linear-gradient(135deg, #0f172a, #1e293b);
                        color: #fff;
                        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);
                    }

                    .cod-header-card p {
                        color: rgba(255,255,255,.75);
                    }

                    .cod-summary-box {
                        background: #0f172a;
                        color: #fff;
                        border-radius: 16px;
                        padding: 18px;
                        height: 100%;
                        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
                    }

                    .cod-summary-box small {
                        color: #cbd5e1;
                        display: block;
                        margin-bottom: 6px;
                    }

                    .cod-table-card {
                        border: 0;
                        border-radius: 18px;
                        box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
                    }

                    .cod-table {
                        border-collapse: separate;
                        border-spacing: 0 10px;
                    }

                    .cod-table thead tr th {
                        background: #0f172a;
                        color: #fff;
                        border: 0;
                        font-size: 12px;
                        text-transform: uppercase;
                        letter-spacing: .04em;
                        padding: 14px;
                    }

                    .cod-table thead tr th:first-child {
                        border-top-left-radius: 14px;
                        border-bottom-left-radius: 14px;
                    }

                    .cod-table thead tr th:last-child {
                        border-top-right-radius: 14px;
                        border-bottom-right-radius: 14px;
                    }

                    .cod-table tbody tr {
                        background: #fff;
                        box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
                    }

                    .cod-table tbody tr td,
                    .cod-table tbody tr th {
                        border: 0;
                        padding: 16px 14px;
                        vertical-align: middle;
                    }

                    .cod-empty {
                        background: #fff;
                        border-radius: 18px;
                        padding: 40px;
                        text-align: center;
                        color: #64748b;
                    }

                    .btn {
                        border-radius: 12px;
                    }

                    @media (max-width: 768px) {
                        .cod-table {
                            min-width: 1050px;
                        }
                    }
                `}
            </style>

            <div className="page-content cod-page">
                <div className="container-fluid">
                    <Card className="cod-header-card mb-4">
                        <CardBody>
                            <Row className="align-items-center">
                                <Col md={8}>
                                    <h3 className="mb-2 fw-bold">
                                        COD Orders Report
                                    </h3>
                                    <p className="mb-0">
                                        Detailed COD order list for {date}.
                                    </p>
                                </Col>

                                <Col md={4} className="text-md-end mt-3 mt-md-0">
                                    <Button
                                        color="light"
                                        onClick={() => window.history.back()}
                                    >
                                        Back
                                    </Button>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    <Row className="mb-4">
                        <Col md={3} xs={6} className="mb-3">
                            <div className="cod-summary-box">
                                <small>Total Orders</small>
                                <h4 className="mb-0 text-white">
                                    {totals.totalOrders}
                                </h4>
                            </div>
                        </Col>

                        <Col md={3} xs={6} className="mb-3">
                            <div className="cod-summary-box">
                                <small>Total Amount</small>
                                <h4 className="mb-0 text-white">
                                    {formatAmount(totals.totalAmount)}
                                </h4>
                            </div>
                        </Col>

                        <Col md={3} xs={6} className="mb-3">
                            <div className="cod-summary-box">
                                <small>Paid Amount</small>
                                <h4 className="mb-0 text-white">
                                    {formatAmount(totals.totalPaid)}
                                </h4>
                            </div>
                        </Col>

                        <Col md={3} xs={6} className="mb-3">
                            <div className="cod-summary-box">
                                <small>Balance Amount</small>
                                <h4 className="mb-0 text-white">
                                    {formatAmount(totals.totalBalance)}
                                </h4>
                            </div>
                        </Col>
                    </Row>

                    <Card className="cod-table-card">
                        <CardBody>
                            {/* <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <h5 className="mb-1 fw-bold">
                                        BEPOSOFT ORDERS - {date}
                                    </h5>
                                    <small className="text-muted">
                                        Showing {currentOrders.length} of {orders.length} orders
                                    </small>
                                </div>

                                <Badge color="primary" pill>
                                    {date}
                                </Badge>
                            </div> */}

                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner color="primary" />
                                    <p className="mt-3 mb-0 text-muted">
                                        Loading COD orders...
                                    </p>
                                </div>
                            ) : error ? (
                                <div className="text-danger">{error}</div>
                            ) : currentOrders.length > 0 ? (
                                <>
                                    <div className="table-responsive">
                                        <Table className="cod-table mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Invoice No</th>
                                                    <th>Staff</th>
                                                    <th>Division</th>
                                                    <th>Customer</th>
                                                    <th>Status</th>
                                                    <th>Bill Amount</th>
                                                    <th>Paid Amount</th>
                                                    <th>Balance</th>
                                                    <th>Created At</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {currentOrders.map((order, index) => (
                                                    <tr key={order.id || index}>
                                                        <th>{indexOfFirstItem + index + 1}</th>

                                                        <td>
                                                            <Link to={`/order/${order.id}/items/`}>
                                                                <strong>{order.invoice}</strong>
                                                            </Link>
                                                        </td>

                                                        <td>
                                                            {order.staff_name ||
                                                                order.manage_staff ||
                                                                "-"}
                                                        </td>

                                                        <td>
                                                            {order.family_name ||
                                                                order.family ||
                                                                "-"}
                                                        </td>

                                                        <td>
                                                            {order.customer_name ||
                                                                order.customer?.name ||
                                                                "-"}
                                                        </td>

                                                        <td>
                                                            <Badge
                                                                color={getStatusColor(order.status)}
                                                                pill
                                                            >
                                                                {order.status || "-"}
                                                            </Badge>
                                                        </td>

                                                        <td className="fw-bold">
                                                            {formatAmount(order.total_amount)}
                                                        </td>

                                                        <td className="fw-bold text-success">
                                                            {formatAmount(order.total_paid_amount)}
                                                        </td>

                                                        <td className="fw-bold text-warning">
                                                            {formatAmount(order.balance_amount)}
                                                        </td>

                                                        <td>{order.order_date || "-"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>

                                    <div className="mt-4">
                                        <Paginations
                                            perPageData={perPageData}
                                            data={orders}
                                            currentPage={currentPage}
                                            setCurrentPage={setCurrentPage}
                                            isShowingPageLength={true}
                                            paginationDiv="col-auto"
                                            paginationClass="pagination"
                                            indexOfFirstItem={indexOfFirstItem}
                                            indexOfLastItem={indexOfLastItem}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="cod-empty">
                                    <h5 className="fw-bold">No orders found</h5>
                                    <p className="mb-0">
                                        No COD orders found for this date.
                                    </p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>
        </React.Fragment>
    );
};

export default BasicTable;