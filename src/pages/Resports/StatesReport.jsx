import React, { useEffect, useState } from "react";
import axios from "axios";
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
import { Link, useParams } from "react-router-dom";
import Paginations from "../../components/Common/Pagination";

const BasicTable = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [stateName, setStateName] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const { name } = useParams();
    const token = localStorage.getItem("token");
    const [staffs, setStaffs] = useState([])
    const [selectedStaff, setSelectedStaff] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 10;

    document.title = "STATE WISE REPORTS | BEPOSOFT";

    useEffect(() => {
        setStateName(decodeURIComponent(name));
    }, [name]);

    const role = localStorage.getItem("active");

    const fetchData = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setStaffs(response.data.data);
        } catch (error) {
            toast.error("Error fetching staffs:");
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const ordersResponse = await axios.get(`${import.meta.env.VITE_APP_KEY}orders/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const ordersArray = Array.isArray(ordersResponse.data)
                    ? ordersResponse.data
                    : ordersResponse.data.data || ordersResponse.data.results || [];


                // Filter orders by state name (case-insensitive)
                // Filter orders by state and (optionally) family
                const filteredOrders = ordersArray.filter((order) => {
                    const isSameState =
                        order.state &&
                        order.state.toLowerCase() === decodeURIComponent(name).toLowerCase();

                    const isBepocart = (order.family || "").toLowerCase() === "bepocart";

                    if (role === "CSO") {
                        return isSameState && !isBepocart;
                    }

                    return isSameState;
                });
                setOrders(filteredOrders);
            } catch (error) {
                setError("Error fetching data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [name, token]);

    useEffect(() => {
        // Apply date and search filters when the input changes
        const applyFilters = () => {
            let filtered = [...orders];

            if (startDate) {
                filtered = filtered.filter(order => new Date(order.order_date) >= new Date(startDate));
            }

            if (endDate) {
                filtered = filtered.filter(order => new Date(order.order_date) <= new Date(endDate));
            }

            if (searchQuery) {
                filtered = filtered.filter(
                    order =>
                        order.invoice.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        order.manage_staff.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            if (selectedStaff) {
                filtered = filtered.filter(order =>
                    order.manage_staff && order.manage_staff.toLowerCase() === selectedStaff.toLowerCase()
                );
            }

            setFilteredOrders(filtered);
        };

        applyFilters();
    }, [startDate, endDate, searchQuery, orders]);

    const getStatusColor = (status) => {
        const statusColors = {
            Pending: "red",
            Approved: "blue",
            Shipped: "yellow",
            Processing: "orange",
            Completed: "green",
            Cancelled: "gray",
        };
        return { color: statusColors[status] || "black" };
    };

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentPageData = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="STATE WISE REPORTS" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4" style={{ textAlign: "center" }}>
                                        BEPOSOFT ORDERS - {decodeURIComponent(name)}
                                    </CardTitle>

                                    <Row>
                                        <Col sm={3}>
                                            <Label>Start Date</Label>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </Col>
                                        <Col sm={3}>
                                            <Label>End Date</Label>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </Col>
                                        <Col sm={3}>
                                            <Label>Search</Label>
                                            <Input
                                                type="text"
                                                placeholder="Search by Invoice or Customer"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </Col>
                                        <Col sm={3}>
                                            <Label>Filter by Staff</Label>
                                            <Input
                                                type="select"
                                                value={selectedStaff}
                                                onChange={(e) => setSelectedStaff(e.target.value)}
                                            >
                                                <option value="">All Staff</option>
                                                {staffs.map((staff) => (
                                                    <option key={staff.id} value={staff.name}>
                                                        {staff.name} ({staff.family_name})
                                                    </option>
                                                ))}
                                            </Input>
                                        </Col>
                                    </Row>

                                    <div className="table-responsive" style={{ marginTop: "20px" }}>
                                        {loading ? (
                                            <div>Loading...</div>
                                        ) : error ? (
                                            <div className="text-danger">{error}</div>
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
                                                        {currentPageData.map((order, index) => (
                                                            <tr key={order.id}>
                                                                <th scope="row">{indexOfFirstItem + index + 1}</th>
                                                                <td>
                                                                    <Link to={`/order/${order.id}/items/`}>
                                                                        {order.invoice}
                                                                    </Link>
                                                                </td>
                                                                <td>
                                                                    {order.manage_staff} ({order.family})
                                                                </td>
                                                                <td>{order.customer.name}</td>
                                                                <td style={getStatusColor(order.status)}>
                                                                    {order.status}
                                                                </td>
                                                                <td>{order.total_amount}</td>
                                                                <td>{order.order_date}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                                <Paginations
                                                    perPageData={perPageData}
                                                    data={filteredOrders}
                                                    currentPage={currentPage}
                                                    setCurrentPage={setCurrentPage}
                                                    isShowingPageLength={true}
                                                    paginationDiv="mt-3"
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
        </React.Fragment>
    );
};

export default BasicTable;
