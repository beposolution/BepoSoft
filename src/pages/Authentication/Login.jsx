import React, { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import withRouter from "../../components/Common/withRouter";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// redux
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";

// Formik validation
import * as Yup from "yup";
import { useFormik } from "formik";
import {
  Row,
  Col,
  CardBody,
  Card,
  Alert,
  Container,
  Form,
  Input,
  FormFeedback,
  Label,
} from "reactstrap";
import { loginUser, socialLogin } from "../../store/actions";
// import profile from "../../assets/images/profile-img.png";
import profile from "../../assets/images/login.png";
// import logo from "../../../src/logo.png";
import logo from "../../../src/psage.jpeg";
import lightlogo from "../../assets/images/logo-light.svg";

const Login = (props) => {
  document.title = "Beposoft | Authentication";
  const dispatch = useDispatch();

  const [showPassword, setShowPassword] = useState(false);

  const validation = useFormik({
    enableReinitialize: true,

    initialValues: {
      username: '',
      password: '',
    },

    validationSchema: Yup.object({
      username: Yup.string().required('Please Enter Your Username'),
      password: Yup.string().required('Please Enter Your Password'),
    }),

    onSubmit: async (values) => {
      try {
        const response = await axios.post(`${import.meta.env.VITE_APP_KEY}login/`, values, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = response.data;

        if (data.status === 'success') {
          localStorage.setItem('token', data.token);
          localStorage.setItem('active', data.active);
          localStorage.setItem('name', data.name);
          localStorage.setItem('warehouseId', data.warehouse_id || '');
          localStorage.setItem('is_manager', data.manager || false);

          dispatch(loginUser({
            token: data.token,
            active: data.active,
            name: data.name,
          }, props.router.navigate));

          props.router.navigate('/dashboard');
        } else {
          toast.error(data.message || 'Login failed. Please try again.');
        }
      } catch (error) {
        const errorMsg =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong. Please try again.";
        toast.error(errorMsg);
      }
    },
  });

  const LoginProperties = createSelector(
    (state) => state.Login,
    (login) => ({
      error: login.error,
    })
  );

  const { error } = useSelector(LoginProperties);

  const signIn = (type) => {
    dispatch(socialLogin(type, props.router.navigate));
  };

  const socialResponse = (type) => {
    signIn(type);
  };

  // return (
  //   <React.Fragment>
  //     <div className="home-btn d-none d-sm-block">
  //       <Link to="/" className="text-dark">
  //         <i className="bx bx-home h2" />
  //       </Link>
  //     </div>
  //     <div className="account-pages my-5 pt-sm-5">
  //       <Container>
  //         <Row className="justify-content-center">
  //           <Col md={8} lg={6} xl={5}>
  //             {/* <Card className="overflow-hidden"> */}
  //             <Card style={{ overflow: "visible" }}>
  //               <div className="bg-primary-subtle">
  //                 <Row>
  //                   <Col xs={7}>
  //                     <div className="text-primary p-4">
  //                       <h5 style={{ color: "#3f89ec" }}>Welcome Back !</h5>
  //                       <p style={{ color: "#3f89ec" }}>Sign in to continue to beposoft.</p>
  //                     </div>
  //                   </Col>
  //                   <Col className="col-5 align-self-end">
  //                     <img src={profile} alt="" className="img-fluid" />
  //                   </Col>
  //                 </Row>
  //               </div>
  //               <CardBody className="pt-0">
  //                 <div className="auth-logo">
  //                   <Link to="/" className="auth-logo-light">
  //                     <div className="avatar-md profile-user-wid mb-4">
  //                       <span className="avatar-title rounded-circle bg-light">
  //                         <img
  //                           src={lightlogo}
  //                           alt=""
  //                           className="rounded-circle"
  //                           height="34"
  //                         />
  //                       </span>
  //                     </div>
  //                   </Link>
  //                   {/* <Link to="/" className="auth-logo-dark">
  //                     <div className="avatar-md profile-user-wid mb-4">
  //                       <span className="avatar-title rounded-circle bg-light">
  //                         <img
  //                           src={logo}
  //                           alt=""
  //                           className="rounded-circle"
  //                           height="34"
  //                         />
  //                       </span>
  //                     </div>
  //                   </Link> */}
  //                   <div
  //                     className="auth-logo position-relative"
  //                     style={{
  //                       marginTop: "-45px",
  //                       marginBottom: "10px",
  //                       zIndex: 10,
  //                     }}
  //                   >
  //                     <Link to="/" className="auth-logo-dark">
  //                       <div className="avatar-md profile-user-wid mb-4">
  //                         <span
  //                           className="avatar-title rounded-circle bg-light d-flex align-items-center justify-content-center shadow"
  //                           style={{
  //                             width: "90px",
  //                             height: "90px",
  //                             border: "6px solid #fff",
  //                           }}
  //                         >
  //                           <img
  //                             src={logo}
  //                             alt=""
  //                             className="rounded-circle"
  //                             style={{
  //                               width: "80px",
  //                               height: "80px",
  //                               objectFit: "cover",
  //                             }}
  //                           />
  //                         </span>
  //                       </div>
  //                     </Link>
  //                   </div>
  //                 </div>
  //                 <div className="p-2">
  //                   <Form
  //                     className="form-horizontal"
  //                     onSubmit={(e) => {
  //                       e.preventDefault();
  //                       validation.handleSubmit();
  //                       return false;
  //                     }}
  //                   >
  //                     {error && <Alert color="danger">{error}</Alert>}
  //                     <div className="mb-3">
  //                       <Label className="form-label">Username</Label>
  //                       <Input
  //                         name="username"
  //                         className="form-control"
  //                         placeholder="Enter Your Username"
  //                         type="text"
  //                         onChange={validation.handleChange}
  //                         onBlur={validation.handleBlur}
  //                         value={validation.values.username}
  //                         invalid={validation.touched.username && validation.errors.username}
  //                       />
  //                       {validation.touched.username && validation.errors.username ? (
  //                         <FormFeedback type="invalid">
  //                           {validation.errors.username}
  //                         </FormFeedback>
  //                       ) : null}
  //                     </div>
  //                     <div className="mb-3">
  //                       <Label className="form-label">Password</Label>
  //                       <Input
  //                         name="password"
  //                         autoComplete="off"
  //                         value={validation.values.password}
  //                         type="password"
  //                         placeholder="Enter Password"
  //                         onChange={validation.handleChange}
  //                         onBlur={validation.handleBlur}
  //                         invalid={validation.touched.password && validation.errors.password}
  //                       />
  //                       {validation.touched.password && validation.errors.password ? (
  //                         <FormFeedback type="invalid">
  //                           {validation.errors.password}
  //                         </FormFeedback>
  //                       ) : null}
  //                     </div>
  //                     <div className="mt-3 d-grid">
  //                       <button
  //                         className="btn btn-primary btn-block"
  //                         type="submit"
  //                         style={{ backgroundColor: "#329ff2", borderColor: "#007bff" }}
  //                       >
  //                         Log In
  //                       </button>
  //                     </div>
  //                   </Form>
  //                 </div>
  //               </CardBody>
  //             </Card>
  //           </Col>
  //         </Row>
  //         <ToastContainer />
  //       </Container>
  //     </div>
  //   </React.Fragment>
  // );


  return (
    <React.Fragment>
      <div className="home-btn d-none d-sm-block">
        <Link to="/" className="text-dark">
          {/* <i className="bx bx-home h2" /> */}
        </Link>
      </div>

      <div
        className="account-pages"
        style={{
          minHeight: "100vh",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          padding: "30px 0",
        }}
      >
        <Container>
          <Row className="justify-content-center">
            <Col lg={9} xl={8}>
              <Card
                style={{
                  border: "none",
                  borderRadius: "24px",
                  overflow: "hidden",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
                }}
              >
                <Row className="g-0">
                  <Col
                    md={5}
                    className="bg-primary-subtle d-flex flex-column justify-content-between"
                    style={{ padding: "35px 10px" }}
                  >
                    <div style={{ padding: "0 20px", marginTop: "20px" }}>
                      <h3
                        style={{
                          color: "#3f89ec",
                          fontWeight: "800",
                          marginBottom: "12px",
                          marginTop: "10px",
                          textAlign: "center",
                        }}
                      >
                        Welcome Back !
                      </h3>
                      <p
                        style={{
                          color: "#3f89ec",
                          fontSize: "15px",
                          lineHeight: "1.6",
                          textAlign: "center",
                        }}
                      >
                        Sign in to continue managing your PSAGE account.
                      </p>
                    </div>

                    {/* <div className="text-center">
                      <img
                        src={profile}
                        alt=""
                        className="img-fluid"
                        style={{
                          maxHeight: "230px",
                          objectFit: "contain",
                        }}
                      />
                    </div> */}
                    <div
                      className="text-center"
                      style={{
                        marginTop: "-20px",
                        marginBottom: "10px",
                        overflow: "visible",
                      }}
                    >
                      <img
                        src={profile}
                        alt=""
                        style={{
                          width: "145%",
                          maxWidth: "5020px",
                          height: "auto",
                          objectFit: "contain",
                          transformOrigin: "center bottom",
                        }}
                      />
                    </div>
                  </Col>

                  <Col md={7}>
                    <CardBody
                      style={{
                        padding: "45px 42px",
                      }}
                    >
                      <div className="text-center mb-4">
                        <Link to="/" className="auth-logo-dark">
                          <span
                            className="bg-light d-inline-flex align-items-center justify-content-center shadow"
                            style={{
                              width: "96px",
                              height: "96px",
                              borderRadius: "24px",
                              border: "6px solid #fff",
                              marginBottom: "22px",
                            }}
                          >
                            <img
                              src={logo}
                              alt=""
                              style={{
                                width: "78px",
                                height: "78px",
                                borderRadius: "18px",
                                objectFit: "cover",
                              }}
                            />
                          </span>
                        </Link>

                        <h4 style={{ fontWeight: "800", color: "#343a40" }}>
                          Login
                        </h4>
                        <p style={{ color: "#74788d", fontSize: "14px" }}>
                          Enter your username and password
                        </p>
                      </div>

                      <Form
                        className="form-horizontal"
                        onSubmit={(e) => {
                          e.preventDefault();
                          validation.handleSubmit();
                          return false;
                        }}
                      >
                        {error && <Alert color="danger">{error}</Alert>}

                        <div className="mb-3">
                          <Label
                            className="form-label"
                            style={{ fontWeight: "600" }}
                          >
                            Username
                          </Label>
                          <Input
                            name="username"
                            className="form-control"
                            placeholder="Enter Your Username"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.username}
                            invalid={
                              validation.touched.username &&
                              validation.errors.username
                            }
                            style={{
                              height: "48px",
                              borderRadius: "14px",
                              backgroundColor: "#f8fbff",
                              border: "1px solid #dbeafe",
                              paddingLeft: "15px",
                            }}
                          />
                          {validation.touched.username &&
                            validation.errors.username ? (
                            <FormFeedback type="invalid">
                              {validation.errors.username}
                            </FormFeedback>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <Label
                            className="form-label"
                            style={{ fontWeight: "600" }}
                          >
                            Password
                          </Label>
                          {/* <Input
                            name="password"
                            autoComplete="off"
                            value={validation.values.password}
                            type="password"
                            placeholder="Enter Password"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={
                              validation.touched.password &&
                              validation.errors.password
                            }
                            style={{
                              height: "48px",
                              borderRadius: "14px",
                              backgroundColor: "#f8fbff",
                              border: "1px solid #dbeafe",
                              paddingLeft: "15px",
                            }}
                          /> */}
                          <div style={{ position: "relative" }}>
                            <Input
                              name="password"
                              autoComplete="off"
                              value={validation.values.password}
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter Password"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              invalid={
                                validation.touched.password &&
                                validation.errors.password
                              }
                              style={{
                                height: "48px",
                                borderRadius: "14px",
                                backgroundColor: "#f8fbff",
                                border: "1px solid #dbeafe",
                                paddingLeft: "15px",
                                paddingRight: "45px",
                              }}
                            />

                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{
                                position: "absolute",
                                right: "14px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                color: "#74788d",
                                fontSize: "18px",
                                zIndex: 5,
                              }}
                            >
                              <i className={showPassword ? "bx bx-hide" : "bx bx-show"} />
                            </button>
                          </div>
                          {validation.touched.password &&
                            validation.errors.password ? (
                            <FormFeedback type="invalid">
                              {validation.errors.password}
                            </FormFeedback>
                          ) : null}
                        </div>

                        <div className="mt-4 d-grid">
                          <button
                            className="btn btn-primary btn-block"
                            type="submit"
                            style={{
                              backgroundColor: "#329ff2",
                              borderColor: "#007bff",
                              height: "50px",
                              borderRadius: "14px",
                              fontWeight: "800",
                              fontSize: "15px",
                              boxShadow:
                                "0 10px 22px rgba(50, 159, 242, 0.32)",
                            }}
                          >
                            Log In
                          </button>
                        </div>
                      </Form>
                    </CardBody>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <ToastContainer />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default withRouter(Login);
