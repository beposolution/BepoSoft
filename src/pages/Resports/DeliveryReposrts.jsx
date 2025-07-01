import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    Button,
} from "reactstrap";
import * as XLSX from "xlsx";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Link, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BasicTable = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("token");

    document.title = "DELIVERY REPORTS | BEPOSOFT";

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}warehouse/box/detail/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setOrders(response.data);
            } catch (error) {
                setError("Error fetching orders data. Please try again later.");
                toast.error("Error fetching orders data:");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [token]);

    const exportToExcel = () => {
        const data = orders.map((order, index) => ({
            "#": index + 1,
            "Date": order.shipped_date,
            "Total Box Delivered": order.total_boxes,
            "Total Volume Wt. (KG)": order.total_volume_weight,
            "Total Actual Wt. (KG)": order.total_weight,
            "Total Delivery Charge": order.total_parcel_amount,
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Delivery Reports");

        XLSX.writeFile(workbook, "Delivery_Reports.xlsx");
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="DELIVERY REPORTS" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <Button color="success" className="mb-3" onClick={exportToExcel}>
                                        Export to Excel
                                    </Button>
                                    <div className="table-responsive">
                                        {loading ? (
                                            <div className="d-flex justify-content-center">
                                                <div className="spinner-border" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                            </div>
                                        ) : error ? (
                                            <div className="text-danger">{error}</div>
                                        ) : (
                                            <Table className="table custom-table text-center mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>DATE</th>
                                                        <th>TOTAL BOX DELIVERED</th>
                                                        <th>TOTAL VOLUME WT. (IN KG.)</th>
                                                        <th>TOTAL ACTUAL WT.</th>
                                                        <th>TOTAL DELIVERY CHARGE</th>
                                                        <th>ACTION</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orders.map((order, index) => (
                                                        <tr key={order.id}>
                                                            <th scope="row">{index + 1}</th>
                                                            <td>{order.shipped_date}</td>
                                                            <td>{order.total_boxes}</td>
                                                            <td>{order.total_volume_weight} KG</td>
                                                            <td>{order.total_weight} KG</td>
                                                            <td>{order.total_parcel_amount}</td>
                                                            <td>
                                                                <Link to={`/delivery/${order.shipped_date}/reports/`} className="btn btn-primary btn-sm">
                                                                    View Details
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    <tr style={{ fontWeight: "bold", background: "#f8f9fa" }}>
                                                        <td className="text-end">Total</td>
                                                        <td></td>
                                                        <td>
                                                            {orders.reduce((sum, order) => sum + (Number(order.total_boxes) || 0), 0)}
                                                        </td>
                                                        <td>
                                                            {orders.reduce((sum, order) => sum + (Number(order.total_volume_weight) || 0), 0)} KG
                                                        </td>
                                                        <td>
                                                            {orders.reduce((sum, order) => sum + (Number(order.total_weight) || 0), 0)} KG
                                                        </td>
                                                        <td>
                                                            {orders.reduce((sum, order) => sum + (Number(order.total_parcel_amount) || 0), 0)}
                                                        </td>
                                                        <td></td>
                                                    </tr>
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
