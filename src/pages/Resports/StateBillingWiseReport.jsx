import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Card, CardBody, Col, Row, Table, Label
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const StateBillingWiseReport = () => {
    const token = localStorage.getItem("token");
    const [data, setData] = useState([]);
    const today = new Date().toISOString().split("T")[0];
    const [fromDate, setFromDate] = useState(today);
    const [toDate, setToDate] = useState(today);

    const calculateTotals = (states) => {
        let totalBills = 0;
        let totalAmount = 0;

        states.forEach((state) => {
            state.bdo_details.forEach((bdo) => {
                totalBills += bdo.bills;
                totalAmount += bdo.amount;
            });
        });

        return { totalBills, totalAmount };
    };

    const fetchReport = async (start = fromDate, end = toDate) => {

        if (start > end) {
            toast.error("From Date cannot be greater than To Date");
            return;

        }

        try {

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}reports/state/wise/bdo/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params: {
                        start_date: start,
                        end_date: end
                    }
                }
            );

            setData(response.data.data);
            console.log(response.data.data)

        } catch (error) {
            toast.error("Error fetching report");
        }
    };


    useEffect(() => {
        fetchReport(today, today);
    }, [token]);


    const exportToExcel = () => {
        const workbook = XLSX.utils.book_new();

        const families = data.filter(
            (family) => family.family === "cycling" || family.family === "skating"
        );

        // Create a worksheet for each family or combine them
        families.forEach((family, familyIndex) => {
            const sheetData = [];

            // Title
            sheetData.push(["STATE WISE & BILLING WISE REPORT"]);
            sheetData.push([]); // Empty row (row 1)

            // Family header - these will be centered
            sheetData.push([family.family.toUpperCase()]); // Row 2
            sheetData.push([`${fromDate} to ${toDate}`]);  // Row 3
            sheetData.push([]); // Empty row (row 4)

            // Table headers
            sheetData.push(["#NO", "STATE", "BDO", "BILL", "AMOUNT", "STATE WISE TOTAL"]); // Row 5

            let totalBills = 0;
            let totalAmount = 0;

            // Track row colors for each data row
            const rowColors = [];

            // Add data rows (starting from row 6)
            family.states.forEach((state, stateIndex) => {
                const stateTotalAmount = state.bdo_details.reduce((sum, b) => sum + b.amount, 0);
                const rowColor = stateIndex % 2 === 0 ? "FCC08C" : "FFFFFF"; // Peach or White

                state.bdo_details.forEach((bdo, bdoIndex) => {
                    const row = [];

                    // #NO - only first row of state
                    row.push(bdoIndex === 0 ? stateIndex + 1 : "");

                    // STATE - only first row of state
                    row.push(bdoIndex === 0 ? state.state : "");

                    // BDO
                    row.push(bdo.name);

                    // BILL
                    row.push(bdo.bills);

                    // AMOUNT (with 2 decimal places)
                    row.push(Number(bdo.amount).toFixed(2));

                    // STATE WISE TOTAL - only first row of state
                    row.push(bdoIndex === 0 ? Number(stateTotalAmount).toFixed(2) : "");

                    sheetData.push(row);
                    rowColors.push(rowColor); // Store the color for this row

                    totalBills += bdo.bills;
                    totalAmount += bdo.amount;
                });
            });

            // Empty row before total
            sheetData.push(["", "", "", "", "", ""]);
            rowColors.push("FFFFFF"); // White for empty row

            // Total row
            sheetData.push([
                "TOTAL",
                "",
                "",
                totalBills,
                Number(totalAmount).toFixed(2),
                Number(totalAmount).toFixed(2)
            ]);
            rowColors.push("FF0000"); // Red for total row

            // Create worksheet
            const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

            // Set column widths
            worksheet['!cols'] = [
                { wch: 8 },  // #NO
                { wch: 18 }, // STATE
                { wch: 25 }, // BDO
                { wch: 10 }, // BILL
                { wch: 15 }, // AMOUNT
                { wch: 18 }  // STATE WISE TOTAL
            ];

            // ========== STYLE TITLE ROW (row 0) - YELLOW BACKGROUND ==========
            const titleRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
            if (worksheet[titleRef]) {
                worksheet[titleRef].s = {
                    fill: {
                        patternType: "solid",
                        fgColor: { rgb: "94EBF1" }
                    },
                    font: {
                        bold: true,
                        sz: 18,
                        color: { rgb: "000000" } // Black text
                    },
                    alignment: {
                        horizontal: "center",
                        vertical: "center"
                    }
                };
            }

            // ========== STYLE EMPTY ROW (row 1) ==========
            const emptyRow1Ref = XLSX.utils.encode_cell({ r: 1, c: 0 });
            if (worksheet[emptyRow1Ref]) {
                worksheet[emptyRow1Ref].s = {
                    font: { sz: 2 },
                    alignment: { horizontal: "center" }
                };
            }

            // ========== STYLE FAMILY HEADER (rows 2-3) - ORANGE BACKGROUND WITH WHITE TEXT ==========
            for (let r = 2; r < 4; r++) {
                const cellRef = XLSX.utils.encode_cell({ r, c: 0 });
                if (!worksheet[cellRef]) continue;

                worksheet[cellRef].s = {
                    fill: {
                        patternType: "solid",
                        fgColor: { rgb: "94EBF1" }
                    },
                    font: {
                        bold: r === 2 ? true : false,
                        sz: r === 2 ? 14 : 10,
                        color: { rgb: "000000" }
                    },
                    alignment: {
                        horizontal: "center",
                        vertical: "center"
                    }
                };
            }

            // ========== STYLE EMPTY ROW (row 4) ==========
            const emptyRow4Ref = XLSX.utils.encode_cell({ r: 4, c: 0 });
            if (worksheet[emptyRow4Ref]) {
                worksheet[emptyRow4Ref].s = {
                    font: { sz: 2 },
                    alignment: { horizontal: "center" }
                };
            }

            // ========== STYLE HEADERS (row 5) - WITH BACKGROUND COLOR ==========
            for (let col = 0; col <= 5; col++) {
                const cellRef = XLSX.utils.encode_cell({ r: 5, c: col });
                if (!worksheet[cellRef]) continue;

                worksheet[cellRef].s = {
                    fill: {
                        patternType: "solid",
                        fgColor: { rgb: "94EBF1" } // Light blue background
                    },
                    font: {
                        bold: true,
                        color: { rgb: "FF0000" } // Red text
                    },
                    alignment: {
                        horizontal: "center",
                        vertical: "center"
                    },
                    border: {
                        top: { style: "thin", color: { rgb: "000000" } },
                        bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: "thin", color: { rgb: "000000" } },
                        right: { style: "thin", color: { rgb: "000000" } }
                    }
                };
            }

            // ========== STYLE DATA ROWS (starting from row 6) ==========
            for (let r = 0; r < rowColors.length; r++) {
                const dataRowIndex = 6 + r;
                const rowColor = rowColors[r];

                for (let col = 0; col <= 5; col++) {
                    const cellRef = XLSX.utils.encode_cell({ r: dataRowIndex, c: col });
                    if (!worksheet[cellRef]) continue;

                    const cellValue = worksheet[cellRef].v;

                    // Base style with ENTIRE ROW having the same background color
                    const style = {
                        fill: {
                            patternType: "solid",
                            fgColor: { rgb: rowColor }
                        },
                        alignment: {
                            horizontal: "center",
                            vertical: "center"
                        },
                        border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: "thin", color: { rgb: "000000" } },
                            left: { style: "thin", color: { rgb: "000000" } },
                            right: { style: "thin", color: { rgb: "000000" } }
                        }
                    };

                    // ===== MAKE ALL COLUMNS BOLD INCLUDING AMOUNT (col 4) =====
                    style.font = { bold: true };

                    // ===== SET TEXT COLOR WHITE FOR TOTAL ROW =====
                    if (rowColor === "FF0000") { // If this is the total row
                        style.font.color = { rgb: "FFFFFF" }; // White text
                    }

                    // For empty spacer row (rowColor is FFFFFF), keep borders visible
                    if (rowColor === "FFFFFF" && cellValue === "") {
                        style.border = {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: "thin", color: { rgb: "000000" } },
                            left: { style: "thin", color: { rgb: "000000" } },
                            right: { style: "thin", color: { rgb: "000000" } }
                        };
                    }

                    worksheet[cellRef].s = style;
                }
            }

            // ========== SET UP MERGES ==========
            const totalRowIndex = 6 + rowColors.length - 1; // Last row is total

            worksheet['!merges'] = [
                // Title merges
                { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Main title

                // Family header merges - CENTERED
                { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }, // Family name
                { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } }, // Date range

                // Total row merge
                { s: { r: totalRowIndex, c: 0 }, e: { r: totalRowIndex, c: 2 } } // TOTAL merges first 3 columns
            ];

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, family.family.toUpperCase());
        });

        // Save the file
        XLSX.writeFile(workbook, "State_Billing_Report.xlsx");
    };
    

    const exportToPDF = () => {
        const families = data.filter(
            (family) => family.family === "cycling" || family.family === "skating"
        );

        const pdf = new jsPDF("p", "mm", "a4");

        // Format number to 2 decimal places
        const formatAmount = (amount) => {
            return Number(amount).toFixed(2);
        };

        families.forEach((family, familyIndex) => {
            if (familyIndex > 0) {
                pdf.addPage();
            }

            // Title
            pdf.setFontSize(16);
            pdf.setFont("helvetica", "bold");
            pdf.text("STATE WISE & BILLING WISE REPORT", 105, 20, { align: "center" });

            // Family header
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text(family.family.toUpperCase(), 105, 32, { align: "center" });
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "normal");
            pdf.text(`${fromDate} to ${toDate}`, 105, 37, { align: "center" });

            // Prepare table data
            const headers = [["#NO", "STATE", "BDO", "BILL", "AMOUNT", "STATE WISE TOTAL"]];
            const tableData = [];
            let totalBills = 0;
            let totalAmount = 0;

            // Track which rows belong to which state for coloring
            const rowStateMap = [];

            family.states.forEach((state, stateIndex) => {
                const stateTotalAmount = state.bdo_details.reduce((sum, b) => sum + b.amount, 0);

                state.bdo_details.forEach((bdo, bdoIndex) => {
                    const row = [];

                    if (bdoIndex === 0) {
                        row.push(stateIndex + 1);
                        row.push(state.state);
                    } else {
                        row.push("");
                        row.push("");
                    }

                    row.push(bdo.name);
                    row.push(bdo.bills);
                    row.push(formatAmount(bdo.amount));

                    if (bdoIndex === 0) {
                        row.push(formatAmount(stateTotalAmount));
                    } else {
                        row.push("");
                    }

                    tableData.push(row);
                    rowStateMap.push(stateIndex); // Track which state this row belongs to

                    totalBills += bdo.bills;
                    totalAmount += bdo.amount;
                });
            });

            // Add empty row
            tableData.push(["", "", "", "", "", ""]);
            rowStateMap.push(-1); // Empty row

            // Add total row
            tableData.push(["TOTAL", "", "", totalBills, formatAmount(totalAmount), formatAmount(totalAmount)]);
            rowStateMap.push(-2); // Total row

            // Generate table
            autoTable(pdf, {
                head: headers,
                body: tableData,
                startY: 48,
                theme: 'grid',
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    halign: 'center',
                    valign: 'middle',
                    textColor: [0, 0, 0],
                },
                headStyles: {
                    fillColor: [148, 235, 241], // Light blue
                    textColor: [255, 0, 0], // Red text
                    fontStyle: 'bold',
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 35 },
                    2: { cellWidth: 50 },
                    3: { cellWidth: 15 },
                    4: { cellWidth: 25 },
                    5: { cellWidth: 30 },
                },
                didParseCell: function (data) {
                    const rowIndex = data.row.index;
                    const stateIndex = rowStateMap[rowIndex];

                    // HEADER ROW - already styled
                    if (data.section === 'head') return;

                    // EMPTY ROW - make it invisible
                    if (stateIndex === -1) {
                        data.cell.styles.fillColor = [255, 255, 255];
                        data.cell.styles.lineColor = [255, 255, 255];
                        data.cell.styles.textColor = [255, 255, 255];
                        data.cell.styles.lineWidth = 0;
                        return;
                    }

                    // TOTAL ROW - Red background for ENTIRE row
                    if (stateIndex === -2) {
                        data.cell.styles.fillColor = [255, 0, 0]; // Red for entire row
                        data.cell.styles.textColor = [255, 255, 255]; // White text
                        data.cell.styles.fontStyle = 'bold';
                        return;
                    }

                    // DATA ROWS - ENTIRE row gets the same color based on state
                    if (stateIndex % 2 === 0) {
                        data.cell.styles.fillColor = [252, 192, 140]; // Peach for ENTIRE row
                    } else {
                        data.cell.styles.fillColor = [255, 255, 255]; // White for ENTIRE row
                    }

                    // Bold text for specific columns
                    if (data.column.index === 0 || data.column.index === 1 ||
                        data.column.index === 2 || data.column.index === 3 ||
                        data.column.index === 5) {
                        data.cell.styles.fontStyle = 'bold';
                    }
                    data.cell.styles.fontStyle = 'bold';

                    // For empty cells in #NO, STATE, STATE TOTAL columns (due to rowspan),
                    // they should still have the row color, not white
                    // So we don't change them
                },
                margin: { left: 14, right: 14 },
            });
        });

        pdf.save("State_Billing_Report.pdf");
    };


    return (
        <React.Fragment>
            <div className="page-content">
                <Breadcrumbs title="Reports" breadcrumbItem="State Wise & Billing Wise Report" />
                <Row>
                    <Row className="mb-4">

                        <Col md={3}>
                            <Label>Start Date</Label>
                            <input
                                type="date"
                                className="form-control"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </Col>

                        <Col md={3}>
                            <Label>End Date</Label>
                            <input
                                type="date"
                                className="form-control"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </Col>

                        <Col md={2} style={{ marginTop: "28px" }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => fetchReport(fromDate, toDate)}
                            >
                                Filter
                            </button>
                        </Col>
                        <Col md={2} style={{ marginTop: "28px" }}>
                            <button
                                className="btn btn-success"
                                onClick={exportToExcel}
                            >
                                Export Excel
                            </button>
                        </Col>

                        <Col md={2} style={{ marginTop: "28px" }}>
                            <button
                                className="btn btn-danger"
                                onClick={exportToPDF}
                            >
                                Export PDF
                            </button>
                        </Col>

                    </Row>
                    <Col lg={12}>


                        <Row>

                            {data
                                .filter((family) => family.family === "cycling" || family.family === "skating")
                                .map((family, index) => {

                                    const { totalBills, totalAmount } = calculateTotals(family.states);

                                    return (

                                        <Col lg={6} key={index}>

                                            <Card id={`report-${family.family}`}>
                                                <CardBody>

                                                    <style>
                                                        {`
        .report-table {
            border: 2px solid black;
        }

        .report-table th,
        .report-table td {
            border: 1px solid black !important;
        }

        .report-table thead th {
            background: #94ebf1 ;
            color: red ;
            font-weight: 700 ;
        }

        .report-table tbody tr.row-peach,
        .report-table tbody tr.row-peach td {
            background-color: #fcc08c ;
        }

        .report-table tbody tr.row-white,
        .report-table tbody tr.row-white td {
            background-color: #ffffff !important;
        }

        .report-table .total-row td{
            background: red !important;
            color: white !important;
            font-weight: bold;
        }
    `}
                                                    </style>

                                                    <h4 style={{ marginBottom: "5px", textTransform: "uppercase", textAlign: "center" }}>
                                                        {family.family}
                                                    </h4>

                                                    <div style={{ textAlign: "center", fontWeight: "600", marginBottom: "10px" }}>
                                                        {fromDate} to {toDate}
                                                    </div>

                                                    <Table responsive className="text-center align-middle report-table">

                                                        <thead className="fw-bold text-center">
                                                            <tr>
                                                                <th>#NO</th>
                                                                <th>STATE</th>
                                                                <th>BDO</th>
                                                                <th>BILL</th>
                                                                <th>AMOUNT</th>
                                                                <th>STATE WISE TOTAL</th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>

                                                            {family.states.map((state, stateIndex) => {

                                                                const totalAmount = state.bdo_details.reduce(
                                                                    (sum, b) => sum + b.amount,
                                                                    0
                                                                )

                                                                const totalBills = state.bdo_details.reduce(
                                                                    (sum, b) => sum + b.bills,
                                                                    0
                                                                )

                                                                return state.bdo_details.map((bdo, i) => (

                                                                    <tr key={i} className={stateIndex % 2 === 0 ? "row-peach" : "row-white"}>

                                                                        {i === 0 && (
                                                                            <>
                                                                                <td rowSpan={state.bdo_details.length} className="fw-bold">
                                                                                    {stateIndex + 1}
                                                                                </td>

                                                                                <td rowSpan={state.bdo_details.length} className="fw-bold">
                                                                                    {state.state}
                                                                                </td>
                                                                            </>
                                                                        )}

                                                                        <td className="fw-semibold ">{bdo.name}</td>

                                                                        <td className="fw-semibold ">{bdo.bills}</td>

                                                                        <td className="fw-semibold ">{bdo.amount}</td>

                                                                        {i === 0 && (
                                                                            <td rowSpan={state.bdo_details.length} className="fw-bold">
                                                                                {totalAmount?.toFixed(2)}
                                                                            </td>
                                                                        )}

                                                                    </tr>
                                                                ))
                                                            })}

                                                            <tr className="total-row">
                                                                <td colSpan="3">TOTAL</td>
                                                                <td>{totalBills}</td>
                                                                <td>{totalAmount?.toFixed(2)}</td>
                                                                <td>{totalAmount?.toFixed(2)}</td>
                                                            </tr>

                                                        </tbody>

                                                    </Table>

                                                </CardBody>
                                            </Card>

                                        </Col>

                                    )
                                })}

                        </Row>

                    </Col>
                </Row>
            </div>
        </React.Fragment>
    )
}

export default StateBillingWiseReport;