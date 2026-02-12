import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import * as XLSX from "xlsx";

import {
    Card,
    CardBody,
    Col,
    Row,
    Label,
    CardTitle,
    Form,
    Input,
    Button,
} from "reactstrap";

const MonthlyDailySalesReport = () => {
    const token = localStorage.getItem("token");

    const [stateList, setStateList] = useState([]);
    const [profileData, setProfileData] = useState(null);

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [stateId, setStateId] = useState("");

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

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

    const fetchProfile = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}profile/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setProfileData(response?.data?.data || null);
        } catch (error) {
            toast.error("Failed to load Profile");
        }
    };

    useEffect(() => {
        fetchStates();
        fetchProfile();
    }, []);

    const allocatedStatesList = useMemo(() => {
        if (!profileData || !profileData.allocated_states) return [];

        return stateList.filter((state) =>
            profileData.allocated_states.includes(state.id)
        );
    }, [stateList, profileData]);

    useEffect(() => {
        if (allocatedStatesList.length > 0) {
            setStateId(allocatedStatesList[0].id);
        }
    }, [allocatedStatesList]);

    const fetchReport = async () => {
        try {
            if (!month || !year || !stateId) {
                toast.error("Please select Month, Year and State");
                return;
            }

            setLoading(true);

            const apiUrl = `${import.meta.env.VITE_APP_KEY}daily/sales/report/my/?month=${month}&year=${year}&state_id=${stateId}`;

            const response = await axios.get(apiUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setReportData(response.data);
        } catch (error) {
            toast.error("Failed to load Report");
        } finally {
            setLoading(false);
        }
    };

    const grandTotal = useMemo(() => {
        if (!reportData) return 0;
        return reportData.grand_total || 0;
    }, [reportData]);

    const exportToExcel = () => {
        try {
            if (!reportData) {
                toast.error("No data to export");
                return;
            }

            const wb = XLSX.utils.book_new();
            const wsData = [];

            wsData.push([`${reportData.state} - ${reportData.month}`]);
            wsData.push([]);

            wsData.push(["District", ...reportData.dates, "Total"]);

            reportData.districts.forEach((dist) => {
                const row = [dist.district];

                reportData.dates.forEach((d) => {
                    row.push(dist.daily_counts[d.toString()] || 0);
                });

                row.push(dist.total || 0);
                wsData.push(row);
            });

            const totalRow = ["TOTAL"];
            reportData.dates.forEach((d) => {
                totalRow.push(reportData.column_totals[d.toString()] || 0);
            });
            totalRow.push(reportData.grand_total || 0);

            wsData.push(totalRow);

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, "My Sales Report");

            XLSX.writeFile(wb, `MyDailySalesReport_${reportData.month}.xlsx`);

            toast.success("Excel Exported Successfully");
        } catch (error) {
            toast.error("Excel export failed");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            {/* PAGE HEADER */}
            <Card
                style={{
                    borderRadius: "15px",
                    boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
                    marginBottom: "20px",
                    marginTop: "60px",
                    background: "linear-gradient(90deg, #0f2027, #203a43, #2c5364)",
                    color: "white",
                }}
            >
                <CardBody className="m-1">
                    <Row className="align-items-center">
                        <Col md="8">
                            <h2 style={{ margin: 0, fontWeight: "bold" }}>
                                Monthly Daily Sales Report
                            </h2>
                            <p style={{ margin: 0, opacity: 0.8 }}>
                                Search monthly sales by State and export to Excel / PDF
                            </p>
                        </Col>

                        <Col md="4" className="text-end">
                            <Button
                                color="primary"
                                style={{ marginRight: "10px", fontWeight: "bold" }}
                                onClick={exportToExcel}
                            >
                                Export Excel
                            </Button>

                            <Button
                                color="success"
                                style={{ fontWeight: "bold" }}
                                onClick={() => window.print()}
                            >
                                Print PDF
                            </Button>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            {/* FILTER SECTION */}
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

                    <Form>
                        <Row>
                            <Col md="3">
                                <Label style={{ fontWeight: "bold" }}>Month</Label>
                                <Input
                                    type="select"
                                    value={month}
                                    onChange={(e) => setMonth(Number(e.target.value))}
                                >
                                    <option value="1">January</option>
                                    <option value="2">February</option>
                                    <option value="3">March</option>
                                    <option value="4">April</option>
                                    <option value="5">May</option>
                                    <option value="6">June</option>
                                    <option value="7">July</option>
                                    <option value="8">August</option>
                                    <option value="9">September</option>
                                    <option value="10">October</option>
                                    <option value="11">November</option>
                                    <option value="12">December</option>
                                </Input>
                            </Col>

                            <Col md="3">
                                <Label style={{ fontWeight: "bold" }}>Year</Label>
                                <Input
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                />
                            </Col>

                            <Col md="4">
                                <Label style={{ fontWeight: "bold" }}>State</Label>
                                <Input
                                    type="select"
                                    value={stateId}
                                    onChange={(e) => setStateId(e.target.value)}
                                >
                                    <option value="">Select State</option>
                                    {allocatedStatesList.map((state) => (
                                        <option key={state.id} value={state.id}>
                                            {state.name}
                                        </option>
                                    ))}
                                </Input>
                            </Col>

                            <Col md="2" className="d-flex align-items-end">
                                <Button
                                    color="info"
                                    style={{
                                        width: "100%",
                                        fontWeight: "bold",
                                        color: "white",
                                    }}
                                    onClick={fetchReport}
                                >
                                    {loading ? "Searching..." : "Search"}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </CardBody>
            </Card>

            {/* REPORT TABLE */}
            <Card
                className="print-section"
                style={{
                    borderRadius: "12px",
                    boxShadow: "0px 3px 10px rgba(0,0,0,0.12)",
                }}
            >
                <CardBody>
                    {loading ? (
                        <h4 style={{ textAlign: "center" }}>Loading...</h4>
                    ) : reportData ? (
                        <>
                            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                                <h3 style={{ fontWeight: "bold", marginBottom: "5px" }}>
                                    Monthly Sales Report
                                </h3>
                                <h5 style={{ color: "#28837a", fontWeight: "bold" }}>
                                    {reportData.state.toUpperCase()} ({reportData.month})
                                </h5>
                            </div>

                            <div style={{ overflowX: "auto" }}>
                                <table
                                    className="table table-bordered table-striped"
                                    style={{
                                        width: "100%",
                                        textAlign: "center",
                                        borderCollapse: "collapse",
                                    }}
                                >
                                    <thead
                                        style={{
                                            background: "linear-gradient(90deg, #28837a, #40E0D0)",
                                            color: "white",
                                        }}
                                    >
                                        <tr>
                                            <th style={{ minWidth: "180px" }}>District</th>
                                            {reportData.dates.map((d) => (
                                                <th key={d}>{d}</th>
                                            ))}
                                            <th>Total</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {reportData.districts.map((dist, index) => (
                                            <tr key={index}>
                                                <td style={{ textAlign: "left", fontWeight: "bold" }}>
                                                    {dist.district}
                                                </td>

                                                {reportData.dates.map((d) => {
                                                    const value = dist.daily_counts[d.toString()] || 0;

                                                    return (
                                                        <td
                                                            key={d}
                                                            style={{
                                                                fontWeight: value > 0 ? "bold" : "normal",
                                                                backgroundColor: value > 0 ? "#d1f7ff" : "white",
                                                                color: value > 0 ? "#0b4f6c" : "black",
                                                            }}
                                                        >
                                                            {value}
                                                        </td>
                                                    );
                                                })}

                                                {/* TOTAL COLUMN */}
                                                <td
                                                    style={{
                                                        fontWeight: "bold",
                                                        backgroundColor: "#fff3cd",
                                                        color: "#856404",
                                                    }}
                                                >
                                                    {dist.total}
                                                </td>
                                            </tr>
                                        ))}

                                        {/* TOTAL ROW */}
                                        <tr style={{ fontWeight: "bold" }}>
                                            <td
                                                style={{
                                                    backgroundColor: "#d4edda",
                                                    color: "#155724",
                                                }}
                                            >
                                                TOTAL
                                            </td>

                                            {reportData.dates.map((d) => {
                                                const totalValue = reportData.column_totals[d.toString()] || 0;

                                                return (
                                                    <td
                                                        key={d}
                                                        style={{
                                                            backgroundColor: totalValue > 0 ? "#c3f7c9" : "#d4edda",
                                                            color: totalValue > 0 ? "#0b6623" : "#155724",
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        {totalValue}
                                                    </td>
                                                );
                                            })}

                                            <td
                                                style={{
                                                    backgroundColor: "#28a745",
                                                    color: "white",
                                                    fontSize: "16px",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                {grandTotal}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <h4 style={{ textAlign: "center", marginTop: "30px" }}>
                            No Data Found
                        </h4>
                    )}
                </CardBody>
            </Card>

            <ToastContainer />
        </div>
    );
};

export default MonthlyDailySalesReport;
