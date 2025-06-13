import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Input,
    Button,
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const BasicTable = () => {
    const [salesData, setSalesData] = useState([]);
    const [filteredSalesData, setFilteredSalesData] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [states, setStates] = useState([]);
    const [familys, setFamilies] = useState([]);
    const [stateFilter, setStateFilter] = useState("");
    const [familyFilter, setFamilyFilter] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");

        // Fetch sales data
        axios
            .get(`${import.meta.env.VITE_APP_KEY}salesreport/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => {
                setSalesData(response.data.sales_report);
                setFilteredSalesData(response.data.sales_report);
            })
            .catch((error) => console.error("Error fetching sales data:", error));

        // Fetch states
        axios
            .get(`${import.meta.env.VITE_APP_KEY}states/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => setStates(response.data.data))
            .catch((error) => console.error("Error fetching states:", error));

        // Fetch families
        axios
            .get(`${import.meta.env.VITE_APP_KEY}familys/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => setFamilies(response.data.data))
            .catch((error) => console.error("Error fetching families:", error));
    }, []);

    const handleFilter = () => {
        const filteredData = salesData.filter((sale) => {
            const saleDate = new Date(sale.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            return (
                (!start || saleDate >= start) &&
                (!end || saleDate <= end) &&
                (!stateFilter || sale.order_details.some(order => order.state__name === stateFilter)) &&
                (!familyFilter || sale.order_details.some(order => order.family__name === familyFilter))
            );
        });

        setFilteredSalesData(filteredData);
    };

    const calculateTotals = (orders, statuses) => {
        return orders
            .filter(order => statuses.includes(order.status))
            .reduce(
                (totals, order) => {
                    totals.count += 1;
                    totals.amount += order.total_amount || 0;
                    return totals;
                },
                { count: 0, amount: 0 }
            );
    };

    const approvedStatuses = ["Approved", "Invoice Approved", "Completed", "Shipped", "Waiting For Confirmation", "To Print", "Invoice Created"];
    const rejectedStatuses = ["Cancelled", "Refunded", "Invoice Rejected", "Return"];

    const exportToExcel = () => {
        const data = filteredSalesData.map((sale, index) => {
            const approved = calculateTotals(sale.order_details, approvedStatuses);
            const rejected = calculateTotals(sale.order_details, rejectedStatuses);

            return {
                "No": index + 1,
                "Date": sale.date,
                "Total Orders": sale.order_details.length,
                "Total Amount": sale.order_details.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2),
                "Approved Orders": approved.count,
                "Approved Amount": approved.amount.toFixed(2),
                "Rejected Orders": rejected.count,
                "Rejected Amount": rejected.amount.toFixed(2),
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");

        XLSX.writeFile(workbook, "Sales_Report.xlsx");
    };

    document.title = "Basic Tables | Skote - Vite React Admin & Dashboard Template";

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="Basic Tables" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4 text-center mt-4 mb-4" style={{ borderBottom: "2px solid #007bff", paddingBottom: "10px" }}>
                                        STATE SALES REPORTS
                                    </CardTitle>

                                    <Row className="mb-3">
                                        <Col md={3}>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                placeholder="Start Date"
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                placeholder="End Date"
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Input
                                                type="select"
                                                value={stateFilter}
                                                onChange={(e) => setStateFilter(e.target.value)}
                                            >
                                                <option value="">All States</option>
                                                {states.map((state) => (
                                                    <option key={state.id} value={state.name}>
                                                        {state.name}
                                                    </option>
                                                ))}
                                            </Input>
                                        </Col>
                                        <Col md={3}>
                                            <Input
                                                type="select"
                                                value={familyFilter}
                                                onChange={(e) => setFamilyFilter(e.target.value)}
                                            >
                                                <option value="">All Families</option>
                                                {familys.map((family) => (
                                                    <option key={family.id} value={family.name}>
                                                        {family.name}
                                                    </option>
                                                ))}
                                            </Input>
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col md={12} className="text-center">
                                            <Button color="primary" onClick={handleFilter} className="mr-2">
                                                Filter
                                            </Button>
                                            <Button color="success" onClick={exportToExcel}>
                                                Export to Excel
                                            </Button>
                                        </Col>
                                    </Row>

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
                                                    <th className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}>#</th>
                                                    <th className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}>Date</th>
                                                    <th colSpan="2" className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}>Invoice</th>
                                                    <th colSpan="2" className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}>Approved</th>
                                                    <th colSpan="2" className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}>Rejected</th>
                                                    <th className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}>Action</th>
                                                </tr>
                                                <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>No</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Date</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Bill</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Amount</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Bill</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Amount</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Bill</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Amount</th>
                                                    <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Action</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {filteredSalesData.length > 0 ? (
                                                    filteredSalesData.map((sale, index) => {
                                                        const totalOrders = sale.order_details.length;
                                                        const totalAmount = sale.order_details.reduce((sum, order) => sum + order.total_amount, 0);
                                                        const approved = calculateTotals(sale.order_details, approvedStatuses);
                                                        const rejected = calculateTotals(sale.order_details, rejectedStatuses);

                                                        return (

                                                            <tr key={sale.id} style={{ backgroundColor: index % 2 === 0 ? "#f8f9fa" : "#ffffff" }}>
                                                                <th scope="row" className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{index + 1}</th>
                                                                <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{sale.date}</td>
                                                                <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{totalOrders}</td>
                                                                <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{totalAmount.toFixed(2)}</td>
                                                                <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{approved.count}</td>
                                                                <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{approved.amount.toFixed(2)}</td>
                                                                <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{rejected.count}</td>
                                                                <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{rejected.amount.toFixed(2)}</td>
                                                                <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                    <a href={`/sales/view/${sale.date}/data/`} style={{ color: "#007bff", textDecoration: "none", fontWeight: "bold" }}>View</a>

                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan="10" className="text-center">
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
