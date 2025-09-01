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
import Invoice from "../PerfomaInvoive/Invoice";

const WaitingForConfirmation = () => {
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
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 25;
    const status = "Waiting For Confirmation";

    document.title = "Orders | Beposoft";

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

    useEffect(() => {
        if (token && role) fetchOrders();
    }, [token, role, status]);

    const fetchOrders = async (url = null) => {
        try {
            setLoading(true);

            let apiUrl = url;
            if (!apiUrl) {
                const baseUrl = import.meta.env.VITE_APP_KEY;
                if (role === "BDM" || role === "BDO") {
                    apiUrl = `${baseUrl}family/orders/`;
                } else {
                    apiUrl = `${baseUrl}orders/${status}/`;
                }
            }

            const response = await axios.get(apiUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });

            let results = Array.isArray(response.data)
                ? response.data
                : response.data.results || [];

            if (role === "Warehouse Admin" || role === "warehouse") {
                const filterOrders = results.filter(order => order.status === "To Print");
                setOrders(filterOrders);
            } else {
                setOrders(results);
            }
        } catch (error) {
            console.error("Fetch error:", error);
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
                                                            <td>
                                                                <Link
                                                                    to={`/order/${order?.id}/items/`}
                                                                    state={{ orderIds: filteredOrders.map(o => o.id) }}
                                                                >
                                                                    {order?.invoice}
                                                                </Link>
                                                            </td>
                                                            <td>{order?.manage_staff} ({order?.family})</td>
                                                            <td>
                                                                <Link to={`/customer/${order?.customer?.id}/ledger/`}>
                                                                    {order?.customer?.name}
                                                                </Link>
                                                            </td>
                                                            <td style={{ verticalAlign: "top", ...getStatusStyle(order?.status) }}>
                                                                <strong>{order?.status}</strong>

                                                                {(["Ready to ship", "Shipped"].includes(order?.status)) &&
                                                                    (order?.warehouse_data?.length > 0 || order?.warehouse?.length > 0) && (
                                                                        <Table bordered size="sm" className="mt-2" style={{ width: "100%", fontSize: "12px" }}>
                                                                            <thead>
                                                                                <tr>
                                                                                    <th style={{ border: "1px solid green" }}>#</th>
                                                                                    <th style={{ border: "1px solid green" }}>Box</th>
                                                                                    <th style={{ border: "1px solid green" }}>Tracking ID</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {(order.warehouse_data ?? order.warehouse ?? []).map((entry, idx) => (
                                                                                    <tr key={idx}>
                                                                                        <td style={{ border: "1px solid green" }}>{idx + 1}</td>
                                                                                        <td style={{ border: "1px solid green" }}>{entry.box}</td>
                                                                                        <td style={{ border: "1px solid green" }}>{entry.tracking_id}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </Table>
                                                                    )}
                                                            </td>
                                                            <td>{order?.total_amount?.toFixed(2)}</td>
                                                            <td>{order?.order_date?.substring(0, 10)}</td>
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

export default WaitingForConfirmation;
