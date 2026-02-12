import React, { useMemo, useState } from "react";
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

const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
];

function safeNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function getYearOptions(range = 8) {
    const now = new Date().getFullYear();
    return Array.from({ length: range }, (_, i) => now - i);
}

const AllStaffsMonthlyCategoryReport = () => {
    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const [loading, setLoading] = useState(false);
    const [apiData, setApiData] = useState(null);

    const fetchReport = async () => {
        try {
            setLoading(true);

            const res = await axios.get(`${baseUrl}monthly/category/report/all/`, {
                params: { month, year },
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res?.data?.status !== "success") {
                toast.error(res?.data?.message || "Failed to load report");
                setApiData(null);
            } else {
                setApiData(res.data);
                toast.success("Report Loaded Successfully");
            }
        } catch (e) {
            toast.error(e?.response?.data?.message || e.message || "Server error");
            setApiData(null);
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        const cats = apiData?.categories || [];
        const uniq = Array.from(new Set(cats));
        if (!uniq.includes("Others")) uniq.push("Others");
        return uniq;
    }, [apiData]);

    const users = useMemo(() => {
        const d = apiData?.data || {};
        return Object.keys(d);
    }, [apiData]);

    const computeTotalsForDistricts = (districtsObj) => {
        const totals = {};
        categories.forEach((c) => (totals[c] = 0));
        totals.total = 0;

        Object.values(districtsObj || {}).forEach((row) => {
            categories.forEach((c) => (totals[c] += safeNum(row?.[c])));
            totals.total += safeNum(row?.total);
        });

        return totals;
    };

    const exportToExcel = () => {
        try {
            if (!apiData || apiData.status !== "success") {
                toast.error("No data to export");
                return;
            }

            const wb = XLSX.utils.book_new();

            // ===== STYLES =====
            const titleStyle = {
                font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
                alignment: { horizontal: "center", vertical: "center" },
                fill: { patternType: "solid", fgColor: { rgb: "0B4F6C" } },
            };

            const monthStyle = {
                font: { bold: true, sz: 12, color: { rgb: "0B4F6C" } },
                alignment: { horizontal: "center", vertical: "center" },
                fill: { patternType: "solid", fgColor: { rgb: "D1F7FF" } },
            };

            const stateStyle = {
                font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
                alignment: { horizontal: "left", vertical: "center" },
                fill: { patternType: "solid", fgColor: { rgb: "203A43" } },
            };

            const headerStyle = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                alignment: { horizontal: "center", vertical: "center", wrapText: true },
                fill: { patternType: "solid", fgColor: { rgb: "28837A" } },
                border: {
                    top: { style: "thin", color: { rgb: "AAAAAA" } },
                    bottom: { style: "thin", color: { rgb: "AAAAAA" } },
                    left: { style: "thin", color: { rgb: "AAAAAA" } },
                    right: { style: "thin", color: { rgb: "AAAAAA" } },
                },
            };

            const districtStyle = {
                font: { bold: true, color: { rgb: "0B4F6C" } },
                alignment: { horizontal: "left", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "AAAAAA" } },
                    bottom: { style: "thin", color: { rgb: "AAAAAA" } },
                    left: { style: "thin", color: { rgb: "AAAAAA" } },
                    right: { style: "thin", color: { rgb: "AAAAAA" } },
                },
            };

            const normalStyle = {
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "AAAAAA" } },
                    bottom: { style: "thin", color: { rgb: "AAAAAA" } },
                    left: { style: "thin", color: { rgb: "AAAAAA" } },
                    right: { style: "thin", color: { rgb: "AAAAAA" } },
                },
            };

            const altRowStyle = {
                fill: { patternType: "solid", fgColor: { rgb: "F8F9FA" } },
            };

            const highlightStyle = {
                font: { bold: true, color: { rgb: "0B4F6C" } },
                fill: { patternType: "solid", fgColor: { rgb: "D1F7FF" } },
            };

            const totalRowStyle = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                alignment: { horizontal: "center", vertical: "center" },
                fill: { patternType: "solid", fgColor: { rgb: "28A745" } },
                border: {
                    top: { style: "thin", color: { rgb: "AAAAAA" } },
                    bottom: { style: "thin", color: { rgb: "AAAAAA" } },
                    left: { style: "thin", color: { rgb: "AAAAAA" } },
                    right: { style: "thin", color: { rgb: "AAAAAA" } },
                },
            };

            users.forEach((uname) => {
                const wsData = [];

                wsData.push([`All Staff Monthly Category Report - ${uname}`]);
                wsData.push([]);
                wsData.push([
                    `Month: ${monthOptions.find((m) => m.value === apiData.month)?.label} ${apiData.year}`,
                ]);
                wsData.push([]);

                const userObj = apiData.data[uname] || {};
                const states = Object.keys(userObj);

                states.forEach((state) => {
                    wsData.push([`STATE: ${state}`]);
                    wsData.push([]);

                    wsData.push(["S.No", "District", ...categories, "TOTAL"]);

                    const districtsObj = userObj[state] || {};
                    const districtNames = Object.keys(districtsObj);

                    districtNames.forEach((district, idx) => {
                        const rowObj = districtsObj[district] || {};
                        const row = [idx + 1, district];

                        categories.forEach((c) => row.push(safeNum(rowObj?.[c])));
                        row.push(safeNum(rowObj?.total));

                        wsData.push(row);
                    });

                    const stateTotals = computeTotalsForDistricts(districtsObj);

                    const totalRow = ["", "TOTAL"];
                    categories.forEach((c) => totalRow.push(safeNum(stateTotals[c])));
                    totalRow.push(safeNum(stateTotals.total));

                    wsData.push(totalRow);
                    wsData.push([]);
                    wsData.push([]);
                });

                const ws = XLSX.utils.aoa_to_sheet(wsData);

                // Column widths
                ws["!cols"] = [
                    { wch: 8 },
                    { wch: 25 },
                    ...categories.map(() => ({ wch: 15 })),
                    { wch: 15 },
                ];

                // Merge title and month row
                const totalCols = 2 + categories.length + 1;
                ws["!merges"] = ws["!merges"] || [];

                ws["!merges"].push({
                    s: { r: 0, c: 0 },
                    e: { r: 0, c: totalCols - 1 },
                });

                ws["!merges"].push({
                    s: { r: 2, c: 0 },
                    e: { r: 2, c: totalCols - 1 },
                });

                // Apply styles
                const range = XLSX.utils.decode_range(ws["!ref"]);

                for (let R = range.s.r; R <= range.e.r; ++R) {
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                        const cell = ws[cellAddress];
                        if (!cell) continue;

                        // Default
                        cell.s = { ...normalStyle };

                        // Title Row
                        if (R === 0) {
                            cell.s = titleStyle;
                        }

                        // Month Row
                        if (R === 2) {
                            cell.s = monthStyle;
                        }

                        // STATE Row
                        if (typeof cell.v === "string" && cell.v.startsWith("STATE:")) {
                            cell.s = stateStyle;
                        }

                        // Header Row
                        if (
                            cell.v === "S.No" ||
                            cell.v === "District" ||
                            categories.includes(cell.v) ||
                            cell.v === "TOTAL"
                        ) {
                            cell.s = headerStyle;
                        }

                        // Alternate row background (data rows)
                        if (R > 4 && R % 2 === 0) {
                            cell.s = { ...cell.s, ...altRowStyle };
                        }

                        // District Column style
                        if (C === 1 && R > 4) {
                            cell.s = { ...districtStyle };
                        }

                        // Highlight numbers > 0
                        if (typeof cell.v === "number" && cell.v > 0) {
                            cell.s = { ...cell.s, ...highlightStyle };
                        }

                        // TOTAL Row Style
                        if (cell.v === "TOTAL" && C === 1) {
                            for (let cc = 0; cc <= range.e.c; cc++) {
                                const addr = XLSX.utils.encode_cell({ r: R, c: cc });
                                if (ws[addr]) ws[addr].s = totalRowStyle;
                            }
                        }
                    }
                }

                XLSX.utils.book_append_sheet(wb, ws, uname.substring(0, 31));
            });

            XLSX.writeFile(
                wb,
                `AllStaffMonthlyCategoryReport_${monthOptions.find((m) => m.value === apiData.month)?.label}_${apiData.year}.xlsx`
            );

            toast.success("Excel Exported Successfully");
        } catch (error) {
            console.log(error);
            toast.error("Excel export failed");
        }
    };

    // const exportToPDF = () => {
    //     try {
    //         if (!apiData || apiData.status !== "success") {
    //             toast.error("No data to export");
    //             return;
    //         }

    //         const doc = new jsPDF("l", "mm", "a4"); // landscape
    //         const monthName =
    //             monthOptions.find((m) => m.value === apiData.month)?.label || "";

    //         doc.setFontSize(16);
    //         doc.text("All Staff Monthly Category Report", 14, 15);

    //         doc.setFontSize(11);
    //         doc.text(`Month: ${monthName} ${apiData.year}`, 14, 23);

    //         let startY = 30;

    //         users.forEach((uname, uIndex) => {
    //             doc.setFontSize(13);
    //             doc.setTextColor(11, 79, 108);
    //             doc.text(`Staff: ${uname}`, 14, startY);

    //             startY += 6;

    //             const userObj = apiData.data[uname] || {};
    //             const states = Object.keys(userObj);

    //             states.forEach((state) => {
    //                 doc.setFontSize(12);
    //                 doc.setTextColor(40, 131, 122);
    //                 doc.text(`STATE: ${state}`, 14, startY);

    //                 startY += 5;

    //                 const districtsObj = userObj[state] || {};
    //                 const districtNames = Object.keys(districtsObj);

    //                 const head = [["S.No", "District", ...categories, "TOTAL"]];

    //                 const body = districtNames.map((district, idx) => {
    //                     const rowObj = districtsObj[district] || {};
    //                     const row = [idx + 1, district];

    //                     categories.forEach((c) => row.push(safeNum(rowObj?.[c])));
    //                     row.push(safeNum(rowObj?.total));

    //                     return row;
    //                 });

    //                 const stateTotals = computeTotalsForDistricts(districtsObj);

    //                 const totalRow = ["", "TOTAL"];
    //                 categories.forEach((c) => totalRow.push(safeNum(stateTotals[c])));
    //                 totalRow.push(safeNum(stateTotals.total));

    //                 body.push(totalRow);

    //                 autoTable(doc, {
    //                     startY,
    //                     head,
    //                     body,
    //                     theme: "grid",
    //                     styles: {
    //                         fontSize: 8,
    //                         halign: "center",
    //                         valign: "middle",
    //                     },
    //                     headStyles: {
    //                         fillColor: [40, 131, 122],
    //                         textColor: [255, 255, 255],
    //                         fontStyle: "bold",
    //                     },
    //                     alternateRowStyles: {
    //                         fillColor: [245, 245, 245],
    //                     },
    //                     didParseCell: function (data) {
    //                         // District left align
    //                         if (data.column.index === 1 && data.section === "body") {
    //                             data.cell.styles.halign = "left";
    //                             data.cell.styles.fontStyle = "bold";
    //                         }

    //                         // Total row green
    //                         if (data.row.index === body.length - 1) {
    //                             data.cell.styles.fillColor = [40, 167, 69];
    //                             data.cell.styles.textColor = [255, 255, 255];
    //                             data.cell.styles.fontStyle = "bold";
    //                         }
    //                     },
    //                 });

    //                 startY = doc.lastAutoTable.finalY + 10;

    //                 // New Page if needed
    //                 if (startY > 180) {
    //                     doc.addPage();
    //                     startY = 20;
    //                 }
    //             });

    //             startY += 10;

    //             if (startY > 180 && uIndex !== users.length - 1) {
    //                 doc.addPage();
    //                 startY = 20;
    //             }
    //         });

    //         doc.save(`AllStaffMonthlyCategoryReport_${monthName}_${apiData.year}.pdf`);

    //         toast.success("PDF Exported Successfully");
    //     } catch (error) {
    //         console.log(error);
    //         toast.error("PDF export failed");
    //     }
    // };

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
                                All Staff Monthly Category Report
                            </h2>
                            <p style={{ margin: 0, opacity: 0.8 }}>
                                View monthly category wise sales of all staffs and export to Excel / PDF
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

                            {/* <Button
                                color="danger"
                                style={{ fontWeight: "bold" }}
                                onClick={exportToPDF}
                            >
                                Export PDF
                            </Button> */}

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
                            <Col md="4">
                                <Label style={{ fontWeight: "bold" }}>Month</Label>
                                <Input
                                    type="select"
                                    value={month}
                                    onChange={(e) => setMonth(Number(e.target.value))}
                                >
                                    {monthOptions.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {m.label}
                                        </option>
                                    ))}
                                </Input>
                            </Col>

                            <Col md="4">
                                <Label style={{ fontWeight: "bold" }}>Year</Label>
                                <Input
                                    type="select"
                                    value={year}
                                    onChange={(e) => setYear(Number(e.target.value))}
                                >
                                    {getYearOptions(8).map((y) => (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    ))}
                                </Input>
                            </Col>

                            <Col md="4" className="d-flex align-items-end">
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

            {/* REPORT SECTION */}
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
                    ) : apiData?.status === "success" ? (
                        <>
                            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                                <h3 style={{ fontWeight: "bold", marginBottom: "5px" }}>
                                    All Staff Monthly Category Report
                                </h3>

                                <h5 style={{ color: "#28837a", fontWeight: "bold" }}>
                                    {monthOptions.find((m) => m.value === apiData.month)?.label} (
                                    {apiData.year})
                                </h5>
                            </div>

                            {users.length === 0 ? (
                                <h4 style={{ textAlign: "center" }}>No Data Found</h4>
                            ) : (
                                users.map((uname, uIndex) => {
                                    const userObj = apiData.data[uname] || {};
                                    const states = Object.keys(userObj);

                                    return (
                                        <Card
                                            key={uIndex}
                                            style={{
                                                marginBottom: "25px",
                                                borderRadius: "12px",
                                                boxShadow: "0px 3px 10px rgba(0,0,0,0.12)",
                                                border: "2px solid #28837a",
                                            }}
                                        >
                                            <CardBody>
                                                <div
                                                    style={{
                                                        background: "linear-gradient(90deg, #28837a, #40E0D0)",
                                                        padding: "12px",
                                                        borderRadius: "10px",
                                                        color: "white",
                                                        fontWeight: "bold",
                                                        fontSize: "16px",
                                                        marginBottom: "15px",
                                                    }}
                                                >
                                                    {uname}
                                                </div>

                                                {states.length === 0 ? (
                                                    <h6 style={{ textAlign: "center" }}>No State Data Found</h6>
                                                ) : (
                                                    states.map((state, sIndex) => {
                                                        const districtsObj = userObj[state] || {};
                                                        const districtNames = Object.keys(districtsObj);

                                                        const stateTotals = computeTotalsForDistricts(districtsObj);

                                                        return (
                                                            <div key={sIndex} style={{ marginBottom: "30px" }}>
                                                                {/* STATE HEADER */}
                                                                <div
                                                                    style={{
                                                                        backgroundColor: "#28837a",
                                                                        padding: "10px",
                                                                        borderRadius: "8px",
                                                                        fontWeight: "bold",
                                                                        color: "white",
                                                                        marginBottom: "12px",
                                                                    }}
                                                                >
                                                                    {state.toUpperCase()}
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
                                                                                background:
                                                                                    "linear-gradient(90deg, #28837a, #40E0D0)",
                                                                                color: "white",
                                                                            }}
                                                                        >
                                                                            <tr>
                                                                                <th style={{ minWidth: "80px" }}>S.No</th>
                                                                                <th style={{ minWidth: "200px" }}>District</th>

                                                                                {categories.map((c) => (
                                                                                    <th key={c} style={{ minWidth: "120px" }}>
                                                                                        {c}
                                                                                    </th>
                                                                                ))}

                                                                                <th style={{ minWidth: "120px" }}>TOTAL</th>
                                                                            </tr>
                                                                        </thead>

                                                                        <tbody>
                                                                            {districtNames.map((district, idx) => {
                                                                                const row = districtsObj[district] || {};

                                                                                return (
                                                                                    <tr key={district}>
                                                                                        <td style={{ fontWeight: "bold" }}>{idx + 1}</td>

                                                                                        <td
                                                                                            style={{
                                                                                                textAlign: "left",
                                                                                                fontWeight: "bold",
                                                                                            }}
                                                                                        >
                                                                                            {district}
                                                                                        </td>

                                                                                        {categories.map((c) => {
                                                                                            const value = safeNum(row?.[c]);

                                                                                            return (
                                                                                                <td
                                                                                                    key={c}
                                                                                                    style={{
                                                                                                        fontWeight: value > 0 ? "bold" : "normal",
                                                                                                        backgroundColor:
                                                                                                            value > 0 ? "#d1f7ff" : "white",
                                                                                                        color: value > 0 ? "#0b4f6c" : "black",
                                                                                                    }}
                                                                                                >
                                                                                                    {value}
                                                                                                </td>
                                                                                            );
                                                                                        })}

                                                                                        <td
                                                                                            style={{
                                                                                                fontWeight: "bold",
                                                                                                backgroundColor: "#fff3cd",
                                                                                                color: "#856404",
                                                                                            }}
                                                                                        >
                                                                                            {safeNum(row?.total)}
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}

                                                                            {/* TOTAL ROW */}
                                                                            <tr style={{ fontWeight: "bold" }}>
                                                                                <td
                                                                                    colSpan={2}
                                                                                    style={{
                                                                                        backgroundColor: "#d4edda",
                                                                                        color: "#155724",
                                                                                    }}
                                                                                >
                                                                                    TOTAL
                                                                                </td>

                                                                                {categories.map((c) => {
                                                                                    const totalValue = safeNum(stateTotals[c]);

                                                                                    return (
                                                                                        <td
                                                                                            key={c}
                                                                                            style={{
                                                                                                backgroundColor:
                                                                                                    totalValue > 0
                                                                                                        ? "#c3f7c9"
                                                                                                        : "#d4edda",
                                                                                                color:
                                                                                                    totalValue > 0
                                                                                                        ? "#0b6623"
                                                                                                        : "#155724",
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
                                                                                    {safeNum(stateTotals.total)}
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </CardBody>
                                        </Card>
                                    );
                                })
                            )}
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

export default AllStaffsMonthlyCategoryReport;
