import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
    Card,
    CardBody,
    Col,
    Row,
    Table,
    CardTitle,
    Spinner,
    Button,
    Input,
} from "reactstrap";
import Select from "react-select";
import "react-toastify/dist/ReactToastify.css";

const ViewDSRAll = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [callStatus, setCallStatus] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [stateFilter, setStateFilter] = useState("");
    const [district, setDistrict] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [stateList, setStateList] = useState([]);
    const [allDistricts, setAllDistricts] = useState([]);
    const [districtList, setDistrictList] = useState([]);
    const [summary, setSummary] = useState(null);
    const [family, setFamily] = useState("");
    const [familyList, setFamilyList] = useState([]);
    const [staff, setStaff] = useState("");
    const [staffList, setStaffList] = useState([]);

    const stateOptions = stateList.map((s) => ({
        value: s.id,
        label: s.name,
    }));

    const districtOptions = districtList.map((d) => ({
        value: d.id,
        label: d.name,
    }));
    const familyOptions = familyList.map((f) => ({
        value: f.id,
        label: f.name,
    }));
    const staffOptions = staffList.map((s) => ({
        value: s.id,
        label: s.name,
    }));

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const fetchDSR = async () => {
        try {
            setLoading(true);

            const selectedStateName =
                stateList.find((s) => String(s.id) === String(stateFilter))?.name || "";

            const selectedDistrictName =
                districtList.find((d) => String(d.id) === String(district))?.name || "";
            const selectedFamilyName =
                familyList.find((f) => String(f.id) === String(family))?.name || "";
            const selectedStaffName =
                staffList.find((s) => String(s.id) === String(staff))?.name || "";

            const response = await axios.get(
                `${baseUrl}sales/analysis/all/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params: {
                        search,
                        call_status: callStatus,
                        status: statusFilter,
                        state: selectedStateName,
                        district: selectedDistrictName,
                        family: selectedFamilyName,
                        staff: selectedStaffName,
                        start_date: startDate,
                        end_date: endDate,
                    },
                }
            );

            const summaryData = response?.data?.results || null;
            const reportData = response?.data?.results?.results || [];

            setSummary(summaryData);
            setData(reportData);

        } catch {
            toast.error("Failed to load DSR data");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStates = async () => {
        try {
            const res = await axios.get(`${baseUrl}states/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStateList(res?.data?.data || res?.data || []);
        } catch {
            toast.error("Failed to load states");
        }
    };

    const fetchDistricts = async () => {
        try {
            const res = await axios.get(`${baseUrl}districts/add/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAllDistricts(res?.data?.data || res?.data || []);
        } catch {
            toast.error("Failed to load districts");
        }
    };
    const fetchFamilies = async () => {
        try {
            const res = await axios.get(`${baseUrl}familys/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFamilyList(res?.data?.data || res?.data || []);

        } catch {
            toast.error("Failed to load families");
        }
    };
    const fetchStaffByFamily = async (familyId) => {
        try {
            const res = await axios.get(`${baseUrl}users/family/${familyId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });


            setStaffList(res?.data?.data || res?.data || []);
        } catch (err) {
            toast.error("Failed to load staff");
        }
    };

    useEffect(() => {
        fetchDSR();
        fetchStates();
        fetchDistricts();
        fetchFamilies();
    }, []);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString();
    };
    const getRowStyle = (callStatus) => {
        if (callStatus === "active") {
            return { backgroundColor: "#f5e6b3" }; 
        }
        if (callStatus === "productive") {
            return { backgroundColor: "#cfe6d3" }; 
        }
        return {};
    };

    const getStatusStyle = (status) => {
        const s = (status || "").toLowerCase();

        let bg = "#eef2f7";
        let color = "#374151";

        if (s === "dsr created") {
            bg = "#dbeafe";   
            color = "#1d4ed8";
        }
        else if (s === "dsr approved") {
            bg = "#bbf7d0";   
            color = "#166534";
        }
        else if (s === "dsr confirmed") {
            bg = "#ddd6fe";   
            color = "#5b21b6";
        }
        else if (s === "dsr rejected") {
            bg = "#fecaca";   
            color = "#991b1b";
        }

        return {
            backgroundColor: bg,
            color: color,
            padding: "4px 12px",
            borderRadius: "999px",
            display: "inline-block",
            fontSize: "12px",
            fontWeight: "600",
            textTransform: "capitalize",
        };
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <ToastContainer />
                <Breadcrumbs title="DSR" breadcrumbItem="All DSR" />

                <Row>
                    <Col lg="12">
                        <Card>
                            <CardBody>

                                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">

                                    <CardTitle className="h4 mb-0">
                                        ALL DAILY SALES REPORT
                                    </CardTitle>

                                    <div className="d-flex align-items-center gap-3">

                                        <div className="d-flex align-items-center">
                                            <span style={{
                                                width: "14px",
                                                height: "14px",
                                                backgroundColor: "#f5e6b3",
                                                border: "1px solid #d6c37a",
                                                borderRadius: "3px",
                                                marginRight: "6px",
                                                display: "inline-block"
                                            }} />
                                            <span style={{ fontSize: "13px" }}>Active</span>
                                        </div>

                                        <div className="d-flex align-items-center">
                                            <span style={{
                                                width: "14px",
                                                height: "14px",
                                                backgroundColor: "#cfe6d3",
                                                border: "1px solid #9fcca9",
                                                borderRadius: "3px",
                                                marginRight: "6px",
                                                display: "inline-block"
                                            }} />
                                            <span style={{ fontSize: "13px" }}>Productive</span>
                                        </div>

                                    </div>
                                </div>

                                <Row className="mb-3 g-2">

                                    <Col md={3}>
                                        <Input
                                            placeholder="Search..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </Col>

                                    <Col md={2}>
                                        <Input type="select" value={callStatus}
                                            onChange={(e) => setCallStatus(e.target.value)}>
                                            <option value="">Call Status</option>
                                            <option value="productive">Productive</option>
                                            <option value="active">Active</option>
                                        </Input>
                                    </Col>

                                    <Col md={2}>
                                        <Input type="select" value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}>
                                            <option value="">DSR Status</option>
                                            <option value="dsr created">DSR Created</option>
                                            <option value="dsr approved">DSR Approved</option>
                                            <option value="dsr confirmed">DSR Confirmed</option>
                                            <option value="dsr rejected">DSR Rejected</option>
                                        </Input>
                                    </Col>

                                    <Col md={2}>
                                        <Select
                                            options={stateOptions}
                                            value={stateOptions.find((s) => s.value === stateFilter) || null}
                                            onChange={(selected) => {
                                                const val = selected?.value || "";
                                                setStateFilter(val);
                                                setDistrict("");

                                                const filtered = allDistricts.filter(
                                                    (d) => String(d.state) === String(val)
                                                );
                                                setDistrictList(filtered);
                                            }}
                                            placeholder="Search State..."
                                            isClearable
                                        />
                                    </Col>

                                    <Col md={2}>
                                        <Select
                                            options={districtOptions}
                                            value={districtOptions.find((d) => d.value === district) || null}
                                            onChange={(selected) => setDistrict(selected?.value || "")}
                                            placeholder="Search District..."
                                            isClearable
                                            isDisabled={!stateFilter}
                                        />
                                    </Col>
                                    <Col md={2}>
                                        <Select
                                            options={familyOptions}
                                            value={familyOptions.find((f) => f.value === family) || null}
                                            onChange={(selected) => {
                                                const val = selected?.value || "";
                                                setFamily(val);
                                                setStaff("");        
                                                setStaffList([]);    

                                                if (val) {
                                                    fetchStaffByFamily(val); 
                                                }
                                            }} placeholder="Search Family..."
                                            isClearable
                                        />
                                    </Col>
                                    <Col md={2}>
                                        <Select
                                            options={family ? staffOptions : []}
                                            value={staffOptions.find((s) => s.value === staff) || null}
                                            onChange={(selected) => setStaff(selected?.value || "")}
                                            placeholder="Search Staff..."
                                            noOptionsMessage={() =>
                                                family ? (
                                                    "No staff found"
                                                ) : (
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "8px",
                                                            padding: "8px 10px",
                                                            borderRadius: "6px",
                                                            background: "#fff7ed",
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                color: "#f59e0b",
                                                                fontSize: "14px",
                                                            }}
                                                        >
                                                            ⚠
                                                        </span>

                                                        <span
                                                            style={{
                                                                color: "#b91c1c",
                                                                fontSize: "13px",
                                                                fontWeight: "500",
                                                            }}
                                                        >
                                                            Please select a family first
                                                        </span>
                                                    </div>
                                                )
                                            }
                                            isClearable
                                        />
                                    </Col>

                                    <Col md={2}>
                                        <Input type="date" value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)} />
                                    </Col>

                                    <Col md={2}>
                                        <Input type="date" value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)} />
                                    </Col>

                                    <Col md={2}>
                                        <Button color="success" onClick={fetchDSR} block>
                                            Apply
                                        </Button>
                                    </Col>

                                    <Col md={2}>
                                        <Button color="secondary" block onClick={() => {
                                            setSearch("");
                                            setCallStatus("");
                                            setStatusFilter("");
                                            setStateFilter("");
                                            setDistrict("");
                                            setStartDate("");
                                            setEndDate("");
                                            setFamily("");
                                            setStaff("");
                                            setStaffList([]);
                                            setTimeout(fetchDSR, 0);
                                        }}>
                                            Reset
                                        </Button>
                                    </Col>

                                </Row>

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
                                                    background: "#fff3cd",
                                                    borderRadius: "10px",
                                                    padding: "14px 16px",
                                                    fontWeight: "600",
                                                    border: "1px solid #ffe69c",
                                                    minHeight: "70px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <span style={{ fontSize: "13px", color: "#856404" }}>Active</span>
                                                <span style={{ fontSize: "22px", color: "#856404" }}>
                                                    {summary?.active_count || 0}
                                                </span>
                                            </div>
                                        </Col>

                                        <Col md="2">
                                            <div
                                                style={{
                                                    background: "#d4edda",
                                                    borderRadius: "10px",
                                                    padding: "14px 16px",
                                                    fontWeight: "600",
                                                    border: "1px solid #a3cfbb",
                                                    minHeight: "70px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <span style={{ fontSize: "13px", color: "#155724" }}>Productive</span>
                                                <span style={{ fontSize: "22px", color: "#155724" }}>
                                                    {summary?.productive_count || 0}
                                                </span>
                                            </div>
                                        </Col>

                                        <Col md="2">
                                            <div
                                                style={{
                                                    background: "#d1ecf1",
                                                    borderRadius: "10px",
                                                    padding: "14px 16px",
                                                    fontWeight: "600",
                                                    border: "1px solid #abdde5",
                                                    minHeight: "70px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <span style={{ fontSize: "13px", color: "#0c5460" }}>DSR Created</span>
                                                <span style={{ fontSize: "22px", color: "#0c5460" }}>
                                                    {summary?.dsr_created_count || 0}
                                                </span>
                                            </div>
                                        </Col>

                                        <Col md="2">
                                            <div
                                                style={{
                                                    background: "#cfe2ff",
                                                    borderRadius: "10px",
                                                    padding: "14px 16px",
                                                    fontWeight: "600",
                                                    border: "1px solid #9ec5fe",
                                                    minHeight: "70px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <span style={{ fontSize: "13px", color: "#084298" }}>DSR Approved</span>
                                                <span style={{ fontSize: "22px", color: "#084298" }}>
                                                    {summary?.dsr_approved_count || 0}
                                                </span>
                                            </div>
                                        </Col>

                                        <Col md="2">
                                            <div
                                                style={{
                                                    background: "#e2d9f3",
                                                    borderRadius: "10px",
                                                    padding: "14px 16px",
                                                    fontWeight: "600",
                                                    border: "1px solid #cbbbe9",
                                                    minHeight: "70px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <span style={{ fontSize: "13px", color: "#5a3d8a" }}>DSR Confirmed</span>
                                                <span style={{ fontSize: "22px", color: "#5a3d8a" }}>
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
                                                    fontWeight: "600",
                                                    border: "1px solid #f1aeb5",
                                                    minHeight: "70px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <span style={{ fontSize: "13px", color: "#842029" }}>DSR Rejected</span>
                                                <span style={{ fontSize: "22px", color: "#842029" }}>
                                                    {summary?.dsr_rejected_count || 0}
                                                </span>
                                            </div>
                                        </Col>

                                        <Col md="2">
                                            <div
                                                style={{
                                                    background: "#98c7c5",
                                                    borderRadius: "10px",
                                                    padding: "14px 16px",
                                                    fontWeight: "600",
                                                    border: "1px solid #00bdb4",
                                                    minHeight: "70px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <span style={{ fontSize: "13px", color: "#013432" }}>Call Duration</span>
                                                <span style={{ fontSize: "22px", color: "#012c2a" }}>
                                                    {summary?.total_call_duration || 0}
                                                </span>
                                            </div>
                                        </Col>
                                    </Row>
                                )}

                                {loading ? (
                                    <div className="text-center my-5">
                                        <Spinner color="primary" />
                                    </div>
                                ) : (
                                    <Table bordered responsive hover>
                                        <thead className="table-light">
                                            <tr>
                                                <th>#</th>
                                                <th>Customer</th>
                                                {/* <th>Call Status</th> */}
                                                <th>DSR Status</th>
                                                <th>Duration</th>
                                                <th>State</th>
                                                <th>District</th>
                                                <th>Invoice</th>
                                                <th>Staff</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td style={getRowStyle(item.call_status)}>{index + 1}</td>
                                                    <td style={getRowStyle(item.call_status)}>{item.customer_name}</td>
                                                    {/* <td style={getRowStyle(item.call_status)}>{item.call_status}</td> */}
                                                    <td style={getRowStyle(item.call_status)}>
                                                        <span style={getStatusStyle(item.status)}>
                                                            {item.status}
                                                        </span>
                                                    </td>                                                    <td style={getRowStyle(item.call_status)}>{item.call_duration}</td>
                                                    <td style={getRowStyle(item.call_status)}>{item.state_name}</td>
                                                    <td style={getRowStyle(item.call_status)}>{item.district_name}</td>
                                                    <td style={getRowStyle(item.call_status)}>{item.invoice_number}</td>
                                                    <td style={getRowStyle(item.call_status)}>{item.created_by_name}</td>
                                                    <td style={getRowStyle(item.call_status)}>{formatDate(item.created_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                )}

                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </React.Fragment>
    );
};

export default ViewDSRAll;