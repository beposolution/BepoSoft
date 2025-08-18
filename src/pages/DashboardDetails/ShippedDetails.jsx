import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Table } from "reactstrap";
import axios from 'axios';
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ShippedDetails = () => {
    const [orders, setOrders] = useState([]);
    const token = localStorage.getItem("token")
    const [role, setRole] = useState(null)
    const [userData, setUserData] = useState();

    document.title = "Shipped Details | Beposoft";
    const status = "Shipped";

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
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}orders/${status}/`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setOrders(response?.data?.results || []);
            } catch (error) {
                toast.error("Error fetching order data");
            }
        };
        fetchOrdersData();
    }, [token, status]);

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const isSameDay = (isoString) => {
        if (!isoString) return false;
        // Robust to timezone: compare local-date parts
        const d = new Date(isoString);
        const ymd = new Date(d.getFullYear(), d.getMonth(), d.getDate())
            .toISOString()
            .slice(0, 10);
        return ymd === today;
    };

    const todaysOrders = orders.filter((order) => {
        // Prefer updated_at (shipment moment); fallback to order_date
        const shippedDateYmd = order.updated_at && isSameDay(order.updated_at);
        const fallbackYmd = !order.updated_at && order.order_date === today;

        if (!(shippedDateYmd || fallbackYmd)) return false;

        if (role === "ADMIN") return true;
        return order.family_id === userData;
    });

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="SHIPPED DETAILS" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <div className="table-responsive">
                                        <Table className="table mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>INVOICE NO</th>
                                                    <th>STAFF</th>
                                                    <th>CUSTOMER</th>
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
    );
};

export default ShippedDetails;
