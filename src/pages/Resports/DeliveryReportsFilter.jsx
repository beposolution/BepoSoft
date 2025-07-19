import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Row, Col, Card, CardBody, CardTitle } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Link, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination";

const BasicTable = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { date } = useParams();
    const token = localStorage.getItem("token");
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 10;

    document.title = `Orders | Beposoft (${date})`;

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}deliverylist/report/${date}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // ✅ Extracting warehouse data correctly
                if (response.data && response.data.data) {
                    const filteredOrders = response.data.data.filter((parcel) => parcel.shipped_date === date);
                    setOrders(filteredOrders);
                } else {
                    setOrders([]);
                }

            } catch (error) {
                setError("Error fetching orders data. Please try again later.");
                toast.error("Error fetching orders data:");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [date, token]);

    // ✅ Function to style status colors
    const getStatusColor = (status) => {
        const statusColors = {
            "Pending": "red",
            "Approved": "blue",
            "Shipped": "yellow",
            "Processing": "orange",
            "Completed": "green",
            "Cancelled": "gray",
            "Ready To Ship": "purple",
        };
        return { color: statusColors[status] || "black" };
    };

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="DELIVERY REPORTS" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4">DELIVERY REPORTS - Orders for {date}</CardTitle>

                                    <div className="table-responsive">
                                        {loading ? (
                                            <div>Loading...</div>
                                        ) : error ? (
                                            <div className="text-danger">{error}</div>
                                        ) : (
                                            <>
                                                <Table className="table mb-0 table-bordered">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Invoice No</th>
                                                            <th>Customer</th>
                                                            <th>Shipped Date</th>
                                                            <th>Status</th>
                                                            <th>Tracking ID</th>
                                                            <th>Parcel Service</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {currentOrders.length > 0 ? (
                                                            currentOrders.map((order, index) => (
                                                                <tr key={order.id}>
                                                                    <td>{index + 1}</td>
                                                                    <td>
                                                                        <Link to={`/order/${order?.order_id}/items/`}>
                                                                            {order.invoice}
                                                                        </Link>
                                                                    </td>
                                                                    <td>{order.customer}</td>
                                                                    <td>{order.shipped_date}</td>
                                                                    <td style={getStatusColor(order.status)}>{order.status}</td>
                                                                    <td>{order.tracking_id ? order.tracking_id : "N/A"}</td>
                                                                    <td>{order.parcel_service ? order.parcel_service : "N/A"}</td>
                                                                    <td>
                                                                        <Link to={`/order/${order?.order_id}/items`} className="btn btn-sm btn-primary">
                                                                            View
                                                                        </Link>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="8" className="text-center text-muted">
                                                                    No orders found for {date}.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
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
