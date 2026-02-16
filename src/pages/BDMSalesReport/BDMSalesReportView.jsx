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
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Form,
    Label,
    Input,
} from "reactstrap";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import * as XLSX from "xlsx-js-style";

const BDMSalesViewReport = () => {
    const [stateList, setStateList] = useState([]);
    const [invoiceList, setInvoiceList] = useState([]);
    const [bdoList, setBdoList] = useState([]);
    const [reportList, setReportList] = useState([]);
    const [editModal, setEditModal] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [selectedState, setSelectedState] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedBDO, setSelectedBDO] = useState(null);
    const token = localStorage.getItem("token");
    document.title = "BEPOSOFT | BDO's Daily Sales Report";

    const [formData, setFormData] = useState({
        volume: "",
        average: "",
        call_duration: "",
        micro_dealer: "",
        new_coach: "",
        note: "",
    });


    const fetchStates = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}states/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setStateList(response?.data?.data || []);
        } catch (error) {
            toast.error("Failed to load States");
        }
    };


    const fetchInvoice = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}all/orders/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setInvoiceList(response.data || []);
        } catch (error) {
            toast.error("Failed to load Orders");
        }
    };


    const fetchBDOUsers = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}staffs/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const allStaffs = response?.data?.data || [];

            // filter only BDO
            const bdoOnly = allStaffs.filter((user) => user.designation === "BDO");

            setBdoList(bdoOnly);
        } catch (error) {
            toast.error("Failed to load BDO Users");
        }
    };


    const fetchReport = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}monthly/sales/report/bdm/bdo/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setReportList(response.data.data || []);
        } catch (error) {
            toast.error("Failed to load Reports");
        }
    };


    const fetchSingleReport = async (id) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}monthly/sales/report/bdm/bdo/update/${id}/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = response.data.data || response.data;

            setFormData({
                volume: data.volume || "",
                average: data.average || "",
                call_duration: data.call_duration || "",
                micro_dealer: data.micro_dealer || "no",
                new_coach: data.new_coach || "no",
                note: data.note || "",
            });
        } catch (error) {
            toast.error("Failed to load report details");
        }
    };

    const openEditModal = async (item) => {
        setSelectedReportId(item.id);
        setEditModal(true);

        await fetchSingleReport(item.id);
    };

    const closeEditModal = () => {
        setEditModal(false);
        setSelectedReportId(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const updateReport = async () => {
        if (!selectedReportId) {
            toast.error("No report selected");
            return;
        }

        try {
            await axios.put(
                `${import.meta.env.VITE_APP_KEY}monthly/sales/report/bdm/bdo/update/${selectedReportId}/`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Report updated successfully");
            closeEditModal();
            fetchReport();
        } catch (error) {
            toast.error("Failed to update report");
        }
    };

    const deleteReport = async (id) => {
        if (!window.confirm("Are you sure you want to delete this report?")) {
            return;
        }

        try {
            await axios.delete(
                `${import.meta.env.VITE_APP_KEY}monthly/sales/report/bdm/bdo/update/${id}/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Report deleted successfully");
            fetchReport();
        } catch (error) {
            toast.error("Failed to delete report");
        }
    };

    useEffect(() => {
        fetchStates();
        fetchInvoice();
        fetchBDOUsers();
        fetchReport();
    }, []);

    // dropdown
    const stateOptions = stateList.map((s) => ({
        value: s.id,
        label: s.name,
    }));

    const invoiceOptions = invoiceList.map((inv) => ({
        value: inv.id,
        label: inv.invoice,
    }));

    const bdoOptions = bdoList.map((bdo) => ({
        value: bdo.id,
        label: bdo.name,
    }));

    const filteredReports = useMemo(() => {
        return reportList.filter((item) => {
            const matchState = selectedState ? item.state === selectedState.value : true;
            const matchInvoice = selectedInvoice ? item.invoice === selectedInvoice.value : true;
            const matchBDO = selectedBDO ? item.bdo === selectedBDO.value : true;

            return matchState && matchInvoice && matchBDO;
        });
    }, [reportList, selectedState, selectedInvoice, selectedBDO]);

    const exportToExcel = () => {
        try {
            if (!filteredReports || filteredReports.length === 0) {
                toast.error("No data to export");
                return;
            }

            const wb = XLSX.utils.book_new();
            const wsData = [];

            // ================= TITLE =================
            wsData.push(["Monthly Sales Report (BDM - BDO)"]);
            wsData.push([]);

            // ================= HEADER =================
            wsData.push([
                "#",
                "BDO",
                "State",
                "Invoice",
                "VL",
                "AVG",
                "CD",
                "MD",
                "NC",
                "Note",
                "Created At",
            ]);

            // ================= DATA =================
            filteredReports.forEach((item, index) => {
                wsData.push([
                    index + 1,
                    item.bdo_name || "",
                    item.state_name || "",
                    item.invoice_no || "",
                    item.volume || 0,
                    item.average || 0,
                    item.call_duration || 0,
                    item.micro_dealer ? item.micro_dealer.toUpperCase() : "",
                    item.new_coach ? item.new_coach.toUpperCase() : "",
                    item.note || "",
                    item.created_at ? new Date(item.created_at).toLocaleString() : "",
                ]);
            });

            // ================= FINAL SUMMARY CALCULATION =================
            let totalVolume = 0;
            let totalAverage = 0;
            let totalCallDuration = 0;
            let mdYes = 0;
            let mdNo = 0;
            let ncYes = 0;
            let ncNo = 0;

            filteredReports.forEach((item) => {
                totalVolume += Number(item.volume || 0);
                totalAverage += Number(item.average || 0);
                totalCallDuration += Number(item.call_duration || 0);

                if ((item.micro_dealer || "").toLowerCase() === "yes") mdYes++;
                else mdNo++;

                if ((item.new_coach || "").toLowerCase() === "yes") ncYes++;
                else ncNo++;
            });

            // ================= ADD FINAL SUMMARY =================
            wsData.push([]);
            wsData.push(["FINAL SUMMARY"]);
            wsData.push([
                "Total Reports",
                "Total VL",
                "Total AVG",
                "Total CD",
                "MD YES",
                "MD NO",
                "NC YES",
                "NC NO",
            ]);
            wsData.push([
                filteredReports.length,
                totalVolume,
                totalAverage,
                totalCallDuration,
                mdYes,
                mdNo,
                ncYes,
                ncNo,
            ]);

            // ================= BDO WISE SUMMARY =================
            const bdoGrouped = {};

            filteredReports.forEach((item) => {
                const bdoName = item.bdo_name || "Unknown";

                if (!bdoGrouped[bdoName]) {
                    bdoGrouped[bdoName] = {
                        name: bdoName,
                        total_volume: 0,
                        total_average: 0,
                        total_call_duration: 0,
                        md_yes: 0,
                        md_no: 0,
                        nc_yes: 0,
                        nc_no: 0,
                        total_reports: 0,
                    };
                }

                bdoGrouped[bdoName].total_volume += Number(item.volume || 0);
                bdoGrouped[bdoName].total_average += Number(item.average || 0);
                bdoGrouped[bdoName].total_call_duration += Number(item.call_duration || 0);

                if ((item.micro_dealer || "").toLowerCase() === "yes") bdoGrouped[bdoName].md_yes++;
                else bdoGrouped[bdoName].md_no++;

                if ((item.new_coach || "").toLowerCase() === "yes") bdoGrouped[bdoName].nc_yes++;
                else bdoGrouped[bdoName].nc_no++;

                bdoGrouped[bdoName].total_reports++;
            });

            const bdoSummaryList = Object.values(bdoGrouped);

            wsData.push([]);
            wsData.push(["BDO WISE SUMMARY"]);
            wsData.push([
                "#",
                "BDO Name",
                "Total VL",
                "Total AVG",
                "Total CD",
                "MD YES",
                "MD NO",
                "NC YES",
                "NC NO",
                "Total Reports",
            ]);

            bdoSummaryList.forEach((bdo, index) => {
                wsData.push([
                    index + 1,
                    bdo.name,
                    bdo.total_volume,
                    bdo.total_average,
                    bdo.total_call_duration,
                    bdo.md_yes,
                    bdo.md_no,
                    bdo.nc_yes,
                    bdo.nc_no,
                    bdo.total_reports,
                ]);
            });

            // ================= STATE WISE SUMMARY =================
            const stateGrouped = {};

            filteredReports.forEach((item) => {
                const stateName = item.state_name || "Unknown";

                if (!stateGrouped[stateName]) {
                    stateGrouped[stateName] = {
                        name: stateName,
                        total_volume: 0,
                        total_average: 0,
                        total_call_duration: 0,
                        md_yes: 0,
                        md_no: 0,
                        nc_yes: 0,
                        nc_no: 0,
                        total_reports: 0,
                    };
                }

                stateGrouped[stateName].total_volume += Number(item.volume || 0);
                stateGrouped[stateName].total_average += Number(item.average || 0);
                stateGrouped[stateName].total_call_duration += Number(item.call_duration || 0);

                if ((item.micro_dealer || "").toLowerCase() === "yes") stateGrouped[stateName].md_yes++;
                else stateGrouped[stateName].md_no++;

                if ((item.new_coach || "").toLowerCase() === "yes") stateGrouped[stateName].nc_yes++;
                else stateGrouped[stateName].nc_no++;

                stateGrouped[stateName].total_reports++;
            });

            const stateSummaryList = Object.values(stateGrouped);

            wsData.push([]);
            wsData.push(["STATE WISE SUMMARY"]);
            wsData.push([
                "#",
                "State Name",
                "Total VL",
                "Total AVG",
                "Total CD",
                "MD YES",
                "MD NO",
                "NC YES",
                "NC NO",
                "Total Reports",
            ]);

            stateSummaryList.forEach((st, index) => {
                wsData.push([
                    index + 1,
                    st.name,
                    st.total_volume,
                    st.total_average,
                    st.total_call_duration,
                    st.md_yes,
                    st.md_no,
                    st.nc_yes,
                    st.nc_no,
                    st.total_reports,
                ]);
            });

            // ================= CREATE SHEET =================
            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // ================= COLUMN WIDTH =================
            ws["!cols"] = [
                { wch: 5 },
                { wch: 20 },
                { wch: 20 },
                { wch: 20 },
                { wch: 10 },
                { wch: 10 },
                { wch: 10 },
                { wch: 10 },
                { wch: 10 },
                { wch: 30 },
                { wch: 22 },
            ];

            // ================= COLORS =================
            const headingColor = "00BDB4";
            const titleColor = "1F4E79";
            const yesColor = "28A745";
            const noColor = "FF0000";
            const summaryBg = "D9E1F2";

            const range = XLSX.utils.decode_range(ws["!ref"]);

            // ================= ROW CALCULATIONS =================
            const reportHeaderRow = 2;
            const reportDataStartRow = 3;
            const reportDataEndRow = reportDataStartRow + filteredReports.length - 1;

            const summaryTitleRow = reportDataEndRow + 2;
            const summaryHeaderRow = reportDataEndRow + 3;
            const summaryValueRow = reportDataEndRow + 4;

            const bdoTitleRow = summaryValueRow + 2;
            const bdoHeaderRow = summaryValueRow + 3;
            const bdoDataStartRow = summaryValueRow + 4;
            const bdoDataEndRow = bdoDataStartRow + bdoSummaryList.length - 1;

            const stateTitleRow = bdoDataEndRow + 2;
            const stateHeaderRow = bdoDataEndRow + 3;
            const stateDataStartRow = bdoDataEndRow + 4;
            const stateDataEndRow = stateDataStartRow + stateSummaryList.length - 1;

            // ================= MERGES =================
            ws["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // main title
                { s: { r: summaryTitleRow, c: 0 }, e: { r: summaryTitleRow, c: 7 } }, // final summary title
                { s: { r: bdoTitleRow, c: 0 }, e: { r: bdoTitleRow, c: 9 } }, // bdo title
                { s: { r: stateTitleRow, c: 0 }, e: { r: stateTitleRow, c: 9 } }, // state title
            ];

            // ================= STYLE LOOP =================
            for (let R = range.s.r; R <= range.e.r; R++) {
                for (let C = range.s.c; C <= range.e.c; C++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    const cell = ws[cellAddress];
                    if (!cell) continue;

                    // Default Style
                    cell.s = {
                        font: { name: "Calibri", sz: 11 },
                        alignment: { horizontal: "center", vertical: "center", wrapText: true },
                        border: {
                            top: { style: "thin", color: { rgb: "AAAAAA" } },
                            bottom: { style: "thin", color: { rgb: "AAAAAA" } },
                            left: { style: "thin", color: { rgb: "AAAAAA" } },
                            right: { style: "thin", color: { rgb: "AAAAAA" } },
                        },
                    };

                    // ================= TITLE ROW =================
                    if (R === 0) {
                        cell.s = {
                            font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: titleColor } },
                        };
                    }

                    // ================= REPORT HEADER =================
                    if (R === reportHeaderRow) {
                        cell.s = {
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: headingColor } },
                            border: {
                                top: { style: "thin", color: { rgb: "000000" } },
                                bottom: { style: "thin", color: { rgb: "000000" } },
                                left: { style: "thin", color: { rgb: "000000" } },
                                right: { style: "thin", color: { rgb: "000000" } },
                            },
                        };
                    }

                    // ================= MD COLUMN YES/NO =================
                    if (C === 7 && R >= reportDataStartRow && R <= reportDataEndRow) {
                        if (cell.v === "YES") {
                            cell.s = {
                                ...cell.s,
                                font: { bold: true, color: { rgb: "FFFFFF" } },
                                fill: { fgColor: { rgb: yesColor } },
                            };
                        } else if (cell.v === "NO") {
                            cell.s = {
                                ...cell.s,
                                font: { bold: true, color: { rgb: "FFFFFF" } },
                                fill: { fgColor: { rgb: noColor } },
                            };
                        }
                    }

                    // ================= NC COLUMN YES/NO =================
                    if (C === 8 && R >= reportDataStartRow && R <= reportDataEndRow) {
                        if (cell.v === "YES") {
                            cell.s = {
                                ...cell.s,
                                font: { bold: true, color: { rgb: "FFFFFF" } },
                                fill: { fgColor: { rgb: yesColor } },
                            };
                        } else if (cell.v === "NO") {
                            cell.s = {
                                ...cell.s,
                                font: { bold: true, color: { rgb: "FFFFFF" } },
                                fill: { fgColor: { rgb: noColor } },
                            };
                        }
                    }

                    // ================= NOTE LEFT ALIGN =================
                    if (C === 9 && R >= reportDataStartRow && R <= reportDataEndRow) {
                        cell.s = {
                            ...cell.s,
                            alignment: { horizontal: "left", vertical: "center", wrapText: true },
                        };
                    }

                    // ================= FINAL SUMMARY TITLE =================
                    if (R === summaryTitleRow) {
                        cell.s = {
                            font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: titleColor } },
                        };
                    }

                    // ================= FINAL SUMMARY HEADER =================
                    if (R === summaryHeaderRow) {
                        cell.s = {
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: headingColor } },
                        };
                    }

                    // ================= FINAL SUMMARY VALUES =================
                    if (R === summaryValueRow) {
                        cell.s = {
                            font: { bold: true, sz: 12, color: { rgb: "000000" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: summaryBg } },
                        };
                    }

                    // ================= BDO SUMMARY TITLE =================
                    if (R === bdoTitleRow) {
                        cell.s = {
                            font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: titleColor } },
                        };
                    }

                    // ================= BDO SUMMARY HEADER =================
                    if (R === bdoHeaderRow) {
                        cell.s = {
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: headingColor } },
                        };
                    }

                    // ================= STATE SUMMARY TITLE =================
                    if (R === stateTitleRow) {
                        cell.s = {
                            font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: titleColor } },
                        };
                    }

                    // ================= STATE SUMMARY HEADER =================
                    if (R === stateHeaderRow) {
                        cell.s = {
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: headingColor } },
                        };
                    }

                    // ================= BDO + STATE YES/NO COLORS =================
                    if (
                        (R >= bdoDataStartRow && R <= bdoDataEndRow) ||
                        (R >= stateDataStartRow && R <= stateDataEndRow)
                    ) {
                        // YES columns -> MD YES (5) and NC YES (7)
                        if (C === 5 || C === 7) {
                            cell.s = {
                                ...cell.s,
                                font: { bold: true, color: { rgb: "FFFFFF" } },
                                fill: { fgColor: { rgb: yesColor } },
                            };
                        }

                        // NO columns -> MD NO (6) and NC NO (8)
                        if (C === 6 || C === 8) {
                            cell.s = {
                                ...cell.s,
                                font: { bold: true, color: { rgb: "FFFFFF" } },
                                fill: { fgColor: { rgb: noColor } },
                            };
                        }
                    }
                }
            }

            // ================= APPEND SHEET =================
            XLSX.utils.book_append_sheet(wb, ws, "BDM_BDO_Report");

            XLSX.writeFile(
                wb,
                `BDM_BDO_MonthlySalesReport_${new Date().toISOString().slice(0, 10)}.xlsx`
            );

            toast.success("Excel Exported Successfully");
        } catch (error) {
            console.log(error);
            toast.error("Excel export failed");
        }
    };

    const exportToExcelSummary = () => {
        try {
            if (!filteredReports || filteredReports.length === 0) {
                toast.error("No data to export");
                return;
            }

            // ================= GROUP BY BDO + STATE =================
            const groupedData = {};

            filteredReports.forEach((item) => {
                const key = `${item.bdo_name}_${item.state_name}`;

                if (!groupedData[key]) {
                    groupedData[key] = {
                        bdo_name: item.bdo_name || "",
                        state_name: item.state_name || "",
                        total_volume: 0,
                        total_average: 0,
                        total_call_duration: 0,
                        md_yes: 0,
                        md_no: 0,
                        nc_yes: 0,
                        nc_no: 0,
                        total_reports: 0,
                    };
                }

                groupedData[key].total_volume += Number(item.volume || 0);
                groupedData[key].total_average += Number(item.average || 0);
                groupedData[key].total_call_duration += Number(item.call_duration || 0);

                if ((item.micro_dealer || "").toLowerCase() === "yes") groupedData[key].md_yes += 1;
                else groupedData[key].md_no += 1;

                if ((item.new_coach || "").toLowerCase() === "yes") groupedData[key].nc_yes += 1;
                else groupedData[key].nc_no += 1;

                groupedData[key].total_reports += 1;
            });

            const summaryList = Object.values(groupedData);

            // ================= FINAL SUMMARY TOTAL =================
            let totalVolume = 0;
            let totalAverage = 0;
            let totalCallDuration = 0;
            let mdYes = 0;
            let mdNo = 0;
            let ncYes = 0;
            let ncNo = 0;

            summaryList.forEach((row) => {
                totalVolume += Number(row.total_volume || 0);
                totalAverage += Number(row.total_average || 0);
                totalCallDuration += Number(row.total_call_duration || 0);

                mdYes += Number(row.md_yes || 0);
                mdNo += Number(row.md_no || 0);

                ncYes += Number(row.nc_yes || 0);
                ncNo += Number(row.nc_no || 0);
            });

            // ================= BDO WISE SUMMARY =================
            const bdoGrouped = {};

            summaryList.forEach((row) => {
                const bdoName = row.bdo_name || "Unknown";

                if (!bdoGrouped[bdoName]) {
                    bdoGrouped[bdoName] = {
                        name: bdoName,
                        total_volume: 0,
                        total_average: 0,
                        total_call_duration: 0,
                        md_yes: 0,
                        md_no: 0,
                        nc_yes: 0,
                        nc_no: 0,
                        total_reports: 0,
                    };
                }

                bdoGrouped[bdoName].total_volume += Number(row.total_volume || 0);
                bdoGrouped[bdoName].total_average += Number(row.total_average || 0);
                bdoGrouped[bdoName].total_call_duration += Number(row.total_call_duration || 0);

                bdoGrouped[bdoName].md_yes += Number(row.md_yes || 0);
                bdoGrouped[bdoName].md_no += Number(row.md_no || 0);

                bdoGrouped[bdoName].nc_yes += Number(row.nc_yes || 0);
                bdoGrouped[bdoName].nc_no += Number(row.nc_no || 0);

                bdoGrouped[bdoName].total_reports += Number(row.total_reports || 0);
            });

            const bdoSummaryList = Object.values(bdoGrouped);

            // ================= STATE WISE SUMMARY =================
            const stateGrouped = {};

            summaryList.forEach((row) => {
                const stateName = row.state_name || "Unknown";

                if (!stateGrouped[stateName]) {
                    stateGrouped[stateName] = {
                        name: stateName,
                        total_volume: 0,
                        total_average: 0,
                        total_call_duration: 0,
                        md_yes: 0,
                        md_no: 0,
                        nc_yes: 0,
                        nc_no: 0,
                        total_reports: 0,
                    };
                }

                stateGrouped[stateName].total_volume += Number(row.total_volume || 0);
                stateGrouped[stateName].total_average += Number(row.total_average || 0);
                stateGrouped[stateName].total_call_duration += Number(row.total_call_duration || 0);

                stateGrouped[stateName].md_yes += Number(row.md_yes || 0);
                stateGrouped[stateName].md_no += Number(row.md_no || 0);

                stateGrouped[stateName].nc_yes += Number(row.nc_yes || 0);
                stateGrouped[stateName].nc_no += Number(row.nc_no || 0);

                stateGrouped[stateName].total_reports += Number(row.total_reports || 0);
            });

            const stateSummaryList = Object.values(stateGrouped);

            // ================= EXCEL DATA =================
            const wb = XLSX.utils.book_new();
            const wsData = [];

            // ================= TITLE =================
            wsData.push(["BDO Monthly Sales Summary (State-wise)"]);
            wsData.push([]);

            // ================= HEADER =================
            wsData.push([
                "#",
                "BDO Name",
                "State",
                "Total VL",
                "Total AVG",
                "Total CD",
                "MD YES",
                "MD NO",
                "NC YES",
                "NC NO",
                "Total Reports",
            ]);

            // ================= MAIN SUMMARY DATA =================
            summaryList.forEach((row, index) => {
                wsData.push([
                    index + 1,
                    row.bdo_name,
                    row.state_name,
                    row.total_volume,
                    row.total_average,
                    row.total_call_duration,
                    row.md_yes,
                    row.md_no,
                    row.nc_yes,
                    row.nc_no,
                    row.total_reports,
                ]);
            });

            // ================= FINAL SUMMARY SECTION =================
            wsData.push([]);
            wsData.push(["FINAL SUMMARY"]);
            wsData.push([
                "Total Rows",
                "Total VL",
                "Total AVG",
                "Total CD",
                "MD YES",
                "MD NO",
                "NC YES",
                "NC NO",
            ]);
            wsData.push([
                summaryList.length,
                totalVolume,
                totalAverage,
                totalCallDuration,
                mdYes,
                mdNo,
                ncYes,
                ncNo,
            ]);

            // ================= BDO WISE SUMMARY SECTION =================
            wsData.push([]);
            wsData.push(["BDO WISE SUMMARY"]);
            wsData.push([
                "#",
                "BDO Name",
                "Total VL",
                "Total AVG",
                "Total CD",
                "MD YES",
                "MD NO",
                "NC YES",
                "NC NO",
                "Total Reports",
            ]);

            bdoSummaryList.forEach((bdo, index) => {
                wsData.push([
                    index + 1,
                    bdo.name,
                    bdo.total_volume,
                    bdo.total_average,
                    bdo.total_call_duration,
                    bdo.md_yes,
                    bdo.md_no,
                    bdo.nc_yes,
                    bdo.nc_no,
                    bdo.total_reports,
                ]);
            });

            // ================= STATE WISE SUMMARY SECTION =================
            wsData.push([]);
            wsData.push(["STATE WISE SUMMARY"]);
            wsData.push([
                "#",
                "State Name",
                "Total VL",
                "Total AVG",
                "Total CD",
                "MD YES",
                "MD NO",
                "NC YES",
                "NC NO",
                "Total Reports",
            ]);

            stateSummaryList.forEach((st, index) => {
                wsData.push([
                    index + 1,
                    st.name,
                    st.total_volume,
                    st.total_average,
                    st.total_call_duration,
                    st.md_yes,
                    st.md_no,
                    st.nc_yes,
                    st.nc_no,
                    st.total_reports,
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // ================= MERGES =================
            const titleRow = 0;
            ws["!merges"] = [
                { s: { r: titleRow, c: 0 }, e: { r: titleRow, c: 10 } },
            ];

            // ================= COLUMN WIDTH =================
            ws["!cols"] = [
                { wch: 5 },
                { wch: 22 },
                { wch: 18 },
                { wch: 12 },
                { wch: 12 },
                { wch: 12 },
                { wch: 10 },
                { wch: 10 },
                { wch: 10 },
                { wch: 10 },
                { wch: 15 },
            ];

            // ================= COLORS =================
            const titleColor = "1F4E79";
            const headingColor = "00BDB4";
            const greenColor = "28A745";
            const redColor = "FF0000";
            const summaryBg = "D9E1F2";

            const range = XLSX.utils.decode_range(ws["!ref"]);

            // ================= ROW CALCULATIONS =================
            const mainHeaderRow = 2;
            const mainDataStartRow = 3;
            const mainDataEndRow = mainDataStartRow + summaryList.length - 1;

            const finalSummaryTitleRow = mainDataEndRow + 2;
            const finalSummaryHeaderRow = mainDataEndRow + 3;
            const finalSummaryValueRow = mainDataEndRow + 4;

            const bdoTitleRow = finalSummaryValueRow + 2;
            const bdoHeaderRow = finalSummaryValueRow + 3;
            const bdoDataStartRow = finalSummaryValueRow + 4;
            const bdoDataEndRow = bdoDataStartRow + bdoSummaryList.length - 1;

            const stateTitleRow = bdoDataEndRow + 2;
            const stateHeaderRow = bdoDataEndRow + 3;
            const stateDataStartRow = bdoDataEndRow + 4;
            const stateDataEndRow = stateDataStartRow + stateSummaryList.length - 1;

            // ================= MERGE FINAL SUMMARY TITLE =================
            ws["!merges"].push({
                s: { r: finalSummaryTitleRow, c: 0 },
                e: { r: finalSummaryTitleRow, c: 7 },
            });

            // ================= MERGE BDO TITLE =================
            ws["!merges"].push({
                s: { r: bdoTitleRow, c: 0 },
                e: { r: bdoTitleRow, c: 9 },
            });

            // ================= MERGE STATE TITLE =================
            ws["!merges"].push({
                s: { r: stateTitleRow, c: 0 },
                e: { r: stateTitleRow, c: 9 },
            });

            // ================= STYLE LOOP =================
            for (let R = range.s.r; R <= range.e.r; R++) {
                for (let C = range.s.c; C <= range.e.c; C++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    const cell = ws[cellAddress];
                    if (!cell) continue;

                    // Default Style
                    cell.s = {
                        font: { name: "Calibri", sz: 11 },
                        alignment: { horizontal: "center", vertical: "center", wrapText: true },
                        border: {
                            top: { style: "thin", color: { rgb: "AAAAAA" } },
                            bottom: { style: "thin", color: { rgb: "AAAAAA" } },
                            left: { style: "thin", color: { rgb: "AAAAAA" } },
                            right: { style: "thin", color: { rgb: "AAAAAA" } },
                        },
                    };

                    // Title Style
                    if (R === 0) {
                        cell.s = {
                            font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: titleColor } },
                        };
                    }

                    // Main Header Style
                    if (R === mainHeaderRow) {
                        cell.s = {
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: headingColor } },
                            border: {
                                top: { style: "thin", color: { rgb: "000000" } },
                                bottom: { style: "thin", color: { rgb: "000000" } },
                                left: { style: "thin", color: { rgb: "000000" } },
                                right: { style: "thin", color: { rgb: "000000" } },
                            },
                        };
                    }

                    // MAIN TABLE YES GREEN (MD YES, NC YES)
                    if ((C === 6 || C === 8) && R > mainHeaderRow && R <= mainDataEndRow) {
                        cell.s = {
                            ...cell.s,
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            fill: { fgColor: { rgb: greenColor } },
                        };
                    }

                    // MAIN TABLE NO RED (MD NO, NC NO)
                    if ((C === 7 || C === 9) && R > mainHeaderRow && R <= mainDataEndRow) {
                        cell.s = {
                            ...cell.s,
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            fill: { fgColor: { rgb: redColor } },
                        };
                    }

                    // FINAL SUMMARY TITLE
                    if (R === finalSummaryTitleRow) {
                        cell.s = {
                            font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: titleColor } },
                        };
                    }

                    // FINAL SUMMARY HEADER
                    if (R === finalSummaryHeaderRow) {
                        cell.s = {
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: headingColor } },
                        };
                    }

                    // FINAL SUMMARY VALUE
                    if (R === finalSummaryValueRow) {
                        cell.s = {
                            font: { bold: true, sz: 12, color: { rgb: "000000" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: summaryBg } },
                        };
                    }

                    // BDO SUMMARY TITLE
                    if (R === bdoTitleRow) {
                        cell.s = {
                            font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: titleColor } },
                        };
                    }

                    // BDO SUMMARY HEADER
                    if (R === bdoHeaderRow) {
                        cell.s = {
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: headingColor } },
                        };
                    }

                    // STATE SUMMARY TITLE
                    if (R === stateTitleRow) {
                        cell.s = {
                            font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: titleColor } },
                        };
                    }

                    // STATE SUMMARY HEADER
                    if (R === stateHeaderRow) {
                        cell.s = {
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: headingColor } },
                        };
                    }

                    // BDO + STATE TABLE YES/NO coloring
                    if (
                        (R >= bdoDataStartRow && R <= bdoDataEndRow) ||
                        (R >= stateDataStartRow && R <= stateDataEndRow)
                    ) {
                        // YES columns (MD YES & NC YES) -> index 5 & 7
                        if (C === 5 || C === 7) {
                            cell.s = {
                                ...cell.s,
                                font: { bold: true, color: { rgb: "FFFFFF" } },
                                fill: { fgColor: { rgb: greenColor } },
                            };
                        }

                        // NO columns (MD NO & NC NO) -> index 6 & 8
                        if (C === 6 || C === 8) {
                            cell.s = {
                                ...cell.s,
                                font: { bold: true, color: { rgb: "FFFFFF" } },
                                fill: { fgColor: { rgb: redColor } },
                            };
                        }
                    }
                }
            }

            XLSX.utils.book_append_sheet(wb, ws, "Summary");

            XLSX.writeFile(
                wb,
                `BDO_StateWise_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`
            );

            toast.success("Excel Summary Exported Successfully");
        } catch (error) {
            console.log(error);
            toast.error("Excel export failed");
        }
    };

    return (
        <React.Fragment>
            <ToastContainer />
            <div className="page-content">
                <Breadcrumbs
                    title="BDO's Daily Sales Report"
                    breadcrumbItem="BDO's Daily Sales Report"
                />

                <Row>
                    <Col lg="12">
                        <Card>
                            <CardBody>
                                <h4 className="mb-4">Monthly Sales Report (BDM - BDO)</h4>


                                <Row className="mb-4">
                                    <Col md="3">
                                        <Label>Search State</Label>
                                        <Select
                                            options={stateOptions}
                                            value={selectedState}
                                            onChange={setSelectedState}
                                            isClearable
                                            placeholder="Select State"
                                        />
                                    </Col>

                                    <Col md="3">
                                        <Label>Search Invoice</Label>
                                        <Select
                                            options={invoiceOptions}
                                            value={selectedInvoice}
                                            onChange={setSelectedInvoice}
                                            isClearable
                                            placeholder="Select Invoice"
                                        />
                                    </Col>

                                    <Col md="3">
                                        <Label>Search BDO</Label>
                                        <Select
                                            options={bdoOptions}
                                            value={selectedBDO}
                                            onChange={setSelectedBDO}
                                            isClearable
                                            placeholder="Select BDO"
                                        />
                                    </Col>

                                    <Col md="3">
                                        <Button color="success" className="mb-3" onClick={exportToExcel}>
                                            Export Excel
                                        </Button>
                                        <Button color="success" className="mb-3" onClick={exportToExcelSummary}>
                                            Export Summary Excel
                                        </Button>

                                    </Col>

                                </Row>


                                <div className="table-responsive">
                                    <Table className="table table-bordered table-striped">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>BDO</th>
                                                <th>State</th>
                                                <th>Invoice</th>
                                                <th>VL</th>
                                                <th>AVG</th>
                                                <th>CD</th>
                                                <th>MD</th>
                                                <th>NC</th>
                                                <th>Note</th>
                                                <th>Created At</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredReports.length > 0 ? (
                                                filteredReports.map((item, index) => (
                                                    <tr key={item.id}>
                                                        <td>{index + 1}</td>
                                                        <td>{item.bdo_name}</td>
                                                        <td>{item.state_name}</td>
                                                        <td>{item.invoice_no}</td>
                                                        <td>{item.volume}</td>
                                                        <td>{item.average}</td>
                                                        <td>{item.call_duration}</td>
                                                        <td>{item?.micro_dealer?.toUpperCase()}</td>
                                                        <td>{item?.new_coach?.toUpperCase()}</td>
                                                        <td>{item?.note}</td>
                                                        <td>
                                                            {item.created_at
                                                                ? new Date(item.created_at).toLocaleString()
                                                                : "-"}
                                                        </td>

                                                        <td>
                                                            <Button
                                                                color="primary"
                                                                size="sm"
                                                                className="me-2"
                                                                onClick={() => openEditModal(item)}
                                                            >
                                                                Edit
                                                            </Button>

                                                            <Button
                                                                color="danger"
                                                                size="sm"
                                                                onClick={() => deleteReport(item.id)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="13" className="text-center">
                                                        No Reports Found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>


                <Modal isOpen={editModal} toggle={closeEditModal}>
                    <ModalHeader toggle={closeEditModal}>Update Report</ModalHeader>

                    <ModalBody>
                        <Form>
                            <div className="mb-3">
                                <Label>Volume</Label>
                                <Input
                                    type="text"
                                    name="volume"
                                    value={formData.volume}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="mb-3">
                                <Label>Average</Label>
                                <Input
                                    type="text"
                                    name="average"
                                    value={formData.average}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="mb-3">
                                <Label>Call Duration</Label>
                                <Input
                                    type="text"
                                    name="call_duration"
                                    value={formData.call_duration}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="mb-3">
                                <Label>Micro Dealer</Label>
                                <Input
                                    type="select"
                                    name="micro_dealer"
                                    value={formData.micro_dealer}
                                    onChange={handleChange}
                                >
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </Input>
                            </div>

                            <div className="mb-3">
                                <Label>New Coach</Label>
                                <Input
                                    type="select"
                                    name="new_coach"
                                    value={formData.new_coach}
                                    onChange={handleChange}
                                >
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </Input>
                            </div>

                            <div className="mb-3">
                                <Label>Note</Label>
                                <Input
                                    type="textarea"
                                    name="note"
                                    value={formData.note}
                                    onChange={handleChange}
                                />
                            </div>
                        </Form>
                    </ModalBody>

                    <ModalFooter>
                        <Button color="success" onClick={updateReport}>
                            Update
                        </Button>
                        <Button color="secondary" onClick={closeEditModal}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </Modal>
            </div>
        </React.Fragment>
    );
};

export default BDMSalesViewReport;
