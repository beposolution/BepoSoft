import React, { useEffect, useState } from "react";
import {
    Card,
    CardBody,
    Col,
    Row,
    Input,
    Button,
    Badge,
    Table,
} from "reactstrap";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import * as XLSX from "xlsx-js-style";

const OrderComparisonReport = () => {
    const token = localStorage.getItem("token");

    document.title = "Order Comparison Report | Beposoft";

    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);

    const [familyData, setFamilyData] = useState([]);
    const [staffs, setStaffs] = useState([]);
    const [staffSearch, setStaffSearch] = useState("");
    const [customerOptions, setCustomerOptions] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [parcelServices, setParcelServices] = useState([]);

    const [filters, setFilters] = useState({
        range1_start: "",
        range1_end: "",
        range2_start: "",
        range2_end: "",
        report_type: "",
        search: "",
        status: "",
        payment_status: "",
        cod_status: "",
        family: "",
        manage_staff: "",
        customer: "",
        state: "",
        company: "",
        warehouse: "",
        parcel_service: "",
        shipping_mode: "",
        min_amount: "",
        max_amount: "",
    });

    const reportTypeOptions = [
        { value: "status_wise", label: "Status Wise" },
        { value: "payment_wise", label: "Payment Wise" },
        { value: "cod_status_wise", label: "COD Status Wise" },
        { value: "family_wise", label: "Family Wise" },
        { value: "staff_wise", label: "Staff Wise" },
        { value: "state_wise", label: "State Wise" },
        { value: "parcel_service_wise", label: "Parcel Service Wise" },
    ];

    const selectedReportTypes = filters.report_type
        ? filters.report_type.split(",").filter(Boolean)
        : [];

    const getReportTitleByType = (type) => {
        return (
            reportTypeOptions.find((item) => item.value === type)?.label ||
            "Comparison"
        );
    };

    const getReportTitle = () => {
        if (selectedReportTypes.length === 0) return "Comparison";

        return selectedReportTypes
            .map((type) => getReportTitleByType(type))
            .join(", ");
    };

    useEffect(() => {
        const fetchFamilyData = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}familys/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setFamilyData(response?.data?.data || []);
            } catch (error) {
                toast.error("Error fetching family data.");
            }
        };

        if (token) fetchFamilyData();
    }, [token]);

    const fetchStaffs = async (search = "") => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}get/staffs/`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        page: 1,
                        page_size: 1000,
                        search: search || undefined,
                    },
                }
            );

            if (response.status === 200) {
                setStaffs(response.data.results?.data || response.data.data || []);
            }
        } catch (error) {
            toast.error("Error fetching staffs");
        }
    };

    const fetchCustomers = async (search = "") => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}customers/`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        search: search || "",
                    },
                }
            );

            setCustomerOptions(response?.data?.results || []);
        } catch (err) {
            console.error("Customer API error:", err?.response?.data || err?.message);
            toast.error("Failed to load customer options");
            setCustomerOptions([]);
        }
    };

    const fetchStates = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}states/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setStateList(response?.data?.data || []);
        } catch (error) {
            toast.error("Failed to load States");
        }
    };

    const fetchCompanies = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}company/data/`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setCompanies(response.data.data || []);
        } catch (error) {
            console.error("Company fetch error:", error);
        }
    };

    useEffect(() => {
        if (token) {
            fetchStaffs(staffSearch);
            fetchCustomers();
            fetchStates();
            fetchCompanies();
        }
    }, [token, staffSearch]);

    useEffect(() => {
        if (!token) return;

        axios
            .get(`${import.meta.env.VITE_APP_KEY}parcal/service/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => setParcelServices(response.data.data || []))
            .catch(() => toast.error("Error fetching parcel services"));
    }, [token]);

    const handleChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));

        if (key === "report_type") {
            setReport(null);
        }
    };

    const buildParams = () => {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== "" && value !== null && value !== undefined) {
                params.append(key, value);
            }
        });

        return params.toString();
    };

    const fetchReport = async () => {
        if (
            !filters.range1_start ||
            !filters.range1_end ||
            !filters.range2_start ||
            !filters.range2_end
        ) {
            toast.warning("Please select all date ranges");
            return;
        }

        if (!filters.report_type) {
            toast.warning("Please select at least one report type");
            return;
        }

        try {
            setLoading(true);

            const { data } = await axios.get(
                `${import.meta.env.VITE_APP_KEY}orders/comparison/report/?${buildParams()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setReport(data);
            toast.success("Comparison report loaded");
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message ||
                error.response?.data?.errors ||
                "Failed to fetch comparison report"
            );
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setFilters({
            range1_start: "",
            range1_end: "",
            range2_start: "",
            range2_end: "",
            report_type: "",
            search: "",
            status: "",
            payment_status: "",
            cod_status: "",
            family: "",
            manage_staff: "",
            customer: "",
            state: "",
            company: "",
            warehouse: "",
            parcel_service: "",
            shipping_mode: "",
            min_amount: "",
            max_amount: "",
        });

        setReport(null);
    };

    const formatAmount = (amount) => {
        const value = Number(amount || 0);

        return `₹${value.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "-";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) return dateValue;

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatPercentage = (value) => {
        return `${Number(value || 0).toFixed(2)}%`;
    };

    const getPositiveNegativeColor = (value) => {
        const numberValue = Number(value || 0);

        if (numberValue > 0) return "#16a34a";
        if (numberValue < 0) return "#dc2626";

        return "#334155";
    };

    const getSelectedRowsByType = (type) => {
        if (!report || !type) {
            return {
                rows: [],
                total: null,
            };
        }

        const backendTable = report.comparison_tables?.[type];

        if (backendTable) {
            return {
                rows: backendTable.rows || [],
                total: backendTable.total || null,
            };
        }

        return {
            rows: [],
            total: null,
        };
    };

    const renderInput = (label, key, type = "text", placeholder = "") => (
        <Col xl={2} md={6}>
            <label className="form-label" style={labelStyle}>
                {label}
            </label>

            <Input
                type={type}
                value={filters[key]}
                placeholder={placeholder}
                onChange={(e) => handleChange(key, e.target.value)}
                style={inputStyle}
            />
        </Col>
    );

    const renderSelect = (label, key, options, colSize = 2) => (
        <Col xl={colSize} md={6}>
            <label className="form-label" style={labelStyle}>
                {label}
            </label>

            <Input
                type="select"
                value={filters[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                style={inputStyle}
            >
                <option value="">All</option>

                {options.map((item) => (
                    <option key={item.value} value={item.value}>
                        {item.label}
                    </option>
                ))}
            </Input>
        </Col>
    );

    const selectCommonStyles = {
        control: (base) => ({
            ...base,
            minHeight: "48px",
            borderRadius: "10px",
            border: "1.5px solid #b8c2d6",
            fontSize: "14px",
            fontWeight: "600",
        }),
        menu: (base) => ({
            ...base,
            zIndex: 9999,
        }),
    };

    const renderReportTypeSelect = () => (
        <Col xl={2} md={12}>
            <label className="form-label" style={labelStyle}>
                Report Type
            </label>

            <Select
                isMulti
                value={reportTypeOptions.filter((option) =>
                    selectedReportTypes.includes(option.value)
                )}
                onChange={(selectedOptions) => {
                    const values = selectedOptions
                        ? selectedOptions.map((item) => item.value).join(",")
                        : "";

                    handleChange("report_type", values);
                }}
                options={reportTypeOptions}
                placeholder="Select report types"
                closeMenuOnSelect={false}
                styles={{
                    ...selectCommonStyles,
                    multiValue: (base) => ({
                        ...base,
                        borderRadius: "8px",
                        fontWeight: "700",
                    }),
                }}
            />
        </Col>
    );

    const renderCompareTable = (title, type) => {
        const { rows, total } = getSelectedRowsByType(type);

        const tableRows = total ? [...rows, { ...total, is_total: true }] : rows;

        return (
            <Card className="border-0 mb-4" style={tableCardStyle}>
                <CardBody className="p-4">
                    <h4 className="mb-3" style={sectionTitleStyle}>
                        {title}
                    </h4>

                    <div className="table-responsive" style={tableWrapperStyle}>
                        <Table className="table mb-0 align-middle">
                            <thead>
                                <tr>
                                    <th rowSpan="2" style={nameHeaderStyle}>
                                        Name
                                    </th>

                                    <th colSpan="2" style={range1HeaderStyle}>
                                        Range 1
                                    </th>

                                    <th colSpan="2" style={range2HeaderStyle}>
                                        Range 2
                                    </th>

                                    <th colSpan="2" style={diffHeaderStyle}>
                                        Difference
                                    </th>
                                </tr>

                                <tr>
                                    <th style={range1SubHeaderStyle}>Orders</th>
                                    <th style={range1SubHeaderStyle}>Amount</th>
                                    <th style={range2SubHeaderStyle}>Orders</th>
                                    <th style={range2SubHeaderStyle}>Amount</th>
                                    <th style={diffSubHeaderStyle}>Orders</th>
                                    <th style={diffSubHeaderStyle}>Amount</th>
                                </tr>
                            </thead>

                            <tbody>
                                {tableRows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="text-center py-3"
                                            style={miniTdStyle}
                                        >
                                            No data
                                        </td>
                                    </tr>
                                ) : (
                                    tableRows.map((item, index) => {
                                        const isTotalRow = item.is_total || item.name === "TOTAL";

                                        const orderDiff = Number(item.order_difference || 0);
                                        const amountDiff = Number(item.amount_difference || 0);

                                        const orderDiffColor = getPositiveNegativeColor(orderDiff);
                                        const amountDiffColor = getPositiveNegativeColor(amountDiff);

                                        return (
                                            <tr
                                                key={index}
                                                style={{
                                                    backgroundColor: isTotalRow
                                                        ? "#0f172a"
                                                        : index % 2 === 0
                                                            ? "#ffffff"
                                                            : "#f8fafc",
                                                }}
                                            >
                                                <td style={isTotalRow ? totalNameTdStyle : nameTdStyle}>
                                                    {item.name || "N/A"}
                                                </td>

                                                <td style={isTotalRow ? totalRange1TdStyle : range1TdStyle}>
                                                    {item.range1_orders || 0}
                                                </td>

                                                <td style={isTotalRow ? totalRange1TdStyle : range1TdStyle}>
                                                    {formatAmount(item.range1_amount)}
                                                </td>

                                                <td style={isTotalRow ? totalRange2TdStyle : range2TdStyle}>
                                                    {item.range2_orders || 0}
                                                </td>

                                                <td style={isTotalRow ? totalRange2TdStyle : range2TdStyle}>
                                                    {formatAmount(item.range2_amount)}
                                                </td>

                                                <td
                                                    style={{
                                                        ...(isTotalRow ? totalDiffTdStyle : diffTdStyle),
                                                        color: orderDiffColor,
                                                    }}
                                                >
                                                    {orderDiff > 0 ? "+" : ""}
                                                    {orderDiff}
                                                </td>

                                                <td
                                                    style={{
                                                        ...(isTotalRow ? totalDiffTdStyle : diffTdStyle),
                                                        color: amountDiffColor,
                                                    }}
                                                >
                                                    {amountDiff > 0 ? "+" : ""}
                                                    {formatAmount(amountDiff)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </Table>
                    </div>
                </CardBody>
            </Card>
        );
    };

    const exportToExcel = () => {
        if (!report || selectedReportTypes.length === 0) {
            toast.warning("No report data to export");
            return;
        }

        const wb = XLSX.utils.book_new();
        const wsData = [];
        const merges = [];

        const sectionRows = [];
        const headerRows = [];
        const totalRows = [];

        const addMergedTitle = (title, color = "1D4ED8") => {
            const rowIndex = wsData.length;
            wsData.push([title]);
            merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 6 } });
            sectionRows.push({ rowIndex, color });
        };

        addMergedTitle("ORDER COMPARISON REPORT", "1D4ED8");
        wsData.push([]);

        wsData.push(["Report Types", getReportTitle()]);
        wsData.push(["Range 1 Start", filters.range1_start, "Range 1 End", filters.range1_end]);
        wsData.push(["Range 2 Start", filters.range2_start, "Range 2 End", filters.range2_end]);
        wsData.push([]);

        headerRows.push(wsData.length);
        wsData.push(["Range", "Total Orders", "Total Amount"]);
        wsData.push(["Range 1", report.range1?.order_count || 0, report.range1?.total_amount || 0]);
        wsData.push(["Range 2", report.range2?.order_count || 0, report.range2?.total_amount || 0]);
        wsData.push([]);

        addMergedTitle("COMPARISON RESULT", "F97316");
        wsData.push(["Order Difference", report.comparison?.order_count_difference || 0]);
        wsData.push(["Order %", `${report.comparison?.order_count_percentage || 0}%`]);
        wsData.push(["Amount Difference", report.comparison?.amount_difference || 0]);
        wsData.push(["Amount %", `${report.comparison?.amount_percentage || 0}%`]);
        wsData.push(["Result", report.comparison?.result || ""]);
        wsData.push([]);

        const sectionColors = {
            status_wise: "2563EB",
            payment_wise: "16A34A",
            cod_status_wise: "CA8A04",
            family_wise: "9333EA",
            staff_wise: "0891B2",
            state_wise: "DC2626",
            parcel_service_wise: "EA580C",
        };

        selectedReportTypes.forEach((type) => {
            const { rows, total } = getSelectedRowsByType(type);

            addMergedTitle(
                `${getReportTitleByType(type).toUpperCase()} COMPARISON`,
                sectionColors[type] || "0891B2"
            );

            headerRows.push(wsData.length);
            wsData.push([
                "Name",
                "Range 1 Orders",
                "Range 1 Amount",
                "Range 2 Orders",
                "Range 2 Amount",
                "Order Difference",
                "Amount Difference",
            ]);

            rows.forEach((item) => {
                wsData.push([
                    item.name || "N/A",
                    item.range1_orders || 0,
                    item.range1_amount || 0,
                    item.range2_orders || 0,
                    item.range2_amount || 0,
                    item.order_difference || 0,
                    item.amount_difference || 0,
                ]);
            });

            if (total) {
                totalRows.push(wsData.length);

                wsData.push([
                    total.name || "TOTAL",
                    total.range1_orders || 0,
                    total.range1_amount || 0,
                    total.range2_orders || 0,
                    total.range2_amount || 0,
                    total.order_difference || 0,
                    total.amount_difference || 0,
                ]);
            }

            wsData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws["!merges"] = merges;

        ws["!cols"] = [
            { wch: 35 },
            { wch: 18 },
            { wch: 20 },
            { wch: 18 },
            { wch: 20 },
            { wch: 18 },
            { wch: 20 },
        ];

        const borderStyle = {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
        };

        Object.keys(ws).forEach((cell) => {
            if (cell.startsWith("!")) return;

            ws[cell].s = {
                font: {
                    name: "Calibri",
                    sz: 11,
                    bold: true,
                    color: { rgb: "111827" },
                },
                alignment: {
                    horizontal: "center",
                    vertical: "center",
                    wrapText: true,
                },
                border: borderStyle,
            };
        });

        sectionRows.forEach(({ rowIndex, color }) => {
            for (let col = 0; col <= 6; col++) {
                const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: col });
                if (!ws[cellRef]) ws[cellRef] = { t: "s", v: "" };

                ws[cellRef].s = {
                    font: {
                        bold: true,
                        sz: rowIndex === 0 ? 16 : 13,
                        color: { rgb: "FFFFFF" },
                    },
                    fill: {
                        fgColor: { rgb: color },
                    },
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                    },
                    border: borderStyle,
                };
            }
        });

        headerRows.forEach((rowIndex) => {
            for (let col = 0; col <= 6; col++) {
                const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: col });
                if (!ws[cellRef]) continue;

                ws[cellRef].s = {
                    font: {
                        bold: true,
                        color: { rgb: "FFFFFF" },
                    },
                    fill: {
                        fgColor: { rgb: "0F172A" },
                    },
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                        wrapText: true,
                    },
                    border: borderStyle,
                };
            }
        });

        totalRows.forEach((rowIndex) => {
            for (let col = 0; col <= 6; col++) {
                const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: col });
                if (!ws[cellRef]) continue;

                ws[cellRef].s = {
                    font: {
                        bold: true,
                        color: { rgb: "FFFFFF" },
                    },
                    fill: {
                        fgColor: { rgb: "DC2626" },
                    },
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                    },
                    border: borderStyle,
                };
            }
        });

        ws["!rows"] = wsData.map((row, index) => ({
            hpt: sectionRows.some((item) => item.rowIndex === index) ? 24 : 20,
        }));

        XLSX.utils.book_append_sheet(wb, ws, "Comparison Report");

        XLSX.writeFile(
            wb,
            `Order_Comparison_Report_${filters.range1_start}_to_${filters.range2_end}.xlsx`
        );
    };

    return (
        <React.Fragment>
            <div className="page-content" style={{ backgroundColor: "#f3f6fb" }}>
                <ToastContainer />

                <div className="container-fluid">
                    <Row>
                        <Col xl={12}>
                            <Card className="border-0" style={mainCardStyle}>
                                <CardBody className="p-4">
                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                                        <div>
                                            <h4 className="mb-1" style={mainTitleStyle}>
                                                Order Comparison Report
                                            </h4>

                                            <p className="mb-0" style={subTitleStyle}>
                                                Compare orders between two selected date ranges.
                                            </p>
                                        </div>

                                        <div className="d-flex gap-2 flex-wrap">
                                            <Badge color="primary" pill className="px-3 py-2">
                                                Range Wise
                                            </Badge>

                                            {report && (
                                                <Badge color="info" pill className="px-3 py-2">
                                                    {report.comparison?.result}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <Row className="g-3 align-items-end mb-3">
                                        {renderInput("Range 1 Start", "range1_start", "date")}
                                        {renderInput("Range 1 End", "range1_end", "date")}
                                        {renderInput("Range 2 Start", "range2_start", "date")}
                                        {renderInput("Range 2 End", "range2_end", "date")}
                                        {renderReportTypeSelect()}
                                    {/* </Row> */}

                                    {/* <Row className="g-3 align-items-end mb-3"> */}
                                        <Col xl={2} md={12}>
                                            <label className="form-label" style={labelStyle}>
                                                Search
                                            </label>

                                            <Input
                                                type="text"
                                                value={filters.search}
                                                placeholder="Search invoice or customer"
                                                onChange={(e) => handleChange("search", e.target.value)}
                                                style={inputStyle}
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="g-3 align-items-end mb-3">
                                        {renderSelect("Status", "status", [
                                            { value: "Invoice Created", label: "Invoice Created" },
                                            { value: "Invoice Approved", label: "Invoice Approved" },
                                            { value: "Waiting For Confirmation", label: "Waiting For Confirmation" },
                                            { value: "To Print", label: "To Print" },
                                            { value: "Packing under progress", label: "Packing under progress" },
                                            { value: "Packed", label: "Packed" },
                                            { value: "Ready to ship", label: "Ready to ship" },
                                            { value: "Shipped", label: "Shipped" },
                                            { value: "Invoice Rejected", label: "Invoice Rejected" },
                                        ])}

                                        {renderSelect("Payment Status", "payment_status", [
                                            { value: "paid", label: "Paid" },
                                            { value: "COD", label: "COD" },
                                            { value: "credit", label: "Credit" },
                                        ])}

                                        {renderSelect("COD Status", "cod_status", [
                                            { value: "FULL_COD", label: "Full COD" },
                                            { value: "PARTIAL_COD", label: "Partial COD" },
                                        ])}

                                        {renderSelect(
                                            "Division",
                                            "family",
                                            familyData.map((item) => ({
                                                value: item.id,
                                                label: item.name || item.family_name || `Family ${item.id}`,
                                            })),
                                            3
                                        )}

                                        {renderSelect(
                                            "Company",
                                            "company",
                                            companies.map((item) => ({
                                                value: item.id,
                                                label: item.name || item.company_name || `Company ${item.id}`,
                                            })),
                                            3
                                        )}
                                    </Row>

                                    <Row className="g-3 align-items-end">
                                        <Col xl={3} md={6}>
                                            <label className="form-label" style={labelStyle}>
                                                Staff
                                            </label>

                                            <Select
                                                value={
                                                    staffs
                                                        .map((staff) => ({
                                                            value: String(staff.id),
                                                            label:
                                                                staff.name ||
                                                                staff.family_name ||
                                                                staff.username ||
                                                                `Staff ${staff.id}`,
                                                        }))
                                                        .find((option) => option.value === String(filters.manage_staff)) || null
                                                }
                                                onInputChange={(value, actionMeta) => {
                                                    if (actionMeta.action === "input-change") {
                                                        setStaffSearch(value);
                                                        fetchStaffs(value);
                                                    }
                                                }}
                                                onChange={(selected) => {
                                                    handleChange("manage_staff", selected ? String(selected.value) : "");
                                                }}
                                                options={staffs.map((staff) => ({
                                                    value: String(staff.id),
                                                    label:
                                                        staff.name ||
                                                        staff.family_name ||
                                                        staff.username ||
                                                        `Staff ${staff.id}`,
                                                }))}
                                                isSearchable
                                                isClearable
                                                placeholder="Search staff"
                                                styles={selectCommonStyles}
                                            />
                                        </Col>

                                        <Col xl={3} md={6}>
                                            <label className="form-label" style={labelStyle}>
                                                Customer
                                            </label>

                                            <Select
                                                value={
                                                    customerOptions
                                                        .map((customer) => ({
                                                            value: customer.id,
                                                            label:
                                                                customer.name ||
                                                                customer.customer_name ||
                                                                customer.phone ||
                                                                `Customer ${customer.id}`,
                                                        }))
                                                        .find((option) => option.value === filters.customer) || null
                                                }
                                                onInputChange={(value) => {
                                                    fetchCustomers(value);
                                                }}
                                                onChange={(selected) => {
                                                    handleChange("customer", selected ? selected.value : "");
                                                }}
                                                options={customerOptions.map((customer) => ({
                                                    value: customer.id,
                                                    label:
                                                        customer.name ||
                                                        customer.customer_name ||
                                                        customer.phone ||
                                                        `Customer ${customer.id}`,
                                                }))}
                                                isClearable
                                                placeholder="Search customer"
                                                styles={selectCommonStyles}
                                            />
                                        </Col>

                                        <Col xl={3} md={6}>
                                            <label className="form-label" style={labelStyle}>
                                                State
                                            </label>

                                            <Select
                                                value={
                                                    stateList
                                                        .map((state) => ({
                                                            value: state.id,
                                                            label:
                                                                state.name ||
                                                                state.state_name ||
                                                                `State ${state.id}`,
                                                        }))
                                                        .find(
                                                            (option) =>
                                                                option.value === Number(filters.state)
                                                        ) || null
                                                }
                                                onChange={(selected) => {
                                                    handleChange("state", selected ? selected.value : "");
                                                }}
                                                options={stateList.map((state) => ({
                                                    value: state.id,
                                                    label:
                                                        state.name ||
                                                        state.state_name ||
                                                        `State ${state.id}`,
                                                }))}
                                                isSearchable
                                                isClearable
                                                placeholder="Search State"
                                                noOptionsMessage={() => "No states found"}
                                                styles={selectCommonStyles}
                                            />
                                        </Col>

                                        <Col xl={3} md={6}>
                                            <label className="form-label" style={labelStyle}>
                                                Parcel Service
                                            </label>

                                            <Select
                                                value={
                                                    parcelServices
                                                        .map((service) => ({
                                                            value: service.id,
                                                            label:
                                                                service.name ||
                                                                service.parcel_service_name ||
                                                                service.service_name ||
                                                                `Parcel Service ${service.id}`,
                                                        }))
                                                        .find(
                                                            (option) =>
                                                                option.value === Number(filters.parcel_service)
                                                        ) || null
                                                }
                                                onChange={(selected) => {
                                                    handleChange("parcel_service", selected ? selected.value : "");
                                                }}
                                                options={parcelServices.map((service) => ({
                                                    value: service.id,
                                                    label:
                                                        service.name ||
                                                        service.parcel_service_name ||
                                                        service.service_name ||
                                                        `Parcel Service ${service.id}`,
                                                }))}
                                                isSearchable
                                                isClearable
                                                placeholder="Search parcel service"
                                                noOptionsMessage={() => "No parcel services found"}
                                                styles={selectCommonStyles}
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="g-3 align-items-end mt-3">
                                        <Col xl={2} md={4}>
                                            <Button
                                                color="primary"
                                                className="w-100"
                                                onClick={fetchReport}
                                                disabled={loading}
                                                style={buttonStyle}
                                            >
                                                {loading ? "Loading..." : "Compare"}
                                            </Button>
                                        </Col>

                                        <Col xl={2} md={4}>
                                            <Button
                                                color="secondary"
                                                className="w-100"
                                                onClick={clearFilters}
                                                style={buttonStyle}
                                            >
                                                Clear
                                            </Button>
                                        </Col>

                                        {report && (
                                            <Col xl={2} md={4}>
                                                <Button
                                                    color="success"
                                                    className="w-100"
                                                    onClick={exportToExcel}
                                                    style={buttonStyle}
                                                >
                                                    Export Excel
                                                </Button>
                                            </Col>
                                        )}
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {report && (
                        <>
                            <Row className="g-3 mt-1 mb-4">
                                <Col xl={12}>
                                    <Card className="border-0" style={comparisonResultCardStyle}>
                                        <CardBody className="p-4">
                                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                                <div>
                                                    <h4 className="mb-1" style={comparisonTitleStyle}>
                                                        Comparison Result
                                                    </h4>

                                                    <p className="mb-0" style={comparisonSubTitleStyle}>
                                                        {getReportTitle()} comparison between selected date ranges.
                                                    </p>
                                                </div>

                                                <Badge color="warning" pill className="px-3 py-2">
                                                    {report.comparison?.result}
                                                </Badge>
                                            </div>

                                            <Row className="g-3 mt-3">
                                                <Col xl={3} md={6}>
                                                    <div style={differenceBoxStyle}>
                                                        <span>Order Difference</span>
                                                        <strong>{report.comparison?.order_count_difference}</strong>
                                                    </div>
                                                </Col>

                                                <Col xl={3} md={6}>
                                                    <div style={differenceBoxStyle}>
                                                        <span>Order %</span>
                                                        <strong>{report.comparison?.order_count_percentage}%</strong>
                                                    </div>
                                                </Col>

                                                <Col xl={3} md={6}>
                                                    <div style={differenceBoxStyle}>
                                                        <span>Amount Difference</span>
                                                        <strong>
                                                            {formatAmount(report.comparison?.amount_difference)}
                                                        </strong>
                                                    </div>
                                                </Col>

                                                <Col xl={3} md={6}>
                                                    <div style={differenceBoxStyle}>
                                                        <span>Amount %</span>
                                                        <strong>{report.comparison?.amount_percentage}%</strong>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>

                            <Row className="g-3 mb-4">
                                <Col xl={12}>
                                    <Card className="border-0" style={rangeSummaryCardStyle}>
                                        <CardBody className="p-4">
                                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                                                <div>
                                                    <h4 className="mb-1" style={rangeSummaryTitleStyle}>
                                                        Range Comparison Summary
                                                    </h4>

                                                    <p className="mb-0" style={rangeSummarySubTitleStyle}>
                                                        Range 2 is compared against Range 1
                                                    </p>
                                                </div>

                                                <Badge color="primary" pill className="px-3 py-2">
                                                    {getReportTitle()}
                                                </Badge>
                                            </div>

                                            <div
                                                className="table-responsive"
                                                style={rangeSummaryTableWrapperStyle}
                                            >
                                                <Table className="mb-0 align-middle">
                                                    <thead>
                                                        <tr>
                                                            <th style={rangeSummaryThStyle}>Metric</th>

                                                            <th style={range1SummaryThStyle}>
                                                                Range 1 - Base
                                                                <div style={rangeDateStyle}>
                                                                    {formatDate(filters.range1_start)} to{" "}
                                                                    {formatDate(filters.range1_end)}
                                                                </div>
                                                            </th>

                                                            <th style={range2SummaryThStyle}>
                                                                Range 2 - Compare
                                                                <div style={rangeDateStyle}>
                                                                    {formatDate(filters.range2_start)} to{" "}
                                                                    {formatDate(filters.range2_end)}
                                                                </div>
                                                            </th>

                                                            <th style={diffSummaryThStyle}>
                                                                Difference
                                                                <div style={rangeDateStyle}>Range 2 - Range 1</div>
                                                            </th>

                                                            <th style={diffSummaryThStyle}>Growth %</th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        <tr>
                                                            <td style={metricTdStyle}>Total Orders</td>

                                                            <td style={range1SummaryTdStyle}>
                                                                {report.range1?.order_count || 0}
                                                            </td>

                                                            <td style={range2SummaryTdStyle}>
                                                                {report.range2?.order_count || 0}
                                                            </td>

                                                            <td
                                                                style={{
                                                                    ...diffSummaryTdStyle,
                                                                    color: getPositiveNegativeColor(
                                                                        report.comparison?.order_count_difference
                                                                    ),
                                                                }}
                                                            >
                                                                {Number(
                                                                    report.comparison?.order_count_difference || 0
                                                                ) > 0
                                                                    ? "+"
                                                                    : ""}
                                                                {report.comparison?.order_count_difference || 0}
                                                            </td>

                                                            <td
                                                                style={{
                                                                    ...diffSummaryTdStyle,
                                                                    color: getPositiveNegativeColor(
                                                                        report.comparison?.order_count_percentage
                                                                    ),
                                                                }}
                                                            >
                                                                {Number(
                                                                    report.comparison?.order_count_percentage || 0
                                                                ) > 0
                                                                    ? "+"
                                                                    : ""}
                                                                {formatPercentage(
                                                                    report.comparison?.order_count_percentage
                                                                )}
                                                            </td>
                                                        </tr>

                                                        <tr>
                                                            <td style={metricTdStyle}>Total Amount</td>

                                                            <td style={range1SummaryTdStyle}>
                                                                {formatAmount(report.range1?.total_amount)}
                                                            </td>

                                                            <td style={range2SummaryTdStyle}>
                                                                {formatAmount(report.range2?.total_amount)}
                                                            </td>

                                                            <td
                                                                style={{
                                                                    ...diffSummaryTdStyle,
                                                                    color: getPositiveNegativeColor(
                                                                        report.comparison?.amount_difference
                                                                    ),
                                                                }}
                                                            >
                                                                {Number(report.comparison?.amount_difference || 0) > 0
                                                                    ? "+"
                                                                    : ""}
                                                                {formatAmount(report.comparison?.amount_difference)}
                                                            </td>

                                                            <td
                                                                style={{
                                                                    ...diffSummaryTdStyle,
                                                                    color: getPositiveNegativeColor(
                                                                        report.comparison?.amount_percentage
                                                                    ),
                                                                }}
                                                            >
                                                                {Number(report.comparison?.amount_percentage || 0) > 0
                                                                    ? "+"
                                                                    : ""}
                                                                {formatPercentage(report.comparison?.amount_percentage)}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>

                            {selectedReportTypes.map((type) => (
                                <React.Fragment key={type}>
                                    {renderCompareTable(
                                        `${getReportTitleByType(type)} Comparison`,
                                        type
                                    )}
                                </React.Fragment>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </React.Fragment>
    );
};

const labelStyle = {
    fontSize: "14px",
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

const mainCardStyle = {
    borderRadius: "18px",
    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.10)",
};

const tableCardStyle = {
    borderRadius: "18px",
    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.10)",
};

const tableWrapperStyle = {
    border: "1.5px solid #d7deea",
    borderRadius: "14px",
    overflow: "hidden",
    backgroundColor: "#ffffff",
};

const mainTitleStyle = {
    fontWeight: "800",
    color: "#111827",
    fontSize: "22px",
};

const subTitleStyle = {
    color: "#475569",
    fontSize: "14px",
    fontWeight: "500",
};

const sectionTitleStyle = {
    fontWeight: "900",
    color: "#111827",
    fontSize: "18px",
};

const comparisonResultCardStyle = {
    borderRadius: "18px",
    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.10)",
    borderLeft: "5px solid #f97316",
};

const comparisonTitleStyle = {
    fontWeight: "900",
    color: "#111827",
    fontSize: "20px",
};

const comparisonSubTitleStyle = {
    color: "#475569",
    fontSize: "14px",
    fontWeight: "600",
};

const miniThStyle = {
    padding: "13px 12px",
    color: "#1e293b",
    fontSize: "13px",
    fontWeight: "900",
    borderBottom: "1.5px solid #cbd5e1",
    whiteSpace: "nowrap",
    textAlign: "center",
};

const nameHeaderStyle = {
    ...miniThStyle,
    textAlign: "left",
    backgroundColor: "#f8fafc",
    minWidth: "220px",
};

const range1HeaderStyle = {
    ...miniThStyle,
    backgroundColor: "#dbeafe",
    color: "#1e3a8a",
};

const range2HeaderStyle = {
    ...miniThStyle,
    backgroundColor: "#dcfce7",
    color: "#14532d",
};

const diffHeaderStyle = {
    ...miniThStyle,
    backgroundColor: "#fff7ed",
    color: "#9a3412",
};

const range1SubHeaderStyle = {
    ...miniThStyle,
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
};

const range2SubHeaderStyle = {
    ...miniThStyle,
    backgroundColor: "#f0fdf4",
    color: "#16a34a",
};

const diffSubHeaderStyle = {
    ...miniThStyle,
    backgroundColor: "#fff7ed",
    color: "#ea580c",
};

const miniTdStyle = {
    padding: "13px 12px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "800",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
    textAlign: "center",
};

const nameTdStyle = {
    ...miniTdStyle,
    textAlign: "left",
    fontWeight: "900",
    color: "#0f172a",
    backgroundColor: "#ffffff",
};

const range1TdStyle = {
    ...miniTdStyle,
    backgroundColor: "#eff6ff",
};

const range2TdStyle = {
    ...miniTdStyle,
    backgroundColor: "#f0fdf4",
};

const diffTdStyle = {
    ...miniTdStyle,
    backgroundColor: "#fff7ed",
    fontWeight: "900",
};

const totalNameTdStyle = {
    ...miniTdStyle,
    textAlign: "left",
    fontWeight: "900",
    color: "#ffffff",
    backgroundColor: "#0f172a",
    borderTop: "2px solid #0f172a",
};

const totalRange1TdStyle = {
    ...miniTdStyle,
    fontWeight: "900",
    color: "#ffffff",
    backgroundColor: "#1d4ed8",
    borderTop: "2px solid #0f172a",
};

const totalRange2TdStyle = {
    ...miniTdStyle,
    fontWeight: "900",
    color: "#ffffff",
    backgroundColor: "#16a34a",
    borderTop: "2px solid #0f172a",
};

const totalDiffTdStyle = {
    ...miniTdStyle,
    fontWeight: "900",
    backgroundColor: "#fff7ed",
    borderTop: "2px solid #0f172a",
};

const buttonStyle = {
    height: "48px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "800",
};

const differenceBoxStyle = {
    backgroundColor: "#f8fafc",
    border: "1.5px solid #d7deea",
    borderRadius: "14px",
    padding: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#111827",
    fontSize: "13px",
    fontWeight: "900",
};

const rangeSummaryCardStyle = {
    borderRadius: "18px",
    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.10)",
    borderLeft: "5px solid #2563eb",
};

const rangeSummaryTitleStyle = {
    fontWeight: "900",
    color: "#111827",
    fontSize: "20px",
};

const rangeSummarySubTitleStyle = {
    color: "#475569",
    fontSize: "14px",
    fontWeight: "700",
};

const rangeSummaryTableWrapperStyle = {
    border: "1.5px solid #d7deea",
    borderRadius: "14px",
    overflow: "hidden",
    backgroundColor: "#ffffff",
};

const rangeSummaryThStyle = {
    padding: "14px",
    backgroundColor: "#f8fafc",
    color: "#111827",
    fontSize: "13px",
    fontWeight: "900",
    borderBottom: "1.5px solid #cbd5e1",
    whiteSpace: "nowrap",
};

const range1SummaryThStyle = {
    ...rangeSummaryThStyle,
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    textAlign: "center",
};

const range2SummaryThStyle = {
    ...rangeSummaryThStyle,
    backgroundColor: "#f0fdf4",
    color: "#16a34a",
    textAlign: "center",
};

const diffSummaryThStyle = {
    ...rangeSummaryThStyle,
    backgroundColor: "#fff7ed",
    color: "#ea580c",
    textAlign: "center",
};

const rangeDateStyle = {
    fontSize: "11px",
    fontWeight: "800",
    marginTop: "4px",
    opacity: 0.85,
};

const metricTdStyle = {
    padding: "15px 14px",
    fontSize: "14px",
    fontWeight: "900",
    color: "#0f172a",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#ffffff",
    whiteSpace: "nowrap",
};

const range1SummaryTdStyle = {
    padding: "15px 14px",
    fontSize: "14px",
    fontWeight: "900",
    color: "#1d4ed8",
    textAlign: "center",
    backgroundColor: "#eff6ff",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
};

const range2SummaryTdStyle = {
    padding: "15px 14px",
    fontSize: "14px",
    fontWeight: "900",
    color: "#16a34a",
    textAlign: "center",
    backgroundColor: "#f0fdf4",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
};

const diffSummaryTdStyle = {
    padding: "15px 14px",
    fontSize: "14px",
    fontWeight: "900",
    textAlign: "center",
    backgroundColor: "#fff7ed",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
};

export default OrderComparisonReport;