import React, { useEffect, useState } from "react";
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
import Paginations from "../../components/Common/Pagination";

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

    const [currentPage, setCurrentPage] = useState(1);
    const [perPageData, setPerPageData] = useState(10);

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;

    document.title = "Orders | Beposoft";

    useEffect(() => {
        const activeRole = localStorage.getItem("active");
        setRole(activeRole);
    }, []);

    useEffect(() => {
        if (token && role)
            fetchOrders(`${import.meta.env.VITE_APP_KEY}orders/`);
    }, [token, role]);

    const fetchOrders = async (url) => {
        if (!url) return;
        try {
            setLoading(true);
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (role === "Warehouse Admin") {
                const filterOrders = response.data.results.filter(
                    (order) => order.status === "To Print"
                );
                setOrders(filterOrders);
            } else {
                const excludedStatuses = [
                    "Invoice Created",
                    "Invoice Approved",
                    "Waiting For Confirmation",
                ];

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

    // Unlock order when leaving page
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

    // Combined filter logic
    const filteredOrders = orders.filter((order) => {
        const matchesStatus = !statusFilter || order.status === statusFilter;

        // Global search match
        const search = globalSearch.toLowerCase().trim();
        const matchesSearch =
            !search ||
            order.invoice?.toLowerCase().includes(search) ||
            order.customer?.name?.toLowerCase().includes(search) ||
            order.manage_staff?.toLowerCase().includes(search) ||
            String(order.total_amount).toLowerCase().includes(search) ||
            order.status?.toLowerCase().includes(search);

        // Date range match
        const orderDate = new Date(order.order_date);
        const matchesDate =
            (!startDate || orderDate >= new Date(startDate)) &&
            (!endDate || orderDate <= new Date(endDate));

        return matchesStatus && matchesSearch && matchesDate;
    });

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
                                        <Col md={3}>
                                            <label className="form-label fw-bold">Search</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search by Invoice, Customer, Staff, Amount or Status"
                                                value={globalSearch}
                                                onChange={(e) => setGlobalSearch(e.target.value)}
                                            />
                                        </Col>

                                        <Col md={3}>
                                            <label className="form-label fw-bold">Filter by Status</label>
                                            <select
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

                                        <Col md={3}>
                                            <label className="form-label fw-bold">From Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </Col>

                                        <Col md={3}>
                                            <label className="form-label fw-bold">To Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
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
                                                        {filteredOrders
                                                            .slice(indexOfFirstItem, indexOfLastItem)
                                                            .map((order, index) => (
                                                                <tr key={order.id}>
                                                                    <th scope="row">
                                                                        {indexOfFirstItem + index + 1}
                                                                    </th>
                                                                    <td>{order.invoice}</td>
                                                                    <td>{order.customer.name}</td>
                                                                    <td>{order.manage_staff}</td>
                                                                    <td>{order.status}</td>
                                                                    <td>{order.total_amount}</td>
                                                                    <td>{order.order_date}</td>
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

                                                <Paginations
                                                    perPageData={perPageData}
                                                    data={filteredOrders}
                                                    currentPage={currentPage}
                                                    setCurrentPage={setCurrentPage}
                                                    isShowingPageLength={true}
                                                    paginationDiv="col-auto"
                                                    paginationClass="pagination"
                                                    indexOfFirstItem={indexOfFirstItem}
                                                    indexOfLastItem={indexOfLastItem}
                                                />
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
