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
    Label,
    Button,
} from "reactstrap";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import * as XLSX from "xlsx-js-style";

const BDMSalesReportAdminView = () => {
    const [stateList, setStateList] = useState([]);
    const [invoiceList, setInvoiceList] = useState([]);
    const [reportList, setReportList] = useState([]);
    const [bdoList, setBdoList] = useState([]);
    const [selectedState, setSelectedState] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedBDO, setSelectedBDO] = useState(null);
    const [selectedBDM, setSelectedBDM] = useState(null);
    const token = localStorage.getItem("token");
    document.title = "BEPOSOFT | BDO's Daily Sales Report";


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


    const fetchReport = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}monthly/sales/report/bdm/bdo/all/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setReportList(response.data.data || []);
        } catch (error) {
            toast.error("Failed to load Reports");
        }
    };


    const fetchBDOUsers = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}staffs/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const allStaffs = response?.data?.data || [];

            // Only BDO designation
            const bdoOnly = allStaffs.filter(
                (user) => user.designation === "BDO"
            );

            setBdoList(bdoOnly);
        } catch (error) {
            toast.error("Failed to load BDO Users");
        }
    };

    useEffect(() => {
        fetchStates();
        fetchInvoice();
        fetchReport();
        fetchBDOUsers();
    }, []);

    // dropdown options
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

    // Unique BDM from reportList
    const bdmOptions = useMemo(() => {
        const uniqueBDM = [];
        const seen = new Set();

        reportList.forEach((r) => {
            if (r.bdm && !seen.has(r.bdm)) {
                seen.add(r.bdm);
                uniqueBDM.push({
                    value: r.bdm,
                    label: r.bdm_name,
                });
            }
        });

        return uniqueBDM;
    }, [reportList]);

    // filtered report
    const filteredReports = useMemo(() => {
        return reportList.filter((item) => {
            const matchState = selectedState
                ? item.state === selectedState.value
                : true;

            const matchInvoice = selectedInvoice
                ? item.invoice === selectedInvoice.value
                : true;

            const matchBDO = selectedBDO
                ? item.bdo === selectedBDO.value
                : true;

            const matchBDM = selectedBDM
                ? item.bdm === selectedBDM.value
                : true;

            return matchState && matchInvoice && matchBDO && matchBDM;
        });
    }, [reportList, selectedState, selectedInvoice, selectedBDO, selectedBDM]);

    const exportToExcel = () => {
        try {
            if (!filteredReports || filteredReports.length === 0) {
                toast.error("No data to export");
                return;
            }

            const wb = XLSX.utils.book_new();
            const wsData = [];

            // ================= TITLE =================
            wsData.push(["Monthly Sales Report (BDM - BDO) - Admin"]);
            wsData.push([]);

            // ================= HEADER =================
            wsData.push([
                "#",
                "BDM",
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
                    item.bdm_name || "",
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

            // ================= FINAL SUMMARY =================
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

                bdoGrouped[bdoName].total_reports += 1;
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

                stateGrouped[stateName].total_reports += 1;
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
                { wch: 18 },
                { wch: 10 },
                { wch: 10 },
                { wch: 10 },
                { wch: 10 },
                { wch: 10 },
                { wch: 35 },
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
                { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
                { s: { r: summaryTitleRow, c: 0 }, e: { r: summaryTitleRow, c: 7 } },
                { s: { r: bdoTitleRow, c: 0 }, e: { r: bdoTitleRow, c: 9 } },
                { s: { r: stateTitleRow, c: 0 }, e: { r: stateTitleRow, c: 9 } },
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

                    // Main Title
                    if (R === 0) {
                        cell.s = {
                            font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: titleColor } },
                        };
                    }

                    // Report Header
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

                    // Note left align
                    if (C === 10 && R >= reportDataStartRow && R <= reportDataEndRow) {
                        cell.s = {
                            ...cell.s,
                            alignment: { horizontal: "left", vertical: "center", wrapText: true },
                        };
                    }

                    // MD YES/NO color (column 8)
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

                    // NC YES/NO color (column 9)
                    if (C === 9 && R >= reportDataStartRow && R <= reportDataEndRow) {
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

                    // FINAL SUMMARY Title
                    if (R === summaryTitleRow) {
                        cell.s = {
                            font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: titleColor } },
                        };
                    }

                    // FINAL SUMMARY Header
                    if (R === summaryHeaderRow) {
                        cell.s = {
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: headingColor } },
                        };
                    }

                    // FINAL SUMMARY Value
                    if (R === summaryValueRow) {
                        cell.s = {
                            font: { bold: true, sz: 12, color: { rgb: "000000" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: summaryBg } },
                        };
                    }

                    // BDO SUMMARY Title
                    if (R === bdoTitleRow) {
                        cell.s = {
                            font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: titleColor } },
                        };
                    }

                    // BDO SUMMARY Header
                    if (R === bdoHeaderRow) {
                        cell.s = {
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: headingColor } },
                        };
                    }

                    // STATE SUMMARY Title
                    if (R === stateTitleRow) {
                        cell.s = {
                            font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: titleColor } },
                        };
                    }

                    // STATE SUMMARY Header
                    if (R === stateHeaderRow) {
                        cell.s = {
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: headingColor } },
                        };
                    }

                    // BDO + STATE YES/NO columns coloring
                    if (
                        (R >= bdoDataStartRow && R <= bdoDataEndRow) ||
                        (R >= stateDataStartRow && R <= stateDataEndRow)
                    ) {
                        // YES columns MD YES & NC YES (5,7)
                        if (C === 5 || C === 7) {
                            cell.s = {
                                ...cell.s,
                                font: { bold: true, color: { rgb: "FFFFFF" } },
                                fill: { fgColor: { rgb: yesColor } },
                            };
                        }

                        // NO columns MD NO & NC NO (6,8)
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

            XLSX.utils.book_append_sheet(wb, ws, "Report");

            XLSX.writeFile(
                wb,
                `BDM_BDO_AdminReport_${new Date().toISOString().slice(0, 10)}.xlsx`
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

            // ================= GROUP BY BDM + BDO + STATE =================
            const groupedData = {};

            filteredReports.forEach((item) => {
                const key = `${item.bdm_name}_${item.bdo_name}_${item.state_name}`;

                if (!groupedData[key]) {
                    groupedData[key] = {
                        bdm_name: item.bdm_name || "",
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

            // ================= FINAL SUMMARY (TOTAL) =================
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
            wsData.push(["BDM - BDO Monthly Sales Summary (State-wise) - Admin"]);
            wsData.push([]);

            // ================= HEADER =================
            wsData.push([
                "#",
                "BDM Name",
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

            // ================= ROWS =================
            summaryList.forEach((row, index) => {
                wsData.push([
                    index + 1,
                    row.bdm_name,
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

            // ================= COLUMN WIDTH =================
            ws["!cols"] = [
                { wch: 5 },
                { wch: 22 },
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

            // ================= MERGES =================
            ws["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // main title merge
                { s: { r: finalSummaryTitleRow, c: 0 }, e: { r: finalSummaryTitleRow, c: 7 } },
                { s: { r: bdoTitleRow, c: 0 }, e: { r: bdoTitleRow, c: 9 } },
                { s: { r: stateTitleRow, c: 0 }, e: { r: stateTitleRow, c: 9 } },
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

                    // Title Row
                    if (R === 0) {
                        cell.s = {
                            font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: titleColor } },
                        };
                    }

                    // Main Header Row
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

                    // YES columns green (MD YES, NC YES) -> indexes 7 & 9
                    if ((C === 7 || C === 9) && R > mainHeaderRow && R <= mainDataEndRow) {
                        cell.s = {
                            ...cell.s,
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            fill: { fgColor: { rgb: greenColor } },
                        };
                    }

                    // NO columns red (MD NO, NC NO) -> indexes 8 & 10
                    if ((C === 8 || C === 10) && R > mainHeaderRow && R <= mainDataEndRow) {
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

                    // FINAL SUMMARY VALUES
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

                    // BDO + STATE YES/NO COLORING
                    if (
                        (R >= bdoDataStartRow && R <= bdoDataEndRow) ||
                        (R >= stateDataStartRow && R <= stateDataEndRow)
                    ) {
                        // YES columns MD YES & NC YES (5,7)
                        if (C === 5 || C === 7) {
                            cell.s = {
                                ...cell.s,
                                font: { bold: true, color: { rgb: "FFFFFF" } },
                                fill: { fgColor: { rgb: greenColor } },
                            };
                        }

                        // NO columns MD NO & NC NO (6,8)
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
                `BDM_BDO_AdminSummary_${new Date().toISOString().slice(0, 10)}.xlsx`
            );

            toast.success("Summary Excel Exported Successfully");
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
                                    <Col md="2">
                                        <Label>Search State</Label>
                                        <Select
                                            options={stateOptions}
                                            value={selectedState}
                                            onChange={setSelectedState}
                                            isClearable
                                            placeholder="Select State"
                                        />
                                    </Col>

                                    <Col md="2">
                                        <Label>Search Invoice</Label>
                                        <Select
                                            options={invoiceOptions}
                                            value={selectedInvoice}
                                            onChange={setSelectedInvoice}
                                            isClearable
                                            placeholder="Select Invoice"
                                        />
                                    </Col>

                                    <Col md="2">
                                        <Label>Search BDO</Label>
                                        <Select
                                            options={bdoOptions}
                                            value={selectedBDO}
                                            onChange={setSelectedBDO}
                                            isClearable
                                            placeholder="Select BDO"
                                        />
                                    </Col>

                                    <Col md="2">
                                        <Label>Search BDM</Label>
                                        <Select
                                            options={bdmOptions}
                                            value={selectedBDM}
                                            onChange={setSelectedBDM}
                                            isClearable
                                            placeholder="Select BDM"
                                        />
                                    </Col>

                                    <Col md="2" className="d-flex gap-2 align-items-end">
                                        <Button color="success" onClick={exportToExcel}>
                                            Export Excel
                                        </Button>

                                        <Button color="primary" onClick={exportToExcelSummary}>
                                            Export Summary Excel
                                        </Button>
                                    </Col>

                                </Row>

                                <div className="table-responsive">
                                    <Table className="table table-bordered table-striped">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>BDM</th>
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
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredReports.length > 0 ? (
                                                filteredReports.map((item, index) => (
                                                    <tr key={item.id}>
                                                        <td>{index + 1}</td>
                                                        <td>{item.bdm_name}</td>
                                                        <td>{item.bdo_name}</td>
                                                        <td>{item.state_name}</td>
                                                        <td>{item.invoice_no}</td>
                                                        <td>{item.volume}</td>
                                                        <td>{item.average}</td>
                                                        <td>{item?.call_duration}</td>
                                                        <td>{item?.micro_dealer?.toUpperCase()}</td>
                                                        <td>{item?.new_coach?.toUpperCase()}</td>
                                                        <td>{item?.note}</td>
                                                        <td>
                                                            {item.created_at
                                                                ? new Date(item.created_at).toLocaleString()
                                                                : "-"}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="12" className="text-center">
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
            </div>
        </React.Fragment>
    );
};

export default BDMSalesReportAdminView;
