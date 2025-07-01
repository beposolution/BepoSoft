import React, { useEffect, useState, useRef } from "react";
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

const OrderList2 = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedState, setSelectedState] = useState("");
    const [selectedStaff, setSelectedStaff] = useState("");
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const token = localStorage.getItem("token");
    const [role, setRole] = useState(null);

    document.title = "Orders | Beposoft";

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

    useEffect(() => {
        if (token && role) fetchOrders(`${import.meta.env.VITE_APP_KEY}orders/`);
    }, [token, role]);

    const fetchOrders = async (url) => {
        if (!url) return;
        try {
            setLoading(true);
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (role === "Warehouse Admin" || role === "warehouse") {
                const filterOrders = response.data.results.filter(
                    order => order.status === "Packed"
                );
                setOrders(filterOrders);
            } else {
                setOrders(response.data.results);
            }
        } catch (error) {
            setError("Error fetching orders data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        const formattedData = orders.map((order, index) => ({
            "Order #": index + 1,
            "Invoice No": order.invoice,
            "Order Date": order.order_date,
            "Status": order.status,
            "Customer Name": order.customer.name,
            "Customer Phone": order.customer.phone,
            "Customer Email": order.customer.email,
            "Staff": order.manage_staff,
            "Family": order.family,
            "Total Amount": order.total_amount,
            "Payment Method": order.payment_method
        }));

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
        XLSX.writeFile(workbook, "Orders_List.xlsx");
    };
    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="ORDERS LIST" />
                    <Row className="align-items-end mb-3">
                        <Col md={4}>
                            <FormGroup>
                                <Label>Search by Invoice or Customer</Label>
                                <Input type="text" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Filter by Status</Label>
                                <Input type="select" value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
                                    <option value="">All Status</option>
                                    {['Pending', 'Approved', 'Shipped', 'Processing', 'Completed', 'Cancelled', 'toprint',].map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </Input>
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Filter by Staff</Label>
                                <Input type="select" value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}>
                                    <option value="">All Staff</option>
                                    {[...new Set(orders.map(order => order.manage_staff))].map((staff, index) => (
                                        <option key={index} value={staff}>{staff}</option>
                                    ))}
                                </Input>
                            </FormGroup>
                        </Col>
                        <Col md={2} className="d-flex justify-content-end">
                            <Button color="success" onClick={exportToExcel}>Export to Excel</Button>
                        </Col>
                    </Row>
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4">BEPOSOFT ORDERS</CardTitle>
                                    <div className="table-responsive">
                                        {loading ? <div>Loading...</div> : error ? <div className="text-danger">{error}</div> : (
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
                                                    {orders?.map((order, index) => (
                                                        <tr key={order?.id}>
                                                            <th scope="row">{index + 1}</th>
                                                            <td><Link to={`/order/${order?.id}/items/`}>{order?.invoice}</Link></td>
                                                            <td>{order?.manage_staff} ({order?.family})</td>
                                                            <td>{order?.customer?.name}</td>
                                                            <td>{order?.status}</td>
                                                            <td>{order?.total_amount}</td>
                                                            <td>
                                                                {order?.order_date
                                                                    ? order.order_date.substring(0, 10)
                                                                    : ''}
                                                            </td>
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
}

export default OrderList2;