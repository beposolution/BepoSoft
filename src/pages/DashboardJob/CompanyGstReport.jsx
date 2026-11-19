import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, CardBody, Col, Row, Spinner } from "reactstrap";

const dateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const currentRange = (month = false) => {
  const now = new Date();
  return {
    start: dateKey(month ? new Date(now.getFullYear(), now.getMonth(), 1) : now),
    end: dateKey(now),
  };
};
const amountNumber = (value) => {
  const number = Number(String(value ?? 0).replace(/,/g, ""));
  return Number.isFinite(number) ? number : 0;
};
const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(amountNumber(value));
const displayText = (value) => value == null || String(value).trim() === "" ? "—" : String(value);
const prettyDate = (value) => {
  const date = new Date(`${String(value || "").slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? displayText(value) :
    date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const getDisplayStatus = (status) => ({
  "Invoice Created": "Waiting For Approval",
  "To Print": "Delivery Order (DO)",
  "Packing under progress": "Printed",
  "Packed": "Packed For Delivery (PFD)",
  "Ready to ship": "Out For Delivery (OFD)",
  "Return From Delivery": "Return From Delivery (RFD)",
})[status] || displayText(status);
const statusColour = (status) => ({
  "Invoice Created": "#b45309", "To Print": "#2563eb",
  "Packing under progress": "#2563eb", "Packed": "#7c3aed",
  "Ready to ship": "#047857", "Return From Delivery": "#be123c",
})[status] || "#475569";
const panel = { border: "1px solid #e2e8f0", borderRadius: 20, boxShadow: "0 5px 20px rgba(23,37,84,.035)" };
const ink = "#172554";
const blue = "#2563eb";

export default function CompanyGstReport() {
  const { companyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialState = location.state || {};
  const [selectedCompanyId, setSelectedCompanyId] = useState(String(companyId || ""));
  const [selectedCompanyName, setSelectedCompanyName] = useState(initialState.companyName || "Company GST Report");
  const [companies, setCompanies] = useState([{ id: String(companyId || ""), name: initialState.companyName || "Selected company" }]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState("");
  const [range, setRange] = useState(() => ({
    start: initialState.startDate || currentRange().start,
    end: initialState.endDate || currentRange().end,
  }));
  const [draftRange, setDraftRange] = useState(range);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const token = localStorage.getItem("token");

  useEffect(() => { document.title = "Company GST Report | BEPOSOFT"; }, []);

  const loadCompanies = useCallback(async (signal) => {
    setCompaniesLoading(true);
    setCompaniesError("");
    try {
      if (!token) throw new Error("Please log in again to load companies.");
      const response = await axios.get(`${import.meta.env.VITE_APP_KEY}company/data/`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal, timeout: 30000,
      });
      if (!Array.isArray(response.data?.data)) throw new Error("Invalid company response.");
      const byId = new Map();
      response.data.data.forEach(item => {
        if (item?.id != null) byId.set(String(item.id), { id: String(item.id), name: String(item.name || "Unnamed company") });
      });
      byId.set(String(companyId), byId.get(String(companyId)) || {
        id: String(companyId), name: initialState.companyName || "Selected company",
      });
      if (signal?.aborted) return;
      setCompanies([...byId.values()].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      if (!signal?.aborted) setCompaniesError(err.message || "Unable to load companies.");
    } finally { if (!signal?.aborted) setCompaniesLoading(false); }
  }, [token, companyId]);

  useEffect(() => {
    const controller = new AbortController();
    loadCompanies(controller.signal);
    return () => controller.abort();
  }, [loadCompanies]);

  useEffect(() => {
    const matched = companies.find(c => c.id === selectedCompanyId);
    if (matched) setSelectedCompanyName(matched.name);
  }, [companies, selectedCompanyId]);

  useEffect(() => {
    const next = String(companyId || "");
    setSelectedCompanyId(next);
  }, [companyId]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadReport() {
      setLoading(true);
      setError("");
      setRows([]);
      try {
        if (!token) throw new Error("Your session has expired. Please log in again.");
        if (!selectedCompanyId || selectedCompanyId.startsWith("name:")) {
          throw new Error("This company has no valid company ID for report filtering.");
        }
        const response = await axios.get(`${import.meta.env.VITE_APP_KEY}orders/tax/report/`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          params: { company: selectedCompanyId, start_date: range.start, end_date: range.end },
          signal: controller.signal, timeout: 30000,
        });
        if (response.data?.status !== "success" || !Array.isArray(response.data?.data)) {
          throw new Error("The server returned an invalid GST report.");
        }
        if (response.data?.next) {
          throw new Error("The report is paginated. Complete totals require all pages.");
        }
        const result = response.data.data
          .filter(item => String(item.company_id ?? "") === selectedCompanyId)
          .sort((a, b) => String(b.order_date || "").localeCompare(String(a.order_date || "")));
        if (!controller.signal.aborted) setRows(result);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.code === "ECONNABORTED" ? "Request timed out. Please retry." :
            err.response?.status === 401 || err.response?.status === 403 ? "Session expired or access restricted." :
            err.response?.data?.message || err.message || "Unable to load GST report.");
        }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    loadReport();
    return () => controller.abort();
  }, [selectedCompanyId, range.start, range.end, token, reload]);

  const totals = useMemo(() => rows.reduce((acc, row) => {
    acc.gst += amountNumber(row.tax_amount);
    acc.net += amountNumber(row.net_amount);
    acc.withoutTax += amountNumber(row.amount_before_tax);
    return acc;
  }, { gst: 0, net: 0, withoutTax: 0 }), [rows]);

  const applyRange = () => {
    if (!draftRange.start || !draftRange.end || draftRange.start > draftRange.end) {
      setError("Please select a valid date range.");
      return;
    }
    setRange({ ...draftRange });
    setError("");
  };
  const selectQuick = (month) => {
    const next = currentRange(month);
    setDraftRange(next);
    setRange(next);
  };
  const selectCompany = (event) => {
    const next = event.target.value;
    const match = companies.find(c => c.id === next);
    setSelectedCompanyId(next);
    if (match) setSelectedCompanyName(match.name);
    navigate(`/company-gst-report/${encodeURIComponent(next)}`, {
      replace: true, state: { companyName: match?.name || selectedCompanyName, startDate: range.start, endDate: range.end },
    });
  };

  const metrics = [
    { label: "Total GST", value: money(totals.gst), icon: "ri-bank-line", highlight: true },
    { label: "Order amount", value: money(totals.net), icon: "ri-money-rupee-circle-line" },
    { label: "Without tax", value: money(totals.withoutTax), icon: "ri-file-list-3-line" },
    { label: "Total orders", value: String(rows.length), icon: "ri-shopping-bag-line" },
  ];

  return (
    <div className="page-content" style={{ minHeight: "100vh", background: "#f3f6fc", paddingBottom: 48 }}>
      <div className="container-fluid" style={{ maxWidth: 1440 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <div className="text-uppercase fw-bold mb-1" style={{ color: blue, letterSpacing: 1.5, fontSize: 11 }}>
              Finance / Reports
            </div>
            <h4 className="mb-1 fw-bold" style={{ color: ink }}>Company GST Report</h4>
            <span className="text-muted">Company-wise GST overview and invoice breakdown</span>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <Button outline color="primary" onClick={() => setReload(n => n + 1)} disabled={loading}>
              <i className="ri-refresh-line me-1" /> Refresh
            </Button>
            <Button outline color="secondary" onClick={() => navigate(-1)}>
              <i className="ri-arrow-left-line me-1" /> Back to Dashboard
            </Button>
          </div>
        </div>

        <Card className="border-0 mb-4" style={panel}>
          <CardBody style={{ padding: 24 }}>
            <div className="d-flex align-items-start gap-3 mb-4">
              <div style={{ width: 45, height: 45, borderRadius: 13, background: "#eff6ff", color: blue,
                display: "grid", placeItems: "center", flexShrink: 0 }}>
                <i className="ri-building-4-line" style={{ fontSize: 23 }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="text-uppercase fw-bold mb-1" style={{ fontSize: 11, letterSpacing: 1.3, color: blue }}>
                  GST Overview
                </div>
                <h5 className="fw-bold mb-0" style={{ color: ink, overflowWrap: "anywhere" }}>
                  {selectedCompanyName}
                </h5>
              </div>
            </div>
            <Row className="g-3">
              <Col md={6}>
                <label htmlFor="gst-company" className="form-label fw-semibold" style={{ color: ink }}>Company</label>
                <select id="gst-company" className="form-select" value={selectedCompanyId} onChange={selectCompany}
                  style={{ borderRadius: 11, minHeight: 45, background: "#f8fafc", borderColor: "#dce4f0" }}>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {companiesLoading && <small className="text-muted">Loading companies...</small>}
                {companiesError && <div className="mt-1"><small className="text-warning">{companiesError}</small>
                  <Button size="sm" color="link" onClick={() => loadCompanies()}>Retry</Button></div>}
              </Col>
              <Col md={6}>
                <label className="form-label fw-semibold" style={{ color: ink }}>Report Period</label>
                <Row className="g-2">
                  <Col xs={6}>
                    <input aria-label="Start date" type="date" className="form-control" value={draftRange.start}
                      style={{ minHeight: 45, borderRadius: 11, borderColor: "#dce4f0" }}
                      onChange={e => setDraftRange(prev => ({ ...prev, start: e.target.value }))} />
                  </Col>
                  <Col xs={6}>
                    <input aria-label="End date" type="date" className="form-control" value={draftRange.end}
                      style={{ minHeight: 45, borderRadius: 11, borderColor: "#dce4f0" }}
                      onChange={e => setDraftRange(prev => ({ ...prev, end: e.target.value }))} />
                  </Col>
                </Row>
              </Col>
            </Row>
            <div className="d-flex flex-wrap gap-2 align-items-center mt-3">
              <Button color="primary" onClick={applyRange} style={{ borderRadius: 9 }}>
                <i className="ri-filter-3-line me-1" /> Apply Filter
              </Button>
              <Button outline color="primary" onClick={() => selectQuick(false)} style={{ borderRadius: 9 }}>Today</Button>
              <Button outline color="primary" onClick={() => selectQuick(true)} style={{ borderRadius: 9 }}>This Month</Button>
              <small className="ms-sm-auto text-muted">
                <i className="ri-calendar-line me-1" /> Showing {prettyDate(range.start)} – {prettyDate(range.end)}
              </small>
            </div>
          </CardBody>
        </Card>

        {loading ? (
          <Card className="border-0" style={panel}>
            <CardBody className="text-center py-5">
              <Spinner color="primary" /><div className="mt-3 fw-semibold">Loading GST report...</div>
            </CardBody>
          </Card>
        ) : error ? (
          <Alert color="danger" style={{ borderRadius: 14 }}>
            <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
              <span>{error}</span>
              <Button color="danger" outline size="sm" onClick={() => setReload(n => n + 1)}>Try again</Button>
            </div>
          </Alert>
        ) : (
          <>
            <Row className="g-3 mb-4">
              {metrics.map(item => (
                <Col key={item.label} xs={12} sm={6} xl={3}>
                  <Card className="h-100 border-0" style={{ ...panel, background: item.highlight ? blue : "#fff" }}>
                    <CardBody style={{ padding: 21 }}>
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div style={{ color: item.highlight ? "#dbeafe" : "#64748b", fontSize: 12, fontWeight: 600 }}>
                          {item.label}
                        </div>
                        <div style={{ width: 37, height: 37, display: "grid", placeItems: "center", borderRadius: 11,
                          background: item.highlight ? "rgba(255,255,255,.15)" : "#eff6ff" }}>
                          <i className={item.icon} style={{ fontSize: 20, color: item.highlight ? "#fff" : blue }} />
                        </div>
                      </div>
                      <div className="fw-bold mt-2" style={{ color: item.highlight ? "#fff" : ink, fontSize: 23,
                        letterSpacing: -.5, overflowWrap: "anywhere" }}>{item.value}</div>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>

            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <div>
                <h5 className="fw-bold mb-1" style={{ color: ink }}>Invoice breakdown</h5>
                <p className="text-muted small mb-0">Sales GST from the order tax report.</p>
              </div>
              <span style={{ background: "#e8efff", color: "#1d4ed8", fontSize: 12, fontWeight: 700,
                padding: "8px 13px", borderRadius: 999 }}>
                {rows.length} {rows.length === 1 ? "Invoice" : "Invoices"}
              </span>
            </div>

            {rows.length === 0 ? (
              <Card className="border-0" style={panel}>
                <CardBody className="text-center text-muted py-5">
                  No orders for this company in the selected period.
                </CardBody>
              </Card>
            ) : (
              <Row className="g-3">
                {rows.map((row, index) => {
                  const statusColor = statusColour(row.status);
                  const fields = [
                    ["Order amount", row.net_amount],
                    ["Without tax", row.amount_before_tax],
                    ["GST amount", row.tax_amount],
                    ["Discount", row.total_discount],
                    ["Gross amount", row.total_amount],
                  ];
                  return (
                    <Col key={`${row.order_id ?? "order"}-${row.invoice ?? "invoice"}-${index}`} xs={12} lg={6}>
                      <Card className="h-100 border-0" style={{ ...panel, overflow: "hidden" }}>
                        <div style={{ height: 4, background: blue }} />
                        <CardBody style={{ padding: 21 }}>
                          <div className="d-flex align-items-start gap-3">
                            <div style={{ width: 45, height: 45, borderRadius: 12, background: "#eff6ff", color: blue,
                              display: "grid", placeItems: "center", flexShrink: 0 }}>
                              <i className="ri-file-text-line" style={{ fontSize: 23 }} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div className="text-muted fw-semibold text-uppercase" style={{ fontSize: 10, letterSpacing: 1 }}>
                                Invoice number
                              </div>
                              <h6 className="fw-bold mb-1 mt-1" style={{ color: ink, fontSize: 16, overflowWrap: "anywhere" }}>
                                {displayText(row.invoice)}
                              </h6>
                              <div style={{ fontWeight: 600, color: "#475569", overflowWrap: "anywhere" }}>
                                {displayText(row.customer_name)}
                              </div>
                            </div>
                          </div>

                          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3">
                            <span style={{ padding: "7px 10px", borderRadius: 8, background: `${statusColor}13`,
                              border: `1px solid ${statusColor}30`, color: statusColor, fontWeight: 700, fontSize: 11 }}>
                              {getDisplayStatus(row.status)}
                            </span>
                            <small className="text-muted">
                              <i className="ri-calendar-line me-1" />{prettyDate(row.order_date)}
                            </small>
                          </div>

                          <div className="mt-3" style={{ background: "#f8faff", border: "1px solid #e9eef8",
                            borderRadius: 12, padding: "11px 13px" }}>
                            <div className="d-flex align-items-center justify-content-between gap-2">
                              <span className="text-muted" style={{ fontSize: 12 }}>Order reference</span>
                              <span className="fw-bold" style={{ color: ink, fontSize: 12, overflowWrap: "anywhere" }}>
                                #{displayText(row.order_id)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                            gap: 10 }}>
                            {fields.map(([label, value]) => (
                              <div key={label} style={{ background: label === "GST amount" ? "#eff6ff" : "#f8fafc",
                                borderRadius: 11, padding: "12px 13px", minWidth: 0 }}>
                                <div style={{ color: "#64748b", fontSize: 11, marginBottom: 5 }}>{label}</div>
                                <div className="fw-bold" style={{ color: label === "GST amount" ? "#1d4ed8" : ink,
                                  fontSize: 14, overflowWrap: "anywhere" }}>{money(value)}</div>
                              </div>
                            ))}
                            <div style={{ background: blue, borderRadius: 11, padding: "12px 13px", minWidth: 0 }}>
                              <div style={{ color: "#dbeafe", fontSize: 11, marginBottom: 5 }}>Tax summary</div>
                              <div className="fw-bold" style={{ color: "#fff", fontSize: 14, overflowWrap: "anywhere" }}>
                                {money(row.tax_amount)}
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </>
        )}
      </div>
    </div>
  );
}
