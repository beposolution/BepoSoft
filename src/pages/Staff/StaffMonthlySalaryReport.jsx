import React, {
    useEffect,
    useMemo,
    useState,
} from "react";
import axios from "axios";
import {
    Card,
    CardBody,
    CardTitle,
    Col,
    Container,
    Input,
    Label,
    Row,
    Spinner,
    Table,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const StaffMonthlySalaryReport = () => {
    document.title = "Staff Monthly Salary Report | Beposoft";

    const token = localStorage.getItem("token");
    const currentDate = new Date();
    const [salaryList, setSalaryList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [selectedYear, setSelectedYear] = useState(
        String(currentDate.getFullYear())
    );
    const [selectedMonth, setSelectedMonth] = useState(
        String(currentDate.getMonth() + 1)
    );
    const [staffList, setStaffList] = useState([]);
    const [staffLoading, setStaffLoading] =
        useState(false);
    const [selectedStaffId, setSelectedStaffId] =
        useState("");

    const months = [
        {
            value: "1",
            label: "January",
        },
        {
            value: "2",
            label: "February",
        },
        {
            value: "3",
            label: "March",
        },
        {
            value: "4",
            label: "April",
        },
        {
            value: "5",
            label: "May",
        },
        {
            value: "6",
            label: "June",
        },
        {
            value: "7",
            label: "July",
        },
        {
            value: "8",
            label: "August",
        },
        {
            value: "9",
            label: "September",
        },
        {
            value: "10",
            label: "October",
        },
        {
            value: "11",
            label: "November",
        },
        {
            value: "12",
            label: "December",
        },
    ];

    const currentYear = currentDate.getFullYear();

    const years = [];

    for (
        let year = currentYear - 10;
        year <= currentYear + 1;
        year++
    ) {
        years.push(year);
    }

    const formatCurrency = (value) => {
        const number = Number(value || 0);

        return number.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatNumber = (value) => {
        const number = Number(value || 0);

        if (Number.isInteger(number)) {
            return number.toString();
        }

        return number.toFixed(1);
    };

    const getMonthName = (monthNumber) => {
        const month = months.find(
            (item) =>
                Number(item.value) ===
                Number(monthNumber)
        );

        return month?.label || "-";
    };

    const fetchStaff = async () => {
        try {
            setStaffLoading(true);

            const baseUrl =
                import.meta.env.VITE_APP_KEY;

            const response = await axios.get(
                `${baseUrl}staffs/`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data =
                response?.data?.data || [];

            setStaffList(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (err) {
            console.error(
                "Staff fetch error:",
                err?.response?.data ||
                err.message
            );

            toast.error(
                err?.response?.data?.message ||
                "Failed to fetch staff list."
            );

            setStaffList([]);
        } finally {
            setStaffLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchStaff();
        }
    }, [token]);

    const staffOptions = useMemo(() => {
        return staffList.map((staffItem) => ({
            value: staffItem.id,

            label: `${staffItem.name || "-"} - ${staffItem.staff_id ||
                staffItem.eid ||
                `ID ${staffItem.id}`
                }`,

            staff: staffItem,
        }));
    }, [staffList]);

    const fetchMonthlySalary = async () => {
        try {
            setLoading(true);

            setError("");

            const baseUrl =
                import.meta.env.VITE_APP_KEY;

            const response = await axios.get(
                `${baseUrl}staff/monthly/salary/`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },

                    params: {
                        year: selectedYear,
                        month: selectedMonth,
                    },
                }
            );

            if (
                response?.data?.status ===
                "success"
            ) {
                const data =
                    response?.data?.data || [];

                setSalaryList(
                    Array.isArray(data)
                        ? data
                        : []
                );
            } else {
                const message =
                    response?.data?.message ||
                    "Failed to fetch monthly salary data.";

                setSalaryList([]);

                setError(message);

                toast.error(message);
            }
        } catch (err) {
            console.error(
                "Monthly salary fetch error:",
                err?.response?.data ||
                err.message
            );

            const message =
                err?.response?.data?.message ||
                "Failed to fetch monthly salary data.";

            setSalaryList([]);

            setError(message);

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchMonthlySalary();
        }
    }, [
        token,
        selectedYear,
        selectedMonth,
    ]);

    const filteredSalaryList = useMemo(() => {
        if (!selectedStaffId) {
            return salaryList;
        }

        return salaryList.filter(
            (item) =>
                String(item.staff) ===
                String(selectedStaffId)
        );
    }, [
        salaryList,
        selectedStaffId,
    ]);

    const summary = useMemo(() => {
        return filteredSalaryList.reduce(
            (result, item) => {
                result.totalStaff += 1;

                result.totalBaseSalary +=
                    Number(
                        item.monthly_salary || 0
                    );

                result.totalBonus +=
                    Number(
                        item.bonus || 0
                    );

                result.totalIncentives +=
                    Number(
                        item.incentives || 0
                    );

                result.totalFines +=
                    Number(
                        item.fines || 0
                    );

                result.totalLateDeduction +=
                    Number(
                        item.late_come_deduction ||
                        0
                    );

                result.totalFinalSalary +=
                    Number(
                        item.final_salary || 0
                    );

                return result;
            },
            {
                totalStaff: 0,
                totalBaseSalary: 0,
                totalBonus: 0,
                totalIncentives: 0,
                totalFines: 0,
                totalLateDeduction: 0,
                totalFinalSalary: 0,
            }
        );
    }, [filteredSalaryList]);

    const selectedStaff = staffList.find(
        (staffItem) =>
            String(staffItem.id) ===
            String(selectedStaffId)
    );

    const getExportFileName = (extension) => {
        const monthName = getMonthName(selectedMonth).replace(/\s+/g, "_");
        const staffName = selectedStaff?.name
            ? `_${selectedStaff.name.replace(/[^a-zA-Z0-9]+/g, "_")}`
            : "";

        return `Monthly_Salary_Report_${monthName}_${selectedYear}${staffName}.${extension}`;
    };

    const exportToExcel = () => {
        try {
            if (!filteredSalaryList.length) {
                toast.error("No salary records available to export.");
                return;
            }

            const workbook = XLSX.utils.book_new();

            const reportMonth = `${getMonthName(selectedMonth)} ${selectedYear}`;
            const staffText = selectedStaff
                ? `${selectedStaff.name || "-"} - ${selectedStaff.staff_id ||
                selectedStaff.eid ||
                selectedStaff.id ||
                "-"
                }`
                : "All Staff";

            const data = [];

            // ============================================================
            // REPORT HEADER
            // ============================================================

            data.push(["STAFF MONTHLY SALARY REPORT"]);
            data.push(["BEPOSOFT"]);
            data.push([]);

            data.push([
                "Report Period",
                reportMonth,
                "",
                "Staff Filter",
                staffText,
            ]);

            data.push([
                "Generated On",
                new Date().toLocaleString("en-IN"),
                "",
                "Total Records",
                filteredSalaryList.length,
            ]);

            data.push([]);

            // ============================================================
            // PAYROLL SUMMARY
            // ============================================================

            data.push(["PAYROLL SUMMARY"]);

            data.push([
                "Total Staff",
                summary.totalStaff,
                "Base Salary",
                Number(summary.totalBaseSalary || 0),
                "Final Salary",
                Number(summary.totalFinalSalary || 0),
            ]);

            data.push([
                "Total Bonus",
                Number(summary.totalBonus || 0),
                "Total Incentives",
                Number(summary.totalIncentives || 0),
                "Total Fines",
                Number(summary.totalFines || 0),
            ]);

            data.push([
                "Late Deduction",
                Number(summary.totalLateDeduction || 0),
            ]);

            data.push([]);

            // ============================================================
            // STAFF SALARY DETAILS
            // ============================================================

            data.push(["STAFF SALARY DETAILS"]);

            const headerRowIndex = data.length;

            data.push([
                "SL",
                "Staff ID",
                "Staff Name",
                "Present",
                "Absent",
                "Half Day",
                "Paid Leave",
                "Monthly Salary",
                "Per Day",
                "Attendance Payable",
                "Bonus",
                "Incentives",
                "Late Comes",
                "Late Leave",
                "Late Deduction",
                "Fines",
                "Final Salary",
                "Note",
            ]);

            filteredSalaryList.forEach((item, index) => {
                data.push([
                    index + 1,
                    item.staff_id || "-",
                    item.staff_name || "-",
                    Number(item.present || 0),
                    Number(item.absent || 0),
                    Number(item.half_day || 0),
                    Number(item.paid_leaves || 0),
                    Number(item.monthly_salary || 0),
                    Number(item.per_day_salary || 0),
                    Number(item.attendance_payable_salary || 0),
                    Number(item.bonus || 0),
                    Number(item.incentives || 0),
                    Number(item.late_comes || 0),
                    Number(item.late_leave_days || 0),
                    Number(item.late_come_deduction || 0),
                    Number(item.fines || 0),
                    Number(item.final_salary || 0),
                    item.note || "-",
                ]);
            });

            const totalRowIndex = data.length;

            data.push([
                "",
                "",
                "TOTAL",
                "",
                "",
                "",
                "",
                Number(summary.totalBaseSalary || 0),
                "",
                "",
                Number(summary.totalBonus || 0),
                Number(summary.totalIncentives || 0),
                "",
                "",
                Number(summary.totalLateDeduction || 0),
                Number(summary.totalFines || 0),
                Number(summary.totalFinalSalary || 0),
                "",
            ]);

            const worksheet = XLSX.utils.aoa_to_sheet(data);

            // ============================================================
            // MERGES
            // ============================================================

            worksheet["!merges"] = [
                {
                    s: { r: 0, c: 0 },
                    e: { r: 0, c: 17 },
                },
                {
                    s: { r: 1, c: 0 },
                    e: { r: 1, c: 17 },
                },
                {
                    s: { r: 6, c: 0 },
                    e: { r: 6, c: 17 },
                },
                {
                    s: { r: 11, c: 0 },
                    e: { r: 11, c: 17 },
                },
            ];

            // ============================================================
            // COLUMN WIDTHS
            // ============================================================

            worksheet["!cols"] = [
                { wch: 6 },
                { wch: 15 },
                { wch: 25 },
                { wch: 10 },
                { wch: 10 },
                { wch: 10 },
                { wch: 12 },
                { wch: 17 },
                { wch: 14 },
                { wch: 20 },
                { wch: 14 },
                { wch: 14 },
                { wch: 12 },
                { wch: 12 },
                { wch: 17 },
                { wch: 14 },
                { wch: 18 },
                { wch: 32 },
            ];

            // ============================================================
            // ROW HEIGHTS
            // ============================================================

            worksheet["!rows"] = [
                { hpt: 28 },
                { hpt: 20 },
                { hpt: 8 },
                { hpt: 22 },
                { hpt: 22 },
                { hpt: 8 },
                { hpt: 24 },
                { hpt: 24 },
                { hpt: 24 },
                { hpt: 24 },
                { hpt: 8 },
                { hpt: 24 },
                { hpt: 30 },
            ];

            const thinBorder = {
                top: {
                    style: "thin",
                    color: { rgb: "D9E2F3" },
                },
                bottom: {
                    style: "thin",
                    color: { rgb: "D9E2F3" },
                },
                left: {
                    style: "thin",
                    color: { rgb: "D9E2F3" },
                },
                right: {
                    style: "thin",
                    color: { rgb: "D9E2F3" },
                },
            };

            const range = XLSX.utils.decode_range(worksheet["!ref"]);

            // ============================================================
            // DEFAULT STYLE
            // ============================================================

            for (let row = range.s.r; row <= range.e.r; row++) {
                for (let col = range.s.c; col <= range.e.c; col++) {
                    const address = XLSX.utils.encode_cell({
                        r: row,
                        c: col,
                    });

                    if (!worksheet[address]) {
                        worksheet[address] = {
                            t: "s",
                            v: "",
                        };
                    }

                    worksheet[address].s = {
                        font: {
                            name: "Calibri",
                            sz: 10,
                            color: {
                                rgb: "1F2937",
                            },
                        },
                        alignment: {
                            vertical: "center",
                            wrapText: true,
                        },
                    };
                }
            }

            // ============================================================
            // MAIN TITLE
            // ============================================================

            worksheet["A1"].s = {
                font: {
                    name: "Calibri",
                    sz: 18,
                    bold: true,
                    color: {
                        rgb: "FFFFFF",
                    },
                },
                fill: {
                    fgColor: {
                        rgb: "17365D",
                    },
                },
                alignment: {
                    horizontal: "center",
                    vertical: "center",
                },
            };

            worksheet["A2"].s = {
                font: {
                    name: "Calibri",
                    sz: 11,
                    bold: true,
                    color: {
                        rgb: "D9EAF7",
                    },
                },
                fill: {
                    fgColor: {
                        rgb: "17365D",
                    },
                },
                alignment: {
                    horizontal: "center",
                    vertical: "center",
                },
            };

            // ============================================================
            // REPORT INFORMATION
            // ============================================================

            [3, 4].forEach((row) => {
                for (let col = 0; col <= 4; col++) {
                    const address = XLSX.utils.encode_cell({
                        r: row,
                        c: col,
                    });

                    worksheet[address].s = {
                        ...worksheet[address].s,
                        border: thinBorder,
                        fill: {
                            fgColor: {
                                rgb:
                                    col === 0 || col === 3
                                        ? "D9EAF7"
                                        : "FFFFFF",
                            },
                        },
                        font: {
                            name: "Calibri",
                            sz: 10,
                            bold: col === 0 || col === 3,
                            color: {
                                rgb: "1F2937",
                            },
                        },
                    };
                }
            });

            // ============================================================
            // SECTION HEADERS
            // ============================================================

            [6, 11].forEach((row) => {
                const address = XLSX.utils.encode_cell({
                    r: row,
                    c: 0,
                });

                worksheet[address].s = {
                    font: {
                        name: "Calibri",
                        sz: 12,
                        bold: true,
                        color: {
                            rgb: "FFFFFF",
                        },
                    },
                    fill: {
                        fgColor: {
                            rgb: "1F4E78",
                        },
                    },
                    alignment: {
                        horizontal: "left",
                        vertical: "center",
                    },
                };
            });

            // ============================================================
            // SUMMARY CARDS
            // ============================================================

            [7, 8, 9].forEach((row) => {
                for (let col = 0; col <= 5; col++) {
                    const address = XLSX.utils.encode_cell({
                        r: row,
                        c: col,
                    });

                    worksheet[address].s = {
                        ...worksheet[address].s,
                        border: thinBorder,
                        fill: {
                            fgColor: {
                                rgb:
                                    col % 2 === 0
                                        ? "EAF2F8"
                                        : "FFFFFF",
                            },
                        },
                        font: {
                            name: "Calibri",
                            sz: 10,
                            bold: col % 2 === 0,
                            color: {
                                rgb: "1F2937",
                            },
                        },
                    };
                }
            });

            // ============================================================
            // TABLE HEADER
            // ============================================================

            for (let col = 0; col <= 17; col++) {
                const address = XLSX.utils.encode_cell({
                    r: headerRowIndex,
                    c: col,
                });

                worksheet[address].s = {
                    font: {
                        name: "Calibri",
                        sz: 10,
                        bold: true,
                        color: {
                            rgb: "FFFFFF",
                        },
                    },
                    fill: {
                        fgColor: {
                            rgb: "17365D",
                        },
                    },
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                        wrapText: true,
                    },
                    border: {
                        top: {
                            style: "thin",
                            color: {
                                rgb: "FFFFFF",
                            },
                        },
                        bottom: {
                            style: "thin",
                            color: {
                                rgb: "FFFFFF",
                            },
                        },
                        left: {
                            style: "thin",
                            color: {
                                rgb: "FFFFFF",
                            },
                        },
                        right: {
                            style: "thin",
                            color: {
                                rgb: "FFFFFF",
                            },
                        },
                    },
                };
            }

            // ============================================================
            // DETAIL ROWS
            // ============================================================

            for (
                let row = headerRowIndex + 1;
                row < totalRowIndex;
                row++
            ) {
                for (let col = 0; col <= 17; col++) {
                    const address = XLSX.utils.encode_cell({
                        r: row,
                        c: col,
                    });

                    worksheet[address].s = {
                        ...worksheet[address].s,

                        fill: {
                            fgColor: {
                                rgb:
                                    row % 2 === 0
                                        ? "F7FAFC"
                                        : "FFFFFF",
                            },
                        },

                        border: thinBorder,

                        alignment: {
                            horizontal:
                                col >= 7 && col <= 16
                                    ? "right"
                                    : col === 0 ||
                                        (col >= 3 && col <= 6)
                                        ? "center"
                                        : "left",

                            vertical: "center",
                            wrapText: true,
                        },
                    };
                }

                // Bonus
                worksheet[
                    XLSX.utils.encode_cell({
                        r: row,
                        c: 10,
                    })
                ].s.font = {
                    bold: true,
                    color: {
                        rgb: "008000",
                    },
                };

                // Incentives
                worksheet[
                    XLSX.utils.encode_cell({
                        r: row,
                        c: 11,
                    })
                ].s.font = {
                    bold: true,
                    color: {
                        rgb: "008000",
                    },
                };

                // Late deduction
                worksheet[
                    XLSX.utils.encode_cell({
                        r: row,
                        c: 14,
                    })
                ].s.font = {
                    color: {
                        rgb: "C00000",
                    },
                };

                // Fines
                worksheet[
                    XLSX.utils.encode_cell({
                        r: row,
                        c: 15,
                    })
                ].s.font = {
                    color: {
                        rgb: "C00000",
                    },
                };

                // Final salary
                worksheet[
                    XLSX.utils.encode_cell({
                        r: row,
                        c: 16,
                    })
                ].s = {
                    ...worksheet[
                        XLSX.utils.encode_cell({
                            r: row,
                            c: 16,
                        })
                    ].s,

                    font: {
                        bold: true,
                        color: {
                            rgb: "006100",
                        },
                    },

                    fill: {
                        fgColor: {
                            rgb: "E2F0D9",
                        },
                    },
                };
            }

            // ============================================================
            // CURRENCY FORMAT
            // ============================================================

            const currencyColumns = [
                7,
                8,
                9,
                10,
                11,
                14,
                15,
                16,
            ];

            for (
                let row = headerRowIndex + 1;
                row <= totalRowIndex;
                row++
            ) {
                currencyColumns.forEach((col) => {
                    const address = XLSX.utils.encode_cell({
                        r: row,
                        c: col,
                    });

                    if (worksheet[address]) {
                        worksheet[address].z =
                            '₹#,##0.00;[Red]-₹#,##0.00';
                    }
                });
            }

            // ============================================================
            // TOTAL ROW
            // ============================================================

            for (let col = 0; col <= 17; col++) {
                const address = XLSX.utils.encode_cell({
                    r: totalRowIndex,
                    c: col,
                });

                worksheet[address].s = {
                    ...worksheet[address].s,

                    font: {
                        name: "Calibri",
                        sz: 10,
                        bold: true,
                        color: {
                            rgb:
                                col === 14 || col === 15
                                    ? "C00000"
                                    : col === 10 ||
                                        col === 11 ||
                                        col === 16
                                        ? "006100"
                                        : "1F2937",
                        },
                    },

                    fill: {
                        fgColor: {
                            rgb:
                                col === 16
                                    ? "C6E0B4"
                                    : "D9EAF7",
                        },
                    },

                    border: {
                        top: {
                            style: "medium",
                            color: {
                                rgb: "17365D",
                            },
                        },
                        bottom: {
                            style: "medium",
                            color: {
                                rgb: "17365D",
                            },
                        },
                        left: {
                            style: "thin",
                            color: {
                                rgb: "A6A6A6",
                            },
                        },
                        right: {
                            style: "thin",
                            color: {
                                rgb: "A6A6A6",
                            },
                        },
                    },

                    alignment: {
                        horizontal:
                            col >= 7 && col <= 16
                                ? "right"
                                : "center",

                        vertical: "center",
                    },
                };
            }

            worksheet["!freeze"] = {
                xSplit: 3,
                ySplit: headerRowIndex + 1,
            };

            worksheet["!autofilter"] = {
                ref: XLSX.utils.encode_range({
                    s: {
                        r: headerRowIndex,
                        c: 0,
                    },
                    e: {
                        r: totalRowIndex - 1,
                        c: 17,
                    },
                }),
            };

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Monthly Salary"
            );

            XLSX.writeFile(
                workbook,
                getExportFileName("xlsx")
            );

            toast.success("Excel report exported successfully.");
        } catch (err) {
            console.error("Excel export error:", err);

            toast.error("Failed to export Excel report.");
        }
    };

    const exportToPDF = () => {
        try {
            if (!filteredSalaryList.length) {
                toast.error("No salary records available to export.");
                return;
            }

            const doc = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a3",
            });

            const pageWidth =
                doc.internal.pageSize.getWidth();

            const reportMonth =
                `${getMonthName(selectedMonth)} ${selectedYear}`;

            const staffText = selectedStaff
                ? `${selectedStaff.name || "-"} (${selectedStaff.staff_id ||
                selectedStaff.eid ||
                "-"
                })`
                : "All Staff";

            // ============================================================
            // HEADER
            // ============================================================

            doc.setFillColor(23, 54, 93);

            doc.rect(
                0,
                0,
                pageWidth,
                28,
                "F"
            );

            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);

            doc.text(
                "STAFF MONTHLY SALARY REPORT",
                pageWidth / 2,
                11,
                {
                    align: "center",
                }
            );

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");

            doc.text(
                "BEPOSOFT",
                pageWidth / 2,
                18,
                {
                    align: "center",
                }
            );

            doc.setFontSize(8);

            doc.text(
                `Report Period: ${reportMonth}`,
                10,
                24
            );

            doc.text(
                `Staff: ${staffText}`,
                pageWidth - 10,
                24,
                {
                    align: "right",
                }
            );

            // ============================================================
            // SUMMARY
            // ============================================================

            doc.setTextColor(31, 41, 55);

            doc.setFont(
                "helvetica",
                "bold"
            );

            doc.setFontSize(11);

            doc.text(
                "PAYROLL SUMMARY",
                10,
                37
            );

            autoTable(doc, {
                startY: 41,

                margin: {
                    left: 10,
                    right: 10,
                },

                body: [
                    [
                        "Total Staff",
                        String(summary.totalStaff),

                        "Base Salary",
                        `Rs. ${formatCurrency(
                            summary.totalBaseSalary
                        )}`,

                        "Bonus",
                        `Rs. ${formatCurrency(
                            summary.totalBonus
                        )}`,

                        "Incentives",
                        `Rs. ${formatCurrency(
                            summary.totalIncentives
                        )}`,
                    ],

                    [
                        "Late Deduction",
                        `Rs. ${formatCurrency(
                            summary.totalLateDeduction
                        )}`,

                        "Fines",
                        `Rs. ${formatCurrency(
                            summary.totalFines
                        )}`,

                        "Final Salary",
                        `Rs. ${formatCurrency(
                            summary.totalFinalSalary
                        )}`,

                        "Records",
                        String(
                            filteredSalaryList.length
                        ),
                    ],
                ],

                theme: "grid",

                styles: {
                    fontSize: 8,
                    cellPadding: 2.5,
                    lineColor: [217, 226, 243],
                    lineWidth: 0.2,
                    valign: "middle",
                },

                columnStyles: {
                    0: {
                        fillColor: [217, 234, 247],
                        fontStyle: "bold",
                    },

                    2: {
                        fillColor: [217, 234, 247],
                        fontStyle: "bold",
                    },

                    4: {
                        fillColor: [217, 234, 247],
                        fontStyle: "bold",
                    },

                    6: {
                        fillColor: [217, 234, 247],
                        fontStyle: "bold",
                    },
                },
            });

            const detailsStartY =
                doc.lastAutoTable.finalY + 10;

            doc.setTextColor(31, 41, 55);
            doc.setFont(
                "helvetica",
                "bold"
            );

            doc.setFontSize(11);

            doc.text(
                "STAFF SALARY DETAILS",
                10,
                detailsStartY
            );

            // ============================================================
            // TABLE
            // ============================================================

            const tableRows =
                filteredSalaryList.map(
                    (item, index) => [
                        index + 1,

                        item.staff_id || "-",

                        item.staff_name || "-",

                        formatNumber(
                            item.present
                        ),

                        formatNumber(
                            item.absent
                        ),

                        formatNumber(
                            item.half_day
                        ),

                        formatNumber(
                            item.paid_leaves
                        ),

                        formatCurrency(
                            item.monthly_salary
                        ),

                        formatCurrency(
                            item.per_day_salary
                        ),

                        formatCurrency(
                            item.attendance_payable_salary
                        ),

                        formatCurrency(
                            item.bonus
                        ),

                        formatCurrency(
                            item.incentives
                        ),

                        item.late_comes || 0,

                        formatNumber(
                            item.late_leave_days
                        ),

                        formatCurrency(
                            item.late_come_deduction
                        ),

                        formatCurrency(
                            item.fines
                        ),

                        formatCurrency(
                            item.final_salary
                        ),

                        item.note || "-",
                    ]
                );

            tableRows.push([
                "",
                "",
                "TOTAL",
                "",
                "",
                "",
                "",
                formatCurrency(
                    summary.totalBaseSalary
                ),
                "",
                "",
                formatCurrency(
                    summary.totalBonus
                ),
                formatCurrency(
                    summary.totalIncentives
                ),
                "",
                "",
                formatCurrency(
                    summary.totalLateDeduction
                ),
                formatCurrency(
                    summary.totalFines
                ),
                formatCurrency(
                    summary.totalFinalSalary
                ),
                "",
            ]);

            autoTable(doc, {
                startY:
                    detailsStartY + 4,

                head: [[
                    "SL",
                    "Staff ID",
                    "Staff Name",
                    "Present",
                    "Absent",
                    "Half Day",
                    "Paid Leave",
                    "Monthly Salary",
                    "Per Day",
                    "Attendance Payable",
                    "Bonus",
                    "Incentives",
                    "Late Comes",
                    "Late Leave",
                    "Late Deduction",
                    "Fines",
                    "Final Salary",
                    "Note",
                ]],

                body: tableRows,

                theme: "grid",

                margin: {
                    left: 7,
                    right: 7,
                    bottom: 15,
                },

                styles: {
                    font: "helvetica",
                    fontSize: 6.5,
                    cellPadding: 1.7,
                    valign: "middle",
                    lineColor: [
                        217,
                        226,
                        243,
                    ],
                    lineWidth: 0.15,
                    overflow: "linebreak",
                },

                headStyles: {
                    fillColor: [
                        23,
                        54,
                        93,
                    ],
                    textColor: [
                        255,
                        255,
                        255,
                    ],
                    fontStyle: "bold",
                    halign: "center",
                    valign: "middle",
                    minCellHeight: 9,
                },

                alternateRowStyles: {
                    fillColor: [
                        247,
                        250,
                        252,
                    ],
                },

                columnStyles: {
                    0: {
                        halign: "center",
                        cellWidth: 8,
                    },

                    1: {
                        cellWidth: 17,
                    },

                    2: {
                        cellWidth: 28,
                    },

                    3: {
                        halign: "center",
                        cellWidth: 12,
                    },

                    4: {
                        halign: "center",
                        cellWidth: 12,
                    },

                    5: {
                        halign: "center",
                        cellWidth: 12,
                    },

                    6: {
                        halign: "center",
                        cellWidth: 13,
                    },

                    7: {
                        halign: "right",
                        cellWidth: 20,
                    },

                    8: {
                        halign: "right",
                        cellWidth: 17,
                    },

                    9: {
                        halign: "right",
                        cellWidth: 23,
                    },

                    10: {
                        halign: "right",
                        cellWidth: 16,
                    },

                    11: {
                        halign: "right",
                        cellWidth: 16,
                    },

                    12: {
                        halign: "center",
                        cellWidth: 13,
                    },

                    13: {
                        halign: "center",
                        cellWidth: 13,
                    },

                    14: {
                        halign: "right",
                        cellWidth: 20,
                    },

                    15: {
                        halign: "right",
                        cellWidth: 15,
                    },

                    16: {
                        halign: "right",
                        cellWidth: 20,
                    },

                    17: {
                        cellWidth: 32,
                    },
                },

                didParseCell: (data) => {
                    const isLastRow =
                        data.section === "body" &&
                        data.row.index ===
                        tableRows.length - 1;

                    if (isLastRow) {
                        data.cell.styles.fillColor =
                            [217, 234, 247];

                        data.cell.styles.fontStyle =
                            "bold";

                        data.cell.styles.textColor =
                            [31, 41, 55];

                        if (
                            data.column.index ===
                            10 ||
                            data.column.index ===
                            11 ||
                            data.column.index ===
                            16
                        ) {
                            data.cell.styles.textColor =
                                [0, 97, 0];
                        }

                        if (
                            data.column.index ===
                            14 ||
                            data.column.index ===
                            15
                        ) {
                            data.cell.styles.textColor =
                                [192, 0, 0];
                        }
                    } else if (
                        data.section ===
                        "body"
                    ) {
                        // Bonus / Incentive
                        if (
                            data.column.index ===
                            10 ||
                            data.column.index ===
                            11
                        ) {
                            data.cell.styles.textColor =
                                [0, 128, 0];

                            data.cell.styles.fontStyle =
                                "bold";
                        }

                        // Deductions
                        if (
                            data.column.index ===
                            14 ||
                            data.column.index ===
                            15
                        ) {
                            data.cell.styles.textColor =
                                [192, 0, 0];
                        }

                        // Final salary
                        if (
                            data.column.index ===
                            16
                        ) {
                            data.cell.styles.textColor =
                                [0, 97, 0];

                            data.cell.styles.fontStyle =
                                "bold";

                            data.cell.styles.fillColor =
                                [226, 240, 217];
                        }
                    }
                },

                didDrawPage: () => {
                    const pageNumber =
                        doc.internal.getNumberOfPages();

                    const pageHeight =
                        doc.internal.pageSize.getHeight();

                    doc.setFontSize(7);

                    doc.setTextColor(
                        120,
                        120,
                        120
                    );

                    doc.text(
                        `Monthly Salary Report - ${reportMonth}`,
                        10,
                        pageHeight - 7
                    );

                    doc.text(
                        `Page ${pageNumber}`,
                        pageWidth - 10,
                        pageHeight - 7,
                        {
                            align: "right",
                        }
                    );
                },
            });

            doc.save(
                getExportFileName("pdf")
            );

            toast.success(
                "PDF report exported successfully."
            );
        } catch (err) {
            console.error(
                "PDF export error:",
                err
            );

            toast.error(
                "Failed to export PDF report."
            );
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs
                        title="Staff"
                        breadcrumbItem="Monthly Salary Report"
                    />

                    <ToastContainer />

                    <Card className="mb-4">
                        <CardBody>
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                                <CardTitle className="mb-0">
                                    Monthly Salary Report
                                </CardTitle>

                                <div className="d-flex gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-success"
                                        onClick={exportToExcel}
                                        disabled={
                                            loading ||
                                            filteredSalaryList.length === 0
                                        }
                                    >
                                        <i className="bx bx-spreadsheet me-1"></i>
                                        Export Excel
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={exportToPDF}
                                        disabled={
                                            loading ||
                                            filteredSalaryList.length === 0
                                        }
                                    >
                                        <i className="bx bxs-file-pdf me-1"></i>
                                        Export PDF
                                    </button>
                                </div>
                            </div>

                            <Row>
                                {/* YEAR */}

                                <Col
                                    lg={3}
                                    md={4}
                                    className="mb-3"
                                >
                                    <Label>
                                        Year
                                    </Label>

                                    <Input
                                        type="select"
                                        value={
                                            selectedYear
                                        }
                                        onChange={(e) =>
                                            setSelectedYear(
                                                e.target.value
                                            )
                                        }
                                        disabled={
                                            loading
                                        }
                                    >
                                        {years.map(
                                            (year) => (
                                                <option
                                                    key={
                                                        year
                                                    }
                                                    value={
                                                        year
                                                    }
                                                >
                                                    {
                                                        year
                                                    }
                                                </option>
                                            )
                                        )}
                                    </Input>
                                </Col>

                                {/* MONTH */}

                                <Col
                                    lg={3}
                                    md={4}
                                    className="mb-3"
                                >
                                    <Label>
                                        Month
                                    </Label>

                                    <Input
                                        type="select"
                                        value={
                                            selectedMonth
                                        }
                                        onChange={(e) =>
                                            setSelectedMonth(
                                                e.target.value
                                            )
                                        }
                                        disabled={
                                            loading
                                        }
                                    >
                                        {months.map(
                                            (month) => (
                                                <option
                                                    key={
                                                        month.value
                                                    }
                                                    value={
                                                        month.value
                                                    }
                                                >
                                                    {
                                                        month.label
                                                    }
                                                </option>
                                            )
                                        )}
                                    </Input>
                                </Col>

                                {/* SEARCH STAFF */}

                                <Col
                                    lg={6}
                                    md={4}
                                    className="mb-3"
                                >
                                    <Label>
                                        Search Staff
                                    </Label>

                                    <Select
                                        options={
                                            staffOptions
                                        }
                                        value={
                                            staffOptions.find(
                                                (
                                                    option
                                                ) =>
                                                    String(
                                                        option.value
                                                    ) ===
                                                    String(
                                                        selectedStaffId
                                                    )
                                            ) ||
                                            null
                                        }
                                        onChange={(
                                            selectedOption
                                        ) => {
                                            setSelectedStaffId(
                                                selectedOption
                                                    ? selectedOption.value
                                                    : ""
                                            );
                                        }}
                                        placeholder={
                                            staffLoading
                                                ? "Loading Staff..."
                                                : "Search or Select Staff"
                                        }
                                        isSearchable
                                        isClearable
                                        isLoading={
                                            staffLoading
                                        }
                                        isDisabled={
                                            staffLoading ||
                                            loading
                                        }
                                        noOptionsMessage={() =>
                                            "No staff found"
                                        }
                                        filterOption={(
                                            option,
                                            inputValue
                                        ) => {
                                            const search =
                                                inputValue
                                                    .toLowerCase()
                                                    .trim();

                                            const staffItem =
                                                option
                                                    .data
                                                    .staff;

                                            const searchableText =
                                                [
                                                    staffItem?.name,
                                                    staffItem?.staff_id,
                                                    staffItem?.eid,
                                                    staffItem?.department_name,
                                                    staffItem?.designation,
                                                ]
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .join(
                                                        " "
                                                    )
                                                    .toLowerCase();

                                            return searchableText.includes(
                                                search
                                            );
                                        }}
                                        styles={{
                                            control: (
                                                base,
                                                state
                                            ) => ({
                                                ...base,

                                                minHeight:
                                                    "36px",

                                                borderColor:
                                                    state.isFocused
                                                        ? "#86b7fe"
                                                        : "#ced4da",

                                                boxShadow:
                                                    state.isFocused
                                                        ? "0 0 0 0.25rem rgba(13, 110, 253, 0.25)"
                                                        : "none",

                                                "&:hover":
                                                {
                                                    borderColor:
                                                        state.isFocused
                                                            ? "#86b7fe"
                                                            : "#ced4da",
                                                },
                                            }),

                                            menu: (
                                                base
                                            ) => ({
                                                ...base,
                                                zIndex: 9999,
                                            }),

                                            menuPortal: (
                                                base
                                            ) => ({
                                                ...base,
                                                zIndex: 9999,
                                            }),
                                        }}
                                        menuPortalTarget={
                                            document.body
                                        }
                                    />
                                </Col>
                            </Row>

                            <div className="text-muted">
                                Showing salary records for{" "}
                                <strong>
                                    {getMonthName(
                                        selectedMonth
                                    )}{" "}
                                    {selectedYear}
                                </strong>

                                {selectedStaff && (
                                    <>
                                        {" | Staff: "}
                                        <strong>
                                            {selectedStaff.name ||
                                                "-"}
                                        </strong>
                                    </>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {loading && (
                        <Card className="mb-4">
                            <CardBody>
                                <div
                                    className="d-flex justify-content-center align-items-center"
                                    style={{
                                        minHeight:
                                            "200px",
                                    }}
                                >
                                    <Spinner
                                        color="primary"
                                    />

                                    <span className="ms-2">
                                        Loading monthly
                                        salary data...
                                    </span>
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    {!loading &&
                        error && (
                            <div
                                className="alert alert-danger"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}

                    {!loading &&
                        !error && (
                            <>

                                <Row className="mb-4">
                                    {/* TOTAL STAFF */}

                                    <Col
                                        xl={3}
                                        md={6}
                                        className="mb-3"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Total
                                                    Staff
                                                </div>

                                                <h3 className="mb-0">
                                                    {
                                                        summary.totalStaff
                                                    }
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    {/* BASE SALARY */}

                                    <Col
                                        xl={3}
                                        md={6}
                                        className="mb-3"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Total
                                                    Base
                                                    Salary
                                                </div>

                                                <h3 className="mb-0">
                                                    ₹
                                                    {formatCurrency(
                                                        summary.totalBaseSalary
                                                    )}
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    {/* BONUS */}

                                    <Col
                                        xl={3}
                                        md={6}
                                        className="mb-3"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Total
                                                    Bonus
                                                </div>

                                                <h3 className="mb-0 text-success">
                                                    ₹
                                                    {formatCurrency(
                                                        summary.totalBonus
                                                    )}
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    {/* INCENTIVES */}

                                    <Col
                                        xl={3}
                                        md={6}
                                        className="mb-3"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Total
                                                    Incentives
                                                </div>

                                                <h3 className="mb-0 text-success">
                                                    ₹
                                                    {formatCurrency(
                                                        summary.totalIncentives
                                                    )}
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    {/* FINES */}

                                    <Col
                                        xl={3}
                                        md={6}
                                        className="mb-3"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Total
                                                    Fines
                                                </div>

                                                <h3 className="mb-0 text-danger">
                                                    ₹
                                                    {formatCurrency(
                                                        summary.totalFines
                                                    )}
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    {/* LATE DEDUCTION */}

                                    <Col
                                        xl={3}
                                        md={6}
                                        className="mb-3"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Late
                                                    Come
                                                    Deduction
                                                </div>

                                                <h3 className="mb-0 text-danger">
                                                    ₹
                                                    {formatCurrency(
                                                        summary.totalLateDeduction
                                                    )}
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    {/* FINAL SALARY */}

                                    <Col
                                        xl={6}
                                        md={12}
                                        className="mb-3"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Total
                                                    Final
                                                    Salary
                                                </div>

                                                <h2 className="mb-0 text-success">
                                                    ₹
                                                    {formatCurrency(
                                                        summary.totalFinalSalary
                                                    )}
                                                </h2>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* ===================================== */}
                                {/* SALARY TABLE */}
                                {/* ===================================== */}

                                <Card className="mb-4">
                                    <CardBody>
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <CardTitle className="mb-0">
                                                Staff
                                                Salary
                                                Details
                                            </CardTitle>

                                            <div className="text-muted">
                                                {
                                                    filteredSalaryList.length
                                                }{" "}
                                                Record
                                                {filteredSalaryList.length !==
                                                    1
                                                    ? "s"
                                                    : ""}
                                            </div>
                                        </div>

                                        {filteredSalaryList.length ===
                                            0 ? (
                                            <div
                                                className="text-center text-muted"
                                                style={{
                                                    padding:
                                                        "50px 20px",
                                                }}
                                            >
                                                No monthly
                                                salary records
                                                found for{" "}
                                                {selectedStaff
                                                    ? `${selectedStaff.name ||
                                                    "selected staff"
                                                    } in `
                                                    : ""}
                                                {getMonthName(
                                                    selectedMonth
                                                )}{" "}
                                                {
                                                    selectedYear
                                                }
                                                .
                                            </div>
                                        ) : (
                                            <div
                                                className="table-responsive"
                                                style={{
                                                    maxHeight:
                                                        "650px",
                                                    overflowY:
                                                        "auto",
                                                }}
                                            >
                                                <Table
                                                    bordered
                                                    hover
                                                    className="align-middle mb-0"
                                                    style={{
                                                        whiteSpace:
                                                            "nowrap",
                                                    }}
                                                >
                                                    <thead
                                                        className="table-light"
                                                        style={{
                                                            position:
                                                                "sticky",
                                                            top: 0,
                                                            zIndex:
                                                                2,
                                                        }}
                                                    >
                                                        <tr>
                                                            <th>
                                                                SL
                                                            </th>

                                                            <th>
                                                                Staff
                                                                ID
                                                            </th>

                                                            <th>
                                                                Staff
                                                                Name
                                                            </th>

                                                            <th className="text-center">
                                                                Present
                                                            </th>

                                                            <th className="text-center">
                                                                Absent
                                                            </th>

                                                            <th className="text-center">
                                                                Half
                                                                Day
                                                            </th>

                                                            <th className="text-center">
                                                                Paid
                                                                Leave
                                                            </th>

                                                            <th className="text-end">
                                                                Monthly
                                                                Salary
                                                            </th>

                                                            <th className="text-end">
                                                                Per
                                                                Day
                                                            </th>

                                                            <th className="text-end">
                                                                Attendance
                                                                Payable
                                                            </th>

                                                            <th className="text-end">
                                                                Bonus
                                                            </th>

                                                            <th className="text-end">
                                                                Incentives
                                                            </th>

                                                            <th className="text-center">
                                                                Late
                                                                Comes
                                                            </th>

                                                            <th className="text-center">
                                                                Late
                                                                Leave
                                                            </th>

                                                            <th className="text-end">
                                                                Late
                                                                Deduction
                                                            </th>

                                                            <th className="text-end">
                                                                Fines
                                                            </th>

                                                            <th className="text-end">
                                                                Final
                                                                Salary
                                                            </th>

                                                            <th>
                                                                Note
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {filteredSalaryList.map(
                                                            (
                                                                item,
                                                                index
                                                            ) => (
                                                                <tr
                                                                    key={
                                                                        item.id
                                                                    }
                                                                >
                                                                    {/* SL */}

                                                                    <td>
                                                                        {index +
                                                                            1}
                                                                    </td>

                                                                    {/* STAFF ID */}

                                                                    <td>
                                                                        <strong>
                                                                            {item.staff_id ||
                                                                                "-"}
                                                                        </strong>
                                                                    </td>

                                                                    {/* STAFF NAME */}

                                                                    <td>
                                                                        <strong>
                                                                            {item.staff_name ||
                                                                                "-"}
                                                                        </strong>

                                                                        <div
                                                                            className="text-muted"
                                                                            style={{
                                                                                fontSize:
                                                                                    "12px",
                                                                            }}
                                                                        >
                                                                            {getMonthName(
                                                                                item.month
                                                                            )}{" "}
                                                                            {
                                                                                item.year
                                                                            }
                                                                        </div>
                                                                    </td>

                                                                    {/* PRESENT */}

                                                                    <td className="text-center">
                                                                        <span className="text-success fw-bold">
                                                                            {formatNumber(
                                                                                item.present
                                                                            )}
                                                                        </span>
                                                                    </td>

                                                                    {/* ABSENT */}

                                                                    <td className="text-center">
                                                                        <span className="text-danger fw-bold">
                                                                            {formatNumber(
                                                                                item.absent
                                                                            )}
                                                                        </span>
                                                                    </td>

                                                                    {/* HALF DAY */}

                                                                    <td className="text-center">
                                                                        <span className="text-warning fw-bold">
                                                                            {formatNumber(
                                                                                item.half_day
                                                                            )}
                                                                        </span>
                                                                    </td>

                                                                    {/* PAID LEAVE */}

                                                                    <td className="text-center">
                                                                        {formatNumber(
                                                                            item.paid_leaves
                                                                        )}
                                                                    </td>

                                                                    {/* MONTHLY SALARY */}

                                                                    <td className="text-end">
                                                                        ₹
                                                                        {formatCurrency(
                                                                            item.monthly_salary
                                                                        )}
                                                                    </td>

                                                                    {/* PER DAY */}

                                                                    <td className="text-end">
                                                                        ₹
                                                                        {formatCurrency(
                                                                            item.per_day_salary
                                                                        )}
                                                                    </td>

                                                                    {/* ATTENDANCE PAYABLE */}

                                                                    <td className="text-end">
                                                                        ₹
                                                                        {formatCurrency(
                                                                            item.attendance_payable_salary
                                                                        )}
                                                                    </td>

                                                                    {/* BONUS */}

                                                                    <td className="text-end text-success fw-bold">
                                                                        + ₹
                                                                        {formatCurrency(
                                                                            item.bonus
                                                                        )}
                                                                    </td>

                                                                    {/* INCENTIVES */}

                                                                    <td className="text-end text-success fw-bold">
                                                                        + ₹
                                                                        {formatCurrency(
                                                                            item.incentives
                                                                        )}
                                                                    </td>

                                                                    {/* LATE COMES */}

                                                                    <td className="text-center">
                                                                        {
                                                                            item.late_comes
                                                                        }
                                                                    </td>

                                                                    {/* LATE LEAVE */}

                                                                    <td className="text-center">
                                                                        {formatNumber(
                                                                            item.late_leave_days
                                                                        )}
                                                                    </td>

                                                                    {/* LATE DEDUCTION */}

                                                                    <td className="text-end text-danger">
                                                                        - ₹
                                                                        {formatCurrency(
                                                                            item.late_come_deduction
                                                                        )}
                                                                    </td>

                                                                    {/* FINES */}

                                                                    <td className="text-end text-danger">
                                                                        - ₹
                                                                        {formatCurrency(
                                                                            item.fines
                                                                        )}
                                                                    </td>

                                                                    {/* FINAL SALARY */}

                                                                    <td className="text-end">
                                                                        <strong className="text-success">
                                                                            ₹
                                                                            {formatCurrency(
                                                                                item.final_salary
                                                                            )}
                                                                        </strong>
                                                                    </td>

                                                                    {/* NOTE */}

                                                                    <td
                                                                        style={{
                                                                            minWidth:
                                                                                "180px",
                                                                            maxWidth:
                                                                                "250px",
                                                                            whiteSpace:
                                                                                "normal",
                                                                        }}
                                                                    >
                                                                        {item.note ||
                                                                            "-"}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>

                                                    {/* ================= */}
                                                    {/* TOTAL ROW */}
                                                    {/* ================= */}

                                                    <tfoot className="table-light">
                                                        <tr>
                                                            <th
                                                                colSpan={
                                                                    7
                                                                }
                                                                className="text-end"
                                                            >
                                                                TOTAL
                                                            </th>

                                                            <th className="text-end">
                                                                ₹
                                                                {formatCurrency(
                                                                    summary.totalBaseSalary
                                                                )}
                                                            </th>

                                                            <th />

                                                            <th />

                                                            <th className="text-end text-success">
                                                                + ₹
                                                                {formatCurrency(
                                                                    summary.totalBonus
                                                                )}
                                                            </th>

                                                            <th className="text-end text-success">
                                                                + ₹
                                                                {formatCurrency(
                                                                    summary.totalIncentives
                                                                )}
                                                            </th>

                                                            <th />

                                                            <th />

                                                            <th className="text-end text-danger">
                                                                - ₹
                                                                {formatCurrency(
                                                                    summary.totalLateDeduction
                                                                )}
                                                            </th>

                                                            <th className="text-end text-danger">
                                                                - ₹
                                                                {formatCurrency(
                                                                    summary.totalFines
                                                                )}
                                                            </th>

                                                            <th className="text-end text-success">
                                                                ₹
                                                                {formatCurrency(
                                                                    summary.totalFinalSalary
                                                                )}
                                                            </th>

                                                            <th />
                                                        </tr>
                                                    </tfoot>
                                                </Table>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            </>
                        )}
                </Container>
            </div>
        </React.Fragment>
    );
};

export default StaffMonthlySalaryReport;