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

    const stateOptions = stateList.map((s) => ({
        value: s.id,
        label: s.name,
    }));

    const districtOptions = districtList.map((d) => ({
        value: d.id,
        label: d.name,
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

    useEffect(() => {
        fetchDSR();
        fetchStates();
        fetchDistricts();
    }, []);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString();
    };
    const getRowStyle = (callStatus) => {
        if (callStatus === "active") {
            return { backgroundColor: "#f5e6b3" }; // yellow
        }
        if (callStatus === "productive") {
            return { backgroundColor: "#cfe6d3" }; // green
        }
        return {};
    };

    const getStatusStyle = (status) => {
        const s = (status || "").toLowerCase();

        let bg = "#eef2f7";
        let color = "#374151";

        if (s === "dsr created") {
            bg = "#dbeafe";   // brighter soft blue
            color = "#1d4ed8";
        }
        else if (s === "dsr approved") {
            bg = "#bbf7d0";   // brighter green
            color = "#166534";
        }
        else if (s === "dsr confirmed") {
            bg = "#ddd6fe";   // brighter purple
            color = "#5b21b6";
        }
        else if (s === "dsr rejected") {
            bg = "#fecaca";   // brighter red
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

                                    {/* ✅ LEGEND */}
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
                                            setTimeout(fetchDSR, 0);
                                        }}>
                                            Reset
                                        </Button>
                                    </Col>

                                </Row>

                                {/* ✅ COLORFUL SUMMARY BOXES */}
                                {summary && (
                                    <Row className="mb-4">

                                        <Col md={2}>
                                            <div style={{ background: "#f5e6b3", padding: 15, borderRadius: 10 }}>
                                                <div>Active</div>
                                                <div style={{ fontSize: 22, fontWeight: "bold" }}>{summary.active_count}</div>
                                            </div>
                                        </Col>

                                        <Col md={2}>
                                            <div style={{ background: "#cfe6d3", padding: 15, borderRadius: 10 }}>
                                                <div>Productive</div>
                                                <div style={{ fontSize: 22, fontWeight: "bold" }}>{summary.productive_count}</div>
                                            </div>
                                        </Col>

                                        <Col md={2}>
                                            <div style={{ background: "#dbeafe", padding: 15, borderRadius: 10 }}>
                                                <div>DSR Created</div>
                                                <div style={{ fontSize: 22, fontWeight: "bold", color: "#1d4ed8" }}>
                                                    {summary.dsr_created_count}
                                                </div>
                                            </div>
                                        </Col>

                                        <Col md={2}>
                                            <div style={{ background: "#bbf7d0", padding: 15, borderRadius: 10 }}>
                                                <div>DSR Approved</div>
                                                <div style={{ fontSize: 22, fontWeight: "bold", color: "#166534" }}>
                                                    {summary.dsr_approved_count}
                                                </div>
                                            </div>
                                        </Col>

                                        <Col md={2}>
                                            <div style={{ background: "#ddd6fe", padding: 15, borderRadius: 10 }}>
                                                <div>DSR Confirmed</div>
                                                <div style={{ fontSize: 22, fontWeight: "bold", color: "#5b21b6" }}>
                                                    {summary.dsr_confirmed_count}
                                                </div>
                                            </div>
                                        </Col>

                                        <Col md={2}>
                                            <div style={{ background: "#fecaca", padding: 15, borderRadius: 10 }}>
                                                <div>DSR Rejected</div>
                                                <div style={{ fontSize: 22, fontWeight: "bold", color: "#991b1b" }}>
                                                    {summary.dsr_rejected_count}
                                                </div>
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