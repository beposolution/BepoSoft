import React, { useEffect, useState } from "react";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Label,
    FormGroup,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axios from "axios";

const BasicTable = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token")

    const [editModal, setEditModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);

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
                toast.error("Error fetching companies data:");
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
    }, []);

    const handleEdit = async (id) => {
        try {
            setSelectedId(id);

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}company/data/edit/${id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setFormData(response.data.data);
            setEditModal(true);
        } catch (error) {
            toast.error("Error fetching company details");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleUpdate = async () => {
        try {
            setSaving(true);

            const response = await axios.put(
                `${import.meta.env.VITE_APP_KEY}company/data/edit/${selectedId}/`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast.success("Company updated successfully");

            setCompanies((prev) =>
                prev.map((company) =>
                    company.id === selectedId ? response.data.data : company
                )
            );

            setEditModal(false);
        } catch (error) {
            toast.error("Error updating company");
        } finally {
            setSaving(false);
        }
    };

    // Meta title
    document.title = "BEPOSOFT | Company Details";

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
            <Modal isOpen={editModal} toggle={() => setEditModal(false)} size="lg">
                <ModalHeader toggle={() => setEditModal(false)}>
                    Edit Company Details
                </ModalHeader>

                <ModalBody>
                    {[
                        "name",
                        "gst",
                        "address",
                        "zip",
                        "city",
                        "country",
                        "phone",
                        "email",
                        "web_site",
                        "prefix",
                    ].map((field) => (
                        <FormGroup key={field}>
                            <Label>{field.toUpperCase()}</Label>
                            <Input
                                type={field === "email" ? "email" : "text"}
                                name={field}
                                value={formData[field] || ""}
                                onChange={handleChange}
                            />
                        </FormGroup>
                    ))}
                </ModalBody>

                <ModalFooter>
                    <Button color="secondary" onClick={() => setEditModal(false)}>
                        Cancel
                    </Button>

                    <Button color="primary" onClick={handleUpdate} disabled={saving}>
                        {saving ? "Updating..." : "Update"}
                    </Button>
                </ModalFooter>
            </Modal>
            <ToastContainer />
        </React.Fragment>
    );
};

export default BasicTable;
