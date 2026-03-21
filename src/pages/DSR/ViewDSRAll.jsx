import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
    Card,
    CardBody,
    Col,
    Row,
    Table,
    CardTitle,
    Spinner,
    Button,
    Input,
    Label
} from "reactstrap";
import Select from "react-select";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "react-toastify/dist/ReactToastify.css";

const ViewDSRAll = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [callStatus, setCallStatus] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [stateFilter, setStateFilter] = useState("");
    const [district, setDistrict] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [stateList, setStateList] = useState([]);
    const [allDistricts, setAllDistricts] = useState([]);
    const [districtList, setDistrictList] = useState([]);
    const [summary, setSummary] = useState(null);
    const [family, setFamily] = useState("");
    const [familyList, setFamilyList] = useState([]);
    const [staff, setStaff] = useState("");
    const [staffList, setStaffList] = useState([]);

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const stateOptions = useMemo(
        () =>
            stateList.map((s) => ({
                value: s.id,
                label: s.name,
            })),
        [stateList]
    );

    const districtOptions = useMemo(
        () =>
            districtList.map((d) => ({
                value: d.id,
                label: d.name,
            })),
        [districtList]
    );

    const familyOptions = useMemo(
        () =>
            familyList.map((f) => ({
                value: f.id,
                label: f.name,
            })),
        [familyList]
    );

    const staffOptions = useMemo(
        () =>
            staffList.map((s) => ({
                value: s.name,
                label: s.name,
            })),
        [staffList]
    );

    const fetchDSR = async () => {
        try {
            setLoading(true);

            const selectedStaffName = staff || "";

            const selectedStateName =
                stateList.find((s) => String(s.id) === String(stateFilter))?.name || "";


            const selectedDistrictName =
                districtList.find((d) => String(d.id) === String(district))?.name || "";


            const response = await axios.get(`${baseUrl}sales/analysis/all/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    search,
                    call_status: callStatus,
                    status: statusFilter,
                    state: selectedStateName,
                    district: selectedDistrictName,
                    family: family || "",
                    created_by: selectedStaffName,
                    start_date: startDate,
                    end_date: endDate,
                },
            });

            const summaryData = response?.data?.results || null;
            const reportData = response?.data?.results?.results || [];

            setSummary(summaryData);
            setData(Array.isArray(reportData) ? reportData : []);
        } catch {
            toast.error("Failed to load DSR data");
            setSummary(null);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

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

    const fetchFamilies = async () => {
        try {
            const res = await axios.get(`${baseUrl}familys/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFamilyList(res?.data?.data || res?.data || []);
        } catch {
            toast.error("Failed to load families");
        }
    };

    const fetchStaffByFamily = async (familyId) => {
        try {
            const res = await axios.get(`${baseUrl}users/family/${familyId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStaffList(res?.data?.data || res?.data || []);
        } catch {
            toast.error("Failed to load staff");
        }
    };

    useEffect(() => {
        fetchStates();
        fetchDistricts();
        fetchFamilies();
    }, []);

    useEffect(() => {
        fetchDSR();
    }, []);

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

    const formatDate = (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatDateTime = (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getRowStyle = (currentCallStatus) => {
        if ((currentCallStatus || "").toLowerCase() === "active") {
            return { backgroundColor: "#f5e6b3" };
        }
        if ((currentCallStatus || "").toLowerCase() === "productive") {
            return { backgroundColor: "#cfe6d3" };
        }
        return {};
    };

    const getStatusStyle = (status) => {
        const s = (status || "").toLowerCase();

        let bg = "#eef2f7";
        let color = "#374151";

        if (s === "dsr created") {
            bg = "#dbeafe";
            color = "#1d4ed8";
        } else if (s === "dsr approved") {
            bg = "#bbf7d0";
            color = "#166534";
        } else if (s === "dsr confirmed") {
            bg = "#ddd6fe";
            color = "#5b21b6";
        } else if (s === "dsr rejected") {
            bg = "#fecaca";
            color = "#991b1b";
        }

        return {
            backgroundColor: bg,
            color: color,
            padding: "4px 12px",
            borderRadius: "999px",
            display: "inline-block",
            fontSize: "12px",
            fontWeight: "600",
            textTransform: "capitalize",
        };
    };

    const selectedStateLabel =
        stateOptions.find((s) => String(s.value) === String(stateFilter))?.label || "All States";

    const selectedDistrictLabel =
        districtOptions.find((d) => String(d.value) === String(district))?.label ||
        "All Districts";

    const selectedFamilyLabel =
        familyOptions.find((f) => String(f.value) === String(family))?.label || "All Families";

    const selectedStaffLabel =
        staffOptions.find((s) => String(s.value) === String(staff))?.label || "All Staff";

    const exportToExcel = () => {
        try {
            if (!data || data.length === 0) {
                toast.error("No data to export");
                return;
            }

            const wb = XLSX.utils.book_new();
            const wsData = [];

            wsData.push(["ALL DAILY SALES REPORT"]);
            wsData.push([]);

            wsData.push(["FILTERS", "", "", ""]);
            wsData.push(["Search", search || "All", "Call Status", callStatus || "All"]);
            wsData.push(["DSR Status", statusFilter || "All", "State", selectedStateLabel]);
            wsData.push(["District", selectedDistrictLabel, "Family", selectedFamilyLabel]);
            wsData.push(["Staff", selectedStaffLabel, "Start Date", startDate || "-"]);
            wsData.push(["End Date", endDate || "-", "", ""]);
            wsData.push([]);

            wsData.push(["SUMMARY", "", "", "", "", "", "", ""]);
            wsData.push([
                "Total",
                "Active",
                "Productive",
                "DSR Created",
                "DSR Approved",
                "DSR Confirmed",
                "DSR Rejected",
                "Call Duration",
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
            ]);
            wsData.push([]);

            wsData.push([
                "#",
                "Customer",
                "Call Status",
                "DSR Status",
                "Duration",
                "State",
                "District",
                "Invoice",
                "Staff",
                "Date",
            ]);

            data.forEach((item, index) => {
                wsData.push([
                    index + 1,
                    item.customer_name || "-",
                    item.call_status || "-",
                    item.status || "-",
                    item.call_duration || "-",
                    item.state_name || "-",
                    item.district_name || "-",
                    item.invoice_number || "-",
                    item.created_by_name || "-",
                    formatDate(item.created_at),
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            const range = XLSX.utils.decode_range(ws["!ref"]);

            ws["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
                { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
                { s: { r: 9, c: 0 }, e: { r: 9, c: 7 } },
            ];

            ws["!cols"] = [
                { wch: 8 },
                { wch: 24 },
                { wch: 16 },
                { wch: 18 },
                { wch: 14 },
                { wch: 18 },
                { wch: 18 },
                { wch: 16 },
                { wch: 22 },
                { wch: 18 },
            ];

            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cellAddress]) continue;

                    ws[cellAddress].s = {
                        font: { name: "Calibri", sz: 11 },
                        alignment: {
                            vertical: "center",
                            horizontal: "center",
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

            for (let C = 0; C <= 9; C++) {
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

            [2, 9].forEach((row) => {
                for (let C = 0; C <= 9; C++) {
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

            [3, 4, 5, 6, 7].forEach((row) => {
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

            for (let C = 0; C <= 7; C++) {
                const headerCell = XLSX.utils.encode_cell({ r: 10, c: C });
                if (ws[headerCell]) {
                    ws[headerCell].s = {
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

                const valueCell = XLSX.utils.encode_cell({ r: 11, c: C });
                if (ws[valueCell]) {
                    ws[valueCell].s = {
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

            const tableHeaderRow = 13;
            for (let C = 0; C <= 9; C++) {
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

            const dataStartRow = 14;
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
                    for (let C = 0; C <= 9; C++) {
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

            XLSX.utils.book_append_sheet(wb, ws, "All DSR Report");
            XLSX.writeFile(wb, "All_Daily_Sales_Report.xlsx");
            toast.success("Excel exported successfully");
        } catch {
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
            doc.text("ALL DAILY SALES REPORT", 14, 15);

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Search: ${search || "All"}`, 14, 24);
            doc.text(`Call Status: ${callStatus || "All"}`, 70, 24);
            doc.text(`DSR Status: ${statusFilter || "All"}`, 125, 24);
            doc.text(`State: ${selectedStateLabel}`, 180, 24);
            doc.text(`District: ${selectedDistrictLabel}`, 240, 24);

            doc.text(`Family: ${selectedFamilyLabel}`, 14, 31);
            doc.text(`Staff: ${selectedStaffLabel}`, 70, 31);
            doc.text(`Start Date: ${startDate || "-"}`, 125, 31);
            doc.text(`End Date: ${endDate || "-"}`, 180, 31);

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
                    ["Call Duration", summary?.total_call_duration || 0],
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
                "Customer",
                "Call Status",
                "DSR Status",
                "Duration",
                "State",
                "District",
                "Invoice",
                "Staff",
                "Date",
            ]];

            const body = data.map((item, index) => [
                index + 1,
                item.customer_name || "-",
                item.call_status || "-",
                item.status || "-",
                item.call_duration || "-",
                item.state_name || "-",
                item.district_name || "-",
                item.invoice_number || "-",
                item.created_by_name || "-",
                formatDate(item.created_at),
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
                        const currentStatus = (row?.call_status || "").toLowerCase();

                        if (currentStatus === "active") {
                            hookData.cell.styles.fillColor = [245, 230, 179];
                        }

                        if (currentStatus === "productive") {
                            hookData.cell.styles.fillColor = [207, 230, 211];
                        }
                    }
                },
            });

            doc.save("All_Daily_Sales_Report.pdf");
            toast.success("PDF exported successfully");
        } catch {
            toast.error("PDF export failed");
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <ToastContainer />
                {/* <Breadcrumbs title="DSR" breadcrumbItem="All DSR" /> */}

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
                                    All Daily Sales Report
                                </h2>
                                <p style={{ margin: 0, opacity: 0.85 }}>
                                    View all daily sales reports and export to Excel / PDF
                                </p>
                            </Col>

                            <Col md="4" className="text-end">
                                <Button
                                    color="primary"
                                    style={{ marginRight: "10px", fontWeight: "bold" }}
                                    onClick={exportToExcel}
                                    disabled={loading || data.length === 0}
                                >
                                    Export Excel
                                </Button>

                                <Button
                                    color="success"
                                    style={{ fontWeight: "bold" }}
                                    onClick={exportToPDF}
                                    disabled={loading || data.length === 0}
                                >
                                    Export PDF
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                <Row>
                    <Col lg="12">
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

                                <Row className="mb-3 g-3">
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

                                                const filtered = allDistricts.filter(
                                                    (d) => String(d.state) === String(val)
                                                );
                                                setDistrictList(filtered);
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
                                        <Label style={{ fontWeight: "bold", display: "block" }}>Family</Label>
                                        <Select
                                            options={familyOptions}
                                            value={
                                                familyOptions.find(
                                                    (f) => String(f.value) === String(family)
                                                ) || null
                                            }
                                            onChange={(selected) => {
                                                const val = selected?.value || "";
                                                setFamily(val);
                                                setStaff("");
                                                setStaffList([]);

                                                if (val) {
                                                    fetchStaffByFamily(val);
                                                }
                                            }}
                                            placeholder="Search Family..."
                                            isClearable
                                        />
                                    </Col>

                                    <Col md={2}>
                                        <Label style={{ fontWeight: "bold", display: "block" }}>Staff</Label>
                                        <Select
                                            options={family ? staffOptions : []}
                                            value={
                                                staffOptions.find(
                                                    (s) => String(s.value) === String(staff)
                                                ) || null
                                            }
                                            onChange={(selected) => {
                                                const val = selected?.value || "";
                                                setStaff(val);
                                            }} placeholder="Search Staff..."
                                            noOptionsMessage={() =>
                                                family ? "No staff found" : "Please select a family first"
                                            }
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
                                        <Button color="success" style={{ width: "100%", fontWeight: "bold" }} onClick={fetchDSR}>
                                            Apply
                                        </Button>
                                    </Col>

                                    <Col md={2} className="d-flex align-items-end">
                                        <Button
                                            color="secondary"
                                            style={{ width: "100%", fontWeight: "bold" }}
                                            onClick={() => {
                                                setSearch("");
                                                setCallStatus("");
                                                setStatusFilter("");
                                                setStateFilter("");
                                                setDistrict("");
                                                setStartDate("");
                                                setEndDate("");
                                                setFamily("");
                                                setStaff("");
                                                setStaffList([]);
                                                setTimeout(fetchDSR, 0);
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>

                        <Card
                            style={{
                                borderRadius: "12px",
                                boxShadow: "0px 3px 10px rgba(0,0,0,0.12)",
                            }}
                        >
                            <CardBody>
                                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
                                    <CardTitle className="h4 mb-0">
                                        ALL DAILY SALES REPORT
                                    </CardTitle>

                                    <div className="d-flex align-items-center gap-3">
                                        <div className="d-flex align-items-center">
                                            <span
                                                style={{
                                                    width: "14px",
                                                    height: "14px",
                                                    backgroundColor: "#f5e6b3",
                                                    border: "1px solid #d6c37a",
                                                    borderRadius: "3px",
                                                    marginRight: "6px",
                                                    display: "inline-block",
                                                }}
                                            />
                                            <span style={{ fontSize: "13px" }}>Active</span>
                                        </div>

                                        <div className="d-flex align-items-center">
                                            <span
                                                style={{
                                                    width: "14px",
                                                    height: "14px",
                                                    backgroundColor: "#cfe6d3",
                                                    border: "1px solid #9fcca9",
                                                    borderRadius: "3px",
                                                    marginRight: "6px",
                                                    display: "inline-block",
                                                }}
                                            />
                                            <span style={{ fontSize: "13px" }}>Productive</span>
                                        </div>
                                    </div>
                                </div>

                                {summary && (
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
                                        <Col md="2">
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
                                        </Col>

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
                                )}

                                {loading ? (
                                    <div className="text-center my-5">
                                        <Spinner color="primary" />
                                    </div>
                                ) : data.length === 0 ? (
                                    <div className="text-center my-4">
                                        <p className="mb-0">No report data found</p>
                                    </div>
                                ) : (
                                    <Table bordered responsive hover className="align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>#</th>
                                                <th>Customer</th>
                                                <th>DSR Status</th>
                                                <th>Duration</th>
                                                <th>State</th>
                                                <th>District</th>
                                                <th>Invoice</th>
                                                <th>Staff</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((item, index) => (
                                                <tr key={item.id || index}>
                                                    <td style={getRowStyle(item.call_status)}>{index + 1}</td>
                                                    <td style={getRowStyle(item.call_status)}>{item.customer_name || "-"}</td>
                                                    <td style={getRowStyle(item.call_status)}>
                                                        <span style={getStatusStyle(item.status)}>
                                                            {item.status || "-"}
                                                        </span>
                                                    </td>
                                                    <td style={getRowStyle(item.call_status)}>{item.call_duration || "-"}</td>
                                                    <td style={getRowStyle(item.call_status)}>{item.state_name || "-"}</td>
                                                    <td style={getRowStyle(item.call_status)}>{item.district_name || "-"}</td>
                                                    <td style={getRowStyle(item.call_status)}>{item.invoice_number || "-"}</td>
                                                    <td style={getRowStyle(item.call_status)}>{item.created_by_name || "-"}</td>
                                                    <td style={getRowStyle(item.call_status)}>{formatDate(item.created_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </React.Fragment>
    );
};

export default ViewDSRAll;