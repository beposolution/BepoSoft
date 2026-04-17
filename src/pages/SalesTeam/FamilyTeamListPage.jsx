import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Card,
    CardBody,
    Container,
    Table,
    Spinner,
    Row,
    Col,
    Input,
    Button,
} from "reactstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const FamilyTeamListPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const baseUrl = import.meta.env.VITE_APP_KEY;
    const token = localStorage.getItem("token");

    const today = new Date().toISOString().split("T")[0];

    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({});
    const [attendanceDetails, setAttendanceDetails] = useState({
        present: [],
        absent: [],
        half_day: [],
    });
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);

    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    const getHeaders = () => ({
        Authorization: `Bearer ${token}`,
    });

    const familyId =
        location?.state?.widget?.familyId ||
        location?.state?.widget?.family_id ||
        location?.state?.familyId ||
        location?.state?.family_id ||
        location?.state?.family?.family_id ||
        params?.familyId ||
        params?.id ||
        "";

    const fetchData = async () => {
        try {
            setTableLoading(true);

            const paramsObj = new URLSearchParams();
            if (startDate) paramsObj.append("start_date", startDate);
            if (endDate) paramsObj.append("end_date", endDate);

            const queryString = paramsObj.toString();
            const queryPart = queryString ? `?${queryString}` : "";

            // 1) Main data from detailed summary endpoint
            const detailedUrl = `${baseUrl}family/detailed/summary/${familyId}/${queryPart}`;
            const detailedRes = await axios.get(detailedUrl, {
                headers: getHeaders(),
            });

            setSummary(detailedRes?.data?.summary || {});
            setData(detailedRes?.data?.teams || []);

            // 2) Attendance details from old team summary endpoint
            const teamUrl = `${baseUrl}family/summary/team/${queryPart}`;
            const teamRes = await axios.get(teamUrl, {
                headers: getHeaders(),
            });

            const selectedFamily = (teamRes?.data?.families || []).find(
                (f) => String(f.family_id) === String(detailedRes?.data?.family?.family_id || familyId)
            );

            setAttendanceDetails(
                selectedFamily?.summary?.attendance_details || {
                    present: [],
                    absent: [],
                    half_day: [],
                }
            );
        } catch (error) {
            console.log(error);
            setData([]);
            setSummary({});
            setAttendanceDetails({
                present: [],
                absent: [],
                half_day: [],
            });
        } finally {
            setLoading(false);
            setTableLoading(false);
        }
    };

    useEffect(() => {
        if (familyId) {
            fetchData();
        } else {
            setLoading(false);
            setTableLoading(false);
        }
    }, [familyId]);

    const handleClear = () => {
        setStartDate(today);
        setEndDate(today);
        setTimeout(fetchData, 0);
    };
    const card = {
        borderRadius: "14px",
        border: "1px solid #e5e7eb",
        padding: "16px",
        background: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
        height: "100%"
    };

    const Title = ({ text }) => (
        <div style={{ fontWeight: "600", marginBottom: "10px", color: "#4f46e5" }}>
            {text}
        </div>
    );

    const Item = ({ label, value, last, highlight }) => (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: last ? "none" : "1px dashed #e5e7eb"
            }}
        >
            <span>{label}</span>
            <strong style={{ color: highlight ? "#059669" : "#111827" }}>
                {value ?? 0}
            </strong>
        </div>
    );

    const statBoxStyle = {
        borderRadius: "14px",
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
        padding: "16px",
        height: "100%",
    };

    const labelStyle = {
        fontSize: "13px",
        fontWeight: 600,
        color: "#6b7280",
        marginBottom: "4px",
    };

    const valueStyle = {
        fontSize: "18px",
        fontWeight: 700,
        color: "#111827",
        lineHeight: 1.2,
        wordBreak: "break-word",
    };

    const rowItemStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        padding: "6px 0",
        borderBottom: "1px solid #f3f4f6",
        fontSize: "14px",
    };

    const rowItemLastStyle = {
        ...rowItemStyle,
        borderBottom: "none",
    };

    return (
        <Container fluid style={{ background: "#f6f8fb", minHeight: "100vh" }}>
            <div className="mb-4">
                <h2 className="fw-bold" style={{ color: "#4f46e5" }}>
                    Family Performance CRM
                </h2>
                <p className="text-muted mb-0">
                    Monitor teams, calls, productivity & attendance
                </p>
            </div>

            {/* FILTER */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: "14px" }}>
                <CardBody>
                    <Row className="g-3">
                        <Col md={3}>
                            <label className="fw-semibold mb-1">Start Date</label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </Col>

                        <Col md={3}>
                            <label className="fw-semibold mb-1">End Date</label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </Col>

                        <Col md={2} className="d-flex align-items-end">
                            <Button color="primary" className="w-100" onClick={fetchData}>
                                Apply
                            </Button>
                        </Col>

                        <Col md={2} className="d-flex align-items-end">
                            <Button color="light" className="w-100" onClick={handleClear}>
                                Reset
                            </Button>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            {/* SUMMARY */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: "14px" }}>
                <CardBody>

                    <div className="text-center mb-4">
                        <h5 className="fw-bold" style={{ color: "#4f46e5" }}>
                            SUMMARY OVERVIEW
                        </h5>
                        <small className="text-muted">
                            Clean summary view for selected date range
                        </small>
                    </div>

                    <Row className="g-3">

                        {/* BUSINESS */}
                        <Col xl={3} lg={4} md={6} sm={12}>
                            <div style={card}>
                                <Title text="Business" />
                                <Item label="Invoices" value={summary.billing} />
                                <Item label="Amount" value={summary.volume} />
                                <Item label="Total Bill" value={summary.total_bill} />
                                <Item label="Unbilled" value={summary.total_unbilled} last />
                            </div>
                        </Col>

                        {/* CALLS */}
                        <Col xl={3} lg={4} md={6} sm={12}>
                            <div style={card}>
                                <Title text="Calls" />
                                <Item label="Total Duration" value={summary.total_call_duration} highlight />
                                <Item label="Average" value={summary.call_duration_average} />
                                <Item label="8Hr %" value={`${summary.call_duration_percentage_8hrs ?? 0}%`} last />
                            </div>
                        </Col>

                        {/* PERFORMANCE */}
                        <Col xl={3} lg={4} md={6} sm={12}>
                            <div style={card}>
                                <Title text="Performance" />
                                <Item label="BDO" value={summary.total_bdo_count} />
                                <Item label="Active" value={summary.active_count} />
                                <Item label="Productive" value={summary.productive_count} last />
                            </div>
                        </Col>

                        {/* CUSTOMERS */}
                        <Col xl={3} lg={4} md={6} sm={12}>
                            <div style={card}>
                                <Title text="Customers" />
                                <Item label="New Customers" value={summary.new_customers} />
                                <Item label="Conversions" value={summary.new_conversions} last />
                            </div>
                        </Col>

                        {/* ATTENDANCE */}
                        <Col xl={4} lg={5} md={6} sm={12}>
                            <div style={card}>
                                <Title text="Attendance" />
                                <Item label="Present" value={summary.present_count} />
                                <Item label="Absent" value={summary.absent_count} />
                                <Item label="Half Day" value={summary.half_day_count} last />
                            </div>
                        </Col>

                        {/* ✅ HOURLY TABLE */}
                        <Col xl={8} lg={7} md={12}>
                            <div style={card}>
                                <Title text="Hourly Durations" />

                                <div style={{ overflowX: "auto" }}>
                                    <Table bordered size="sm" className="text-center mb-0" style={{ minWidth: "600px" }}>
                                        <thead className="table-light">
                                            <tr>
                                                {Object.keys(summary.hourly_durations || {}).map((time) => (
                                                    <th key={time}>{time}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                {Object.values(summary.hourly_durations || {}).map((val, i) => (
                                                    <td key={i}>
                                                        <strong>{Number(val).toFixed(1)}</strong>
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </Table>
                                </div>

                            </div>
                        </Col>

                    </Row>
                </CardBody>
            </Card>

            {/* TABLE */}
            <Card className="border-0 shadow-sm">
                <CardBody>
                    {loading || tableLoading ? (
                        <div className="text-center py-5">
                            <Spinner />
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <Table hover className="text-center" style={{ minWidth: "1400px" }}>
                                <thead className="table-light">
                                    <tr>
                                        <th>#</th>
                                        <th>Team</th>
                                        <th>Calls</th>
                                        <th>Total Duration</th>
                                        <th>Avg</th>
                                        <th>8Hr %</th>
                                        <th>Invoices</th>
                                        <th>Amount</th>
                                        <th>Billed</th>
                                        <th>Unbilled</th>
                                        <th>Customers</th>
                                        <th>Conversions</th>
                                        <th>Hourly Durations</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {data.map((team, i) => (
                                        <tr
                                            key={team.team_id || i}
                                            style={{ cursor: "pointer" }}
                                            onClick={() =>
                                                navigate(`/sales/team/detailed/Summary/view/${team.team_id}`, {
                                                    state: {
                                                        startDate,
                                                        endDate
                                                    }
                                                })
                                            }
                                        >
                                            <td>{i + 1}</td>
                                            <td style={{ color: "blue" }}>{team.team_name}</td>
                                            <td>{team.summary?.total_call_count ?? 0}</td>
                                            <td>{team.summary?.total_call_duration ?? 0}</td>
                                            <td>{team.summary?.call_duration_average ?? 0}</td>
                                            <td>{team.summary?.call_duration_percentage_8hrs ?? 0}%</td>
                                            <td>{team.summary?.billing ?? 0}</td>
                                            <td>{team.summary?.total_volume ?? 0}</td>
                                            <td>{team.summary?.total_bill ?? 0}</td>
                                            <td>{team.summary?.total_unbilled ?? 0}</td>
                                            <td>{team.summary?.new_customers ?? 0}</td>
                                            <td>{team.summary?.new_conversions ?? 0}</td>

                                            {/* ✅ DETAILED HOURLY TABLE */}
                                            <td>
                                                <div style={{ overflowX: "auto" }}>
                                                    <Table
                                                        bordered
                                                        size="sm"
                                                        className="mb-0 text-center"
                                                        style={{ minWidth: "500px", fontSize: "11px" }}
                                                    >
                                                        <thead className="table-light">
                                                            <tr>
                                                                {Object.keys(team?.summary?.hourly_durations || {}).map((time) => (
                                                                    <th key={time}>{time}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            <tr>
                                                                {Object.values(team?.summary?.hourly_durations || {}).map((val, idx) => (
                                                                    <td key={idx}>
                                                                        {Number(val).toFixed(1)}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </CardBody>
            </Card>
        </Container>
    );
};

export default FamilyTeamListPage;