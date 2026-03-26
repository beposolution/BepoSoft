import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import Select from "react-select";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    Card,
    CardBody,
    Col,
    Row,
    Table,
    CardTitle,
    Spinner,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    FormGroup,
    Label,
    Input,
} from "reactstrap";
import "react-toastify/dist/ReactToastify.css";

const ViewDailySalesReport = () => {
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);

    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingReport, setLoadingReport] = useState(false);

    const [familyId, setFamilyId] = useState(null);
    const [role, setRole] = useState(null);

    const [viewModal, setViewModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("");

    const [search, setSearch] = useState("");
    const [callStatus, setCallStatus] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [stateFilter, setStateFilter] = useState("");
    const [district, setDistrict] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [createdBy, setCreatedBy] = useState("");
    const [familyUsers, setFamilyUsers] = useState([]);

    const [stateList, setStateList] = useState([]);
    const [allDistricts, setAllDistricts] = useState([]);
    const [districtList, setDistrictList] = useState([]);

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    useEffect(() => {
        const roleValue = localStorage.getItem("active");
        setRole(roleValue);
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoadingUser(true);

                const response = await axios.get(`${baseUrl}profile/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const fetchedFamilyId = response?.data?.data?.family_id || null;
                setFamilyId(fetchedFamilyId);
            } catch (error) {
                toast.error("Error fetching user data");
                setFamilyId(null);
            } finally {
                setLoadingUser(false);
            }
        };

        if (token && baseUrl) {
            fetchUserData();
        } else {
            setLoadingUser(false);
            toast.error("Token or base URL missing");
        }
    }, [token, baseUrl]);

    const fetchStates = async () => {
        try {
            const res = await axios.get(`${baseUrl}states/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStateList(res?.data?.data || res?.data || []);
        } catch {
            toast.error("Failed to load states");
        }
    };

    const fetchDistricts = async () => {
        try {
            const res = await axios.get(`${baseUrl}districts/add/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAllDistricts(res?.data?.data || res?.data || []);
        } catch {
            toast.error("Failed to load districts");
        }
    };

    const fetchFamilyUsers = async () => {
        try {
            const res = await axios.get(`${baseUrl}users/family/${familyId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setFamilyUsers(res?.data?.data || res?.data || []);
        } catch {
            toast.error("Failed to load family users");
        }
    };

    const fetchReport = async () => {
        if (!familyId) return;

        try {
            setLoadingReport(true);

            const selectedStateName =
                stateList.find((s) => String(s.id) === String(stateFilter))?.name || "";

            const selectedDistrictName =
                districtList.find((d) => String(d.id) === String(district))?.name || "";

            const response = await axios.get(`${baseUrl}sales/analysis/family/${familyId}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    search,
                    call_status: callStatus,
                    status: statusFilter,
                    state: selectedStateName,
                    district: selectedDistrictName,
                    created_by: createdBy,
                    start_date: startDate,
                    end_date: endDate,
                },
            });

            const summaryData = response?.data?.results || null;
            const reportData = response?.data?.results?.results || [];

            setSummary(summaryData);
            setData(Array.isArray(reportData) ? reportData : []);
        } catch (error) {
            toast.error("Failed to load report details");
            setSummary(null);
            setData([]);
        } finally {
            setLoadingReport(false);
        }
    };

    useEffect(() => {
        if (familyId) {
            fetchStates();
            fetchDistricts();
            fetchFamilyUsers();
            fetchReport();
        }
    }, [familyId]);

    useEffect(() => {
        if (!stateFilter) {
            setDistrictList([]);
            setDistrict("");
            return;
        }

        const filtered = allDistricts.filter(
            (d) => String(d.state) === String(stateFilter)
        );
        setDistrictList(filtered);
    }, [stateFilter, allDistricts]);

    const stateOptions = useMemo(() => {
        return stateList.map((s) => ({
            value: s.id,
            label: s.name,
        }));
    }, [stateList]);

    const districtOptions = useMemo(() => {
        return districtList.map((d) => ({
            value: d.id,
            label: d.name,
        }));
    }, [districtList]);

    const createdByOptions = useMemo(() => {
        return familyUsers.map((user) => ({
            value: user.id,
            label:
                user.full_name ||
                user.name ||
                user.username ||
                user.email ||
                `User ${user.id}`,
        }));
    }, [familyUsers]);

    const formatDateTime = (dateString) => {
        if (!dateString) return "-";

        const date = new Date(dateString);

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getCellStyle = (callStatusValue) => {
        const status = (callStatusValue || "").toLowerCase();

        if (status === "active") {
            return {
                backgroundColor: "#fff3cd",
            };
        }

        if (status === "productive") {
            return {
                backgroundColor: "#d4edda",
            };
        }

        return {};
    };

    const toggleViewModal = () => {
        const nextOpenState = !viewModal;
        setViewModal(nextOpenState);

        if (!nextOpenState) {
            setSelectedId(null);
            setSelectedReport(null);
            setSelectedStatus("");
            setLoadingDetails(false);
            setUpdatingStatus(false);
        }
    };

    const handleView = async (id) => {
        if (!id) {
            toast.error("Invalid report id");
            return;
        }

        try {
            setSelectedId(id);
            setViewModal(true);
            setLoadingDetails(true);
            setSelectedReport(null);
            setSelectedStatus("");

            const response = await axios.get(`${baseUrl}sales/analysis/edit/${id}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const details = response?.data?.data || response?.data || null;

            setSelectedReport(details);
            setSelectedStatus(details?.status || "");
        } catch (error) {
            toast.error(
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                "Failed to fetch report details"
            );
            setSelectedReport(null);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!selectedId) {
            toast.error("Invalid report id");
            return;
        }

        if (!selectedStatus) {
            toast.error("Please select a status");
            return;
        }

        try {
            setUpdatingStatus(true);

            const payload = {
                status: selectedStatus,
            };

            await axios.patch(`${baseUrl}sales/analysis/edit/${selectedId}/`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            toast.success("Status updated successfully");

            setSelectedReport((prev) =>
                prev
                    ? {
                        ...prev,
                        status: selectedStatus,
                    }
                    : prev
            );

            await fetchReport();
            toggleViewModal();
        } catch (error) {
            toast.error(
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                "Failed to update status"
            );
        } finally {
            setUpdatingStatus(false);
        }
    };

    const getAllowedStatusOptions = () => {
        const normalizedRole = (role || "").toUpperCase();

        const allOptions = [
            { value: "dsr created", label: "DSR Created" },
            { value: "dsr approved", label: "DSR Approved" },
            { value: "dsr confirmed", label: "DSR Confirmed" },
            { value: "dsr rejected", label: "DSR Rejected" },
        ];

        if (normalizedRole === "BDM") {
            return allOptions.filter((item) => item.value !== "dsr confirmed");
        }

        if (normalizedRole === "ASD") {
            return allOptions.filter((item) => item.value !== "dsr approved");
        }

        if (
            normalizedRole === "ADMIN" ||
            normalizedRole === "COO" ||
            normalizedRole === "CEO"
        ) {
            return allOptions;
        }

        return allOptions;
    };

    const statusOptions = getAllowedStatusOptions();

    const getDsrStatusBadgeStyle = (status) => {
        const normalizedStatus = (status || "").toLowerCase().trim();

        const baseStyle = {
            display: "inline-block",
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "600",
            lineHeight: "1.2",
            color: "#fff",
            textTransform: "lowercase",
        };

        if (normalizedStatus === "dsr created") {
            return {
                ...baseStyle,
                backgroundColor: "#556ee6",
            };
        }

        if (normalizedStatus === "dsr approved") {
            return {
                ...baseStyle,
                backgroundColor: "#5bc0de",
            };
        }

        if (normalizedStatus === "dsr confirmed") {
            return {
                ...baseStyle,
                backgroundColor: "#34c38f",
            };
        }

        if (normalizedStatus === "dsr rejected") {
            return {
                ...baseStyle,
                backgroundColor: "#f46a6a",
            };
        }

        return {
            ...baseStyle,
            backgroundColor: "#6c757d",
        };
    };

    const selectedStateLabel =
        stateOptions.find((s) => String(s.value) === String(stateFilter))?.label || "All States";

    const selectedDistrictLabel =
        districtOptions.find((d) => String(d.value) === String(district))?.label ||
        "All Districts";

    const exportToExcel = () => {
        try {
            if (!data || data.length === 0) {
                toast.error("No data to export");
                return;
            }

            const wb = XLSX.utils.book_new();
            const wsData = [];

            const createdByLabel =
                createdByOptions.find((u) => String(u.value) === String(createdBy))?.label || "All";

            // ================= TITLE =================
            wsData.push(["DAILY SALES REPORT - FAMILY WISE"]);
            wsData.push([]);

            // ================= FILTER SECTION =================
            wsData.push(["FILTERS", "", "", ""]);
            wsData.push(["Search", search || "All", "Call Status", callStatus || "All"]);
            wsData.push(["DSR Status", statusFilter || "All", "State", selectedStateLabel]);
            wsData.push(["District", selectedDistrictLabel, "Created By", createdByLabel]);
            wsData.push(["Start Date", startDate || "-", "End Date", endDate || "-"]);
            wsData.push([]);

            // ================= SUMMARY SECTION =================
            wsData.push([
                "SUMMARY",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
            ]);

            wsData.push([
                "Total",
                "Active",
                "Productive",
                "DSR Created",
                "DSR Approved",
                "DSR Confirmed",
                "DSR Rejected",
                "Call Duration",
                "Avg Call Duration",
                "8hrs Productivity %",
                "Total Invoice Amount",
            ]);

            wsData.push([
                summary?.count || 0,
                summary?.active_count || 0,
                summary?.productive_count || 0,
                summary?.dsr_created_count || 0,
                summary?.dsr_approved_count || 0,
                summary?.dsr_confirmed_count || 0,
                summary?.dsr_rejected_count || 0,
                summary?.total_call_duration || 0,
                summary?.average_call_duration || 0,
                summary?.call_duration_percentage_8hrs || 0,
                summary?.total_invoice_amount || 0,
            ]);

            wsData.push([]);

            // ================= TABLE HEADER =================
            wsData.push([
                "#",
                "Customer Name",
                "Phone",
                "Call Status",
                "Call Duration",
                "Invoice No",
                "Invoice Amount",
                "State",
                "District",
                "DSR Status",
                "Created By",
                "Created At",
                "Note",
            ]);

            // ================= TABLE BODY =================
            data.forEach((item, index) => {
                wsData.push([
                    index + 1,
                    item.customer_name || item.customer || "-",
                    item.phone || "-",
                    item.call_status || "-",
                    item.call_duration || "-",
                    item.invoice_number || item.invoice || "-",
                    item.invoice_amount || "-",
                    item.state_name || "-",
                    item.district_name || "-",
                    item.status || "-",
                    item.created_by_name || "-",
                    formatDateTime(item.created_at),
                    item.note || "-",
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            const range = XLSX.utils.decode_range(ws["!ref"]);

            // ================= MERGES =================
            ws["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }, // title
                { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },  // filters title
                { s: { r: 8, c: 0 }, e: { r: 8, c: 7 } },  // summary title
            ];

            // ================= COLUMN WIDTHS =================
            ws["!cols"] = [
                { wch: 8 },   // #
                { wch: 24 },  // customer
                { wch: 18 },  // phone
                { wch: 16 },  // call status
                { wch: 16 },  // duration
                { wch: 18 },  // invoice no
                { wch: 16 },  // invoice amount
                { wch: 18 },  // state
                { wch: 18 },  // district
                { wch: 18 },  // dsr status
                { wch: 22 },  // created by
                { wch: 22 },  // created at
                { wch: 30 },  // note
            ];

            // ================= DEFAULT STYLE =================
            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cellAddress]) continue;

                    ws[cellAddress].s = {
                        font: { name: "Calibri", sz: 11 },
                        alignment: {
                            vertical: "center",
                            horizontal: C === 11 ? "left" : "center",
                            wrapText: true,
                        },
                        border: {
                            top: { style: "thin", color: { rgb: "D9D9D9" } },
                            bottom: { style: "thin", color: { rgb: "D9D9D9" } },
                            left: { style: "thin", color: { rgb: "D9D9D9" } },
                            right: { style: "thin", color: { rgb: "D9D9D9" } },
                        },
                    };
                }
            }

            // ================= TITLE STYLE =================
            for (let C = 0; C <= 12; C++) {
                const cell = XLSX.utils.encode_cell({ r: 0, c: C });
                if (ws[cell]) {
                    ws[cell].s = {
                        font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
                        alignment: { horizontal: "center", vertical: "center" },
                        fill: { fgColor: { rgb: "1F4E79" } },
                        border: {
                            top: { style: "thin", color: { rgb: "1F4E79" } },
                            bottom: { style: "thin", color: { rgb: "1F4E79" } },
                            left: { style: "thin", color: { rgb: "1F4E79" } },
                            right: { style: "thin", color: { rgb: "1F4E79" } },
                        },
                    };
                }
            }

            // ================= SECTION TITLE STYLES =================
            [2, 8].forEach((row) => {
                for (let C = 0; C <= 12; C++) {
                    const cell = XLSX.utils.encode_cell({ r: row, c: C });
                    if (ws[cell]) {
                        ws[cell].s = {
                            font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "left", vertical: "center" },
                            fill: { fgColor: { rgb: "203A43" } },
                            border: {
                                top: { style: "thin", color: { rgb: "203A43" } },
                                bottom: { style: "thin", color: { rgb: "203A43" } },
                                left: { style: "thin", color: { rgb: "203A43" } },
                                right: { style: "thin", color: { rgb: "203A43" } },
                            },
                        };
                    }
                }
            });

            // ================= FILTER LABEL STYLE =================
            [3, 4, 5, 6].forEach((row) => {
                [0, 2].forEach((col) => {
                    const cell = XLSX.utils.encode_cell({ r: row, c: col });
                    if (ws[cell]) {
                        ws[cell].s = {
                            ...ws[cell].s,
                            font: { bold: true, color: { rgb: "000000" } },
                            fill: { fgColor: { rgb: "EAF4F4" } },
                        };
                    }
                });
            });

            // ================= SUMMARY HEADER STYLE =================
            for (let C = 0; C <= 10; C++) {
                const cell = XLSX.utils.encode_cell({ r: 9, c: C });
                if (ws[cell]) {
                    ws[cell].s = {
                        font: { bold: true, color: { rgb: "FFFFFF" } },
                        alignment: { horizontal: "center", vertical: "center", wrapText: true },
                        fill: { fgColor: { rgb: "28837A" } },
                        border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: "thin", color: { rgb: "000000" } },
                            left: { style: "thin", color: { rgb: "000000" } },
                            right: { style: "thin", color: { rgb: "000000" } },
                        },
                    };
                }
            }

            // ================= SUMMARY VALUE STYLE =================
            for (let C = 0; C <= 10; C++) {
                const cell = XLSX.utils.encode_cell({ r: 10, c: C });
                if (ws[cell]) {
                    ws[cell].s = {
                        font: { bold: true, sz: 12, color: { rgb: "000000" } },
                        alignment: { horizontal: "center", vertical: "center" },
                        fill: { fgColor: { rgb: "F8F9FA" } },
                        border: {
                            top: { style: "thin", color: { rgb: "D9D9D9" } },
                            bottom: { style: "thin", color: { rgb: "D9D9D9" } },
                            left: { style: "thin", color: { rgb: "D9D9D9" } },
                            right: { style: "thin", color: { rgb: "D9D9D9" } },
                        },
                    };
                }
            }

            // ================= TABLE HEADER STYLE =================
            const tableHeaderRow = 12;
            for (let C = 0; C <= 12; C++) {
                const cell = XLSX.utils.encode_cell({ r: tableHeaderRow, c: C });
                if (ws[cell]) {
                    ws[cell].s = {
                        font: { bold: true, color: { rgb: "FFFFFF" } },
                        alignment: { horizontal: "center", vertical: "center", wrapText: true },
                        fill: { fgColor: { rgb: "28837A" } },
                        border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: "thin", color: { rgb: "000000" } },
                            left: { style: "thin", color: { rgb: "000000" } },
                            right: { style: "thin", color: { rgb: "000000" } },
                        },
                    };
                }
            }

            // ================= DATA ROW COLORS =================
            const dataStartRow = 13;
            data.forEach((item, index) => {
                const excelRow = dataStartRow + index;
                const normalizedCallStatus = (item.call_status || "").toLowerCase();

                let fillColor = null;
                if (normalizedCallStatus === "active") {
                    fillColor = "FFF3CD";
                } else if (normalizedCallStatus === "productive") {
                    fillColor = "D4EDDA";
                }

                if (fillColor) {
                    for (let C = 0; C <= 12; C++) {
                        const cell = XLSX.utils.encode_cell({ r: excelRow, c: C });
                        if (ws[cell]) {
                            ws[cell].s = {
                                ...ws[cell].s,
                                fill: { fgColor: { rgb: fillColor } },
                            };
                        }
                    }
                }
            });

            XLSX.utils.book_append_sheet(wb, ws, "Daily Sales Report");
            XLSX.writeFile(wb, "Daily_Sales_Report_Family_Wise.xlsx");
            toast.success("Excel exported successfully");
        } catch (error) {
            toast.error("Excel export failed");
        }
    };

    const exportToPDF = () => {
        try {
            if (!data || data.length === 0) {
                toast.error("No data to export");
                return;
            }

            const doc = new jsPDF("landscape");

            doc.setFontSize(18);
            doc.setTextColor(31, 78, 121);
            doc.text("DAILY SALES REPORT - FAMILY WISE", 14, 15);

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Search: ${search || "All"}`, 14, 24);
            doc.text(`Call Status: ${callStatus || "All"}`, 70, 24);
            doc.text(`DSR Status: ${statusFilter || "All"}`, 125, 24);
            doc.text(`State: ${selectedStateLabel}`, 180, 24);
            doc.text(`District: ${selectedDistrictLabel}`, 240, 24);

            doc.text(`Start Date: ${startDate || "-"}`, 14, 31);
            doc.text(`End Date: ${endDate || "-"}`, 70, 31);
            doc.text(
                `Created By: ${createdByOptions.find((u) => String(u.value) === String(createdBy))?.label ||
                "All"
                }`,
                125,
                31
            );

            autoTable(doc, {
                startY: 38,
                head: [["Metric", "Value"]],
                body: [
                    ["Total", summary?.count || 0],
                    ["Active", summary?.active_count || 0],
                    ["Productive", summary?.productive_count || 0],
                    ["DSR Created", summary?.dsr_created_count || 0],
                    ["DSR Approved", summary?.dsr_approved_count || 0],
                    ["DSR Confirmed", summary?.dsr_confirmed_count || 0],
                    ["DSR Rejected", summary?.dsr_rejected_count || 0],
                    ["Total Call Duration", summary?.total_call_duration || 0],
                    ["Avg Call Duration", summary?.average_call_duration || 0],
                    ["8hrs Productivity %", summary?.call_duration_percentage_8hrs || 0],
                    ["Total Invoice Amount", summary?.total_invoice_amount || 0],
                ],
                theme: "grid",
                styles: {
                    fontSize: 9,
                    halign: "left",
                    valign: "middle",
                },
                headStyles: {
                    fillColor: [32, 58, 67],
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                },
                margin: { left: 14, right: 14 },
                tableWidth: 110,
            });

            const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 95;

            const head = [[
                "#",
                "Customer Name",
                "Phone",
                "Call Status",
                "Call Duration",
                "Invoice No",
                "Invoice Amount",
                "State",
                "District",
                "DSR Status",
                "Created By",
                "Created At",
            ]];

            const body = data.map((item, index) => [
                index + 1,
                item.customer_name || item.customer || "-",
                item.phone || "-",
                item.call_status || "-",
                item.call_duration || "-",
                item.invoice_number || item.invoice || "-",
                item.invoice_amount || "-",
                item.state_name || "-",
                item.district_name || "-",
                item.status || "-",
                item.created_by_name || "-",
                formatDateTime(item.created_at),
            ]);

            autoTable(doc, {
                startY: finalY,
                head,
                body,
                theme: "grid",
                styles: {
                    fontSize: 7.5,
                    halign: "center",
                    valign: "middle",
                    cellPadding: 2,
                },
                headStyles: {
                    fillColor: [40, 131, 122],
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                },
                didParseCell: function (hookData) {
                    if (hookData.section === "body") {
                        const row = data[hookData.row.index];
                        const status = (row?.call_status || "").toLowerCase();

                        if (status === "active") {
                            hookData.cell.styles.fillColor = [255, 243, 205];
                        }

                        if (status === "productive") {
                            hookData.cell.styles.fillColor = [212, 237, 218];
                        }
                    }
                },
            });

            doc.save("Daily_Sales_Report_Family_Wise.pdf");
            toast.success("PDF exported successfully");
        } catch (error) {
            toast.error("PDF export failed");
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <ToastContainer />
                {/* <Breadcrumbs
                    title="Daily Sales Report"
                    breadcrumbItem="View Daily Sales Report"
                /> */}

                {/* TOP HEADING SECTION */}
                <Card
                    style={{
                        borderRadius: "15px",
                        boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
                        marginBottom: "20px",
                        background: "linear-gradient(90deg, #0f2027, #203a43, #2c5364)",
                        color: "white",
                    }}
                >
                    <CardBody className="m-1">
                        <Row className="align-items-center">
                            <Col md="8">
                                <h2 style={{ margin: 0, fontWeight: "bold" }}>
                                    Daily Sales Report
                                </h2>
                                <p style={{ margin: 0, opacity: 0.85 }}>
                                    View family wise daily sales report and export to Excel / PDF
                                </p>
                            </Col>

                            <Col md="4" className="text-end">
                                <Button
                                    color="primary"
                                    style={{ marginRight: "10px", fontWeight: "bold" }}
                                    onClick={exportToExcel}
                                    disabled={loadingReport || data.length === 0}
                                >
                                    Export Excel
                                </Button>

                                <Button
                                    color="success"
                                    style={{ fontWeight: "bold" }}
                                    onClick={exportToPDF}
                                    disabled={loadingReport || data.length === 0}
                                >
                                    Export PDF
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                <Row>
                    <Col lg="12">
                        {/* FILTER CARD */}
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

                                <Row className="g-3">
                                    <Col md={3}>
                                        <Label style={{ fontWeight: "bold" }}>Search</Label>
                                        <Input
                                            placeholder="Search..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </Col>

                                    <Col md={2}>
                                        <Label style={{ fontWeight: "bold" }}>Call Status</Label>
                                        <Input
                                            type="select"
                                            value={callStatus}
                                            onChange={(e) => setCallStatus(e.target.value)}
                                        >
                                            <option value="">Call Status</option>
                                            <option value="productive">Productive</option>
                                            <option value="active">Active</option>
                                        </Input>
                                    </Col>

                                    <Col md={2}>
                                        <Label style={{ fontWeight: "bold" }}>DSR Status</Label>
                                        <Input
                                            type="select"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <option value="">DSR Status</option>
                                            <option value="dsr created">DSR Created</option>
                                            <option value="dsr approved">DSR Approved</option>
                                            <option value="dsr confirmed">DSR Confirmed</option>
                                            <option value="dsr rejected">DSR Rejected</option>
                                        </Input>
                                    </Col>

                                    <Col md={2}>
                                        <Label style={{ fontWeight: "bold", display: "block" }}>State</Label>
                                        <Select
                                            options={stateOptions}
                                            value={
                                                stateOptions.find(
                                                    (s) => String(s.value) === String(stateFilter)
                                                ) || null
                                            }
                                            onChange={(selected) => {
                                                const val = selected?.value || "";
                                                setStateFilter(val);
                                                setDistrict("");
                                            }}
                                            placeholder="Search State..."
                                            isClearable
                                        />
                                    </Col>

                                    <Col md={2}>
                                        <Label style={{ fontWeight: "bold", display: "block" }}>District</Label>
                                        <Select
                                            options={districtOptions}
                                            value={
                                                districtOptions.find(
                                                    (d) => String(d.value) === String(district)
                                                ) || null
                                            }
                                            onChange={(selected) => setDistrict(selected?.value || "")}
                                            placeholder="Search District..."
                                            isClearable
                                            isDisabled={!stateFilter}
                                        />
                                    </Col>

                                    <Col md={2}>
                                        <Label style={{ fontWeight: "bold", display: "block" }}>Created By</Label>
                                        <Select
                                            options={createdByOptions}
                                            value={
                                                createdByOptions.find(
                                                    (u) => String(u.value) === String(createdBy)
                                                ) || null
                                            }
                                            onChange={(selected) =>
                                                setCreatedBy(selected?.value || "")
                                            }
                                            placeholder="Created By..."
                                            isClearable
                                        />
                                    </Col>

                                    <Col md={2}>
                                        <Label style={{ fontWeight: "bold" }}>Start Date</Label>
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </Col>

                                    <Col md={2}>
                                        <Label style={{ fontWeight: "bold" }}>End Date</Label>
                                        <Input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </Col>

                                    <Col md={2} className="d-flex align-items-end">
                                        <Button
                                            color="info"
                                            style={{
                                                width: "100%",
                                                fontWeight: "bold",
                                                color: "white",
                                            }}
                                            onClick={fetchReport}
                                            disabled={loadingReport}
                                        >
                                            {loadingReport ? "Searching..." : "Search"}
                                        </Button>
                                    </Col>

                                    <Col md={2} className="d-flex align-items-end">
                                        <Button
                                            color="secondary"
                                            style={{
                                                width: "100%",
                                                fontWeight: "bold",
                                            }}
                                            onClick={() => {
                                                setSearch("");
                                                setCallStatus("");
                                                setStatusFilter("");
                                                setStateFilter("");
                                                setDistrict("");
                                                setCreatedBy("");
                                                setStartDate("");
                                                setEndDate("");
                                                setTimeout(fetchReport, 0);
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>

                        {/* REPORT TABLE CARD */}
                        <Card
                            className="print-section"
                            style={{
                                borderRadius: "12px",
                                boxShadow: "0px 3px 10px rgba(0,0,0,0.12)",
                            }}
                        >
                            <CardBody>
                                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                                    <CardTitle className="h4 mb-0">
                                        DAILY SALES REPORT - FAMILY WISE
                                    </CardTitle>

                                    <div className="d-flex align-items-center gap-3 flex-wrap">
                                        <div className="d-flex align-items-center">
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    width: "14px",
                                                    height: "14px",
                                                    backgroundColor: "#fff3cd",
                                                    border: "1px solid #d6c37a",
                                                    borderRadius: "2px",
                                                    marginRight: "6px",
                                                }}
                                            />
                                            <span>Active</span>
                                        </div>

                                        <div className="d-flex align-items-center">
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    width: "14px",
                                                    height: "14px",
                                                    backgroundColor: "#d4edda",
                                                    border: "1px solid #9fcca9",
                                                    borderRadius: "2px",
                                                    marginRight: "6px",
                                                }}
                                            />
                                            <span>Productive</span>
                                        </div>
                                    </div>
                                </div>

                                {loadingUser || loadingReport ? (
                                    <div className="text-center my-5">
                                        <Spinner color="primary" />
                                        <p className="mt-2 mb-0">Loading report...</p>
                                    </div>
                                ) : data.length === 0 ? (
                                    <div className="text-center my-4">
                                        <p className="mb-0">No report data found</p>
                                    </div>
                                ) : (
                                    <>
                                        <Row className="mb-4 g-3">
                                            <Col md="2">
                                                <div
                                                    style={{
                                                        background: "#f8f9fa",
                                                        borderRadius: "10px",
                                                        padding: "14px 16px",
                                                        fontWeight: "600",
                                                        border: "1px solid #e9ecef",
                                                        minHeight: "70px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <span style={{ fontSize: "13px", color: "#6c757d" }}>Total</span>
                                                    <span style={{ fontSize: "22px", color: "#212529" }}>
                                                        {summary?.count || 0}
                                                    </span>
                                                </div>
                                            </Col>

                                            <Col md="2">
                                                <div
                                                    style={{
                                                        background: "#fff3cd",
                                                        borderRadius: "10px",
                                                        padding: "14px 16px",
                                                        fontWeight: "600",
                                                        border: "1px solid #ffe69c",
                                                        minHeight: "70px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <span style={{ fontSize: "13px", color: "#856404" }}>Active</span>
                                                    <span style={{ fontSize: "22px", color: "#856404" }}>
                                                        {summary?.active_count || 0}
                                                    </span>
                                                </div>
                                            </Col>

                                            <Col md="2">
                                                <div
                                                    style={{
                                                        background: "#d4edda",
                                                        borderRadius: "10px",
                                                        padding: "14px 16px",
                                                        fontWeight: "600",
                                                        border: "1px solid #a3cfbb",
                                                        minHeight: "70px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <span style={{ fontSize: "13px", color: "#155724" }}>Productive</span>
                                                    <span style={{ fontSize: "22px", color: "#155724" }}>
                                                        {summary?.productive_count || 0}
                                                    </span>
                                                </div>
                                            </Col>

                                            <Col md="2">
                                                <div
                                                    style={{
                                                        background: "#d1ecf1",
                                                        borderRadius: "10px",
                                                        padding: "14px 16px",
                                                        fontWeight: "600",
                                                        border: "1px solid #abdde5",
                                                        minHeight: "70px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <span style={{ fontSize: "13px", color: "#0c5460" }}>DSR Created</span>
                                                    <span style={{ fontSize: "22px", color: "#0c5460" }}>
                                                        {summary?.dsr_created_count || 0}
                                                    </span>
                                                </div>
                                            </Col>

                                            <Col md="2">
                                                <div
                                                    style={{
                                                        background: "#cfe2ff",
                                                        borderRadius: "10px",
                                                        padding: "14px 16px",
                                                        fontWeight: "600",
                                                        border: "1px solid #9ec5fe",
                                                        minHeight: "70px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <span style={{ fontSize: "13px", color: "#084298" }}>DSR Approved</span>
                                                    <span style={{ fontSize: "22px", color: "#084298" }}>
                                                        {summary?.dsr_approved_count || 0}
                                                    </span>
                                                </div>
                                            </Col>

                                            <Col md="2">
                                                <div
                                                    style={{
                                                        background: "#e2d9f3",
                                                        borderRadius: "10px",
                                                        padding: "14px 16px",
                                                        fontWeight: "600",
                                                        border: "1px solid #cbbbe9",
                                                        minHeight: "70px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <span style={{ fontSize: "13px", color: "#5a3d8a" }}>DSR Confirmed</span>
                                                    <span style={{ fontSize: "22px", color: "#5a3d8a" }}>
                                                        {summary?.dsr_confirmed_count || 0}
                                                    </span>
                                                </div>
                                            </Col>

                                            <Col md="2">
                                                <div
                                                    style={{
                                                        background: "#f8d7da",
                                                        borderRadius: "10px",
                                                        padding: "14px 16px",
                                                        fontWeight: "600",
                                                        border: "1px solid #f1aeb5",
                                                        minHeight: "70px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <span style={{ fontSize: "13px", color: "#842029" }}>DSR Rejected</span>
                                                    <span style={{ fontSize: "22px", color: "#842029" }}>
                                                        {summary?.dsr_rejected_count || 0}
                                                    </span>
                                                </div>
                                            </Col>

                                            <Col md="2">
                                                <div
                                                    style={{
                                                        background: "#98c7c5",
                                                        borderRadius: "10px",
                                                        padding: "14px 16px",
                                                        fontWeight: "600",
                                                        border: "1px solid #00bdb4",
                                                        minHeight: "70px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <span style={{ fontSize: "13px", color: "#013432" }}>Call Duration</span>
                                                    <span style={{ fontSize: "22px", color: "#012c2a" }}>
                                                        {summary?.total_call_duration || 0}
                                                    </span>
                                                </div>
                                            </Col>
                                            <Col md="2">
                                                <div
                                                    style={{
                                                        background: "#f3e5f5",
                                                        borderRadius: "10px",
                                                        padding: "14px 16px",
                                                        border: "1px solid #ce93d8",
                                                        minHeight: "70px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <span style={{ fontSize: "13px", color: "#6a1b9a" }}>
                                                        Avg Call Duration
                                                    </span>
                                                    <span style={{ fontSize: "20px", color: "#6a1b9a", fontWeight: "bold" }}>
                                                        {summary?.average_call_duration || 0}
                                                    </span>
                                                </div>
                                            </Col>
                                            {/* <Col md="2">
                                                <div
                                                    style={{
                                                        background: "#fff8e1",
                                                        borderRadius: "10px",
                                                        padding: "14px 16px",
                                                        border: "1px solid #ffe082",
                                                        minHeight: "70px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <span style={{ fontSize: "13px", color: "#ff8f00" }}>
                                                        Avg Duration (8hrs)
                                                    </span>
                                                    <span style={{ fontSize: "20px", color: "#ff8f00", fontWeight: "bold" }}>
                                                        {summary?.call_duration_average_8hrs || 0}
                                                    </span>
                                                </div>
                                            </Col> */}

                                            <Col md="2">
                                                <div
                                                    style={{
                                                        background: "#e8eaf6",
                                                        borderRadius: "10px",
                                                        padding: "14px 16px",
                                                        border: "1px solid #c5cae9",
                                                        minHeight: "70px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <span style={{ fontSize: "13px", color: "#283593" }}>
                                                        8hrs Productivity %
                                                    </span>
                                                    <span style={{ fontSize: "20px", color: "#283593", fontWeight: "bold" }}>
                                                        {summary?.call_duration_percentage_8hrs || 0}%
                                                    </span>
                                                </div>
                                            </Col>


                                            <Col md="2">
                                                <div
                                                    style={{
                                                        background: "#e0f7fa",
                                                        borderRadius: "10px",
                                                        padding: "14px 16px",
                                                        border: "1px solid #80deea",
                                                        minHeight: "70px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <span style={{ fontSize: "13px", color: "#006064" }}>
                                                        Total Invoice Amount
                                                    </span>
                                                    <span style={{ fontSize: "20px", color: "#006064", fontWeight: "bold" }}>
                                                        {summary?.total_invoice_amount || 0}
                                                    </span>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Table bordered responsive hover className="align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Customer Name</th>
                                                    <th>Phone</th>
                                                    <th>Call Duration</th>
                                                    <th>Invoice No</th>
                                                    <th>Invoice Amount</th>
                                                    <th>State</th>
                                                    <th>District</th>
                                                    <th>Status</th>
                                                    <th>Created By</th>
                                                    <th>Created At</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((item, index) => {
                                                    const cellStyle = getCellStyle(item.call_status);

                                                    return (
                                                        <tr key={item.id || index}>
                                                            <td style={cellStyle}>{index + 1}</td>
                                                            <td style={cellStyle}>
                                                                {item.customer_name || item.customer || "-"}
                                                            </td>
                                                            <td style={cellStyle}>
                                                                {item.phone || "-"}
                                                            </td>
                                                            <td style={cellStyle}>
                                                                {item.call_duration || "-"}
                                                            </td>
                                                            <td style={cellStyle}>
                                                                {item.invoice_number || item.invoice || "-"}
                                                            </td>
                                                            <td style={cellStyle}>
                                                                {item.invoice_amount || "-"}
                                                            </td>
                                                            <td style={cellStyle}>
                                                                {item.state_name || "-"}
                                                            </td>
                                                            <td style={cellStyle}>
                                                                {item.district_name || "-"}
                                                            </td>
                                                            <td style={cellStyle}>
                                                                <span style={getDsrStatusBadgeStyle(item.status)}>
                                                                    {item.status || "-"}
                                                                </span>
                                                            </td>
                                                            <td style={cellStyle}>
                                                                {item.created_by_name || "-"}
                                                            </td>
                                                            <td style={cellStyle}>
                                                                {formatDateTime(item.created_at)}
                                                            </td>
                                                            <td style={cellStyle}>
                                                                <Button
                                                                    color="primary"
                                                                    size="sm"
                                                                    onClick={() => handleView(item.id)}
                                                                >
                                                                    View
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </Table>
                                    </>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Modal isOpen={viewModal} toggle={toggleViewModal} size="lg" centered>
                    <ModalHeader toggle={toggleViewModal}>
                        View Sales Report Details
                    </ModalHeader>

                    <ModalBody>
                        {loadingDetails ? (
                            <div className="text-center my-4">
                                <Spinner color="primary" />
                                <p className="mt-2 mb-0">Loading details...</p>
                            </div>
                        ) : selectedReport ? (
                            <Row>
                                <Col md="6" className="mb-3">
                                    <strong>Customer Name:</strong>{" "}
                                    {selectedReport.customer_name ||
                                        selectedReport.customer ||
                                        "-"}
                                </Col>

                                <Col md="6" className="mb-3">
                                    <strong>Call Duration:</strong>{" "}
                                    {selectedReport.call_duration || "-"}
                                </Col>

                                <Col md="6" className="mb-3">
                                    <strong>Phone:</strong>{" "}
                                    {selectedReport.phone || "-"}
                                </Col>

                                <Col md="6" className="mb-3">
                                    <strong>Invoice No:</strong>{" "}
                                    {selectedReport.invoice_number ||
                                        selectedReport.invoice ||
                                        "-"}
                                </Col>

                                <Col md="6" className="mb-3">
                                    <strong>Invoice Amount:</strong>{" "}
                                    {selectedReport.invoice_amount || "-"}
                                </Col>

                                <Col md="6" className="mb-3">
                                    <strong>State:</strong> {selectedReport.state_name || "-"}
                                </Col>

                                <Col md="6" className="mb-3">
                                    <strong>District:</strong>{" "}
                                    {selectedReport.district_name || "-"}
                                </Col>

                                <Col md="6" className="mb-3">
                                    <strong>Created By:</strong>{" "}
                                    {selectedReport.created_by_name || "-"}
                                </Col>

                                <Col md="6" className="mb-3">
                                    <strong>Created At:</strong>{" "}
                                    {formatDateTime(selectedReport.created_at)}
                                </Col>

                                <Col md="6" className="mb-3">
                                    <strong>Note:</strong> {selectedReport.note || "-"}
                                </Col>

                                <Col md="12" className="mb-3">
                                    <FormGroup>
                                        <Label for="statusSelect">
                                            <strong>Status</strong>
                                        </Label>
                                        <Input
                                            id="statusSelect"
                                            type="select"
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                        >
                                            <option value="">Select status</option>
                                            {statusOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </Input>
                                    </FormGroup>
                                </Col>
                            </Row>
                        ) : (
                            <div className="text-center my-4">
                                <p className="mb-0">No details found</p>
                            </div>
                        )}
                    </ModalBody>

                    <ModalFooter>
                        <Button color="secondary" onClick={toggleViewModal}>
                            Close
                        </Button>

                        <Button
                            color="success"
                            onClick={handleStatusUpdate}
                            disabled={updatingStatus || loadingDetails || !selectedReport}
                        >
                            {updatingStatus ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    Updating...
                                </>
                            ) : (
                                "Update Status"
                            )}
                        </Button>
                    </ModalFooter>
                </Modal>
            </div>
        </React.Fragment>
    );
};

export default ViewDailySalesReport;