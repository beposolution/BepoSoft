import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input
} from "reactstrap";

// Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";

const BasicTable = () => {
    // State for data
    const [data, setData] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupervisor, setSelectedSupervisor] = useState(null);
    const [supervisorName, setSupervisorName] = useState("");
    const [supervisorDepartment, setSupervisorDepartment] = useState("");

    // Meta title
    document.title = "Basic Tables | Skote - Vite React Admin & Dashboard Template";
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}supervisors/`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.status === 200) {
                    setData(response.data.data);
                } else {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
            } catch (error) {
                setError(error.message || "Failed to fetch data");
            } finally {
                setLoading(false);
            }
        };

        const fetchDepartments = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}departments/`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.status === 200) {
                    setDepartments(response.data.data); // Set the department data
                } else {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
            } catch (error) {
                setError(error.message || "Failed to fetch departments");
            }
        };

        fetchData();
        fetchDepartments();
    }, []); // Empty dependency array to run only on mount

    const handleEditClick = (supervisor) => {
        setSelectedSupervisor(supervisor);
        setSupervisorName(supervisor.name);
        setSupervisorDepartment(supervisor.department || '');
        setIsModalOpen(true);
    };

    const handleSaveChanges = async () => {
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_APP_KEY}supervisor/update/${selectedSupervisor.id}/`,
                {
                    name: supervisorName,
                    department: supervisorDepartment,
                },
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            );
            if (response.status === 200) {
                // Re-fetch data after saving changes
                const updatedResponse = await axios.get(`${import.meta.env.VITE_APP_KEY}supervisors/`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (updatedResponse.status === 200) {
                    setData(updatedResponse.data.data); // Update state with the latest data
                } else {
                    throw new Error(`HTTP error! Status: ${updatedResponse.status}`);
                }
                setIsModalOpen(false); // Close modal
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        } catch (error) {
            setError(error.message || "Failed to update supervisor");
        }
    };
    

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="Basic Tables" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4">SUPERVISORS</CardTitle>
                                    <div className="table-responsive">
                                        <Table className="table table-bordered mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>NAME</th>
                                                    <th>DEPARTMENT</th>
                                                    <th>ACTION</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((supervisor, index) => (
                                                    <tr key={supervisor.id}>
                                                        <th scope="row">{index + 1}</th>
                                                        <td>{supervisor.name}</td>
                                                        <td>{supervisor.department || 'N/A'}</td>
                                                        <td>
                                                            <Button
                                                                color="primary"
                                                                onClick={() => handleEditClick(supervisor)}
                                                            >
                                                                Edit
                                                            </Button>
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

                    {/* Modal for editing supervisor */}
                    <Modal isOpen={isModalOpen} toggle={() => setIsModalOpen(!isModalOpen)}>
                        <ModalHeader toggle={() => setIsModalOpen(!isModalOpen)}>Edit Supervisor</ModalHeader>
                        <ModalBody>
                            <div>
                                <label>Name</label>
                                <Input
                                    type="text"
                                    value={supervisorName}
                                    onChange={(e) => setSupervisorName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label>Department</label>
                                <Input
                                    type="select"
                                    value={supervisorDepartment}
                                    onChange={(e) => setSupervisorDepartment(e.target.value)}
                                >
                                    <option value="">Select Department</option>
                                    {departments.map((department) => (
                                        <option key={department.id} value={department.id}>
                                            {department.name}
                                        </option>
                                    ))}
                                </Input>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="secondary" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button color="primary" onClick={handleSaveChanges}>
                                Save Changes
                            </Button>
                        </ModalFooter>
                    </Modal>
                </div>
            </div>
        </React.Fragment>
    );
};

export default BasicTable;
