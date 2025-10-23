import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Card, CardBody, Col, Row, Table, Label
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";

const DivisionWiseProductReport = () => {
    const token = localStorage.getItem("token");
    const [reportData, setReportData] = useState([]);
    // console.log("report", reportData)
    const [transformedData, setTransformedData] = useState({});
    // console.log("transformedData", transformedData)
    const [allProducts, setAllProducts] = useState([]);
    const [staffData, setStaffData] = useState([]);
    const [familyData, setFamilyData] = useState([]);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        const fetchFamilyData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}familys/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setFamilyData(response?.data?.data);
            } catch (error) {
                toast.error("Error fetching staff data");
            }
        };

        fetchFamilyData();
    }, []);

    useEffect(() => {
        const fetchStaffData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setStaffData(response?.data?.data || []);
            } catch (error) {
                toast.error("Error fetching staff data");
            }
        };

        fetchStaffData();
    }, []);

    const filteredStaff = staffData.filter(
        staff => ["BDM", "BDO"].includes(staff.department_name?.toUpperCase())
    );

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                const params = {};

                if (selectedFamily) params.family = selectedFamily;
                if (startDate) params.start_date = startDate;
                if (endDate) params.end_date = endDate;

                const res = await axios.get(`${import.meta.env.VITE_APP_KEY}product-wise/filter/report/`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: params,
                });

                const data = res?.data?.data || [];

                const filteredStaff = staffData.filter(
                    staff =>
                        ["BDM", "BDO"].includes(staff.department_name?.toUpperCase()) &&
                        (!selectedFamily || staff.family_name?.toLowerCase() === selectedFamily.toLowerCase())
                );

                const bdmBdoIds = filteredStaff.map(staff => staff.id);

                const filteredReport = data.filter(entry =>
                    bdmBdoIds.includes(entry.staff_id) &&
                    (!selectedFamily || entry.family_name?.toLowerCase() === selectedFamily.toLowerCase())
                );

                setReportData(filteredReport);
                transformData(filteredReport, filteredStaff);
            } catch (error) {
                toast.error("Error fetching division-wise report");
            }
        };

        if (staffData.length > 0) {
            fetchReportData();
        }
    }, [staffData, selectedFamily, startDate, endDate]);


    const transformData = (data, filteredStaffList) => {
        const result = {};
        const invoiceCounts = {};
        const allCategoriesSet = new Set();

        // Collect all categories from data
        data.forEach(entry => {
            const catName = entry.category_name || "Uncategorized";
            allCategoriesSet.add(catName);
        });

        // Main aggregation
        data.forEach(entry => {
            const {
                staff_id,
                order_state,
                category_name,
                quantity,
                invoice,
            } = entry;

            const catName = category_name || "Uncategorized";
            const state = order_state || "Unknown";

            // Initialize staff/state/category hierarchy
            if (!result[staff_id]) result[staff_id] = {};
            if (!result[staff_id][state]) result[staff_id][state] = {};
            if (!result[staff_id][state][catName]) result[staff_id][state][catName] = 0;

            // Sum quantity
            result[staff_id][state][catName] += quantity || 0;

            // Track unique invoices
            if (!invoiceCounts[staff_id]) invoiceCounts[staff_id] = {};
            if (!invoiceCounts[staff_id][state]) invoiceCounts[staff_id][state] = new Set();
            invoiceCounts[staff_id][state].add(invoice);
        });

        // Ensure every staff/state has all categories (even if zero)
        filteredStaffList.forEach(staff => {
            const staffId = staff.id;
            const allocatedStates = staff.allocated_states_names || [];

            if (!result[staffId]) result[staffId] = {};
            if (!invoiceCounts[staffId]) invoiceCounts[staffId] = {};

            allocatedStates.forEach(state => {
                if (!result[staffId][state]) result[staffId][state] = {};
                if (!invoiceCounts[staffId][state]) invoiceCounts[staffId][state] = new Set();

                allCategoriesSet.forEach(cat => {
                    if (!result[staffId][state][cat]) result[staffId][state][cat] = 0;
                });
            });
        });

        // Convert invoice sets to counts
        const invoiceTotals = {};
        Object.entries(invoiceCounts).forEach(([staffId, states]) => {
            invoiceTotals[staffId] = {};
            Object.entries(states).forEach(([state, invSet]) => {
                invoiceTotals[staffId][state] = invSet.size;
            });
        });

        setTransformedData({ result, invoiceTotals });
        setAllProducts(Array.from(allCategoriesSet).sort());
    };


    const productTotals = {};
    allProducts.forEach(prod => {
        productTotals[prod] = 0;
    });

    // Use transformedData.result instead of transformedData
    Object.values(transformedData.result || {}).forEach(states => {
        Object.values(states).forEach(products => {
            allProducts.forEach(prod => {
                productTotals[prod] += products[prod] || 0;
            });
        });
    });

    const grandTotal = Object.values(productTotals).reduce((sum, val) => sum + val, 0);

    const handleExportToExcel = () => {
        const rows = [];

        // Header Row
        const header = ["#", "Staff", "State", ...allProducts];
        rows.push(header);

        // Data Rows
        let count = 1;
        Object.entries(transformedData).forEach(([staffId, states]) => {
            const staff = staffData.find((s) => String(s.id) === String(staffId));
            const staffName = staff ? staff.name : "Unknown";

            Object.entries(states).forEach(([state, products]) => {
                const row = [count++, staffName, state];
                allProducts.forEach(prod => {
                    row.push(products[prod] || 0);
                });
                rows.push(row);
            });
        });

        // Total Row
        const totalRow = ["Total", "", grandTotal];
        allProducts.forEach(prod => {
            totalRow.push(productTotals[prod] || 0);
        });
        rows.push(totalRow);

        // Create and download Excel file
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Division-wise Report");
        XLSX.writeFile(wb, "division_wise_product_report.xlsx");
    };

    return (
        <React.Fragment>
            <style>
                {`
                    .table-responsive {
                        overflow-x: auto;
                        position: relative;
                    }

                    th, td {
                        min-width: 140px;
                        white-space: nowrap;
                    }

                    thead th {
                        position: sticky;
                        top: 0;
                        background-color: #f8f9fa;
                        //   z-index: 12;
                        box-shadow: 0 2px 2px -1px rgba(0,0,0,0.1);
                    }

                    tfoot td {
                        min-width: 140px;
                        white-space: nowrap;
                    }

                    .sticky-col {
                        position: sticky;
                        background: white;
                        z-index: 2;
                    }

                    .sticky-col-0 {
                        left: 0;
                        width: 60px !important;
                        min-width: 60px !important;
                        max-width: 60px !important;
                        z-index: 10; 
                    }

                    .sticky-col-1 {
                        left: 60px;
                        width: 140px !important;
                        z-index: 9;
                    }

                    .sticky-col-2 {
                        left: 200px;
                        width: 200px !important;
                        z-index: 8;
                    }
                `}
            </style>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="DIVISION-WISE PRODUCT REPORT" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <Row className="mb-3 d-flex align-items-center">
                                        <Col>
                                            <Label>Select Division:</Label>
                                            <select
                                                id="family-select"
                                                className="form-select"
                                                style={{ width: "200px" }}
                                                value={selectedFamily || ""}
                                                onChange={(e) => setSelectedFamily(e.target.value || null)}
                                            >
                                                <option value="">All Divisions</option>
                                                {familyData.map(family => (
                                                    <option key={family.id} value={family.name}>
                                                        {family.name.charAt(0).toUpperCase() + family.name.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                        </Col>
                                        <Col>
                                            <Label>Start Date:</Label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </Col>

                                        <Col>
                                            <Label>End Date:</Label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </Col>
                                        <Col>
                                            <Label style={{ visibility: "hidden" }}>Export</Label> {/* for alignment */}
                                            <button className="btn btn-success w-100" onClick={handleExportToExcel}>
                                                Export to Excel
                                            </button>
                                        </Col>
                                    </Row>
                                    <div className="table-responsive">
                                        <Table bordered className="text-center">
                                            <thead className="table-light">
                                                <tr>
                                                    <th className="sticky-col sticky-col-0" style={{ border: "1px solid #dee2e6", width: "60px" }}>#</th>
                                                    <th className="sticky-col sticky-col-1" style={{ border: "1px solid #dee2e6", width: "140px" }}>Staff</th>
                                                    <th style={{ border: "1px solid #dee2e6", width: "100px" }}>Invoices</th>
                                                    <th className="sticky-col sticky-col-2" style={{ border: "1px solid #dee2e6", width: "200px" }}>Allocated States</th>
                                                    {allProducts.map((prod, i) => (
                                                        <th key={i}>{prod}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(transformedData).length === 0 ? (
                                                    <tr>
                                                        <td colSpan={3 + allProducts.length}>No data available</td>
                                                    </tr>
                                                ) : (
                                                    // Object.entries(transformedData).map(([staffId, states], staffIdx) => {
                                                    Object.entries(transformedData.result || {}).map(([staffId, states], staffIdx) => {
                                                        const stateEntries = Object.entries(states);
                                                        const staff = staffData.find((s) => String(s.id) === String(staffId));

                                                        return stateEntries.map(([state, products], stateIdx) => (
                                                            <tr key={`${staffIdx}-${stateIdx}`}>
                                                                {stateIdx === 0 && (
                                                                    <>
                                                                        <td
                                                                            className="sticky-col sticky-col-0"
                                                                            style={{ border: "1px solid #dee2e6", width: "60px", background: "white" }}
                                                                            rowSpan={stateEntries.length}
                                                                        >
                                                                            {staffIdx + 1}
                                                                        </td>
                                                                        <td
                                                                            className="sticky-col sticky-col-1"
                                                                            style={{ border: "1px solid #dee2e6", background: "white" }}
                                                                            rowSpan={stateEntries.length}
                                                                        >
                                                                            {staff ? staff.name : "Unknown"}
                                                                        </td>
                                                                        <td rowSpan={stateEntries.length} style={{ fontWeight: "500" }}>
                                                                            {Object.values(transformedData.invoiceTotals[staffId] || {}).reduce((a, b) => a + b, 0)}
                                                                        </td>
                                                                    </>
                                                                )}
                                                                <td
                                                                    className="sticky-col sticky-col-2"
                                                                    style={{ border: "1px solid #dee2e6", background: "white" }}
                                                                >
                                                                    {state}
                                                                </td>
                                                                {allProducts.map((prod, i) => (
                                                                    <td style={{ border: "1px solid #dee2e6" }} key={i}>{products[prod] || 0}</td>
                                                                ))}
                                                            </tr>
                                                        ));
                                                    })
                                                )}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td className="sticky-col sticky-col-0" style={{ fontWeight: "bold", background: "#f0f0f0", border: "1px solid #dee2e6" }}>Total</td>
                                                    <td className="sticky-col sticky-col-1" style={{ fontWeight: "bold", background: "#f0f0f0", border: "1px solid #dee2e6" }}></td>
                                                    <td className="sticky-col sticky-col-2" style={{ fontWeight: "bold", background: "#f0f0f0", border: "1px solid #dee2e6" }}>
                                                        {grandTotal}
                                                    </td>
                                                    <td className="sticky-col sticky-col-0" style={{ fontWeight: "bold", background: "#f0f0f0", border: "1px solid #dee2e6" }}></td>
                                                    {allProducts.map((prod, i) => (
                                                        <td key={`total-${i}`} style={{ fontWeight: "bold", background: "#f0f0f0", border: "1px solid #dee2e6" }}>
                                                            {productTotals[prod] || 0}
                                                        </td>
                                                    ))}
                                                </tr>
                                            </tfoot>
                                        </Table>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                    <ToastContainer />
                </div>
            </div>
        </React.Fragment>
    );
};

export default DivisionWiseProductReport;
