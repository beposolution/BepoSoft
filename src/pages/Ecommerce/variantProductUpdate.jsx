import React, { useEffect, useState } from "react";
import {
    Card,
    Col,
    Container,
    Row,
    CardBody,
    CardTitle,
    Label,
    Form,
    Input,
    FormFeedback
} from "reactstrap";
import * as Yup from 'yup';
import axios from "axios";
import { useFormik } from "formik";
import { useParams } from "react-router-dom";

//Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";

const FormLayouts = () => {

    //meta title
    document.title = "Form Layouts | Skote - Vite React Admin & Dashboard Template";
    const { id } = useParams();
    const token = localStorage.getItem('token');
    const created_user = localStorage.getItem('name');
    const [familys, setFamily] = useState([]);

    const UNIT_TYPES = [
        { value: 'NOS', label: 'NOS' },
        { value: 'PRS', label: 'PRS' },
        { value: 'BOX', label: 'BOX' },
        { value: 'SET', label: 'SET' },
        { value: 'SET OF 12', label: 'SET OF 12' },
        { value: 'SET OF 16', label: 'SET OF 16' },
        { value: 'SET OF 6', label: 'SET OF 6' },
        { value: 'SET OF 8', label: 'SET OF 8' },
    ];
    const types = [
        { value: 'single', label: 'Single' },
        { value: 'variant', label: 'Variant' },
    ];


    const formik = useFormik({
        initialValues: {
            name: "",
            hsn_code: "",
            family: [],
            type: "",
            unit: "",
            tax: "",
            purchase_rate: "",
            selling_price: "",
            stock: "",
            color: "",
            size: "",
            groupID: "",
            check: ""
        },
        validationSchema: Yup.object({
            name: Yup.string().required("This field is required"),
            hsn_code: Yup.string().required("This field is required"),
            family: Yup.array().min(1, "At least one value is required").required("This field is required"),
            type: Yup.string().required("This field is required"),
            unit: Yup.string().required("This field is required"),
            purchase_rate: Yup.string().required("This field is required"),
            tax: Yup.string().required("This field is required"),
            selling_price: Yup.string().required("This field is required"),
            stock: Yup.string().required("This field is required"),
            color: Yup.string().required("This field is required"),
            groupID: Yup.string().required("This field is required"),
            check: Yup.string().required("This field is required"),
        }),

        

        onSubmit: async (values) => {
            console.log("Calling API with values:", values);
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_APP_KEY}product/update/${id}/`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(values), // Convert the form data to JSON
                    }
                );
        
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
        
                const responseData = await response.json(); 
        
                if (response.status === 200) {
                    alert("Product updated successfully!");
                } else {
                    alert("Failed to update product.");
                }
            } catch (error) {
                console.error("Error updating product:", error);
                alert("An error occurred while updating the product.");
            }
        }         
    });


    const [productData, setProductData] = useState(null); // State to store product data

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_APP_KEY}product/update/${id}/`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const fetchedProductData = data.data;

                setProductData(fetchedProductData); // Store the fetched product data

                // Set initial form values
                formik.setValues({
                    name: fetchedProductData.name || "",
                    hsn_code: fetchedProductData.hsn_code || "",
                    family: fetchedProductData.family || [],
                    type: fetchedProductData.type || "",
                    unit: fetchedProductData.unit || "",
                    tax: fetchedProductData.tax || "",
                    purchase_rate: fetchedProductData.purchase_rate || "",
                    selling_price: fetchedProductData.selling_price || "",
                    stock: fetchedProductData.stock || "",
                    color: fetchedProductData.color || "",
                    size: fetchedProductData.size || "",
                    groupID: fetchedProductData.groupID || "",
                    check: fetchedProductData.check || "",
                });
            } catch (error) {
                console.error("Error fetching product data:", error);
            }
        };

        fetchProductData();
    }, [id, token]);

    useEffect(() => {
        const fetchFamilyData = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}familys/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const familyData = response.data.data; // Assuming this contains the list of families with id and name
                setFamily(familyData);

                // Pre-select family values if product data is already fetched
                if (productData?.family) {
                    formik.setFieldValue(
                        'family',
                        productData.family.map(familyId =>
                            familyData.find(family => family.id === familyId)?.id
                        )
                    );
                }
            } catch (error) {
                console.error("Error fetching family data:", error);
            }
        };


        fetchFamilyData();
    }, [id, token, productData]); // Add productData as a dependency



    





    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="Form Layouts" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">Form Grid Layout</CardTitle>

                                    <Form onSubmit={formik.handleSubmit}>
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-name-Input">Product Name :</Label>
                                                    <Input
                                                        type="text"
                                                        name="name"
                                                        className="form-control"
                                                        id="formrow-name-Input"
                                                        placeholder="Enter Product Name"
                                                        value={formik.values.name}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.name && formik.errors.name ? true : false
                                                        }
                                                    />
                                                    {formik.errors.name && formik.touched.name ? (
                                                        <FormFeedback type="invalid">{formik.errors.name}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-hsn_code-Input">HSN CODE</Label>
                                                    <Input
                                                        type="text"
                                                        name="hsn_code"
                                                        className="form-control"
                                                        id="formrow-hsn_code-Input"
                                                        placeholder="Enter Product HSN Code"
                                                        value={formik.values.hsn_code}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.hsn_code && formik.errors.hsn_code ? true : false
                                                        }
                                                    />
                                                    {formik.errors.hsn_code && formik.touched.hsn_code ? (
                                                        <FormFeedback type="invalid">{formik.errors.hsn_code}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-tax-Input">created user</Label>
                                                    <Input
                                                        type="text"
                                                        name="created_user"
                                                        className="form-control"
                                                        id="formrow-tax-Input"
                                                        placeholder=""
                                                        value={created_user}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.tax && formik.errors.tax ? true : false}
                                                    />

                                                </div>
                                            </Col>
                                            <Col md={4}>

                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-type-Input">Product Type</Label>
                                                    <Input
                                                        type="select"
                                                        name="type"
                                                        className="form-control"
                                                        id="formrow-type-Input"
                                                        value={formik.values.type}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.type && formik.errors.type ? true : false}
                                                    >
                                                        <option value="">Select Product Type</option>
                                                        {types.map((type) => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </Input>
                                                    {formik.errors.type && formik.touched.type ? (
                                                        <FormFeedback type="invalid">{formik.errors.type}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                            <Col md={4}>

                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-unit-Input">Unit</Label>
                                                    <Input
                                                        type="select"
                                                        name="unit"
                                                        className="form-control"
                                                        id="formrow-unit-Input"
                                                        value={formik.values.unit}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.unit && formik.errors.unit ? true : false}
                                                    >
                                                        <option value="">Select Unit</option>
                                                        {UNIT_TYPES.map((unit) => (
                                                            <option key={unit.value} value={unit.value}>
                                                                {unit.label}
                                                            </option>
                                                        ))}
                                                    </Input>
                                                    {formik.errors.unit && formik.touched.unit ? (
                                                        <FormFeedback type="invalid">{formik.errors.unit}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                        </Row>


                                        <Row>

                                            <Col md={4}>

                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-purchase-rate-Input">Purchase Rate</Label>
                                                    <Input
                                                        type="text"
                                                        name="purchase_rate"
                                                        className="form-control"
                                                        id="formrow-purchase-rate-Input"
                                                        placeholder="Enter Purchase Rate"
                                                        value={formik.values.purchase_rate}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.purchase_rate && formik.errors.purchase_rate ? true : false
                                                        }
                                                    />
                                                    {formik.errors.purchase_rate && formik.touched.purchase_rate ? (
                                                        <FormFeedback type="invalid">{formik.errors.purchase_rate}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                            <Col md={4}>

                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-selling-price-Input">Selling Price</Label>
                                                    <Input
                                                        type="text"
                                                        name="selling_price"
                                                        className="form-control"
                                                        id="formrow-selling-price-Input"
                                                        placeholder="Enter Selling Price"
                                                        value={formik.values.selling_price}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.selling_price && formik.errors.selling_price ? true : false
                                                        }
                                                    />
                                                    {formik.errors.selling_price && formik.touched.selling_price ? (
                                                        <FormFeedback type="invalid">{formik.errors.selling_price}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                            <Col md={4}>

                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-stock-Input">Stock</Label>
                                                    <Input
                                                        type="number"
                                                        name="stock"
                                                        className="form-control"
                                                        id="formrow-stock-Input"
                                                        placeholder="Enter Stock Quantity"
                                                        value={formik.values.stock}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.stock && formik.errors.stock ? true : false}
                                                    />
                                                    {formik.errors.stock && formik.touched.stock ? (
                                                        <FormFeedback type="invalid">{formik.errors.stock}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-color-Input">Color</Label>
                                                    <Input
                                                        type="text"
                                                        name="color"
                                                        className="form-control"
                                                        id="formrow-color-Input"
                                                        placeholder="Enter Color"
                                                        value={formik.values.color}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.color && formik.errors.color ? true : false}
                                                    />
                                                    {formik.errors.color && formik.touched.color ? (
                                                        <FormFeedback type="invalid">{formik.errors.color}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-color-Input">Size</Label>
                                                    <Input
                                                        type="text"
                                                        name="size"
                                                        className="form-control"
                                                        id="formrow-color-Input"
                                                        placeholder="Enter Size"
                                                        value={formik.values.size}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.size && formik.errors.size ? true : false}
                                                    />
                                                    {formik.errors.size && formik.touched.size ? (
                                                        <FormFeedback type="invalid">{formik.errors.size}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-tax-Input">Tax (%)</Label>
                                                    <Input
                                                        type="text"
                                                        name="tax"
                                                        className="form-control"
                                                        id="formrow-tax-Input"
                                                        placeholder="Enter Tax Percentage"
                                                        value={formik.values.tax}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.tax && formik.errors.tax ? true : false}
                                                    />
                                                    {formik.errors.tax && formik.touched.tax ? (
                                                        <FormFeedback type="invalid">{formik.errors.tax}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-family-Input">Family</Label>
                                                    <Input
                                                        type="select"
                                                        name="family"
                                                        className="form-control"
                                                        id="formrow-family-Input"
                                                        multiple
                                                        value={formik.values.family}
                                                        onChange={(e) => {
                                                            // Capture multiple selected values
                                                            const options = Array.from(e.target.selectedOptions, option => option.value);
                                                            formik.setFieldValue("family", options);
                                                        }}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.family && formik.errors.family ? true : false
                                                        }
                                                    >
                                                        <option value="">Select Family</option>
                                                        {familys.map((family) => (
                                                            <option key={family.id} value={family.id}>
                                                                {family.name}
                                                            </option>
                                                        ))}
                                                    </Input>
                                                    {formik.errors.family && formik.touched.family ? (
                                                        <FormFeedback type="invalid">{formik.errors.family}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>


                                        </Row>

                                        <div>
                                            <button type="submit" className="btn btn-primary w-md">
                                                Submit
                                            </button>
                                        </div>
                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment >
    );
};

export default FormLayouts;
