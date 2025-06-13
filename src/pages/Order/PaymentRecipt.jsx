import React, { useEffect, useState } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Table, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Receipt from "./Reciept";


const ReceiptFormPage = () => {
    const { id } = useParams();
    const [packing, setPacking] = useState([]);
    const [paymentRecipts, setPaymentRecipts] = useState([]); // Store order items
    const [orderItems, setOrderItems] = useState([]); // Store order items
    const [totalAmount, setTotalAmount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // For handling form submission state
    const [modalOpen, setModalOpen] = useState(false);
    const [boxDetails, setBoxDetails] = useState({
        actual_weight: "",
        parcel_amount: "",
        postoffice_date: "",
    })
    const [selectedBoxId, setSelectedBoxId] = useState(null);
    const [isAddDisabled, setIsAddDisabled] = useState(false);




    useEffect(() => {
        const role = localStorage.getItem("active");
        if (role === "BDM" || role === "BDO" || role === "Warehouse Admin") {
            setIsAddDisabled(true);
        }
    }, []);

    // Toggle modal visibility
    const toggleModal = () => setIsOpen(!isOpen);

    const productModal = (id) => {
        setSelectedBoxId(id); // Set the ID
        setModalOpen(true); // Open the modal
    };


    const handleChange = (e) => {

        const { name, value } = e.target;
        setBoxDetails((prev) => ({
            ...prev, [name]: value
        }))
    }
    const handleFormSubmit = async (event) => {
        event.preventDefault();

        try {
            const token = localStorage.getItem("token");

            const formattedDate = boxDetails.postoffice_date
                ? new Date(boxDetails.postoffice_date).toISOString().split('T')[0]
                : '';

            const response = await axios.put(
                `${import.meta.env.VITE_APP_KEY}warehouse/detail/${selectedBoxId}/`,
                {
                    ...boxDetails,
                    postoffice_date: formattedDate,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            )

            if (response.status === 200 || response.status === 201) {
                alert("Warehouse details updated successfully!");
                setModalOpen(false); // Close modal after success
                setBoxDetails("");
            };
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Failed to update warehouse details.");
        }
    };

    useEffect(() => {
        if (!id) return; // Prevent API call if id is undefined
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch order items
            const orderItemsResponse = await axios.get(`${import.meta.env.VITE_APP_KEY}order/${id}/items/`, {
                headers,
            });


            // Update state with fetched data
            const { order } = orderItemsResponse.data;

            setPaymentRecipts(order.recived_payment || []);
            setTotalAmount(order.total_amount || 0);
            setPacking(order.warehouse || {});
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleSubmit = async (values, { resetForm }) => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            const formattedDate = values.received_at || getCurrentDate();

            const response = await axios.post(
                `${import.meta.env.VITE_APP_KEY}payment/${id}/reciept/`,
                { ...values, received_at: formattedDate, id },
                { headers }
            );

            if (response.status === 200 || response.status === 201) {
                alert("Receipt added successfully");

                // Reset form and close modal
                resetForm();
                toggleModal();
                await fetchData();
            } else {
                throw new Error("Unexpected response status");
            }
        } catch (error) {
            if (error.response) {
                console.error("Server responded with an error:", error.response);
                alert(`Failed to submit form: ${error.response.data.message || "Please try again later."}`);
            } else if (error.request) {
                console.error("Network error:", error.request);
                alert("Network error: Please check your internet connection and try again.");
            } else {
                console.error("Error:", error.message);
                alert("Failed to submit form. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    const calculateReceiptTotal = (receipts) => {
        return receipts.reduce((sum, receipt) => {
            return sum + Number(receipt.amount || 0); // Safely parse amount to a number
        }, 0);
    };



    return (
        <Card>
            <CardBody>
                <CardTitle className="mb-4 p-2 text-uppercase border-bottom border-primary">
                    <i className="bi bi-info-circle me-2"></i> INFORMATION
                </CardTitle>

                <Row>
                    {/* Invoice Payment Status */}
                    <Col md={4} className="d-flex flex-column p-3" style={{ borderRight: "1px solid black" }}>
                        <h5>INVOICE PAYMENT STATUS</h5>
                        {paymentRecipts && paymentRecipts.length > 0 ? (
                            <ul>
                                {paymentRecipts.map((receipt, index) => (
                                    <li key={index} style={{ fontWeight: "bold" }}>
                                        Receipt #{index + 1}: $
                                        {Number(receipt.amount || 0).toFixed(2)}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p style={{ color: "green", fontWeight: "bold" }}>
                                No receipt against Invoice
                            </p>
                        )}
                    </Col>

                    {/* Customer Ledger */}
                    <Col md={4} className="d-flex flex-column p-3" style={{ borderRight: "1px solid black" }}>
                        <h5>CUSTOMER LEDGER</h5>
                        <div
                            style={{
                                backgroundColor: "#f8f9fa",
                                padding: "10px",
                                borderRadius: "5px",
                                fontWeight: "bold",
                            }}
                        >
                            Ledger debited:{" "}
                            <span style={{ color: "#dc3545" }}>
                                ${Number(totalAmount - calculateReceiptTotal(paymentRecipts)).toFixed(2)}
                            </span>
                        </div>
                    </Col>

                    {/* Action Section */}
                    <Col md={4} className="d-flex flex-column p-3">
                        <h5>ACTION</h5>
                        <button
                            className="btn btn-primary btn-sm mt-2"
                            onClick={toggleModal}
                            aria-label="Add new action"
                            disabled={isAddDisabled}
                        >
                            Add
                        </button>
                    </Col>
                </Row>



                <Modal isOpen={isOpen} toggle={toggleModal} size="lg">
                    <ModalHeader toggle={toggleModal}>Receipt Against Invoice Generate</ModalHeader>
                    <ModalBody>
                        <Receipt handleSubmit={handleSubmit} isSubmitting={isSubmitting} toggleReciptModal={toggleModal} />
                    </ModalBody>
                </Modal>


                <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="sm" className="modal-dialog-centered">
                    <ModalHeader toggle={() => setModalOpen(false)}>
                        Edit Shipping Details for Box ID: {selectedBoxId}
                    </ModalHeader>
                    <ModalBody>
                        <form onSubmit={handleFormSubmit}>
                            {/* Shipping Charge */}
                            {/* <div className="mb-3">
                <label className="form-label">Shipping Charge</label>
                <input
                    type="number"
                    className="form-control"
                    onChange={handleChange}
                    name="shipping_charge"
                    placeholder="Enter shipping charge"
                />
            </div> */}

                            {/* Actual Weight */}
                            <div className="mb-3">
                                <label className="form-label">Actual Weight</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="actual_weight"
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Enter actual weight"
                                />
                            </div>

                            {/* Post Office Amount */}
                            <div className="mb-3">
                                <label className="form-label">Post Office Amount</label>
                                <input
                                    type="number"
                                    onChange={handleChange}
                                    name="parcel_amount"
                                    className="form-control"
                                    placeholder="Enter post office amount"
                                />
                            </div>

                            {/* Date Option */}
                            <div className="mb-3">
                                <label className="form-label">Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="postoffice_date"
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="text-center">
                                <button type="submit" className="btn btn-primary">Save</button>
                            </div>
                        </form>
                    </ModalBody>
                </Modal>



                <Row>
                    <Col xl={12}>
                        <Card>
                            <CardBody>
                                <CardTitle className="h4">RECEIPT DETAILS</CardTitle>
                                <div className="table-responsive">
                                    <Table className="table table-bordered mb-0">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>RECEIPT NO</th>
                                                <th>DATE</th>
                                                <th>BANK</th>
                                                <th>AMOUNT</th>
                                                <th>CREATED BY</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.isArray(paymentRecipts) && paymentRecipts.length > 0 ? (
                                                paymentRecipts.map((receiptItem, index) => (
                                                    <tr key={receiptItem.id || index}>
                                                        <th scope="row">{index + 1}</th>
                                                        <td>{receiptItem.payment_receipt || 'N/A'}</td>
                                                        <td>{receiptItem.received_at || 'N/A'}</td>
                                                        <td>{receiptItem.bank || 'N/A'}</td>
                                                        <td>{receiptItem.amount || 'N/A'}</td>
                                                        <td>{receiptItem.created_by || 'N/A'}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" style={{ textAlign: 'center', color: 'gray' }}>No receipts available</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </CardBody>

                            <Row>
                                <Col xl={6}>
                                    <Card>
                                        <CardBody>
                                            <h4 className="card-title">PACKING INFORMATION</h4>
                                            <div className="table-responsive">
                                                <Table className="table table-bordered border-primary mb-0">
                                                    <thead>
                                                        <tr >
                                                            <th>#</th>
                                                            <th>BOX</th>
                                                            <th>A.WT</th>
                                                            <th>V.WT</th>
                                                            <th>IMAGE</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Array.isArray(packing) && packing.length > 0 ? (
                                                            packing.map((packedItems, index) => (
                                                                <tr key={packedItems.id || index}>
                                                                    <th scope="row">{index + 1}</th>
                                                                    <td>{packedItems.box}</td>
                                                                    <td>{packedItems.height * packedItems.breadth * packedItems.length / 6000 || 'N/A'}</td>
                                                                    <td>{packedItems.weight}</td>
                                                                    <td>
                                                                        <img
                                                                            src={`${import.meta.env.VITE_APP_IMAGE}${packedItems.image}` || 'default-image.jpg'}
                                                                            alt={`Box ${packedItems.box}`}
                                                                            style={{ width: '25px', height: '25px', objectFit: 'cover' }}
                                                                        />
                                                                    </td>

                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="6" style={{ textAlign: 'center', color: 'gray' }}>No Packing available</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>

                                <Col xl={6}>
                                    <Card>
                                        <CardBody>
                                            <h4 className="card-title">TRACKING INFORMATION</h4>
                                            <div className="table-responsive">
                                                <Table className="table table-bordered border-success mb-0">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>BOX</th>
                                                            <th>PARCEL SERVICE</th>
                                                            <th>TRACKING ID</th>
                                                            <th>DELIVERY CHARGE</th>
                                                            <th>ParcelAmount</th>
                                                            <th>Edit</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Array.isArray(packing) && packing.length > 0 ? (
                                                            packing.map((packedItems, index) => (
                                                                <tr key={packedItems.id || index}>
                                                                    <th scope="row">{index + 1}</th>
                                                                    <td>{packedItems.box}</td>
                                                                    <td>{packedItems.parcel_service || 'N/A'}</td>
                                                                    <td>{packedItems.tracking_id || 'N/A'}</td>
                                                                    <td>{packedItems.shipping_charge || 'N/A'}</td>

                                                                    {/* Conditionally render the parcel amount field */}
                                                                    {packedItems.parcel_amount ? (
                                                                        <td>{packedItems.parcel_amount}</td>
                                                                    ) : (
                                                                        <td>N/A</td> // Show 'N/A' if there's no parcel_amount
                                                                    )}

                                                                    <th>
                                                                        <button onClick={() => productModal(packedItems.id)} className="btn btn-primary">Edit</button>
                                                                    </th>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="7" style={{ textAlign: 'center', color: 'gray' }}>No Packing available</td>
                                                            </tr>
                                                        )}
                                                    </tbody>

                                                </Table>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>
            </CardBody>
        </Card>
    );
};

export default ReceiptFormPage;
