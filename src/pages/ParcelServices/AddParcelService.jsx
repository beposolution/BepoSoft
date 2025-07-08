import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Table, Button, Form, Label, Input } from "reactstrap";
import axios from 'axios';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pagination from "../../components/Common/Pagination"

const AddParcelService = () => {
    const [parcelServices, setParcelServices] = useState([]);
    const [name, setName] = useState("");
    const [label, setLabel] = useState("");
    const [editId, setEditId] = useState(null); // Track if we are editing

    const token = localStorage.getItem("token");

    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 5;

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentItems = parcelServices.slice(indexOfFirstItem, indexOfLastItem);

    const fetchParcelServices = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}parcal/service/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setParcelServices(response?.data?.data);
        } catch (error) {
            toast.error("Error fetching parcel services");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                // Update
                await axios.put(`${import.meta.env.VITE_APP_KEY}parcal/${editId}/service/`, {
                    name,
                    label,
                }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Parcel service updated successfully!");
            } else {
                // Create
                await axios.post(`${import.meta.env.VITE_APP_KEY}parcal/service/`, {
                    name,
                    label,
                }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Parcel service added successfully!");
            }

            setName("");
            setLabel("");
            setEditId(null);
            fetchParcelServices(); // Refresh list
        } catch (error) {
            toast.error("Failed to save parcel service");
        }
    };

    const handleEdit = (service) => {
        setName(service.name);
        setLabel(service.label);
        setEditId(service.id);
    };

    useEffect(() => {
        fetchParcelServices();
    }, []);

    return (
        <React.Fragment>
            <div className="page-content">
                <ToastContainer />
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="ADD PARCEL SERVICE" />

                    <Row>
                        <Col>
                            <Card>
                                <CardBody>
                                    <Form onSubmit={handleSubmit}>
                                        <Row>
                                            <Col md={6}>
                                                <Label for="name">Parcel Service Name</Label>
                                                <Input
                                                    id="name"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    required
                                                />
                                            </Col>
                                            <Col md={6}>
                                                <Label for="label">Label</Label>
                                                <Input
                                                    id="label"
                                                    value={label}
                                                    onChange={(e) => setLabel(e.target.value)}
                                                    required
                                                />
                                            </Col>
                                        </Row>
                                        <Button className="mt-2" color="primary" type="submit">
                                            {editId ? "Update Parcel Service" : "Add Parcel Service"}
                                        </Button>
                                        {editId && (
                                            <Button
                                                className="mt-2 ms-2"
                                                color="secondary"
                                                type="button"
                                                onClick={() => {
                                                    setEditId(null);
                                                    setName("");
                                                    setLabel("");
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <div className="table-responsive">
                                        <Table className="table mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Name</th>
                                                    <th>Label</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentItems.map((service, index) => (
                                                    <tr key={service.id}>
                                                        <td>{indexOfFirstItem + index + 1}</td>
                                                        <td>{service.name}</td>
                                                        <td>{service.label}</td>
                                                        <td>
                                                            <Button
                                                                color="warning"
                                                                size="sm"
                                                                onClick={() => handleEdit(service)}
                                                            >
                                                                Edit
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                        <Pagination
                                            perPageData={perPageData}
                                            data={parcelServices}
                                            currentPage={currentPage}
                                            setCurrentPage={setCurrentPage}
                                            isShowingPageLength={true}
                                            paginationDiv="col-auto"
                                            paginationClass="pagination-rounded"
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

export default AddParcelService;