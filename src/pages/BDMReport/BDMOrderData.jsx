import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
    Card,
    CardBody,
    Col,
    Row,
    CardTitle,
    Form,
    Label,
    Button,
} from "reactstrap";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import { FaPlusCircle, FaTrash } from "react-icons/fa";

const BDMOrderData = () => {
    return (
        <React.Fragment>
            <ToastContainer />
            <div className="page-content">
                <Breadcrumbs
                    title="Daily Sales Report"
                    breadcrumbItem="BDM Order Report"
                />

                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardBody>
                                <CardTitle className="h4 mb-4">
                                    BDM ORDER REPORT
                                </CardTitle>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </React.Fragment>
    )
}

export default BDMOrderData;
