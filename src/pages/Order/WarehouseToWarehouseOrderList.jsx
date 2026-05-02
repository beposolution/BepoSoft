import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Table,
    Row,
    Col,
    Spinner,
    Button,
    Input,
    FormGroup,
    Label,
    Card,
    CardBody
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pagination from "../../components/Common/Pagination";

const WarehouseToWarehouseOrderList = () => {
    const token = localStorage.getItem("token");

    const [warehouseOrders, setWarehouseOrders] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [staffs, setStaffs] = useState([]);

    const [loading, setLoading] = useState(true);
    const [filterLoading, setFilterLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [selectedWarehouse, setSelectedWarehouse] = useState("");
    const [selectedReceiverWarehouse, setSelectedReceiverWarehouse] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("");
    const [selectedStaff, setSelectedStaff] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [previousPage, setPreviousPage] = useState(null);

    const pageSize = 50;

    const authHeaders = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    useEffect(() => {
        fetchWarehouseData();
        fetchCompanyData();
        fetchStaffData();
        fetchWarehouseOrders(1);
    }, []);

    const fetchWarehouseData = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}warehouse/add/`, authHeaders);
            setWarehouses(response.data && Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            toast.error("Failed to fetch warehouses");
        }
    }

    const fetchCompanyData = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}company/data/`, authHeaders);
            setCompanies(response.data.data && Array.isArray(response.data.data) ? response.data.data : []);
        } catch (error) {
            toast.error("Failed to fetch companies");
        }
    }

    const fetchStaffData = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, authHeaders);
            setStaffs(response.data.data && Array.isArray(response.data.data) ? response.data.data : []);
        } catch (error) {
            toast.error("Failed to fetch staff");
        }
    }

    const fetchWarehouseOrders = async (page = 1) => {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            params.append("page", page);

            if (search.trim()) {
                params.append("search", search.trim());
            }

            if (selectedWarehouse) {
                params.append("warehouses", selectedWarehouse);
            }

            if (selectedReceiverWarehouse) {
                params.append("receiiver_warehouse", selectedReceiverWarehouse);
            }

            if (selectedCompany) {
                params.append("company", selectedCompany);
            }

            if (selectedStaff) {
                params.append("manage_staff", selectedStaff);
            }

            if (selectedStatus) {
                params.append("status", selectedStatus);
            }

            if (fromDate) {
                params.append("from_date", fromDate);
            }

            if (toDate) {
                params.append("to_date", toDate);
            }

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}warehouse/order/get/view/?${params.toString()}`,
                authHeaders
            );

            const responseData = response.data;

            setTotalCount(responseData?.count || 0);
            setNextPage(responseData?.next || null);
            setPreviousPage(responseData?.previous || null);

            setWarehouseOrders(
                responseData?.results?.data ||
                responseData?.results?.results ||
                responseData?.results ||
                []
            );

            setCurrentPage(page);
        } catch (error) {
            toast.error("Failed to fetch warehouse orders");
        } finally {
            setLoading(false);
            setFilterLoading(false);
        }
    };

    const handleApplyFilter = () => {
        setFilterLoading(true);
        fetchWarehouseOrders(1);
    };

    const handleResetFilter = () => {
        setSearch("");
        setSelectedWarehouse("");
        setSelectedReceiverWarehouse("");
        setSelectedCompany("");
        setSelectedStaff("");
        setSelectedStatus("");
        setFromDate("");
        setToDate("");
        setCurrentPage(1);

        setTimeout(() => {
            fetchWarehouseOrders(1);
        }, 100);
    };

    const handlePageChange = (page) => {
        if (page < 1) return;
        fetchWarehouseOrders(page);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    const getStatusBadgeStyle = (status) => {
        const normalizedStatus = String(status || "").toLowerCase();

        const statusStyles = {
            created: {
                backgroundColor: "#e3f2fd",
                color: "#0d6efd",
                border: "1px solid #0d6efd",
            },
            approved: {
                backgroundColor: "#e8f5e9",
                color: "#198754",
                border: "1px solid #198754",
            },
            completed: {
                backgroundColor: "#d1e7dd",
                color: "#0f5132",
                border: "1px solid #0f5132",
            },
            received: {
                backgroundColor: "#e0f7fa",
                color: "#087990",
                border: "1px solid #087990",
            },
            rejected: {
                backgroundColor: "#f8d7da",
                color: "#dc3545",
                border: "1px solid #dc3545",
            },
            cancelled: {
                backgroundColor: "#f1f1f1",
                color: "#6c757d",
                border: "1px solid #6c757d",
            },
        };

        return (
            statusStyles[normalizedStatus] || {
                backgroundColor: "#fff3cd",
                color: "#997404",
                border: "1px solid #997404",
            }
        );
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="WAREHOUSE ORDERS LIST" />

                    <Card className="mb-3">
                        <CardBody>
                            <Row>
                                <Col md={3}>
                                    <FormGroup>
                                        <Label>Search Invoice</Label>
                                        <Input
                                            type="text"
                                            placeholder="Search invoice"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </FormGroup>
                                </Col>

                                <Col md={3}>
                                    <FormGroup>
                                        <Label>Requesting Warehouse</Label>
                                        <Input
                                            type="select"
                                            value={selectedWarehouse}
                                            onChange={(e) => setSelectedWarehouse(e.target.value)}
                                        >
                                            <option value="">All Warehouses</option>
                                            {warehouses.map((warehouse) => (
                                                <option key={warehouse.id} value={warehouse.id}>
                                                    {warehouse.name}
                                                </option>
                                            ))}
                                        </Input>
                                    </FormGroup>
                                </Col>

                                <Col md={3}>
                                    <FormGroup>
                                        <Label>Receiver Warehouse</Label>
                                        <Input
                                            type="select"
                                            value={selectedReceiverWarehouse}
                                            onChange={(e) => setSelectedReceiverWarehouse(e.target.value)}
                                        >
                                            <option value="">All Receiver Warehouses</option>
                                            {warehouses.map((warehouse) => (
                                                <option key={warehouse.id} value={warehouse.id}>
                                                    {warehouse.name}
                                                </option>
                                            ))}
                                        </Input>
                                    </FormGroup>
                                </Col>

                                <Col md={3}>
                                    <FormGroup>
                                        <Label>Company</Label>
                                        <Input
                                            type="select"
                                            value={selectedCompany}
                                            onChange={(e) => setSelectedCompany(e.target.value)}
                                        >
                                            <option value="">All Companies</option>
                                            {companies.map((company) => (
                                                <option key={company.id} value={company.id}>
                                                    {company.name}
                                                </option>
                                            ))}
                                        </Input>
                                    </FormGroup>
                                </Col>

                                <Col md={3}>
                                    <FormGroup>
                                        <Label>Staff</Label>
                                        <Input
                                            type="select"
                                            value={selectedStaff}
                                            onChange={(e) => setSelectedStaff(e.target.value)}
                                        >
                                            <option value="">All Staff</option>
                                            {staffs.map((staff) => (
                                                <option key={staff.id} value={staff.id}>
                                                    {staff.name || staff.username}
                                                </option>
                                            ))}
                                        </Input>
                                    </FormGroup>
                                </Col>

                                <Col md={3}>
                                    <FormGroup>
                                        <Label>Status</Label>
                                        <Input
                                            type="select"
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                        >
                                            <option value="">All Status</option>
                                            <option value="Created">Created</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Received">Received</option>
                                            <option value="Rejected">Rejected</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </Input>
                                    </FormGroup>
                                </Col>

                                <Col md={3}>
                                    <FormGroup>
                                        <Label>From Date</Label>
                                        <Input
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                        />
                                    </FormGroup>
                                </Col>

                                <Col md={3}>
                                    <FormGroup>
                                        <Label>To Date</Label>
                                        <Input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                        />
                                    </FormGroup>
                                </Col>

                                <Col md={12} className="d-flex gap-2 mt-2">
                                    <Button
                                        color="primary"
                                        onClick={handleApplyFilter}
                                        disabled={filterLoading}
                                    >
                                        {filterLoading ? "Filtering..." : "Apply Filter"}
                                    </Button>

                                    <Button
                                        color="secondary"
                                        onClick={handleResetFilter}
                                    >
                                        Reset
                                    </Button>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    {loading ? (
                        <div className="text-center my-5">
                            <Spinner color="primary" style={{ width: "3rem", height: "3rem" }} />
                            <p className="mt-2">Loading orders...</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <Table bordered hover>
                                    <thead className="table-light">
                                        <tr>
                                            <th>NO</th>
                                            <th>INVOICE</th>
                                            <th>REQUESTING WAREHOUSE</th>
                                            <th>REQUESTED TO</th>
                                            <th>COMPANY</th>
                                            <th>STATUS</th>
                                            <th>STAFF</th>
                                            <th>DATE</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {warehouseOrders.length > 0 ? (
                                            warehouseOrders.map((order, index) => (
                                                <tr key={order.id}>
                                                    <td>{(currentPage - 1) * pageSize + index + 1}</td>

                                                    <td>
                                                        <Link to={`/warehouse/orders/list/${order.invoice}`}>
                                                            {order.invoice}
                                                        </Link>
                                                    </td>

                                                    <td>{order.warehouses_name || "-"}</td>
                                                    <td>{order.receiiver_warehouse_name || "-"}</td>
                                                    <td>{order.company_name || "-"}</td>

                                                    <td>
                                                        <span
                                                            style={{
                                                                ...getStatusBadgeStyle(order.status),
                                                                padding: "5px 12px",
                                                                borderRadius: "20px",
                                                                fontSize: "12px",
                                                                fontWeight: "700",
                                                                display: "inline-block",
                                                                minWidth: "90px",
                                                                textAlign: "center",
                                                                textTransform: "uppercase",
                                                            }}
                                                        >
                                                            {order.status || "-"}
                                                        </span>
                                                    </td>

                                                    <td>{order.manage_staff || "-"}</td>
                                                    <td>{order.order_date || "-"}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="text-center">
                                                    No warehouse orders found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mt-3">
                                <div>
                                    <strong>Total:</strong> {totalCount}
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                    <Button
                                        color="secondary"
                                        size="sm"
                                        disabled={!previousPage}
                                        onClick={() => handlePageChange(currentPage - 1)}
                                    >
                                        Previous
                                    </Button>

                                    <span>
                                        Page {currentPage} {totalPages > 0 ? `of ${totalPages}` : ""}
                                    </span>

                                    <Button
                                        color="secondary"
                                        size="sm"
                                        disabled={!nextPage}
                                        onClick={() => handlePageChange(currentPage + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>

                            {/* If your existing Pagination component is needed, you can replace above buttons with this */}
                            {/* 
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                            */}
                        </>
                    )}
                </div>
            </div>

            <ToastContainer />
        </React.Fragment>
    );
};

export default WarehouseToWarehouseOrderList;