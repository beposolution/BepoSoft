import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
    Table,
    Row,
    Col,
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

const BasicTable = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedState, setSelectedState] = useState("");
    const [selectedStaff, setSelectedStaff] = useState("");
    const token = localStorage.getItem("token");

    document.title = "Orders | Beposoft";

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}staff/orders/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setOrders(response.data.data);
            } catch (error) {
                setError("Error fetching orders data. Please try again later.");
                console.error("Error fetching orders data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [token]);

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
        (order.invoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedState === "" || order.status === selectedState) &&
        (selectedStaff === "" || order.manage_staff === selectedStaff)
    );

    // Handle search input
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // Export to Excel functionality
    // Inside BasicTable component

const exportToExcel = () => {
    // Flattening the data structure to make it Excel-friendly
    const formattedData = orders.flatMap((order, index) => {
        return order.items.map((item, itemIndex) => ({
            "Order #": index + 1,
            "Invoice No": order.invoice,
            "Order Date": order.order_date,
            "Status": order.status,
            "Customer Name": order.customer.name,
            "Customer Phone": order.customer.phone,
            "Customer Email": order.customer.email,
            "Billing Address": `${order.billing_address.address}, ${order.billing_address.city}, ${order.billing_address.state}, ${order.billing_address.zipcode}`,  // Combined as a single string
            "Staff": order.manage_staff,
            "Family": order.family,
            "Total Amount": order.total_amount,
            "Payment Method": order.payment_method,
            "Bank": order.bank ? order.bank.name : "N/A",
            "Item #": itemIndex + 1,
            "Product Name": item.name,
            "Quantity": item.quantity,
            "Unit Price": item.price,
            "Rate (Without GST)": item.rate,
            "Tax %": item.tax,
            "Exclude Price": item.exclude_price,
            "Item Total": item.price * item.quantity,
            "Images": item.images.join(", ")  // Concatenate image URLs as a single string
        }));
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    XLSX.writeFile(workbook, "Orders_List.xlsx");
};


    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="ORDER" />
                    <Row className="align-items-end mb-3">
                        <Col md={4}>
                            <FormGroup className="w-100 mb-0">
                                <Label>Search by Invoice or Customer</Label>
                                <Input
                                    type="text"
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={handleSearch}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup className="w-100 mb-0">
                                <Label>Filter by Status</Label>
                                <Input
                                    type="select"
                                    value={selectedState}
                                    onChange={(e) => setSelectedState(e.target.value)}
                                >
                                    <option value="">All Status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Waiting For Confirmation">Waiting For Confirmation</option>
                                    <option value="To Print">To Print</option>
                                    <option value="Invoice Created">Invoice Created</option>
                                    <option value="Invoice Approved">Invoice Approved</option>
                                    <option value="Invoice Rejectd">Invoice Rejectd</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Refunded">Refunded</option>
                                    <option value="Rejected">Rejected</option>
                                    <option value="Return">Return</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </Input>
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup className="w-100 mb-0">
                                <Label>Filter by Staff</Label>
                                <Input
                                    type="select"
                                    value={selectedStaff}
                                    onChange={(e) => setSelectedStaff(e.target.value)}
                                >
                                    <option value="">All Staff</option>
                                    {[...new Set(orders.map(order => order.manage_staff))].map((staff, index) => (
                                        <option key={index} value={staff}>
                                            {staff}
                                        </option>
                                    ))}
                                </Input>
                            </FormGroup>
                        </Col>
                        <Col md={2} className="d-flex justify-content-end">
                            <Button color="success" onClick={exportToExcel} className="w-100">
                                Export to Excel
                            </Button>
                        </Col>
                    </Row>


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
                                                                <Link to={`/order/${order.id}/items/`}>
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

export default BasicTable;
