import React, { useEffect, useState } from "react";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Input,
    Label, 
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Link } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination";

const BasicTable = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [performaInvoice, setPerfomaInvoice] = useState([]);
    const token = localStorage.getItem("token");
    const [role, setRole] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPageData] = useState(25);
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

    document.title = "BEPOSOFT | PROFORMA INVOICE ";

    // Fetch Orders (ADMIN)
    const fetchOrders = async (fromDate = "", toDate = "") => {
        try {
            let url = `${import.meta.env.VITE_APP_KEY}perfoma/invoices/`;
            if (fromDate && toDate) {
                url += `?start_date=${fromDate}&end_date=${toDate}`;
            }

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            if (!response.ok) throw new Error("Error fetching orders data");

            const data = await response.json();
            setOrders(data.data);
        } catch (error) {
            setError("Error fetching orders data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch Performa Invoices (STAFF)
    const fetchPerformaInvoices = async (fromDate = "", toDate = "") => {
        try {
            let url = `${import.meta.env.VITE_APP_KEY}performa/invoice/staff/`;
            if (fromDate && toDate) {
                url += `?start_date=${fromDate}&end_date=${toDate}`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPerfomaInvoice(response?.data?.data);
        } catch (error) {
            toast.error("Error fetching proforma data");
        }
    };

    useEffect(() => {
        if (role === "ADMIN") fetchOrders();
        else fetchPerformaInvoices();
    }, [role]);

    // Handle Date Filter
    const handleFilter = () => {
        if (!startDate || !endDate) {
            toast.error("Please select both Start and End dates!");
            return;
        }

        setLoading(true);
        if (role === "ADMIN") fetchOrders(startDate, endDate);
        else fetchPerformaInvoices(startDate, endDate);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Pending":
                return { color: "red" };
            case "Approved":
                return { color: "blue" };
            case "Shipped":
                return { color: "yellow" };
            case "Processing":
                return { color: "orange" };
            case "Completed":
                return { color: "green" };
            case "Cancelled":
                return { color: "gray" };
            default:
                return { color: "black" };
        }
    };

    // Choose data source based on role
    const data = role === "ADMIN" ? orders : performaInvoice;

    // Filter data based on search input
    const filteredData = data.filter((item) => {
        const invoice = item.invoice?.toString().toLowerCase() || "";
        const staff = (role === "ADMIN" ? item.manage_staff_name : item.staffname)?.toLowerCase() || "";
        const customer = (role === "ADMIN"
            ? item.customer?.name
            : item.customermame
        )?.toLowerCase() || "";
        const status = item.status?.toLowerCase() || "";
        const amount = item.total_amount?.toString().toLowerCase() || "";

        const term = searchTerm.toLowerCase();
        return (
            invoice.includes(term) ||
            staff.includes(term) ||
            customer.includes(term) ||
            status.includes(term) ||
            amount.includes(term)
        );
    });

    // Pagination
    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="PROFORMA INVOICES" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <CardTitle className="h4">BEPOSOFT PROFORMA INVOICES</CardTitle>
                                        </Col>
                                    </Row>

                                    <Row className="align-items-end mb-3">

                                        <Col md={4}>
                                            <Label>Search</Label>
                                            <Input
                                                type="text"
                                                placeholder="Search Invoice, Staff, Customer, Status, Amount..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Label>Start Date</Label>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Label>End Date</Label>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </Col>
                                        <Col md={2}>
                                            <button
                                                className="btn btn-primary mt-3"
                                                onClick={handleFilter}
                                            >
                                                Apply Filter
                                            </button>
                                        </Col>


                                    </Row>

                                    <div className="table-responsive">
                                        {loading ? (
                                            <div>Loading...</div>
                                        ) : error ? (
                                            <div className="text-danger">{error}</div>
                                        ) : filteredData.length === 0 ? (
                                            <div>No matching records found.</div>
                                        ) : (
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
                                                        {currentData.map((item, index) => (
                                                            <tr key={item.id}>
                                                                <th scope="row">{indexOfFirstItem + index + 1}</th>
                                                                <td>
                                                                    <Link to={`/perfoma/invoice/${item.invoice}/view/`}>
                                                                        {item.invoice}
                                                                    </Link>
                                                                </td>
                                                                {role === "ADMIN" ? (
                                                                    <>
                                                                        <td>
                                                                            {item.manage_staff_name} ({item.familyname})
                                                                        </td>
                                                                        <td>{item.customer ? item.customer.name : "N/A"}</td>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <td>{item.staffname}</td>
                                                                        <td>{item.customermame}</td>
                                                                    </>
                                                                )}
                                                                <td style={getStatusColor(item.status)}>
                                                                    {item.status}
                                                                </td>
                                                                <td>{item.total_amount}</td>
                                                                <td>{item.order_date}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>

                                                {/* Pagination */}
                                                <Paginations
                                                    perPageData={perPageData}
                                                    data={filteredData}
                                                    currentPage={currentPage}
                                                    setCurrentPage={setCurrentPage}
                                                    isShowingPageLength={true}
                                                    paginationDiv="col-auto"
                                                    paginationClass="pagination pagination-rounded"
                                                    indexOfFirstItem={indexOfFirstItem}
                                                    indexOfLastItem={indexOfLastItem}
                                                />
                                            </>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
            <ToastContainer />
        </React.Fragment>
    );
};

export default BasicTable;
