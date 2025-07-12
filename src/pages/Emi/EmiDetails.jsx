import { React } from "react";
import axios from "axios";
import { useState, useEffect } from "react";
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
    Input,
    Label,
    FormGroup
} from "reactstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EmiDetails = () => {

    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editModal, setEditModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [editId, setEditId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    const fetchEmiDetails = async () => {

        try {
            const emiResponse = await axios.get(`${import.meta.env.VITE_APP_IMAGE}/apis/emi/`, {

                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            setDetails(emiResponse.data.data);
        }
        catch (error) {
            toast.error("Error fetching data:");
        }

    }

    const handleEditClick = async (id) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_IMAGE}/apis/loan/${id}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEditData(response.data.data);
            setEditId(id);
            setEditModal(true);
            console.log("Fetched Loan Data:", response.data);
        } catch (error) {
            toast.error("Failed to fetch loan details");
        }
    };

    const handleChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async () => {
        try {
            await axios.put(`${import.meta.env.VITE_APP_IMAGE}/apis/loan/${editId}/`, editData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("EMI Updated successfully!");
            setEditModal(false);
            fetchEmiDetails();
        } catch (error) {
            toast.error("Update failed");
        }
    };

    useEffect(() => {
        fetchEmiDetails();
    }, []);

    const ViewDetails = (id) => {
        navigate(`/emi-fulldetails/${id}/`);
    }

    return (
        <>
            <>
                <div className="page-content">
                    <div className="container-fluid">
                        <Row>
                            <Col xl={12}>
                                <Card>
                                    <CardBody>
                                        <CardTitle className="h4"></CardTitle>
                                        <div className="table-responsive">
                                            {loading ? <div>Loading...</div> : error ? <div className="text-danger">{error}</div> : (
                                                <>
                                                    <Table className="table mb-0">
                                                        <thead>
                                                            <tr>
                                                                <th>#</th>
                                                                <th>Emi Name</th>
                                                                <th>Principal Amount</th>
                                                                <th>Intrust Rate (annual)</th>
                                                                <th>Down Payment</th>
                                                                <th>Startdate</th>
                                                                <th>Enddate</th>
                                                                <th>Status</th>
                                                                <th>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {details.map((order, index) => (
                                                                <tr key={order.id}>
                                                                    <th scope="row">{index + 1}</th>
                                                                    <td>{order.emi_name}</td>
                                                                    <td>₹{order.principal}</td>
                                                                    <td>{order.annual_interest_rate} %  </td>
                                                                    <td>₹{order.down_payment}</td>
                                                                    <td>{order.startdate}</td>
                                                                    <td>{order.enddate}</td>
                                                                    <td><button onClick={() => ViewDetails(order.id)} style={{ padding: "5px 10px", border: "none", borderRadius: "5px", background: "#3258a8", color: "white" }}>View</button></td>
                                                                    <td>
                                                                        <button
                                                                            onClick={() => handleEditClick(order.id)}
                                                                            style={{
                                                                                padding: "5px 10px",
                                                                                border: "none",
                                                                                borderRadius: "5px",
                                                                                background: "#e3b911ff",
                                                                                color: "white"
                                                                            }}
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                    <Modal isOpen={editModal} toggle={() => setEditModal(!editModal)}>
                                                        <ModalHeader toggle={() => setEditModal(!editModal)}>
                                                            {editData?.emi_name ? `${editData.emi_name}` : 'Edit EMI'}
                                                        </ModalHeader>
                                                        <ModalBody>
                                                            {editData && (
                                                                <>
                                                                    <FormGroup>
                                                                        <Label for="emi_name">EMI Name</Label>
                                                                        <Input type="text" name="emi_name" value={editData.emi_name} onChange={handleChange} />
                                                                    </FormGroup>
                                                                    <FormGroup>
                                                                        <Label for="principal">Principal Amount</Label>
                                                                        <Input type="number" name="principal" value={editData.principal} onChange={handleChange} />
                                                                    </FormGroup>
                                                                    <FormGroup>
                                                                        <Label for="annual_interest_rate">Interest Rate (%)</Label>
                                                                        <Input type="number" name="annual_interest_rate" value={editData.annual_interest_rate} onChange={handleChange} />
                                                                    </FormGroup>
                                                                    <FormGroup>
                                                                        <Label for="down_payment">Down Payment</Label>
                                                                        <Input type="number" name="down_payment" value={editData.down_payment} onChange={handleChange} />
                                                                    </FormGroup>
                                                                    <FormGroup>
                                                                        <Label for="startdate">Start Date</Label>
                                                                        <Input
                                                                            type="date"
                                                                            name="startdate"
                                                                            value={editData.startdate || ""}
                                                                            onChange={handleChange}
                                                                        />
                                                                    </FormGroup>
                                                                    <FormGroup>
                                                                        <Label for="enddate">End Date</Label>
                                                                        <Input
                                                                            type="date"
                                                                            name="enddate"
                                                                            value={editData.enddate || ""}
                                                                            onChange={handleChange}
                                                                        />
                                                                    </FormGroup>
                                                                </>
                                                            )}
                                                        </ModalBody>
                                                        <ModalFooter>
                                                            <Button color="primary" onClick={handleUpdate}>Update</Button>
                                                            <Button color="secondary" onClick={() => setEditModal(false)}>Cancel</Button>
                                                        </ModalFooter>
                                                    </Modal>
                                                </>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                    <ToastContainer />
                </div>
            </>
        </>
    )
}


export default EmiDetails;