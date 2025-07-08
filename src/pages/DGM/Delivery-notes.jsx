import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const BasicTable = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("token");
    const [role, setRole] = useState(null);
    const navigate = useNavigate();
    const [lockedOrderId, setLockedOrderId] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [invoiceSearch, setInvoiceSearch] = useState("");

    document.title = "Orders | Beposoft";

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

    useEffect(() => {
        if (token && role) fetchOrders(`${import.meta.env.VITE_APP_KEY}orders/`);
    }, [token, role]);


    const fetchOrders = async (url) => {
        if (!url) return;
        try {
            setLoading(true);
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (role === "Warehouse Admin") {
                const filterOrders = response.data.results.filter(order => order.status === "To Print")
                setOrders(filterOrders);
            } else {
                const excludedStatuses = ["Invoice Created", "Invoice Approved", "Waiting For Confirmation"];

                const filteredOrders = response.data.results.filter(
                    (order) => !excludedStatuses.includes(order.status)
                );

                setOrders(filteredOrders);
            }
        } catch (error) {
            setError("Error fetching orders data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const statusOptions = [
        "Pending",
        "Approved",
        "Shipped",
        "To Print",
        "Invoice Rejected",
        "Order Request by Warehouse",
        "Processing",
        "Completed",
        "Cancelled",
        "Refunded",
        "Rejected",
        "Return",
        "Packing under progress",
        "Packed",
        "Ready to ship"
    ];

    const viewDeliveryNote = async (invoiceId) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_APP_KEY}orders/${invoiceId}/lock/`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.status === 200) {
                setLockedOrderId(invoiceId); // set here
                navigate(`/order/packing/${invoiceId}/progress/`);
            }
        } catch (err) {
            alert("This order is currently being viewed by another user.");
        }
    };

    useEffect(() => {
        const handleUnload = () => {

            if (!lockedOrderId) {
                return;
            }

            const token = localStorage.getItem("token");
            const body = JSON.stringify({ token });

            navigator.sendBeacon(
                `${import.meta.env.VITE_APP_KEY}orders/unlock/${lockedOrderId}/`,
                new Blob([body], { type: "application/json" })
            );
        };

        window.addEventListener("beforeunload", handleUnload);

        return () => {
            handleUnload(); // also fires on component unmount
            window.removeEventListener("beforeunload", handleUnload);
        };
    }, [lockedOrderId]);

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="Delivery note list" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <Row className="mb-3">
                                        <Col md={4}>
                                            <label htmlFor="invoiceSearch" className="form-label">Search by Invoice</label>
                                            <input
                                                type="text"
                                                id="invoiceSearch"
                                                className="form-control"
                                                placeholder="Enter invoice number"
                                                value={invoiceSearch}
                                                onChange={(e) => setInvoiceSearch(e.target.value)}
                                            />
                                        </Col>
                                        <Col md={4}>
                                            <label htmlFor="statusFilter" className="form-label">Filter by Status</label>
                                            <select
                                                id="statusFilter"
                                                className="form-select"
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                            >
                                                <option value="">All</option>
                                                {statusOptions.map((status, index) => (
                                                    <option key={index} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                        </Col>
                                    </Row>
                                    <CardTitle className="h4"></CardTitle>
                                    <div className="table-responsive">
                                        {loading ? <div>Loading...</div> : error ? <div className="text-danger">{error}</div> : (
                                            <Table className="table mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>INVOICE NO</th>
                                                        <th>CUSTOMER</th>
                                                        <th>STATUS</th>
                                                        <th>BILL AMOUNT</th>
                                                        <th>CREATED AT</th>
                                                        <th>view</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orders
                                                        .filter(order => {
                                                            const matchesStatus = !statusFilter || order.status === statusFilter;
                                                            const matchesInvoice = !invoiceSearch || order.invoice?.toLowerCase().includes(invoiceSearch.toLowerCase());
                                                            return matchesStatus && matchesInvoice;
                                                        })
                                                        .map((order, index) => (
                                                            <tr key={order.id}>
                                                                <th scope="row">{index + 1}</th>
                                                                <td>{order.invoice}</td>
                                                                <td>{order.customer.name}</td>
                                                                <td>{order.status}</td>
                                                                <td>{order.total_amount}</td>
                                                                <td>{order.order_date}</td>
                                                                <td>
                                                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                                                        <button
                                                                            onClick={() => viewDeliveryNote(order.id)}
                                                                            style={{
                                                                                padding: "10px 20px",
                                                                                border: "none",
                                                                                background: "#3258a8",
                                                                                color: "white",
                                                                                cursor: "pointer",
                                                                                marginBottom: "5px",
                                                                                opacity: order.locked_by && order.locked_by !== localStorage.getItem("username") ? 0.7 : 1
                                                                            }}
                                                                        >
                                                                            View
                                                                        </button>
                                                                        {
                                                                            order.locked_by && order.locked_by !== localStorage.getItem("username") && (
                                                                                <span className="text-danger" style={{ fontSize: "0.85rem" }}>
                                                                                    In use by: {order.locked_by.toUpperCase()}
                                                                                </span>
                                                                            )
                                                                        }
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </Table>
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

export default BasicTable;
