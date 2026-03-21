import React, { useEffect, useState, useMemo } from "react";
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
    CardTitle,
    Table,
    Spinner,
    Button,
    Input,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Label,
} from "reactstrap";
import "react-toastify/dist/ReactToastify.css";

const ViewDSR = () => {
    const [summary, setSummary] = useState(null);
    const [dsrList, setDsrList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [callStatus, setCallStatus] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [state, setState] = useState("");
    const [district, setDistrict] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [stateList, setStateList] = useState([]);
    const [allDistricts, setAllDistricts] = useState([]);
    const [districtList, setDistrictList] = useState([]);
    const [customerList, setCustomerList] = useState([]);
    const [invoiceList, setInvoiceList] = useState([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({
        customer_id: "",
        call_status: "",
        invoice: "",
    });

    const token = localStorage.getItem("token");
    const BASE_URL = import.meta.env.VITE_APP_KEY || "/api/";

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

    const fetchDSR = async () => {
        try {
            setLoading(true);

            const selectedStateName =
                stateList.find((s) => String(s.id) === String(state))?.name || "";

            const selectedDistrictName =
                districtList.find((d) => String(d.id) === String(district))?.name || "";

            const response = await axios.get(`${BASE_URL}sales/analysis/add/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    search,
                    call_status: callStatus,
                    status: statusFilter,
                    state: selectedStateName,
                    district: selectedDistrictName,
                    start_date: startDate,
                    end_date: endDate,
                },
            });
            console.log("DSR API Response:", response.data);


            const summaryData = response?.data?.results || null;
            const data = response?.data?.results?.results || [];

            setSummary(summaryData);
            setDsrList(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error("Failed to load DSR data");
            setSummary(null);
            setDsrList([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStates = async () => {
        try {
            const res = await axios.get(`${BASE_URL}states/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStateList(res?.data?.data || res?.data || []);
        } catch {
            toast.error("Failed to load States");
        }
    };

    const fetchDistricts = async () => {
        try {
            const res = await axios.get(`${BASE_URL}districts/add/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = res?.data?.data || res?.data || [];
            setAllDistricts(data);
        } catch {
            toast.error("Failed to load Districts");
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await axios.get(`${BASE_URL}staff/customers/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCustomerList(res?.data?.data || res?.data || []);
        } catch {
            toast.error("Failed to load customers");
        }
    };

    const fetchInvoices = async () => {
        try {
            const res = await axios.get(`${BASE_URL}my/orders/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setInvoiceList(res?.data?.results || res?.data?.data || res?.data || []);
        } catch {
            toast.error("Failed to load invoices");
        }
    };

    useEffect(() => {
        fetchStates();
        fetchDistricts();
        fetchCustomers();
        fetchInvoices();
    }, []);

    useEffect(() => {
        fetchDSR();
    }, [stateList]);

    useEffect(() => {
        if (!state) {
            setDistrictList([]);
            setDistrict("");
            return;
        }

        const filtered = allDistricts.filter(
            (d) => String(d.state) === String(state)
        );
        setDistrictList(filtered);
    }, [state, allDistricts]);

    const handleView = async (item) => {
        try {
            setLoading(true);

            const response = await axios.get(`${BASE_URL}sales/analysis/edit/${item.id}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = response?.data?.data || response?.data;

            setSelectedItem(data);

            setEditMode(false);
            setEditData({
                customer_id: data.customer_id,
                call_status: data.call_status || "",
                invoice: data.invoice || "",
            });

            setModalOpen(true);
        } catch {
            toast.error("Failed to load detail");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedItem) return;

        try {
            await axios.delete(`${BASE_URL}sales/analysis/edit/${selectedItem.id}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            toast.success("Deleted successfully");
            setModalOpen(false);
            setSelectedItem(null);
            fetchDSR();
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    const handleUpdate = async () => {
        try {
            await axios.put(
                `${BASE_URL}sales/analysis/edit/${selectedItem.id}/`,
                {
                    customer: Number(editData.customer_id),
                    call_status: editData.call_status,
                    invoice: invoiceList.find((i) => i.invoice === editData.invoice)?.id,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setSelectedItem((prev) => ({
                ...prev,
                customer_name:
                    customerList.find((c) => String(c.id) === String(editData.customer_id))
                        ?.name || "-",
                call_status: editData.call_status,
                invoice_number: editData.invoice,
            }));

            toast.success("Updated successfully");
            setEditMode(false);
            fetchDSR();
        } catch (error) {
            toast.error("Update failed");
        }
    };

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

    const getCallStatusPillStyle = (status) => {
        const normalized = (status || "").toLowerCase();

        if (normalized === "productive") {
            return {
                backgroundColor: "#d7efe1",
                color: "#1f6f4a",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "600",
                display: "inline-block",
            };
        }

        return {
            backgroundColor: "#f4e7c5",
            color: "#8a6d1d",
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: "600",
            display: "inline-block",
        };
    };

    const getDsrStatusPillStyle = (status) => {
        const normalized = (status || "").toLowerCase();

        if (normalized === "dsr confirmed") {
            return {
                backgroundColor: "#ece3f7",
                color: "#5e3ea1",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "600",
                display: "inline-block",
            };
        }

        if (normalized === "dsr rejected") {
            return {
                backgroundColor: "#f8d7da",
                color: "#842029",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "600",
                display: "inline-block",
            };
        }

        if (normalized === "dsr created") {
            return {
                backgroundColor: "#dce9f7",
                color: "#1f4e8c",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "600",
                display: "inline-block",
            };
        }

        return {
            backgroundColor: "#e2f4e8",
            color: "#2e7d32",
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: "600",
            display: "inline-block",
        };
    };

    const selectedStateLabel =
        stateOptions.find((s) => String(s.value) === String(state))?.label || "All States";

    const selectedDistrictLabel =
        districtOptions.find((d) => String(d.value) === String(district))?.label ||
        "All Districts";

    const exportToExcel = () => {
        try {
            if (!dsrList || dsrList.length === 0) {
                toast.error("No data to export");
                return;
            }

            const wb = XLSX.utils.book_new();
            const wsData = [];

            wsData.push(["MY DAILY SALES REPORT"]);
            wsData.push([]);

            wsData.push(["FILTERS", "", "", ""]);
            wsData.push(["Search", search || "All", "Call Status", callStatus || "All"]);
            wsData.push(["DSR Status", statusFilter || "All", "State", selectedStateLabel]);
            wsData.push(["District", selectedDistrictLabel, "Start Date", startDate || "-"]);
            wsData.push(["End Date", endDate || "-", "", ""]);
            wsData.push([]);

            wsData.push(["SUMMARY", "", "", "", "", "", ""]);
            wsData.push([
                "Active",
                "Productive",
                "DSR Created",
                "DSR Approved",
                "DSR Confirmed",
                "DSR Rejected",
                "Total",
            ]);
            wsData.push([
                summary?.active_count || 0,
                summary?.productive_count || 0,
                summary?.dsr_created_count || 0,
                summary?.dsr_approved_count || 0,
                summary?.dsr_confirmed_count || 0,
                summary?.dsr_rejected_count || 0,
                summary?.count || dsrList.length || 0,
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
                "Note",
                "Date",
            ]);

            dsrList.forEach((item, index) => {
                wsData.push([
                    index + 1,
                    item.customer_name || "-",
                    item.call_status || "-",
                    item.status || "-",
                    item.call_duration || "-",
                    item.state_name || "-",
                    item.district_name || "-",
                    item.invoice_number || "-",
                    item.note || "-",
                    formatDate(item.created_at),
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            const range = XLSX.utils.decode_range(ws["!ref"]);

            ws["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
                { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
                { s: { r: 8, c: 0 }, e: { r: 8, c: 6 } },
            ];

            ws["!cols"] = [
                { wch: 8 },
                { wch: 24 },
                { wch: 16 },
                { wch: 18 },
                { wch: 14 },
                { wch: 18 },
                { wch: 18 },
                { wch: 18 },
                { wch: 28 },
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
                            horizontal: C === 8 ? "left" : "center",
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

            [2, 8].forEach((row) => {
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

            for (let C = 0; C <= 6; C++) {
                const headerCell = XLSX.utils.encode_cell({ r: 9, c: C });
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

                const valueCell = XLSX.utils.encode_cell({ r: 10, c: C });
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

            const tableHeaderRow = 12;
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

            const dataStartRow = 13;
            dsrList.forEach((item, index) => {
                const excelRow = dataStartRow + index;
                const normalizedCallStatus = (item.call_status || "").toLowerCase();

                let fillColor = null;
                if (normalizedCallStatus === "active") {
                    fillColor = "F4E7C5";
                } else if (normalizedCallStatus === "productive") {
                    fillColor = "D7EFE1";
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

            XLSX.utils.book_append_sheet(wb, ws, "My DSR Report");
            XLSX.writeFile(wb, "My_Daily_Sales_Report.xlsx");
            toast.success("Excel exported successfully");
        } catch {
            toast.error("Excel export failed");
        }
    };

    const exportToPDF = () => {
        try {
            if (!dsrList || dsrList.length === 0) {
                toast.error("No data to export");
                return;
            }

            const doc = new jsPDF("landscape");

            doc.setFontSize(18);
            doc.setTextColor(31, 78, 121);
            doc.text("MY DAILY SALES REPORT", 14, 15);

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Search: ${search || "All"}`, 14, 24);
            doc.text(`Call Status: ${callStatus || "All"}`, 70, 24);
            doc.text(`DSR Status: ${statusFilter || "All"}`, 125, 24);
            doc.text(`State: ${selectedStateLabel}`, 180, 24);
            doc.text(`District: ${selectedDistrictLabel}`, 240, 24);

            doc.text(`Start Date: ${startDate || "-"}`, 14, 31);
            doc.text(`End Date: ${endDate || "-"}`, 70, 31);

            autoTable(doc, {
                startY: 38,
                head: [["Metric", "Value"]],
                body: [
                    ["Active", summary?.active_count || 0],
                    ["Productive", summary?.productive_count || 0],
                    ["DSR Created", summary?.dsr_created_count || 0],
                    ["DSR Approved", summary?.dsr_approved_count || 0],
                    ["DSR Confirmed", summary?.dsr_confirmed_count || 0],
                    ["DSR Rejected", summary?.dsr_rejected_count || 0],
                    ["Total", summary?.count || dsrList.length || 0],
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
                "Note",
                "Date",
            ]];

            const body = dsrList.map((item, index) => [
                index + 1,
                item.customer_name || "-",
                item.call_status || "-",
                item.status || "-",
                item.call_duration || "-",
                item.state_name || "-",
                item.district_name || "-",
                item.invoice_number || "-",
                item.note || "-",
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
                        const row = dsrList[hookData.row.index];
                        const currentStatus = (row?.call_status || "").toLowerCase();

                        if (currentStatus === "active") {
                            hookData.cell.styles.fillColor = [244, 231, 197];
                        }

                        if (currentStatus === "productive") {
                            hookData.cell.styles.fillColor = [215, 239, 225];
                        }
                    }
                },
            });

            doc.save("My_Daily_Sales_Report.pdf");
            toast.success("PDF exported successfully");
        } catch {
            toast.error("PDF export failed");
        }
    };

    return (
        <React.Fragment>
            <ToastContainer />

            <div className="page-content">
                {/* <Breadcrumbs title="Daily Sales Report" breadcrumbItem="DSR List" /> */}

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
                                    My Daily Sales Report
                                </h2>
                                <p style={{ margin: 0, opacity: 0.85 }}>
                                    View your daily sales reports and export to Excel / PDF
                                </p>
                            </Col>

                            <Col md="4" className="text-end">
                                <Button
                                    color="primary"
                                    style={{ marginRight: "10px", fontWeight: "bold" }}
                                    onClick={exportToExcel}
                                    disabled={loading || dsrList.length === 0}
                                >
                                    Export Excel
                                </Button>

                                <Button
                                    color="success"
                                    style={{ fontWeight: "bold" }}
                                    onClick={exportToPDF}
                                    disabled={loading || dsrList.length === 0}
                                >
                                    Export PDF
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                <Row>
                    <Col lg={12}>
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

                                <Row className="align-items-end g-3">
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
                                            value={stateOptions.find((s) => s.value === state) || null}
                                            onChange={(selected) => {
                                                const val = selected?.value || "";
                                                setState(val);
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
                                            value={districtOptions.find((d) => d.value === district) || null}
                                            onChange={(selected) => setDistrict(selected?.value || "")}
                                            placeholder="Search District..."
                                            isClearable
                                            isDisabled={!state}
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

                                    <Col md={2}>
                                        <Button color="success" onClick={fetchDSR} style={{ width: "100%" }}>
                                            Apply
                                        </Button>
                                    </Col>

                                    <Col md={2}>
                                        <Button
                                            color="secondary"
                                            style={{ width: "100%" }}
                                            onClick={() => {
                                                setSearch("");
                                                setCallStatus("");
                                                setStatusFilter("");
                                                setState("");
                                                setDistrict("");
                                                setStartDate("");
                                                setEndDate("");
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
                                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                                    <CardTitle className="h4 mb-0">
                                        MY DAILY SALES REPORT
                                    </CardTitle>

                                    <div className="d-flex align-items-center gap-3 flex-wrap">
                                        <div className="d-flex align-items-center">
                                            <span
                                                style={{
                                                    width: "14px",
                                                    height: "14px",
                                                    backgroundColor: "#f4e7c5",
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
                                                    backgroundColor: "#d7efe1",
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
                                                    background: "#f4e7c5",
                                                    borderRadius: "10px",
                                                    padding: "14px 16px",
                                                    border: "1px solid #e6d39a",
                                                    minHeight: "70px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <span style={{ fontSize: "13px", color: "#8a6d1d" }}>Active</span>
                                                <span style={{ fontSize: "22px", color: "#8a6d1d", fontWeight: "bold" }}>
                                                    {summary?.active_count || 0}
                                                </span>
                                            </div>
                                        </Col>

                                        <Col md="2">
                                            <div
                                                style={{
                                                    background: "#d7efe1",
                                                    borderRadius: "10px",
                                                    padding: "14px 16px",
                                                    border: "1px solid #b8ddc2",
                                                    minHeight: "70px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <span style={{ fontSize: "13px", color: "#1f6f4a" }}>Productive</span>
                                                <span style={{ fontSize: "22px", color: "#1f6f4a", fontWeight: "bold" }}>
                                                    {summary?.productive_count || 0}
                                                </span>
                                            </div>
                                        </Col>

                                        <Col md="2">
                                            <div
                                                style={{
                                                    background: "#dce9f7",
                                                    borderRadius: "10px",
                                                    padding: "14px 16px",
                                                    border: "1px solid #bfd7f0",
                                                    minHeight: "70px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <span style={{ fontSize: "13px", color: "#1f4e8c" }}>DSR Created</span>
                                                <span style={{ fontSize: "22px", color: "#1f4e8c", fontWeight: "bold" }}>
                                                    {summary?.dsr_created_count || 0}
                                                </span>
                                            </div>
                                        </Col>

                                        <Col md="2">
                                            <div
                                                style={{
                                                    background: "#e2f4e8",
                                                    borderRadius: "10px",
                                                    padding: "14px 16px",
                                                    border: "1px solid #c8e7d3",
                                                    minHeight: "70px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <span style={{ fontSize: "13px", color: "#2e7d32" }}>DSR Approved</span>
                                                <span style={{ fontSize: "22px", color: "#2e7d32", fontWeight: "bold" }}>
                                                    {summary?.dsr_approved_count || 0}
                                                </span>
                                            </div>
                                        </Col>

                                        <Col md="2">
                                            <div
                                                style={{
                                                    background: "#ece3f7",
                                                    borderRadius: "10px",
                                                    padding: "14px 16px",
                                                    border: "1px solid #d9c9ee",
                                                    minHeight: "70px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <span style={{ fontSize: "13px", color: "#5e3ea1" }}>DSR Confirmed</span>
                                                <span style={{ fontSize: "22px", color: "#5e3ea1", fontWeight: "bold" }}>
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
                                                    border: "1px solid #efb8bf",
                                                    minHeight: "70px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <span style={{ fontSize: "13px", color: "#842029" }}>DSR Rejected</span>
                                                <span style={{ fontSize: "22px", color: "#842029", fontWeight: "bold" }}>
                                                    {summary?.dsr_rejected_count || 0}
                                                </span>
                                            </div>
                                        </Col>
                                        <Col md="2">
                                            <div
                                                style={{
                                                    background: "#ffe5ec",
                                                    borderRadius: "10px",
                                                    padding: "14px 16px",
                                                    border: "1px solid #ffb3c6",
                                                    minHeight: "70px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <span style={{ fontSize: "13px", color: "#b03060" }}>
                                                    Total Call Duration
                                                </span>
                                                <span style={{ fontSize: "20px", color: "#b03060", fontWeight: "bold" }}>
                                                    {summary?.total_call_duration || "00:00:00"}
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
                                ) : dsrList.length === 0 ? (
                                    <div className="text-center my-4">
                                        <p className="mb-0">No report data found</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <Table className="table table-bordered table-striped align-middle">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Customer</th>
                                                    <th>Status</th>
                                                    <th>DSR Status</th>
                                                    <th>Duration</th>
                                                    <th>State</th>
                                                    <th>District</th>
                                                    <th>Invoice</th>
                                                    <th>Note</th>
                                                    <th>Date</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {dsrList.map((item, index) => (
                                                    <tr key={item.id}>
                                                        <td>{index + 1}</td>
                                                        <td>{item.customer_name || "-"}</td>

                                                        <td>
                                                            <span style={getCallStatusPillStyle(item.call_status)}>
                                                                {item.call_status || "-"}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span style={getDsrStatusPillStyle(item.status)}>
                                                                {item.status || "-"}
                                                            </span>
                                                        </td>

                                                        <td>{item.call_duration || "-"}</td>
                                                        <td>{item.state_name || "-"}</td>
                                                        <td>{item.district_name || "-"}</td>
                                                        <td>{item.invoice_number || "-"}</td>
                                                        <td>{item.note || "-"}</td>
                                                        <td>{formatDate(item.created_at)}</td>

                                                        <td>
                                                            <Button
                                                                size="sm"
                                                                color="primary"
                                                                onClick={() => handleView(item)}
                                                            >
                                                                View
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {selectedItem && (
                    <Modal
                        isOpen={modalOpen}
                        toggle={() => setModalOpen(!modalOpen)}
                        size="lg"
                        centered
                    >
                        <ModalHeader toggle={() => setModalOpen(false)}>
                            <span className="fw-bold">DSR Details</span>
                        </ModalHeader>

                        <ModalBody>
                            <div className="px-1">
                                <Row className="gy-4">
                                    <Col md={6}>
                                        <div>
                                            <div className="text-muted mb-1" style={{ fontSize: "13px" }}>
                                                Customer
                                            </div>

                                            {editMode && editData.call_status === "productive" ? (
                                                <Select
                                                    options={customerList.map((c) => ({
                                                        value: c.id,
                                                        label: c.name,
                                                    }))}
                                                    value={
                                                        customerList
                                                            .map((c) => ({ value: c.id, label: c.name }))
                                                            .find(
                                                                (opt) =>
                                                                    String(opt.value) ===
                                                                    String(editData.customer_id)
                                                            ) || null
                                                    }
                                                    onChange={(selected) =>
                                                        setEditData({
                                                            ...editData,
                                                            customer_id: selected?.value || "",
                                                        })
                                                    }
                                                    placeholder="Search Customer..."
                                                    isClearable
                                                    styles={{
                                                        control: (base) => ({
                                                            ...base,
                                                            backgroundColor: "#fff",
                                                            borderColor: "#ced4da",
                                                            minHeight: "38px",
                                                        }),
                                                        menu: (base) => ({
                                                            ...base,
                                                            zIndex: 9999,
                                                        }),
                                                    }}
                                                />
                                            ) : (
                                                <div className="fw-semibold" style={{ fontSize: "16px" }}>
                                                    {selectedItem?.customer_name || "-"}
                                                </div>
                                            )}
                                        </div>
                                    </Col>

                                    <Col md={6}>
                                        <div>
                                            <div className="text-muted mb-1" style={{ fontSize: "13px" }}>
                                                Call Status
                                            </div>

                                            {editMode ? (
                                                <Input
                                                    type="select"
                                                    value={editData.call_status}
                                                    onChange={(e) => {
                                                        const value = e.target.value;

                                                        setEditData({
                                                            ...editData,
                                                            call_status: value,
                                                            customer_id:
                                                                value === "active"
                                                                    ? ""
                                                                    : editData.customer_id,
                                                        });
                                                    }}
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="productive">Productive</option>
                                                </Input>
                                            ) : (
                                                <div>
                                                    <span
                                                        className={`badge px-3 py-2 fs-6 ${selectedItem?.call_status === "productive"
                                                                ? "bg-success"
                                                                : "bg-warning"
                                                            }`}
                                                    >
                                                        {selectedItem?.call_status}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </Col>

                                    <Col md={6}>
                                        <div>
                                            <div className="text-muted mb-1" style={{ fontSize: "13px" }}>
                                                DSR Status
                                            </div>

                                            <span
                                                className={`badge px-3 py-2 fs-6 ${selectedItem.status === "dsr confirmed"
                                                        ? "bg-success"
                                                        : selectedItem.status === "dsr rejected"
                                                            ? "bg-danger"
                                                            : selectedItem.status === "dsr created"
                                                                ? "bg-primary"
                                                                : "bg-warning"
                                                    }`}
                                            >
                                                {selectedItem.status}
                                            </span>
                                        </div>
                                    </Col>

                                    <Col md={6}>
                                        <div>
                                            <div className="text-muted mb-1" style={{ fontSize: "13px" }}>
                                                Duration
                                            </div>
                                            <div className="fw-semibold fs-5">
                                                {selectedItem.call_duration || "-"}
                                            </div>
                                        </div>
                                    </Col>

                                    <Col md={6}>
                                        <div>
                                            <div className="text-muted mb-1">State</div>
                                            <div className="fw-semibold fs-5">
                                                {selectedItem.state_name || "-"}
                                            </div>
                                        </div>
                                    </Col>

                                    <Col md={6}>
                                        <div>
                                            <div className="text-muted mb-1">District</div>
                                            <div className="fw-semibold fs-5">
                                                {selectedItem.district_name || "-"}
                                            </div>
                                        </div>
                                    </Col>

                                    {(editMode
                                        ? editData.call_status === "productive"
                                        : selectedItem?.call_status === "productive") && (
                                            <Col md={6}>
                                                <div>
                                                    <div className="text-muted mb-1">Invoice</div>

                                                    {editMode ? (
                                                        <Select
                                                            options={invoiceList.map((inv) => ({
                                                                value: inv.invoice,
                                                                label: inv.invoice,
                                                            }))}
                                                            value={
                                                                invoiceList
                                                                    .map((inv) => ({
                                                                        value: inv.invoice,
                                                                        label: inv.invoice,
                                                                    }))
                                                                    .find(
                                                                        (opt) =>
                                                                            opt.value === editData.invoice
                                                                    ) || null
                                                            }
                                                            onChange={(selected) =>
                                                                setEditData({
                                                                    ...editData,
                                                                    invoice: selected?.value || "",
                                                                })
                                                            }
                                                            placeholder="Search Invoice..."
                                                            isClearable
                                                            styles={{
                                                                control: (base) => ({
                                                                    ...base,
                                                                    backgroundColor: "#fff",
                                                                    borderColor: "#ced4da",
                                                                    minHeight: "38px",
                                                                }),
                                                                menu: (base) => ({
                                                                    ...base,
                                                                    zIndex: 9999,
                                                                }),
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="fw-semibold fs-5">
                                                            {selectedItem?.invoice_number || "-"}
                                                        </div>
                                                    )}
                                                </div>
                                            </Col>
                                        )}

                                    <Col md={12}>
                                        <div>
                                            <div className="text-muted mb-1">Note</div>
                                            <div className="fw-semibold fs-5">
                                                {selectedItem.note || "-"}
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        </ModalBody>

                        <ModalFooter className="d-flex justify-content-between">
                            {!editMode && (
                                <div>
                                    <Button color="danger" onClick={handleDelete}>
                                        Delete
                                    </Button>
                                </div>
                            )}

                            <div>
                                {selectedItem?.status === "dsr created" &&
                                    selectedItem?.call_status !== "productive" &&
                                    (editMode ? (
                                        <>
                                            <Button color="success" onClick={handleUpdate}>
                                                Save
                                            </Button>{" "}
                                            <Button color="secondary" onClick={() => setEditMode(false)}>
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <Button color="primary" onClick={() => setEditMode(true)}>
                                            Edit
                                        </Button>
                                    ))}
                            </div>
                        </ModalFooter>
                    </Modal>
                )}
            </div>
        </React.Fragment>
    );
};

export default ViewDSR;