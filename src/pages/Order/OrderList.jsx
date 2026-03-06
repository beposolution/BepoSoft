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
    const [staffList, setStaffList] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [pageNumber, setPageNumber] = useState(1);

    document.title = "Orders | Beposoft";

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

    useEffect(() => {
        fetchStaff();
    }, []);

    useEffect(() => {
        if (token && role) {
            fetchOrders();
        }
    }, [token, role, searchTerm, selectedState, selectedStaff, startDate, endDate]);

    const fetchStaff = async () => {
        try {
            const baseUrl = import.meta.env.VITE_APP_KEY;

            const response = await axios.get(`${baseUrl}staffs/`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setStaffList(response.data.data);

        } catch (error) {
            console.error("Error fetching staff:", error);
        }
    };

    const fetchOrders = async (url = null) => {
        try {
            setLoading(true);

            const baseUrl = import.meta.env.VITE_APP_KEY;

            let apiUrl = url;

            if (!apiUrl) {

                const params = new URLSearchParams();

                if (searchTerm) params.append("search", searchTerm);
                if (selectedState) params.append("status", selectedState);
                if (selectedStaff) params.append("staff", selectedStaff);
                if (startDate) params.append("start_date", startDate);
                if (endDate) params.append("end_date", endDate);

                if (role === "BDM" || role === "BDO") {
                    apiUrl = `${baseUrl}family/department/orders/?${params.toString()}`;
                } else {
                    apiUrl = `${baseUrl}orders/?${params.toString()}`;
                }
            }

            const response = await axios.get(apiUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setNextPage(response.data.next);
            setPrevPage(response.data.previous);

            const pageMatch = apiUrl.match(/page=(\d+)/);
            const page = pageMatch ? parseInt(pageMatch[1]) : 1;
            setPageNumber(page);

            let results = [];

            if (Array.isArray(response.data)) {
                results = response.data;
            } else if (Array.isArray(response.data.results)) {
                results = response.data.results;
            } else if (Array.isArray(response.data.results?.results)) {
                results = response.data.results.results;
            }

            setOrders(results);

        } catch (error) {
            console.error(error);
            setError("Error fetching orders data.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
    };

    const filteredOrders = orders.filter(order => {
        const invoice = order.invoice?.toString().toLowerCase() || "";
        const customerName = order.customer?.name?.toLowerCase() || "";
        const order_date = order.order_date ? new Date(order.order_date) : null;

        const matchesStatus =
            selectedState === "" ||
            order.status?.toLowerCase() === selectedState.toLowerCase();

        const matchesStaff =
            selectedStaff === "" || order.manage_staff === selectedStaff;

        const matchesDate = (() => {
            if (!startDate && !endDate) return true;

            const orderDate = order.order_date?.substring(0, 10); // YYYY-MM-DD

            if (startDate && orderDate < startDate) return false;
            if (endDate && orderDate > endDate) return false;

            return true;
        })();

        return matchesStatus && matchesStaff && matchesDate;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case "Invoice Approved":
                return { color: "green", fontWeight: "bold" };
            case "Invoice Rejected":
                return { color: "red", fontWeight: "bold" };
            case "Waiting For Confirmation":
                return { color: "orange", fontWeight: "bold" };
            case "Packing under progress":
                return { color: "purple", fontWeight: "bold" };
            case "Invoice Created":
                return { color: "blue", fontWeight: "bold" };
            default:
                return {};
        }
    };

    const getRowStyleByPayment = (paymentStatus) => {
        if (!paymentStatus) return {};

        const status = paymentStatus.toLowerCase();

        if (status === "cod") {
            return { backgroundColor: "#d6ecff" };   // light blue
        }
        if (status === "credit") {
            return { backgroundColor: "#ffd6d6" };   // light red
        }

        return {};
    };

    const exportToExcel = () => {
        const formattedData = orders.map((order, index) => ({
            "Order #": index + 1,
            "Invoice No": order.invoice,
            "Company Name": order.company,
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
                        <Col md={3}>
                            <FormGroup>
                                <Label>Search by Invoice or Customer</Label>
                                <Input
                                    type="text"
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={2}>
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
                        <Col md={2}>
                            <FormGroup>
                                <Label>Filter by Staff</Label>
                                <Input
                                    type="select"
                                    value={selectedStaff}
                                    onChange={(e) => setSelectedStaff(e.target.value)}
                                >
                                    <option value="">All Staff</option>

                                    {staffList.map((staff) => (
                                        <option key={staff.id} value={staff.name}>
                                            {staff.name}
                                        </option>
                                    ))}

                                </Input>
                            </FormGroup>
                        </Col>


                        <Col md={2}>
                            <FormGroup>
                                <Label>From Date</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </FormGroup>
                        </Col>

                        <Col md={2}>
                            <FormGroup>
                                <Label>To Date</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={1} >
                            <FormGroup>
                                <Button color="success" onClick={exportToExcel}>Export to Excel</Button>
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4">BEPOSOFT ORDERS</CardTitle>
                                    <div className="table-responsive">
                                        {loading ? <div>Loading...</div> : error ? <div className="text-danger">{error}</div> : (
                                            <>
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
                                                        {orders?.map((order, index) => {
                                                            const rowStyle = getRowStyleByPayment(order?.payment_status);

                                                            return (
                                                                <tr key={order?.id}>
                                                                    <th scope="row" style={rowStyle}>
                                                                        {((pageNumber - 1) * 50) + index + 1}
                                                                    </th>

                                                                    <td style={rowStyle}>
                                                                        <Link
                                                                            to={`/order/${order?.id}/items/`}
                                                                            state={{ orderIds: orders.map(o => o.id) }}
                                                                        >
                                                                            {order?.invoice}
                                                                        </Link>
                                                                    </td>

                                                                    <td style={rowStyle}>
                                                                        {order?.manage_staff} ({order?.family})
                                                                    </td>

                                                                    <td style={rowStyle}>
                                                                        <Link to={`/customer/${order?.customer?.id}/ledger/`}>
                                                                            {order?.customer?.name}
                                                                        </Link>
                                                                    </td>

                                                                    <td
                                                                        style={{
                                                                            ...rowStyle,
                                                                            verticalAlign: "top",
                                                                            ...getStatusStyle(order?.status)
                                                                        }}
                                                                    >
                                                                        <strong>{order?.status}</strong>

                                                                        {(["Ready to ship", "Shipped"].includes(order?.status)) &&
                                                                            (order?.warehouse_data?.length > 0 ||
                                                                                order?.warehouse?.length > 0) && (
                                                                                <Table
                                                                                    bordered
                                                                                    size="sm"
                                                                                    className="mt-2"
                                                                                    style={{ width: "100%", fontSize: "12px" }}
                                                                                >
                                                                                    <thead>
                                                                                        <tr>
                                                                                            <th style={{ border: "1px solid green" }}>#</th>
                                                                                            <th style={{ border: "1px solid green" }}>Box</th>
                                                                                            <th style={{ border: "1px solid green" }}>Tracking ID</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {(order.warehouse_data ??
                                                                                            order.warehouse ??
                                                                                            []
                                                                                        ).map((entry, idx) => (
                                                                                            <tr key={idx}>
                                                                                                <td style={{ border: "1px solid green" }}>
                                                                                                    {idx + 1}
                                                                                                </td>
                                                                                                <td style={{ border: "1px solid green" }}>
                                                                                                    {entry.box}
                                                                                                </td>
                                                                                                <td style={{ border: "1px solid green" }}>
                                                                                                    {entry.tracking_id}
                                                                                                </td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </Table>
                                                                            )}
                                                                    </td>

                                                                    <td style={rowStyle}>
                                                                        {order?.total_amount?.toFixed(2)}
                                                                    </td>

                                                                    <td style={rowStyle}>
                                                                        {order?.order_date?.substring(0, 10)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>

                                                </Table>
                                                <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>

                                                    <Button
                                                        disabled={!prevPage}
                                                        onClick={() => fetchOrders(prevPage + `&search=${searchTerm}`)}
                                                    >
                                                        Previous
                                                    </Button>

                                                    <Button
                                                        disabled={!nextPage}
                                                        onClick={() => fetchOrders(nextPage + `&search=${searchTerm}`)}
                                                    >
                                                        Next
                                                    </Button>

                                                </div>

                                            </>

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
