import React, { useEffect, useState } from "react";
import axios from "axios";

import {
    Card,
    CardBody,
    Button,
    Input,
    Table,
    Row,
    Col,
    Container,
    Label,
    Spinner,
} from "reactstrap";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const AddLPO = () => {

    document.title = "Create LPO | Beposoft";

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;


    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState([]);


    const initialState = {

        date: "",
        company: "",
        note: "",

        items: [
            {
                product: "",
                product_description: "",
                quantity: 1
            }
        ]

    };


    const [lpo, setLpo] = useState(initialState);



    useEffect(() => {

        fetchCompanies();

    }, []);



    const fetchCompanies = async () => {

        try {

            const response = await axios.get(
                `${baseUrl}company/data/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );


            setCompanies(
                response.data.data || []
            );


        } catch (error) {

            console.log(error);

            toast.error(
                "Failed to load companies"
            );

        }

    };




    const handleChange = (e) => {

        setLpo({

            ...lpo,

            [e.target.name]: e.target.value

        });

    };




    const handleItemChange = (
        index,
        field,
        value
    ) => {


        const updatedItems = [
            ...lpo.items
        ];


        updatedItems[index][field] = value;


        setLpo({

            ...lpo,

            items: updatedItems

        });

    };




    const addItem = () => {


        setLpo({

            ...lpo,

            items: [

                ...lpo.items,

                {
                    product: "",
                    product_description: "",
                    quantity: 1
                }

            ]

        });


    };




    const removeItem = (index) => {


        const updatedItems = [
            ...lpo.items
        ];


        updatedItems.splice(
            index,
            1
        );


        setLpo({

            ...lpo,

            items: updatedItems

        });


    };




    const submitLPO = async () => {


        try {


            setLoading(true);



            const payload = {


                date: lpo.date,


                company: Number(
                    lpo.company
                ),


                note: lpo.note,


                items:

                    lpo.items.map(item => ({

                        product:
                            item.product,


                        product_description:
                            item.product_description,


                        quantity:
                            Number(
                                item.quantity
                            )

                    }))


            };



            await axios.post(

                `${baseUrl}lpo/`,

                payload,

                {

                    headers: {

                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"

                    }

                }

            );



            toast.success(
                "LPO created successfully"
            );


            setLpo(
                initialState
            );



        } catch (error) {


            console.log(
                error.response?.data
            );


            toast.error(

                error.response?.data?.message ||
                "Failed to create LPO"

            );


        } finally {


            setLoading(false);


        }


    };



    return (

        <React.Fragment>


            <ToastContainer />


            <div
                className="page-content"
                style={{
                    background: "#f5f7fb",
                    minHeight: "100vh"
                }}
            >


                <Container fluid>



                    {/* HEADER CARD */}

                    <div
                        className="card border-0 mb-4"
                        style={{

                            borderRadius: "22px",

                            background:
                                "linear-gradient(135deg,#1f2937 0%,#334155 45%,#0f172a 100%)",

                            boxShadow:
                                "0 12px 35px rgba(15,23,42,.18)"

                        }}
                    >


                        <div className="card-body p-4">


                            <Row className="align-items-center">


                                <Col lg="8">


                                    <div className="d-flex align-items-center gap-3">


                                        <div
                                            style={{

                                                width: "58px",

                                                height: "58px",

                                                borderRadius: "18px",

                                                background:
                                                    "rgba(255,255,255,.12)",

                                                display: "flex",

                                                alignItems: "center",

                                                justifyContent: "center",

                                                color: "#fff",

                                                fontSize: "26px"

                                            }}
                                        >

                                            <i className="bx bx-file"></i>


                                        </div>



                                        <div>


                                            <h4
                                                className="mb-1 text-white fw-bold"
                                            >

                                                Create Local Purchase Order

                                            </h4>


                                            <p
                                                className="mb-0"
                                                style={{
                                                    color:
                                                        "rgba(255,255,255,.72)"
                                                }}
                                            >

                                                Create and manage purchase orders with product details.

                                            </p>


                                        </div>


                                    </div>


                                </Col>



                                <Col lg="4"
                                    className="mt-3 mt-lg-0"
                                >

                                    <div className="d-flex justify-content-lg-end">


                                        <span
                                            className="badge"
                                            style={{

                                                background:
                                                    "rgba(59,130,246,.18)",

                                                color: "#bfdbfe",

                                                padding: "10px 14px",

                                                borderRadius: "999px"

                                            }}
                                        >

                                            LPO Management

                                        </span>


                                    </div>


                                </Col>


                            </Row>


                        </div>


                    </div>



                    {/* FORM CARD */}

                    <Card
                        className="border-0 mb-4"
                        style={{

                            borderRadius: "22px",

                            boxShadow:
                                "0 10px 35px rgba(15,23,42,.08)"

                        }}
                    >

                        <CardBody className="p-4">


                            <h5 className="fw-bold mb-4">
                                Purchase Order Details
                            </h5>


                            <Row className="g-3">


                                <Col md="4">

                                    <Label className="fw-semibold">
                                        Date
                                    </Label>


                                    <Input
                                        type="date"
                                        name="date"
                                        value={lpo.date}
                                        onChange={handleChange}
                                        style={{
                                            borderRadius: "12px",
                                            minHeight: "46px",
                                            background: "#f8fafc"
                                        }}
                                    />

                                </Col>



                                <Col md="4">

                                    <Label className="fw-semibold">
                                        Company
                                    </Label>


                                    <Input

                                        type="select"

                                        name="company"

                                        value={lpo.company}

                                        onChange={handleChange}

                                        style={{

                                            borderRadius: "12px",

                                            minHeight: "46px",

                                            background: "#f8fafc"

                                        }}

                                    >

                                        <option value="">
                                            Select Company
                                        </option>


                                        {
                                            companies.map(company => (

                                                <option
                                                    key={company.id}
                                                    value={company.id}
                                                >

                                                    {company.name}

                                                </option>

                                            ))
                                        }


                                    </Input>


                                </Col>



                                <Col md="4">

                                    <Label className="fw-semibold">
                                        Note
                                    </Label>


                                    <Input

                                        name="note"

                                        value={lpo.note}

                                        onChange={handleChange}

                                        placeholder="Enter note"

                                        style={{

                                            borderRadius: "12px",

                                            minHeight: "46px",

                                            background: "#f8fafc"

                                        }}

                                    />


                                </Col>


                            </Row>


                        </CardBody>

                    </Card>
                    {/* PRODUCTS CARD */}

                    <Card
                        className="border-0 mb-4"
                        style={{
                            borderRadius: "22px",
                            boxShadow:
                                "0 10px 35px rgba(15,23,42,.08)",
                            overflow: "hidden"
                        }}
                    >

                        <div
                            className="card-header border-0"
                            style={{
                                background: "#fff",
                                padding: "22px 24px"
                            }}
                        >

                            <div className="d-flex justify-content-between align-items-center">

                                <div>

                                    <h5 className="mb-1 fw-bold text-dark">
                                        Products
                                    </h5>

                                    <p className="text-muted mb-0">
                                        Add products required for this purchase order.
                                    </p>

                                </div>


                                <Button

                                    color="primary"

                                    onClick={addItem}

                                    style={{
                                        borderRadius: "12px",
                                        padding: "10px 18px",
                                        fontWeight: 600
                                    }}

                                >

                                    <i className="bx bx-plus me-1"></i>

                                    Add Product

                                </Button>


                            </div>


                        </div>



                        <CardBody className="p-3">


                            <div className="table-responsive">


                                <Table
                                    className="align-middle mb-0"
                                >

                                    <thead>

                                        <tr>

                                            <th>
                                                Product
                                            </th>

                                            <th>
                                                Description
                                            </th>

                                            <th width="150">
                                                Quantity
                                            </th>

                                            <th width="120">
                                                Action
                                            </th>


                                        </tr>

                                    </thead>


                                    <tbody>


                                        {
                                            lpo.items.map(
                                                (item, index) => (

                                                    <tr key={index}>


                                                        <td>

                                                            <Input

                                                                value={
                                                                    item.product
                                                                }

                                                                placeholder="Product name"

                                                                onChange={(e) =>
                                                                    handleItemChange(
                                                                        index,
                                                                        "product",
                                                                        e.target.value
                                                                    )
                                                                }

                                                                style={{
                                                                    borderRadius: "10px",
                                                                    background: "#f8fafc"
                                                                }}

                                                            />


                                                        </td>



                                                        <td>


                                                            <Input

                                                                value={
                                                                    item.product_description
                                                                }

                                                                placeholder="Product description"

                                                                onChange={(e) =>
                                                                    handleItemChange(
                                                                        index,
                                                                        "product_description",
                                                                        e.target.value
                                                                    )
                                                                }

                                                                style={{
                                                                    borderRadius: "10px",
                                                                    background: "#f8fafc"
                                                                }}

                                                            />


                                                        </td>



                                                        <td>


                                                            <Input

                                                                type="number"

                                                                min="1"

                                                                value={
                                                                    item.quantity
                                                                }

                                                                onChange={(e) =>
                                                                    handleItemChange(
                                                                        index,
                                                                        "quantity",
                                                                        e.target.value
                                                                    )
                                                                }

                                                                style={{
                                                                    borderRadius: "10px",
                                                                    background: "#f8fafc"
                                                                }}

                                                            />


                                                        </td>



                                                        <td>


                                                            <Button

                                                                color="danger"

                                                                size="sm"

                                                                disabled={
                                                                    lpo.items.length === 1
                                                                }

                                                                onClick={() =>
                                                                    removeItem(index)
                                                                }

                                                                style={{

                                                                    borderRadius: "10px",

                                                                    padding:
                                                                        "7px 14px"

                                                                }}

                                                            >

                                                                <i className="bx bx-trash me-1"></i>

                                                                Remove

                                                            </Button>


                                                        </td>


                                                    </tr>


                                                ))

                                        }


                                    </tbody>


                                </Table>


                            </div>



                        </CardBody>


                    </Card>





                    {/* SUBMIT BUTTON */}

                    <div className="text-end mb-4">


                        <Button

                            color="success"

                            disabled={loading}

                            onClick={submitLPO}

                            style={{

                                borderRadius: "12px",

                                padding: "12px 28px",

                                fontWeight: 700,

                                boxShadow:
                                    "0 8px 18px rgba(34,197,94,.25)"

                            }}

                        >

                            {
                                loading ?

                                    (
                                        <>
                                            <Spinner
                                                size="sm"
                                                className="me-2"
                                            />

                                            Saving...

                                        </>
                                    )

                                    :

                                    (
                                        <>
                                            <i className="bx bx-check me-1"></i>

                                            Create LPO

                                        </>
                                    )
                            }


                        </Button>


                    </div>



                </Container>


            </div>


        </React.Fragment>

    );


};


export default AddLPO;