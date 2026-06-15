import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Link, useParams } from "react-router-dom";
import Paginations from "../../components/Common/Pagination";

const BasicTable = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { date } = useParams();

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("active");

    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 10;

    document.title = "Orders | Beposoft";

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}COD/sales/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        params: {
                            start_date: date,
                            end_date: date,
                        },
                    }
                );

                const reportData = response.data || [];

                let selectedDateData = reportData.find(
                    (item) => String(item.date) === String(date)
                );

                let filteredOrders = selectedDateData?.orders || [];

                if (role === "CSO") {
                    filteredOrders = filteredOrders.filter(
                        (order) =>
                            order.family_name?.toLowerCase() !== "bepocart"
                    );
                }

                setOrders(filteredOrders);
            } catch (error) {
                console.error(error);
                setError("Error fetching orders data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [date, token, role]);

    const getStatusColor = (status) => {
        const statusColors = {
            Pending: "red",
            Approved: "blue",
            Shipped: "#DAA520",
            Processing: "orange",
            Completed: "green",
            Cancelled: "gray",
            "Invoice Created": "#0d6efd",
            "Invoice Approved": "#198754",
            "To Print": "#6f42c1",
            Packed: "#20c997",
            "Ready to ship": "#fd7e14",
        };

        return { color: statusColors[status] || "black" };
    };

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="ORDER" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4">
                                        BEPOSOFT ORDERS - {date}
                                    </CardTitle>

                                    <div className="table-responsive">
                                        {loading ? (
                                            <div>Loading...</div>
                                        ) : error ? (
                                            <div className="text-danger">
                                                {error}
                                            </div>
                                        ) : (
                                            <>
                                                <Table className="table mb-0">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>INVOICE NO</th>
                                                            <th>STAFF</th>
                                                            <th>DIVISION</th>
                                                            <th>CUSTOMER</th>
                                                            <th>STATUS</th>
                                                            <th>BILL AMOUNT</th>
                                                            <th>PAID AMOUNT</th>
                                                            <th>BALANCE</th>
                                                            <th>CREATED AT</th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {currentOrders.length > 0 ? (
                                                            currentOrders.map((order, index) => (
                                                                <tr key={order.id}>
                                                                    <th scope="row">
                                                                        {indexOfFirstItem + index + 1}
                                                                    </th>

                                                                    <td>
                                                                        <Link to={`/order/${order.id}/items/`}>
                                                                            {order.invoice}
                                                                        </Link>
                                                                    </td>

                                                                    <td>
                                                                        {order.staff_name ||
                                                                            order.manage_staff ||
                                                                            "-"}
                                                                    </td>

                                                                    <td>
                                                                        {order.family_name ||
                                                                            order.family ||
                                                                            "-"}
                                                                    </td>

                                                                    <td>
                                                                        {order.customer_name ||
                                                                            order.customer?.name ||
                                                                            "-"}
                                                                    </td>

                                                                    <td
                                                                        style={getStatusColor(order.status)}
                                                                    >
                                                                        {order.status}
                                                                    </td>

                                                                    <td>
                                                                        {Number(
                                                                            order.total_amount || 0
                                                                        ).toFixed(2)}
                                                                    </td>

                                                                    <td>
                                                                        {Number(
                                                                            order.total_paid_amount || 0
                                                                        ).toFixed(2)}
                                                                    </td>

                                                                    <td>
                                                                        {Number(
                                                                            order.balance_amount || 0
                                                                        ).toFixed(2)}
                                                                    </td>

                                                                    <td>{order.order_date}</td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td
                                                                    colSpan="10"
                                                                    className="text-center text-muted"
                                                                >
                                                                    No orders found for this date.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>

                                                <Paginations
                                                    perPageData={perPageData}
                                                    data={orders}
                                                    currentPage={currentPage}
                                                    setCurrentPage={setCurrentPage}
                                                    isShowingPageLength={true}
                                                    paginationDiv="col-auto"
                                                    paginationClass="pagination"
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