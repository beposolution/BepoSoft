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
                { wch: 30 },
                { wch: 22 },
            ];

            // ================= MERGE TITLE =================
            ws["!merges"] = [
                {
                    s: { r: 0, c: 0 },
                    e: { r: 0, c: 11 },
                },
            ];

            const range = XLSX.utils.decode_range(ws["!ref"]);

            // ================= COLORS =================
            const headingColor = "00BDB4";
            const titleColor = "1F4E79";
            const yesColor = "28A745";
            const noColor = "FF0000";

            // ================= STYLE LOOP =================
            for (let R = range.s.r; R <= range.e.r; R++) {
                for (let C = range.s.c; C <= range.e.c; C++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    const cell = ws[cellAddress];
                    if (!cell) continue;

                    // Default Style
                    cell.s = {
                        font: { name: "Calibri", sz: 11 },
                        alignment: {
                            horizontal: "center",
                            vertical: "center",
                            wrapText: true,
                        },
                        border: {
                            top: { style: "thin", color: { rgb: "AAAAAA" } },
                            bottom: { style: "thin", color: { rgb: "AAAAAA" } },
                            left: { style: "thin", color: { rgb: "AAAAAA" } },
                            right: { style: "thin", color: { rgb: "AAAAAA" } },
                        },
                    };

                    // Title row
                    if (R === 0) {
                        cell.s = {
                            font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            fill: { fgColor: { rgb: titleColor } },
                        };
                    }

                    // Header row
                    if (R === 2) {
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

                    // MD column YES/NO (index 8)
                    if (C === 8 && R > 2) {
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

                    // NC column YES/NO (index 9)
                    if (C === 9 && R > 2) {
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

                    // Note column left align (index 10)
                    if (C === 10 && R > 2) {
                        cell.s = {
                            ...cell.s,
                            alignment: { horizontal: "left", vertical: "center", wrapText: true },
                        };
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

                if ((item.micro_dealer || "").toLowerCase() === "yes") {
                    groupedData[key].md_yes += 1;
                } else {
                    groupedData[key].md_no += 1;
                }

                if ((item.new_coach || "").toLowerCase() === "yes") {
                    groupedData[key].nc_yes += 1;
                } else {
                    groupedData[key].nc_no += 1;
                }

                groupedData[key].total_reports += 1;
            });

            const summaryList = Object.values(groupedData);

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

            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // ================= MERGE TITLE =================
            ws["!merges"] = [
                {
                    s: { r: 0, c: 0 },
                    e: { r: 0, c: 11 },
                },
            ];

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

            const range = XLSX.utils.decode_range(ws["!ref"]);

            // ================= COLORS =================
            const titleColor = "1F4E79";
            const headingColor = "00BDB4";
            const greenColor = "28A745";
            const redColor = "FF0000";

            for (let R = range.s.r; R <= range.e.r; R++) {
                for (let C = range.s.c; C <= range.e.c; C++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    const cell = ws[cellAddress];
                    if (!cell) continue;

                    // Default Style
                    cell.s = {
                        font: { name: "Calibri", sz: 11 },
                        alignment: {
                            horizontal: "center",
                            vertical: "center",
                            wrapText: true,
                        },
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

                    // Header Row
                    if (R === 2) {
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

                    // YES columns (MD YES, NC YES) -> indexes 7 & 9
                    if ((C === 7 || C === 9) && R > 2) {
                        cell.s = {
                            ...cell.s,
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            fill: { fgColor: { rgb: greenColor } },
                        };
                    }

                    // NO columns (MD NO, NC NO) -> indexes 8 & 10
                    if ((C === 8 || C === 10) && R > 2) {
                        cell.s = {
                            ...cell.s,
                            font: { bold: true, color: { rgb: "FFFFFF" } },
                            fill: { fgColor: { rgb: redColor } },
                        };
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
