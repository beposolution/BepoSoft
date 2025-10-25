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
import * as XLSX from "xlsx"; // For Excel export
import jsPDF from "jspdf"; // For PDF export
import html2canvas from "html2canvas"; // For capturing the table as an image
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BasicTable = () => {
    const { id } = useParams();
    const [orders, setOrders] = useState([]);
    // console.log("orders", orders)
    const [filteredOrders, setFilteredOrders] = useState([]);
    // console.log("filtered order", filteredOrders)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const name = localStorage.getItem('name');
    document.title = `Ledger | Beposoft`;
    const [advanceReceipts, setAdvanceReceipts] = useState([])
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [companyFilter, setCompanyFilter] = useState("");
    const [companys, setCompany] = useState([]);
    // console.log("company", companys)
    const [banks, setBanks] = useState([]);

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
            ...order.recived_payment.map((receipt, index) => ({
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

        // Combine all data rows
        const allData = [...data, ...advanceData];

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

    const convertToPDF = async () => {
        const input = tableRef.current;
        const pdf = new jsPDF("p", "mm", "a4");

        // Get company name and customer name
        const companyName =
            filteredOrders.length > 0
                ? filteredOrders[0].company.toUpperCase()
                : name.toUpperCase();

        const customerName = filteredOrders[0]?.customer_name || "Customer";

        // Find full company details from the 'companys' array
        const selectedCompany = companys.find(
            (c) => c.name.toUpperCase() === filteredOrders[0]?.company?.toUpperCase()
        );

        // Construct company address string
        const companyAddress = selectedCompany
            ? `${selectedCompany.address || ""}, ${selectedCompany.city || ""}, ${selectedCompany.country || ""} - ${selectedCompany.zip || ""}`
            : "Address not available";

        // Set up document width
        const pdfWidth = pdf.internal.pageSize.getWidth();

        // === COMPANY NAME ===
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        const companyTextWidth = pdf.getTextDimensions(companyName).w;
        const companyX = (pdfWidth - companyTextWidth) / 2;
        pdf.text(companyName, companyX, 20);

        // === COMPANY ADDRESS ===
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(12);
        const addressTextWidth = pdf.getTextDimensions(companyAddress).w;
        const addressX = (pdfWidth - addressTextWidth) / 2;
        pdf.text(companyAddress, addressX, 27);

        // === CUSTOMER NAME ===
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(13);
        const customerLabel = `Customer Name: ${customerName}`;
        const customerTextWidth = pdf.getTextDimensions(customerLabel).w;
        const customerX = (pdfWidth - customerTextWidth) / 2;
        pdf.text(customerLabel, customerX, 34);

        // === ──────────────── Divider Line ===
        pdf.setLineWidth(0.5);
        pdf.line(10, 38, pdfWidth - 10, 38);

        // === Capture the table content as image ===
        const canvas = await html2canvas(input, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");

        // === Add image to PDF ===
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 10, 42, imgWidth, imgHeight); // placed below header block

        // === Save PDF with customer name ===
        pdf.save(`${customerName}_Ledger.pdf`);
    };


    const totalDebit = filteredOrders.reduce((total, order) => {
        if (order.status !== "Invoice Rejected" && order.status !== "Invoice Created") {
            return total + order.total_amount;
        }
        return total;
    }, 0);

    const totalCredit = filteredOrders.reduce((total, order) => {
        const recivedSum = order.recived_payment.reduce(
            (sum, receipt) => sum + parseFloat(receipt.amount || 0),
            0
        );
        return total + recivedSum;
    }, 0) + advanceReceipts.reduce(
        (sum, receipt) => sum + parseFloat(receipt.amount || 0),
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
                                                {filteredOrders.map((order, orderIndex) => (
                                                    <React.Fragment key={order.id}>
                                                        {/* Order row */}
                                                        {order.status !== "Invoice Rejected" && order.status !== "Invoice Created" && (
                                                            <tr>
                                                                <th scope="row">{orderIndex + 1}</th>
                                                                <td>{order.order_date}</td>
                                                                <td>
                                                                    <a href={`/order/${order.id}/items/`} target="_blank" rel="noopener noreferrer">
                                                                        {order.invoice}/{order.company}
                                                                    </a>
                                                                </td>
                                                                <td style={{ color: "red" }}>Goods Sale</td>
                                                                <td>{order.total_amount.toFixed(2)}</td>
                                                                <td>-</td>
                                                            </tr>
                                                        )}

                                                        {/* recived_payment rows */}
                                                        {order.recived_payment.map((receipt, index) => (
                                                            <tr key={receipt.id}>
                                                                <th scope="row">{`${orderIndex + 1}.${index + 1}`}</th>
                                                                <td>{receipt.received_at}</td>
                                                                <td>{receipt.bank}</td>
                                                                <td style={{ color: "green" }}>Payment received</td>
                                                                <td>-</td>
                                                                <td>{parseFloat(receipt.amount || 0).toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                                {advanceReceipts.map((advance, index) => (
                                                    <tr key={`advance-${advance.id}`}>
                                                        <th scope="row">{`A${index + 1}`}</th>
                                                        <td>{advance.received_at}</td>
                                                        <td>{bankIdToName[advance.bank] || advance.bank}</td>
                                                        <td style={{ color: "blue" }}>Advance Receipt</td>
                                                        <td>-</td>
                                                        <td>{parseFloat(advance.amount || 0).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                                <tr>
                                                    <td colSpan="3" className="text-right" style={{ fontWeight: 'bold' }}>
                                                        Grand Total
                                                    </td>
                                                    <td></td>
                                                    <td style={{ fontWeight: 'bold' }}>{totalDebit.toFixed(2)}</td>
                                                    <td style={{ fontWeight: 'bold' }}>{totalCredit.toFixed(2)}</td>
                                                </tr>
                                                <tr>
                                                    <td colSpan="4" className="text-right" style={{ fontWeight: 'bold' }}>
                                                        Closing Balance
                                                    </td>
                                                    <td style={{ fontWeight: 'bold' }}>
                                                        {closingBalanceDebit ? closingBalanceDebit.toFixed(2) : ''}
                                                    </td>
                                                    <td style={{ fontWeight: 'bold' }}>
                                                        {closingBalanceCredit ? closingBalanceCredit.toFixed(2) : ''}
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
