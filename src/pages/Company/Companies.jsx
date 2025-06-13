import React, { useEffect, useState } from "react";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
} from "reactstrap";

// Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axios from "axios";

const BasicTable = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token")

    useEffect(() => {
        // Fetch companies data from an API
        const fetchCompanies = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}company/data/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setCompanies(response.data.data);
            } catch (error) {
                console.error("Error fetching companies data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
    }, []);

    // Meta title
    document.title = "Basic Tables | Skote - Vite React Admin & Dashboard Template";

    return (
        <React.Fragment>
            <div className="page-content">
                <Breadcrumbs title="Tables" breadcrumbItem="COMPANY DETAILS" />
                <Row>
                    <Col xl={12}>
                        <Card>
                            <CardBody>
                                <h4 className="card-title">COMPANY DETAILS</h4>
                                <div className="table-responsive">
                                    <Table className="table table-bordered border-primary mb-0">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>NAME</th>
                                                <th>GST</th>
                                                <th>PHONE</th>
                                                <th>EMAIL</th>
                                                <th>URL</th>
                                                <th>ACTION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan="7" className="text-center">
                                                        Loading...
                                                    </td>
                                                </tr>
                                            ) : companies.length > 0 ? (
                                                companies.map((company, index) => (
                                                    <tr key={company.id || index}>
                                                        <th scope="row">{index + 1}</th>
                                                        <td>{company.name}</td>
                                                        <td>{company.gst}</td>
                                                        <td>{company.phone}</td>
                                                        <td>{company.email}</td>
                                                        <td>{company.web_site}</td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-primary"
                                                                onClick={() => handleEdit(company.id)}
                                                            >
                                                                Edit
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="text-center">
                                                        No data available.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>

                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </React.Fragment>
    );
};

export default BasicTable;
