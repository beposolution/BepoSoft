import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row } from "reactstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FamilyDetails = () => {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          `${import.meta.env.VITE_APP_KEY}orders/summary/family/data/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFamilies(data?.results || []);
      } catch (e) {
        console.error(e);
        toast.error("Error fetching family summary.");
      } finally {
        setLoading(false);
      }
    };
    fetchFamilies();
  }, []);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "200px" }}
      >
        <span>Loading...</span>
      </div>
    );
  }

  const fmt = (n) =>
    (Number(n) || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    });

  return (
    <React.Fragment>
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs title="Tables" breadcrumbItem="FAMILY-WISE DETAILS" />
          <Row>
            <Col xl={12}>
              <Card>
                <CardBody>
                  <h4 className="text-center mb-4 fw-bold text-primary">
                    📊 Division-wise Order Statistics
                  </h4>

                  <div className="row g-4 justify-content-center">
                    {families.length ? (
                      families.map((fam) => {
                        const todayCount = fam?.today_count ?? 0;
                        const todayTotal = fam?.today_total_amount ?? 0;
                        const monthCount = fam?.month_count ?? 0;
                        const monthTotal = fam?.month_total_amount ?? 0;

                        const ps = fam?.payment_status_summary || {};
                        const psToday = ps.today || {};
                        const psMonth = ps.month || {};

                        const tCOD = psToday.COD || { count: 0, total: 0 };
                        const tPaid = psToday.paid || { count: 0, total: 0 };
                        const tCredit = psToday.credit || { count: 0, total: 0 };

                        const mCOD = psMonth.COD || { count: 0, total: 0 };
                        const mPaid = psMonth.paid || { count: 0, total: 0 };
                        const mCredit = psMonth.credit || { count: 0, total: 0 };

                        return (
                          <div className="col-12 col-md-6 col-xl-4" key={fam.family_id}>
                            <div
                              className="card border-0 shadow-sm p-2 rounded-4 h-100"
                              style={{
                                width: "100%",
                                minHeight: "260px",
                                background: "#f9fcff",
                                cursor: "pointer",
                                transition: "0.3s",
                              }}
                              onClick={() =>
                                navigate("/dashboard/family/details", {
                                  state: { familyId: fam.family_id, familyName: fam.family_name },
                                })
                              }
                            >
                              <div className="card-body text-center p-0">
                                <h5 className="card-title text-uppercase fw-semibold text-secondary mb-3 mt-2">
                                  {fam.family_name || "Unknown"}
                                </h5>

                                <div className="table-responsive">
                                  <table
                                    className="table table-sm mb-0"
                                    style={{
                                      background: "#f5faff",
                                      borderRadius: "14px",
                                      overflow: "hidden",
                                      boxShadow: "0 2px 6px 0 rgba(0,0,0,0.03)",
                                    }}
                                  >
                                    <tbody>
                                      {/* Today Total */}
                                      <tr style={{ borderBottom: "1px solid #e0f1ff" }}>
                                        <td className="text-start fw-semibold" style={{ width: "60%", padding: "0.6rem" }}>
                                          <span style={{ color: "#2d8a44" }}>Today's Total</span>
                                        </td>
                                        <td className="text-end" style={{ padding: "0.6rem" }}>
                                          <span className="fw-bold" style={{ color: "#27ae60", fontSize: "1.08rem" }}>
                                            ₹{fmt(todayTotal)}
                                          </span>
                                          <br />
                                          <span className="text-muted small">({todayCount} orders)</span>
                                        </td>
                                      </tr>

                                      {/* Today COD / Paid / Credit */}
                                      <tr style={{ borderBottom: "1px solid #e0f1ff", background: "#f9f9fb" }}>
                                        <td className="text-start fw-semibold" style={{ padding: "0.6rem" }}>
                                          <span style={{ color: "#c47a00" }}>Today's COD</span>
                                        </td>
                                        <td className="text-end" style={{ padding: "0.6rem" }}>
                                          <span className="fw-bold" style={{ color: "#ff9800", fontSize: "1.08rem" }}>
                                            ₹{fmt(tCOD.total)}
                                          </span>
                                          <br />
                                          <span className="text-muted small">({tCOD.count} orders)</span>
                                        </td>
                                      </tr>
                                      <tr style={{ borderBottom: "1px solid #e0f1ff" }}>
                                        <td className="text-start fw-semibold" style={{ padding: "0.6rem" }}>
                                          <span style={{ color: "#1967d2" }}>Today's Paid</span>
                                        </td>
                                        <td className="text-end" style={{ padding: "0.6rem" }}>
                                          <span className="fw-bold" style={{ color: "#1967d2", fontSize: "1.08rem" }}>
                                            ₹{fmt(tPaid.total)}
                                          </span>
                                          <br />
                                          <span className="text-muted small">({tPaid.count} orders)</span>
                                        </td>
                                      </tr>
                                      <tr style={{ borderBottom: "1px solid #e0f1ff" }}>
                                        <td className="text-start fw-semibold" style={{ padding: "0.6rem" }}>
                                          <span style={{ color: "#6b7280" }}>Today's Credit</span>
                                        </td>
                                        <td className="text-end" style={{ padding: "0.6rem" }}>
                                          <span className="fw-bold" style={{ color: "#6b7280", fontSize: "1.08rem" }}>
                                            ₹{fmt(tCredit.total)}
                                          </span>
                                          <br />
                                          <span className="text-muted small">({tCredit.count} orders)</span>
                                        </td>
                                      </tr>

                                      {/* Spacer */}
                                      <tr>
                                        <td colSpan={2} style={{ border: 0, height: "16px", background: "transparent" }} />
                                      </tr>

                                      {/* Month Total */}
                                      <tr style={{ borderBottom: "1px solid #e0f1ff" }}>
                                        <td className="text-start fw-semibold" style={{ padding: "0.6rem" }}>
                                          <span style={{ color: "#2464a3" }}>This Month</span>
                                        </td>
                                        <td className="text-end" style={{ padding: "0.6rem" }}>
                                          <span className="fw-bold" style={{ color: "#2464a3", fontSize: "1.08rem" }}>
                                            ₹{fmt(monthTotal)}
                                          </span>
                                          <br />
                                          <span className="text-muted small">({monthCount} orders)</span>
                                        </td>
                                      </tr>

                                      {/* Month COD / Paid / Credit */}
                                      <tr style={{ background: "#f9f9fb", borderBottom: "1px solid #e0f1ff" }}>
                                        <td className="text-start fw-semibold" style={{ padding: "0.6rem" }}>
                                          <span style={{ color: "#c47a00" }}>This Month COD</span>
                                        </td>
                                        <td className="text-end" style={{ padding: "0.6rem" }}>
                                          <span className="fw-bold" style={{ color: "#ff9800", fontSize: "1.08rem" }}>
                                            ₹{fmt(mCOD.total)}
                                          </span>
                                          <br />
                                          <span className="text-muted small">({mCOD.count} orders)</span>
                                        </td>
                                      </tr>

                                      <tr style={{ borderBottom: "1px solid #e0f1ff" }}>
                                        <td className="text-start fw-semibold" style={{ padding: "0.6rem" }}>
                                          <span style={{ color: "#1967d2" }}>This Month Paid</span>
                                        </td>
                                        <td className="text-end" style={{ padding: "0.6rem" }}>
                                          <span className="fw-bold" style={{ color: "#1967d2", fontSize: "1.08rem" }}>
                                            ₹{fmt(mPaid.total)}
                                          </span>
                                          <br />
                                          <span className="text-muted small">({mPaid.count} orders)</span>
                                        </td>
                                      </tr>

                                      <tr>
                                        <td className="text-start fw-semibold" style={{ padding: "0.6rem" }}>
                                          <span style={{ color: "#6b7280" }}>This Month Credit</span>
                                        </td>
                                        <td className="text-end" style={{ padding: "0.6rem" }}>
                                          <span className="fw-bold" style={{ color: "#6b7280", fontSize: "1.08rem" }}>
                                            ₹{fmt(mCredit.total)}
                                          </span>
                                          <br />
                                          <span className="text-muted small">({mCredit.count} orders)</span>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="w-100 text-center text-muted">No data found.</div>
                    )}
                  </div>

                  <ToastContainer position="bottom-right" />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </React.Fragment>
  );
};

export default FamilyDetails;
