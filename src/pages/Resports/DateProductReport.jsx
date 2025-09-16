import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Table } from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import Paginations from "../../components/Common/Pagination";

const DateProductReport = () => {
    const [dateProductData, setDateProductData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 25;
    const token = localStorage.getItem("token");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    document.title = "Date-wise Product Report | Beposoft";

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}product/date/wise/report/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setDateProductData(response?.data || []);
            } catch {
                toast.error("Error fetching date-wise product data");
            }
        };
        fetchUserData();
    }, [token]);

    const filteredItems = dateProductData.filter((item) => {
        if (!fromDate && !toDate) return true;

        const itemDate = new Date(item.order_date); // make sure order_date is YYYY-MM-DD
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;

        if (from && itemDate < from) return false;
        if (to && itemDate > to) return false;
        return true;
    });

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

    // Totals from filtered set
    const totalQty = filteredItems.reduce((s, i) => s + Number(i.quantity || 0), 0);
    const totalDiscount = filteredItems.reduce((s, i) => s + Number(i.discount || 0), 0);
    const totalAmount = filteredItems.reduce((s, i) => s + Number(i.total_amount || 0), 0);

    return (
        <div className="page-content">
            <div className="container-fluid">
                <Breadcrumbs title="Reports" breadcrumbItem="Date-wise Product Report" />
                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardBody>
                                <h4 className="mb-3">DATE-WISE PRODUCT REPORT</h4>

                                <div className="d-flex align-items-center mb-3 gap-2">
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="form-control"
                                        style={{ maxWidth: "200px" }}
                                    />
                                    <span>to</span>
                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="form-control"
                                        style={{ maxWidth: "200px" }}
                                    />
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setFromDate("");
                                            setToDate("");
                                            setCurrentPage(1);
                                        }}
                                    >
                                        Reset
                                    </button>
                                </div>

                                <div className="table-responsive">
                                    <Table bordered hover size="sm">
                                        <thead className="table-dark">
                                            <tr>
                                                <th>#</th>
                                                <th>ORDER DATE</th>
                                                <th>ORDER ID</th>
                                                <th>PRODUCT</th>
                                                <th>QTY</th>
                                                <th>RATE</th>
                                                <th>DISCOUNT</th>
                                                <th>TOTAL AMOUNT</th>
                                                <th>STOCK</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.length > 0 ? (
                                                currentItems.map((item, idx) => (
                                                    <tr key={item.id}>
                                                        <td>{indexOfFirstItem + idx + 1}</td>
                                                        <td>{item.order_date}</td>
                                                        <td>{item.order}</td>
                                                        <td>{item.product_name}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>₹{item.rate}</td>
                                                        <td>₹{item.discount}</td>
                                                        <td>₹{item.total_amount}</td>
                                                        <td>{item.product_stock}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="9" className="text-center">No data available</td>
                                                </tr>
                                            )}
                                        </tbody>

                                        <tfoot className="table-light">
                                            <tr>
                                                <th colSpan="4" className="text-end">Grand Total:</th>
                                                <th>{totalQty}</th>
                                                <th></th>
                                                <th>
                                                    ₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </th>
                                                <th>
                                                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </th>
                                                <th></th>
                                            </tr>
                                        </tfoot>
                                    </Table>
                                </div>

                                {/* Pagination Controls */}
                                <Paginations
                                    perPageData={perPageData}
                                    data={filteredItems}
                                    currentPage={currentPage}
                                    setCurrentPage={setCurrentPage}
                                    isShowingPageLength={true}
                                    paginationDiv="d-flex justify-content-center"
                                    paginationClass="pagination-sm"
                                    indexOfFirstItem={indexOfFirstItem}
                                    indexOfLastItem={indexOfLastItem}
                                />
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default DateProductReport;
