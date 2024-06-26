import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Pagination from "@mui/material/Pagination";
import SaveIcon from "@mui/icons-material/Save";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Stack from "@mui/material/Stack";
import CommonRoomform from "../commonForm/commonRoomForm";
import "./project.css";
import { useLocation } from "react-router-dom";
import {
  viewPhd,
  getCompletePhd,
  // getSavedPhd,
  openConfirmPopup,
  addAnotherRoom,
  deleteAgentFeatures,
  deleteProjectFeatures,
  getAgentProject,
  getCustomerProject,
  updateAgentFeatures,
  updateReportFeatures,
} from "../../../store/dashboard/dashboardSlice";
import SendIcon from "@mui/icons-material/Send";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate } from "react-router-dom";
import CheckIcon from "@mui/icons-material/Check";
import AddIcon from "@mui/icons-material/Add";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { Toastify } from "../../../services/toastify/toastContainer";
import ModalImage from "react-modal-image";
const MyProject = () => {
  const [show, setShow] = React.useState(false);

  const [selectValue, setSelectvalue] = React.useState("");

  const [editItem, setEditItem] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
  });
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const closeViewer = () => {
    setIsViewerOpen(false);
  };
  const userType = localStorage.getItem("userType");
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const selector = useSelector((state) => state.dashboardSlice);
  const projectData =
    userType === "agent"
      ? selector.data.agentProjectData
      : selector.data.customerprojectData;
  const itemsPerPage = 5;
  const totalCount = projectData?.totalCount;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (projectData?.length === 0) {
      if (location.pathname === "/homeOwner/my-project") {
        dispatch(getCustomerProject({ pageNo: 1, numberofdata: 5 }));
      } else {
        dispatch(getAgentProject({ pageNo: 1, numberofdata: 5 }));
      }
    }
  }, [projectData, location]);
  const handlePageChange = (event, value) => {
    if (location.pathname === "/homeOwner/my-project") {
      setPageNumber(value);
      dispatch(getCustomerProject({ pageNo: value, numberofdata: 5 }));
    } else {
      dispatch(getAgentProject({ pageNo: value, numberofdata: 5 }));
    }
  };

  const onChangeEdit = (item) => {
    setFormData((prevData) => ({
      ...prevData,
      ["title"]: item?.inspectionNotes,
    }));
    setEditItem(item?.feature_id);
    setFormData((prevData) => ({
      ...prevData,
      ["photo"]: item?.photos,
    }));
    setEditImage(item?.images);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (item, project_id) => {
    //e.preventDefault();
    // Access the form data for further processing
    const data = {
      feature_id: item?.feature_id,
      images: item?.images,
      inspectionNotes: formData.title,
      photos: formData.photo,
    };
    if (location.pathname === "/homeOwner/my-project") {
      dispatch(
        updateReportFeatures({
          data: data,
          project_id: project_id,
          pageNo: pageNumber,
          numberofdata: 5,
        })
      )
        .unwrap()
        .then(() =>
          dispatch(getCustomerProject({ pageNo: 1, numberofdata: 5 }))
        );
      setEditItem(null);
    } else {
      dispatch(
        updateAgentFeatures({
          data: data,
          project_id: project_id,
          pageNo: pageNumber,
          numberofdata: 5,
        })
      );
      setEditItem(null);
    }
  };

  const deleteProject = (projectId, housingSegmentId) => {
    if (location.pathname === "/homeOwner/my-project") {
      dispatch(
        deleteProjectFeatures({
          projectId,
          housingSegmentId,
          pageNo: pageNumber,
          numberofdata: 5,
        })
      );
    } else {
      dispatch(
        deleteAgentFeatures({
          projectId,
          housingSegmentId,
          pageNo: pageNumber,
          numberofdata: 5,
        })
      );
    }
  };

  const [projectInfo, setprojectInfo] = useState("");

  const roomId = localStorage.getItem("roomId");
  // const selector = useSelector((state) => state.dashboardSlice);
  const phdRooms = selector.data.phdRoomsData;
  const [selectedImages, setSelectedImages] = React.useState([]);

  const [ImagesFinal, setImagesFinal] = React.useState(false);
  const [textValues, setTextValues] = React.useState([]);
  const [checkboxValues, setCheckboxValues] = React.useState(
    Array(phdRooms?.length).fill(false)
  );

  const addAnother = (roomId, project_id) => {
    setImagesFinal(true);
    localStorage.setItem("roomId", roomId);
    localStorage.setItem("projectID", project_id);
    if (selectedImages.length === 0) {
      // Collect checkbox IDs and descriptions for the selected checkboxes
      const selectedCheckboxes = checkboxValues
        .map((isChecked, index) => {
          if (isChecked) {
            return {
              checkboxId: phdRooms[index].id, // Assuming phdRooms contains the ids
              description: textValues[index] || "", // Include description if provided
            };
          }
          return null;
        })
        .filter((item) => item !== null);
      if (selectedCheckboxes.length > 0) {
        // Dispatch room ID and selected checkboxes (checkboxId and descriptions) when no images are selected
        selectedCheckboxes.forEach((item) => {
          dispatch(
            addAnotherRoom({
              roomId,
              project_id,
              features: item.checkboxId,
              inspectionNotes: item.description,
            })
          )
            .unwrap()
            .then((response) => {
              setShow(false);
              setSelectvalue("");
              setCheckboxValues(Array(phdRooms?.length).fill(false));
              setTextValues([]);
              Toastify({
                data: "success",
                msg: "Room saved with selected checkboxes and descriptions. You can add more.",
              });
            });
        });
      } else {
        // If no checkboxes are selected, just dispatch the room ID
        console.log("called");
        dispatch(addAnotherRoom({ roomId, project_id }))
          .unwrap()
          .then((response) => {
            setShow(false);
            setSelectvalue("");
            setCheckboxValues(Array(phdRooms?.length).fill(false));
            setTextValues([]);
            Toastify({
              data: "success",
              msg: "Room saved without images or checkboxes. You can add more.",
            });
            // navigate("/agent/createProject");
            // navigate("/homeOwner/create-project");

            if (location.pathname === "/agent/my-project") {
              navigate("/agent/createProject");
            } else {
              navigate("/homeOwner/create-project");
            }
          });
      }
    } else {
      // Process selected images and room ID as in the original code
      selectedImages.forEach((item) => {
        dispatch(addAnotherRoom(item))
          .unwrap()
          .then((response) => {
            setShow(false);
            setSelectvalue("");
            setCheckboxValues(Array(phdRooms?.length).fill(false));
            setTextValues([]);
            reset({ photos: [] });
          });
      });
      Toastify({
        data: "success",
        msg: "Your item is saved, now you can add more.",
      });
      navigate("/agent/createProject");
      // navigate("/homeOwner/create-project");
    }

    setSelectedImages([]);
  };

  return (
    <div className="py-0">
      <div className="">
        <h2 className="h3 text-uppercase text-start mb-4 pb-4 border-bottom">
          My Projects
        </h2>
        <div className="">
          {/* <div className="mb-4">
            <div className="row pb-3">
              <div className="col-md-6 text-start">
                <h5>
                  <span className="fw-semibold">Homeowner Name:</span>{" "}
                  {projectData?.customer_data?.owner_name ?? ""}
                </h5>
              </div>
              <div className="col-md-6 text-start">
                <h5>
                  <span className="fw-semibold">Email Address:</span>{" "}
                  {projectData?.customer_data?.email_address ?? ""}
                </h5>
              </div>
              <div className="col-md-6 text-start">
                <h5>
                  <span className="fw-semibold">Phone Number:</span>{" "}
                  {projectData?.customer_data?.phone_number ?? ""}{" "}
                </h5>
              </div>
              <div className="col-md-6 text-start">
                <h5>
                  <span className="fw-semibold">Zip Code:</span>{" "}
                  {projectData?.customer_data?.zip_code ?? ""}
                </h5>
              </div>
            </div>
          </div> */}

          <div className="">
            <div className="d-flex flex-wrap">
              {projectData?.data?.length > 0
                ? projectData.data.map((items, dataIndex) => (
                    <div
                      class="column-count-item w-100 mb-0 m-3 p-2"
                      key={dataIndex}
                    >
                      <div className="grid-item rounded-4 p-0 border-0 mb-4">
                        <div className="d-flex justify-content-between">
                          <h4 className="text-start my-projects-head d-flex">
                            <div className="text-dark me-1">Project Name: </div>{" "}
                            {items?.project_name}
                          </h4>
                          <div>
                            <button
                              type="submit"
                              className="btn btn-danger"
                              onClick={() =>
                                addAnother(
                                  items.roominfo[0].room_id,
                                  items.project_id
                                )
                              }
                            >
                              Add another room
                            </button>
                            <button
                              className="btn btn-outline-danger m-1 btn-sm"
                              onClick={() => {
                                setprojectInfo(items);
                                setShowModal(true);
                              }}
                            >
                              <DeleteForeverIcon />
                              <span className="del">Delete Project</span>
                            </button>
                          </div>
                        </div>
                        <div className="d-flex flex-column gap-4 rounded-4 p-4 border mb-4">
                          {items?.roominfo?.map(
                            (roominfoItems, indexroomInfo) => {
                              return (
                                <div key={indexroomInfo}>
                                  <h4 className="text-start my-projects-head d-flex">
                                    {roominfoItems?.room_name}
                                  </h4>

                                  <div className="d-flex flex-row flex-wrap rounded-4 mb-4">
                                    {roominfoItems.feature?.map(
                                      (item, index) => (
                                        <div
                                          key={index}
                                          className="col-4 border m-2 p-2"
                                          width="200px"
                                        >
                                          <div>
                                            <div className="d-flex justify-content-between">
                                              <p className="item-nammeee fw-bold text-start fs-4">
                                                {item?.feature_name}
                                              </p>
                                              <div className="ed-del-icons-div">
                                                {item?.feature_id ===
                                                editItem ? (
                                                  <button
                                                    className="btn btn-outline-success mx-1 btn-sm"
                                                    onClick={() =>
                                                      handleSubmit(
                                                        item,
                                                        items?.project_id
                                                      )
                                                    }
                                                  >
                                                    <CheckIcon />
                                                  </button>
                                                ) : (
                                                  <button
                                                    className="btn btn-outline-dark mx-1 btn-sm"
                                                    onClick={() =>
                                                      onChangeEdit(item)
                                                    }
                                                  >
                                                    <EditIcon />
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                            <div className="mt-2 text-start images-project-all px-0 me-0">
                                              {item?.feature_id === editItem ? (
                                                <div className="input-mt mt-1">
                                                  <input
                                                    type="text"
                                                    name="title"
                                                    value={formData.title}
                                                    onChange={handleChange}
                                                    className="form-control"
                                                  />
                                                </div>
                                              ) : (
                                                <p className="notessss text-start">
                                                  {item?.inspectionNotes}
                                                </p>
                                              )}
                                              <div className="row mt-2 row-cols-lg-4 row-cols-md-3 row-cols-sm-2 row-cols-1 d-flex flex-wrap pe-0">
                                                {item?.images?.map(
                                                  (img, index) => (
                                                    <div
                                                      key={index}
                                                      style={{
                                                        width: "200px",
                                                      }}
                                                    >
                                                      <ModalImage
                                                        small={img}
                                                        large={img}
                                                        alt="Full Size"
                                                        hideDownload={true}
                                                        isOpen={isViewerOpen}
                                                        onClose={closeViewer}
                                                        className="m-2"
                                                      />
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          {/* <div className="ed-del-icons ">
                                        <div className="ed-del-icons-div">
                                          {item?.feature_id === editItem ? (
                                            <button
                                              className="btn btn-success text-white"
                                              onClick={() =>
                                                handleSubmit(
                                                  item,
                                                  items?.project_id
                                                )
                                              }
                                            >
                                              <EditIcon />
                                              {"SAVE"}
                                            </button>
                                          ) : (
                                            <button
                                              className="btn btn-dark text-white"
                                              onClick={() => onChangeEdit(item)}
                                            >
                                              <EditIcon />
                                              {"EDIT"}
                                            </button>
                                          )}
                                        </div>
                                        <div className="ed-del-icons-div me-0">
                                          <button
                                            className="btn btn-danger"
                                            onClick={() =>
                                              deleteProject(
                                                items.project_id,
                                                items.housing_segment_id
                                              )
                                            }
                                          >
                                            <DeleteForeverIcon />
                                            <span className="del">DELETE</span>
                                          </button>
                                          <button
                                            className="btn btn-outline-danger mx-1 btn-sm"
                                            onClick={() =>
                                              dispatch(openConfirmPopup(true))
                                            }
                                          >
                                            <DeleteForeverIcon />
                                            <span className="del">DELETE</span>
                                          </button>
                                        </div>
                                      </div> */}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          )}
                          <div className="progress-slidee bg-white shadow p-3 border rounded-4 d-flex flex-wrap">
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                width: "100%",
                                alignItems: "center",
                              }}
                            >
                              <div
                                style={{
                                  // fontWeight: "bold",
                                  fontSize: 30,
                                  color: "#dc3545",
                                }}
                              >
                                Service Pro Replies:
                              </div>
                              <div
                                style={{
                                  fontWeight: "bold",
                                  fontSize: 20,
                                }}
                              >
                                You have{" "}
                                {
                                  projectData.data?.[dataIndex]
                                    ?.projectOpportunityReplies.length
                                }{" "}
                                replies
                              </div>
                            </div>
                            {projectData.data?.[
                              dataIndex
                            ]?.projectOpportunityReplies.map(
                              (opportunity, index) => (
                                <div
                                  key={index}
                                  className="mb-3 col-12 mt-2 d-flex border-top border-secondary flex-grow-1 px-3 py-2"
                                >
                                  <div className="col-6">
                                    <div
                                      style={{
                                        fontWeight: "bold",
                                        textTransform: "uppercase",
                                      }}
                                    >
                                      {opportunity?.professional?.first_name}{" "}
                                      {opportunity?.professional?.last_name}
                                    </div>
                                    <div>
                                      {
                                        opportunity?.professional
                                          ?.company_street_address
                                      }
                                      ,{" "}
                                      {opportunity?.professional?.company_city},{" "}
                                      {opportunity?.professional?.state},{" "}
                                      {opportunity?.professional?.zip_code}
                                    </div>
                                    <div>
                                      {opportunity?.professional?.email}
                                    </div>
                                    <div>
                                      {opportunity?.professional?.phone_number}
                                    </div>
                                    <div>
                                      <a
                                        href={`/profile/${opportunity?.professional_id}`}
                                        style={{
                                          textDecoration: "underline",
                                        }}
                                      >
                                        View Profile
                                      </a>
                                    </div>
                                  </div>
                                  <div className="col-6">
                                    <div
                                      style={{
                                        fontWeight: "bold",
                                        textTransform: "uppercase",
                                        color: "#dc3545",
                                      }}
                                    >
                                      Re: Address
                                    </div>
                                    <div className="mt-1 gap-4">
                                      <div className="d-flex gap-1">
                                        <div>
                                          <input
                                            type="checkbox"
                                            id="checkbox"
                                            checked={
                                              opportunity.is_interested === 1
                                            }
                                          />
                                        </div>
                                        <span className="fw-bold fs-6">
                                          {" "}
                                          YES{" "}
                                        </span>
                                        , I'm interseted.
                                      </div>
                                      <div className="d-flex gap-1">
                                        <div>
                                          <input
                                            type="checkbox"
                                            id="checkbox"
                                            checked={
                                              opportunity.is_interested !== 1
                                            }
                                          />
                                        </div>
                                        <span className="fw-bold fs-6">
                                          {" "}
                                          NO{" "}
                                        </span>
                                        , I'm not interseted.{" "}
                                      </div>
                                    </div>
                                    <div className="d-flex gap-1 flex-wrap">
                                      <div
                                        style={{
                                          fontWeight: "bold",
                                        }}
                                      >
                                        Message:{" "}
                                      </div>
                                      <div>{opportunity.message}</div>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                : ""}
            </div>
            {projectData?.data?.length === 0 && (
              <h5 className=" text-center fs-4 mt-5 border-bottom ">
                No Record Found
              </h5>
            )}
            <div className="d-flex justify-content-center align-items-center mt-5 pagination-cs">
              {projectData?.totalCount > 5 ? (
                <Stack spacing={2}>
                  <Pagination
                    count={totalPages}
                    color="primary"
                    className="pagination"
                    onChange={handlePageChange}
                  />
                </Stack>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center fs-5">
            Are you sure you want to delete this project?
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => {
              deleteProject(
                // projectInfo.project_name,
                projectInfo.project_id,
                projectInfo.housing_segment_id
              );
              setShowModal(false);
            }}
            className="px-4"
          >
            Yes
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
            className="px-4"
          >
            No
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
export default MyProject;
