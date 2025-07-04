import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    Input,
    Button,
    Label,
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CallLogReport = () => {
    const [callLog, setCallLog] = useState([]);
    const [staffData, setStaffData] = useState([]);
    const [familyData, setFamilyData] = useState([]);
    const token = localStorage.getItem("token")
    const [filterDate, setFilterDate] = useState("");
    const [filterStartTime, setFilterStartTime] = useState("");
    const [filterEndTime, setFilterEndTime] = useState("");
    const [filteredCallLog, setFilteredCallLog] = useState([]);
    const [selectedFamily, setSelectedFamily] = useState("");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");

    useEffect(() => {
        const fetchCallLogData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}call-log/view/`, {
                    headers: { Authorization: `Bearer${token}` }
                });
                setCallLog(response?.data)
            } catch (error) {
                toast.error("error fetching call log")
            }
        };
        fetchCallLogData();
    }, []);

    useEffect(() => {
        const fetchStaffData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, {
                    headers: { Authorization: `Bearer${token}` }
                });
                setStaffData(response?.data?.data);
            } catch (error) {
                toast.error("Error fetching staff data")
            }
        };
        fetchStaffData();
    }, [])

    useEffect(() => {
        const fetchFamilyData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}familys/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFamilyData(response?.data?.data)
            } catch (error) {
                toast.error("Error fetching Division data.")
            }
        };
        fetchFamilyData();
    }, [])

    const staffMap = staffData.reduce((acc, staff) => {
        acc[staff.id] = staff.name;
        return acc;
    }, {});

    useEffect(() => {
        setFilteredCallLog(callLog);
    }, [callLog]);

    const applyFilters = () => {
        if (!filterDate && !filterStartTime && !filterEndTime && !selectedFamily && !filterStartDate && !filterEndDate) {
            setFilteredCallLog(callLog);
            return;
        }

        // Validate time filters if any date/time part is selected
        const dateFiltersSelected = filterDate || filterStartTime || filterEndTime;
        if (dateFiltersSelected) {
            if (!filterDate || !filterStartTime || !filterEndTime) {
                alert("Please select date, start time, and end time");
                return;
            }
            const filterStartDateTime = new Date(`${filterDate}T${filterStartTime}`);
            const filterEndDateTime = new Date(`${filterDate}T${filterEndTime}`);

            if (filterStartDateTime >= filterEndDateTime) {
                alert("Start time must be before end time.");
                return;
            }

            let filtered = callLog.filter(item => {
                if (!item.start_time || !item.end_time) return false;

                const itemStart = new Date(item.start_time);
                const itemEnd = new Date(item.end_time);

                if (isNaN(itemStart) || isNaN(itemEnd)) return false;

                const timeMatch = itemStart >= filterStartDateTime && itemEnd <= filterEndDateTime;
                const familyMatch = selectedFamily ? item.family_name === Number(selectedFamily) : true;

                return timeMatch && familyMatch;
            });

            // Apply date range filter on top if selected
            if (filterStartDate && filterEndDate) {
                const startDate = new Date(filterStartDate);
                const endDate = new Date(filterEndDate);

                if (startDate > endDate) {
                    alert("Start date must be before or equal to End date.");
                    return;
                }

                filtered = filtered.filter(item => {
                    const callDate = new Date(item.call_date);
                    return callDate >= startDate && callDate <= endDate;
                });
            }

            setFilteredCallLog(filtered);
            return;
        }

        // No time filter but family or date range filter may be selected
        let filtered = callLog;

        if (selectedFamily) {
            filtered = filtered.filter(item => item.family_name === Number(selectedFamily));
        }

        if (filterStartDate && filterEndDate) {
            const startDate = new Date(filterStartDate);
            const endDate = new Date(filterEndDate);

            if (startDate > endDate) {
                alert("Start date must be before or equal to End date.");
                return;
            }

            filtered = filtered.filter(item => {
                const callDate = new Date(item.call_date);
                return callDate >= startDate && callDate <= endDate;
            });
        }

        setFilteredCallLog(filtered);
    };

    const onDateChange = (e) => {
        setFilterDate(e.target.value);
    };

    const onStartTimeChange = (e) => {
        setFilterStartTime(e.target.value);
    };

    const onEndTimeChange = (e) => {
        setFilterEndTime(e.target.value);
    };

    const exportToExcel = () => {
        const staffAggregation = {};

        let grandTotalCallDuration = 0;
        let grandTotalActiveCalls = 0;
        let grandTotalBills = 0;
        let grandTotalCalls = 0;

        filteredCallLog.forEach(item => {
            const staffId = item.created_by;
            if (!staffAggregation[staffId]) {
                staffAggregation[staffId] = {
                    staffName: staffMap[staffId] || "N/A",
                    totalCallDuration: 0,
                    totalActiveCalls: 0,  // will store latest value
                    totalBills: 0,        // will store latest value
                    callCount: 0,
                };
            }

            const duration = item.call_duration_seconds || 0;
            const activeCalls = item.active_calls || 0;
            const bills = item.bill_count || 0;

            staffAggregation[staffId].totalCallDuration += duration;
            staffAggregation[staffId].callCount += 1;

            // Overwrite activeCalls and bills to keep the latest
            staffAggregation[staffId].totalActiveCalls = activeCalls;
            staffAggregation[staffId].totalBills = bills;
        });

        Object.values(staffAggregation).forEach(staff => {
            grandTotalCallDuration += staff.totalCallDuration;
            grandTotalActiveCalls += staff.totalActiveCalls; // sum of latest active calls per staff
            grandTotalBills += staff.totalBills;             // sum of latest bills per staff
            grandTotalCalls += staff.callCount;
        });



        const formattedData = Object.values(staffAggregation).map((staff, index) => ({
            "SL NO": index + 1,
            "BDO NAME": staff.staffName,
            "TOTAL CALL DURATION": `${Math.floor(staff.totalCallDuration / 60)}m ${staff.totalCallDuration % 60}s`,
            "TOTAL ACTIVE CALLS": staff.totalActiveCalls,
            "TOTAL NO OF BILLS": staff.totalBills,
        }));

        // Add grand total row
        formattedData.push({
            "SL NO": "",
            "BDO NAME": "GRAND TOTAL",
            "TOTAL CALL DURATION": `${Math.floor(grandTotalCallDuration / 60)}m ${grandTotalCallDuration % 60}s`,
            "TOTAL ACTIVE CALLS": grandTotalActiveCalls,
            "TOTAL NO OF BILLS": grandTotalBills,
            "TOTAL CALLS": grandTotalCalls,
        });

        // Header with filter info
        const filterInfo = [
            [`Filter Date:`, filterDate],
            [`Start Time:`, filterStartTime],
            [`End Time:`, filterEndTime],
            [], // Empty row before data
        ];

        const filterSheet = XLSX.utils.aoa_to_sheet(filterInfo);
        const dataSheet = XLSX.utils.json_to_sheet(formattedData, { origin: filterInfo.length });

        // Merge sheets
        const finalSheet = { ...filterSheet, ...dataSheet };
        finalSheet['!ref'] = XLSX.utils.encode_range({
            s: { r: 0, c: 0 },
            e: {
                r: filterInfo.length + formattedData.length,
                c: Object.keys(formattedData[0] || {}).length - 1,
            },
        });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, finalSheet, "Call Log");
        XLSX.writeFile(workbook, "Call_Log.xlsx");
    };

    const totalCallDurationSeconds = filteredCallLog.reduce(
        (total, item) => total + (item.call_duration_seconds || 0),
        0
    );

    const totalMinutes = Math.floor(totalCallDurationSeconds / 60);
    const totalSeconds = totalCallDurationSeconds % 60;

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="CALL LOG REPORTS" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <Row className="mb-3">
                                        <Col>
                                            <Label>Date</Label>
                                            <Input type="date" value={filterDate} onChange={onDateChange} />
                                        </Col>
                                        <Col>
                                            <Label>Start Time</Label>
                                            <Input type="time" value={filterStartTime} onChange={onStartTimeChange} />
                                        </Col>
                                        <Col>
                                            <Label>End Time</Label>
                                            <Input type="time" value={filterEndTime} onChange={onEndTimeChange} />
                                        </Col>
                                        <Col >
                                            <Label>Division Name</Label>
                                            <Input
                                                type="select"
                                                value={selectedFamily}
                                                onChange={(e) => setSelectedFamily(e.target.value)}
                                            >
                                                <option value="">All</option>
                                                {familyData.map((family) => (
                                                    <option key={family.id} value={family.id}>
                                                        {family.name}
                                                    </option>
                                                ))}
                                            </Input>
                                        </Col>
                                        <Col>
                                            <Label>Time Period</Label>
                                            <Row>
                                                <Col className="mb-1">
                                                    <Input
                                                        placeholder="Start Date"
                                                        type="date"
                                                        value={filterStartDate}
                                                        onChange={(e) => setFilterStartDate(e.target.value)}
                                                    />
                                                </Col>
                                                <Col>
                                                    <Input
                                                        placeholder="End Date"
                                                        type="date"
                                                        value={filterEndDate}
                                                        onChange={(e) => setFilterEndDate(e.target.value)}
                                                    />
                                                </Col>
                                            </Row>
                                        </Col>

                                    </Row>
                                    <Row className="mb-3">
                                        <Col md={12} className="text-center">
                                            <Button color="primary" className="mr-2" onClick={applyFilters}>
                                                Filter
                                            </Button>
                                            <Button color="success" className="m-2" onClick={exportToExcel}>
                                                Export to Excel
                                            </Button>
                                        </Col>
                                    </Row>

                                    <div className="table-responsive">
                                        <Table
                                            className="table table-bordered"
                                            style={{
                                                border: "1px solid #dee2e6",
                                                borderRadius: "10px",
                                                overflow: "hidden",
                                                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.05)",
                                            }}
                                        >
                                            <thead style={{ backgroundColor: "#007bff", color: "#ffffff" }}>
                                                <tr>
                                                    <th className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}>SL NO</th>
                                                    <th className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}>BDO NAME</th>
                                                    <th className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}>CUSTOMER NAME</th>
                                                    <th className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}>PHONE NUMBER</th>
                                                    <th className="text-center" style={{ padding: "12px", border: "1px solid #dee2e6" }}>CALL DURATION</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredCallLog.length > 0 ? (
                                                    filteredCallLog.map((item, index) => (
                                                        <tr key={item.id || index}>
                                                            <td className="text-center">{index + 1}</td>
                                                            <td className="text-center">{staffMap[item.created_by] || "N/A"}</td>
                                                            <td className="text-center">{item.customer_name}</td>
                                                            <td className="text-center">{item.phone_number}</td>
                                                            <td className="text-center">
                                                                {Math.floor(item.call_duration_seconds / 60)}m {item.call_duration_seconds % 60}s
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="text-center">No data available</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                    <div>
                                        <Row className="mt-3">
                                            <Col className="text-right">
                                                <h5>
                                                    <strong>Total Call Duration:</strong> {totalMinutes}m {totalSeconds}s
                                                </h5>
                                            </Col>
                                        </Row>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </React.Fragment>
    )
}
export default CallLogReport;