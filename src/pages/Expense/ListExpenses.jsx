import React, { useEffect, useState } from "react";
import { Table, Row, Col, Card, CardBody, CardTitle, Input, Button } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination"

const BasicTable = () => {
    const [expenses, setExpenses] = useState([]);
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [purposeOfPayment, setPurposeOfPayment] = useState([]);
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [perPageData] = useState(10);

    const token = localStorage.getItem('token');


    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const fetchPurposeOfPayment = await axios.get(`${import.meta.env.VITE_APP_IMAGE}/apis/add/purpose/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                })
                setPurposeOfPayment(fetchPurposeOfPayment.data);
            } catch (error) {
                toast.error("Error fetching purpose of payment:");
            }
            fetchPayments();
        }
    }, [token]);

    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_APP_KEY}expense/add/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch expenses');
                }

                const data = await response.json();
                setExpenses(data.data);
                setFilteredExpenses(data.data);
            } catch (error) {
                toast.error("Error fetching expense data:");
            }
        };

        fetchExpenses();
    }, [token]);

    useEffect(() => {
        let filteredData = expenses;

        if (searchTerm) {
            filteredData = filteredData.filter(expense =>
                expense.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                expense.payed_by?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                expense.purpose_of_pay?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (startDate) {
            filteredData = filteredData.filter(expense => new Date(expense.expense_date) >= new Date(startDate));
        }

        if (endDate) {
            filteredData = filteredData.filter(expense => new Date(expense.expense_date) <= new Date(endDate));
        }

        setFilteredExpenses(filteredData);
    }, [searchTerm, startDate, endDate, expenses]);

    const handleExportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredExpenses);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Expenses");
        XLSX.writeFile(wb, "expenses.xlsx");
    };

    const updateExpense = (id) => {
        navigate(`/expense/update/${id}/`);
    }

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentExpenses = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem);

    const totalAmount = filteredExpenses.reduce((sum, expense) => {
        return sum + parseFloat(expense.amount || 0);
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
                                    <Row className="mb-3">
                                        <Col md={3}>
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
                                        <Col md={2}>
                                            <Button color="primary" onClick={handleExportToExcel}>
                                                Export to Excel
                                            </Button>
                                        </Col>
                                        <Col md={3} className="d-flex align-items-center">
                                            <strong>Total Expense: ₹ <Button color="success"><span style={{ color: '#fff', fontSize: '1rem'}}>{totalAmount.toFixed(2)}</span></Button></strong>
                                        </Col>
                                    </Row>

                                    <div className="table-responsive">
                                        <Table className="table table-hover mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Company</th>
                                                    <th>Payed By</th>
                                                    <th>Amount</th>
                                                    <th>Expense Date</th>
                                                    <th>Purpose</th>
                                                    <th>Description</th>
                                                    <th>Added By</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentExpenses.map((expense, index) => (
                                                    <tr key={expense?.id}>
                                                        <th scope="row">{indexOfFirstItem + index + 1}</th>
                                                        <td style={{ color: '#007bff' }}>{expense?.company?.name || 'N/A'}</td>
                                                        <td style={{ color: '#28a745' }}>{expense?.payed_by?.name || 'N/A'}</td>
                                                        <td style={{ color: '#28a745' }}>₹{expense?.amount}</td>
                                                        <td>{expense.expense_date}</td>
                                                        <td style={{ color: '#ff6f61' }}>{expense?.purpose_of_pay?.toUpperCase()}</td>
                                                        <td>{expense?.description}</td>
                                                        <td style={{ fontWeight: 'bold' }}>{expense?.added_by}</td>
                                                        <td><button onClick={() => updateExpense(expense?.id)} style={{ padding: "10px 20px", border: "none", background: "#3258a8", color: "white" }}>Edit</button></td>
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
                </div>
            </div>
        </React.Fragment>
    );
};

export default BasicTable;
