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
    Spinner
} from "reactstrap";

import { Link } from "react-router-dom";

import {
    ToastContainer,
    toast
} from "react-toastify";

import "react-toastify/dist/ReactToastify.css";



const AllLPO = () => {


    const token = localStorage.getItem("token");

    const baseUrl = import.meta.env.VITE_APP_KEY;



    const [lpos, setLpos] = useState([]);

    const [loading, setLoading] = useState(false);



    const [filters, setFilters] = useState({

        search: "",
        company: "",
        requested_by: "",
        approved_by: "",
        start_date: "",
        end_date: ""

    });



    const [page, setPage] = useState(1);


    const [pagination, setPagination] = useState({});





    const fetchLPO = async () => {


        try {


            setLoading(true);



            let params = {

                page: page

            };
            Object.keys(filters).forEach(key => {


                if (filters[key]) {

                    params[key] = filters[key];

                }


            });

            const response = await axios.get(

                `${baseUrl}lpo/all/`,

                {

                    params,

                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    }

                }

            );

            setLpos(

                response.data.results.data || []

            );



            setPagination(

                response.data

            );



        }


        catch (error) {
            console.log(error);
            toast.error(
                "Failed to fetch LPO"
            );
        }

        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLPO();
    }, [page]);

    const handleSearch = () => {
        setPage(1);
        fetchLPO();
    };

    const handleChange = (e) => {
        setFilters({

            ...filters,

            [e.target.name]:
                e.target.value

        });
    };

    return (
        <React.Fragment>
            <div
                className="page-content"
                style={{
                    background: "#f5f7fb",
                    minHeight: "100vh"
                }}
            >

                <ToastContainer />

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
                                            <h4 className="mb-1 text-white fw-bold">
                                                All Local Purchase Orders
                                            </h4>

                                            <p
                                                className="mb-0"
                                                style={{
                                                    color:
                                                        "rgba(255,255,255,.72)"
                                                }}
                                            >
                                                Manage, review and track all purchase orders.
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
                                                padding:
                                                    "10px 14px",
                                                borderRadius:
                                                    "999px"
                                            }}
                                        >
                                            Total LPO : {lpos.length}
                                        </span>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </div>

                    {/* FILTER CARD */}

                    <Card
                        className="border-0 mb-4"
                        style={{
                            borderRadius: "22px",
                            boxShadow:
                                "0 10px 35px rgba(15,23,42,.08)"
                        }}
                    >
                        <CardBody className="p-4">
                            <div className="mb-4">
                                <h5 className="fw-bold mb-1">
                                    Filters
                                </h5>
                                <p className="text-muted mb-0">
                                    Search and filter local purchase orders.
                                </p>
                            </div>

                            <Row className="g-3">
                                <Col md="3">
                                    <Label className="fw-semibold">
                                        Search
                                    </Label>
                                    <Input
                                        placeholder="Search"
                                        name="search"
                                        value={filters.search}
                                        onChange={handleChange}
                                        style={{
                                            borderRadius: "12px",
                                            minHeight: "46px",
                                            background: "#f8fafc"
                                        }}
                                    />
                                </Col>

                                <Col md="2">
                                    <Label className="fw-semibold">
                                        Company
                                    </Label>
                                    <Input
                                        placeholder="Company ID"
                                        name="company"
                                        value={filters.company}
                                        onChange={handleChange}
                                        style={{
                                            borderRadius: "12px",
                                            minHeight: "46px",
                                            background: "#f8fafc"
                                        }}
                                    />
                                </Col>

                                <Col md="2">
                                    <Label className="fw-semibold">
                                        Requested By
                                    </Label>
                                    <Input
                                        placeholder="Requested By"
                                        name="requested_by"
                                        value={filters.requested_by}
                                        onChange={handleChange}
                                        style={{
                                            borderRadius: "12px",
                                            minHeight: "46px",
                                            background: "#f8fafc"
                                        }}
                                    />
                                </Col>

                                <Col md="2">
                                    <Label className="fw-semibold">
                                        Approved By
                                    </Label>
                                    <Input
                                        placeholder="Approved By"
                                        name="approved_by"
                                        value={filters.approved_by}
                                        onChange={handleChange}
                                        style={{
                                            borderRadius: "12px",
                                            minHeight: "46px",
                                            background: "#f8fafc"
                                        }}
                                    />
                                </Col>

                                <Col md="3"
                                    className="d-flex align-items-end"
                                >
                                    <Button
                                        color="primary"
                                        className="w-100"
                                        onClick={handleSearch}
                                        style={{
                                            borderRadius: "12px",
                                            minHeight: "46px",
                                            fontWeight: 700
                                        }}
                                    >
                                        <i className="bx bx-search me-1"></i>
                                        Search
                                    </Button>
                                </Col>
                            </Row>
                            <Row className="g-3 mt-1">
                                <Col md="3">
                                    <Label className="fw-semibold">
                                        Start Date
                                    </Label>
                                    <Input
                                        type="date"
                                        name="start_date"
                                        value={filters.start_date}
                                        onChange={handleChange}
                                        style={{
                                            borderRadius: "12px",
                                            minHeight: "46px",
                                            background: "#f8fafc"
                                        }}
                                    />
                                </Col>

                                <Col md="3">
                                    <Label className="fw-semibold">
                                        End Date
                                    </Label>
                                    <Input
                                        type="date"
                                        name="end_date"
                                        value={filters.end_date}
                                        onChange={handleChange}
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

                    {/* TABLE CARD */}

                    <Card
                        className="border-0"
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

                            <h5 className="mb-1 fw-bold text-dark">
                                LPO Records
                            </h5>
                            <p className="text-muted mb-0">
                                Complete list of local purchase orders.
                            </p>
                        </div>

                        <CardBody className="p-3">
                            <div className="table-responsive">
                                <Table
                                    className="align-middle mb-0"
                                >
                                    <thead>
                                        <tr>
                                            <th>Invoice</th>
                                            <th>Date</th>
                                            <th>Company</th>
                                            <th>Requested By</th>
                                            <th>Approved By</th>
                                            <th>Confirmed By</th>
                                            <th className="text-end">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            loading ?
                                                (
                                                    <tr>
                                                        <td
                                                            colSpan="7"
                                                            className="text-center py-5"
                                                        >
                                                            <Spinner size="sm" />
                                                            <div className="mt-2 text-muted">
                                                                Loading LPO...
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                                :
                                                lpos.length === 0 ?
                                                    (
                                                        <tr>
                                                            <td
                                                                colSpan="7"
                                                                className="text-center py-5"
                                                            >
                                                                <i
                                                                    className="bx bx-file"
                                                                    style={{
                                                                        fontSize: "40px",
                                                                        color: "#94a3b8"
                                                                    }}
                                                                ></i>
                                                                <h5 className="mt-3 fw-bold">No LPO Found</h5>
                                                            </td>
                                                        </tr>
                                                    )
                                                    :
                                                    lpos.map((lpo) => (


                                                        <tr key={lpo.id}>
                                                            <td>
                                                                <span className="fw-bold text-dark">{lpo.invoice}</span>
                                                            </td>
                                                            <td>{lpo.date}</td>
                                                            <td>{lpo.company_name || "-"}</td>
                                                            <td>{lpo.requested_by_name || "-"}</td>
                                                            <td>{lpo.approved_by_name || "-"}</td>
                                                            <td>{lpo.confirmed_by_name || "-"}</td>

                                                            <td className="text-end">


                                                                <Link

                                                                    to={`/lpo/edit/${lpo.id}`}

                                                                >


                                                                    <Button

                                                                        color="primary"

                                                                        size="sm"

                                                                        style={{

                                                                            borderRadius: "10px",

                                                                            padding:
                                                                                "8px 16px",

                                                                            fontWeight: 600

                                                                        }}

                                                                    >

                                                                        <i className="bx bx-show me-1"></i>

                                                                        View

                                                                    </Button>


                                                                </Link>


                                                            </td>



                                                        </tr>


                                                    ))


                                        }



                                    </tbody>



                                </Table>



                            </div>



                        </CardBody>



                    </Card>







                    {/* PAGINATION */}



                    <div

                        className="d-flex justify-content-between align-items-center mt-4 mb-4"

                    >



                        <Button

                            color="light"

                            disabled={!pagination.previous}

                            onClick={() => setPage(page - 1)}

                            style={{

                                borderRadius: "12px",

                                padding: "10px 22px",

                                fontWeight: 600,

                                border: "1px solid #e5e7eb"

                            }}

                        >

                            <i className="bx bx-left-arrow-alt me-1"></i>

                            Previous

                        </Button>





                        <span

                            className="badge"

                            style={{

                                background: "#e0e7ff",

                                color: "#3730a3",

                                padding: "10px 18px",

                                borderRadius: "999px"

                            }}

                        >

                            Page {page}

                        </span>





                        <Button

                            color="primary"

                            disabled={!pagination.next}

                            onClick={() => setPage(page + 1)}

                            style={{

                                borderRadius: "12px",

                                padding: "10px 22px",

                                fontWeight: 600

                            }}

                        >

                            Next

                            <i className="bx bx-right-arrow-alt ms-1"></i>

                        </Button>



                    </div>





                </Container>



            </div>



        </React.Fragment>


    );


};


export default AllLPO;