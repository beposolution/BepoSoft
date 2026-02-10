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
import Breadcrumbs from "../../../components/Common/Breadcrumb";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pagination from "../../../components/Common/Pagination"
import Invoice from "../../PerfomaInvoive/Invoice";

const ViewInvoice = () => {
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

    document.title = "Seller Orders | Beposoft";

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
                apiUrl = `${baseUrl}product/seller/invoices/`;
            }

            const response = await axios.get(apiUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = response.data.data
            setOrders(data);

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
                                                        <th>Seller Name</th>
                                                        <th>BILL AMOUNT</th>
                                                        <th>CREATED AT</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentPageOrders?.map((order, index) => {

                                                        return (
                                                            <tr key={order?.id}>
                                                                <td>{index + 1}</td>
                                                                <td>
                                                                    <Link to={`/seller/invoice/${order.id}/`} style={{ fontWeight: "bold", color: "#0d6efd" }}>
                                                                        {order.invoice_no}
                                                                    </Link>
                                                                </td>
                                                                <td>{order.seller_name}</td>
                                                                <td>{order.total_amount}</td>
                                                                <td>{order.invoice_date}</td>
                                                            </tr>
                                                        );
                                                    })}
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

export default ViewInvoice;
