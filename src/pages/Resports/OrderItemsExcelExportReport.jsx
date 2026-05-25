import React, { useState } from "react";
import { Card, CardBody, Col, Row, Table, Button, Input } from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const OrderItemsExcelExportReport = () => {
    const token = localStorage.getItem("token");
    const apiBase = import.meta.env.VITE_APP_KEY;

    const [warehouseId] = useState("1");
    const [warehouseName, setWarehouseName] = useState("");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);

    document.title = "Order Items Excel Export Report | Beposoft";

    const formatNumber = (value) => {
        const numberValue = Number(value || 0);

        return numberValue.toLocaleString("en-IN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    };

    const formatDateForDisplay = (dateValue) => {
        if (!dateValue) return "";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date
            .toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })
            .replace(/ /g, "-");
    };

    const fetchOrderItemsReport = async () => {
        if (!warehouseId) {
            toast.error("Warehouse id is missing");
            return;
        }

        if (!startDate) {
            toast.error("Please select start date");
            return;
        }

        if (!endDate) {
            toast.error("Please select end date");
            return;
        }

        if (startDate > endDate) {
            toast.error("Start date cannot be greater than end date");
            return;
        }

        setLoading(true);

        try {
            const url = `${apiBase}order/items/excel/export/${warehouseId}/${startDate}/${endDate}/`;

            const params = {};

            if (search.trim()) {
                params.search = search.trim();
            }

            const { data } = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params,
            });

            const results = Array.isArray(data?.results) ? data.results : [];

            setReportData(results);
            setWarehouseName(data?.warehouse_name || "");
        } catch (err) {
            console.error(err);
            toast.error("Error fetching order items report");

            setReportData([]);
            setWarehouseName("");
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        fetchOrderItemsReport();
    };

    const handleClearFilter = () => {
        setStartDate("");
        setEndDate("");
        setSearch("");
        setWarehouseName("");
        setReportData([]);
    };

    const getExportFileName = () => {
        const cleanWarehouseName = warehouseName
            ? warehouseName.toString().replace(/[^a-zA-Z0-9]/g, "_")
            : `Warehouse_${warehouseId}`;

        return `Order_Items_${cleanWarehouseName}_${startDate || "start"}_to_${endDate || "end"
            }.xlsx`;
    };

    const formatDateForExcel = (dateValue) => {
        if (!dateValue) return "";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        const day = String(date.getDate()).padStart(2, "0");

        const months = [
            "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
            "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
        ];

        const month = months[date.getMonth()];
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    };

    const exportExcel = () => {
        try {
            if (!reportData.length) {
                toast.warning("No data to export");
                return;
            }

            const exportRows = reportData.map((item) => ({
                DATE: formatDateForExcel(item.date),
                "Voucher Number": item.voucher_no || "",
                "party name": item.party_name || "",
                "item name": item.item_name || "",
                "item qty": Number(item.item_quantity || 0),
                "item rate": Number(item.item_rate || 0),
                per: item.unit || "",
                "item basic amt": Number(item.item_basic_amount || 0),
                "tax %": Number(item.tax_percentage || 0),
                tax: Number(item.tax || 0),
                "total amount": Number(item.total_amount || 0),
            }));

            const sheet = XLSX.utils.json_to_sheet(exportRows, {
                header: [
                    "DATE",
                    "Voucher Number",
                    "party name",
                    "item name",
                    "item qty",
                    "item rate",
                    "per",
                    "item basic amt",
                    "tax %",
                    "tax",
                    "total amount",
                ],
            });

            sheet["!cols"] = [
                { wch: 15 },
                { wch: 20 },
                { wch: 30 },
                { wch: 45 },
                { wch: 12 },
                { wch: 12 },
                { wch: 10 },
                { wch: 18 },
                { wch: 16 },
                { wch: 12 },
                { wch: 16 },
            ];

            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(workbook, sheet, "Order Items");

            const excelBuffer = XLSX.write(workbook, {
                bookType: "xlsx",
                type: "array",
            });

            saveAs(
                new Blob([excelBuffer], { type: "application/octet-stream" }),
                getExportFileName()
            );
        } catch (err) {
            console.error(err);
            toast.error("Excel export failed");
        }
    };

    return (
        <div className="page-content">
            <div className="container-fluid">
                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardBody>
                                <div
                                    className="d-flex align-items-center justify-content-between flex-wrap gap-2"
                                    style={{ marginBottom: "18px" }}
                                >
                                    <div>
                                        <h4 className="mb-1">Order Items Excel Export Report</h4>
                                        <div style={{ color: "#64748b", fontSize: "13px" }}>
                                            Search by voucher number, party name, or item name.
                                        </div>
                                    </div>

                                    <Button
                                        color="success"
                                        onClick={exportExcel}
                                        disabled={loading || !reportData.length}
                                    >
                                        Export Excel
                                    </Button>
                                </div>

                                <Row className="mb-3">
                                    <Col md={2}>
                                        <label>Start Date</label>
                                        <Input
                                            type="date"
                                            className="form-control"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </Col>

                                    <Col md={2}>
                                        <label>End Date</label>
                                        <Input
                                            type="date"
                                            className="form-control"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </Col>

                                    <Col md={4}>
                                        <label>Search</label>
                                        <Input
                                            type="text"
                                            className="form-control"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search voucher number, party name, item name"
                                        />
                                    </Col>

                                    <Col md={4} className="d-flex align-items-end">
                                        <Button
                                            color="primary"
                                            onClick={handleFilter}
                                            disabled={loading}
                                        >
                                            {loading ? "Filtering..." : "Filter"}
                                        </Button>

                                        <Button
                                            color="secondary"
                                            onClick={handleClearFilter}
                                            disabled={loading}
                                            className="ms-2"
                                        >
                                            Clear
                                        </Button>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={12}>
                                        <div
                                            style={{
                                                background: "#f8f9fa",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "10px",
                                                padding: "12px 14px",
                                                fontSize: "14px",
                                                fontWeight: 500,
                                            }}
                                        >
                                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                                <div>
                                                    Date:{" "}
                                                    <span style={{ fontWeight: 800 }}>
                                                        {formatDateForDisplay(startDate) || "-"} to{" "}
                                                        {formatDateForDisplay(endDate) || "-"}
                                                    </span>
                                                </div>

                                                <div>
                                                    Total Records:{" "}
                                                    <span style={{ fontWeight: 800 }}>
                                                        {reportData.length}
                                                    </span>
                                                </div>
                                            </div>

                                            {warehouseName ? (
                                                <div
                                                    style={{
                                                        marginTop: "6px",
                                                        color: "#475569",
                                                        fontSize: "13px",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Warehouse: {warehouseName}
                                                </div>
                                            ) : null}
                                        </div>
                                    </Col>
                                </Row>

                                <div className="table-responsive">
                                    <Table bordered striped hover>
                                        <thead>
                                            <tr>
                                                <th>DATE</th>
                                                <th>Voucher Number</th>
                                                <th>party name</th>
                                                <th>item name</th>
                                                <th>item qty</th>
                                                <th>item rate</th>
                                                <th>per</th>
                                                <th>item basic amt</th>
                                                <th>tax %</th>
                                                <th>tax</th>
                                                <th>total amount</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {!loading && reportData.length ? (
                                                reportData.map((item, index) => (
                                                    <tr key={`${item.voucher_no}-${item.item_name}-${index}`}>
                                                        <td>{formatDateForExcel(item.date) || "-"}</td>
                                                        <td>{item.voucher_no || "-"}</td>
                                                        <td>{item.party_name || "-"}</td>
                                                        <td>{item.item_name || "-"}</td>
                                                        <td>{formatNumber(item.item_quantity)}</td>
                                                        <td>{formatNumber(item.item_rate)}</td>
                                                        <td>{item.unit || "-"}</td>
                                                        <td>{formatNumber(item.item_basic_amount)}</td>
                                                        <td>{formatNumber(item.tax_percentage)}</td>
                                                        <td>{formatNumber(item.tax)}</td>
                                                        <td>{formatNumber(item.total_amount)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="11" className="text-center">
                                                        {loading ? "Loading..." : "No records found"}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default OrderItemsExcelExportReport;