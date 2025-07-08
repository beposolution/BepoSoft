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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pagination from "../../components/Common/Pagination"

const BasicTable = () => {
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
    const [userData, setUserData] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 25;

    document.title = "Orders | Beposoft";

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}profile/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(response?.data?.data?.family_name);
            } catch (error) {
                toast.error('Error fetching user data:');
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

    useEffect(() => {
        if (token && role) fetchOrders(`${import.meta.env.VITE_APP_KEY}orders/`);
    }, [token, role, userData]);

    const fetchOrders = async (url) => {
        if (!url) return;
        try {
            setLoading(true);
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (role === "Warehouse Admin" || role === "warehouse") {
                const filterOrders = response.data.results.filter(
                    order => order.status === "To Print"
                );
                setOrders(filterOrders);
            } else if (role === "BDM") {
                const filterOrders = response.data.results.filter(order => order.family === userData)
                setOrders(filterOrders);
            }
            else {
                setOrders(response.data.results);
            }
        } catch (error) {
            setError("Error fetching orders data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const invoice = order.invoice?.toString().toLowerCase() || "";
        const customerName = order.customer?.name?.toLowerCase() || "";

        const matchesSearch = searchTerm === "" ||
            invoice.includes(searchTerm.toLowerCase()) ||
            customerName.includes(searchTerm.toLowerCase());

        const matchesStatus = selectedState === "" ||
            order.status?.toLowerCase() === selectedState.toLowerCase();

        const matchesStaff = selectedStaff === "" ||
            order.manage_staff === selectedStaff;

        return matchesSearch && matchesStatus && matchesStaff;
    });

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentPageOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

    const getStatusStyle = (status) => {
        switch (status) {
            case "Invoice Approved":
                return { color: "green", fontWeight: "bold" };
            case "Invoice Rejected":
                return { color: "red", fontWeight: "bold" };
            case "Waiting For Confirmation":
                return { color: "orange", fontWeight: "bold" };
            case "Packing under progress":
                return { color: "gray", fontWeight: "bold" };
            case "Invoice Created":
                return { color: "blue", fontWeight: "bold" };
            default:
                return {};
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
                                    {['Invoice Approved',
                                        'Waiting For Confirmation',
                                        'To Print',
                                        'Packing under progress',
                                        'Packed',
                                        'Ready to ship',
                                        'Shipped',
                                        'Invoice Rejected',
                                        'Invoice created',].map(status => (
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
                                                    {currentPageOrders?.map((order, index) => (
                                                        <tr key={order?.id}>
                                                            <th scope="row">{indexOfFirstItem + index + 1}</th>
                                                            <td><Link to={`/order/${order?.id}/items/`}>{order?.invoice}</Link></td>
                                                            <td>{order?.manage_staff} ({order?.family})</td>
                                                            <td>
                                                                <Link to={`/customer/${order?.customer?.id}/ledger/`}>
                                                                    {order?.customer?.name}
                                                                </Link>
                                                            </td>
                                                            <td style={getStatusStyle(order?.status)}>
                                                                <strong>{order?.status}</strong>
                                                            </td>
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
                                    <Pagination
                                        perPageData={perPageData}
                                        data={filteredOrders}
                                        currentPage={currentPage}
                                        setCurrentPage={setCurrentPage}
                                        isShowingPageLength={true}
                                        paginationDiv="col-auto"
                                        paginationClass="pagination-rounded"
                                        indexOfFirstItem={indexOfFirstItem}
                                        indexOfLastItem={indexOfLastItem}
                                    />
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
