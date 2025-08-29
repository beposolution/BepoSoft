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
];

const BasicTable = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [purposeOfPayment, setPurposeOfPayment] = useState([]);
  const [purposeFilter, setPurposeFilter] = useState(""); // purpose id (string) or "" for all
  const [expenseTypeFilter, setExpenseTypeFilter] = useState(""); // <-- NEW: expense type value or ""
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

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_APP_KEY}expense/add/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

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

  // Apply all filters (search, date, purpose, expense type)
  useEffect(() => {
    let filteredData = [...expenses];

    // Search across fields
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filteredData = filteredData.filter((expense) => {
        const company = expense.company?.name?.toLowerCase() || "";
        const payedBy = expense.payed_by?.name?.toLowerCase() || "";
        const purposeName = expense.purpose_of_pay?.toLowerCase() || "";
        const amount = (expense.amount ?? "").toString().toLowerCase();
        const type = expense.expense_type?.toLowerCase() || "";
        return (
          company.includes(q) ||
          payedBy.includes(q) ||
          purposeName.includes(q) ||
          amount.includes(q) ||
          type.includes(q)
        );
      });
    }

    // Date range
    if (startDate) {
      filteredData = filteredData.filter(
        (e) => new Date(e.expense_date) >= new Date(startDate)
      );
    }
    if (endDate) {
      filteredData = filteredData.filter(
        (e) => new Date(e.expense_date) <= new Date(endDate)
      );
    }

    // Purpose filter (by id or fallback to name)
    if (purposeFilter) {
      const selectedPurposeId = purposeFilter; // string
      const selectedPurposeName =
        purposeIdToName.get(selectedPurposeId)?.toLowerCase() || "";
      filteredData = filteredData.filter((e) => {
        const rowPurposeId =
          e.purpose_id != null ? String(e.purpose_id) : undefined;
        const rowPurposeName = (e.purpose_of_pay || "").toString().toLowerCase();
        if (rowPurposeId) return rowPurposeId === selectedPurposeId;
        return selectedPurposeName && rowPurposeName === selectedPurposeName;
      });
    }

    // NEW: Expense Type filter (compares canonical lowercase values)
    if (expenseTypeFilter) {
      filteredData = filteredData.filter(
        (e) => (e.expense_type || "").toString().toLowerCase() === expenseTypeFilter
      );
    }

    setFilteredExpenses(filteredData);
    setCurrentPage(1); // reset pagination when filters change
  }, [
    searchTerm,
    startDate,
    endDate,
    purposeFilter,
    expenseTypeFilter, // <-- depend on new filter
    expenses,
    purposeIdToName,
  ]);

  const handleExportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredExpenses);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, "expenses.xlsx");
  };

  const updateExpense = (id) => {
    navigate(`/expense/update/${id}/`);
  };

  const indexOfLastItem = currentPage * perPageData;
  const indexOfFirstItem = indexOfLastItem - perPageData;
  const currentExpenses = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem);

  const totalAmount = filteredExpenses.reduce((sum, expense) => {
    const val = parseFloat(expense.amount || 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  document.title = "Beposoft | Expense Data";

  return (
    <React.Fragment>
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs title="Tables" breadcrumbItem="EXPENSE DATA" />
          <Row>
            <Col xl={12}>
              <Card>
                <CardBody>
                  {/* Search and Filters */}
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

                    {/* NEW: Expense Type filter */}
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
                            <td style={{ color: "#28a745" }}>₹{expense?.amount}</td>
                            <td>{expense.expense_date}</td>
                            <td style={{ color: "#ff6f61" }}>
                              {(expense?.purpose_of_pay ||
                                purposeIdToName.get(String(expense?.purpose_id)) ||
                                "N/A"
                              ).toString().toUpperCase()}
                            </td>
                            <td>
                              {(expense?.expense_type || "N/A").toString().toUpperCase()}
                            </td>
                            <td>{expense?.description}</td>
                            <td style={{ fontWeight: "bold" }}>{expense?.added_by}</td>
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
