import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Button,
    Input,
    FormGroup
} from "reactstrap";
import * as XLSX from "xlsx";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination";

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

const BasicTable = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [staffFilter, setStaffFilter] = useState("");
    const [familyFilter, setFamilyFilter] = useState("");
    const [allStaffs, setAllStaffs] = useState([]);
    const [allFamilies, setAllFamilies] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('active');
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 10;

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Fetch data using Axios
    useEffect(() => {

        // Fetch all staff data
        axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((response) => {
                setAllStaffs(response.data.data);
            })
            .catch((error) => {
                toast.error("There was an error fetching staff data!");
            });

        // Fetch all family data
        axios.get(`${import.meta.env.VITE_APP_KEY}familys/`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((response) => {
                setAllFamilies(response.data.data);
            })
            .catch((error) => {
                toast.error("There was an error fetching family data!");
            });


        const fetchData = () => {
            setLoading(true);
            axios.get(`${import.meta.env.VITE_APP_KEY}COD/sales/`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    staff: staffFilter,
                    family: familyFilter,
                }
            })
                .then((response) => {
                    setData(response.data);
                    setLoading(false);
                })
                .catch((error) => {
                    toast.error("There was an error fetching the data!");
                    setLoading(false);
                });
        };

        fetchData();
    }, [staffFilter, familyFilter]);


    const filteredData = data
        .map((item) => {
            const filteredOrders = item.orders.filter((order) => {
                const matchesStaff = staffFilter ? order.staff_name === staffFilter : true;
                const matchesFamily = familyFilter ? order.family_name === familyFilter : true;
                const matchesSearch = debouncedSearchTerm
                    ? order.staff_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    order.family_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
                    : true;
                const excludeBepocart = !(role === "CSO" && order.family_name === "bepocart");

                return matchesStaff && matchesFamily && matchesSearch && excludeBepocart;
            });

            return filteredOrders.length > 0
                ? { ...item, orders: filteredOrders }
                : null;
        })
        .filter(Boolean);

    const exportToExcel = () => {
        const data = filteredData.map((item, index) => {
            const totalAmount = item.orders.reduce((sum, order) => sum + order.total_amount, 0);
            const paidAmount = item.orders.reduce((sum, order) => sum + order.total_paid_amount, 0);
            const pendingAmount = item.orders.reduce((sum, order) => sum + order.balance_amount, 0);

            return {
                "No": index + 1,
                "Date": item.date,
                "Total Orders": item.orders.length,
                "Total Amount": totalAmount.toFixed(2),
                "Paid Amount": paidAmount.toFixed(2),
                "Pending Amount": pendingAmount.toFixed(2),
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "COD Sales Report");

        XLSX.writeFile(workbook, "COD_Sales_Report.xlsx");
    };

    const totalOrders = filteredData.reduce((sum, item) => sum + item.orders.length, 0);
    const totalAmount = filteredData.reduce(
        (sum, item) => sum + item.orders.reduce((acc, order) => acc + order.total_amount, 0),
        0
    );
    const totalPaid = filteredData.reduce(
        (sum, item) => sum + item.orders.reduce((acc, order) => acc + order.total_paid_amount, 0),
        0
    );
    const totalPending = filteredData.reduce(
        (sum, item) => sum + item.orders.reduce((acc, order) => acc + order.balance_amount, 0),
        0
    );

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="COD SALES REPORTS" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>

                                    {/* Search Fields */}
                                    <Row className="mb-4">
                                        <Col md={4}>
                                            <FormGroup>
                                                <label>Staff</label>
                                                <Input
                                                    type="select"
                                                    value={staffFilter}
                                                    onChange={(e) => setStaffFilter(e.target.value)}
                                                >
                                                    <option value="">Select Staff</option>
                                                    {allStaffs.map((staff) => (
                                                        <option key={staff.id} value={staff.name}>
                                                            {staff.name}
                                                        </option>
                                                    ))}
                                                </Input>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <label>Division</label>
                                                <Input
                                                    type="select"
                                                    value={familyFilter}
                                                    onChange={(e) => setFamilyFilter(e.target.value)}
                                                >
                                                    <option value="">Select Division</option>
                                                    {allFamilies.map((family) => (
                                                        <option key={family.id} value={family.name}>
                                                            {family.name}
                                                        </option>
                                                    ))}
                                                </Input>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <label>Search</label>
                                                <Input
                                                    type="text"
                                                    placeholder="Search by Staff or Family"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <Button color="success" onClick={exportToExcel}>
                                                Export to Excel
                                            </Button>
                                        </Col>
                                    </Row>

                                    {loading ? (
                                        <div>Loading...</div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table className="table table-hover mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>DATE</th>
                                                        <th>TOTAL ORDERS</th>
                                                        <th>TOTAL AMOUNT</th>
                                                        <th>PAID AMOUNT</th>
                                                        <th>PENDING AMOUNT</th>
                                                        <th>ACTION</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentData.map((item, index) => (
                                                        <tr key={index}>
                                                            <th scope="row">{indexOfFirstItem + index + 1}</th>
                                                            <td>{item.date}</td>
                                                            <td>{item.orders.length}</td>
                                                            <td>{item.orders.reduce((acc, order) => acc + order.total_amount, 0).toFixed(2)}</td>
                                                            <td>{item.orders.reduce((acc, order) => acc + order.total_paid_amount, 0).toFixed(2)}</td>
                                                            <td>{item.orders.reduce((acc, order) => acc + order.balance_amount, 0).toFixed(2)}</td>
                                                            <td>
                                                                <a href={`/COD/sales/resport/${item.date}/`} style={{ color: "#007bff", textDecoration: "none", fontWeight: "bold" }}>View</a>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                                                        <td colSpan="2" className="text-end">Grand Total</td>
                                                        <td>{totalOrders}</td>
                                                        <td>{totalAmount.toFixed(2)}</td>
                                                        <td>{totalPaid.toFixed(2)}</td>
                                                        <td>{totalPending.toFixed(2)}</td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </Table>
                                            <Paginations
                                                perPageData={perPageData}
                                                data={filteredData}
                                                currentPage={currentPage}
                                                setCurrentPage={setCurrentPage}
                                                isShowingPageLength={true}
                                                paginationDiv="col-auto"
                                                paginationClass="pagination"
                                                indexOfFirstItem={indexOfFirstItem}
                                                indexOfLastItem={indexOfLastItem}
                                            />
                                        </div>
                                    )}
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
