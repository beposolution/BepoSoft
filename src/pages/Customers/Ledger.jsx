import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    CardSubtitle,
    Input,
    Label,
    Button,
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axios from "axios";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import autoTable from "jspdf-autotable";

const BasicTable = () => {
    const { id } = useParams();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const name = localStorage.getItem('name');
    document.title = `Ledger | Beposoft`;
    const [advanceReceipts, setAdvanceReceipts] = useState([])
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [companyFilter, setCompanyFilter] = useState("");
    const [companys, setCompany] = useState([]);
    const [banks, setBanks] = useState([]);
    const [paymentReceipts, setPaymentReceipts] = useState([]);
    const [grvList, setGrvList] = useState([]);
    const [refundReceipts, setRefundReceipts] = useState([]);
    const [advanceTransfers, setAdvanceTransfers] = useState([]);
    const [ledgerSentTransfers, setLedgerSentTransfers] = useState([]);

    const tableRef = useRef(null);

    useEffect(() => {
        const fetchBanks = async () => {
            const token = localStorage.getItem("token");
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}banks/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.status === 200) setBanks(response.data.data);
            } catch (error) {
                toast.error("Error fetching banks:");
            }
        }
        fetchBanks();
    }, []);

    const bankIdToName = banks.reduce((acc, bank) => {
        acc[bank.id] = bank.name;
        return acc;
    }, {});

    useEffect(() => {
        const fetchLedgerData = async () => {
            const token = localStorage.getItem("token");

            try {
                // Fetch ledger data
                const ledgerResponse = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}customer/${id}/ledger/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // Fetch company data
                const companyResponse = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}company/data/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (companyResponse.status === 200) {
                    setCompany(companyResponse.data.data);
                }


                // Set the fetched data into the state
                const ledgerData = ledgerResponse.data.data.ledger || [];

                setOrders(ledgerData);
                setFilteredOrders(ledgerData);

                setAdvanceReceipts(ledgerResponse.data.data.advance_receipts);
                setPaymentReceipts(ledgerResponse.data.data.payment_receipts || []);
                setGrvList(ledgerResponse.data.data.grv || []);
                setRefundReceipts(ledgerResponse.data.data.refund_receipts || []);
                setAdvanceTransfers(ledgerResponse.data.data.advance_transfers || []);
                setLedgerSentTransfers(ledgerResponse.data.data.ledger_sent_transfers || []);
                setLoading(false);

            } catch (error) {
                setError("Failed to fetch ledger data.");
                setLoading(false);
            }
        };

        if (id) fetchLedgerData();
    }, [id]);


    const handleFilter = () => {
        setFilteredOrders(orders);
    };

    const ledgerRows = React.useMemo(() => {
        let rows = [];

        // ===== ORDERS =====
        filteredOrders.forEach((order, orderIndex) => {
            if (order.status !== "Invoice Rejected" && order.status !== "Invoice Created") {
                rows.push({
                    key: `O-${order.id}`,
                    date: order.order_date,
                    invoice: `${order.invoice}/${order.company}`,
                    particular: "Goods Sale",
                    particularColor: "red",
                    debit: Number(order.total_amount || 0),
                    credit: null,
                });
            }

            (order.recived_payment || []).forEach((receipt, idx) => {
                rows.push({
                    key: `OP-${receipt.id}`,
                    date: receipt.received_at,
                    invoice: receipt.bank,
                    particular: "Payment received",
                    particularColor: "green",
                    debit: null,
                    credit: Number(receipt.amount || 0),
                });
            });
        });

        // ===== TRANSFERS SENT =====
        ledgerSentTransfers.forEach((t) => {
            rows.push({
                key: `AST-${t.id}`,
                date: t.date,
                invoice: "-",
                particular: `Advance Transfer Sent to ${t.send_to_name}`,
                particularColor: "#0d6efd",
                debit: Number(t.amount || 0),
                credit: null,
            });
        });

        // ===== ADVANCE RECEIPTS =====
        advanceReceipts.forEach((advance) => {
            rows.push({
                key: `A-${advance.id}`,
                date: advance.received_at,
                invoice: bankIdToName[advance.bank] || advance.bank,
                particular: "Advance Receipt",
                particularColor: "blue",
                debit: null,
                credit: Number(advance.amount || 0),
            });
        });

        // ===== PAYMENT RECEIPTS =====
        paymentReceipts.forEach((receipt) => {
            rows.push({
                key: `P-${receipt.id}`,
                date: receipt.received_at,
                invoice: receipt.bank,
                particular: "Payment Receipt",
                particularColor: "#6f42c1",
                debit: null,
                credit: Number(receipt.amount || 0),
            });
        });

        // ===== REFUNDS =====
        refundReceipts.forEach((refund) => {
            rows.push({
                key: `R-${refund.id}`,
                date: refund.date,
                invoice: refund.invoice_no,
                particular: `Refund Issued (${refund.refund_no})`,
                particularColor: "#dc3545",
                debit: Number(refund.amount || 0),
                credit: null,
            });
        });

        // ===== ADVANCE TRANSFERS RECEIVED =====
        advanceTransfers.forEach((t) => {
            rows.push({
                key: `AT-${t.id}`,
                date: t.date,
                invoice: "-",
                particular: `Advance Transfer Received from ${t.send_from_name}`,
                particularColor: "#198754",
                debit: null,
                credit: Number(t.amount || 0),
            });
        });

        // ===== GRV =====
        grvList
            .filter(g => g.status?.toLowerCase() === "approved")
            .forEach((g) => {
                const qty = Number(g.quantity || 0);
                const price = Number(g.price || 0);

                let amount = qty * price;
                let label = "GRV";
                let color = "#fd7e14";

                if (g.remark === "return") label = "Sales Return";
                else if (g.remark === "refund") label = "Refund Issued";
                else if (g.remark === "cod_return") {
                    amount = Number(g.cod_amount || amount);
                    label = "COD Return";
                    color = "#dc3545";
                }

                rows.push({
                    key: `G-${g.id}`,
                    date: g.date,
                    invoice: g.invoice,
                    particular: `${label} (${g.product})`,
                    particularColor: color,
                    debit: null,
                    credit: amount,
                });
            });

        // ===========================
        // 🔥 APPLY FILTER HERE
        // ===========================
        rows = rows.filter(row => {
            const rowDate = new Date(row.date?.split("T")[0]);

            const isWithinDateRange =
                (!startDate || rowDate >= new Date(startDate)) &&
                (!endDate || rowDate <= new Date(endDate));

            const matchesCompany =
                !companyFilter ||
                (row.invoice && row.invoice.toString().includes(companyFilter));

            return isWithinDateRange && matchesCompany;
        });

        // SORT
        return rows.sort((a, b) => new Date(a.date) - new Date(b.date));

    }, [
        filteredOrders,
        advanceReceipts,
        paymentReceipts,
        refundReceipts,
        grvList,
        advanceTransfers,
        ledgerSentTransfers,
        bankIdToName,
        startDate,
        endDate,
        companyFilter
    ]);

    const blackBorder = {
        top: { style: "thin", color: { rgb: "FF000000" } },
        bottom: { style: "thin", color: { rgb: "FF000000" } },
        left: { style: "thin", color: { rgb: "FF000000" } },
        right: { style: "thin", color: { rgb: "FF000000" } },
    };

    const excelColorMap = (color) => {
        switch (color) {
            case "red": // Goods Sale
                return { rgb: "FFF8D7DA" };

            case "green": // Payment received
                return { rgb: "FFD4EDDA" };

            case "blue": // Advance Receipt (Turquoise)
                return { rgb: "FFD1ECF1" };

            case "#6f42c1": // Payment Receipt (Blue)
                return { rgb: "FFD6E4FF" };

            case "#fd7e14": // Sales / COD Return
                return { rgb: "FFFFE5D0" };

            case "#dc3545": // Refund Issued
                return { rgb: "FFFFF3CD" };

            case "#0d6efd": // Transfer sent
                return { rgb: "FFE7F1FF" };

            case "#198754": // Transfer received
                return { rgb: "FFE6F4EA" };

            default:
                return { rgb: "FFFFFFFF" };
        }
    };

    const exportToExcel = () => {
        const workbook = XLSX.utils.book_new();

        const worksheet = XLSX.utils.aoa_to_sheet([
            ["#", "DATE", "INVOICE", "PARTICULAR", "DEBIT (₹)", "CREDIT (₹)"],
        ]);

        const blackBorder = {
            top: { style: "thin", color: { rgb: "FF000000" } },
            bottom: { style: "thin", color: { rgb: "FF000000" } },
            left: { style: "thin", color: { rgb: "FF000000" } },
            right: { style: "thin", color: { rgb: "FF000000" } },
        };

        // HEADER STYLE
        ["A1", "B1", "C1", "D1", "E1", "F1"].forEach((cell) => {
            worksheet[cell].s = {
                font: { bold: true, color: { rgb: "FFFFFFFF" } },
                fill: { fgColor: { rgb: "FF343A40" } },
                alignment: { horizontal: "center", vertical: "center" },
                border: blackBorder,
            };
        });

        let rowIndex = 2;

        ledgerRows.forEach((row, i) => {
            const excelRow = [
                i + 1,
                row.date,
                row.invoice,
                row.particular,
                row.debit !== null ? row.debit.toFixed(2) : "-",
                row.credit !== null ? row.credit.toFixed(2) : "-",
            ];

            XLSX.utils.sheet_add_aoa(worksheet, [excelRow], {
                origin: `A${rowIndex}`,
            });

            // FULL ROW COLOR + BORDER
            ["A", "B", "C", "D", "E", "F"].forEach((col) => {
                const cell = `${col}${rowIndex}`;
                if (worksheet[cell]) {
                    worksheet[cell].s = {
                        fill: { fgColor: excelColorMap(row.particularColor) },
                        font: { bold: col === "D" },
                        border: blackBorder,
                    };
                }
            });

            rowIndex++;
        });

        const customerName =
            filteredOrders[0]?.customer_name || "Customer";

        // GRAND TOTAL
        XLSX.utils.sheet_add_aoa(
            worksheet,
            [["", "", "", "Grand Total", totalDebit.toFixed(2), totalCredit.toFixed(2)]],
            { origin: `A${rowIndex}` }
        );

        ["A", "B", "C", "D", "E", "F"].forEach((col) => {
            const cell = `${col}${rowIndex}`;
            worksheet[cell].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: "FFE9ECEF" } },
                border: blackBorder,
            };
        });

        rowIndex++;

        // CLOSING BALANCE
        XLSX.utils.sheet_add_aoa(
            worksheet,
            [[
                "",
                "",
                "",
                "Closing Balance",
                closingBalance > 0 ? closingBalance.toFixed(2) : "",
                closingBalance < 0 ? Math.abs(closingBalance).toFixed(2) : "",
            ]],
            { origin: `A${rowIndex}` }
        );

        ["A", "B", "C", "D", "E", "F"].forEach((col) => {
            const cell = `${col}${rowIndex}`;
            worksheet[cell].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: "FFD6D8DB" } },
                border: blackBorder,
            };
        });

        // COLUMN WIDTHS
        worksheet["!cols"] = [
            { wch: 5 },
            { wch: 14 },
            { wch: 28 },
            { wch: 30 },
            { wch: 14 },
            { wch: 14 },
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");
        XLSX.writeFile(workbook, `${customerName}_Ledger.xlsx`);
    };

    const convertToPDF = () => {
        const pdf = new jsPDF("p", "mm", "a4");

        // Company + customer header (same as you had, with safe fallbacks)
        const companyName =
            (filteredOrders[0]?.company || name || "Company").toUpperCase();

        const customerName = filteredOrders[0]?.customer_name || "Customer";

        const selectedCompany = companys.find(
            (c) => c.name?.toUpperCase() === filteredOrders[0]?.company?.toUpperCase()
        );

        const companyAddress = selectedCompany
            ? `${selectedCompany.address || ""}${selectedCompany.city ? ", " + selectedCompany.city : ""}${selectedCompany.country ? ", " + selectedCompany.country : ""}${selectedCompany.zip ? " - " + selectedCompany.zip : ""}`
            : "Address not available";

        const pdfWidth = pdf.internal.pageSize.getWidth();

        const drawHeader = () => {

            // === COMPANY NAME ===
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(16);
            const companyTextWidth = pdf.getTextDimensions(companyName).w;
            pdf.text(companyName, (pdfWidth - companyTextWidth) / 2, 20);

            // === COMPANY ADDRESS ===
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(12);
            const addressTextWidth = pdf.getTextDimensions(companyAddress).w;
            pdf.text(companyAddress, (pdfWidth - addressTextWidth) / 2, 27);

            // === CUSTOMER NAME ===
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(13);
            const customerLabel = `Customer Name: ${customerName}`;
            const customerTextWidth = pdf.getTextDimensions(customerLabel).w;
            pdf.text(customerLabel, (pdfWidth - customerTextWidth) / 2, 34);

            // divider
            pdf.setLineWidth(0.5);
            pdf.line(10, 38, pdfWidth - 10, 38);
        };

        drawHeader();

        // Build flat rows (keep “PARTICULAR” colors same as UI)
        // Bootstrap-ish RGBs: red(220,53,69), green(40,167,69), blue(0,123,255)
        const colorRed = [220, 53, 69];
        const colorGreen = [40, 167, 69];
        const colorBlue = [0, 123, 255];

        const rows = [];

        filteredOrders.forEach((order, orderIndex) => {
            const showInvoice =
                order.status !== "Invoice Rejected" && order.status !== "Invoice Created";

            if (showInvoice) {
                rows.push({
                    index: `${orderIndex + 1}`,
                    date: order.order_date,
                    invoice: `${order.invoice}/${order.company}`,
                    particular: "Goods Sale",
                    debit: Number(order.total_amount || 0).toFixed(2),
                    credit: "-",
                    _particularColor: colorRed,
                    _bold: false,
                });
            }

            (order.recived_payment || []).forEach((receipt, idx) => {
                rows.push({
                    index: `${orderIndex + 1}.${idx + 1}`,
                    date: receipt.received_at,
                    invoice: receipt.bank, // (already mapping bank name in table view; optional to map here too)
                    particular: "Payment received",
                    debit: "-",
                    credit: Number(receipt.amount || 0).toFixed(2),
                    _particularColor: colorGreen,
                    _bold: false,
                });
            });
        });

        (advanceReceipts || []).forEach((advance, idx) => {
            rows.push({
                index: `A${idx + 1}`,
                date: advance.received_at,
                invoice: bankIdToName[advance.bank] || advance.bank,
                particular: "Advance Receipt",
                debit: "-",
                credit: Number(advance.amount || 0).toFixed(2),
                _particularColor: colorBlue,
                _bold: false,
            });
        });

        (paymentReceipts || []).forEach((receipt, idx) => {
            rows.push({
                index: `P${idx + 1}`,
                date: receipt.received_at,
                invoice: receipt.bank,
                particular: "Payment Receipt",
                debit: "-",
                credit: Number(receipt.amount || 0).toFixed(2),
                _particularColor: [111, 66, 193], // purple
                _bold: false,
            });
        });

        (advanceTransfers || []).forEach((t) => {
            rows.push({
                date: t.date,
                invoice: "-",
                particular: `Advance Transfer Received from ${t.send_from_name}`,
                debit: "-",
                credit: Number(t.amount || 0).toFixed(2),
                _particularColor: [25, 135, 84], // green
                _bold: false,
            });
        });

        (grvList || []).forEach((g, idx) => {
            const qty = Number(g.quantity || 0);
            const price = Number(g.price || 0);

            const amount =
                g.remark === "cod_return"
                    ? Number(g.cod_amount || 0)
                    : (qty * price);


            rows.push({
                // index: `G${idx + 1}`,
                date: g.date,
                invoice: g.invoice,
                particular:
                    g.remark === "cod_return"
                        ? "COD Return"
                        : g.remark === "refund"
                            ? "Refund Issued"
                            : "Sales Return",
                debit: "-",
                credit: Number(amount || 0).toFixed(2),
                _particularColor:
                    g.remark === "cod_return" ? [220, 53, 69] : [253, 126, 20],
                _bold: false,
            });
        });

        (refundReceipts || []).forEach((refund, idx) => {
            rows.push({
                index: `R${idx + 1}`,
                date: refund.date,
                invoice: refund.invoice_no,
                particular: `Refund Issued (${refund.refund_no})`,
                debit: Number(refund.amount || 0).toFixed(2),
                credit: "-",
                _particularColor: [220, 53, 69], // red
                _bold: false,
            });
        });

        //date-wise sort
        rows.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Append Grand Total & Closing Balance rows (bold)
        rows.push(
            {
                index: "",
                date: "",
                invoice: "",
                particular: "Grand Total",
                debit: totalDebit.toFixed(2),
                credit: totalCredit.toFixed(2),
                _particularColor: [0, 0, 0],
                _bold: true,
            },
            {
                index: "",
                date: "",
                invoice: "",
                particular: "Closing Balance",
                debit: closingBalance > 0 ? closingBalance.toFixed(2) : "",
                credit: closingBalance < 0 ? Math.abs(closingBalance).toFixed(2) : "",
                _particularColor: [0, 0, 0],
                _bold: true,
            }
        );

        autoTable(pdf, {
            head: [["#", "DATE", "INVOICE", "PARTICULAR", "DEBIT", "CREDIT"]],
            body: rows.map((r, i) => [
                i + 1,
                r.date,
                r.invoice,
                r.particular,
                r.debit,
                r.credit,
            ]),
            startY: 42,
            theme: "grid",
            styles: {
                font: "helvetica",
                fontSize: 10,
                cellPadding: 3,
                lineColor: [200, 200, 200],
                lineWidth: 0.2,
                valign: "middle",
            },
            headStyles: {
                fillColor: [240, 240, 240],
                textColor: [0, 0, 0],
                fontStyle: "bold",
            },
            alternateRowStyles: {
                fillColor: [249, 249, 249],
            },
            columnStyles: {
                0: { cellWidth: 14, halign: "center" },
                1: { cellWidth: 28 },
                2: { cellWidth: 60 },
                3: { cellWidth: 38, fontStyle: "bold" },
                4: { cellWidth: 25, halign: "right" },
                5: { cellWidth: 25, halign: "right" },
            },
            margin: { top: 10, right: 10, bottom: 14, left: 10 },

            // Header only on first page
            didDrawPage: (data) => {
                if (data.pageNumber === 1) {
                    drawHeader();
                }
            },

            didParseCell: (data) => {
                if (data.section === "body") {
                    const raw = rows[data.row.index];
                    if (raw?._bold) {
                        data.cell.styles.fontStyle = "bold";
                    }
                    if (data.column.index === 3 && raw?._particularColor) {
                        data.cell.styles.textColor = raw._particularColor;
                    }
                }
            },
        });

        pdf.save(`${customerName}_Ledger.pdf`);
    };

    const approvedGrvList = grvList.filter(
        g => g.status?.toLowerCase() === "approved"
    );

    const totalDebit =
        filteredOrders.reduce((total, order) => {
            if (order.status !== "Invoice Rejected" && order.status !== "Invoice Created") {
                return total + order.total_amount;
            }
            return total;
        }, 0)
        +
        refundReceipts.reduce(
            (sum, refund) => sum + parseFloat(refund.amount || 0),
            0
        )
        +
        ledgerSentTransfers.reduce(
            (sum, t) => sum + parseFloat(t.amount || 0),
            0
        );

    const totalCredit =
        filteredOrders.reduce((total, order) => {
            const receivedPayments = Array.isArray(order.recived_payment)
                ? order.recived_payment
                : [];

            return total + receivedPayments.reduce(
                (sum, receipt) => sum + parseFloat(receipt.amount || 0),
                0
            );
        }, 0)
        +
        advanceReceipts.reduce(
            (sum, receipt) => sum + parseFloat(receipt.amount || 0),
            0
        )
        +
        paymentReceipts.reduce(
            (sum, receipt) => sum + parseFloat(receipt.amount || 0),
            0
        )
        +
        approvedGrvList.reduce((sum, g) => {
            if (g.remark === "cod_return") {
                return sum + parseFloat(g.cod_amount || 0);
            }

            const qty = Number(g.quantity || 0);
            const price = Number(g.price || 0);

            return sum + (qty * price);
        }, 0)
        +
        advanceTransfers.reduce(
            (sum, t) => sum + parseFloat(t.amount || 0),
            0
        );

    const closingBalance = totalDebit - totalCredit;

    const closingBalanceDebit = closingBalance > 0 ? closingBalance : 0;
    const closingBalanceCredit = closingBalance < 0 ? Math.abs(closingBalance) : 0;

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="Customer Ledger" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4 text-uppercase">
                                        {filteredOrders[0]?.customer_name
                                            ? `${filteredOrders[0].customer_name} - Ledger`
                                            : "Customer Ledger"}
                                    </CardTitle>
                                    <CardSubtitle className="card-title-desc mb-4">
                                        Detailed view of debits and credits for the customer ledger.
                                    </CardSubtitle>

                                    {/* Filter Section */}
                                    <div className="mb-4">
                                        <Row>
                                            <Col md={3}>
                                                <Label for="startDate">Start Date</Label>
                                                <Input
                                                    type="date"
                                                    id="startDate"
                                                    value={startDate}
                                                    onChange={e => setStartDate(e.target.value)}
                                                />
                                            </Col>
                                            <Col md={3}>
                                                <Label for="endDate">End Date</Label>
                                                <Input
                                                    type="date"
                                                    id="endDate"
                                                    value={endDate}
                                                    onChange={e => setEndDate(e.target.value)}
                                                />
                                            </Col>
                                            <Col md={3}>
                                                <Label for="company">Company</Label>
                                                <Input
                                                    type="select"
                                                    id="company"
                                                    value={companyFilter}
                                                    onChange={e => setCompanyFilter(e.target.value)}
                                                >
                                                    <option value="">All Companies</option>
                                                    {companys.map((company, index) => (
                                                        <option key={index} value={company.name}>
                                                            {company.name}
                                                        </option>
                                                    ))}
                                                </Input>
                                            </Col>
                                            <Col md={3} className="d-flex align-items-end">
                                                <Button color="primary" onClick={handleFilter}>
                                                    Apply Filters
                                                </Button>
                                            </Col>
                                        </Row>
                                    </div>

                                    {/* Table Section */}
                                    <div className="table-responsive" ref={tableRef}>
                                        <Table className="table table-bordered mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>#</th>
                                                    <th>DATE</th>
                                                    <th>INVOICE</th>
                                                    <th>PARTICULAR</th>
                                                    <th>DEBIT (₹)</th>
                                                    <th>CREDIT (₹)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ledgerRows.map((row, idx) => (
                                                    <tr key={row.key}>
                                                        <th scope="row">{idx + 1}</th>
                                                        <td>{row.date}</td>
                                                        <td>{row.invoice}</td>
                                                        <td style={{ color: row.particularColor, fontWeight: 500 }}>
                                                            {row.particular}
                                                        </td>
                                                        <td>{row.debit !== null ? row.debit.toFixed(2) : "-"}</td>
                                                        <td>{row.credit !== null ? row.credit.toFixed(2) : "-"}</td>
                                                    </tr>
                                                ))}

                                                {/* Grand Total */}
                                                <tr>
                                                    <td colSpan="4" style={{ fontWeight: "bold", textAlign: "right" }}>
                                                        Grand Total
                                                    </td>
                                                    <td style={{ fontWeight: "bold" }}>{totalDebit.toFixed(2)}</td>
                                                    <td style={{ fontWeight: "bold" }}>{totalCredit.toFixed(2)}</td>
                                                </tr>

                                                {/* Closing Balance */}
                                                <tr>
                                                    <td colSpan="4" style={{ fontWeight: "bold", textAlign: "right" }}>
                                                        Closing Balance
                                                    </td>
                                                    <td style={{ fontWeight: "bold" }}>
                                                        {closingBalanceDebit ? closingBalanceDebit.toFixed(2) : ""}
                                                    </td>
                                                    <td style={{ fontWeight: "bold" }}>
                                                        {closingBalanceCredit ? closingBalanceCredit.toFixed(2) : ""}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </div>
                                    <div className="d-flex justify-content-end mt-3">
                                        <Button color="success" style={{ marginRight: "10px" }} onClick={exportToExcel}>
                                            Export to Excel
                                        </Button>
                                        <Button color="danger" onClick={convertToPDF}>
                                            Convert to PDF
                                        </Button>
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
