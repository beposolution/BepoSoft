import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Badge,
    Button,
    Card,
    CardBody,
    Col,
    Input,
    Row,
    Spinner,
    Table,
} from "reactstrap";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx-js-style";

const GrvFamilyPaymentSummaryReport = () => {
    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    document.title = "Sales Return Summary | Beposoft";

    const today = useMemo(() => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }, []);

    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [report, setReport] = useState(null);
    const [filters, setFilters] = useState({
        start_date: today,
        end_date: today,
    });

    const asNumber = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const formatNumber = (value) =>
        asNumber(value).toLocaleString("en-IN", {
            maximumFractionDigits: 0,
        });

    const formatAmount = (value) =>
        `₹${asNumber(value).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const formatDisplayDate = (value) => {
        if (!value) return "-";

        const [year, month, day] = value.split("-").map(Number);
        const date = new Date(year, month - 1, day);

        if (Number.isNaN(date.getTime())) return value;

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const validateFilters = useCallback(() => {
        if (!filters.start_date || !filters.end_date) {
            toast.warning("Please select both start date and end date.");
            return false;
        }

        if (filters.start_date > filters.end_date) {
            toast.warning("Start date cannot be after end date.");
            return false;
        }

        return true;
    }, [filters.end_date, filters.start_date]);

    const fetchReport = useCallback(
        async ({ showSuccessToast = false } = {}) => {
            if (!token) {
                toast.error("Authentication token is missing.");
                return;
            }

            if (!validateFilters()) return;

            setLoading(true);

            try {
                const response = await axios.get(
                    `${baseUrl}grv/family/payment/summary/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        params: {
                            start_date: filters.start_date,
                            end_date: filters.end_date,
                        },
                    }
                );

                setReport(response?.data || {});

                if (showSuccessToast) {
                    toast.success("Sales return summary loaded successfully.");
                }
            } catch (error) {
                console.error(
                    "GRV family payment summary error:",
                    error?.response?.data || error?.message
                );

                setReport(null);
                toast.error(
                    error?.response?.data?.message ||
                    error?.response?.data?.detail ||
                    "Failed to fetch sales return summary."
                );
            } finally {
                setLoading(false);
            }
        },
        [baseUrl, filters.end_date, filters.start_date, token, validateFilters]
    );

    useEffect(() => {
        fetchReport();
        // Initial page load only. Date changes are applied using Generate Report.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilterChange = (key, value) => {
        setFilters((previous) => ({
            ...previous,
            [key]: value,
        }));
    };

    const clearFilters = () => {
        setFilters({
            start_date: today,
            end_date: today,
        });
        setReport(null);
    };

    const families = Array.isArray(report?.families) ? report.families : [];
    const grandTotal = report?.grand_total || {};
    const paidTotal = grandTotal?.paid || {};
    const codTotal = grandTotal?.COD || {};
    const overallTotal = grandTotal?.total || {};

    const summaryCards = [
        {
            title: "COD Sales Returns",
            value: codTotal?.grv_count,
            description: "COD return entries",
            background: "#eff6ff",
            border: "#2563eb",
            valueColor: "#1d4ed8",
        },
        {
            title: "Cash Sales Returns",
            value: paidTotal?.grv_count,
            description: "Paid or cash return entries",
            background: "#f5f3ff",
            border: "#7c3aed",
            valueColor: "#7c3aed",
        },
        {
            title: "Total Sales Returns",
            value: overallTotal?.grv_count,
            description: "Combined GRV count",
            background: "#ecfdf5",
            border: "#16a34a",
            valueColor: "#15803d",
        },
        {
            title: "Total Invoices",
            value: overallTotal?.order_count,
            description: "Invoices linked to returns",
            background: "#fff7ed",
            border: "#f97316",
            valueColor: "#c2410c",
        },
    ];

    const applyWorksheetStyles = (worksheet, totalRows, totalColumns) => {
        const border = {
            top: { style: "thin", color: { rgb: "CBD5E1" } },
            bottom: { style: "thin", color: { rgb: "CBD5E1" } },
            left: { style: "thin", color: { rgb: "CBD5E1" } },
            right: { style: "thin", color: { rgb: "CBD5E1" } },
        };

        for (let row = 0; row < totalRows; row += 1) {
            for (let col = 0; col < totalColumns; col += 1) {
                const reference = XLSX.utils.encode_cell({ r: row, c: col });

                if (!worksheet[reference]) continue;

                worksheet[reference].s = {
                    font: {
                        name: "Calibri",
                        size: 11,
                        bold: row === 0 || row === 2 || row === totalRows - 1,
                        color: {
                            rgb: row === 0 || row === 2 ? "FFFFFF" : "0F172A",
                        },
                    },
                    fill:
                        row === 0
                            ? { fgColor: { rgb: "1565C0" } }
                            : row === 2
                                ? { fgColor: { rgb: "0F172A" } }
                                : row === totalRows - 1
                                    ? { fgColor: { rgb: "DCEBFF" } }
                                    : undefined,
                    alignment: {
                        horizontal: col === 0 ? "left" : "center",
                        vertical: "center",
                        wrapText: true,
                    },
                    border,
                };
            }
        }

        worksheet["!merges"] = [
            {
                s: { r: 0, c: 0 },
                e: { r: 0, c: totalColumns - 1 },
            },
            {
                s: { r: 1, c: 0 },
                e: { r: 1, c: totalColumns - 1 },
            },
        ];

        for (let col = 0; col < totalColumns; col += 1) {
            const titleRef = XLSX.utils.encode_cell({ r: 0, c: col });
            if (!worksheet[titleRef]) worksheet[titleRef] = { t: "s", v: "" };
            worksheet[titleRef].s = {
                font: {
                    name: "Calibri",
                    size: 16,
                    bold: true,
                    color: { rgb: "FFFFFF" },
                },
                fill: { fgColor: { rgb: "1565C0" } },
                alignment: { horizontal: "center", vertical: "center" },
                border,
            };

            const periodRef = XLSX.utils.encode_cell({ r: 1, c: col });
            if (!worksheet[periodRef]) worksheet[periodRef] = { t: "s", v: "" };
            worksheet[periodRef].s = {
                font: {
                    name: "Calibri",
                    size: 11,
                    bold: true,
                    color: { rgb: "111827" },
                },
                fill: { fgColor: { rgb: "EAF3FF" } },
                alignment: { horizontal: "center", vertical: "center" },
                border,
            };
        }
    };

    const exportToExcel = async () => {
        if (!families.length) {
            toast.warning("No report data available to export.");
            return;
        }

        setExporting(true);

        try {
            const rows = [
                ["SALES RETURN SUMMARY"],
                [
                    `Period: ${filters.start_date} to ${filters.end_date}`,
                ],
                [
                    "Division",
                    "COD SR",
                    "Cash SR",
                    "COD Amount",
                    "Cash Amount",
                    "Total SR",
                    "Total Invoice",
                    "Total Amount",
                ],
            ];

            families.forEach((item) => {
                const paid = item?.paid || {};
                const cod = item?.COD || {};
                const total = item?.total || {};

                rows.push([
                    String(item?.family_name || "").toUpperCase(),
                    asNumber(cod?.grv_count),
                    asNumber(paid?.grv_count),
                    asNumber(cod?.order_amount),
                    asNumber(paid?.order_amount),
                    asNumber(total?.grv_count),
                    asNumber(total?.order_count),
                    asNumber(total?.order_amount),
                ]);
            });

            rows.push([
                "GRAND TOTAL",
                asNumber(codTotal?.grv_count),
                asNumber(paidTotal?.grv_count),
                asNumber(codTotal?.order_amount),
                asNumber(paidTotal?.order_amount),
                asNumber(overallTotal?.grv_count),
                asNumber(overallTotal?.order_count),
                asNumber(overallTotal?.order_amount),
            ]);

            const worksheet = XLSX.utils.aoa_to_sheet(rows);

            worksheet["!cols"] = [
                { wch: 24 },
                { wch: 12 },
                { wch: 12 },
                { wch: 17 },
                { wch: 17 },
                { wch: 12 },
                { wch: 16 },
                { wch: 18 },
            ];

            applyWorksheetStyles(worksheet, rows.length, 8);

            for (let row = 3; row < rows.length; row += 1) {
                [3, 4, 7].forEach((col) => {
                    const reference = XLSX.utils.encode_cell({ r: row, c: col });
                    if (worksheet[reference]) {
                        worksheet[reference].z = '₹#,##0.00';
                    }
                });
            }

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Sales Return Summary"
            );

            const timestamp = new Date()
                .toISOString()
                .replaceAll(":", "-")
                .slice(0, 19);

            XLSX.writeFile(
                workbook,
                `GRV_Family_Payment_Summary_${timestamp}.xlsx`
            );

            toast.success("Excel report exported successfully.");
        } catch (error) {
            console.error("GRV Excel export error:", error);
            toast.error("Failed to export Excel report.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <React.Fragment>
            <div className="page-content" style={pageStyle}>
                <ToastContainer />

                <div className="container-fluid">
                    <Row>
                        <Col xl={12}>
                            <Card className="border-0" style={mainCardStyle}>
                                <CardBody className="p-4">
                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                                        <div>
                                            <h4 className="mb-1" style={mainTitleStyle}>
                                                Sales Return Summary
                                            </h4>
                                            <p className="mb-0" style={subTitleStyle}>
                                                Review division-wise COD, cash, invoice,
                                                and GRV payment totals.
                                            </p>
                                        </div>

                                        <Badge
                                            color="primary"
                                            pill
                                            className="px-3 py-2"
                                        >
                                            GRV Family Summary
                                        </Badge>
                                    </div>

                                    <div style={filterSectionStyle}>
                                        <div className="mb-3">
                                            <h5
                                                className="mb-1"
                                                style={filterSectionTitleStyle}
                                            >
                                                Report Period
                                            </h5>
                                            <p
                                                className="mb-0"
                                                style={filterSectionSubtitleStyle}
                                            >
                                                Select the required start and end dates.
                                            </p>
                                        </div>

                                        <Row className="g-3 align-items-end">
                                            <Col xl={3} lg={4} md={6}>
                                                <label
                                                    className="form-label"
                                                    style={labelStyle}
                                                >
                                                    Start Date
                                                </label>
                                                <Input
                                                    type="date"
                                                    value={filters.start_date}
                                                    max={filters.end_date || undefined}
                                                    onChange={(event) =>
                                                        handleFilterChange(
                                                            "start_date",
                                                            event.target.value
                                                        )
                                                    }
                                                    style={inputStyle}
                                                />
                                            </Col>

                                            <Col xl={3} lg={4} md={6}>
                                                <label
                                                    className="form-label"
                                                    style={labelStyle}
                                                >
                                                    End Date
                                                </label>
                                                <Input
                                                    type="date"
                                                    value={filters.end_date}
                                                    min={filters.start_date || undefined}
                                                    onChange={(event) =>
                                                        handleFilterChange(
                                                            "end_date",
                                                            event.target.value
                                                        )
                                                    }
                                                    style={inputStyle}
                                                />
                                            </Col>

                                            <Col xl={2} lg={4} md={4}>
                                                <Button
                                                    color="primary"
                                                    className="w-100"
                                                    onClick={() =>
                                                        fetchReport({
                                                            showSuccessToast: true,
                                                        })
                                                    }
                                                    disabled={loading}
                                                    style={buttonStyle}
                                                >
                                                    {loading ? (
                                                        <>
                                                            <Spinner
                                                                size="sm"
                                                                className="me-2"
                                                            />
                                                            Loading...
                                                        </>
                                                    ) : (
                                                        "Generate Report"
                                                    )}
                                                </Button>
                                            </Col>

                                            <Col xl={2} lg={4} md={4}>
                                                <Button
                                                    color="secondary"
                                                    className="w-100"
                                                    onClick={clearFilters}
                                                    disabled={loading}
                                                    style={buttonStyle}
                                                >
                                                    Reset Today
                                                </Button>
                                            </Col>

                                            <Col xl={2} lg={4} md={4}>
                                                <Button
                                                    color="light"
                                                    className="w-100"
                                                    onClick={() => fetchReport()}
                                                    disabled={loading}
                                                    style={refreshButtonStyle}
                                                >
                                                    Refresh
                                                </Button>
                                            </Col>
                                        </Row>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {loading && !report ? (
                        <Card className="border-0 mt-4" style={mainCardStyle}>
                            <CardBody className="text-center py-5">
                                <Spinner color="primary" className="mb-3" />
                                <div style={emptyTitleStyle}>Loading report...</div>
                            </CardBody>
                        </Card>
                    ) : report ? (
                        <>
                            <Row className="g-3 mt-1">
                                {summaryCards.map((card) => (
                                    <Col xl={3} lg={6} md={6} key={card.title}>
                                        <Card
                                            className="border-0 h-100"
                                            style={{
                                                ...summaryCardStyle,
                                                backgroundColor: card.background,
                                                borderLeft: `5px solid ${card.border}`,
                                            }}
                                        >
                                            <CardBody className="p-4">
                                                <div style={summaryCardTitleStyle}>
                                                    {card.title}
                                                </div>
                                                <div
                                                    style={{
                                                        ...summaryCardValueStyle,
                                                        color: card.valueColor,
                                                    }}
                                                >
                                                    {formatNumber(card.value)}
                                                </div>
                                                <div style={summaryCardDescriptionStyle}>
                                                    {card.description}
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            <Row className="g-3 mt-1">
                                <Col xl={12}>
                                    <Card
                                        className="border-0"
                                        style={grandTotalCardStyle}
                                    >
                                        <CardBody className="p-4">
                                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                                                <div>
                                                    <h4
                                                        className="mb-1"
                                                        style={grandTotalTitleStyle}
                                                    >
                                                        Grand Total
                                                    </h4>
                                                    <p
                                                        className="mb-0"
                                                        style={grandTotalSubtitleStyle}
                                                    >
                                                        {formatDisplayDate(
                                                            filters.start_date
                                                        )}{" "}
                                                        to{" "}
                                                        {formatDisplayDate(
                                                            filters.end_date
                                                        )}
                                                    </p>
                                                </div>

                                                <Badge
                                                    color="light"
                                                    pill
                                                    className="px-3 py-2 text-primary"
                                                >
                                                    {formatNumber(families.length)} Divisions
                                                </Badge>
                                            </div>

                                            <Row className="g-3">
                                                <Col xl={3} md={6}>
                                                    <div style={grandTotalTileStyle}>
                                                        <span>COD Amount</span>
                                                        <strong>
                                                            {formatAmount(
                                                                codTotal?.order_amount
                                                            )}
                                                        </strong>
                                                    </div>
                                                </Col>
                                                <Col xl={3} md={6}>
                                                    <div style={grandTotalTileStyle}>
                                                        <span>Cash Amount</span>
                                                        <strong>
                                                            {formatAmount(
                                                                paidTotal?.order_amount
                                                            )}
                                                        </strong>
                                                    </div>
                                                </Col>
                                                <Col xl={3} md={6}>
                                                    <div style={grandTotalTileStyle}>
                                                        <span>Total Invoice</span>
                                                        <strong>
                                                            {formatNumber(
                                                                overallTotal?.order_count
                                                            )}
                                                        </strong>
                                                    </div>
                                                </Col>
                                                <Col xl={3} md={6}>
                                                    <div style={grandTotalTileStyle}>
                                                        <span>Total Amount</span>
                                                        <strong>
                                                            {formatAmount(
                                                                overallTotal?.order_amount
                                                            )}
                                                        </strong>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>

                            <Row className="mt-4">
                                <Col xl={12}>
                                    <Card className="border-0" style={tableCardStyle}>
                                        <CardBody className="p-4">
                                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                                                <div>
                                                    <h4
                                                        className="mb-1"
                                                        style={sectionTitleStyle}
                                                    >
                                                        Division-wise Sales Return Details
                                                    </h4>
                                                    <p className="mb-0" style={subTitleStyle}>
                                                        COD, cash, invoice, and total values for
                                                        each division.
                                                    </p>
                                                </div>

                                                <Badge
                                                    color="light"
                                                    pill
                                                    className="px-3 py-2 text-dark"
                                                >
                                                    {formatNumber(families.length)} Records
                                                </Badge>
                                            </div>

                                            <div
                                                className="table-responsive"
                                                style={tableWrapperStyle}
                                            >
                                                <Table
                                                    className="mb-0 align-middle"
                                                    style={{ minWidth: "1120px" }}
                                                >
                                                    <thead>
                                                        <tr>
                                                            <th style={divisionHeaderStyle}>
                                                                Division
                                                            </th>
                                                            <th style={tableHeaderStyle}>
                                                                COD SR
                                                            </th>
                                                            <th style={tableHeaderStyle}>
                                                                Cash SR
                                                            </th>
                                                            <th style={codAmountHeaderStyle}>
                                                                COD Amount
                                                            </th>
                                                            <th style={cashAmountHeaderStyle}>
                                                                Cash Amount
                                                            </th>
                                                            <th style={tableHeaderStyle}>
                                                                Total SR
                                                            </th>
                                                            <th style={invoiceHeaderStyle}>
                                                                Total Invoice
                                                            </th>
                                                            <th style={totalAmountHeaderStyle}>
                                                                Total Amount
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {families.length === 0 ? (
                                                            <tr>
                                                                <td
                                                                    colSpan="8"
                                                                    className="text-center py-5"
                                                                >
                                                                    <div style={emptyIconStyle}>↩</div>
                                                                    <div style={emptyTitleStyle}>
                                                                        No GRV summary found
                                                                    </div>
                                                                    <div
                                                                        style={emptyDescriptionStyle}
                                                                    >
                                                                        Change the date range and
                                                                        generate the report again.
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            <>
                                                                {families.map((item, index) => {
                                                                    const paid = item?.paid || {};
                                                                    const cod = item?.COD || {};
                                                                    const total = item?.total || {};

                                                                    return (
                                                                        <tr
                                                                            key={
                                                                                item?.family_id ||
                                                                                `${item?.family_name}-${index}`
                                                                            }
                                                                            style={{
                                                                                backgroundColor:
                                                                                    index % 2 === 0
                                                                                        ? "#ffffff"
                                                                                        : "#f8fafc",
                                                                            }}
                                                                        >
                                                                            <td
                                                                                style={divisionTdStyle}
                                                                            >
                                                                                <div
                                                                                    style={
                                                                                        divisionNameStyle
                                                                                    }
                                                                                >
                                                                                    {String(
                                                                                        item?.family_name ||
                                                                                        "-"
                                                                                    ).toUpperCase()}
                                                                                </div>
                                                                            </td>
                                                                            <td style={tableTdStyle}>
                                                                                {formatNumber(
                                                                                    cod?.grv_count
                                                                                )}
                                                                            </td>
                                                                            <td style={tableTdStyle}>
                                                                                {formatNumber(
                                                                                    paid?.grv_count
                                                                                )}
                                                                            </td>
                                                                            <td style={codAmountTdStyle}>
                                                                                {formatAmount(
                                                                                    cod?.order_amount
                                                                                )}
                                                                            </td>
                                                                            <td style={cashAmountTdStyle}>
                                                                                {formatAmount(
                                                                                    paid?.order_amount
                                                                                )}
                                                                            </td>
                                                                            <td style={tableTdStyle}>
                                                                                {formatNumber(
                                                                                    total?.grv_count
                                                                                )}
                                                                            </td>
                                                                            <td style={invoiceTdStyle}>
                                                                                {formatNumber(
                                                                                    total?.order_count
                                                                                )}
                                                                            </td>
                                                                            <td style={totalAmountTdStyle}>
                                                                                {formatAmount(
                                                                                    total?.order_amount
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}

                                                                <tr style={grandTotalRowStyle}>
                                                                    <td style={grandTotalLabelTdStyle}>
                                                                        GRAND TOTAL
                                                                    </td>
                                                                    <td style={grandTotalTdStyle}>
                                                                        {formatNumber(
                                                                            codTotal?.grv_count
                                                                        )}
                                                                    </td>
                                                                    <td style={grandTotalTdStyle}>
                                                                        {formatNumber(
                                                                            paidTotal?.grv_count
                                                                        )}
                                                                    </td>
                                                                    <td style={grandTotalTdStyle}>
                                                                        {formatAmount(
                                                                            codTotal?.order_amount
                                                                        )}
                                                                    </td>
                                                                    <td style={grandTotalTdStyle}>
                                                                        {formatAmount(
                                                                            paidTotal?.order_amount
                                                                        )}
                                                                    </td>
                                                                    <td style={grandTotalTdStyle}>
                                                                        {formatNumber(
                                                                            overallTotal?.grv_count
                                                                        )}
                                                                    </td>
                                                                    <td style={grandTotalTdStyle}>
                                                                        {formatNumber(
                                                                            overallTotal?.order_count
                                                                        )}
                                                                    </td>
                                                                    <td style={grandTotalAmountTdStyle}>
                                                                        {formatAmount(
                                                                            overallTotal?.order_amount
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            </>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    ) : null}
                </div>

                {report && (
                    <div style={stickyExportContainerStyle}>
                        <Button
                            color="success"
                            onClick={exportToExcel}
                            disabled={loading || exporting || families.length === 0}
                            style={stickyExportButtonStyle}
                        >
                            {exporting ? (
                                <>
                                    <Spinner size="sm" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <span style={excelIconStyle}>XLS</span>
                                    Export Excel
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </React.Fragment>
    );
};

const pageStyle = {
    backgroundColor: "#f3f6fb",
    minHeight: "100vh",
    paddingBottom: "100px",
};

const mainCardStyle = {
    borderRadius: "18px",
    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.10)",
};

const mainTitleStyle = {
    fontWeight: "900",
    color: "#111827",
    fontSize: "23px",
};

const subTitleStyle = {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
};

const filterSectionStyle = {
    padding: "20px",
    backgroundColor: "#f8fafc",
    border: "1.5px solid #e2e8f0",
    borderRadius: "15px",
};

const filterSectionTitleStyle = {
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: "900",
};

const filterSectionSubtitleStyle = {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "600",
};

const labelStyle = {
    fontSize: "13px",
    fontWeight: "800",
    color: "#111827",
    marginBottom: "8px",
};

const inputStyle = {
    height: "48px",
    borderRadius: "10px",
    border: "1.5px solid #b8c2d6",
    color: "#111827",
    fontSize: "14px",
    fontWeight: "600",
    backgroundColor: "#ffffff",
};

const buttonStyle = {
    height: "48px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "800",
};

const refreshButtonStyle = {
    ...buttonStyle,
    color: "#1d4ed8",
    border: "1.5px solid #bfdbfe",
    backgroundColor: "#eff6ff",
};

const summaryCardStyle = {
    borderRadius: "16px",
    boxShadow: "0 7px 20px rgba(15, 23, 42, 0.08)",
};

const summaryCardTitleStyle = {
    color: "#475569",
    fontSize: "13px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
};

const summaryCardValueStyle = {
    fontSize: "29px",
    fontWeight: "900",
    marginTop: "7px",
};

const summaryCardDescriptionStyle = {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "600",
    marginTop: "3px",
};

const grandTotalCardStyle = {
    borderRadius: "18px",
    border: "none",
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    boxShadow: "0 12px 30px rgba(37, 99, 235, 0.24)",
};

const grandTotalTitleStyle = {
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: "900",
};

const grandTotalSubtitleStyle = {
    color: "rgba(255,255,255,0.78)",
    fontSize: "13px",
    fontWeight: "700",
};

const grandTotalTileStyle = {
    minHeight: "88px",
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.20)",
    backgroundColor: "rgba(255,255,255,0.12)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "7px",
    color: "rgba(255,255,255,0.78)",
    fontSize: "12px",
    fontWeight: "700",
};

const tableCardStyle = {
    borderRadius: "18px",
    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.10)",
};

const sectionTitleStyle = {
    color: "#111827",
    fontSize: "19px",
    fontWeight: "900",
};

const tableWrapperStyle = {
    border: "1.5px solid #d7deea",
    borderRadius: "14px",
    overflowX: "auto",
    backgroundColor: "#ffffff",
};

const tableHeaderStyle = {
    padding: "14px 12px",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontSize: "12px",
    fontWeight: "900",
    borderBottom: "1.5px solid #cbd5e1",
    whiteSpace: "nowrap",
    textAlign: "center",
};

const divisionHeaderStyle = {
    ...tableHeaderStyle,
    minWidth: "220px",
    textAlign: "left",
};

const codAmountHeaderStyle = {
    ...tableHeaderStyle,
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
};

const cashAmountHeaderStyle = {
    ...tableHeaderStyle,
    backgroundColor: "#f5f3ff",
    color: "#7c3aed",
};

const invoiceHeaderStyle = {
    ...tableHeaderStyle,
    backgroundColor: "#fff7ed",
    color: "#c2410c",
};

const totalAmountHeaderStyle = {
    ...tableHeaderStyle,
    backgroundColor: "#ecfdf5",
    color: "#15803d",
};

const tableTdStyle = {
    padding: "15px 12px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
    textAlign: "center",
};

const divisionTdStyle = {
    ...tableTdStyle,
    textAlign: "left",
};

const divisionNameStyle = {
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: "900",
};

const codAmountTdStyle = {
    ...tableTdStyle,
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: "900",
};

const cashAmountTdStyle = {
    ...tableTdStyle,
    backgroundColor: "#f5f3ff",
    color: "#7c3aed",
    fontWeight: "900",
};

const invoiceTdStyle = {
    ...tableTdStyle,
    backgroundColor: "#fff7ed",
    color: "#c2410c",
    fontWeight: "900",
};

const totalAmountTdStyle = {
    ...tableTdStyle,
    backgroundColor: "#ecfdf5",
    color: "#15803d",
    fontWeight: "900",
};

const grandTotalRowStyle = {
    backgroundColor: "#dbeafe",
};

const grandTotalLabelTdStyle = {
    ...tableTdStyle,
    textAlign: "left",
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: "900",
    borderTop: "2px solid #2563eb",
};

const grandTotalTdStyle = {
    ...tableTdStyle,
    color: "#0f172a",
    fontWeight: "900",
    borderTop: "2px solid #2563eb",
};

const grandTotalAmountTdStyle = {
    ...grandTotalTdStyle,
    color: "#15803d",
    fontSize: "14px",
};

const emptyIconStyle = {
    fontSize: "34px",
    marginBottom: "8px",
};

const emptyTitleStyle = {
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "900",
};

const emptyDescriptionStyle = {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "600",
    marginTop: "5px",
};

const stickyExportContainerStyle = {
    position: "fixed",
    right: "28px",
    bottom: "24px",
    zIndex: 1050,
};

const stickyExportButtonStyle = {
    minWidth: "165px",
    height: "52px",
    padding: "0 20px",
    borderRadius: "14px",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    fontSize: "14px",
    fontWeight: "900",
    boxShadow: "0 10px 28px rgba(22, 163, 74, 0.35)",
};

const excelIconStyle = {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    backgroundColor: "rgba(255, 255, 255, 0.20)",
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: "900",
};

export default GrvFamilyPaymentSummaryReport;
