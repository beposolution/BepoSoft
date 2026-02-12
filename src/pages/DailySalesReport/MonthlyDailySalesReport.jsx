import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    Card,
    CardBody,
    Col,
    Row,
    Label,
    CardTitle,
    Form,
    Input,
    Button,
} from "reactstrap";

const MonthlyDailySalesReport = () => {
    const token = localStorage.getItem("token");

    const [stateList, setStateList] = useState([]);
    const [profileData, setProfileData] = useState(null);

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [stateId, setStateId] = useState("");

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchStates = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}states/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStateList(response?.data?.data || []);
        } catch (error) {
            toast.error("Failed to load States");
        }
    };

    const fetchProfile = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}profile/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setProfileData(response?.data?.data || null);
        } catch (error) {
            toast.error("Failed to load Profile");
        }
    };

    useEffect(() => {
        fetchStates();
        fetchProfile();
    }, []);

    const allocatedStatesList = useMemo(() => {
        if (!profileData || !profileData.allocated_states) return [];

        return stateList.filter((state) =>
            profileData.allocated_states.includes(state.id)
        );
    }, [stateList, profileData]);

    useEffect(() => {
        if (allocatedStatesList.length > 0) {
            setStateId(allocatedStatesList[0].id);
        }
    }, [allocatedStatesList]);

    const fetchReport = async () => {
        try {
            if (!month || !year || !stateId) {
                toast.error("Please select Month, Year and State");
                return;
            }

            setLoading(true);

            const apiUrl = `${import.meta.env.VITE_APP_KEY}daily/sales/report/my/?month=${month}&year=${year}&state_id=${stateId}`;

            const response = await axios.get(apiUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setReportData(response.data);
        } catch (error) {
            toast.error("Failed to load Report");
        } finally {
            setLoading(false);
        }
    };

    const grandTotal = useMemo(() => {
        if (!reportData) return 0;
        return reportData.grand_total || 0;
    }, [reportData]);

    const exportToExcel = () => {
        try {
            if (!reportData) {
                toast.error("No data to export");
                return;
            }

            const wb = XLSX.utils.book_new();
            const wsData = [];

            // TITLE
            wsData.push([`${reportData.state} - ${reportData.month}`]);
            wsData.push([]);

            // HEADER
            wsData.push(["District", ...reportData.dates, "Total"]);

            // DISTRICT ROWS
            reportData.districts.forEach((dist) => {
                const row = [dist.district];

                reportData.dates.forEach((d) => {
                    row.push(dist.daily_counts[d.toString()] || 0);
                });

                row.push(dist.total || 0);
                wsData.push(row);
            });

            // TOTAL ROW
            const totalRow = ["TOTAL"];
            reportData.dates.forEach((d) => {
                totalRow.push(reportData.column_totals[d.toString()] || 0);
            });
            totalRow.push(reportData.grand_total || 0);
            wsData.push(totalRow);

            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // ================== STYLING ==================
            const range = XLSX.utils.decode_range(ws["!ref"]);

            // Column Widths
            ws["!cols"] = [
                { wch: 25 }, // District column
                ...reportData.dates.map(() => ({ wch: 10 })),
                { wch: 15 }, // Total column
            ];

            // Apply Styles to all cells
            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cellAddress]) continue;

                    // Default style
                    ws[cellAddress].s = {
                        font: { name: "Calibri", sz: 11 },
                        alignment: { vertical: "center", horizontal: "center", wrapText: true },
                        border: {
                            top: { style: "thin", color: { rgb: "AAAAAA" } },
                            bottom: { style: "thin", color: { rgb: "AAAAAA" } },
                            left: { style: "thin", color: { rgb: "AAAAAA" } },
                            right: { style: "thin", color: { rgb: "AAAAAA" } },
                        },
                    };

                    // TITLE ROW
                    if (R === 0) {
                        ws[cellAddress].s = {
                            font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: "1F4E79" } }, // dark blue
                        };
                    }

                    // HEADER ROW (Row 2 because row 1 is blank)
                    if (R === 2) {
                        ws[cellAddress].s = {
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: "28837A" } }, // teal
                            border: {
                                top: { style: "thin", color: { rgb: "000000" } },
                                bottom: { style: "thin", color: { rgb: "000000" } },
                                left: { style: "thin", color: { rgb: "000000" } },
                                right: { style: "thin", color: { rgb: "000000" } },
                            },
                        };
                    }

                    // TOTAL ROW (last row)
                    if (R === range.e.r) {
                        ws[cellAddress].s = {
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: "28A745" } }, // green
                            border: {
                                top: { style: "thin", color: { rgb: "000000" } },
                                bottom: { style: "thin", color: { rgb: "000000" } },
                                left: { style: "thin", color: { rgb: "000000" } },
                                right: { style: "thin", color: { rgb: "000000" } },
                            },
                        };
                    }

                    // TOTAL COLUMN (last column)
                    if (C === range.e.c && R > 2 && R < range.e.r) {
                        ws[cellAddress].s = {
                            font: { bold: true, color: { rgb: "000000" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: "FFF3CD" } }, // yellow
                            border: {
                                top: { style: "thin", color: { rgb: "AAAAAA" } },
                                bottom: { style: "thin", color: { rgb: "AAAAAA" } },
                                left: { style: "thin", color: { rgb: "AAAAAA" } },
                                right: { style: "thin", color: { rgb: "AAAAAA" } },
                            },
                        };
                    }
                }
            }

            // Merge Title Row
            ws["!merges"] = [
                {
                    s: { r: 0, c: 0 },
                    e: { r: 0, c: range.e.c },
                },
            ];

            XLSX.utils.book_append_sheet(wb, ws, "My Sales Report");

            XLSX.writeFile(wb, `MyDailySalesReport_${reportData.month}.xlsx`);

            toast.success("Excel Exported Successfully");
        } catch (error) {
            console.log(error);
            toast.error("Excel export failed");
        }
    };

    const exportToPDF = () => {
        try {
            if (!reportData) {
                toast.error("No data to export");
                return;
            }

            const doc = new jsPDF("landscape"); // landscape for wide table

            // Title
            doc.setFontSize(18);
            doc.setTextColor(31, 78, 121);
            doc.text(`${reportData.state} - ${reportData.month}`, 14, 15);

            // Table Header
            const head = [["District", ...reportData.dates, "Total"]];

            // Table Body
            const body = reportData.districts.map((dist) => {
                const row = [dist.district];

                reportData.dates.forEach((d) => {
                    row.push(dist.daily_counts[d.toString()] || 0);
                });

                row.push(dist.total || 0);
                return row;
            });

            // Total Row
            const totalRow = ["TOTAL"];
            reportData.dates.forEach((d) => {
                totalRow.push(reportData.column_totals[d.toString()] || 0);
            });
            totalRow.push(reportData.grand_total || 0);

            body.push(totalRow);

            // AutoTable
            autoTable(doc, {
                startY: 25,
                head: head,
                body: body,
                theme: "grid",
                styles: {
                    fontSize: 8,
                    halign: "center",
                    valign: "middle",
                },
                headStyles: {
                    fillColor: [40, 131, 122], // teal header
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                },
                didParseCell: function (data) {
                    const lastRowIndex = body.length - 1;
                    const lastColIndex = head[0].length - 1;

                    // TOTAL ROW (last row)
                    if (data.row.index === lastRowIndex) {
                        data.cell.styles.fillColor = [40, 167, 69]; // green
                        data.cell.styles.textColor = [255, 255, 255];
                        data.cell.styles.fontStyle = "bold";
                    }

                    // TOTAL COLUMN (last column except header & total row)
                    if (data.column.index === lastColIndex && data.row.index < lastRowIndex) {
                        data.cell.styles.fillColor = [255, 243, 205]; // yellow
                        data.cell.styles.textColor = [0, 0, 0];
                        data.cell.styles.fontStyle = "bold";
                    }
                },
            });

            doc.save(`MyDailySalesReport_${reportData.month}.pdf`);
            toast.success("PDF Exported Successfully");

        } catch (error) {
            console.log(error);
            toast.error("PDF export failed");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            {/* PAGE HEADER */}
            <Card
                style={{
                    borderRadius: "15px",
                    boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
                    marginBottom: "20px",
                    marginTop: "60px",
                    background: "linear-gradient(90deg, #0f2027, #203a43, #2c5364)",
                    color: "white",
                }}
            >
                <CardBody className="m-1">
                    <Row className="align-items-center">
                        <Col md="8">
                            <h2 style={{ margin: 0, fontWeight: "bold" }}>
                                Monthly Daily Sales Report
                            </h2>
                            <p style={{ margin: 0, opacity: 0.8 }}>
                                Search monthly sales by State and export to Excel / PDF
                            </p>
                        </Col>

                        <Col md="4" className="text-end">
                            <Button
                                color="primary"
                                style={{ marginRight: "10px", fontWeight: "bold" }}
                                onClick={exportToExcel}
                            >
                                Export Excel
                            </Button>

                            <Button
                                color="success"
                                style={{ fontWeight: "bold" }}
                                onClick={exportToPDF}
                            >
                                Export PDF
                            </Button>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            {/* FILTER SECTION */}
            <Card
                style={{
                    borderRadius: "12px",
                    boxShadow: "0px 3px 10px rgba(0,0,0,0.12)",
                    marginBottom: "20px",
                }}
            >
                <CardBody>
                    <CardTitle tag="h5" style={{ fontWeight: "bold", marginBottom: "15px" }}>
                        Search Filters
                    </CardTitle>

                    <Form>
                        <Row>
                            <Col md="3">
                                <Label style={{ fontWeight: "bold" }}>Month</Label>
                                <Input
                                    type="select"
                                    value={month}
                                    onChange={(e) => setMonth(Number(e.target.value))}
                                >
                                    <option value="1">January</option>
                                    <option value="2">February</option>
                                    <option value="3">March</option>
                                    <option value="4">April</option>
                                    <option value="5">May</option>
                                    <option value="6">June</option>
                                    <option value="7">July</option>
                                    <option value="8">August</option>
                                    <option value="9">September</option>
                                    <option value="10">October</option>
                                    <option value="11">November</option>
                                    <option value="12">December</option>
                                </Input>
                            </Col>

                            <Col md="3">
                                <Label style={{ fontWeight: "bold" }}>Year</Label>
                                <Input
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                />
                            </Col>

                            <Col md="4">
                                <Label style={{ fontWeight: "bold" }}>State</Label>
                                <Input
                                    type="select"
                                    value={stateId}
                                    onChange={(e) => setStateId(e.target.value)}
                                >
                                    <option value="">Select State</option>
                                    {allocatedStatesList.map((state) => (
                                        <option key={state.id} value={state.id}>
                                            {state.name}
                                        </option>
                                    ))}
                                </Input>
                            </Col>

                            <Col md="2" className="d-flex align-items-end">
                                <Button
                                    color="info"
                                    style={{
                                        width: "100%",
                                        fontWeight: "bold",
                                        color: "white",
                                    }}
                                    onClick={fetchReport}
                                >
                                    {loading ? "Searching..." : "Search"}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </CardBody>
            </Card>

            {/* REPORT TABLE */}
            <Card
                className="print-section"
                style={{
                    borderRadius: "12px",
                    boxShadow: "0px 3px 10px rgba(0,0,0,0.12)",
                }}
            >
                <CardBody>
                    {loading ? (
                        <h4 style={{ textAlign: "center" }}>Loading...</h4>
                    ) : reportData ? (
                        <>
                            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                                <h3 style={{ fontWeight: "bold", marginBottom: "5px" }}>
                                    Monthly Sales Report
                                </h3>
                                <h5 style={{ color: "#28837a", fontWeight: "bold" }}>
                                    {reportData.state.toUpperCase()} ({reportData.month})
                                </h5>
                            </div>

                            <div style={{ overflowX: "auto" }}>
                                <table
                                    className="table table-bordered table-striped"
                                    style={{
                                        width: "100%",
                                        textAlign: "center",
                                        borderCollapse: "collapse",
                                    }}
                                >
                                    <thead
                                        style={{
                                            background: "linear-gradient(90deg, #28837a, #40E0D0)",
                                            color: "white",
                                        }}
                                    >
                                        <tr>
                                            <th style={{ minWidth: "180px" }}>District</th>
                                            {reportData.dates.map((d) => (
                                                <th key={d}>{d}</th>
                                            ))}
                                            <th>Total</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {reportData.districts.map((dist, index) => (
                                            <tr key={index}>
                                                <td style={{ textAlign: "left", fontWeight: "bold" }}>
                                                    {dist.district}
                                                </td>

                                                {reportData.dates.map((d) => {
                                                    const value = dist.daily_counts[d.toString()] || 0;

                                                    return (
                                                        <td
                                                            key={d}
                                                            style={{
                                                                fontWeight: value > 0 ? "bold" : "normal",
                                                                backgroundColor: value > 0 ? "#d1f7ff" : "white",
                                                                color: value > 0 ? "#0b4f6c" : "black",
                                                            }}
                                                        >
                                                            {value}
                                                        </td>
                                                    );
                                                })}

                                                {/* TOTAL COLUMN */}
                                                <td
                                                    style={{
                                                        fontWeight: "bold",
                                                        backgroundColor: "#fff3cd",
                                                        color: "#856404",
                                                    }}
                                                >
                                                    {dist.total}
                                                </td>
                                            </tr>
                                        ))}

                                        {/* TOTAL ROW */}
                                        <tr style={{ fontWeight: "bold" }}>
                                            <td
                                                style={{
                                                    backgroundColor: "#d4edda",
                                                    color: "#155724",
                                                }}
                                            >
                                                TOTAL
                                            </td>

                                            {reportData.dates.map((d) => {
                                                const totalValue = reportData.column_totals[d.toString()] || 0;

                                                return (
                                                    <td
                                                        key={d}
                                                        style={{
                                                            backgroundColor: totalValue > 0 ? "#c3f7c9" : "#d4edda",
                                                            color: totalValue > 0 ? "#0b6623" : "#155724",
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        {totalValue}
                                                    </td>
                                                );
                                            })}

                                            <td
                                                style={{
                                                    backgroundColor: "#28a745",
                                                    color: "white",
                                                    fontSize: "16px",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                {grandTotal}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <h4 style={{ textAlign: "center", marginTop: "30px" }}>
                            No Data Found
                        </h4>
                    )}
                </CardBody>
            </Card>

            <ToastContainer />
        </div>
    );
};

export default MonthlyDailySalesReport;
