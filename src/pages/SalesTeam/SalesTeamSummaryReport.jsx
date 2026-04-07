import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import {
    Card,
    CardBody,
    Col,
    Row,
    Button,
    Spinner,
    Input,
    Label,
    Table,
} from "reactstrap";
import Select from "react-select";
import * as XLSX from "xlsx-js-style";
import "react-toastify/dist/ReactToastify.css";

const SalesTeamSummaryReport = () => {
    const [loading, setLoading] = useState(false);
    const [reportRows, setReportRows] = useState([]);
    const [rawData, setRawData] = useState([]);
    const [totals, setTotals] = useState(null);

    const [search, setSearch] = useState("");
    const [teamFilter, setTeamFilter] = useState("");
    const [createdByFilter, setCreatedByFilter] = useState("");
    const [stateFilter, setStateFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [teamOptions, setTeamOptions] = useState([]);
    const [staffOptions, setStaffOptions] = useState([]);
    const [stateOptions, setStateOptions] = useState([]);

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const hourlyHeaders = [
        "09:00-10:00",
        "10:00-11:00",
        "11:00-12:00",
        "12:00-01:00",
        "01:00-02:00",
        "02:00-03:00",
        "03:00-04:00",
        "04:00-05:00",
        "05:00-06:00",
        "06:00-07:00",
    ];

    const timeHeaderLabels = [
        "09:00-\n10:00",
        "10:00-\n11:00",
        "11:00-\n12:00",
        "12:00-\n01:00",
        "01:00-\n02:00",
        "02:00-\n03:00",
        "03:00-\n04:00",
        "04:00-\n05:00",
        "05:00-\n06:00",
        "06:00-\n07:00",
    ];

    const safeNumber = (value) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    };

    const formatValue = (value) => {
        const n = safeNumber(value);
        if (Number.isInteger(n)) return String(n);
        return n.toFixed(2);
    };

    const transformData = (teams) => {
        const finalRows = [];
        let runningSlNo = 1;

        (teams || []).forEach((teamItem) => {
            const members = Array.isArray(teamItem.members) ? teamItem.members : [];

            let teamRowCount = 0;
            members.forEach((member) => {
                const states = Array.isArray(member.states) ? member.states : [];
                teamRowCount += states.length > 0 ? states.length : 1;
            });

            if (teamRowCount === 0) teamRowCount = 1;

            let firstTeamRow = true;

            members.forEach((member) => {
                const states = Array.isArray(member.states) ? member.states : [];
                const memberRows = states.length > 0 ? states.length : 1;
                let firstMemberRow = true;

                if (states.length === 0) {
                    finalRows.push({
                        sl_no: runningSlNo,
                        team_name: teamItem.team_name || "-",
                        team_unbilled: safeNumber(teamItem.team_unbilled),
                        teamRowSpan: firstTeamRow ? teamRowCount : 0,
                        showTeam: firstTeamRow,
                        created_by_name: member.created_by_name || "-",
                        memberRowSpan: 1,
                        showMember: true,
                        state_name: "-",
                        total_unbilled: 0,
                        unbilled_to_billed: 0,
                        new_customer: 0,
                        new_conversion: 0,
                        billing: 0,
                        volume: 0,
                        hourly_durations: {},
                    });

                    runningSlNo += 1;
                    firstTeamRow = false;
                } else {
                    states.forEach((stateItem) => {
                        finalRows.push({
                            sl_no: runningSlNo,
                            team_name: teamItem.team_name || "-",
                            team_unbilled: safeNumber(teamItem.team_unbilled),
                            teamRowSpan: firstTeamRow ? teamRowCount : 0,
                            showTeam: firstTeamRow,
                            created_by_name: member.created_by_name || "-",
                            memberRowSpan: firstMemberRow ? memberRows : 0,
                            showMember: firstMemberRow,
                            state_name: stateItem.state_name || "-",
                            total_unbilled: safeNumber(stateItem.total_unbilled),
                            unbilled_to_billed: safeNumber(stateItem.unbilled_to_billed),
                            new_customer: safeNumber(stateItem.new_customer),
                            new_conversion: safeNumber(stateItem.new_conversion),
                            billing: safeNumber(stateItem.billing),
                            volume: safeNumber(stateItem.volume),
                            hourly_durations: stateItem.hourly_durations || {},
                        });

                        runningSlNo += 1;
                        firstTeamRow = false;
                        firstMemberRow = false;
                    });
                }
            });
        });

        return finalRows;
    };

    const fetchTeams = async () => {
        try {
            const response = await axios.get(`${baseUrl}sales/teams/add/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const apiData = response?.data?.data || response?.data || [];
            setTeamOptions(Array.isArray(apiData) ? apiData : []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load teams");
            setTeamOptions([]);
        }
    };

    const fetchStaffs = async () => {
        try {
            const response = await axios.get(`${baseUrl}staffs/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const apiData = response?.data?.data || response?.data || [];

            const filteredStaff = (Array.isArray(apiData) ? apiData : []).filter((item) => {
                const designation = String(item.designation || "").toUpperCase().trim();
                return designation === "BDO" || designation === "BDM";
            });

            setStaffOptions(filteredStaff);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load staffs");
            setStaffOptions([]);
        }
    };

    const fetchStates = async () => {
        try {
            const response = await axios.get(`${baseUrl}states/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const apiData = response?.data?.data || response?.data || [];
            setStateOptions(Array.isArray(apiData) ? apiData : []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load states");
            setStateOptions([]);
        }
    };

    const fetchReport = async () => {
        try {
            setLoading(true);

            const response = await axios.get(`${baseUrl}sales/team/summary/report/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    search: search || "",
                    team: teamFilter || "",
                    created_by: createdByFilter || "",
                    state: stateFilter || "",
                    start_date: startDate || "",
                    end_date: endDate || "",
                },
            });

            const apiData = response?.data?.results?.data || [];
            const apiTotals = response?.data?.results?.totals || null;

            setRawData(apiData);
            setTotals(apiTotals);
            setReportRows(transformData(apiData));
        } catch (error) {
            console.error(error);
            toast.error("Failed to load sales team summary report");
            setRawData([]);
            setTotals(null);
            setReportRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
        fetchStaffs();
        fetchStates();
        fetchReport();
    }, []);

    const teamSelectOptions = useMemo(() => {
        return (teamOptions || []).map((team, index) => ({
            value: team.name || team.team_name || "",
            label: team.name || team.team_name || "-",
            key: team.id || index,
        }));
    }, [teamOptions]);

    const staffSelectOptions = useMemo(() => {
        return (staffOptions || []).map((staff, index) => ({
            value: staff.name || staff.username || staff.full_name || "",
            label: staff.name || staff.username || staff.full_name || "-",
            key: staff.id || index,
        }));
    }, [staffOptions]);

    const stateSelectOptions = useMemo(() => {
        return (stateOptions || []).map((state, index) => ({
            value: state.name || state.state_name || "",
            label: state.name || state.state_name || "-",
            key: state.id || index,
        }));
    }, [stateOptions]);

    const selectedTeamOption =
        teamSelectOptions.find((option) => option.value === teamFilter) || null;

    const selectedStaffOption =
        staffSelectOptions.find((option) => option.value === createdByFilter) || null;

    const selectedStateOption =
        stateSelectOptions.find((option) => option.value === stateFilter) || null;

    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: "38px",
            borderColor: state.isFocused ? "#86b7fe" : "#ced4da",
            boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(13,110,253,.25)" : "none",
            "&:hover": {
                borderColor: state.isFocused ? "#86b7fe" : "#ced4da",
            },
            fontSize: "14px",
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 9999,
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: "14px",
            backgroundColor: state.isSelected
                ? "#0d6efd"
                : state.isFocused
                    ? "#e9f2ff"
                    : "#fff",
            color: state.isSelected ? "#fff" : "#212529",
        }),
        singleValue: (provided) => ({
            ...provided,
            fontSize: "14px",
        }),
        placeholder: (provided) => ({
            ...provided,
            fontSize: "14px",
            color: "#6c757d",
        }),
    };

    const exportToExcel = () => {
        try {
            if (!reportRows.length) {
                toast.error("No data to export");
                return;
            }

            const wb = XLSX.utils.book_new();
            const wsData = [];

            // Title
            wsData.push(["SALES TEAM SUMMARY REPORT"]);
            wsData.push([]);

            // Main table header
            const headerRow = [
                "SL NO",
                "TEAM",
                "UNBILLED",
                "BDO",
                "STATE",
                "TOTAL UNBILLED",
                "UNBILLED TO BILLED",
                "NEW CUSTOMER",
                "NEW CONVERSION",
                "BILLING",
                "VOLUME",
                "09:00-10:00",
                "10:00-11:00",
                "11:00-12:00",
                "12:00-01:00",
                "01:00-02:00",
                "02:00-03:00",
                "03:00-04:00",
                "04:00-05:00",
                "05:00-06:00",
                "06:00-07:00",
            ];

            wsData.push(headerRow);

            // Main table rows
            reportRows.forEach((row) => {
                wsData.push([
                    row.sl_no,
                    row.showTeam ? row.team_name : "",
                    row.showTeam ? safeNumber(row.team_unbilled) : "",
                    row.showMember ? row.created_by_name : "",
                    row.state_name,
                    safeNumber(row.total_unbilled),
                    safeNumber(row.unbilled_to_billed),
                    safeNumber(row.new_customer),
                    safeNumber(row.new_conversion),
                    safeNumber(row.billing),
                    safeNumber(row.volume),
                    safeNumber(row.hourly_durations?.["09:00-10:00"]),
                    safeNumber(row.hourly_durations?.["10:00-11:00"]),
                    safeNumber(row.hourly_durations?.["11:00-12:00"]),
                    safeNumber(row.hourly_durations?.["12:00-01:00"]),
                    safeNumber(row.hourly_durations?.["01:00-02:00"]),
                    safeNumber(row.hourly_durations?.["02:00-03:00"]),
                    safeNumber(row.hourly_durations?.["03:00-04:00"]),
                    safeNumber(row.hourly_durations?.["04:00-05:00"]),
                    safeNumber(row.hourly_durations?.["05:00-06:00"]),
                    safeNumber(row.hourly_durations?.["06:00-07:00"]),
                ]);
            });

            const totalRowIndexInData = wsData.length;

            // Main total row
            wsData.push([
                "TOTAL",
                "",
                safeNumber(totals?.team_unbilled),
                "",
                "",
                safeNumber(totals?.total_unbilled),
                safeNumber(totals?.unbilled_to_billed),
                safeNumber(totals?.new_customer),
                safeNumber(totals?.new_conversion),
                safeNumber(totals?.billing),
                safeNumber(totals?.volume),
                safeNumber(totals?.hourly_durations?.["09:00-10:00"]),
                safeNumber(totals?.hourly_durations?.["10:00-11:00"]),
                safeNumber(totals?.hourly_durations?.["11:00-12:00"]),
                safeNumber(totals?.hourly_durations?.["12:00-01:00"]),
                safeNumber(totals?.hourly_durations?.["01:00-02:00"]),
                safeNumber(totals?.hourly_durations?.["02:00-03:00"]),
                safeNumber(totals?.hourly_durations?.["03:00-04:00"]),
                safeNumber(totals?.hourly_durations?.["04:00-05:00"]),
                safeNumber(totals?.hourly_durations?.["05:00-06:00"]),
                safeNumber(totals?.hourly_durations?.["06:00-07:00"]),
            ]);

            // Empty row before bottom sections
            wsData.push([]);

            // =========================
            // SUMMARY TABLE  (A:B)
            // =========================
            const summaryHeadingRow = wsData.length;
            wsData.push(["SUMMARY", "", "", "HOURLY DURATION SUMMARY", ""]);

            const summarySubheadingRow = wsData.length;
            wsData.push(["Metric", "Value", "", "Time Slots", "Call Duration"]);

            const summaryDataStartRow = wsData.length;

            wsData.push(["Team Unbilled", safeNumber(totals?.team_unbilled), "", "09:00-10:00", safeNumber(totals?.hourly_durations?.["09:00-10:00"])]);
            wsData.push(["Total Unbilled", safeNumber(totals?.total_unbilled), "", "10:00-11:00", safeNumber(totals?.hourly_durations?.["10:00-11:00"])]);
            wsData.push(["Unbilled To Billed", safeNumber(totals?.unbilled_to_billed), "", "11:00-12:00", safeNumber(totals?.hourly_durations?.["11:00-12:00"])]);
            wsData.push(["New Customer", safeNumber(totals?.new_customer), "", "12:00-01:00", safeNumber(totals?.hourly_durations?.["12:00-01:00"])]);
            wsData.push(["New Conversion", safeNumber(totals?.new_conversion), "", "01:00-02:00", safeNumber(totals?.hourly_durations?.["01:00-02:00"])]);
            wsData.push(["Billing", safeNumber(totals?.billing), "", "02:00-03:00", safeNumber(totals?.hourly_durations?.["02:00-03:00"])]);
            wsData.push(["Volume", safeNumber(totals?.volume), "", "03:00-04:00", safeNumber(totals?.hourly_durations?.["03:00-04:00"])]);
            wsData.push(["Total Call Duration", safeNumber(totals?.total_call_duration), "", "04:00-05:00", safeNumber(totals?.hourly_durations?.["04:00-05:00"])]);
            wsData.push(["", "", "", "05:00-06:00", safeNumber(totals?.hourly_durations?.["05:00-06:00"])]);
            wsData.push(["", "", "", "06:00-07:00", safeNumber(totals?.hourly_durations?.["06:00-07:00"])]);

            const bottomDataEndRow = wsData.length - 1;

            const ws = XLSX.utils.aoa_to_sheet(wsData);

            ws["!cols"] = [
                { wch: 24 }, // A Summary metric
                { wch: 16 }, // B Summary value
                { wch: 12 },  // C gap
                { wch: 20 }, // D Hourly timeslot
                { wch: 16 }, // E Hourly duration
                { wch: 12 }, // F
                { wch: 12 }, // G
                { wch: 12 }, // H
                { wch: 12 }, // I
                { wch: 12 }, // J
                { wch: 12 }, // K
                { wch: 12 }, // L
                { wch: 12 }, // M
                { wch: 12 }, // N
                { wch: 12 }, // O
                { wch: 12 }, // P
                { wch: 12 }, // Q
                { wch: 12 }, // R
                { wch: 12 }, // S
                { wch: 12 }, // T
                { wch: 12 }, // U
            ];

            ws["!merges"] = ws["!merges"] || [];

            // Title merge
            ws["!merges"].push({
                s: { r: 0, c: 0 },
                e: { r: 0, c: 20 },
            });

            // Summary heading merge A:B
            ws["!merges"].push({
                s: { r: summaryHeadingRow, c: 0 },
                e: { r: summaryHeadingRow, c: 1 },
            });

            // Hourly heading merge D:E
            ws["!merges"].push({
                s: { r: summaryHeadingRow, c: 3 },
                e: { r: summaryHeadingRow, c: 4 },
            });

            // Main table merges
            let excelRowPointer = 3;
            reportRows.forEach((row) => {
                if (row.showTeam && row.teamRowSpan > 1) {
                    ws["!merges"].push(
                        {
                            s: { r: excelRowPointer, c: 1 },
                            e: { r: excelRowPointer + row.teamRowSpan - 1, c: 1 },
                        },
                        {
                            s: { r: excelRowPointer, c: 2 },
                            e: { r: excelRowPointer + row.teamRowSpan - 1, c: 2 },
                        }
                    );
                }

                if (row.showMember && row.memberRowSpan > 1) {
                    ws["!merges"].push({
                        s: { r: excelRowPointer, c: 3 },
                        e: { r: excelRowPointer + row.memberRowSpan - 1, c: 3 },
                    });
                }

                excelRowPointer += 1;
            });

            const range = XLSX.utils.decode_range(ws["!ref"]);

            const thinBorder = {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
            };

            // Base style
            for (let r = range.s.r; r <= range.e.r; r++) {
                for (let c = range.s.c; c <= range.e.c; c++) {
                    const cellAddress = XLSX.utils.encode_cell({ r, c });
                    if (!ws[cellAddress]) continue;

                    ws[cellAddress].s = {
                        font: {
                            name: "Calibri",
                            sz: 10,
                            color: { rgb: "000000" },
                        },
                        alignment: {
                            horizontal: "center",
                            vertical: "center",
                            wrapText: true,
                        },
                        fill: {
                            fgColor: { rgb: "FFFFFF" },
                        },
                        border: thinBorder,
                    };
                }
            }

            // Title style
            for (let c = 0; c <= 20; c++) {
                const cell = XLSX.utils.encode_cell({ r: 0, c });
                if (!ws[cell]) continue;

                ws[cell].s = {
                    font: {
                        name: "Calibri",
                        sz: 14,
                        bold: true,
                        color: { rgb: "FFFFFF" },
                    },
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                    },
                    fill: {
                        fgColor: { rgb: "7F00FF" },
                    },
                    border: thinBorder,
                };
            }

            // Main header style
            for (let c = 0; c <= 20; c++) {
                const cell = XLSX.utils.encode_cell({ r: 2, c });
                if (!ws[cell]) continue;

                ws[cell].s = {
                    font: {
                        name: "Calibri",
                        sz: 10,
                        bold: true,
                        color: { rgb: "FFFFFF" },
                    },
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                        wrapText: true,
                    },
                    fill: {
                        fgColor: { rgb: c >= 11 ? "FFD966" : "00BDB4" },
                    },
                    border: thinBorder,
                };
            }

            // Main body style
            let bodyRowPointer = 3;
            reportRows.forEach((row, index) => {
                for (let c = 0; c <= 20; c++) {
                    const cell = XLSX.utils.encode_cell({ r: bodyRowPointer, c });
                    if (!ws[cell]) continue;

                    let fillColor = index % 2 === 0 ? "FFFFFF" : "F8FBFF";

                    if (c === 1) fillColor = "EAF4FF";
                    if (c === 2) fillColor = "FFF8E7";
                    if (c === 3) fillColor = "F3EFFF";
                    if (c === 4) fillColor = "F9F9F9";
                    if (c >= 5 && c <= 10) fillColor = "FFFDF5";
                    if (c >= 11 && c <= 14) fillColor = "F0FFF7";
                    if (c >= 15 && c <= 20) fillColor = "FFF7F0";

                    ws[cell].s = {
                        ...ws[cell].s,
                        fill: { fgColor: { rgb: fillColor } },
                        font: {
                            ...(ws[cell].s?.font || {}),
                            bold: c === 0 || c === 1 || c === 2 || c === 3,
                            color: { rgb: "000000" },
                        },
                        alignment: {
                            horizontal: c === 1 || c === 3 || c === 4 ? "left" : "center",
                            vertical: "center",
                            wrapText: true,
                        },
                        border: thinBorder,
                    };
                }

                bodyRowPointer += 1;
            });

            // Total row style
            const totalExcelRow = totalRowIndexInData;
            for (let c = 0; c <= 20; c++) {
                const cell = XLSX.utils.encode_cell({ r: totalExcelRow, c });
                if (!ws[cell]) continue;

                ws[cell].s = {
                    font: {
                        name: "Calibri",
                        sz: 10,
                        bold: true,
                        color: { rgb: "FFFFFF" },
                    },
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                        wrapText: true,
                    },
                    fill: {
                        fgColor: { rgb: "FF0000" },
                    },
                    border: thinBorder,
                };
            }

            // Remove styling from gap column C
            for (let r = summaryHeadingRow; r <= bottomDataEndRow; r++) {
                const gapCell = XLSX.utils.encode_cell({ r, c: 2 });
                if (ws[gapCell]) {
                    ws[gapCell].s = {
                        font: {
                            name: "Calibri",
                            sz: 10,
                            color: { rgb: "000000" },
                        },
                        alignment: {
                            horizontal: "center",
                            vertical: "center",
                            wrapText: true,
                        },
                        fill: {
                            fgColor: { rgb: "FFFFFF" },
                        },
                        border: {},
                    };
                }
            }

            // Summary heading style A:B
            for (let c = 0; c <= 1; c++) {
                const cell = XLSX.utils.encode_cell({ r: summaryHeadingRow, c });
                if (!ws[cell]) continue;

                ws[cell].s = {
                    font: {
                        name: "Calibri",
                        sz: 11,
                        bold: true,
                        color: { rgb: "FFFFFF" },
                    },
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                    },
                    fill: {
                        fgColor: { rgb: "00B050" },
                    },
                    border: thinBorder,
                };
            }

            // Summary subheading style A:B
            for (let c = 0; c <= 1; c++) {
                const cell = XLSX.utils.encode_cell({ r: summarySubheadingRow, c });
                if (!ws[cell]) continue;

                ws[cell].s = {
                    font: {
                        name: "Calibri",
                        sz: 10,
                        bold: true,
                        color: { rgb: "000000" },
                    },
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                        wrapText: true,
                    },
                    fill: {
                        fgColor: { rgb: "B7C9D9" },
                    },
                    border: thinBorder,
                };
            }

            // Summary data style A:B
            for (let r = summaryDataStartRow; r <= bottomDataEndRow; r++) {
                for (let c = 0; c <= 1; c++) {
                    const cell = XLSX.utils.encode_cell({ r, c });
                    if (!ws[cell]) continue;

                    const isLabel = c === 0;
                    const isEmptyRow = !ws[cell].v;

                    ws[cell].s = {
                        ...ws[cell].s,
                        font: {
                            name: "Calibri",
                            sz: 10,
                            bold: isLabel && !isEmptyRow,
                            color: { rgb: "000000" },
                        },
                        alignment: {
                            horizontal: isLabel ? "left" : "center",
                            vertical: "center",
                            wrapText: true,
                        },
                        fill: {
                            fgColor: { rgb: isEmptyRow ? "FFFFFF" : (isLabel ? "D9EAF7" : "F3EEE8") },
                        },
                        border: isEmptyRow ? {} : thinBorder,
                    };
                }
            }

            // Hourly heading style D:E
            for (let c = 3; c <= 4; c++) {
                const cell = XLSX.utils.encode_cell({ r: summaryHeadingRow, c });
                if (!ws[cell]) continue;

                ws[cell].s = {
                    font: {
                        name: "Calibri",
                        sz: 11,
                        bold: true,
                        color: { rgb: "FFFFFF" },
                    },
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                    },
                    fill: {
                        fgColor: { rgb: "00B050" },
                    },
                    border: thinBorder,
                };
            }

            // Hourly subheading style D:E
            for (let c = 3; c <= 4; c++) {
                const cell = XLSX.utils.encode_cell({ r: summarySubheadingRow, c });
                if (!ws[cell]) continue;

                ws[cell].s = {
                    font: {
                        name: "Calibri",
                        sz: 10,
                        bold: true,
                        color: { rgb: "000000" },
                    },
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                        wrapText: true,
                    },
                    fill: {
                        fgColor: { rgb: "B7C9D9" },
                    },
                    border: thinBorder,
                };
            }

            // Hourly data style D:E
            for (let r = summaryDataStartRow; r <= bottomDataEndRow; r++) {
                for (let c = 3; c <= 4; c++) {
                    const cell = XLSX.utils.encode_cell({ r, c });
                    if (!ws[cell]) continue;

                    const isLabel = c === 3;
                    const isEmptyRow = !ws[cell].v;

                    ws[cell].s = {
                        ...ws[cell].s,
                        font: {
                            name: "Calibri",
                            sz: 10,
                            bold: isLabel && !isEmptyRow,
                            color: { rgb: "000000" },
                        },
                        alignment: {
                            horizontal: "center",
                            vertical: "center",
                            wrapText: true,
                        },
                        fill: {
                            fgColor: { rgb: isEmptyRow ? "FFFFFF" : (isLabel ? "D9EAF7" : "F3EEE8") },
                        },
                        border: isEmptyRow ? {} : thinBorder,
                    };
                }
            }

            // Row heights
            ws["!rows"] = [];
            ws["!rows"][0] = { hpt: 24 };
            ws["!rows"][2] = { hpt: 28 };

            for (let i = 3; i <= totalExcelRow; i++) {
                ws["!rows"][i] = { hpt: 22 };
            }

            ws["!rows"][summaryHeadingRow] = { hpt: 24 };
            ws["!rows"][summarySubheadingRow] = { hpt: 22 };

            for (let i = summaryDataStartRow; i <= bottomDataEndRow; i++) {
                ws["!rows"][i] = { hpt: 24 };
            }

            XLSX.utils.book_append_sheet(wb, ws, "Sales Team Summary");
            XLSX.writeFile(wb, "Sales_Team_Summary_Report.xlsx");
            toast.success("Excel exported successfully");
        } catch (error) {
            console.error(error);
            toast.error("Excel export failed");
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <ToastContainer />

                <Card
                    style={{
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                        marginBottom: "20px",
                    }}
                >
                    <CardBody>
                        <Row className="align-items-center">
                            <Col md="8">
                                <h4
                                    style={{
                                        marginBottom: "4px",
                                        fontWeight: 700,
                                        color: "#7A1F5C",
                                    }}
                                >
                                    Sales Team Summary Report
                                </h4>
                                <p style={{ marginBottom: 0, color: "#6c757d", fontSize: "13px" }}>
                                    Paper-style summary view with Excel export
                                </p>
                            </Col>
                            <Col md="4" className="text-end">
                                <Button
                                    color="success"
                                    onClick={exportToExcel}
                                    disabled={loading || !reportRows.length}
                                    style={{ fontWeight: 600 }}
                                >
                                    Export Excel
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                <Card
                    style={{
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        marginBottom: "20px",
                    }}
                >
                    <CardBody>
                        <Row className="g-3">
                            <Col md="2">
                                <Label style={{ fontWeight: 600, fontSize: "13px" }}>Search</Label>
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search..."
                                />
                            </Col>

                            <Col md="2">
                                <Label style={{ fontWeight: 600, fontSize: "13px", display: "block" }}>
                                    Team
                                </Label>
                                <Select
                                    options={teamSelectOptions}
                                    value={selectedTeamOption}
                                    onChange={(selected) => setTeamFilter(selected?.value || "")}
                                    placeholder="All Teams"
                                    isClearable
                                    isSearchable
                                    styles={customSelectStyles}
                                />
                            </Col>

                            <Col md="2">
                                <Label style={{ fontWeight: 600, fontSize: "13px", display: "block" }}>
                                    BDO
                                </Label>
                                <Select
                                    options={staffSelectOptions}
                                    value={selectedStaffOption}
                                    onChange={(selected) => setCreatedByFilter(selected?.value || "")}
                                    placeholder="All BDO"
                                    isClearable
                                    isSearchable
                                    styles={customSelectStyles}
                                />
                            </Col>

                            <Col md="2">
                                <Label style={{ fontWeight: 600, fontSize: "13px", display: "block" }}>
                                    State
                                </Label>
                                <Select
                                    options={stateSelectOptions}
                                    value={selectedStateOption}
                                    onChange={(selected) => setStateFilter(selected?.value || "")}
                                    placeholder="All States"
                                    isClearable
                                    isSearchable
                                    styles={customSelectStyles}
                                />
                            </Col>

                            <Col md="2">
                                <Label style={{ fontWeight: 600, fontSize: "13px" }}>Start Date</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </Col>

                            <Col md="2">
                                <Label style={{ fontWeight: 600, fontSize: "13px" }}>End Date</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </Col>

                            <Col md="12" className="d-flex gap-2 justify-content-end">
                                <Button color="primary" onClick={fetchReport} disabled={loading}>
                                    Apply
                                </Button>
                                <Button
                                    color="secondary"
                                    onClick={() => {
                                        setSearch("");
                                        setTeamFilter("");
                                        setCreatedByFilter("");
                                        setStateFilter("");
                                        setStartDate("");
                                        setEndDate("");
                                        setTimeout(() => {
                                            fetchReport();
                                        }, 0);
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
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                >
                    <CardBody style={{ padding: "12px" }}>
                        {totals && (
                            <Row className="g-3 mb-3">
                                <Col md="3">
                                    <div
                                        style={{
                                            padding: "12px 16px",
                                            borderRadius: "10px",
                                            background: "#f8f9fa",
                                            border: "1px solid #e9ecef",
                                            textAlign: "center",
                                        }}
                                    >
                                        <div style={{ color: "#7A1F5C", fontWeight: 700, fontSize: "14px" }}>
                                            Team Unbilled
                                        </div>
                                        <div style={{ fontSize: "16px", fontWeight: 600 }}>
                                            {formatValue(totals?.team_unbilled || 0)}
                                        </div>
                                    </div>
                                </Col>

                                <Col md="3">
                                    <div
                                        style={{
                                            padding: "12px 16px",
                                            borderRadius: "10px",
                                            background: "#f8f9fa",
                                            border: "1px solid #e9ecef",
                                            textAlign: "center",
                                        }}
                                    >
                                        <div style={{ color: "#7A1F5C", fontWeight: 700, fontSize: "14px" }}>
                                            Total Unbilled
                                        </div>
                                        <div style={{ fontSize: "16px", fontWeight: 600 }}>
                                            {formatValue(totals?.total_unbilled || 0)}
                                        </div>
                                    </div>
                                </Col>

                                <Col md="3">
                                    <div
                                        style={{
                                            padding: "12px 16px",
                                            borderRadius: "10px",
                                            background: "#f8f9fa",
                                            border: "1px solid #e9ecef",
                                            textAlign: "center",
                                        }}
                                    >
                                        <div style={{ color: "#7A1F5C", fontWeight: 700, fontSize: "14px" }}>
                                            Unbilled To Billed
                                        </div>
                                        <div style={{ fontSize: "16px", fontWeight: 600 }}>
                                            {formatValue(totals?.unbilled_to_billed || 0)}
                                        </div>
                                    </div>
                                </Col>

                                <Col md="3">
                                    <div
                                        style={{
                                            padding: "12px 16px",
                                            borderRadius: "10px",
                                            background: "#f8f9fa",
                                            border: "1px solid #e9ecef",
                                            textAlign: "center",
                                        }}
                                    >
                                        <div style={{ color: "#7A1F5C", fontWeight: 700, fontSize: "14px" }}>
                                            New Customer
                                        </div>
                                        <div style={{ fontSize: "16px", fontWeight: 600 }}>
                                            {formatValue(totals?.new_customer || 0)}
                                        </div>
                                    </div>
                                </Col>

                                <Col md="3">
                                    <div
                                        style={{
                                            padding: "12px 16px",
                                            borderRadius: "10px",
                                            background: "#f8f9fa",
                                            border: "1px solid #e9ecef",
                                            textAlign: "center",
                                        }}
                                    >
                                        <div style={{ color: "#7A1F5C", fontWeight: 700, fontSize: "14px" }}>
                                            New Conversion
                                        </div>
                                        <div style={{ fontSize: "16px", fontWeight: 600 }}>
                                            {formatValue(totals?.new_conversion || 0)}
                                        </div>
                                    </div>
                                </Col>

                                <Col md="3">
                                    <div
                                        style={{
                                            padding: "12px 16px",
                                            borderRadius: "10px",
                                            background: "#f8f9fa",
                                            border: "1px solid #e9ecef",
                                            textAlign: "center",
                                        }}
                                    >
                                        <div style={{ color: "#7A1F5C", fontWeight: 700, fontSize: "14px" }}>
                                            Billing
                                        </div>
                                        <div style={{ fontSize: "16px", fontWeight: 600 }}>
                                            {formatValue(totals?.billing || 0)}
                                        </div>
                                    </div>
                                </Col>

                                <Col md="3">
                                    <div
                                        style={{
                                            padding: "12px 16px",
                                            borderRadius: "10px",
                                            background: "#f8f9fa",
                                            border: "1px solid #e9ecef",
                                            textAlign: "center",
                                        }}
                                    >
                                        <div style={{ color: "#7A1F5C", fontWeight: 700, fontSize: "14px" }}>
                                            Volume
                                        </div>
                                        <div style={{ fontSize: "16px", fontWeight: 600 }}>
                                            {formatValue(totals?.volume || 0)}
                                        </div>
                                    </div>
                                </Col>

                                <Col md="3">
                                    <div
                                        style={{
                                            padding: "12px 16px",
                                            borderRadius: "10px",
                                            background: "#f8f9fa",
                                            border: "1px solid #e9ecef",
                                            textAlign: "center",
                                        }}
                                    >
                                        <div style={{ color: "#7A1F5C", fontWeight: 700, fontSize: "14px" }}>
                                            Total Call Duration in Minutes
                                        </div>
                                        <div style={{ fontSize: "16px", fontWeight: 600 }}>
                                            {formatValue(totals?.total_call_duration || 0)}
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        )}

                        {loading ? (
                            <div className="text-center my-5">
                                <Spinner color="primary" />
                            </div>
                        ) : !reportRows.length ? (
                            <div className="text-center my-4">
                                <p className="mb-0">No data found</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <Table
                                    bordered
                                    responsive={false}
                                    style={{
                                        minWidth: "1900px",
                                        marginBottom: 0,
                                        fontSize: "12px",
                                        textAlign: "center",
                                        verticalAlign: "middle",
                                        border: "1px solid #000",
                                    }}
                                >
                                    <thead>
                                        <tr>
                                            <th
                                                rowSpan="2"
                                                style={{
                                                    minWidth: "55px",
                                                    color: "#7A1F5C",
                                                    fontWeight: 700,
                                                    verticalAlign: "middle",
                                                    background: "#EAF4FF",
                                                    border: "1px solid #000",
                                                }}
                                            >
                                                SL NO
                                            </th>
                                            <th
                                                rowSpan="2"
                                                style={{
                                                    minWidth: "180px",
                                                    color: "#7A1F5C",
                                                    fontWeight: 700,
                                                    verticalAlign: "middle",
                                                    background: "#EAF4FF",
                                                    border: "1px solid #000",
                                                }}
                                            >
                                                TEAM
                                            </th>
                                            <th
                                                rowSpan="2"
                                                style={{
                                                    minWidth: "95px",
                                                    color: "#7A1F5C",
                                                    fontWeight: 700,
                                                    verticalAlign: "middle",
                                                    background: "#EAF4FF",
                                                    border: "1px solid #000",
                                                }}
                                            >
                                                UNBILLED
                                            </th>
                                            <th
                                                rowSpan="2"
                                                style={{
                                                    minWidth: "150px",
                                                    color: "#7A1F5C",
                                                    fontWeight: 700,
                                                    verticalAlign: "middle",
                                                    background: "#EAF4FF",
                                                    border: "1px solid #000",
                                                }}
                                            >
                                                BDO
                                            </th>
                                            <th
                                                rowSpan="2"
                                                style={{
                                                    minWidth: "140px",
                                                    color: "#7A1F5C",
                                                    fontWeight: 700,
                                                    verticalAlign: "middle",
                                                    background: "#EAF4FF",
                                                    border: "1px solid #000",
                                                }}
                                            >
                                                STATE
                                            </th>
                                            <th
                                                rowSpan="2"
                                                style={{
                                                    minWidth: "120px",
                                                    color: "#7A1F5C",
                                                    fontWeight: 700,
                                                    verticalAlign: "middle",
                                                    background: "#EAF4FF",
                                                    border: "1px solid #000",
                                                }}
                                            >
                                                TOTAL UNBILLED
                                            </th>
                                            <th
                                                rowSpan="2"
                                                style={{
                                                    minWidth: "135px",
                                                    color: "#7A1F5C",
                                                    fontWeight: 700,
                                                    verticalAlign: "middle",
                                                    background: "#EAF4FF",
                                                    border: "1px solid #000",
                                                }}
                                            >
                                                UNBILLED TO BILLED
                                            </th>
                                            <th
                                                rowSpan="2"
                                                style={{
                                                    minWidth: "120px",
                                                    color: "#7A1F5C",
                                                    fontWeight: 700,
                                                    verticalAlign: "middle",
                                                    background: "#EAF4FF",
                                                    border: "1px solid #000",
                                                }}
                                            >
                                                NEW CUSTOMER
                                            </th>
                                            <th
                                                rowSpan="2"
                                                style={{
                                                    minWidth: "130px",
                                                    color: "#7A1F5C",
                                                    fontWeight: 700,
                                                    verticalAlign: "middle",
                                                    background: "#EAF4FF",
                                                    border: "1px solid #000",
                                                }}
                                            >
                                                NEW CONVERSION
                                            </th>
                                            <th
                                                rowSpan="2"
                                                style={{
                                                    minWidth: "90px",
                                                    color: "#7A1F5C",
                                                    fontWeight: 700,
                                                    verticalAlign: "middle",
                                                    background: "#EAF4FF",
                                                    border: "1px solid #000",
                                                }}
                                            >
                                                BILLING
                                            </th>
                                            <th
                                                rowSpan="2"
                                                style={{
                                                    minWidth: "90px",
                                                    color: "#7A1F5C",
                                                    fontWeight: 700,
                                                    verticalAlign: "middle",
                                                    background: "#EAF4FF",
                                                    border: "1px solid #000",
                                                }}
                                            >
                                                VOLUME
                                            </th>
                                            <th
                                                colSpan={4}
                                                style={{
                                                    color: "#7A1F5C",
                                                    fontWeight: 700,
                                                    background: "#E8FFF8",
                                                    border: "1px solid #000",
                                                }}
                                            >
                                                CD AM
                                            </th>
                                            <th
                                                colSpan={6}
                                                style={{
                                                    color: "#7A1F5C",
                                                    fontWeight: 700,
                                                    background: "#FFF4E8",
                                                    border: "1px solid #000",
                                                }}
                                            >
                                                CD PM
                                            </th>
                                        </tr>
                                        <tr>
                                            {timeHeaderLabels.map((label, index) => (
                                                <th
                                                    key={index}
                                                    style={{
                                                        minWidth: "85px",
                                                        whiteSpace: "pre-line",
                                                        color: "#7A1F5C",
                                                        fontWeight: 700,
                                                        fontSize: "11px",
                                                        background: index <= 3 ? "#E8FFF8" : "#FFF4E8",
                                                        border: "1px solid #000",
                                                    }}
                                                >
                                                    {label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {reportRows.map((row, index) => (
                                            <tr
                                                key={index}
                                                style={{
                                                    background: index % 2 === 0 ? "#FFFFFF" : "#F8FBFF",
                                                }}
                                            >
                                                <td style={{ fontWeight: 600, border: "1px solid #000" }}>{row.sl_no}</td>

                                                {row.showTeam && (
                                                    <>
                                                        <td
                                                            rowSpan={row.teamRowSpan}
                                                            style={{
                                                                fontWeight: 700,
                                                                textAlign: "left",
                                                                verticalAlign: "middle",
                                                                background: "#EAF4FF",
                                                                border: "1px solid #000",
                                                            }}
                                                        >
                                                            {row.team_name}
                                                        </td>
                                                        <td
                                                            rowSpan={row.teamRowSpan}
                                                            style={{
                                                                fontWeight: 700,
                                                                verticalAlign: "middle",
                                                                background: "#FFF8E7",
                                                                border: "1px solid #000",
                                                            }}
                                                        >
                                                            {formatValue(row.team_unbilled)}
                                                        </td>
                                                    </>
                                                )}

                                                {row.showMember && (
                                                    <td
                                                        rowSpan={row.memberRowSpan}
                                                        style={{
                                                            fontWeight: 600,
                                                            textAlign: "left",
                                                            verticalAlign: "middle",
                                                            background: "#F3EFFF",
                                                            border: "1px solid #000",
                                                        }}
                                                    >
                                                        {row.created_by_name}
                                                    </td>
                                                )}

                                                <td
                                                    style={{
                                                        textAlign: "left",
                                                        background: "#F9F9F9",
                                                        border: "1px solid #000",
                                                    }}
                                                >
                                                    {row.state_name}
                                                </td>
                                                <td style={{ background: "#FFFDF5", border: "1px solid #000" }}>
                                                    {formatValue(row.total_unbilled)}
                                                </td>
                                                <td style={{ background: "#FFFDF5", border: "1px solid #000" }}>
                                                    {formatValue(row.unbilled_to_billed)}
                                                </td>
                                                <td style={{ background: "#FFFDF5", border: "1px solid #000" }}>
                                                    {formatValue(row.new_customer)}
                                                </td>
                                                <td style={{ background: "#FFFDF5", border: "1px solid #000" }}>
                                                    {formatValue(row.new_conversion)}
                                                </td>
                                                <td style={{ background: "#FFFDF5", border: "1px solid #000" }}>
                                                    {formatValue(row.billing)}
                                                </td>
                                                <td style={{ background: "#FFFDF5", border: "1px solid #000" }}>
                                                    {formatValue(row.volume)}
                                                </td>

                                                {hourlyHeaders.map((hour, hourIndex) => (
                                                    <td
                                                        key={hourIndex}
                                                        style={{
                                                            background: hourIndex <= 3 ? "#F0FFF7" : "#FFF7F0",
                                                            border: "1px solid #000",
                                                        }}
                                                    >
                                                        {formatValue(row.hourly_durations?.[hour] || 0)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}

                                        
                                        {/* space b/w table data and total */}
                                        <tr>
                                            <td></td>
                                        </tr>

                                        <tr style={{ background: "#FFECEC" }}>
                                            <td
                                                colSpan="2"
                                                style={{
                                                    fontWeight: 700,
                                                    color: "#7A1F5C",
                                                    border: "1px solid #000",
                                                }}
                                            >
                                                TOTAL
                                            </td>
                                            <td style={{ fontWeight: 700, color: "#7A1F5C", border: "1px solid #000" }}>
                                                {formatValue(totals?.team_unbilled || 0)}
                                            </td>
                                            <td style={{ border: "1px solid #000" }}></td>
                                            <td style={{ border: "1px solid #000" }}></td>
                                            <td style={{ fontWeight: 700, color: "#7A1F5C", border: "1px solid #000" }}>
                                                {formatValue(totals?.total_unbilled || 0)}
                                            </td>
                                            <td style={{ fontWeight: 700, color: "#7A1F5C", border: "1px solid #000" }}>
                                                {formatValue(totals?.unbilled_to_billed || 0)}
                                            </td>
                                            <td style={{ fontWeight: 700, color: "#7A1F5C", border: "1px solid #000" }}>
                                                {formatValue(totals?.new_customer || 0)}
                                            </td>
                                            <td style={{ fontWeight: 700, color: "#7A1F5C", border: "1px solid #000" }}>
                                                {formatValue(totals?.new_conversion || 0)}
                                            </td>
                                            <td style={{ fontWeight: 700, color: "#7A1F5C", border: "1px solid #000" }}>
                                                {formatValue(totals?.billing || 0)}
                                            </td>
                                            <td style={{ fontWeight: 700, color: "#7A1F5C", border: "1px solid #000" }}>
                                                {formatValue(totals?.volume || 0)}
                                            </td>

                                            {hourlyHeaders.map((hour, index) => (
                                                <td
                                                    key={index}
                                                    style={{
                                                        fontWeight: 700,
                                                        color: "#7A1F5C",
                                                        border: "1px solid #000",
                                                    }}
                                                >
                                                    {formatValue(totals?.hourly_durations?.[hour] || 0)}
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </React.Fragment>
    );
};

export default SalesTeamSummaryReport;