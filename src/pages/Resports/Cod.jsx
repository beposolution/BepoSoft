import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Input,
    FormGroup
} from "reactstrap";

// Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";

// Debounce hook for search input
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


    const debouncedSearchTerm = useDebounce(searchTerm, 500); 

    // Fetch data using Axios
    useEffect(() => {
        const token = localStorage.getItem('token');  

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
                console.error("There was an error fetching staff data!", error);
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
                console.error("There was an error fetching family data!", error);
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
                    console.error("There was an error fetching the data!", error);
                    setLoading(false);
                });
        };

        fetchData(); 
    }, [staffFilter, familyFilter]); 


    const filteredData = data.filter((item) => {
        return (
            (staffFilter ? item.orders.some((order) => order.staff_name === staffFilter) : true) &&
            (familyFilter ? item.orders.some((order) => order.family_name === familyFilter) : true) &&
            (debouncedSearchTerm ? item.orders.some((order) =>
                order.staff_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                order.family_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            ) : true)
        );
    });

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="Basic Tables" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4 text-center">CREDIT SALES REPORT</CardTitle>

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
                                                <label>Family</label>
                                                <Input
                                                    type="select"
                                                    value={familyFilter}
                                                    onChange={(e) => setFamilyFilter(e.target.value)}
                                                >
                                                    <option value="">Select Family</option>
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
                                                    {filteredData.map((item, index) => (
                                                        <tr key={index}>
                                                            <th scope="row">{index + 1}</th>
                                                            <td>{item.date}</td>
                                                            <td>{item.orders.length}</td> 
                                                            <td>{item.orders.reduce((acc, order) => acc + order.total_amount, 0)}</td> {/* Total amount for the entire date */}
                                                            <td>
                                                                {item.orders.reduce((acc, order) => acc + order.total_paid_amount, 0)}
                                                            </td> 
                                                            <td>
                                                                {item.orders.reduce((acc, order) => acc + order.balance_amount, 0)}
                                                            </td> 
                                                            <td>
                                                                <a href={`/COD/sales/resport/${item.date}/`} style={{ color: "#007bff", textDecoration: "none", fontWeight: "bold" }}>View</a>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
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
