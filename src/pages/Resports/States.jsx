import React, { useState, useEffect } from "react";
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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BasicTable = () => {
    const [salesData, setSalesData] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("active");

        axios
            .get(`${import.meta.env.VITE_APP_KEY}state/wise/report/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((response) => {
                const rawData = response.data.data;
                const processedData = [];

                rawData.forEach((state) => {
                    let totalOrdersCount = 0;
                    let totalAmount = 0;

                    const filteredOrders = (state.orders || []).map((orderGroup) => {
                        const waitingOrders = (orderGroup.waiting_orders || []).filter(order => {
                            if (role === "CSO") {
                                return order.family?.toLowerCase() !== "bepocart";
                            }
                            return true;
                        });

                        totalOrdersCount += waitingOrders.length;
                        totalAmount += waitingOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

                        return {
                            ...orderGroup,
                            waiting_orders: waitingOrders,
                        };
                    });

                    processedData.push({
                        ...state,
                        orders: filteredOrders,
                        total_orders_count: totalOrdersCount,
                        total_amount: totalAmount,
                    });
                });

                setSalesData(processedData);
            })
            .catch(() => {
                toast.error("There was an error fetching the data");
            });
    }, []);

    // function to count orders by status
    const getOrderCountByStatus = (sale, status) => {
        let count = 0;
        sale.orders?.forEach(orderGroup => {
            orderGroup.waiting_orders?.forEach(order => {
                switch (status) {
                    case "Delivered":
                        if (order.status === "Shipped") count++;
                        break;
                    case "Cancelled":
                        if (order.status === "Invoice Rejected") count++;
                        break;
                    case "Return":
                        if (order.status === "Return") count++;
                        break;
                    case "Rejected":
                        if (order.status === "Refund") count++;
                        break;
                    default:
                        break;
                }
            });
        });
        return count;
    };

    // function to sum amounts by status
    const getOrderAmountByStatus = (sale, status) => {
        let amount = 0;
        sale.orders?.forEach(orderGroup => {
            orderGroup.waiting_orders?.forEach(order => {
                switch (status) {
                    case "Delivered":
                        if (order.status === "Shipped") amount += Number(order.total_amount || 0);
                        break;
                    case "Cancelled":
                        if (order.status === "Invoice Rejected") amount += Number(order.total_amount || 0);
                        break;
                    case "Return":
                        if (order.status === "Return") amount += Number(order.total_amount || 0);
                        break;
                    case "Rejected":
                        if (order.status === "Refund") amount += Number(order.total_amount || 0);
                        break;
                    default:
                        break;
                }
            });
        });
        return amount;
    };

    const exportToExcel = () => {
        const data = salesData.map((sale, index) => ({
            "#": index + 1,
            "Name": sale.name,
            "Invoice Bill": sale.total_orders_count,
            "Invoice Amount": sale.total_amount,
            "Delivered Bill": getOrderCountByStatus(sale, "Delivered"),
            "Delivered Amount": getOrderAmountByStatus(sale, "Delivered"),
            "Cancelled Bill": getOrderCountByStatus(sale, "Cancelled"),
            "Cancelled Amount": getOrderAmountByStatus(sale, "Cancelled"),
            "Return Bill": getOrderCountByStatus(sale, "Return"),
            "Return Amount": getOrderAmountByStatus(sale, "Return"),
            "Rejected Bill": getOrderCountByStatus(sale, "Rejected"),
            "Rejected Amount": getOrderAmountByStatus(sale, "Rejected"),
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "State Wise Report");

        XLSX.writeFile(workbook, "State_Wise_Sales_Report.xlsx");
    };


    // Meta title
    document.title = "STATE WISE SALES REPORT | BEPOSOFT";


    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="STATE WISE SALES REPORT" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <Button color="success" className="mb-3" onClick={exportToExcel}>
                                        Export to Excel
                                    </Button>

                                    <div className="table-responsive">
                                        <Table
                                            className="table table-bordered"
                                            style={{
                                                border: "1px solid #dee2e6",
                                                borderRadius: "10px",
                                                overflow: "hidden",
                                                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.05)",
                                            }}
                                        >
                                            <thead style={{ backgroundColor: "#007bff", color: "#ffffff" }}>
                                                <tr>
                                                    <th className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}></th>
                                                    <th className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}></th>
                                                    <th colSpan="2" className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}>Invoice</th>
                                                    <th colSpan="2" className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}>Delivered</th>
                                                    <th colSpan="2" className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}>Cancelled</th>
                                                    <th colSpan="2" className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}>Return</th>
                                                    <th colSpan="2" className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}>Rejected</th>

                                                    <th className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}>Action</th>
                                                </tr>
                                                <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>#</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Name</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Bill</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Amount</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Bill</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Amount</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Bill</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Amount</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Bill</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Amount</th><th className="text-center" style={{ border: "1px solid #dee2e6" }}>Bill</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Amount</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {salesData.length > 0 ? (
                                                    salesData.map((sale, index) => (
                                                        <tr key={sale.id} style={{ backgroundColor: index % 2 === 0 ? "#f8f9fa" : "#ffffff" }}>
                                                            <th scope="row" className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{index + 1}</th>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{sale.name}</td>
                                                            {/* Invoice */}
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{sale.total_orders_count}</td>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{sale.total_amount}</td>
                                                            {/* Delivered */}
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{getOrderCountByStatus(sale, "Delivered")}</td>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{getOrderAmountByStatus(sale, "Delivered")}</td>
                                                            {/* Cancelled */}
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{getOrderCountByStatus(sale, "Cancelled")}</td>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{getOrderAmountByStatus(sale, "Cancelled")}</td>
                                                            {/* Return */}
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{getOrderCountByStatus(sale, "Return")}</td>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{getOrderAmountByStatus(sale, "Return")}</td>
                                                            {/* Rejected */}
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{getOrderCountByStatus(sale, "Rejected")}</td>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{getOrderAmountByStatus(sale, "Rejected")}</td>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                <a href={`/state/sales/view/${sale.name}/data/`} style={{ color: "#007bff", textDecoration: "none", fontWeight: "bold" }}>View</a>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="13" className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}>
                                                            No sales data available.
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
