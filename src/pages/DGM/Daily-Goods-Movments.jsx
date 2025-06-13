import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Row, Col, Card, CardBody, CardTitle, Input, Button } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { useNavigate } from "react-router-dom";

const BasicTable = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const token = localStorage.getItem('token');

    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_APP_KEY}warehouse/box/detail/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                setData(response.data);
                setFilteredData(response.data); // Initially, show all data
            })
            .catch(error => {
                console.error("There was an error fetching the data!", error);
            });
    }, []);

    const handleFilter = () => {
        // Filter data based on start date and end date
        const filtered = data.filter(item => {
            const shippedDate = new Date(item.shipped_date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (start && shippedDate < start) return false;
            if (end && shippedDate > end) return false;

            return true;
        });

        setFilteredData(filtered);
    };


const handleClick = (date) => {
    navigate(`/Movement/${date}`);
}


    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="DAILY GOODS MOVEMENT" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>

                                    {/* Date Filter Section */}
                                    <Row className="mb-3">
                                        <Col sm={4}>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                placeholder="Start Date"
                                            />
                                        </Col>
                                        <Col sm={4}>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                placeholder="End Date"
                                            />
                                        </Col>
                                        <Col sm={4}>
                                            <Button color="primary" onClick={handleFilter}>
                                                Apply Filters
                                            </Button>
                                        </Col>
                                    </Row>

                                    {/* Table Section */}
                                    <div className="table-responsive">
                                        <Table className="table table-bordered table-sm m-0 text-center">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Date</th>
                                                    <th>Total Boxes Delivered</th>
                                                    <th>Total Volume Wt. (In Kg.)</th>
                                                    <th>Total Actual Wt.</th>
                                                    <th>Total Delivery Charge</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredData.map((item, index) => (
                                                    <tr key={index}>
                                                        <th scope="row">{index + 1}</th>
                                                        <td>{item.shipped_date}</td>
                                                        <td>{item.total_boxes}</td>
                                                        <td>{item.total_weight}</td>
                                                        <td>{item.total_volume_weight}</td>
                                                        <td>{item.total_shipping_charge}</td>
                                                        <td>
                                                            <button  onClick={() =>handleClick(item.shipped_date)} style={{border:"none", background:"blue", color:"white"}}>View</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
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
