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
import * as XLSX from "xlsx";
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
                setOrders(ledgerResponse.data.data);
                setFilteredOrders(ledgerResponse.data.data.ledger || []);
                setAdvanceReceipts(ledgerResponse.data.data.advance_receipts);
                setPaymentReceipts(ledgerResponse.data.data.payment_receipts || []);
                setGrvList(ledgerResponse.data.data.grv || []);
                setRefundReceipts(ledgerResponse.data.data.refund_receipts || []);
                setLoading(false);

            } catch (error) {
                setError("Failed to fetch ledger data.");
                setLoading(false);
            }
        };

        if (id) fetchLedgerData();
    }, [id]);


    const handleFilter = () => {
        const filtered = orders.filter(order => {
            const orderDate = new Date(order.order_date);
            const isWithinDateRange = (!startDate || orderDate >= new Date(startDate)) && (!endDate || orderDate <= new Date(endDate));
            const matchesCompany = !companyFilter || order.company === companyFilter;
            return isWithinDateRange && matchesCompany;
        });
        setFilteredOrders(filtered);
    };

    const ledgerRows = React.useMemo(() => {
        let rows = [];

        // Orders (Goods Sale)
        filteredOrders.forEach((order, orderIndex) => {
            if (order.status !== "Invoice Rejected" && order.status !== "Invoice Created") {
                rows.push({
                    key: `O-${order.id}`,
                    index: orderIndex + 1,
                    date: order.order_date,
                    invoice: `${order.invoice}/${order.company}`,
                    particular: "Goods Sale",
                    particularColor: "red",
                    debit: order.total_amount,
                    credit: null,
                });
            }

            // Order-wise payments
            (order.recived_payment || []).forEach((receipt, idx) => {
                rows.push({
                    key: `OP-${receipt.id}`,
                    index: `${orderIndex + 1}.${idx + 1}`,
                    date: receipt.received_at,
                    invoice: receipt.bank,
                    particular: "Payment received",
                    particularColor: "green",
                    debit: null,
                    credit: Number(receipt.amount || 0),
                });
            });
        });

        // Advance receipts
        advanceReceipts.forEach((advance, idx) => {
            rows.push({
                key: `A-${advance.id}`,
                index: `A${idx + 1}`,
                date: advance.received_at,
                invoice: bankIdToName[advance.bank] || advance.bank,
                particular: "Advance Receipt",
                particularColor: "blue",
                debit: null,
                credit: Number(advance.amount || 0),
            });
        });

        // Payment receipts
        paymentReceipts.forEach((receipt, idx) => {
            rows.push({
                key: `P-${receipt.id}`,
                index: `P${idx + 1}`,
                date: receipt.received_at,
                invoice: receipt.bank,
                particular: "Payment Receipt",
                particularColor: "#6f42c1",
                debit: null,
                credit: Number(receipt.amount || 0),
            });
        });

        // Refund Receipts (DEBIT)
        refundReceipts.forEach((refund, idx) => {
            rows.push({
                key: `R-${refund.id}`,
                index: `R${idx + 1}`,
                date: refund.date,
                invoice: refund.invoice_no,
                particular: `Refund Issued (${refund.refund_no})`,
                particularColor: "#dc3545", // red
                debit: Number(refund.amount || 0),
                credit: null,
            });
        });

        // ---- GRV entries ----
        grvList.forEach((g, idx) => {
            let amount = 0;
            let label = "GRV";
            let color = "#fd7e14"; // orange

            if (g.remark === "return") {
                amount = parseFloat(g.price || 0);
                label = "Sales Return";
            } else if (g.remark === "refund") {
                amount = parseFloat(g.price || 0);
                label = "Refund Issued";
            } else if (g.remark === "cod_return") {
                amount = parseFloat(g.cod_amount || g.price || 0);
                label = "COD Return";
                color = "#dc3545"; // red
            }

            rows.push({
                key: `G-${g.id}`,
                index: `G${idx + 1}`,
                date: g.date,
                invoice: g.invoice,
                particular: `${label} (${g.product})`,
                particularColor: color,
                debit: null,
                credit: amount,
            });
        });

        // 🔹 SORT BY DATE (ascending)
        return rows.sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );
    }, [filteredOrders, advanceReceipts, paymentReceipts, refundReceipts, grvList, bankIdToName]);

    const exportToExcel = () => {
        // Prepare ledger and payment rows
        const data = filteredOrders.flatMap((order, orderIndex) => [
            {
                '#': orderIndex + 1,
                'DATE': order.order_date,
                'INVOICE': `${order.invoice}/${order.company}`,
                'PARTICULAR': 'Goods Sale',
                'DEBIT (₹)': order.total_amount.toFixed(2),
                'CREDIT (₹)': "-"
            },
            ...(order.recived_payment || []).map((receipt, index) => ({
                '#': `${orderIndex + 1}.${index + 1}`,
                'DATE': receipt.received_at,
                'INVOICE': receipt.bank, // You can map bank ID here if needed similarly
                'PARTICULAR': 'Payment received',
                'DEBIT (₹)': "-",
                'CREDIT (₹)': parseFloat(receipt.amount || 0).toFixed(2)
            }))
        ]);

        // Prepare advance receipts rows with bank name mapping
        const advanceData = advanceReceipts.map((advance, index) => ({
            '#': `A${index + 1}`,
            'DATE': advance.received_at,
            'INVOICE': bankIdToName[advance.bank] || advance.bank, // Map bank ID to name
            'PARTICULAR': 'Advance Receipt',
            'DEBIT (₹)': "-",
            'CREDIT (₹)': parseFloat(advance.amount || 0).toFixed(2)
        }));

        const paymentReceiptData = paymentReceipts.map((receipt, index) => ({
            '#': `P${index + 1}`,
            'DATE': receipt.received_at,
            'INVOICE': receipt.bank,
            'PARTICULAR': 'Payment Receipt',
            'DEBIT (₹)': "-",
            'CREDIT (₹)': parseFloat(receipt.amount || 0).toFixed(2)
        }));

        const refundData = refundReceipts.map((refund, index) => ({
            '#': `R${index + 1}`,
            'DATE': refund.date,
            'INVOICE': refund.invoice_no,
            'PARTICULAR': `Refund Issued (${refund.refund_no})`,
            'DEBIT (₹)': parseFloat(refund.amount || 0).toFixed(2),
            'CREDIT (₹)': "-"
        }));

        const grvData = grvList.map((g, index) => ({
            '#': `G${index + 1}`,
            'DATE': g.date,
            'INVOICE': g.invoice,
            'PARTICULAR':
                g.remark === "cod_return"
                    ? "COD Return"
                    : g.remark === "refund"
                        ? "Refund Issued"
                        : "Sales Return",
            'DEBIT (₹)': "-",
            'CREDIT (₹)':
                g.remark === "cod_return"
                    ? parseFloat(g.cod_amount || 0).toFixed(2)
                    : parseFloat(g.price || 0).toFixed(2),
        }));

        // Combine all data rows
        const allData = [
            ...data,
            ...advanceData,
            ...paymentReceiptData,
            ...refundData,
            ...grvData,
        ];

        // Append Grand Total and Closing Balance
        allData.push(
            {
                '#': '',
                'DATE': '',
                'INVOICE': '',
                'PARTICULAR': 'Grand Total',
                'DEBIT (₹)': totalDebit.toFixed(2),
                'CREDIT (₹)': totalCredit.toFixed(2),
            },
            {
                '#': '',
                'DATE': '',
                'INVOICE': '',
                'PARTICULAR': 'Closing Balance',
                'DEBIT (₹)': closingBalance > 0 ? closingBalance.toFixed(2) : '',
                'CREDIT (₹)': closingBalance < 0 ? Math.abs(closingBalance).toFixed(2) : '',
            }
        );

        // Generate worksheet and workbook
        const worksheet = XLSX.utils.json_to_sheet(allData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");

        // Save file
        XLSX.writeFile(workbook, `${name}_Ledger.xlsx`);
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

        (grvList || []).forEach((g, idx) => {
            const amount =
                g.remark === "cod_return"
                    ? g.cod_amount
                    : g.price;

            rows.push({
                index: `G${idx + 1}`,
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

        // Helper: chunk rows into pages of exactly 30
        const chunkArray = (arr, size) =>
            Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
                arr.slice(i * size, i * size + size)
            );

        const chunks = chunkArray(rows, 30);

        const head = [["#", "DATE", "INVOICE", "PARTICULAR", "DEBIT", "CREDIT"]];

        // Draw each chunk on its own page; add header each time
        chunks.forEach((chunk, pageIndex) => {
            if (pageIndex > 0) {
                pdf.addPage();
                drawHeader();
            }

            autoTable(pdf, {
                head,
                body: chunk.map((r) => [
                    r.index,
                    r.date,
                    r.invoice,
                    r.particular,
                    r.debit,
                    r.credit,
                ]),
                // startY: 42,
                startY: pageIndex === 0 ? 42 : 40,
                theme: "grid",
                styles: {
                    font: "helvetica",
                    fontSize: 10,
                    lineColor: [200, 200, 200],
                    lineWidth: 0.2,
                    cellPadding: 3,
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
                // Preserve colors in PARTICULAR column + bold total rows
                didParseCell: (data) => {
                    const { section, column, row } = data;
                    if (section === "body") {
                        const raw = chunks[pageIndex][row.index];
                        // Bold rows for totals
                        if (raw?._bold) {
                            data.cell.styles.fontStyle = "bold";
                        }
                        // Coloring the "PARTICULAR" column only
                        if (column.index === 3 && Array.isArray(raw?._particularColor)) {
                            data.cell.styles.textColor = raw._particularColor;
                        }
                    }
                },
                margin: { top: 6, right: 10, bottom: 14, left: 10 },
            });
        });

        pdf.save(`${customerName}_Ledger.pdf`);
    };

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
        grvList.reduce((sum, g) => {
            if (g.remark === "cod_return") {
                return sum + parseFloat(g.cod_amount || 0);
            }
            return sum + parseFloat(g.price || 0);
        }, 0);

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
