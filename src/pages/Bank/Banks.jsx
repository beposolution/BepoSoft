import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import navigation hook
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Form,
    FormGroup,
    Label,
    Input
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination";

const BasicTable = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [accountTypes, setAccountTypes] = useState([]);
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);
    const [editData, setEditData] = useState({
        id: null,
        name: "",
        account_number: "",
        ifsc_code: "",
        branch: "",
        open_balance: "",
        account_type: "",
        interest_rate: ""
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [perPageData] = useState(10);

    // Document title
    document.title = "beposoft | bank details";

    useEffect(() => {
        const fetchAccountTypes = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}add/bank/account/type/`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                if (response.status === 200) {
                    setAccountTypes(response.data.data || []);
                }
            } catch (error) {
                toast.error("Failed to load account types");
            }
        };

        fetchAccountTypes();
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token"); // Retrieve token from storage
        axios
            .get(`${import.meta.env.VITE_APP_KEY}banks/`, {
                headers: {
                    Authorization: `Bearer ${token}`, // Include token in headers
                },
            })
            .then((response) => {
                setAccounts(response.data.data);
                setLoading(false);
            })
            .catch((err) => {
                if (err.response && err.response.status === 401) {
                    // Clear token and redirect to login
                    localStorage.removeItem("token");
                    alert("Your session has expired. Please log in again.");
                    navigate("/login");
                } else {
                    setError(err);
                    setLoading(false);
                }
            });
    }, [navigate]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    const handleSave = () => {
        const token = localStorage.getItem("token");

        axios.put(`${import.meta.env.VITE_APP_KEY}bank/view/${editData.id}/`, editData, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(() => {
                toast.success("Account updated!");
                setModalOpen(false);
                setAccounts(prev =>
                    prev.map(acc => (acc.id === editData.id ? editData : acc))
                );
            })
            .catch(() => {
                toast.error("Failed to update account");
            });
    };

    const handleEdit = (account) => {
        setEditData({
            ...account,
            account_type: account.account_type || "",
            interest_rate: account.interest_rate || ""
        }); // sets all fields
        setModalOpen(true);
    };

    const filteredAccounts = accounts.filter(account =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentPageData = filteredAccounts.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <React.Fragment>
            <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
                <ModalHeader toggle={() => setModalOpen(!modalOpen)}>Edit Account</ModalHeader>
                <ModalBody>
                    <Form>
                        <FormGroup>
                            <Label>Name</Label>
                            <Input
                                type="text"
                                value={editData.name || ""}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>Account Number</Label>
                            <Input
                                type="text"
                                value={editData.account_number || ""}
                                onChange={(e) => setEditData({ ...editData, account_number: e.target.value })}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>IFSC Code</Label>
                            <Input
                                type="text"
                                value={editData.ifsc_code || ""}
                                onChange={(e) => setEditData({ ...editData, ifsc_code: e.target.value })}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>Account Type</Label>
                            <Input
                                type="select"
                                value={editData.account_type || ""}
                                onChange={(e) =>
                                    setEditData({ ...editData, account_type: e.target.value })
                                }
                            >
                                <option value="">Select Account Type</option>
                                {accountTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.account_type}
                                    </option>
                                ))}
                            </Input>
                        </FormGroup>

                        <FormGroup>
                            <Label>Interest Rate</Label>
                            <Input
                                type="number"
                                value={editData.interest_rate || ""}
                                onChange={(e) => setEditData({ ...editData, interest_rate: e.target.value })}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>Branch</Label>
                            <Input
                                type="text"
                                value={editData.branch || ""}
                                onChange={(e) => setEditData({ ...editData, branch: e.target.value })}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>Opening Balance</Label>
                            <Input
                                type="number"
                                value={editData.open_balance || ""}
                                onChange={(e) => setEditData({ ...editData, open_balance: e.target.value })}
                            />
                        </FormGroup>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleSave}>Save</Button>
                    <Button color="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                </ModalFooter>
            </Modal>
            <div className="page-content">
                <div className="container-fluid d-flex justify-content-center">
                    <Row className="w-100">
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4 text-center font-weight-bold text-decoration-underline">
                                        COMPANY ACCOUNTS DETAILS
                                    </CardTitle>
                                    <FormGroup className="mb-3">
                                        <Input
                                            type="text"
                                            placeholder="Search by Bank Name"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </FormGroup>
                                    <div className="table-responsive">
                                        <Table className="table table-hover mb-0 text-center">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Name</th>
                                                    <th>A/C NO</th>
                                                    <th>A/C TYPE</th>
                                                    <th>IFSC CODE</th>
                                                    <th>BRANCH</th>
                                                    <th>OPENING BALANCE</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentPageData.map((account, index) => (
                                                    <tr key={account.id}>
                                                        <th scope="row">{indexOfFirstItem + index + 1}</th>
                                                        <td>{account.name}</td>
                                                        <td style={{ color: 'blue' }}>{account.account_number}</td>
                                                        <td>{account?.account_type}</td>
                                                        <td>{account.ifsc_code}</td>
                                                        <td>{account.branch}</td>
                                                        <td>{account.open_balance}</td>
                                                        <td>
                                                            <Button color="primary" onClick={() => handleEdit(account)}>Edit</Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                        <Paginations
                                            perPageData={perPageData}
                                            data={filteredAccounts}
                                            currentPage={currentPage}
                                            setCurrentPage={setCurrentPage}
                                            isShowingPageLength={true}
                                            paginationDiv="mt-3 d-flex justify-content-center"
                                            paginationClass="pagination pagination-rounded"
                                            indexOfFirstItem={indexOfFirstItem}
                                            indexOfLastItem={indexOfLastItem}
                                        />
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
                <ToastContainer position="top-right" autoClose={3000} />
            </div>
        </React.Fragment>
    );
};

export default BasicTable;
