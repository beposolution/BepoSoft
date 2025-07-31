import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Form,
    Input,
    Label,
    FormFeedback,
    Table
} from 'reactstrap';
import Breadcrumbs from "../../components/Common/Breadcrumb";
import Paginations from '../../components/Common/Pagination';

const CountryCode = () => {
    const [countryCodes, setCountryCodes] = useState([]);
    const token = localStorage.getItem("token");
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 10;

    const fetchCountryCodes = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}country/codes/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.data.status === 'success') {
                setCountryCodes(response.data.data);
            } else {
                toast.error("Failed to fetch country codes.");
            }
        } catch (error) {
            toast.error("Error fetching country codes.");
        }
    };

    useEffect(() => {
        fetchCountryCodes();
    }, [token]);

    const formik = useFormik({
        initialValues: {
            // country_name: '',
            country_code: '',
        },
        validationSchema: Yup.object({
            // country_name: Yup.string().required('Country name is required'),
            country_code: Yup.string().required('Country code is required'),
        }),
        onSubmit: async (values, { resetForm }) => {
            try {
                const url = isEditMode
                    ? `${import.meta.env.VITE_APP_KEY}country/codes/${editId}/`
                    : `${import.meta.env.VITE_APP_KEY}country/codes/`;

                const method = isEditMode ? axios.put : axios.post;

                const response = await method(
                    url,
                    values,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.data.status === 'success') {
                    toast.success(`Country code ${isEditMode ? 'updated' : 'added'} successfully!`);
                    resetForm();
                    fetchCountryCodes();
                    setIsEditMode(false);
                    setEditId(null);
                } else {
                    toast.error(`Failed to ${isEditMode ? 'update' : 'add'} country code.`);
                }
            } catch (error) {
                toast.error(`Error ${isEditMode ? 'updating' : 'adding'} country code.`);
            }
        },
    });

    const filteredCodes = countryCodes.filter(item =>
        item.country_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentData = filteredCodes.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="COUNTRY CODES" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">
                                        {isEditMode ? "Update Country Code" : "Add New Country Code"}
                                    </CardTitle>
                                    <Form onSubmit={formik.handleSubmit}>
                                        <Row>
                                            {/* <Col md={4}>
                                                <Label>Country Name</Label>
                                                <Input
                                                    type="text"
                                                    name="country_name"
                                                    value={formik.values.country_name}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    invalid={formik.touched.country_name && !!formik.errors.country_name}
                                                />
                                                <FormFeedback>{formik.errors.country_name}</FormFeedback>
                                            </Col> */}

                                            <Col md={4}>
                                                <Label>Country Code</Label>
                                                <Input
                                                    type="text"
                                                    name="country_code"
                                                    value={formik.values.country_code}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    invalid={formik.touched.country_code && !!formik.errors.country_code}
                                                />
                                                <FormFeedback>{formik.errors.country_code}</FormFeedback>
                                            </Col>

                                            <Col md={4} className="d-flex align-items-end">
                                                <button type="submit" className="btn btn-primary">
                                                    {isEditMode ? 'Update Country Code' : 'Add Country Code'}
                                                </button>
                                                {isEditMode && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary ms-2"
                                                        onClick={() => {
                                                            formik.resetForm();
                                                            setIsEditMode(false);
                                                            setEditId(null);
                                                        }}
                                                    >
                                                        Cancel Edit
                                                    </button>
                                                )}
                                            </Col>
                                        </Row>
                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Country Code List Table */}
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">Country Code List</CardTitle>
                                    <Row className="mb-3">
                                        <Col md={4}>
                                            <Input
                                                type="text"
                                                placeholder="Search by Country Code"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </Col>
                                    </Row>
                                    <Table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                {/* <th>Country Name</th> */}
                                                <th>Country Code</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCodes.length === 0 ? (
                                                <tr>
                                                    <td colSpan="3" className="text-center">No data found</td>
                                                </tr>
                                            ) : (
                                                currentData.map((item, index) => (
                                                    <tr key={item.id}>
                                                        <td>{index + 1}</td>
                                                        {/* <td>{item.country_name}</td> */}
                                                        <td>{item.country_code}</td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-primary"
                                                                onClick={() => {
                                                                    formik.setValues({ country_code: item.country_code });
                                                                    setEditId(item.id);
                                                                    setIsEditMode(true);
                                                                }}
                                                            >
                                                                Edit
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </Table>
                                    <Paginations
                                        perPageData={perPageData}
                                        data={filteredCodes}
                                        currentPage={currentPage}
                                        setCurrentPage={setCurrentPage}
                                        isShowingPageLength={true}
                                        paginationDiv="col-auto"
                                        paginationClass="pagination pagination-rounded"
                                        indexOfFirstItem={indexOfFirstItem}
                                        indexOfLastItem={indexOfLastItem}
                                    />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                    <ToastContainer />
                </div>
            </div>
        </React.Fragment>
    );
};

export default CountryCode;
