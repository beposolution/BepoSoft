import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Table, Row, Col, Card, CardBody, Input, Button, Spinner } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const EXPENSE_TYPES = [
  { value: "miscellaneous", label: "Miscellaneous" },
  { value: "permanent", label: "Permanent" },
  { value: "emi", label: "EMI" },
  { value: "cargo", label: "Cargo" },
  { value: "purchase", label: "Purchase" },
  { value: "others", label: "Others" },
];

const KNOWN_TYPES = new Set([
  "miscellaneous",
  "permanent",
  "emi",
  "cargo",
  "purchase",
]);

function normalizeExpenseType(v) {
  const s = (v ?? "").toString().trim().toLowerCase();
  return KNOWN_TYPES.has(s) ? s : "others";
}

function labelForExpenseType(v) {
  const entry = EXPENSE_TYPES.find((t) => t.value === v);
  return entry?.label ?? v ?? "Others";
}

function formatAmount(value) {
  const num = parseFloat(value || 0);
  return Number.isNaN(num) ? "0.00" : num.toFixed(2);
}

const BasicTable = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [expenses, setExpenses] = useState([]);
  const [purposeOfPayment, setPurposeOfPayment] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("");
  const [expenseTypeFilter, setExpenseTypeFilter] = useState("");

  const [summary, setSummary] = useState({
    total_count: 0,
    total_amount: "0.00",
  });

  const [summaryByType, setSummaryByType] = useState({
    miscellaneous: { count: 0, amount: "0.00" },
    permanent: { count: 0, amount: "0.00" },
    emi: { count: 0, amount: "0.00" },
    cargo: { count: 0, amount: "0.00" },
    purchase: { count: 0, amount: "0.00" },
    others: { count: 0, amount: "0.00" },
  });

  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [previousPageUrl, setPreviousPageUrl] = useState(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const purposeIdToName = useMemo(() => {
    const m = new Map();
    (purposeOfPayment || []).forEach((p) => m.set(String(p.id), p.name));
    return m;
  }, [purposeOfPayment]);

  const fetchPurposeOfPayment = useCallback(async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_IMAGE}/apis/add/purpose/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPurposeOfPayment(response.data || []);
    } catch (error) {
      toast.error("Error fetching purpose of payment");
    }
  }, [token]);

  const buildQueryParams = useCallback(
    (page = 1, fetchAll = false) => {
      const params = new URLSearchParams();

      if (!fetchAll) {
        params.append("page", page);
      }

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      if (startDate) {
        params.append("start_date", startDate);
      }

      if (endDate) {
        params.append("end_date", endDate);
      }

      if (purposeFilter) {
        params.append("purpose_id", purposeFilter);
      }

      if (expenseTypeFilter) {
        params.append("expense_type", expenseTypeFilter);
      }

      params.append("ordering", "-id");

      return params.toString();
    },
    [searchTerm, startDate, endDate, purposeFilter, expenseTypeFilter]
  );

  const fetchExpenses = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);

        const query = buildQueryParams(page, false);
        const response = await fetch(
          `${import.meta.env.VITE_APP_KEY}expense/get/data/?${query}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch expenses");
        }

        const data = await response.json();

        const payload = data?.results || {};
        const list = payload?.results || [];
        const summaryData = payload?.summary || {};
        const summaryTypeData = payload?.summary_by_type || {};

        setExpenses(Array.isArray(list) ? list : []);
        setSummary({
          total_count: summaryData?.total_count ?? 0,
          total_amount: summaryData?.total_amount ?? "0.00",
        });
        setSummaryByType({
          miscellaneous: summaryTypeData?.miscellaneous || { count: 0, amount: "0.00" },
          permanent: summaryTypeData?.permanent || { count: 0, amount: "0.00" },
          emi: summaryTypeData?.emi || { count: 0, amount: "0.00" },
          cargo: summaryTypeData?.cargo || { count: 0, amount: "0.00" },
          purchase: summaryTypeData?.purchase || { count: 0, amount: "0.00" },
          others: summaryTypeData?.others || { count: 0, amount: "0.00" },
        });

        setTotalCount(data?.count ?? 0);
        setNextPageUrl(data?.next ?? null);
        setPreviousPageUrl(data?.previous ?? null);
      } catch (error) {
        toast.error("Error fetching expense data");
        setExpenses([]);
        setSummary({
          total_count: 0,
          total_amount: "0.00",
        });
        setSummaryByType({
          miscellaneous: { count: 0, amount: "0.00" },
          permanent: { count: 0, amount: "0.00" },
          emi: { count: 0, amount: "0.00" },
          cargo: { count: 0, amount: "0.00" },
          purchase: { count: 0, amount: "0.00" },
          others: { count: 0, amount: "0.00" },
        });
        setTotalCount(0);
        setNextPageUrl(null);
        setPreviousPageUrl(null);
      } finally {
        setLoading(false);
      }
    },
    [buildQueryParams, token]
  );

  useEffect(() => {
    fetchPurposeOfPayment();
  }, [fetchPurposeOfPayment]);

  useEffect(() => {
    fetchExpenses(currentPage);
  }, [fetchExpenses, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, purposeFilter, expenseTypeFilter]);

  const handleExportToExcel = async () => {
    try {
      setExportLoading(true);

      let allRows = [];
      let page = 1;
      let hasNext = true;

      while (hasNext) {
        const query = buildQueryParams(page, false);
        const response = await fetch(
          `${import.meta.env.VITE_APP_KEY}expense/get/data/?${query}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to export expenses");
        }

        const data = await response.json();
        const payload = data?.results || {};
        const rows = payload?.results || [];

        allRows = [...allRows, ...rows];

        if (data?.next) {
          page += 1;
        } else {
          hasNext = false;
        }
      }

      const exportRows = allRows.map((expense, index) => ({
        "Sl No": index + 1,
        Company: expense?.company?.name || "N/A",
        Bank: expense?.bank?.name || "N/A",
        Amount: expense?.amount ?? "0.00",
        "Expense Date": expense?.expense_date || "N/A",
        Purpose:
          expense?.purpose_of_pay ||
          purposeIdToName.get(String(expense?.purpose_id)) ||
          "N/A",
        "Expense Type": labelForExpenseType(
          normalizeExpenseType(expense?.expense_type)
        ),
        Description: expense?.description ?? "",
        "Added By": expense?.added_by ?? "",
        "Transaction ID": expense?.transaction_id ?? "",
      }));

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Expenses");
      XLSX.writeFile(wb, "expenses.xlsx");
    } catch (error) {
      toast.error("Error exporting expense data");
    } finally {
      setExportLoading(false);
    }
  };

  const updateExpense = (id) => {
    navigate(`/expense/update/${id}/`);
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setPurposeFilter("");
    setExpenseTypeFilter("");
    setCurrentPage(1);
  };

  const handleSummaryTypeClick = (typeValue) => {
    setExpenseTypeFilter(typeValue);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    return pages;
  };

  document.title = "Beposoft | Expense Data";

  return (
    <React.Fragment>
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs title="Tables" breadcrumbItem="EXPENSE DATA" />

          <Row className="mb-3 g-2">
            <Col md={2}>
              <Input
                type="text"
                placeholder="Search..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </Col>

            <Col md={2}>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Col>

            <Col md={2}>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Col>

            <Col md={2}>
              <Input
                type="select"
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value)}
              >
                <option value="">All Purposes</option>
                {purposeOfPayment?.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                  </option>
                ))}
              </Input>
            </Col>

            <Col md={2}>
              <Input
                type="select"
                value={expenseTypeFilter}
                onChange={(e) => setExpenseTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                {EXPENSE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Input>
            </Col>

            <Col md={2} className="d-flex gap-2">
              <Button color="primary" onClick={handleExportToExcel} disabled={exportLoading}>
                {exportLoading ? "Exporting..." : "Export to Excel"}
              </Button>
            </Col>
          </Row>

          <Row className="g-2 mb-3">
            <Col md="auto">
              <Button
                outline
                color={expenseTypeFilter ? "secondary" : "primary"}
                onClick={() => {
                  setExpenseTypeFilter("");
                  setCurrentPage(1);
                }}
              >
                Show All
              </Button>
            </Col>

            {EXPENSE_TYPES.map((t) => {
              const s = summaryByType[t.value] || { count: 0, amount: "0.00" };

              return (
                <Col md="auto" key={t.value}>
                  <Button
                    color={expenseTypeFilter === t.value ? "primary" : "light"}
                    onClick={() => handleSummaryTypeClick(t.value)}
                    style={{ minWidth: 210, textAlign: "left" }}
                    title={`Filter by ${t.label}`}
                  >
                    <div style={{ fontWeight: 600 }}>{t.label}</div>
                    <div style={{ fontSize: 12 }}>
                      Count: {s.count} &nbsp;|&nbsp; ₹ {formatAmount(s.amount)}
                    </div>
                  </Button>
                </Col>
              );
            })}
          </Row>

          <Row className="mb-2">
            <Col md={12} className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <strong>Total Records: {summary?.total_count ?? 0}</strong>
              </div>

              <div className="d-flex align-items-center gap-2">
                <Button color="secondary" outline onClick={clearAllFilters}>
                  Clear Filters
                </Button>

                <strong>
                  Total Expense:{" "}
                  <Button color="success">
                    <span style={{ color: "#fff", fontSize: "1rem" }}>
                      {formatAmount(summary?.total_amount)}
                    </span>
                  </Button>
                </strong>
              </div>
            </Col>
          </Row>

          <Row>
            <Col xl={12}>
              <Card>
                <CardBody>
                  <div className="table-responsive">
                    <Table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Company</th>
                          <th>Bank</th>
                          <th>Amount</th>
                          <th>Expense Date</th>
                          <th>Purpose</th>
                          <th>Expense Type</th>
                          <th>Description</th>
                          <th>Added By</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="10" className="text-center py-4">
                              <Spinner size="sm" className="me-2" />
                              Loading...
                            </td>
                          </tr>
                        ) : expenses.length > 0 ? (
                          expenses.map((expense, index) => (
                            <tr key={expense?.id}>
                              <th scope="row">{(currentPage - 1) * pageSize + index + 1}</th>

                              <td style={{ color: "#007bff" }}>
                                {expense?.company?.name || "N/A"}
                              </td>

                              <td>{expense?.bank?.name || "N/A"}</td>

                              <td style={{ color: "#28a745" }}>
                                ₹{expense?.amount ?? "0.00"}
                              </td>

                              <td>{expense?.expense_date || "N/A"}</td>

                              <td style={{ color: "#ff6f61" }}>
                                {(
                                  expense?.purpose_of_pay ||
                                  purposeIdToName.get(String(expense?.purpose_id)) ||
                                  "N/A"
                                )
                                  .toString()
                                  .toUpperCase()}
                              </td>

                              <td>
                                {labelForExpenseType(
                                  normalizeExpenseType(expense?.expense_type)
                                ).toUpperCase()}
                              </td>

                              <td>{expense?.description ?? ""}</td>

                              <td style={{ fontWeight: "bold" }}>
                                {expense?.added_by ?? ""}
                              </td>

                              <td>
                                <button
                                  onClick={() => updateExpense(expense?.id)}
                                  style={{
                                    padding: "10px 20px",
                                    border: "none",
                                    background: "#3258a8",
                                    color: "white",
                                  }}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="10" className="text-center py-4">
                              No expense data found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-2">
                    <div>
                      Showing {expenses.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
                      {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <Button
                        color="light"
                        disabled={!previousPageUrl || currentPage === 1 || loading}
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      >
                        Previous
                      </Button>

                      {getPageNumbers().map((pageNum) => (
                        <Button
                          key={pageNum}
                          color={pageNum === currentPage ? "primary" : "light"}
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={loading}
                        >
                          {pageNum}
                        </Button>
                      ))}

                      <Button
                        color="light"
                        disabled={!nextPageUrl || currentPage === totalPages || loading}
                        onClick={() =>
                          setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                        }
                      >
                        Next
                      </Button>
                    </div>
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

export default BasicTable;