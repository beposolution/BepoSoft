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
import { Link } from "react-router-dom";

const Warehouseorders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const token = localStorage.getItem("token");

    document.title = "Orders | Beposoft";

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}orders/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setOrders(response.data?.results);
            } catch (error) {
                setError("Error fetching orders data. Please try again later.");
                console.error("Error fetching orders data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [token]);


    console.log("orderlist page in warehouse...:", orders);

    // Status color based on status type
    const getStatusColor = (status) => {
        const statusColors = {
            Pending: "red",
            Approved: "blue",
            Shipped: "yellow",
            Processing: "orange",
            Completed: "green",
            Cancelled: "gray",
        };
        return { color: statusColors[status] || "black" };
    };

    // Filtered data based on search and filter conditions
    const filteredOrders = orders.filter((order) =>
        order.status === "Order Request by Warehouse"
        // order.invoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // order.manage_staff.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // order.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    


    // Handle search input
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // Export to Excel functionality
    // Inside BasicTable component



    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="ORDER" />



                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4">BEPOSOFT ORDERS</CardTitle>

                                    <div className="table-responsive">
                                        {loading ? (
                                            <div>Loading...</div>
                                        ) : error ? (
                                            <div className="text-danger">{error}</div>
                                        ) : filteredOrders.length === 0 ? (
                                            <div>No orders available.</div>
                                        ) : (
                                            <Table className="table mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>INVOICE NO</th>
                                                        <th>STAFF</th>
                                                        <th>CUSTOMER</th>
                                                        <th>STATUS</th>
                                                        <th>BILL AMOUNT</th>
                                                        <th>CREATED AT</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredOrders.map((order, index) => (
                                                        <tr key={order.id}>
                                                            <th scope="row">{index + 1}</th>
                                                            <td>
                                                                <Link to={`/warehouseorder/${order.id}/items/`}>
                                                                    {order.invoice}
                                                                </Link>
                                                            </td>
                                                            <td>{order.manage_staff} ({order.family})</td>
                                                            <td>{order.customer.name}</td>
                                                            <td style={getStatusColor(order.status)}>
                                                                {order.status}
                                                            </td>
                                                            <td>{order.total_amount}</td>
                                                            <td>{order.order_date}</td>
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

export default Warehouseorders;
