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
    Input,
    FormGroup,
    Button,
} from "reactstrap";

// Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";

// Debounce hook for search input
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

const BasicTable = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [staffFilter, setStaffFilter] = useState("");
    const [familyFilter, setFamilyFilter] = useState("");
    const [allStaffs, setAllStaffs] = useState([]);
    const [allFamilies, setAllFamilies] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState(""); // Start date filter
    const [endDate, setEndDate] = useState(""); // End date filter
    const token = localStorage.getItem("token");

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    useEffect(() => {
        const apiKey = import.meta.env.VITE_APP_KEY;

        if (!apiKey) {
            console.error("API key is missing");
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);

                const staffResponse = await axios.get(`${apiKey}staffs/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setAllStaffs(staffResponse.data.data);

                const familyResponse = await axios.get(`${apiKey}familys/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setAllFamilies(familyResponse.data.data);

                const salesResponse = await axios.get(`${apiKey}credit/sales/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setData(salesResponse.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                alert("Failed to fetch data. Please try again later.");
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredData = data.filter((item) => {
        const withinDateRange =
            (!startDate || new Date(item.date) >= new Date(startDate)) &&
            (!endDate || new Date(item.date) <= new Date(endDate));

        const matchesStaffFilter = !staffFilter || item.orders.some((order) => order.staff_name === staffFilter);
        const matchesFamilyFilter = !familyFilter || item.orders.some((order) => order.family_name === familyFilter);

        const matchesSearchTerm =
            !debouncedSearchTerm ||
            item.orders.some((order) =>
                order.staff_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                order.family_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            );

        return withinDateRange && matchesStaffFilter && matchesFamilyFilter && matchesSearchTerm;
    });

    const exportToExcel = () => {
        const formattedData = filteredData.map((item, index) => {
            const totalAmount = item.orders.reduce((sum, order) => sum + order.total_amount, 0);
            const paidAmount = item.orders.reduce(
                (sum, order) =>
                    sum +
                    order.recived_payment.reduce(
                        (paymentSum, payment) => paymentSum + parseFloat(payment.amount),
                        0
                    ),
                0
            );
            const pendingAmount = totalAmount - paidAmount;

            return {
                "#": index + 1,
                Date: item.date,
                "Total Orders": item.orders.length,
                "Total Amount": totalAmount,
                "Paid Amount": paidAmount,
                "Pending Amount": pendingAmount,
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Credit Sales Report");

        XLSX.writeFile(workbook, "Credit_Sales_Report.xlsx");
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="Basic Tables" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4 text-center">CREDIT SALES REPORT</CardTitle>

                                    <Row className="mb-4">
                                        <Col md={3}>
                                            <FormGroup>
                                                <label>Start Date</label>
                                                <Input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={3}>
                                            <FormGroup>
                                                <label>End Date</label>
                                                <Input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={3}>
                                            <FormGroup>
                                                <label>Staff</label>
                                                <Input
                                                    type="select"
                                                    value={staffFilter}
                                                    onChange={(e) => setStaffFilter(e.target.value)}
                                                >
                                                    <option value="">Select Staff</option>
                                                    {allStaffs.map((staff) => (
                                                        <option key={staff.id} value={staff.name}>
                                                            {staff.name}
                                                        </option>
                                                    ))}
                                                </Input>
                                            </FormGroup>
                                        </Col>
                                        <Col md={3}>
                                            <FormGroup>
                                                <label>Family</label>
                                                <Input
                                                    type="select"
                                                    value={familyFilter}
                                                    onChange={(e) => setFamilyFilter(e.target.value)}
                                                >
                                                    <option value="">Select Family</option>
                                                    {allFamilies.map((family) => (
                                                        <option key={family.id} value={family.name}>
                                                            {family.name}
                                                        </option>
                                                    ))}
                                                </Input>
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <Row className="mb-4">
                                        <Col>
                                            <FormGroup>
                                                <label>Search</label>
                                                <Input
                                                    type="text"
                                                    placeholder="Search by Staff or Family"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col className="text-right">
                                            <Button color="success" onClick={exportToExcel}>
                                                Export to Excel
                                            </Button>
                                        </Col>
                                    </Row>

                                    {loading ? (
                                        <div>Loading...</div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table className="table table-hover mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>DATE</th>
                                                        <th>TOTAL ORDERS</th>
                                                        <th>TOTAL AMOUNT</th>
                                                        <th>PAID AMOUNT</th>
                                                        <th>PENDING AMOUNT</th>
                                                        <th>ACTION</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredData.map((item, index) => {
                                                        const filteredOrders = item.orders.filter((order) => {
                                                            const matchesStaffFilter = !staffFilter || order.staff_name === staffFilter;
                                                            const matchesFamilyFilter = !familyFilter || order.family_name === familyFilter;
                                                            const matchesSearchTerm =
                                                                !debouncedSearchTerm ||
                                                                order.staff_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                                                                order.family_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

                                                            return matchesStaffFilter && matchesFamilyFilter && matchesSearchTerm;
                                                        });

                                                        const totalOrders = filteredOrders.length;
                                                        const totalAmount = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
                                                        const paidAmount = filteredOrders.reduce(
                                                            (sum, order) =>
                                                                sum +
                                                                order.recived_payment.reduce((paymentSum, payment) => paymentSum + parseFloat(payment.amount), 0),
                                                            0
                                                        );
                                                        const pendingAmount = totalAmount - paidAmount;

                                                        return (
                                                            <tr key={index}>
                                                                <th scope="row">{index + 1}</th>
                                                                <td>{item.date}</td>
                                                                <td>{totalOrders}</td>
                                                                <td>{totalAmount.toFixed(2)}</td>
                                                                <td>{paidAmount.toFixed(2)}</td>
                                                                <td>{pendingAmount.toFixed(2)}</td>
                                                                <td>
                                                                    <a
                                                                        href={`/credit/sales/report/${item.date}/`}
                                                                        style={{
                                                                            color: "#007bff",
                                                                            textDecoration: "none",
                                                                            fontWeight: "bold",
                                                                        }}
                                                                    >
                                                                        View
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>


                                            </Table>
                                        </div>
                                    )}
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
