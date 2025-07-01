import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Table } from "reactstrap";
import axios from 'axios';
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TodaysBillDetails = () => {
    const [orders, setOrders] = useState([]);
    const token = localStorage.getItem("token")
    const [role, setRole] = useState(null)
    const [userData, setUserData] = useState();

    document.title = "Todays Bill | Beposoft";

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}profile/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(response?.data?.data?.family);
            } catch (error) {
                toast.error('Error fetching user data:');
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        const fetchOrdersData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}orders/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrders(response?.data?.results || []);
            } catch (error) {
                toast.error('Error fetching order data:');
            }
        };
        fetchOrdersData();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return { color: 'red' };
            case 'Processing':
                return { color: 'orange' };
            case 'Invoice Created':
                return { color: 'green' };
            case 'Cancelled':
                return { color: 'gray' };
            default:
                return { color: 'black' };
        }
    };

    const today = new Date().toISOString().split('T')[0];

    // Show all today's orders for ADMIN, otherwise only matching family
    const todaysOrders = orders.filter(order => {
        if (role === "ADMIN") {
            return order.order_date === today;
        } else {
            // If order.family_id and userData are both IDs
            if (order.family_id && userData) {
                return order.order_date === today && order.family_id === userData;
            }
            // If order.family_name and userData are both names
            if (order.family_name && userData) {
                return order.order_date === today && order.family_name === userData;
            }
            // If order.family is an object and userData is an object with id or name
            if (typeof order.family === "object" && typeof userData === "object") {
                return order.order_date === today && (order.family.id === userData.id || order.family.name === userData.name);
            }
            return false;
        }
    });

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="TODAYS BILL" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <div className="table-responsive">
                                        <div>Loading</div>
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
                                                {todaysOrders.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="7" className="text-center">No orders for today</td>
                                                    </tr>
                                                ) : (
                                                    todaysOrders.map((order, index) => (
                                                        <tr key={order?.id}>
                                                            <td>{index + 1}</td>
                                                            <td>
                                                                <Link to={`/perfoma/invoice/${order.invoice}/view/`}>
                                                                    {order.invoice}
                                                                </Link>
                                                            </td>
                                                            <td>{order?.manage_staff?.name || order?.manage_staff || "-"}</td>
                                                            <td>{order?.customer?.name || order?.customer || "-"}</td>
                                                            <td style={getStatusColor(order.status)}>
                                                                {order.status}
                                                            </td>
                                                            <td>{order?.total_amount}</td>
                                                            <td>{order?.order_date}</td>
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
    )
};

export default TodaysBillDetails;
