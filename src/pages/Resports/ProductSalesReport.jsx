import React, { useState, useEffect } from "react";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    CardSubtitle,
    Input,
    Label,
    FormGroup,
    Button,
} from "reactstrap";
import * as XLSX from "xlsx";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import axios from "axios";

const BasicTable = () => {
    document.title = "Beposoft | Product Sold Report";

    const token = localStorage.getItem("token");

    const [tableData, setTableData] = useState([]);
    const [summary, setSummary] = useState(null);

    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [staffs, setStaffs] = useState([]);
    const [staffSearch, setStaffSearch] = useState("");
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [stateList, setStateList] = useState([]);
    const [selectedState, setSelectedState] = useState(null);

    const [loading, setLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [previousPage, setPreviousPage] = useState(null);

    const fetchStaffs = async (searchText = "") => {
        try {
            const params = new URLSearchParams();
            params.append("page", 1);

            if (searchText.trim()) {
                params.append("search", searchText.trim());
            }

            const response = await fetch(
                `${import.meta.env.VITE_APP_KEY}get/staffs/?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const res = await response.json();
            const staffList = res.results?.data || [];

            setStaffs(
                staffList
                    .filter((item) => item.approval_status === "approved")
                    .map((item) => ({
                        value: item.id,
                        label: item.name,
                    }))
            );
        } catch {
            toast.error("Failed to load staff");
        }
    };

    useEffect(() => {
        fetchStaffs();
    }, []);

    const fetchStates = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}states/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setStateList(
                (response?.data?.data || []).map((item) => ({
                    value: item.id,
                    label: item.name,
                }))
            );
        } catch (error) {
            toast.error("Failed to load States");
        }
    };

    useEffect(() => {
        fetchStates();
    }, []);

    const fetchData = async (page = 1, append = false) => {
        if (append && (!nextPage || loading)) return;

        try {
            setLoading(true);

            const params = new URLSearchParams();
            params.append("page", page);

            if (search.trim()) params.append("search", search.trim());
            if (selectedStaff?.value) params.append("staff_id", selectedStaff.value);
            if (selectedState?.value) params.append("state_id", selectedState.value);
            if (startDate) params.append("start_date", startDate);
            if (endDate) params.append("end_date", endDate);

            const response = await fetch(
                `${import.meta.env.VITE_APP_KEY}sold/products/?${params.toString()}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const res = await response.json();

            setCurrentPage(page);
            setTotalCount(res.count || 0);
            setNextPage(res.next);
            setPreviousPage(res.previous);
            setSummary(res.results?.summary || null);

            const newData = res.results?.data || [];

            setTableData((prev) =>
                append ? [...prev, ...newData] : newData
            );
        } catch (error) {
            toast.error("Error fetching product sales report");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(1);
    }, [selectedStaff, selectedState, startDate, endDate]);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const windowHeight = window.innerHeight;
            const fullHeight = document.documentElement.scrollHeight;

            if (
                scrollTop + windowHeight >= fullHeight - 300 &&
                nextPage &&
                !loading
            ) {
                fetchData(currentPage + 1, true);
            }
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [nextPage, loading, currentPage]);

    const handleSearch = () => {
        setCurrentPage(1);
        fetchData(1, false);
    };

    const resetFilters = () => {
        setSearch("");
        setSelectedStaff(null);
        setSelectedState(null);
        setStartDate("");
        setEndDate("");
        fetchData(1);
    };

    const exportToExcel = () => {
        const exportData = tableData.map((item) => ({
            Date: item.date,
            Product: item.product,
            Order: item.order,
            "Manage Staff": item.manage_staff,
            Family: item.family,
            Customer: item.customer,
            Status: item.status,
            "Total Sold": item.total_sold,
            "Total Amount": item.total_amount,
            Stock: item.stock || 0,
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Product Sales");
        XLSX.writeFile(workbook, "Product_Sales_Summary.xlsx");
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="Product Sold Report" />

                    <ToastContainer />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4">
                                        Product Sales Summary with Filters
                                    </CardTitle>
                                    <CardSubtitle className="card-title-desc">
                                        Filter product sold report by search, staff and date range.
                                    </CardSubtitle>

                                    <Row className="mb-4">
                                        <Col md={3}>
                                            <FormGroup>
                                                <Label>Search</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Search product, invoice, staff"
                                                    value={search}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleSearch();
                                                    }}
                                                />
                                            </FormGroup>
                                        </Col>

                                        <Col md={3}>
                                            <FormGroup>
                                                <Label>Manage Staff</Label>
                                                <Select
                                                    options={staffs}
                                                    value={selectedStaff}
                                                    onChange={setSelectedStaff}
                                                    isClearable
                                                    isSearchable
                                                    placeholder="All Staff..."
                                                    onMenuOpen={() => fetchStaffs()}
                                                    onInputChange={(inputValue, actionMeta) => {
                                                        if (actionMeta.action === "input-change") {
                                                            fetchStaffs(inputValue);
                                                        }
                                                    }}
                                                    noOptionsMessage={() => "No staff found"}
                                                />
                                            </FormGroup>
                                        </Col>

                                        <Col md={2}>
                                            <FormGroup>
                                                <Label>State</Label>
                                                <Select
                                                    options={stateList}
                                                    value={selectedState}
                                                    onChange={setSelectedState}
                                                    isClearable
                                                    isSearchable
                                                    placeholder="All States..."
                                                />
                                            </FormGroup>
                                        </Col>

                                        <Col md={2}>
                                            <FormGroup>
                                                <Label>Start Date</Label>
                                                <Input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>

                                        <Col md={2}>
                                            <FormGroup>
                                                <Label>End Date</Label>
                                                <Input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <Row className="mb-4">
                                        <Col md={12} className="text-end">
                                            <Button color="primary" className="me-2" onClick={handleSearch}>
                                                Search
                                            </Button>
                                            <Button color="secondary" className="me-2" onClick={resetFilters}>
                                                Reset
                                            </Button>
                                            {/* <Button color="success" onClick={exportToExcel}>
                                                Export to Excel
                                            </Button> */}
                                        </Col>
                                    </Row>
                                    <Button
                                        color="success"
                                        onClick={exportToExcel}
                                        style={{
                                            position: "fixed",
                                            right: "25px",
                                            bottom: "25px",
                                            zIndex: 9999,
                                            borderRadius: "50px",
                                            padding: "12px 22px",
                                            boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                                            fontWeight: "600",
                                        }}
                                    >
                                        Export to Excel
                                    </Button>

                                    {summary && (
                                        <Row className="mb-4">
                                            <Col md={3}>
                                                <Card className="border">
                                                    <CardBody>
                                                        <h6>Total Orders</h6>
                                                        <h4>{summary.total_orders || 0}</h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                            <Col md={3}>
                                                <Card className="border">
                                                    <CardBody>
                                                        <h6>Total Items</h6>
                                                        <h4>{summary.total_items || 0}</h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                            <Col md={3}>
                                                <Card className="border">
                                                    <CardBody>
                                                        <h6>Total Quantity</h6>
                                                        <h4>{summary.total_quantity || 0}</h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                            <Col md={3}>
                                                <Card className="border">
                                                    <CardBody>
                                                        <h6>Total Amount</h6>
                                                        <h4>₹{summary.total_amount || 0}</h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>
                                    )}

                                    <div className="table-responsive">
                                        <Table className="table table-bordered mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Date</th>
                                                    <th>Product Name</th>
                                                    <th>Order</th>
                                                    <th>Manage Staff</th>
                                                    <th>Family</th>
                                                    <th>Customer</th>
                                                    <th>State</th>
                                                    <th>Status</th>
                                                    <th>Total Sold</th>
                                                    <th>Total Amount</th>
                                                    <th>Remaining Stock</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {loading && tableData.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="12" className="text-center">
                                                            Loading...
                                                        </td>
                                                    </tr>
                                                ) : tableData.length > 0 ? (
                                                    tableData.map((item, index) => (
                                                        <tr key={index}>
                                                            <th scope="row">
                                                                {index + 1}
                                                            </th>
                                                            <td>{item.date}</td>
                                                            <td>{item.product}</td>
                                                            <td>{item.order}</td>
                                                            <td>{item.manage_staff}</td>
                                                            <td>{item.family}</td>
                                                            <td>{item.customer}</td>
                                                            <td>{item?.state}</td>
                                                            <td>{item.status}</td>
                                                            <td>{item.total_sold}</td>
                                                            <td>{item.total_amount}</td>
                                                            <td>{item.stock}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="12" className="text-center">
                                                            No records found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                    <Row className="mt-3 align-items-center">
                                        <Col md={12} className="text-center">
                                            <strong>Total Records: {totalCount}</strong>

                                            {loading && (
                                                <div className="mt-2">
                                                    Loading...
                                                </div>
                                            )}

                                            {!nextPage && tableData.length > 0 && (
                                                <div className="mt-2 text-muted">
                                                    No more records
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
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