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
    const [globalSearch, setGlobalSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);

    const debounceRef = useRef(null);
    const controllerRef = useRef(null);

    document.title = "Orders | Beposoft";

    useEffect(() => {
        const activeRole = localStorage.getItem("active");
        setRole(activeRole);
    }, []);

    useEffect(() => {
        if (!token || !role) return;

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            fetchOrders();
        }, 400);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [token, role, globalSearch, statusFilter, startDate, endDate]);

    const buildOrdersUrl = () => {
        const baseUrl = import.meta.env.VITE_APP_KEY;
        const params = new URLSearchParams();

        if (globalSearch.trim()) params.append("search", globalSearch.trim());
        if (statusFilter) params.append("status", statusFilter);
        if (startDate) params.append("start_date", startDate);
        if (endDate) params.append("end_date", endDate);

        return `${baseUrl}orders/?${params.toString()}`;
    };

    const fetchOrders = async (url = null) => {
        try {
            setLoading(true);
            setError(null);

            if (controllerRef.current) {
                controllerRef.current.abort();
            }

            controllerRef.current = new AbortController();

            const apiUrl = url || buildOrdersUrl();

            const response = await axios.get(apiUrl, {
                headers: { Authorization: `Bearer ${token}` },
                signal: controllerRef.current.signal,
            });

            const pageMatch = apiUrl.match(/[?&]page=(\d+)/);
            const page = pageMatch ? parseInt(pageMatch[1], 10) : 1;
            setPageNumber(page);

            setNextPage(response.data.next);
            setPrevPage(response.data.previous);

            let data = [];

            if (Array.isArray(response.data)) {
                data = response.data;
            } else if (Array.isArray(response.data.results)) {
                data = response.data.results;
            } else if (Array.isArray(response.data.results?.results)) {
                data = response.data.results.results;
            }

            if (role === "Warehouse Admin") {
                const filterOrders = data.filter(
                    (order) => order.status === "To Print"
                );
                setOrders(filterOrders);
            } else {
                const excludedStatuses = [
                    "Invoice Created",
                    "Invoice Approved",
                    "Waiting For Confirmation",
                ];

                const filteredOrders = data.filter(
                    (order) => !excludedStatuses.includes(order.status)
                );

                setOrders(filteredOrders);
            }
        } catch (error) {
            if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
                return;
            }

            console.error("Error fetching orders:", error);
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
        "Ready to ship",
    ];

    const viewDeliveryNote = async (invoiceId) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_APP_KEY}orders/${invoiceId}/lock/`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.status === 200) {
                setLockedOrderId(invoiceId);
                navigate(`/order/packing/${invoiceId}/progress/`);
            }
        } catch (err) {
            alert("This order is currently being viewed by another user.");
        }
    };

    useEffect(() => {
        const handleUnload = () => {
            if (!lockedOrderId) return;
            const token = localStorage.getItem("token");
            const body = JSON.stringify({ token });

            navigator.sendBeacon(
                `${import.meta.env.VITE_APP_KEY}orders/unlock/${lockedOrderId}/`,
                new Blob([body], { type: "application/json" })
            );
        };

        window.addEventListener("beforeunload", handleUnload);
        return () => {
            handleUnload();
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
                                    <Row className="align-items-end mb-3">
                                        <Col md={3}>
                                            <label className="form-label fw-bold">
                                                Search by Invoice or Customer
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Enter invoice, customer, staff, amount or status"
                                                value={globalSearch}
                                                onChange={(e) => {
                                                    setPageNumber(1);
                                                    setGlobalSearch(e.target.value);
                                                }}
                                            />
                                        </Col>

                                        <Col md={3}>
                                            <label className="form-label fw-bold">
                                                Filter by Status
                                            </label>
                                            <select
                                                className="form-select"
                                                value={statusFilter}
                                                onChange={(e) => {
                                                    setPageNumber(1);
                                                    setStatusFilter(e.target.value);
                                                }}
                                            >
                                                <option value="">All Status</option>
                                                {statusOptions.map((status, index) => (
                                                    <option key={index} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                        </Col>

                                        <Col md={2}>
                                            <label className="form-label fw-bold">
                                                From Date
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={startDate}
                                                onChange={(e) => {
                                                    setPageNumber(1);
                                                    setStartDate(e.target.value);
                                                }}
                                            />
                                        </Col>

                                        <Col md={2}>
                                            <label className="form-label fw-bold">
                                                To Date
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={endDate}
                                                onChange={(e) => {
                                                    setPageNumber(1);
                                                    setEndDate(e.target.value);
                                                }}
                                            />
                                        </Col>

                                        <Col md={2}>
                                            <button
                                                className="btn btn-secondary w-100"
                                                onClick={() => {
                                                    setGlobalSearch("");
                                                    setStatusFilter("");
                                                    setStartDate("");
                                                    setEndDate("");
                                                    setPageNumber(1);
                                                }}
                                            >
                                                Clear Filters
                                            </button>
                                        </Col>
                                    </Row>

                                    <CardTitle className="h4"></CardTitle>

                                    <div className="table-responsive">
                                        {loading ? (
                                            <div>Loading...</div>
                                        ) : error ? (
                                            <div className="text-danger">{error}</div>
                                        ) : (
                                            <>
                                                <Table className="table mb-0">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>INVOICE NO</th>
                                                            <th>CUSTOMER</th>
                                                            <th>STAFF</th>
                                                            <th>STATUS</th>
                                                            <th>BILL AMOUNT</th>
                                                            <th>CREATED AT</th>
                                                            <th>VIEW</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {orders.map((order, index) => (
                                                            <tr key={order.id}>
                                                                <th scope="row">
                                                                    {((pageNumber - 1) * 50) + index + 1}
                                                                </th>
                                                                <td>{order.invoice}</td>
                                                                <td>{order.customer?.name}</td>
                                                                <td>{order.manage_staff}</td>
                                                                <td>{order.status}</td>
                                                                <td>{order.total_amount}</td>
                                                                <td>{order.order_date?.substring(0, 10)}</td>
                                                                <td>
                                                                    <div
                                                                        style={{
                                                                            display: "flex",
                                                                            flexDirection: "column",
                                                                        }}
                                                                    >
                                                                        <button
                                                                            onClick={() =>
                                                                                viewDeliveryNote(order.id)
                                                                            }
                                                                            style={{
                                                                                padding: "10px 20px",
                                                                                border: "none",
                                                                                background: "#3258a8",
                                                                                color: "white",
                                                                                cursor: "pointer",
                                                                                marginBottom: "5px",
                                                                                opacity:
                                                                                    order.locked_by &&
                                                                                        order.locked_by !==
                                                                                        localStorage.getItem("username")
                                                                                        ? 0.7
                                                                                        : 1,
                                                                            }}
                                                                        >
                                                                            View
                                                                        </button>

                                                                        {order.locked_by &&
                                                                            order.locked_by !==
                                                                            localStorage.getItem("username") && (
                                                                                <span
                                                                                    className="text-danger"
                                                                                    style={{ fontSize: "0.85rem" }}
                                                                                >
                                                                                    In use by:{" "}
                                                                                    {order.locked_by.toUpperCase()}
                                                                                </span>
                                                                            )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>

                                                <div className="d-flex justify-content-between mt-3">
                                                    <button
                                                        className="btn btn-primary"
                                                        disabled={!prevPage || loading}
                                                        onClick={() => fetchOrders(prevPage)}
                                                    >
                                                        Previous
                                                    </button>

                                                    <button
                                                        className="btn btn-primary"
                                                        disabled={!nextPage || loading}
                                                        onClick={() => fetchOrders(nextPage)}
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </>
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