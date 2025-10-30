import React, { useEffect, useMemo, useState } from "react";
import { Table, Row, Col, Card, CardBody, Input, Button } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination";
import axios from "axios";

const EXPENSE_TYPES = [
  { value: "miscellaneous", label: "Miscellaneous" },
  { value: "permanent", label: "Permanent" },
  { value: "emi", label: "EMI" },
  { value: "cargo", label: "Cargo" },
  { value: "purchase", label: "Purchase" },
  { value: "others", label: "Others" }, // bucket for any unknown types
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
  return (entry?.label ?? v).toUpperCase();
}

const BasicTable = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [purposeOfPayment, setPurposeOfPayment] = useState([]);
  const [purposeFilter, setPurposeFilter] = useState("");
  const [expenseTypeFilter, setExpenseTypeFilter] = useState("");
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [perPageData] = useState(10);

  const token = localStorage.getItem("token");

  // id -> name lookup for robust comparison
  const purposeIdToName = useMemo(() => {
    const m = new Map();
    (purposeOfPayment || []).forEach((p) => m.set(String(p.id), p.name));
    return m;
  }, [purposeOfPayment]);

  // Fetch purpose list
  useEffect(() => {
    const fetchPurposeOfPayment = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_IMAGE}/apis/add/purpose/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPurposeOfPayment(response.data || []);
      } catch (error) {
        toast.error("Error fetching purpose of payment");
      }
    };
    fetchPurposeOfPayment();
  }, [token]);

  // Fetch expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_APP_KEY}expense/add/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch expenses");

        const data = await response.json();
        const list = data?.data || [];
        setExpenses(list);
        setFilteredExpenses(list);
      } catch (error) {
        toast.error("Error fetching expense data");
      }
    };

    fetchExpenses();
  }, [token]);

  const baseFiltered = useMemo(() => {
    let data = [...expenses];

    // Search across fields
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter((expense) => {
        const company = expense.company?.name?.toLowerCase() || "";
        const bank = expense.bank?.name?.toLowerCase() || "";
        const payedBy = expense.payed_by?.name?.toLowerCase() || "";
        const purposeName = (expense.purpose_of_pay || "").toLowerCase();
        const amount = (expense.amount ?? "").toString().toLowerCase();
        const rawType = (expense.expense_type ?? "").toString().toLowerCase();
        const description = (expense.description ?? "").toLowerCase();

        return (
          company.includes(q) ||
          bank.includes(q) ||
          payedBy.includes(q) ||
          purposeName.includes(q) ||
          amount.includes(q) ||
          rawType.includes(q) ||
          description.includes(q)
        );
      });
    }

    // Date range
    if (startDate) {
      const sd = new Date(startDate);
      data = data.filter((e) => new Date(e.expense_date) >= sd);
    }
    if (endDate) {
      const ed = new Date(endDate);
      data = data.filter((e) => new Date(e.expense_date) <= ed);
    }

    // Purpose filter (by id or fallback to name)
    if (purposeFilter) {
      const selectedPurposeId = purposeFilter; // string
      const selectedPurposeName =
        purposeIdToName.get(selectedPurposeId)?.toLowerCase() || "";
      data = data.filter((e) => {
        const rowPurposeId = e.purpose_id != null ? String(e.purpose_id) : undefined;
        const rowPurposeName = (e.purpose_of_pay || "").toString().toLowerCase();
        if (rowPurposeId) return rowPurposeId === selectedPurposeId;
        return selectedPurposeName && rowPurposeName === selectedPurposeName;
      });
    }

    return data;
  }, [expenses, searchTerm, startDate, endDate, purposeFilter, purposeIdToName]);

  useEffect(() => {
    let data = [...baseFiltered];
    if (expenseTypeFilter) {
      data = data.filter(
        (e) => normalizeExpenseType(e.expense_type) === expenseTypeFilter
      );
    }
    setFilteredExpenses(data);
    setCurrentPage(1);
  }, [baseFiltered, expenseTypeFilter]);

  const summaryByType = useMemo(() => {
    // initialize all buckets so order is stable
    const init = {};
    for (const t of EXPENSE_TYPES.map((t) => t.value)) {
      init[t] = { count: 0, amount: 0 };
    }
    for (const e of baseFiltered) {
      const key = normalizeExpenseType(e.expense_type);
      const amt = parseFloat(e.amount || 0) || 0;
      if (!init[key]) init[key] = { count: 0, amount: 0 };
      init[key].count += 1;
      init[key].amount += amt;
    }
    return init;
  }, [baseFiltered]);

  // Pagination
  const indexOfLastItem = currentPage * perPageData;
  const indexOfFirstItem = indexOfLastItem - perPageData;
  const currentExpenses = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem);

  // Footer total for the currently displayed (filtered) data
  const totalAmount = filteredExpenses.reduce((sum, expense) => {
    const val = parseFloat(expense.amount || 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Actions
  const handleExportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredExpenses);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, "expenses.xlsx");
  };

  const updateExpense = (id) => {
    navigate(`/expense/update/${id}/`);
  };

  // Document title
  document.title = "Beposoft | Expense Data";

  return (
    <React.Fragment>
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs title="Tables" breadcrumbItem="EXPENSE DATA" />

          {/* Filters */}
          <Row className="mb-3 g-2">
            <Col md={2}>
              <Input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>

            <Col md={2}>
              <Input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Col>

            <Col md={2}>
              <Input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Col>

            {/* Purpose filter (from API) */}
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

            {/* Type filter (also controlled by the summary buttons) */}
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
              <Button color="primary" onClick={handleExportToExcel}>
                Export to Excel
              </Button>
            </Col>
          </Row>

          {/* Cumulative summary (based on baseFiltered) */}
          <Row className="g-2 mb-3">
            <Col md="auto">
              <Button
                outline
                color={expenseTypeFilter ? "secondary" : "primary"}
                onClick={() => setExpenseTypeFilter("")}
                title="Show all types"
              >
                Show All
              </Button>
            </Col>

            {EXPENSE_TYPES.map((t) => {
              const s = summaryByType[t.value] || { count: 0, amount: 0 };
              return (
                <Col md="auto" key={t.value}>
                  <Button
                    color={expenseTypeFilter === t.value ? "primary" : "light"}
                    onClick={() => setExpenseTypeFilter(t.value)}
                    style={{ minWidth: 210, textAlign: "left" }}
                    title={`Filter by ${t.label}`}
                  >
                    <div style={{ fontWeight: 600 }}>{t.label}</div>
                    <div style={{ fontSize: 12 }}>
                      Count: {s.count} &nbsp;|&nbsp; ₹ {s.amount.toFixed(2)}
                    </div>
                  </Button>
                </Col>
              );
            })}
          </Row>

          {/* Total for current filtered set */}
          <Row className="mb-2">
            <Col md={12} className="d-flex justify-content-end">
              <strong>
                Total Expense: ₹{" "}
                <Button color="success">
                  <span style={{ color: "#fff", fontSize: "1rem" }}>
                    {totalAmount.toFixed(2)}
                  </span>
                </Button>
              </strong>
            </Col>
          </Row>

          {/* Table */}
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
                          {/* <th>Payed By</th> */}
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
                        {currentExpenses.map((expense, index) => (
                          <tr key={expense?.id}>
                            <th scope="row">{indexOfFirstItem + index + 1}</th>
                            <td style={{ color: "#007bff" }}>
                              {expense?.company?.name || "N/A"}
                            </td>
                            <td>{expense?.bank?.name || "N/A"}</td>
                            {/* <td style={{ color: '#28a745' }}>{expense?.payed_by?.name || 'N/A'}</td> */}
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
                              )}
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
                        ))}
                      </tbody>
                    </Table>

                    <Paginations
                      perPageData={perPageData}
                      data={filteredExpenses}
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                      isShowingPageLength={true}
                      paginationDiv="col-auto"
                      paginationClass="pagination pagination-rounded justify-content-center"
                      indexOfFirstItem={indexOfFirstItem}
                      indexOfLastItem={indexOfLastItem}
                    />
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
