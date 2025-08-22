import React, { useEffect, useState } from "react";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    CardSubtitle,
} from "reactstrap";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const BasicTable = () => {
    // Meta title
    document.title = "GRV List | Beposoft";

    // State to hold table data
    const [tableData, setTableData] = useState([]);
    const token = localStorage.getItem("token");

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}grv/data/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                setTableData(response.data.data);
            } catch (error) {
                toast.error("Error fetching data:");
            }
        };

        fetchData();
    }, []);

    // Handle the change for remark and status
    const handleChange = async (id, field, value) => {
        try {
            // Prepare the data to send in the body
            const data = {
                [field]: value,
            };

            // Update the record on the server using axios (PATCH or PUT depending on your API)
            const response = await axios.put(`${import.meta.env.VITE_APP_KEY}grv/update/${id}/`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            // If successful, you can update the local state (optimistic update)
            if (response.data) {
                const updatedData = tableData.map((item) =>
                    item.id === id ? { ...item, [field]: value } : item
                );
                setTableData(updatedData);
            }
        } catch (error) {
            toast.error("Error updating data:");
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

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="GRV LIST" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <div className="table-responsive">
                                        <Table className="table table-bordered mb-0 custom-table">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>NO</th>
                                                    <th>Product / Invoice / Amount</th>
                                                    <th>Condition</th>
                                                    <th>Quantity</th>
                                                    <th>Invoice Created By</th>
                                                    <th>Customer</th>
                                                    <th>Description</th>
                                                    <th>Invoice Delivered</th>
                                                    <th>Remark</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tableData.length > 0 ? (
                                                    tableData.map((item, index) => (
                                                        <tr key={item.id}>
                                                            <th scope="row">{index + 1}</th>
                                                            <td>{item.product} / {item.order} / {item.price}</td>
                                                            <td>{item.returnreason}</td>
                                                            <td>{item.quantity}</td>
                                                            <td>{item.staff}</td>
                                                            <td>{item.customer}</td>
                                                            <td>{item.note || "N/A"}</td>
                                                            <td>{item.order_date}</td>
                                                            <td>
                                                                <select
                                                                    className={`form-select ${getRemarkTextClass(item.remark)}`}
                                                                    value={item.remark}
                                                                    onChange={(e) =>
                                                                        handleChange(item.id, "remark", e.target.value)
                                                                    }
                                                                >
                                                                    <option value="return">Return</option>
                                                                    <option value="refund">Refund</option>
                                                                    <option value="exchange">Exchange</option>
                                                                </select>
                                                            </td>
                                                            <td>
                                                                <select
                                                                    className={`form-select ${getStatusTextClass(item.status)}`}
                                                                    value={item.status}
                                                                    onChange={(e) =>
                                                                        handleChange(item.id, "status", e.target.value)
                                                                    }
                                                                >
                                                                    <option value="pending">Pending</option>
                                                                    <option value="approved">Approved</option>
                                                                    <option value="rejected">Reject</option>
                                                                    <option value="Waiting For Approval">Waiting For Approval</option>
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="10" className="text-center">
                                                            No data available
                                                        </td>
                                                    </tr>
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

export default BasicTable;
