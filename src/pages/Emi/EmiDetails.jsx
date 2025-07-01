import { React} from "react";
import axios from "axios";
import { useState, useEffect } from "react";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
} from "reactstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EmiDetails = () => {

    const [details, setDetails] = useState([]);
    const [ loading, setLoading ] = useState(false);
    const [error, setError] = useState(null);

    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    const fetchEmiDetails = async() =>{

        try { 
            const emiResponse = await axios.get(`${import.meta.env.VITE_APP_IMAGE}/apis/emi/`, {

                headers:{
                    Authorization: `Bearer ${token}`
                }
            })
            setDetails(emiResponse.data.data);
        }
        catch(error){
            toast.error("Error fetching data:");   
        }

    }


    useEffect(() =>{
        fetchEmiDetails();
    }, []);

    const ViewDetails = (id) => {
        navigate(`/emi-fulldetails/${id}/`);
    }
    
    return(
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
                                                            <td><button onClick={() => ViewDetails(order.id)} style={{padding:"10px 20px", border:"none", background:"#3258a8", color:"white"}}>View</button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </>
        </>
    )
}


export default EmiDetails;