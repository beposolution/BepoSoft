import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Row, Col, FormGroup, Label, Input, Button } from 'reactstrap';
import { FaUniversity, FaIdBadge, FaUserPlus } from 'react-icons/fa';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const validationSchema = Yup.object({
    received_at: Yup.date().required('Date is required'),
    amount: Yup.number().required('Amount is required').positive('Amount must be positive'),
    bank: Yup.string().required('Bank is required'),
    transactionID: Yup.string().required('Transaction ID is required'),
    createdBy: Yup.string().required('Creator name is required'),
    remark: Yup.string().max(500, 'Remark should be 500 characters or less')
});

const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ReceiptFormPage = ({ toggleReciptModal }) => {
    const { id } = useParams();
    const navigate = useNavigate();  // Hook to navigate
    const [creatorName, setCreatorName] = useState('');
    const [banks, setBanks] = useState([]);
    const [orderItems, setOrderItems] = useState([]); // Store order items
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const creatorName = localStorage.getItem('name') || '';
        setCreatorName(creatorName);

        // Fetch banks and order items
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const bankResponse = await axios.get(`${import.meta.env.VITE_APP_KEY}banks/`, { headers });
                setBanks(bankResponse.data.data);

                const orderItemsResponse = await axios.get(`${import.meta.env.VITE_APP_KEY}order/${id}/items/`, { headers });
                setOrderItems(orderItemsResponse.data.items);  // Fetch order items here
            } catch (error) {
                console.error('Error fetching data', error);
            }
        };

        fetchData();
    }, [id]);

    const handleSubmit = async (values, { resetForm }) => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const formattedDate = values.received_at || getCurrentDate();
            const selectedBank = banks.find(bank => bank.id === values.bank);
            localStorage.setItem('selectedBank', selectedBank ? selectedBank.name : '');

            // Optionally, modify orderItems here if needed
            const updatedOrderItems = orderItems.map(item => ({
                ...item,
                status: 'processed', // Example: mark items as processed after receipt is submitted
            }));

            // Submit the receipt data along with order items
            const response = await axios.post(
                `${import.meta.env.VITE_APP_KEY}payment/${id}/reciept/`,
                { ...values, received_at: formattedDate, id, orderItems: updatedOrderItems },
                { headers }
            );

            if (response.status === 200 || response.status === 201) {
                alert('Receipt and order items updated successfully');
                resetForm();
                toggleReciptModal();  // Close the modal on success

                // Navigate to another page (e.g., order details page)
                // navigate(`/order/${id}/details`, {
                //     state: {
                //         updatedOrderItems,  // Pass the updated order items as state
                //         receiptDetails: response.data // Pass the receipt details if needed
                //     }
                // });
            } else {
                throw new Error('Unexpected response status');
            }
        } catch (error) {
            if (error.response) {
                console.error('Server responded with an error:', error.response);
                alert(`Failed to submit form: ${error.response.data.message || 'Please try again later.'}`);
            } else if (error.request) {
                console.error('Network error:', error.request);
                alert('Network error: Please check your internet connection and try again.');
            } else {
                console.error('Error:', error.message);
                alert('Failed to submit form. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Formik
                initialValues={{
                    received_at: getCurrentDate(),
                    amount: '',
                    bank: '',
                    transactionID: '',
                    createdBy: creatorName || '',
                    remark: ''
                }}
                enableReinitialize
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <FormGroup>
                                    <Label className="font-weight-bold">Received Date</Label>
                                    <Input
                                        type="date"
                                        name="received_at"
                                        value={values.received_at}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`border-primary ${errors.received_at && touched.received_at ? 'is-invalid' : ''}`}
                                    />
                                    {errors.received_at && touched.received_at && (
                                        <div className="invalid-feedback">{errors.received_at}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label className="font-weight-bold">Amount</Label>
                                    <Input
                                        type="number"
                                        name="amount"
                                        value={values.amount}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`border-success ${errors.amount && touched.amount ? 'is-invalid' : ''}`}
                                        placeholder="Enter amount"
                                    />
                                    {errors.amount && touched.amount && (
                                        <div className="invalid-feedback">{errors.amount}</div>
                                    )}
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label className="font-weight-bold">Bank</Label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light"><FaUniversity /></span>
                                        <Input
                                            type="select"
                                            name="bank"
                                            value={values.bank}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={errors.bank && touched.bank ? 'is-invalid' : ''}
                                        >
                                            <option value="">Select bank</option>
                                            {banks.map(bank => (
                                                <option key={bank.id} value={bank.id}>{bank.name}</option>
                                            ))}
                                        </Input>
                                        {errors.bank && touched.bank && (
                                            <div className="invalid-feedback">{errors.bank}</div>
                                        )}
                                    </div>
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label className="font-weight-bold">Transaction ID</Label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light"><FaIdBadge /></span>
                                        <Input
                                            type="text"
                                            name="transactionID"
                                            value={values.transactionID}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`border-warning shadow-sm ${errors.transactionID && touched.transactionID ? 'is-invalid' : ''}`}
                                            placeholder="Enter transaction ID"
                                        />
                                        {errors.transactionID && touched.transactionID && (
                                            <div className="invalid-feedback">{errors.transactionID}</div>
                                        )}
                                    </div>
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label className="font-weight-bold">Created By</Label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light"><FaUserPlus /></span>
                                        <Input
                                            type="text"
                                            name="createdBy"
                                            value={values.createdBy}
                                            readOnly
                                            className="border-info shadow-sm"
                                            placeholder="Creator's name"
                                        />
                                    </div>
                                </FormGroup>
                            </Col>

                            <Col md={12}>
                                <FormGroup>
                                    <Label className="font-weight-bold">Remark</Label>
                                    <Input
                                        type="textarea"
                                        name="remark"
                                        value={values.remark}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`border-secondary ${errors.remark && touched.remark ? 'is-invalid' : ''}`}
                                        placeholder="Enter any additional remarks here"
                                    />
                                    {errors.remark && touched.remark && (
                                        <div className="invalid-feedback">{errors.remark}</div>
                                    )}
                                </FormGroup>
                            </Col>
                        </Row>
                        <div className="modal-footer d-flex justify-content-end" style={{ padding: "1.5rem" }}>
                            <Button color="success" type="submit" className="px-4" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save'}
                            </Button>
                            <Button color="danger" onClick={toggleReciptModal} className="ml-2 px-4">Cancel</Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default ReceiptFormPage;
