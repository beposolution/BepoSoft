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
    const [transformedData, setTransformedData] = useState({});
    const [allProducts, setAllProducts] = useState([]);
    const [staffData, setStaffData] = useState([]);
    const [productsData, setProductsData] = useState([]);
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
        const fetchProductsData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}products/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setProductsData(response?.data?.data || []);
            } catch (error) {
                toast.error("Error fetching staff data");
            }
        };

        fetchProductsData();
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
                const res = await axios.get(`${import.meta.env.VITE_APP_KEY}product-wise/report/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                let data = res?.data?.data || [];

                // Date filtering logic
                if (startDate) {
                    data = data.filter(d => new Date(d.order_date) >= new Date(startDate));
                }
                if (endDate) {
                    data = data.filter(d => new Date(d.order_date) <= new Date(endDate));
                }

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
        const allProductsSet = new Set();

        // Ensure all products are included regardless of date filter
        productsData.forEach(product => {
            if (product.type === "single") {
                allProductsSet.add(product.name);
            } else if (product.type === "variant" && Array.isArray(product.variantIDs)) {
                product.variantIDs.forEach(variant => {
                    allProductsSet.add(variant.name);
                });
            }
        });
        const staffStatesMap = {};

        // Step 1: Create a map of display names using productsData
        const productNameMap = {};

        productsData.forEach(product => {
            if (product.type === "single") {
                productNameMap[product.name] = product.name;
            } else if (product.type === "variant" && Array.isArray(product.variantIDs)) {
                product.variantIDs.forEach(variant => {
                    productNameMap[variant.name] = variant.name;
                });
            }
        });

        // Step 2: Process report data
        data.forEach(entry => {
            const { staff_id, staff_name, allocated_states, order_state, product_name, quantity } = entry;

            // Get display name from map or fallback
            const displayName = productNameMap[product_name] || product_name;
            allProductsSet.add(displayName);

            if (!staffStatesMap[staff_id]) {
                staffStatesMap[staff_id] = {
                    name: staff_name,
                    allocatedStates: new Set(allocated_states),
                };
            } else {
                allocated_states.forEach(state => staffStatesMap[staff_id].allocatedStates.add(state));
            }

            if (!allocated_states.includes(order_state)) return;

            if (!result[staff_id]) result[staff_id] = {};
            if (!result[staff_id][order_state]) result[staff_id][order_state] = {};
            if (!result[staff_id][order_state][displayName]) result[staff_id][order_state][displayName] = 0;

            result[staff_id][order_state][displayName] += quantity;
        });

        // Step 3: Fill missing products/states with 0 for filtered staff
        filteredStaffList.forEach(staff => {
            const staffId = staff.id;
            const allocatedStates = staff.allocated_states_names || [];

            if (!result[staffId]) result[staffId] = {};

            allocatedStates.forEach(state => {
                if (!result[staffId][state]) result[staffId][state] = {};
                allProductsSet.forEach(prod => {
                    if (!result[staffId][state][prod]) {
                        result[staffId][state][prod] = 0;
                    }
                });
            });
        });

        setTransformedData(result);
        setAllProducts(Array.from(allProductsSet).sort());
    };

    // Calculate total quantity for each product
    const productTotals = {};
    allProducts.forEach(prod => {
        productTotals[prod] = 0;
    });

    Object.values(transformedData).forEach(states => {
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
                                                    Object.entries(transformedData).map(([staffId, states], staffIdx) => {
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
