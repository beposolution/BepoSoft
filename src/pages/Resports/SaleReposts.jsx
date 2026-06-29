import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    Input,
    Button,
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination";

const BasicTable = () => {
    const [salesData, setSalesData] = useState([]);
    const [filteredSalesData, setFilteredSalesData] = useState([]);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [states, setStates] = useState([]);
    const [familys, setFamilies] = useState([]);
    const [staffs, setStaffs] = useState([]);

    const [stateFilter, setStateFilter] = useState("");
    const [familyFilter, setFamilyFilter] = useState("");
    const [staffFilter, setStaffFilter] = useState("");

    const role = localStorage.getItem("active");

    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 10;

    const approvedStatuses = [
        "Approved",
        "Invoice Approved",
        "Completed",
        "Shipped",
        "Waiting For Confirmation",
        "To Print",
        "Invoice Created",
        "Packing under progress",
        "Ready to ship",
        "Processing",
    ];

    const rejectedStatuses = [
        "Cancelled",
        "Refunded",
        "Invoice Rejected",
        "Return",
    ];

    useEffect(() => {
        fetchSalesReport();
        fetchStates();
        fetchFamilies();
        fetchStaffs();
    }, []);

    const processSalesData = (rawData) => {
        let processedData = (rawData || [])
            .map((entry) => {
                const filteredOrders = (entry.order_details || []).filter(
                    (order) => order.status !== "Invoice Rejected"
                );

                return {
                    ...entry,
                    order_details: filteredOrders,
                };
            })
            .filter((entry) => entry.order_details.length > 0);

        if (role === "CSO") {
            processedData = processedData
                .map((entry) => {
                    const filteredOrders = (entry.order_details || []).filter(
                        (order) =>
                            order.family__name?.toLowerCase() !== "bepocart"
                    );

                    return {
                        ...entry,
                        order_details: filteredOrders,
                    };
                })
                .filter((entry) => entry.order_details.length > 0);
        }

        return processedData;
    };

    const fetchSalesReport = async (params = {}) => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}salesreport/`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params,
                }
            );

            const processedData = processSalesData(response.data.sales_report);

            setSalesData(processedData);
            setFilteredSalesData(processedData);
            setCurrentPage(1);
        } catch (error) {
            toast.error("Error fetching sales data");
        }
    };

    const fetchStates = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}states/`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setStates(response.data.data || []);
        } catch (error) {
            toast.error("Error fetching states");
        }
    };

    const fetchFamilies = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}familys/`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setFamilies(response.data.data || []);
        } catch (error) {
            toast.error("Error fetching families");
        }
    };

    const fetchStaffs = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}staffs/`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setStaffs(response.data.data || []);
        } catch (error) {
            toast.error("Error fetching staffs");
        }
    };

    const handleFilter = async () => {
        const params = {};

        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (familyFilter) params.family = familyFilter;
        if (staffFilter) params.manage_staff = staffFilter;

        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}salesreport/`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params,
                }
            );

            let processedData = processSalesData(response.data.sales_report);

            if (stateFilter) {
                processedData = processedData
                    .map((sale) => {
                        const filteredOrders = sale.order_details.filter(
                            (order) => order.state__name === stateFilter
                        );

                        return {
                            ...sale,
                            order_details: filteredOrders,
                        };
                    })
                    .filter((sale) => sale.order_details.length > 0);
            }

            setFilteredSalesData(processedData);
            setCurrentPage(1);
        } catch (error) {
            toast.error("Error filtering sales data");
        }
    };

    const clearFilter = () => {
        setStartDate("");
        setEndDate("");
        setStateFilter("");
        setFamilyFilter("");
        setStaffFilter("");
        fetchSalesReport();
    };

    const calculateTotals = (orders, statuses) => {
        return orders
            .filter((order) => statuses.includes(order.status))
            .reduce(
                (totals, order) => {
                    totals.count += 1;
                    totals.amount += Number(order.total_amount || 0);
                    return totals;
                },
                { count: 0, amount: 0 }
            );
    };

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentData = filteredSalesData.slice(
        indexOfFirstItem,
        indexOfLastItem
    );

    const exportToExcel = () => {
        const data = filteredSalesData.map((sale, index) => {
            const approved = calculateTotals(
                sale.order_details,
                approvedStatuses
            );
            const rejected = calculateTotals(
                sale.order_details,
                rejectedStatuses
            );

            return {
                No: index + 1,
                Date: sale.date,
                "Total Orders": sale.order_details.length,
                "Total Amount": sale.order_details
                    .reduce(
                        (sum, order) => sum + Number(order.total_amount || 0),
                        0
                    )
                    .toFixed(2),
                "Approved Orders": approved.count,
                "Approved Amount": approved.amount.toFixed(2),
                "Rejected Orders": rejected.count,
                "Rejected Amount": rejected.amount.toFixed(2),
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
        XLSX.writeFile(workbook, "Sales_Report.xlsx");
    };

    const totalApproved = filteredSalesData.reduce(
        (acc, sale) => {
            const approved = calculateTotals(
                sale.order_details,
                approvedStatuses
            );

            acc.count += approved.count;
            acc.amount += approved.amount;

            return acc;
        },
        { count: 0, amount: 0 }
    );

    document.title = "Beposoft | Sales Report";

    return (
        <React.Fragment>
            <ToastContainer />

            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs
                        title="Tables"
                        breadcrumbItem="SALES REPORTS"
                    />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <Row className="mb-3">
                                        <Col md={2}>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) =>
                                                    setStartDate(e.target.value)
                                                }
                                            />
                                        </Col>

                                        <Col md={2}>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) =>
                                                    setEndDate(e.target.value)
                                                }
                                            />
                                        </Col>

                                        <Col md={2}>
                                            <Input
                                                type="select"
                                                value={stateFilter}
                                                onChange={(e) =>
                                                    setStateFilter(
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    All States
                                                </option>
                                                {states.map((state) => (
                                                    <option
                                                        key={state.id}
                                                        value={state.name}
                                                    >
                                                        {state.name}
                                                    </option>
                                                ))}
                                            </Input>
                                        </Col>

                                        <Col md={2}>
                                            <Input
                                                type="select"
                                                value={familyFilter}
                                                onChange={(e) =>
                                                    setFamilyFilter(
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    All Divisions
                                                </option>
                                                {familys.map((family) => (
                                                    <option
                                                        key={family.id}
                                                        value={family.id}
                                                    >
                                                        {family.name}
                                                    </option>
                                                ))}
                                            </Input>
                                        </Col>

                                        <Col md={2}>
                                            <Input
                                                type="select"
                                                value={staffFilter}
                                                onChange={(e) =>
                                                    setStaffFilter(
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    All Staff
                                                </option>
                                                {staffs.map((staff) => (
                                                    <option
                                                        key={staff.id}
                                                        value={staff.id}
                                                    >
                                                        {staff.name}
                                                    </option>
                                                ))}
                                            </Input>
                                        </Col>

                                        <Col md={2}>
                                            <div className="d-flex gap-2">
                                                <Button
                                                    color="primary"
                                                    onClick={handleFilter}
                                                >
                                                    Filter
                                                </Button>

                                                <Button
                                                    color="secondary"
                                                    onClick={clearFilter}
                                                >
                                                    Clear
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col
                                            md={12}
                                            className="text-center"
                                        >
                                            <Button
                                                color="success"
                                                onClick={exportToExcel}
                                            >
                                                Export to Excel
                                            </Button>
                                        </Col>
                                    </Row>

                                    <div className="table-responsive">
                                        <Table
                                            className="table table-bordered"
                                            style={{
                                                border: "1px solid #dee2e6",
                                                borderRadius: "10px",
                                                overflow: "hidden",
                                                boxShadow:
                                                    "0 4px 8px rgba(0, 0, 0, 0.05)",
                                            }}
                                        >
                                            <thead
                                                style={{
                                                    backgroundColor: "#007bff",
                                                    color: "#ffffff",
                                                }}
                                            >
                                                <tr>
                                                    <th
                                                        className="text-center"
                                                        style={{
                                                            padding: "12px",
                                                            border:
                                                                "1px solid #dee2e6",
                                                        }}
                                                    >
                                                        #
                                                    </th>
                                                    <th
                                                        className="text-center"
                                                        style={{
                                                            padding: "12px",
                                                            border:
                                                                "1px solid #dee2e6",
                                                        }}
                                                    >
                                                        Date
                                                    </th>
                                                    <th
                                                        colSpan="2"
                                                        className="text-center"
                                                        style={{
                                                            padding: "12px",
                                                            border:
                                                                "1px solid #dee2e6",
                                                        }}
                                                    >
                                                        Approved
                                                    </th>
                                                    <th
                                                        className="text-center"
                                                        style={{
                                                            padding: "12px",
                                                            border:
                                                                "1px solid #dee2e6",
                                                        }}
                                                    >
                                                        Action
                                                    </th>
                                                </tr>

                                                <tr
                                                    style={{
                                                        backgroundColor:
                                                            "#f8f9fa",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    <th
                                                        className="text-center"
                                                        style={{
                                                            border:
                                                                "1px solid #dee2e6",
                                                        }}
                                                    >
                                                        No
                                                    </th>
                                                    <th
                                                        className="text-center"
                                                        style={{
                                                            border:
                                                                "1px solid #dee2e6",
                                                        }}
                                                    >
                                                        Date
                                                    </th>
                                                    <th
                                                        className="text-center"
                                                        style={{
                                                            border:
                                                                "1px solid #dee2e6",
                                                        }}
                                                    >
                                                        Bill
                                                    </th>
                                                    <th
                                                        className="text-center"
                                                        style={{
                                                            border:
                                                                "1px solid #dee2e6",
                                                        }}
                                                    >
                                                        Amount
                                                    </th>
                                                    <th
                                                        className="text-center"
                                                        style={{
                                                            border:
                                                                "1px solid #dee2e6",
                                                        }}
                                                    >
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {filteredSalesData.length >
                                                0 ? (
                                                    currentData.map(
                                                        (sale, index) => {
                                                            const approved =
                                                                calculateTotals(
                                                                    sale.order_details,
                                                                    approvedStatuses
                                                                );

                                                            return (
                                                                <tr
                                                                    key={
                                                                        sale.date
                                                                    }
                                                                    style={{
                                                                        backgroundColor:
                                                                            index %
                                                                                2 ===
                                                                            0
                                                                                ? "#f8f9fa"
                                                                                : "#ffffff",
                                                                    }}
                                                                >
                                                                    <th
                                                                        scope="row"
                                                                        className="text-center"
                                                                        style={{
                                                                            border:
                                                                                "1px solid #dee2e6",
                                                                            padding:
                                                                                "12px",
                                                                        }}
                                                                    >
                                                                        {indexOfFirstItem +
                                                                            index +
                                                                            1}
                                                                    </th>

                                                                    <td
                                                                        className="text-center"
                                                                        style={{
                                                                            border:
                                                                                "1px solid #dee2e6",
                                                                            padding:
                                                                                "12px",
                                                                        }}
                                                                    >
                                                                        {
                                                                            sale.date
                                                                        }
                                                                    </td>

                                                                    <td
                                                                        className="text-center"
                                                                        style={{
                                                                            border:
                                                                                "1px solid #dee2e6",
                                                                            padding:
                                                                                "12px",
                                                                        }}
                                                                    >
                                                                        {
                                                                            approved.count
                                                                        }
                                                                    </td>

                                                                    <td
                                                                        className="text-center"
                                                                        style={{
                                                                            border:
                                                                                "1px solid #dee2e6",
                                                                            padding:
                                                                                "12px",
                                                                        }}
                                                                    >
                                                                        ₹
                                                                        {approved.amount.toFixed(
                                                                            2
                                                                        )}
                                                                    </td>

                                                                    <td
                                                                        className="text-center"
                                                                        style={{
                                                                            border:
                                                                                "1px solid #dee2e6",
                                                                            padding:
                                                                                "12px",
                                                                        }}
                                                                    >
                                                                        <a
                                                                            href={`/sales/view/${sale.date}/data/`}
                                                                            style={{
                                                                                color:
                                                                                    "#007bff",
                                                                                textDecoration:
                                                                                    "none",
                                                                                fontWeight:
                                                                                    "bold",
                                                                            }}
                                                                        >
                                                                            View
                                                                        </a>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }
                                                    )
                                                ) : (
                                                    <tr>
                                                        <td
                                                            colSpan="5"
                                                            className="text-center"
                                                        >
                                                            No sales data
                                                            available.
                                                        </td>
                                                    </tr>
                                                )}

                                                <tr
                                                    style={{
                                                        backgroundColor:
                                                            "#e2f0d9",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    <td
                                                        className="text-center"
                                                        colSpan={2}
                                                        style={{
                                                            border:
                                                                "1px solid #dee2e6",
                                                            padding: "12px",
                                                        }}
                                                    >
                                                        Total
                                                    </td>
                                                    <td
                                                        className="text-center"
                                                        style={{
                                                            border:
                                                                "1px solid #dee2e6",
                                                            padding: "12px",
                                                        }}
                                                    >
                                                        {totalApproved.count}
                                                    </td>
                                                    <td
                                                        className="text-center"
                                                        style={{
                                                            border:
                                                                "1px solid #dee2e6",
                                                            padding: "12px",
                                                        }}
                                                    >
                                                        ₹
                                                        {totalApproved.amount.toFixed(
                                                            2
                                                        )}
                                                    </td>
                                                    <td
                                                        className="text-center"
                                                        style={{
                                                            border:
                                                                "1px solid #dee2e6",
                                                            padding: "12px",
                                                        }}
                                                    >
                                                        —
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>

                                        <Paginations
                                            perPageData={perPageData}
                                            data={filteredSalesData}
                                            currentPage={currentPage}
                                            setCurrentPage={setCurrentPage}
                                            isShowingPageLength={true}
                                            paginationDiv="col-12"
                                            paginationClass="pagination pagination-rounded"
                                            indexOfFirstItem={indexOfFirstItem}
                                            indexOfLastItem={indexOfLastItem}
                                        />
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