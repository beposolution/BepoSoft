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

const SalesTeamCdDailyReport = () => {
  const today = new Date().toISOString().split("T")[0];

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [totals, setTotals] = useState({});

  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [teamOptions, setTeamOptions] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);

  const token = localStorage.getItem("token");
  const baseUrl = import.meta.env.VITE_APP_KEY;

  const safeNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const formatValue = (value) => {
    const n = safeNumber(value);
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  };

  const fetchReport = async (customFilters = null) => {
    try {
      setLoading(true);

      const filters = customFilters || {
        search,
        team: teamFilter,
        created_by: createdByFilter,
        start_date: startDate,
        end_date: endDate,
      };

      const response = await axios.get(`${baseUrl}sales/team/cd/report/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: filters,
      });

      // console.log("drtgyhuji", response.data)

      const apiData = response?.data?.data || [];
      const apiTotals = response?.data?.totals || {};

      setReportData(apiData);
      setTotals(apiTotals);

      const teams = [];
      const staffs = [];
      const teamIds = new Set();
      const staffIds = new Set();

      apiData.forEach((team) => {
        if (team.team_id && !teamIds.has(team.team_id)) {
          teamIds.add(team.team_id);
          teams.push({
            id: team.team_id,
            name: team.team_name,
          });
        }

        (team.members || []).forEach((member) => {
          if (member.created_by_id && !staffIds.has(member.created_by_id)) {
            staffIds.add(member.created_by_id);
            staffs.push({
              id: member.created_by_id,
              name: member.created_by_name,
            });
          }
        });
      });

      setTeamOptions(teams);
      setStaffOptions(staffs);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load Sales Team CD Report");
      setReportData([]);
      setTotals({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport({
      search: "",
      team: "",
      created_by: "",
      start_date: today,
      end_date: today,
    });
  }, []);

  const teamSelectOptions = useMemo(() => {
    return teamOptions.map((team) => ({
      value: team.id,
      label: team.name,
    }));
  }, [teamOptions]);

  const staffSelectOptions = useMemo(() => {
    return staffOptions.map((staff) => ({
      value: staff.id,
      label: staff.name,
    }));
  }, [staffOptions]);

  const selectedTeamOption =
    teamSelectOptions.find((item) => item.value === teamFilter) || null;

  const selectedStaffOption =
    staffSelectOptions.find((item) => item.value === createdByFilter) || null;

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: "38px",
      borderColor: state.isFocused ? "#86b7fe" : "#ced4da",
      boxShadow: state.isFocused
        ? "0 0 0 0.2rem rgba(13,110,253,.25)"
        : "none",
      fontSize: "14px",
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
  };

  const exportToExcel = () => {
    try {
      if (!reportData.length) {
        toast.error("No data to export");
        return;
      }

      const wb = XLSX.utils.book_new();
      const wsData = [];

      wsData.push(["DAILY SALES REPORT"]);
      wsData.push([startDate]);
      wsData.push([
        "",
        "",
        "AC",
        "PC",
        "ACD",
        "AVG CD",
        "NEW LEADS",
        "MD",
        "SD",
        "BILL",
        "VOLUME",
      ]);

      reportData.forEach((team) => {
        const members = team.members || [];

        members.forEach((member, index) => {
          wsData.push([
            index === 0 ? String(team.team_name || "").toUpperCase() : "",
            String(member.created_by_name || "").toUpperCase(),
            safeNumber(member.AC),
            safeNumber(member.PC),
            safeNumber(member.ACD),
            safeNumber(member.AVG_CD),
            safeNumber(member.new_deals),
            safeNumber(member.md),
            safeNumber(member.sd),
            safeNumber(member.bill_count),
            safeNumber(member.volume),
          ]);
        });

        wsData.push([
          "TOTAL",
          "",
          safeNumber(team.team_total?.AC),
          safeNumber(team.team_total?.PC),
          safeNumber(team.team_total?.ACD),
          safeNumber(team.team_total?.AVG_CD),
          safeNumber(team.team_total?.new_deals),
          safeNumber(team.team_total?.md),
          safeNumber(team.team_total?.sd),
          safeNumber(team.team_total?.bill_count),
          safeNumber(team.team_total?.volume),
        ]);
      });

      wsData.push([]);

      wsData.push([
        "TOTAL",
        "",
        safeNumber(totals?.AC),
        safeNumber(totals?.PC),
        safeNumber(totals?.ACD),
        safeNumber(totals?.AVG_CD),
        safeNumber(totals?.new_deals),
        safeNumber(totals?.md),
        safeNumber(totals?.sd),
        safeNumber(totals?.bill_count),
        safeNumber(totals?.volume),
      ]);

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws["!cols"] = [
        { wch: 18 },
        { wch: 24 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
        { wch: 14 },
        { wch: 16 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
        { wch: 14 },
      ];

      ws["!merges"] = [
        {
          s: { r: 0, c: 0 },
          e: { r: 0, c: 10 },
        },
      ];

      const range = XLSX.utils.decode_range(ws["!ref"]);

      const thinBorder = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      };

      for (let r = range.s.r; r <= range.e.r; r++) {
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cell = XLSX.utils.encode_cell({ r, c });
          if (!ws[cell]) continue;

          ws[cell].s = {
            font: {
              name: "Calibri",
              sz: 11,
              color: { rgb: "000000" },
            },
            alignment: {
              horizontal: "center",
              vertical: "center",
              wrapText: true,
            },
            border: thinBorder,
          };
        }
      }

      ws["A1"].s = {
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
          fgColor: { rgb: "7A1F5C" },
        },
        border: thinBorder,
      };

      for (let c = 0; c <= 10; c++) {
        const cell = XLSX.utils.encode_cell({ r: 2, c });
        if (ws[cell]) {
          ws[cell].s = {
            ...ws[cell].s,
            font: {
              name: "Calibri",
              sz: 11,
              bold: true,
            },
            fill: {
              fgColor: { rgb: "EAF4FF" },
            },
          };
        }
      }

      for (let r = 3; r <= range.e.r; r++) {
        const firstCell = ws[XLSX.utils.encode_cell({ r, c: 0 })];

        if (firstCell?.v === "TOTAL") {
          const isGrandTotal = r === range.e.r;

          for (let c = 0; c <= 10; c++) {
            const cell = XLSX.utils.encode_cell({ r, c });
            if (!ws[cell]) continue;

            ws[cell].s = {
              ...ws[cell].s,
              font: {
                name: "Calibri",
                sz: 11,
                bold: true,
                color: { rgb: isGrandTotal ? "000000" : "FF0000" },
              },
              fill: {
                fgColor: { rgb: isGrandTotal ? "F8CBAD" : "FFFF00" },
              },
            };
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Daily Sales Report");
      XLSX.writeFile(wb, "Sales_Team_CD_Report.xlsx");

      toast.success("Excel exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Excel export failed");
    }
  };

  const handleReset = () => {
    setSearch("");
    setTeamFilter("");
    setCreatedByFilter("");
    setStartDate(today);
    setEndDate(today);

    fetchReport({
      search: "",
      team: "",
      created_by: "",
      start_date: today,
      end_date: today,
    });
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
                  Sales Team CD Report
                </h4>
                <p
                  style={{
                    marginBottom: 0,
                    color: "#6c757d",
                    fontSize: "13px",
                  }}
                >
                  Daily sales report with team-wise CD summary
                </p>
              </Col>

              <Col md="4" className="text-end">
                <Button
                  color="success"
                  onClick={exportToExcel}
                  disabled={loading || !reportData.length}
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
                <Label style={{ fontWeight: 600, fontSize: "13px" }}>
                  Search
                </Label>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchReport();
                  }}
                />
              </Col>

              <Col md="2">
                <Label style={{ fontWeight: 600, fontSize: "13px" }}>
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
                <Label style={{ fontWeight: 600, fontSize: "13px" }}>
                  Staff
                </Label>
                <Select
                  options={staffSelectOptions}
                  value={selectedStaffOption}
                  onChange={(selected) =>
                    setCreatedByFilter(selected?.value || "")
                  }
                  placeholder="All Staff"
                  isClearable
                  isSearchable
                  styles={customSelectStyles}
                />
              </Col>

              <Col md="2">
                <Label style={{ fontWeight: 600, fontSize: "13px" }}>
                  Start Date
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Col>

              <Col md="2">
                <Label style={{ fontWeight: 600, fontSize: "13px" }}>
                  End Date
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Col>

              <Col md="2" className="d-flex align-items-end gap-2">
                <Button color="primary" onClick={() => fetchReport()} disabled={loading}>
                  Apply
                </Button>

                <Button color="secondary" onClick={handleReset}>
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
            {loading ? (
              <div className="text-center my-5">
                <Spinner color="primary" />
              </div>
            ) : !reportData.length ? (
              <div className="text-center my-4">
                <p className="mb-0">No data found</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <Table
                  bordered
                  responsive={false}
                  style={{
                    minWidth: "900px",
                    marginBottom: 0,
                    fontSize: "13px",
                    textAlign: "center",
                    verticalAlign: "middle",
                    border: "1px solid #000",
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          fontWeight: 700,
                          textAlign: "left",
                          border: "1px solid #000",
                          minWidth: "130px",
                        }}
                      >
                        {startDate}
                      </td>
                      <td style={{ border: "1px solid #000" }}></td>
                      <td style={{ border: "1px solid #000" }}></td>
                      <td style={{ border: "1px solid #000" }}></td>
                      <td style={{ border: "1px solid #000" }}></td>
                      <td style={{ border: "1px solid #000" }}></td>
                      <td style={{ border: "1px solid #000" }}></td>
                      <td style={{ border: "1px solid #000" }}></td>
                      <td style={{ border: "1px solid #000" }}></td>
                    </tr>

                    <tr>
                      <td style={{ border: "1px solid #000" }}></td>
                      <td style={{ border: "1px solid #000" }}></td>

                      {[
                        "AC",
                        "PC",
                        "ACD",
                        "AVG CD",
                        "NEW LEADS",
                        "MD",
                        "SD",
                        "BILL",
                        "VOLUME",
                      ].map((head) => (
                        <td
                          key={head}
                          style={{
                            fontWeight: 700,
                            color: "#7A1F5C",
                            background: "#EAF4FF",
                            border: "1px solid #000",
                          }}
                        >
                          {head}
                        </td>
                      ))}
                    </tr>

                    {reportData.map((team, teamIndex) => (
                      <React.Fragment key={teamIndex}>
                        {(team.members || []).map((member, memberIndex) => (
                          <tr key={`${teamIndex}-${memberIndex}`}>
                            <td
                              style={{
                                fontWeight: 700,
                                textAlign: "center",
                                background: "#EAF4FF",
                                border: "1px solid #000",
                              }}
                            >
                              {memberIndex === 0
                                ? String(team.team_name || "").toUpperCase()
                                : ""}
                            </td>

                            <td
                              style={{
                                textAlign: "left",
                                fontWeight: 600,
                                border: "1px solid #000",
                                minWidth: "180px",
                              }}
                            >
                              {String(member.created_by_name || "").toUpperCase()}
                            </td>

                            <td style={{ border: "1px solid #000" }}>
                              {formatValue(member.AC)}
                            </td>
                            <td style={{ border: "1px solid #000" }}>
                              {formatValue(member.PC)}
                            </td>
                            <td style={{ border: "1px solid #000" }}>
                              {formatValue(member.ACD)}
                            </td>
                            <td style={{ border: "1px solid #000" }}>
                              {formatValue(member.AVG_CD)}
                            </td>
                            <td style={{ border: "1px solid #000" }}>
                              {formatValue(member.new_deals)}
                            </td>
                            <td style={{ border: "1px solid #000" }}>
                              {formatValue(member.md)}
                            </td>
                            <td style={{ border: "1px solid #000" }}>
                              {formatValue(member.sd)}
                            </td>
                            <td style={{ border: "1px solid #000" }}>
                              {formatValue(member.bill_count)}
                            </td>
                            <td style={{ border: "1px solid #000" }}>
                              {formatValue(member.volume)}
                            </td>
                          </tr>
                        ))}

                        <tr>
                          <td
                            colSpan="2"
                            style={{
                              background: "#FFFF00",
                              color: "#FF0000",
                              fontWeight: 700,
                              border: "1px solid #000",
                            }}
                          >
                            TOTAL
                          </td>

                          <td style={teamTotalStyle}>
                            {formatValue(team.team_total?.AC)}
                          </td>
                          <td style={teamTotalStyle}>
                            {formatValue(team.team_total?.PC)}
                          </td>
                          <td style={teamTotalStyle}>
                            {formatValue(team.team_total?.ACD)}
                          </td>
                          <td style={teamTotalStyle}>
                            {formatValue(team.team_total?.AVG_CD)}
                          </td>
                          <td style={teamTotalStyle}>
                            {formatValue(team.team_total?.new_deals)}
                          </td>
                          <td style={teamTotalStyle}>
                            {formatValue(team.team_total?.md)}
                          </td>
                          <td style={teamTotalStyle}>
                            {formatValue(team.team_total?.sd)}
                          </td>
                          <td style={teamTotalStyle}>
                            {formatValue(team.team_total?.bill_count)}
                          </td>
                          <td style={teamTotalStyle}>
                            {formatValue(team.team_total?.volume)}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}

                    <tr>
                      <td colSpan="9" style={{ height: "28px" }}></td>
                    </tr>

                    <tr>
                      <td
                        colSpan="2"
                        style={{
                          background: "#F8CBAD",
                          fontWeight: 700,
                          border: "1px solid #000",
                        }}
                      >
                        TOTAL
                      </td>

                      <td style={grandTotalStyle}>{formatValue(totals?.AC)}</td>
                      <td style={grandTotalStyle}>{formatValue(totals?.PC)}</td>
                      <td style={grandTotalStyle}>{formatValue(totals?.ACD)}</td>
                      <td style={grandTotalStyle}>
                        {formatValue(totals?.AVG_CD)}
                      </td>
                      <td style={grandTotalStyle}>
                        {formatValue(totals?.new_deals)}
                      </td>
                      <td style={grandTotalStyle}>
                        {formatValue(totals?.md)}
                      </td>
                      <td style={grandTotalStyle}>
                        {formatValue(totals?.sd)}
                      </td>
                      <td style={grandTotalStyle}>
                        {formatValue(totals?.bill_count)}
                      </td>
                      <td style={grandTotalStyle}>
                        {formatValue(totals?.volume)}
                      </td>
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

const teamTotalStyle = {
  background: "#FFFF00",
  color: "#FF0000",
  fontWeight: 700,
  border: "1px solid #000",
};

const grandTotalStyle = {
  background: "#F8CBAD",
  color: "#000000",
  fontWeight: 700,
  border: "1px solid #000",
};

export default SalesTeamCdDailyReport;