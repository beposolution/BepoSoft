import React, { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import {
    Row, Col, Card, CardBody, Form, Label, Input, Button, Container, FormGroup, Modal, ModalBody, ModalFooter
} from "reactstrap";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FormRepeater = () => {
    document.title = "Form Repeater | Beposoft";

    const [formRows, setFormRows] = useState([
        {
            id: 1,
            box: "Box 1",
            packed_by: "",
            tracking_id: "",
            parcel_service: "",
        }
    ]);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false); // Toggle success modal
    const token = localStorage.getItem('token');
    const [staffs, setStaffs] = useState([]);
    const { id } = useParams();
    const [parcelServiceData, setParcelServiceData] = useState();
    const [userData, setUserData] = useState();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}profile/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const userId = response?.data?.data?.id;
                setUserData(userId);

                setFormRows((prevRows) =>
                    prevRows.map((row, index) =>
                        index === 0 ? { ...row, packed_by: userId } : row
                    )
                );
            } catch (error) {
                toast.error('Error fetching user data:', error);
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        const fetchParcelServiceData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}parcal/service/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setParcelServiceData(response?.data);

                const firstServiceId = response?.data?.data?.[0]?.id;
                if (firstServiceId) {
                    setFormRows((prevRows) =>
                        prevRows.map((row) => ({
                            ...row,
                            parcel_service: row.parcel_service || firstServiceId,
                        }))
                    );
                }
            } catch (error) {
                toast.error('Error fetching parcel service data');
            }
        };
        fetchParcelServiceData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setStaffs(response.data.data);
        } catch (error) {
            toast.error("Error fetching staffs:");
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const onAddFormRow = () => {
        const firstServiceId = parcelServiceData?.data?.[0]?.id || "";
        setFormRows([
            ...formRows,
            {
                id: formRows.length + 1,
                box: `Box ${formRows.length + 1}`,
                tracking_id: "",
                packed_by: userData,
                parcel_service: firstServiceId,
            },
        ]);
    };

    const onDeleteFormRow = (rowId) => {
        setFormRows(formRows.filter(row => row.id !== rowId));
    };

    const handleInputChange = (rowId, name, value) => {
        setFormRows(formRows.map(row => row.id === rowId ? { ...row, [name]: value } : row));
    };

    const handleFileChange = (rowId, file) => {
        setFormRows(formRows.map(row => row.id === rowId ? { ...row, image: file } : row));
    };

    // ✅ Handle form submission with success toggle
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formDataList = formRows.map((row) => {
                const formData = new FormData();
                formData.append("box", row.box);
                formData.append("order", id);
                formData.append("packed_by", row.packed_by);
                formData.append("tracking_id", row.tracking_id);
                formData.append("parcel_service", row.parcel_service);
                return formData;
            });

            const responsePromises = formDataList.map((formData) =>
                axios.post(`${import.meta.env.VITE_APP_KEY}warehouse/data/`, formData, {
                    headers: { "Content-Type": "multipart/form-data", "Authorization": `Bearer ${token}` },
                })
            );

            const responses = await Promise.all(responsePromises);

            let allSuccess = true;
            responses.forEach((response) => {
                if (response.data.status !== "success") {
                    allSuccess = false;
                    setErrorMessage(response.data.message || "Unknown error");
                }
            });

            if (allSuccess) {
                setSuccessMessage("All data successfully saved!");
                setShowSuccessModal(true); // ✅ Show success modal
                setFormRows([{ id: 1, box: "Box 1", tracking_id: "", packed_by: "" }]);
                setTimeout(() => {
                    window.location.reload();
                }, 1200); // 1.2 seconds delay so user sees the message/modal
            } else {
                setErrorMessage("Some rows failed to save. Please check the data.");
            }

            fetchData();
        } catch (error) {
            setErrorMessage("Error during form submission. Please try again.");
            setSuccessMessage("");
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Row>
                        <Col xs={12}>
                            <Card>
                                <CardBody>
                                    <h6 className="mb-4 card-title">PACKING INFORMATION</h6>
                                    <Form className="repeater" encType="multipart/form-data" onSubmit={handleSubmit}>
                                        {successMessage && <div className="alert alert-success">{successMessage}</div>}
                                        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

                                        <div>
                                            {formRows.map((formRow, key) => (
                                                <Row key={key}>
                                                    <Col sm={12} md={6} lg={3} className="mb-3">
                                                        <FormGroup>
                                                            <Label htmlFor="box">Box</Label>
                                                            <Input
                                                                type="text"
                                                                id="box"
                                                                value={formRow.box}
                                                                onChange={(e) => handleInputChange(formRow.id, 'box', e.target.value)}
                                                                className="form-control"
                                                                placeholder="Enter Box"
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                    <Col sm={12} md={6} lg={3} className="mb-3">
                                                        <FormGroup>
                                                            <Label htmlFor="box">Tracking ID</Label>
                                                            <Input
                                                                type="text"
                                                                id="tracking_id"
                                                                value={formRow.tracking_id}
                                                                onChange={(e) => handleInputChange(formRow.id, 'tracking_id', e.target.value)}
                                                                className="form-control"
                                                                placeholder="Enter Tracking ID"
                                                            />
                                                        </FormGroup>
                                                    </Col>

                                                    {/* <Col sm={12} md={6} lg={3} className="mb-3">
                                                        <FormGroup>
                                                            <Label htmlFor="weight">Weight (g)</Label>
                                                            <Input
                                                                type="number"
                                                                id="weight"
                                                                value={formRow.weight}
                                                                onChange={(e) => handleInputChange(formRow.id, 'weight', e.target.value)}
                                                                className="form-control"
                                                                placeholder="Enter Weight"
                                                            />
                                                        </FormGroup>
                                                    </Col> */}

                                                    {/* <Col sm={12} md={6} lg={3} className="mb-3">
                                                        <FormGroup>
                                                            <Label htmlFor="length">Length</Label>
                                                            <Input
                                                                type="number"
                                                                id="length"
                                                                value={formRow.length}
                                                                onChange={(e) => handleInputChange(formRow.id, 'length', e.target.value)}
                                                                className="form-control"
                                                                placeholder="Enter Length"
                                                            />
                                                        </FormGroup>
                                                    </Col> */}
                                                    {/* <Col sm={12} md={6} lg={3} className="mb-3">
                                                        <FormGroup>
                                                            <Label htmlFor="breadth">Breadth</Label>
                                                            <Input
                                                                type="number"
                                                                id="breadth"
                                                                value={formRow.breadth}
                                                                onChange={(e) => handleInputChange(formRow.id, 'breadth', e.target.value)}
                                                                className="form-control"
                                                                placeholder="Enter Breadth"
                                                            />
                                                        </FormGroup>
                                                    </Col> */}
                                                    {/* <Col sm={12} md={6} lg={3} className="mb-3">
                                                        <FormGroup>
                                                            <Label htmlFor="height">Height</Label>
                                                            <Input
                                                                type="number"
                                                                id="height"
                                                                value={formRow.height}
                                                                onChange={(e) => handleInputChange(formRow.id, 'height', e.target.value)}
                                                                className="form-control"
                                                                placeholder="Enter Height"
                                                            />
                                                        </FormGroup>
                                                    </Col> */}

                                                    {/* <Col sm={12} md={6} lg={3} className="mb-3">
                                                        <FormGroup>
                                                            <Label htmlFor="image_before">Image Before Packing</Label>
                                                            <Input
                                                                type="file"
                                                                id="image_before"
                                                                onChange={(e) => handleFileChange(formRow.id, e.target.files[0])}
                                                                className="form-control"
                                                            />
                                                        </FormGroup>
                                                    </Col> */}
                                                    {/* <Col sm={12} md={6} lg={3} className="mb-3">
                                                        <FormGroup>
                                                            <Label htmlFor="image">Image After Packing</Label>
                                                            <Input
                                                                type="file"
                                                                id="image"
                                                                onChange={(e) => handleFileChange(formRow.id, e.target.files[0])}
                                                                className="form-control"
                                                            />
                                                        </FormGroup>
                                                    </Col> */}

                                                    {/* <Col sm={12} md={6} lg={3} className="mb-3">
                                                        <FormGroup>
                                                            <Label htmlFor="packed_by">Packed By</Label>
                                                            <Input
                                                                type="select"
                                                                id="packed_by"
                                                                value={formRow.packed_by}
                                                                onChange={(e) => handleInputChange(formRow.id, 'packed_by', e.target.value)}
                                                                className="form-control"
                                                            >
                                                                <option value="">Select Packed By</option>
                                                                {staffs
                                                                    .filter(staff =>
                                                                        ["Accounts / Accounting", "ADMIN", "warehouse", "Warehouse Admin"].includes(staff.department_name)
                                                                    )
                                                                    .map((staff, index) => (
                                                                        <option key={index} value={staff.id}>
                                                                            {staff.name}
                                                                        </option>
                                                                    ))}
                                                            </Input>
                                                        </FormGroup>
                                                    </Col> */}

                                                    {/* <Col sm={12} md={6} lg={3} className="mb-3">
                                                        <FormGroup>
                                                            <Label htmlFor="packed_by">Status</Label>
                                                            <Input
                                                                type="select"
                                                                id="packed_by7"
                                                                value={formRow.status}
                                                                onChange={(e) => handleInputChange(formRow.id, 'status', e.target.value)}
                                                                className="form-control"
                                                            >
                                                                <option value="">select status</option>
                                                                <option value="Ready To Ship">Ready To Ship</option>
                                                                <option value="Packed">Packed</option>
                                                                <option value="Shipped">Shipped</option>


                                                            </Input>
                                                        </FormGroup>
                                                    </Col> */}

                                                    {/* <Col sm={12} md={6} lg={3} className="mb-3">
                                                        <FormGroup>
                                                            <Label htmlFor="date">Date</Label>
                                                            <Input
                                                                type="date"
                                                                id="date"
                                                                value={formRow.shipped_date || ''}
                                                                onChange={(e) => handleInputChange(formRow.id, 'shipped_date', e.target.value)}
                                                                className="form-control"
                                                            />
                                                        </FormGroup>
                                                    </Col> */}

                                                    <Col sm={6}>
                                                        <div className="d-flex justify-content-end mt-4">
                                                            <Button
                                                                color="danger"
                                                                onClick={() => onDeleteFormRow(formRow.id)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            ))}
                                        </div>

                                        <Row className="mt-3">
                                            <Col sm={6} className="d-flex justify-content-start mb-3">
                                                <Button
                                                    color="success"
                                                    className="mt-3 mt-lg-0"
                                                    onClick={onAddFormRow}
                                                >
                                                    Add Row
                                                </Button>
                                            </Col>
                                            <Col sm={6} className="d-flex justify-content-end">
                                                <Button
                                                    color="primary"
                                                    type="submit"
                                                    className="mt-3 mt-lg-0"
                                                >
                                                    Submit
                                                </Button>
                                            </Col>
                                        </Row>

                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default FormRepeater;
