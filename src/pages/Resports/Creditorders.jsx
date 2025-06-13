import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Row, Col, Card, CardBody, CardTitle, Input, Button } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Link, useParams } from "react-router-dom";
import * as XLSX from "xlsx";

const BasicTable = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("");
    const [selectedFamily, setSelectedFamily] = useState("");
    const [selectedState, setSelectedState] = useState(""); // New state for selected state
    const [companies, setCompanies] = useState([]);
    const [families, setFamilies] = useState([]);
    const [states, setStates] = useState([]); // New state for unique states
    const { date } = useParams();
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

                const filteredOrders = response.data?.results?.filter(
                    (order) =>
                        order.payment_status === "credit" && order.order_date === date
                );

                setOrders(filteredOrders);

                const companyList = [
                    ...new Set(filteredOrders.map((order) => order.company.name)),
                ];
                setCompanies(companyList);

                const familyList = [
                    ...new Set(filteredOrders.map((order) => order.family)),
                ];
                setFamilies(familyList);

                const stateList = [
                    ...new Set(filteredOrders.map((order) => order.state)),
                ];
                setStates(stateList);
            } catch (error) {
                setError("Error fetching orders data. Please try again later.");
                console.error("Error fetching orders data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [date, token]);

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

    const filteredOrders = orders.filter((order) => {
        const matchesSearchTerm =
            order.manage_staff.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.company.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCompanyFilter =
            selectedCompany === "" || order.company.name === selectedCompany;
        const matchesFamilyFilter =
            selectedFamily === "" || order.family === selectedFamily;
        const matchesStateFilter =
            selectedState === "" || order.state === selectedState;
        return matchesSearchTerm && matchesCompanyFilter && matchesFamilyFilter && matchesStateFilter;
    });

    const exportToExcel = () => {
        const exportData = filteredOrders.map((order) => ({
            Invoice: order.invoice,
            "Managed Staff": order.manage_staff,
            Family: order.family,
            Customer: order.customer.name,
            "Total Amount": order.total_amount,
            Status: order.status,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Filtered Orders");
        XLSX.writeFile(wb, "filtered_orders.xlsx");
    };

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

                                    <Row className="mb-3">
                                        <Col md={3}>
                                            <Input
                                                type="text"
                                                placeholder="Search orders..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="mb-3"
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Input
                                                type="select"
                                                value={selectedCompany}
                                                onChange={(e) => setSelectedCompany(e.target.value)}
                                                className="mb-3"
                                            >
                                                <option value="">All Companies</option>
                                                {companies.map((company) => (
                                                    <option key={company} value={company}>
                                                        {company}
                                                    </option>
                                                ))}
                                            </Input>
                                        </Col>
                                        <Col md={3}>
                                            <Input
                                                type="select"
                                                value={selectedFamily}
                                                onChange={(e) => setSelectedFamily(e.target.value)}
                                                className="mb-3"
                                            >
                                                <option value="">All Families</option>
                                                {families.map((family) => (
                                                    <option key={family} value={family}>
                                                        {family}
                                                    </option>
                                                ))}
                                            </Input>
                                        </Col>
                                        <Col md={3}>
                                            <Input
                                                type="select"
                                                value={selectedState}
                                                onChange={(e) => setSelectedState(e.target.value)}
                                                className="mb-3"
                                            >
                                                <option value="">All States</option>
                                                {states.map((state) => (
                                                    <option key={state} value={state}>
                                                        {state}
                                                    </option>
                                                ))}
                                            </Input>
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col>
                                            <Button color="primary" onClick={exportToExcel} className="mb-3">
                                                Export to Excel
                                            </Button>
                                        </Col>
                                    </Row>

                                    <div className="table-responsive">
                                        {loading ? (
                                            <div>Loading...</div>
                                        ) : error ? (
                                            <div className="text-danger">{error}</div>
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
                                                    {filteredOrders.length > 0 ? (
                                                        filteredOrders.map((order, index) => (
                                                            <React.Fragment key={order.id}>
                                                                <tr>
                                                                    <th scope="row">{index + 1}</th>
                                                                    <td>
                                                                        <Link to={`/order/${order.id}/items/`}>
                                                                            {order.invoice}
                                                                        </Link>
                                                                    </td>
                                                                    <td>{order.manage_staff} ({order.family})</td>
                                                                    <td>{order.customer.name}</td>
                                                                    <td
                                                                        style={getStatusColor(order.status)}
                                                                        className="position-relative"
                                                                    >
                                                                        {order.status}
                                                                    </td>
                                                                    <td>{order.total_amount}</td>
                                                                    <td>{order.order_date}</td>
                                                                </tr>
                                                            </React.Fragment>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="7" className="text-center text-muted">
                                                                No orders match your search.
                                                            </td>
                                                        </tr>
                                                    )}
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
