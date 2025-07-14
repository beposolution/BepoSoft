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
import Paginations from "../../components/Common/Pagination";

const BasicTable = () => {
    document.title = "Beposoft | Product Sold Report";

    const [tableData, setTableData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [staffs, setStaffs] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const token = localStorage.getItem("token");
    const [role, setRole] = useState(null)
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 15;

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}sold/products/`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setTableData(data);
            setFilteredData(data);

            // Extract unique staff names
            const uniqueStaffs = Array.from(
                new Set(data.flatMap((group) => group.data.map((item) => item.manage_staff)))
            );
            setStaffs(uniqueStaffs);
        } catch (error) {
            toast.error("Error fetching data");
        }
    };

    useEffect(() => {
        const filtered = tableData
            .map((group) => ({
                ...group,
                data: group.data.filter((item) => {
                    const isStaffMatch =
                        !selectedStaff || item.manage_staff === selectedStaff;
                    const isDateMatch =
                        (!startDate || new Date(group.date) >= new Date(startDate)) &&
                        (!endDate || new Date(group.date) <= new Date(endDate));

                    // Exclude family === 'bepocart' only if role === 'CSO'
                    const isFamilyAllowed = !(role === "CSO" && item.family === "bepocart");

                    return isStaffMatch && isDateMatch && isFamilyAllowed;
                }),
            }))
            .filter((group) => group.data.length > 0);

        setFilteredData(filtered);
    }, [selectedStaff, startDate, endDate, tableData, role]);

    // Fetch data on component mount
    useEffect(() => {
        fetchData();
    }, []);

    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    // Function to export table data to Excel
    const exportToExcel = () => {
        // Prepare data for export
        const exportData = filteredData.flatMap((group) =>
            group.data.map((item) => ({
                Date: group.date,
                Product: group.product,
                "Manage Staff": item.manage_staff,
                "Total Orders": group.data.length,
                "Total Sold Products": item.total_sold,
                "Total Amount": item.total_amount,
                Stock: group.stock || 0, // Add stock from group
            }))
        );

        // Create worksheet and workbook
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Product Sales");

        // Save workbook
        XLSX.writeFile(workbook, "Product_Sales_Summary.xlsx");
    };


    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="Filtered Tables" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4">Product Sales Summary with Filters</CardTitle>
                                    <CardSubtitle className="card-title-desc">
                                        Filter data by staff and date range.
                                    </CardSubtitle>

                                    {/* Filters Section */}
                                    <Row className="mb-4">
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="staffSelect">Manage Staff</Label>
                                                <Input
                                                    type="select"
                                                    id="staffSelect"
                                                    value={selectedStaff}
                                                    onChange={(e) => setSelectedStaff(e.target.value)}
                                                >
                                                    <option value="">All Staff</option>
                                                    {staffs.map((staff, index) => (
                                                        <option key={index} value={staff}>
                                                            {staff}
                                                        </option>
                                                    ))}
                                                </Input>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="startDate">Start Date</Label>
                                                <Input
                                                    type="date"
                                                    id="startDate"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="endDate">End Date</Label>
                                                <Input
                                                    type="date"
                                                    id="endDate"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    {/* Export Button */}
                                    <Row className="mb-4">
                                        <Col md={12} className="text-end">
                                            <Button color="success" onClick={exportToExcel}>
                                                Export to Excel
                                            </Button>
                                        </Col>
                                    </Row>

                                    {/* Table Section */}
                                    <div className="table-responsive">
                                        <Table className="table table-bordered mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Date</th>
                                                    <th>Product Name</th>
                                                    <th>Total Orders</th>
                                                    <th>Total Sold Products</th>
                                                    <th>Total Amount</th>
                                                    <th>Remaining Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentItems.map((group, index) => {
                                                    const totalOrders = group.data.length;
                                                    const totalSoldProducts = group.data.reduce(
                                                        (sum, item) => sum + item.total_sold,
                                                        0
                                                    );
                                                    const totalAmount = group.data.reduce(
                                                        (sum, item) => sum + item.total_amount,
                                                        0
                                                    );
                                                    const remainingStock = group.data.reduce(
                                                        (sum, item) => sum + item.remaining_stock,
                                                        0
                                                    );

                                                    return (
                                                        <tr key={index}>
                                                            <th scope="row">{indexOfFirstItem + index + 1}</th>
                                                            <td>{group.date}</td>
                                                            <td>{group.product}</td>
                                                            <td>{totalOrders}</td>
                                                            <td>{totalSoldProducts}</td>
                                                            <td>{totalAmount}</td>
                                                            <td>{group.stock}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </Table>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                    <Paginations
                        perPageData={perPageData}
                        data={filteredData}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        isShowingPageLength={true}
                        paginationDiv="col-auto"
                        paginationClass="pagination-rounded"
                        indexOfFirstItem={indexOfFirstItem}
                        indexOfLastItem={indexOfLastItem}
                    />
                </div>
            </div>
        </React.Fragment>
    );
};

export default BasicTable;
