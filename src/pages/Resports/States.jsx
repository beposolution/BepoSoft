import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Table, Row, Col, Card, CardBody, Button, Input, Label, Spinner } from "reactstrap";
import * as XLSX from "xlsx";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const localDateString = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const BasicTable = () => {
  const today = localDateString();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [appliedRange, setAppliedRange] = useState({ start: today, end: today });
  const [salesData, setSalesData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const role = localStorage.getItem("active");

  const fetchSales = useCallback(async (page, range, signal) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}state/wise/report/`,
        {
          params: {
            start_date: range.start,
            end_date: range.end,
            page,
          },
          headers: { Authorization: `Bearer ${token}` },
          signal,
        }
      );
      const payload = response.data;
      if (!Array.isArray(payload?.data)) {
        throw new Error("Unexpected response format from the report API.");
      }
      // The API's state summary is for the ENTIRE selected date range.
      // Never recalculate it from the 50 orders returned on the current page.
      setSalesData(payload.data);
      setCurrentPage(Number(payload.current_page) || page);
      setTotalPages(Math.max(1, Number(payload.total_pages) || 1));
      setTotalOrders(Number(payload.count) || 0);
      setPageSize(Number(payload.page_size) || 50);
    } catch (err) {
      if (err.code === "ERR_CANCELED" || axios.isCancel(err)) return;
      const message =
        err.response?.data?.message ||
        err.message ||
        "There was an error fetching the data";
      setError(message);
      toast.error(message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchSales(currentPage, appliedRange, controller.signal);
    return () => controller.abort();
  }, [currentPage, appliedRange, fetchSales]);

  const applyDates = (event) => {
    event.preventDefault();
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates.");
      return;
    }
    if (startDate > endDate) {
      toast.error("Start date cannot be greater than end date.");
      return;
    }
    setCurrentPage(1);
    setAppliedRange({ start: startDate, end: endDate });
  };

  const exportToExcel = () => {
    if (!salesData.length) {
      toast.info("No sales data to export.");
      return;
    }
    const data = salesData.map((sale, index) => ({
      "#": index + 1,
      Name: sale.name,
      "Invoice Bill": Number(sale.total_orders_count) || 0,
      "Invoice Amount": Number(sale.total_amount) || 0,
      "Delivered Bill": Number(sale.completed_orders_count) || 0,
      "Delivered Amount": Number(sale.completed_amount) || 0,
      "Cancelled Bill": Number(sale.cancelled_orders_count) || 0,
      "Cancelled Amount": Number(sale.cancelled_amount) || 0,
      "Return Bill": Number(sale.returned_orders_count) || 0,
      "Return Amount": Number(sale.returned_amount) || 0,
      "Rejected Bill": Number(sale.rejected_orders_count) || 0,
      "Rejected Amount": Number(sale.rejected_amount) || 0,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 6 }, { wch: 24 },
      ...Array.from({ length: 10 }, () => ({ wch: 18 })),
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "State Wise Report");
    XLSX.writeFile(
      workbook,
      `State_Wise_Sales_Report_${appliedRange.start}_to_${appliedRange.end}.xlsx`
    );
  };

  const columns = [
    ["total_orders_count", "total_amount"],
    ["completed_orders_count", "completed_amount"],
    ["cancelled_orders_count", "cancelled_amount"],
    ["returned_orders_count", "returned_amount"],
    ["rejected_orders_count", "rejected_amount"],
  ];

  const cellStyle = {
    border: "1px solid #dee2e6",
    padding: "12px",
    textAlign: "center",
    verticalAlign: "middle",
  };

  document.title = "STATE WISE SALES REPORT | BEPOSOFT";

  return (
    <React.Fragment>
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs title="Tables" breadcrumbItem="STATE WISE SALES REPORT" />
          <ToastContainer />
          <Row>
            <Col xl={12}>
              <Card>
                <CardBody>
                  <form onSubmit={applyDates} className="mb-3">
                    <Row className="align-items-end g-3">
                      <Col md={3} sm={6}>
                        <Label htmlFor="state-report-start">Start Date</Label>
                        <Input
                          id="state-report-start"
                          type="date"
                          value={startDate}
                          max={endDate || undefined}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </Col>
                      <Col md={3} sm={6}>
                        <Label htmlFor="state-report-end">End Date</Label>
                        <Input
                          id="state-report-end"
                          type="date"
                          value={endDate}
                          min={startDate || undefined}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </Col>
                      <Col md="auto">
                        <Button color="primary" type="submit" disabled={loading}>
                          Apply Filter
                        </Button>
                      </Col>
                      <Col md="auto">
                        <Button
                          color="secondary"
                          type="button"
                          disabled={loading}
                          onClick={() => {
                            const date = localDateString();
                            setStartDate(date);
                            setEndDate(date);
                            setCurrentPage(1);
                            setAppliedRange({ start: date, end: date });
                          }}
                        >
                          Today
                        </Button>
                      </Col>
                      <Col className="text-md-end">
                        <Button
                          color="success"
                          type="button"
                          disabled={loading || !salesData.length}
                          onClick={exportToExcel}
                        >
                          Export to Excel
                        </Button>
                      </Col>
                    </Row>
                  </form>

                  <div className="mb-3 text-muted">
                    Report: {appliedRange.start} to {appliedRange.end} | Total orders: {totalOrders}
                    {loading && (
                      <span className="ms-3">
                        <Spinner size="sm" /> Loading...
                      </span>
                    )}
                  </div>

                  {role === "CSO" && (
                    <div className="alert alert-warning" role="alert">
                      CSO report includes Bepocart in the totals returned by the API.
                      To exclude Bepocart accurately, the backend must apply the
                      family restriction before calculating state summaries and pagination.
                    </div>
                  )}

                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}{" "}
                      <Button
                        size="sm"
                        color="danger"
                        outline
                        onClick={() => fetchSales(currentPage, appliedRange)}
                      >
                        Retry
                      </Button>
                    </div>
                  )}

                  <div className="table-responsive">
                    <Table
                      className="table table-bordered"
                      style={{
                        border: "1px solid #dee2e6",
                        borderRadius: "10px",
                        overflow: "hidden",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.05)",
                      }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: "#007bff", color: "#ffffff" }}>
                          <th style={cellStyle}></th>
                          <th style={cellStyle}></th>
                          <th colSpan="2" style={cellStyle}>Invoice</th>
                          <th colSpan="2" style={cellStyle}>Delivered</th>
                          <th colSpan="2" style={cellStyle}>Cancelled</th>
                          <th colSpan="2" style={cellStyle}>Return</th>
                          <th colSpan="2" style={cellStyle}>Rejected</th>
                          <th style={cellStyle}>Action</th>
                        </tr>
                        <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                          <th style={cellStyle}>#</th>
                          <th style={cellStyle}>Name</th>
                          {columns.map((_, index) => (
                            <React.Fragment key={index}>
                              <th style={cellStyle}>Bill</th>
                              <th style={cellStyle}>Amount</th>
                            </React.Fragment>
                          ))}
                          <th style={cellStyle}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData.length > 0 ? (
                          salesData.map((sale, index) => (
                            <tr
                              key={sale.id}
                              style={{
                                backgroundColor: index % 2 === 0 ? "#f8f9fa" : "#ffffff",
                              }}
                            >
                              <th scope="row" style={cellStyle}>{index + 1}</th>
                              <td style={cellStyle}>{sale.name}</td>
                              {columns.map(([countKey, amountKey]) => (
                                <React.Fragment key={countKey}>
                                  <td style={cellStyle}>{Number(sale[countKey]) || 0}</td>
                                  <td style={cellStyle}>{money(sale[amountKey])}</td>
                                </React.Fragment>
                              ))}
                              <td style={cellStyle}>
                                <a
                                  href={`/state/sales/view/${encodeURIComponent(sale.name)}/data/`}
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
                          ))
                        ) : (
                          <tr>
                            <td colSpan="13" style={cellStyle}>
                              {loading ? "Loading sales data..." : "No sales data available."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>

                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
                    <span className="text-muted">
                      Order detail page {currentPage} of {totalPages} | {pageSize} orders per page
                    </span>
                    <div className="d-flex align-items-center gap-2">
                      <Button
                        color="primary"
                        outline
                        disabled={loading || currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <span>{currentPage} / {totalPages}</span>
                      <Button
                        color="primary"
                        outline
                        disabled={loading || currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
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
