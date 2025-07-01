import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Table } from "reactstrap";
import axios from 'axios';
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const GRVWaitingForConfirmationDetails = () => {
    const [grv, setGRV] = useState([]);
    const token = localStorage.getItem("token")
    const [role, setRole] = useState(null)
    const [userData, setUserData] = useState();

    document.title = "Shipped Details | Beposoft";

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
        const fetchGRVData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}grv/data/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setGRV(response?.data?.data || []);
            } catch (error) {
                toast.error('Error fetching order data:');
            }
        };
        fetchGRVData();
    }, []);

    const pendingGrv = grv.filter(order => {
        if (order.status !== "pending") return false;

        if (role === "ADMIN") {
            return true; // Admin sees all pending GRV
        }

        // Non-admins: show only if family matches userData
        return order.family === userData;
    });

    // Function to determine the remark text color
    const getRemarkTextClass = (remark) => {
        switch (remark) {
            case "return":
                return "text-info"; // Light Blue text
            case "refund":
                return "text-secondary"; // Gray text
            default:
                return "";
        }
    };

    // Function to determine the status text color
    const getStatusTextClass = (status) => {
        switch (status) {
            case "pending":
                return "text-warning"; // Yellow text
            case "approved":
                return "text-success"; // Green text
            case "rejected":
                return "text-danger"; // Red text
            default:
                return "";
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="GRV WAITING FOR CONFIRMATION" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <div className="table-responsive">
                                        <Table className="table mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Product / Invoice / Amount</th>
                                                    <th>Condition / Qty</th>
                                                    <th>Invoice Created By</th>
                                                    <th>Customer</th>
                                                    <th>Invoice Created</th>
                                                    <th>Invoice Delivered</th>
                                                    <th>Remark</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pendingGrv.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="7" className="text-center">No orders for today</td>
                                                    </tr>
                                                ) : (
                                                    pendingGrv.map((order, index) => (
                                                        <tr key={order.id}>
                                                            <th scope="row">{index + 1}</th>
                                                            <td>{order.product} / {order.order} / {order.price}</td>
                                                            <td>{order.returnreason}</td>
                                                            <td>{order.staff}</td>
                                                            <td>{order.customer}</td>
                                                            <td>{order.date}- {order.time}</td>
                                                            <td>{order.order_date}</td>
                                                            <td>
                                                                <select
                                                                    className={`form-select ${getRemarkTextClass(order.remark)}`}
                                                                    value={order.remark}
                                                                    onChange={(e) =>
                                                                        handleChange(order.id, "remark", e.target.value)
                                                                    }
                                                                >
                                                                    <option value="return">return</option>
                                                                    <option value="refund">refund</option>
                                                                </select>
                                                            </td>
                                                            <td>
                                                                <select
                                                                    className={`form-select ${getStatusTextClass(order.status)}`}
                                                                    value={order.status}
                                                                    onChange={(e) =>
                                                                        handleChange(order.id, "status", e.target.value)
                                                                    }
                                                                >
                                                                    <option value="pending">Pending</option>
                                                                    <option value="approved">Approved</option>
                                                                    <option value="rejected">Reject</option>
                                                                </select>
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

export default GRVWaitingForConfirmationDetails;
