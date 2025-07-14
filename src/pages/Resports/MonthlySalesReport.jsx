import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import Paginations from "../../components/Common/Pagination";

const MonthlySalesReport = () => {
    const token = localStorage.getItem("token");
    const [staffData, setStaffData] = useState([])
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthIndex = currentDate.getMonth() + 1;

    // Left side state
    const [leftYear, setLeftYear] = useState(currentYear);
    const [leftMonth, setLeftMonth] = useState(currentMonthIndex);
    const [leftOrders, setLeftOrders] = useState([]);
    const [leftStaffId, setLeftStaffId] = useState(null);

    // Right side state
    const [rightYear, setRightYear] = useState(currentYear);
    const [rightMonth, setRightMonth] = useState(currentMonthIndex - 1 || 12);
    const [rightOrders, setRightOrders] = useState([]);
    const [rightStaffId, setRightStaffId] = useState(null);

    const months = [
        { name: "January", value: 1 },
        { name: "February", value: 2 },
        { name: "March", value: 3 },
        { name: "April", value: 4 },
        { name: "May", value: 5 },
        { name: "June", value: 6 },
        { name: "July", value: 7 },
        { name: "August", value: 8 },
        { name: "September", value: 9 },
        { name: "October", value: 10 },
        { name: "November", value: 11 },
        { name: "December", value: 12 },
    ];

    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    useEffect(() => {
        const fetchStaffData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, {
                    headers: { Authorization: `Bearer${token}` }
                });
                setStaffData(response?.data?.data);
            } catch (error) {
                toast.error("Error fetching staff data")
            }
        };
        fetchStaffData();
    }, [])

    const fetchOrders = async (year, month, side) => {
        try {
            const url = `${import.meta.env.VITE_APP_KEY}orders/monthly/${year}/${String(month).padStart(2, '0')}/`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const allOrders = response?.data?.results || [];

            if (side === "left") {
                setLeftOrders(allOrders);
            } else {
                setRightOrders(allOrders);
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                // No orders found
                if (side === "left") {
                    setLeftOrders([]);
                } else {
                    setRightOrders([]);
                }
            } else {
                toast.error(`Error fetching ${side} side sales report`);
            }
        }
    };

    useEffect(() => {
        fetchOrders(leftYear, leftMonth, "left", leftStaffId);
    }, [leftYear, leftMonth, leftStaffId]);

    useEffect(() => {
        fetchOrders(rightYear, rightMonth, "right", rightStaffId);
    }, [rightYear, rightMonth, rightStaffId]);

    const renderOrdersTable = (orders, staffId, indexOfFirstItem, indexOfLastItem) => {
        const filteredOrders = staffId
            ? orders.filter(order => String(order.staff_id) === String(staffId))
            : orders;

        const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

        return (
            <Table bordered responsive className="text-center">
                <thead className="table-light">
                    <tr>
                        <th>#</th>
                        <th>Invoice</th>
                        <th>Staff</th>
                        <th>Order Date</th>
                        <th>Amount</th>
                        <th>Payment Status</th>
                    </tr>
                </thead>
                <tbody>
                    {currentOrders.length > 0 ? (
                        currentOrders.map((order, index) => (
                            <tr key={order?.id}>
                                <td>{indexOfFirstItem + index + 1}</td>
                                <td>{order?.invoice}</td>
                                <td>{order?.staff_name}</td>
                                <td>{order?.order_date}</td>
                                <td>₹ {Number(order?.total_amount).toFixed(2)}</td>
                                <td>{order?.payment_status}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6">No orders found</td>
                        </tr>
                    )}
                </tbody>
            </Table>
        );
    };

    const calculateTotalAmount = (orders, staffId) => {
        const filtered = staffId
            ? orders.filter(order => String(order.staff_id) === String(staffId))
            : orders;

        return filtered.reduce((sum, order) => sum + Number(order.total_amount || 0), 0).toFixed(2);
    };

    const getComparisonDisplay = () => {
        const leftTotal = parseFloat(calculateTotalAmount(leftOrders, leftStaffId));
        const rightTotal = parseFloat(calculateTotalAmount(rightOrders, rightStaffId));
        const diff = leftTotal - rightTotal;

        if (diff > 0) {
            return <button className="btn btn-sm btn-success ms-2">↑ ₹ {diff.toFixed(2)}</button>;
        } else if (diff < 0) {
            return <button className="btn btn-sm btn-danger ms-2">↓ ₹ {Math.abs(diff).toFixed(2)}</button>;
        } else {
            return <button className="btn btn-sm btn-secondary ms-2">--</button>;
        }
    };

    const indexOfLastItem = currentPage * perPage;
    const indexOfFirstItem = indexOfLastItem - perPage;

    // Filtered data
    const leftFilteredOrders = leftStaffId
        ? leftOrders.filter(order => String(order.staff_id) === String(leftStaffId))
        : leftOrders;

    const rightFilteredOrders = rightStaffId
        ? rightOrders.filter(order => String(order.staff_id) === String(rightStaffId))
        : rightOrders;

    // Combine both sides for pagination
    const totalCombinedLength = Math.max(leftFilteredOrders.length, rightFilteredOrders.length);

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="MONTHLY SALES REPORT" />
                    <Row>
                        {/* Left Column */}
                        <Col md={6}>
                            <Card>
                                <CardBody>
                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <label>Year</label>
                                            <select
                                                className="form-control"
                                                value={leftYear}
                                                onChange={(e) => setLeftYear(parseInt(e.target.value))}
                                            >
                                                {years.map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </Col>
                                        <Col md={6}>
                                            <label>Month</label>
                                            <select
                                                className="form-control"
                                                value={leftMonth}
                                                onChange={(e) => setLeftMonth(parseInt(e.target.value))}
                                            >
                                                {months.map(month => (
                                                    <option key={month.value} value={month.value}>{month.name}</option>
                                                ))}
                                            </select>
                                        </Col>
                                        <Col md={12} className="mb-3">
                                            <label>Select Staff</label>
                                            <Select
                                                options={[
                                                    { value: null, label: "All Staff" },
                                                    ...staffData.map(staff => ({
                                                        value: staff.id,
                                                        label: staff.name
                                                    }))
                                                ]}
                                                onChange={(selected) => setLeftStaffId(selected?.value || null)}
                                                value={
                                                    leftStaffId
                                                        ? staffData.find(staff => staff.id === leftStaffId)
                                                            ? {
                                                                value: leftStaffId,
                                                                label: staffData.find(staff => staff.id === leftStaffId)?.name
                                                            }
                                                            : null
                                                        : { value: null, label: "All Staff" }
                                                }
                                            />
                                        </Col>
                                    </Row>
                                    <h5 className="mb-2">
                                        Sales Report – {months[leftMonth - 1].name} {leftYear}
                                        {leftStaffId && (
                                            <> – <span className="text-primary">{staffData.find(staff => staff.id === leftStaffId)?.name}</span></>
                                        )}
                                    </h5>
                                    <div className="mb-3 d-flex align-items-center">
                                        <span className="me-2 fw-medium">Amount:</span>
                                        <button className="btn btn-sm btn-primary text-white">
                                            ₹ {calculateTotalAmount(leftOrders, leftStaffId)}
                                        </button>
                                        {getComparisonDisplay()}
                                    </div>
                                    {renderOrdersTable(leftOrders, leftStaffId, indexOfFirstItem, indexOfLastItem)}
                                </CardBody>
                            </Card>
                        </Col>

                        {/* Right Column */}
                        <Col md={6}>
                            <Card>
                                <CardBody>
                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <label>Year</label>
                                            <select
                                                className="form-control"
                                                value={rightYear}
                                                onChange={(e) => setRightYear(parseInt(e.target.value))}
                                            >
                                                {years.map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </Col>
                                        <Col md={6}>
                                            <label>Month</label>
                                            <select
                                                className="form-control"
                                                value={rightMonth}
                                                onChange={(e) => setRightMonth(parseInt(e.target.value))}
                                            >
                                                {months.map(month => (
                                                    <option key={month.value} value={month.value}>{month.name}</option>
                                                ))}
                                            </select>
                                        </Col>
                                        <Col md={12} className="mb-3">
                                            <label>Select Staff</label>
                                            <Select
                                                options={[
                                                    { value: null, label: "All Staff" },
                                                    ...staffData.map(staff => ({
                                                        value: staff.id,
                                                        label: staff.name
                                                    }))
                                                ]}
                                                onChange={(selected) => setRightStaffId(selected?.value || null)}
                                                value={
                                                    rightStaffId
                                                        ? staffData.find(staff => staff.id === rightStaffId)
                                                            ? {
                                                                value: rightStaffId,
                                                                label: staffData.find(staff => staff.id === rightStaffId)?.name
                                                            }
                                                            : null
                                                        : { value: null, label: "All Staff" }
                                                }
                                            />
                                        </Col>
                                    </Row>
                                    <h5 className="mb-2">
                                        Sales Report – {months[rightMonth - 1].name} {rightYear}
                                        {rightStaffId && (
                                            <> – <span className="text-primary">{staffData.find(staff => staff.id === rightStaffId)?.name}</span></>
                                        )}
                                    </h5>
                                    <div className="mb-3 d-flex align-items-center">
                                        <span className="me-2 fw-medium">Amount:</span>
                                        <button className="btn btn-sm btn-primary text-white">
                                            ₹ {calculateTotalAmount(rightOrders, rightStaffId)}
                                        </button>
                                    </div>
                                    {renderOrdersTable(rightOrders, rightStaffId, indexOfFirstItem, indexOfLastItem)}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                    <ToastContainer />
                    <Paginations
                        perPageData={perPage}
                        data={Array.from({ length: totalCombinedLength })} // Dummy array for count
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        isShowingPageLength={true}
                        paginationDiv="col-auto"
                        paginationClass="pagination"
                        indexOfFirstItem={indexOfFirstItem}
                        indexOfLastItem={indexOfLastItem}
                    />
                </div>
            </div>
        </React.Fragment>
    );
};

export default MonthlySalesReport;
