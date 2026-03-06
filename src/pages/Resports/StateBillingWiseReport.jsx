import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Card, CardBody, Col, Row, Table, Label
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";

const StateBillingWiseReport = () => {
    return (
        <React.Fragment>
            <div className="page-content">
                <Breadcrumbs title="Reports" breadcrumbItem="State Billing Wise Report" />
                <Row>
                    <Col lg={12}>
                    </Col>
                </Row>
            </div>
        </React.Fragment>
    )
}

export default StateBillingWiseReport;