import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Table, Row, Col, Card, CardBody, CardTitle,
    CardSubtitle, Button, Input, FormGroup, Label,
    Modal, ModalHeader, ModalBody, ModalFooter
} from "reactstrap";
import { useNavigate } from "react-router-dom";
import Paginations from "../../../components/Common/Pagination";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ViewSeller = () => {
    const [sellerList, setSellerList] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [perPageData] = useState(10);

    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSellerId, setSelectedSellerId] = useState(null);
    const [sellerDetails, setSellerDetails] = useState({
        name: "",
        company_name: "",
        gstin: "",
        reg_no: "",
        phone: "",
        alt_phone: "",
        email: "",
        address: "",
        country: "",
        state: "",
        zipcode: "",
    });
    const [saving, setSaving] = useState(false);

    const token = localStorage.getItem("token");
    document.title = "Seller List | BEPOSOFT";

    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_APP_KEY}country/codes/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => setCountries(res.data.data || []))
            .catch(() => toast.error("Failed to load countries"));
    }, []);


    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_APP_KEY}states/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => setStates(res.data.data || []))
            .catch(() => toast.error("Failed to load states"));
    }, []);

    useEffect(() => {
        const fetchFamilyData = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}product/sellers/details/add/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setSellerList(response?.data?.data || []);
            } catch (error) {
                toast.error("Error fetching seller data.");
            }
        };
        if (token) fetchFamilyData();
    }, [token]);

    const handleViewClick = async (id) => {
        setSelectedSellerId(id);
        setIsModalOpen(true);

        try {
            const res = await axios.get(
                `${import.meta.env.VITE_APP_KEY}product/sellers/details/edit/${id}/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSellerDetails(res?.data?.data || {});
        } catch (error) {
            toast.error("Failed to fetch seller details");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setSellerDetails((prev) => ({
            ...prev,
            [name]: value,
        }));
    };


    const handleUpdateSeller = async () => {
        if (!selectedSellerId) return;

        setSaving(true);
        try {
            await axios.put(
                `${import.meta.env.VITE_APP_KEY}product/sellers/details/edit/${selectedSellerId}/`,
                sellerDetails,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Seller updated successfully");
            setIsModalOpen(false);

            // refresh list
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}product/sellers/details/add/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSellerList(response?.data?.data || []);

        } catch (error) {
            toast.error("Failed to update seller");
        } finally {
            setSaving(false);
        }
    };


    // Pagination
    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentPageData = sellerList.slice(
        indexOfFirstItem,
        indexOfLastItem
    );


    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4">Seller List</CardTitle>
                                    <CardSubtitle className="card-title-desc">
                                        Filter and view seller data.
                                    </CardSubtitle>

                                    <Row className="align-items-end mb-3 g-3">
                                        <Col md={3}>
                                            <FormGroup className="mb-0">
                                                <Label className="mb-1">Search</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Search by Name, Phone, GST, Email, State"
                                                    className="w-100"
                                                />
                                            </FormGroup>
                                        </Col>

                                        <Col md={2}>
                                            <FormGroup className="mb-0">
                                                <Label className="mb-1">State</Label>
                                                <Input
                                                    type="select"
                                                    className="w-100"
                                                >
                                                    <option value="">All States</option>
                                                    {states.map((state) => (
                                                        <option key={state.id} value={state.name}>
                                                            {state.name}
                                                        </option>
                                                    ))}
                                                </Input>
                                            </FormGroup>
                                        </Col>


                                        <Col md={2} className="d-flex">
                                            <Button
                                                color="success"
                                                className="ms-auto w-100"
                                                style={{ marginTop: "24px" }}
                                            >
                                                Export to Excel
                                            </Button>
                                        </Col>
                                    </Row>
                                    <>
                                        <div className="table-responsive">
                                            <Table bordered striped hover className="mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Name</th>
                                                        <th>Company Name</th>
                                                        <th>GST</th>
                                                        <th>Email</th>
                                                        <th>Country</th>
                                                        <th>State</th>
                                                        <th>Phone</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentPageData.map((customer, index) => (
                                                        <tr key={customer.id}>
                                                            <th scope="row">
                                                                {indexOfFirstItem + index + 1}
                                                            </th>
                                                            <td>{customer.name}</td>
                                                            <td>{customer.company_name}</td>
                                                            <td>{customer.gstin || "N/A"}</td>
                                                            <td>{customer.email || "N/A"}</td>
                                                            <td>{customer.country_name || "N/A"}</td>
                                                            <td>{customer.state_name || "N/A"}</td>
                                                            <td>{customer.phone || "N/A"}</td>
                                                            <td>
                                                                <Button
                                                                    color="primary"
                                                                    size="sm"
                                                                    onClick={() => handleViewClick(customer.id)}
                                                                >
                                                                    View
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>

                                        <Paginations
                                            perPageData={perPageData}
                                            data={sellerList}
                                            currentPage={currentPage}
                                            setCurrentPage={setCurrentPage}
                                            isShowingPageLength={true}
                                            paginationDiv="mt-3 d-flex justify-content-center"
                                            paginationClass="pagination pagination-rounded"
                                            indexOfFirstItem={indexOfFirstItem}
                                            indexOfLastItem={indexOfLastItem}
                                        />

                                    </>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
                <Modal isOpen={isModalOpen} toggle={() => setIsModalOpen(!isModalOpen)} size="lg">
                    <ModalHeader toggle={() => setIsModalOpen(!isModalOpen)}>
                        Update Seller Details
                    </ModalHeader>

                    <ModalBody>
                        <Row>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Name</Label>
                                    <Input
                                        name="name"
                                        value={sellerDetails.name || ""}
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>

                            <Col md={4}>
                                <FormGroup>
                                    <Label>Company Name</Label>
                                    <Input
                                        name="company_name"
                                        value={sellerDetails.company_name || ""}
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>

                            <Col md={4}>
                                <FormGroup>
                                    <Label>Phone</Label>
                                    <Input
                                        name="phone"
                                        value={sellerDetails.phone || ""}
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>

                            <Col md={4}>
                                <FormGroup>
                                    <Label>GSTIN</Label>
                                    <Input
                                        name="gstin"
                                        value={sellerDetails.gstin || ""}
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>

                            <Col md={4}>
                                <FormGroup>
                                    <Label>Registration No</Label>
                                    <Input
                                        name="reg_no"
                                        value={sellerDetails.reg_no || ""}
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>

                            <Col md={4}>
                                <FormGroup>
                                    <Label>Alternate Phone</Label>
                                    <Input
                                        name="alt_phone"
                                        value={sellerDetails.alt_phone || ""}
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>

                            <Col md={4}>
                                <FormGroup>
                                    <Label>Email</Label>
                                    <Input
                                        name="email"
                                        value={sellerDetails.email || ""}
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>

                            <Col md={8}>
                                <FormGroup>
                                    <Label>Address</Label>
                                    <Input
                                        name="address"
                                        value={sellerDetails.address || ""}
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>

                            <Col md={4}>
                                <FormGroup>
                                    <Label>Country</Label>
                                    <Input
                                        type="select"
                                        name="country"
                                        value={sellerDetails.country || ""}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.country_code}
                                            </option>
                                        ))}
                                    </Input>
                                </FormGroup>
                            </Col>

                            <Col md={4}>
                                <FormGroup>
                                    <Label>State</Label>
                                    <Input
                                        type="select"
                                        name="state"
                                        value={sellerDetails.state || ""}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select State</option>
                                        {states.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </Input>
                                </FormGroup>
                            </Col>

                            <Col md={4}>
                                <FormGroup>
                                    <Label>Zipcode</Label>
                                    <Input
                                        name="zipcode"
                                        value={sellerDetails.zipcode || ""}
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>

                        </Row>
                    </ModalBody>

                    <ModalFooter>
                        <Button color="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" onClick={handleUpdateSeller} disabled={saving}>
                            {saving ? "Saving..." : "Update"}
                        </Button>
                    </ModalFooter>
                </Modal>
            </div>
        </React.Fragment>
    );
};

export default ViewSeller;
