import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
    Table,
    Row,
    Col,
    Spinner,
    Card,
    CardBody,
    CardTitle,
    Button,
    Input,
    FormGroup,
    Label
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pagination from "../../components/Common/Pagination";

const WarehouseToWarehouseOrderList = () => {
    const [warehouseOrders, setWarehouseOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchWarehouseOrders = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}warehouse/order/view/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setWarehouseOrders(response.data.data || []);
            } catch (error) {
                toast.error("Failed to fetch warehouse orders");
            } finally {
                setLoading(false);
            }
        };

        fetchWarehouseOrders();
    }, []);

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="ORDERS LIST" />
                    <Row className="align-items-end mb-3"></Row>

                    {loading ? (
                        <div className="text-center my-5">
                            <Spinner color="primary" style={{ width: "3rem", height: "3rem" }} />
                            <p className="mt-2">Loading orders...</p>
                        </div>
                    ) : (
                        <Table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>INVOICE</th>
                                    <th>REQUESTING WAREHOUSE</th>
                                    <th>REQUESTED TO</th>
                                    <th>STATUS</th>
                                    <th>STAFF</th>
                                    <th>DATE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {warehouseOrders.map((order, index) => (
                                    <tr key={order.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <Link to={`/warehouse/orders/list/${order.invoice}`}>
                                                {order.invoice}
                                            </Link>
                                        </td>
                                        <td>{order.warehouses_name}</td>
                                        <td>{order.receiiver_warehouse_name}</td>
                                        <td><strong>{order.status}</strong></td>
                                        <td>{order.manage_staff}</td>
                                        <td>{order.order_date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </div>
            </div>
            <ToastContainer />
        </React.Fragment>
    );
};

export default WarehouseToWarehouseOrderList;
