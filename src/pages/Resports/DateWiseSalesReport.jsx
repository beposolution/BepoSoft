import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Table } from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import Paginations from "../../components/Common/Pagination";
// import * as XLSX from "xlsx";
import XLSX from "xlsx-js-style";

const DateWiseSalesReport = () => {
    const token = localStorage.getItem("token");

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [familyId, setFamilyId] = useState("");

    const [summary, setSummary] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 30;

    document.title = "Date-wise Sales Report | Beposoft";

    // ----------------------------------------------------
    // API Call
    // ----------------------------------------------------
    const fetchReport = async () => {
        if (!fromDate || !toDate) {
            toast.error("Select both From and To dates");
            return;
        }

        try {
            setLoading(true);

            let url = `${import.meta.env.VITE_APP_KEY}orders/date/report/${fromDate}/${toDate}/`;

            if (familyId) {
                url += `?family_id=${familyId}`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSummary(response.data.summary);
            setOrders(response.data.orders);
            setCurrentPage(1);

        } catch (err) {
            toast.error("Error fetching sales report");
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setFromDate("");
        setToDate("");
        setFamilyId("");
        setOrders([]);
        setSummary(null);
    };

    // Pagination calculations
    const indexOfLast = currentPage * perPage;
    const indexOfFirst = indexOfLast - perPage;
    const currentItems = orders.slice(indexOfFirst, indexOfLast);


    // DATE formatting
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };


    // EXCEL exporting function
    const exportToExcel = () => {
        if (!orders || orders.length === 0) {
            toast.error("No data to export");
            return;
        }

        const ws_data = [];

        // -------------------------------------------------------
        // 1. TITLE + DATE RANGE
        // -------------------------------------------------------
        ws_data.push(["DATE-WISE SALES REPORT"]);
        ws_data.push([`DATE : ${formatDate(fromDate)} TO ${formatDate(toDate)}`]);
        ws_data.push([]); // spacing

        // -------------------------------------------------------
        // 2. APPROVED / NON-REJECTED STATUSES
        // -------------------------------------------------------
        const approvedStatuses = [
            "Approved",
            "Invoice Approved",
            "Completed",
            "Shipped",
            "Waiting For Confirmation",
            "To Print",
            "Invoice Created",
            "Packing under progress",
            "Packed",
            "Ready to ship"
        ];

        // -------------------------------------------------------
        // 3. PRE-CALCULATE GROUPED DATA & FAMILY TOTALS
        // -------------------------------------------------------
        let groupedData = {};
        let familyTotals = {};

        if (!familyId) {
            orders.forEach(o => {
                if (!groupedData[o.family_name]) {
                    groupedData[o.family_name] = [];
                    familyTotals[o.family_name] = { count: 0, amount: 0 };
                }

                groupedData[o.family_name].push(o);

                if (approvedStatuses.includes(o.status)) {
                    familyTotals[o.family_name].count += 1;
                    familyTotals[o.family_name].amount += o.amount || 0;
                }
            });
        } else {
            groupedData[orders[0].family_name] = orders;
            familyTotals[orders[0].family_name] = { count: 0, amount: 0 };

            orders.forEach(o => {
                if (approvedStatuses.includes(o.status)) {
                    familyTotals[orders[0].family_name].count += 1;
                    familyTotals[orders[0].family_name].amount += o.amount || 0;
                }
            });
        }

        // -------------------------------------------------------
        // 4. TOP SUMMARY BLOCK
        // -------------------------------------------------------
        ws_data.push(["Label", "Count", "Amount"]);

        // FAMILY TOTAL ROWS
        Object.entries(familyTotals).forEach(([family, totals]) => {
            ws_data.push([
                `${family.toUpperCase()}`,
                totals.count,
                totals.amount
            ]);
        });

        // GRAND TOTAL ROW
        ws_data.push([
            "Total Bills",
            summary.non_rejected_orders.count,
            summary.non_rejected_orders.amount
        ]);

        ws_data.push([]); // spacing

        // -------------------------------------------------------
        // 5. FAMILY STAFF SUMMARY BLOCKS
        // -------------------------------------------------------
        Object.entries(groupedData).forEach(([family, familyOrders], famIdx) => {

            ws_data.push([`${famIdx + 1}. FAMILY : ${family.toUpperCase()}`]);
            ws_data.push([]);

            const staffMap = {};

            familyOrders.forEach(o => {
                if (!approvedStatuses.includes(o.status)) return;

                const name = o.staff_name || "Unknown";

                if (!staffMap[name]) {
                    staffMap[name] = { totalBills: 0, totalAmount: 0 };
                }

                staffMap[name].totalBills += 1;
                staffMap[name].totalAmount += o.amount || 0;
            });

            const staffList = Object.keys(staffMap);

            ws_data.push(["SLNO", "STAFF NAME", "TOTAL BILL", "TOTAL AMOUNT"]);

            staffList.forEach((name, index) => {
                ws_data.push([
                    index + 1,
                    name,
                    staffMap[name].totalBills,
                    staffMap[name].totalAmount
                ]);
            });

            const totalBills = staffList.reduce((a, n) => a + staffMap[n].totalBills, 0);
            const totalAmount = staffList.reduce((a, n) => a + staffMap[n].totalAmount, 0);

            ws_data.push(["TOTAL", "", totalBills, totalAmount]);
            ws_data.push([]);
            ws_data.push([]);
        });

        // -------------------------------------------------------
        // 6. CREATE SHEET
        // -------------------------------------------------------
        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        ws["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }
        ];

        ws["!cols"] = [
            { wch: 20 },
            { wch: 25 },
            { wch: 15 },
            { wch: 18 }
        ];

        // -------------------------------------------------------
        // 7. STYLE / COLORS
        // -------------------------------------------------------
        const range = XLSX.utils.decode_range(ws["!ref"]);

        for (let R = range.s.r; R <= range.e.r; R++) {
            for (let C = 0; C <= 3; C++) {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellRef]) continue;

                let value0 = ws_data[R]?.[0];

                let style = {
                    font: { name: "Calibri", sz: 12, color: { rgb: "000000" } },
                    alignment: { horizontal: "center", vertical: "center", wrapText: true },
                    border: {
                        top: { style: "thin", color: { rgb: "000000" } },
                        bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: "thin", color: { rgb: "000000" } },
                        right: { style: "thin", color: { rgb: "000000" } }
                    }
                };

                // TITLE
                if (R === 0) {
                    style.fill = { fgColor: { rgb: "000000" } };
                    style.font = { bold: true, sz: 16, color: { rgb: "FFFFFF" } };
                }

                // DATE RANGE ROW
                if (R === 1) {
                    style.fill = { fgColor: { rgb: "00BDB4" } };
                    style.font = { bold: true, sz: 13, color: { rgb: "FFFFFF" } };
                    style.alignment = { horizontal: "center" };
                }

                // SUMMARY HEADER
                if (R === 3) {
                    style.fill = { fgColor: { rgb: "1F4E79" } };
                    style.font = { bold: true, color: { rgb: "FFFFFF" } };
                }

                // GREEN summary Total Bills
                if (value0 === "Total Bills") {
                    style.fill = { fgColor: { rgb: "00B050" } };
                    style.font = { bold: true, color: { rgb: "FFFFFF" } };
                }

                // FAMILY HEADER
                if (String(value0).includes("FAMILY :")) {
                    style.fill = { fgColor: { rgb: "FC9A03" } };
                    style.font = { bold: true };
                }

                // STAFF HEADER
                if (value0 === "SLNO") {
                    style.fill = { fgColor: { rgb: "BFBFBF" } };
                    style.font = { bold: true };
                }

                // YELLOW color for FAMILY TOTAL rows in summary
                if (Object.keys(familyTotals).some(f => value0 === f.toUpperCase())) {
                    style.fill = { fgColor: { rgb: "fc9a03" } };
                    style.font = { bold: true, color: { rgb: "000000" } };
                }

                // STAFF ALTERNATING COLORS
                if (typeof value0 === "number") {
                    if (C === 0) {
                        style.fill = { fgColor: { rgb: "FF0000" } };
                        style.font = { bold: true, color: { rgb: "FFFFFF" } };
                    }
                    if (C === 1) {
                        style.fill = { fgColor: { rgb: value0 % 2 === 1 ? "D9EAF7" : "C6E0B4" } };
                    }
                }

                // TOTAL ROW
                if (value0 === "TOTAL") {
                    style.fill = { fgColor: { rgb: "FF0000" } };
                    style.font = { bold: true, color: { rgb: "FFFFFF" } };
                }

                ws[cellRef].s = style;
            }
        }

        // -------------------------------------------------------
        // 8. EXPORT
        // -------------------------------------------------------
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
        XLSX.writeFile(wb, `DateWise_Sales_Report.xlsx`);
    };

    return (
        <div className="page-content">
            <div className="container-fluid">

                <Breadcrumbs title="Reports" breadcrumbItem="Date-wise Sales Report" />

                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardBody>

                                <h4 className="mb-3">DATE-WISE SALES REPORT</h4>

                                {/* FILTERS */}
                                <div className="d-flex align-items-center gap-3 mb-3">

                                    <input
                                        type="date"
                                        className="form-control"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        style={{ maxWidth: "200px" }}
                                    />

                                    <span>to</span>

                                    <input
                                        type="date"
                                        className="form-control"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        style={{ maxWidth: "200px" }}
                                    />

                                    <select
                                        className="form-select"
                                        value={familyId}
                                        onChange={(e) => setFamilyId(e.target.value)}
                                        style={{ maxWidth: "200px" }}
                                    >
                                        <option value="">All Families</option>
                                        <option value="1">Cycling</option>
                                        <option value="2">Skating</option>
                                        <option value="3">Bepocart</option>
                                    </select>

                                    <button className="btn btn-primary" onClick={fetchReport}>
                                        Search
                                    </button>

                                    <button className="btn btn-secondary" onClick={resetFilters}>
                                        Reset
                                    </button>
                                    <button className="btn btn-success" onClick={exportToExcel}>
                                        Export Excel
                                    </button>
                                </div>

                                {/* Summary Card */}
                                {summary && (
                                    <div className="mb-4">
                                        <h5>Summary</h5>
                                        <Table bordered>
                                            <tbody>
                                                <tr style={{ color: "blue" }}>
                                                    <th>Total Bills</th>
                                                    <td>{summary.total_orders.count}</td>
                                                    <th>Total Amount</th>
                                                    <td>₹{summary.total_orders.amount.toLocaleString('en-IN')}</td>
                                                </tr>
                                                <tr>
                                                    <th>Approved Bills</th>
                                                    <td>{summary.non_rejected_orders.count}</td>
                                                    <th>Amount</th>
                                                    <td>₹{summary.non_rejected_orders.amount.toLocaleString('en-IN')}</td>
                                                </tr>
                                                <tr>
                                                    <th>Rejected Bills</th>
                                                    <td>{summary.rejected_orders.count}</td>
                                                    <th>Amount</th>
                                                    <td>₹{summary.rejected_orders.amount.toLocaleString('en-IN')}</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </div>
                                )}

                                {/* LOADING */}
                                {loading && <p>Loading...</p>}

                                {/* TABLE */}
                                {!loading && orders.length > 0 && (
                                    <div className="table-responsive">
                                        <Table bordered hover size="sm">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th>#</th>
                                                    <th>ORDER DATE</th>
                                                    <th>ORDER ID</th>
                                                    <th>STAFF</th>
                                                    <th>STATUS</th>
                                                    <th>FAMILY</th>
                                                    <th>AMOUNT</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {currentItems.map((item, index) => (
                                                    <tr key={item.order_id}>
                                                        <td>{indexOfFirst + index + 1}</td>
                                                        <td>{item.order_date}</td>
                                                        <td>{item.order_id}</td>
                                                        <td>{item.staff_name}</td>
                                                        <td>{item.status}</td>
                                                        <td>{item.family_name}</td>
                                                        <td>₹{item.amount.toLocaleString("en-IN")}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}

                                {/* No Data */}
                                {!loading && orders.length === 0 && (
                                    <p className="text-center mt-3">No data available</p>
                                )}

                                {/* PAGINATION */}
                                {orders.length > 0 && (
                                    <Paginations
                                        perPageData={perPage}
                                        data={orders}
                                        currentPage={currentPage}
                                        setCurrentPage={setCurrentPage}
                                        isShowingPageLength={true}
                                        paginationDiv="d-flex justify-content-center"
                                        paginationClass="pagination-sm"
                                        indexOfFirstItem={indexOfFirst}
                                        indexOfLastItem={indexOfLast}
                                    />
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default DateWiseSalesReport;
