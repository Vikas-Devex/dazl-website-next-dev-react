/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";

import "./style.css";

import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import Masonry from "@mui/lab/Masonry";
import SaveIcon from "@mui/icons-material/Save";

import {
  bidStatusUpdate,
  mailPdf,
  viewPhdAlt,
} from "../../../../store/dashboard/dashboardSlice";
import { styled } from "@mui/material/styles";
import LinearProgress, {
  linearProgressClasses,
} from "@mui/material/LinearProgress";
import SendIcon from "@mui/icons-material/Send";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { Toastify } from "../../../../services/toastify/toastContainer";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
// import { useParams, useNavigate } from "react-router-dom";

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor:
      theme.palette.grey[theme.palette.mode === "light" ? 200 : 800],
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    backgroundColor: theme.palette.mode === "light" ? "#1a90ff" : "#308fe8",
  },
}));

const ViewPhdAlt = () => {
  const componentRef = useRef();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { itemId } = useParams();
  const selector = useSelector((state) => state.dashboardSlice);
  const viewPhdData = selector?.data?.viewPhdAlt;

  // useEffect(() => {
  //   const handleBackNavigation = (e) => {
  //     e.preventDefault(); // Prevent default back navigation
  //     navigate("/agent/createPhd"); // Redirect to the desired page
  //   };

  //   window.addEventListener("popstate", handleBackNavigation); // Listen for back navigation

  //   return () => {
  //     window.removeEventListener("popstate", handleBackNavigation); // Cleanup event listener
  //   };
  // }, [navigate]);

  useEffect(() => {
    dispatch(viewPhdAlt({ id: itemId, value: "open" }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const [progressBar, setProgressBar] = React.useState(
    viewPhdData?.[0]?.phd_price
  );
  const [allStatus, setStatus] = React.useState(["Bid", "D.I.Y", "Pass"]);
  const [progressBarpre, setProgressbarpre] = React.useState(
    viewPhdData?.[0]?.pre_price
  );

  const [pdfGenerating, setPdfGenerating] = useState(false);

  const [currentStatus, setCurrentStatus] = useState("Pass");

  const [progressBars, setProgressBars] = useState({});

  useEffect(() => {
    if (viewPhdData?.[0]?.roominfo) {
      const initialProgressBars = {};

      // Iterate over each room
      viewPhdData[0]?.roominfo?.forEach((room) => {
        // Iterate over each feature in the room
        room.feature.forEach((feature) => {
          initialProgressBars[feature?.feature_id] = feature?.phd_price;
        });
      });

      setProgressBars(initialProgressBars);
    }
  }, [viewPhdData]);

  const mainPrice = viewPhdData?.[0]?.phd_price;
  const onchangeStatus = (status, room, feature_id) => {
    dispatch(
      bidStatusUpdate({
        id: viewPhdData[0]?.project_id,
        status: status,
        room: room,
        feature_id: feature_id,
      })
    )
      .unwrap()
      .then(() => {
        dispatch(viewPhdAlt({ id: itemId, value: "open" }))
          .unwrap()
          .then(() => {
            const updatedProgressBars = { ...progressBars };

            viewPhdData[0].roominfo.forEach((room) => {
              room.feature.forEach((feature) => {
                if (feature.feature_id === feature_id) {
                  if (status === "Bid") {
                    updatedProgressBars[feature_id] = Number(mainPrice) + 100;
                  } else if (status === "Pass") {
                    updatedProgressBars[feature_id] =
                      Number(mainPrice) - 100000;
                  } else if (status === "D.I.Y") {
                    updatedProgressBars[feature_id] = Number(mainPrice);
                  }
                }
              });
            });
            setProgressBars(updatedProgressBars);
          });
      });
  };

  const convertToPdf = async () => {
    if (!componentRef.current) return;

    // Temporarily store the current JSX
    const originalContent = componentRef.current.innerHTML;

    // Remove the buttons from the DOM
    const downloadPdfButton = document.getElementById("downloadPdfButton");
    const sendEmailButton = document.getElementById("sendEmailButton");
    downloadPdfButton.remove();
    sendEmailButton.remove();

    // Generate the PDF
    const input = componentRef.current;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: [input.offsetWidth, input.offsetHeight],
    });

    try {
      const canvas = await html2canvas(input, { useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, input.offsetWidth, input.offsetHeight);

      // Dispatch the mailPdf action with name, email, and PDF File object
      const pdfBlob = pdf.output("blob");

      dispatch(
        mailPdf({
          firstName: viewPhdData[0].customer.first_name,
          lastName: viewPhdData[0].customer.last_name,
          email: viewPhdData[0].customer.email,
          pdfData: pdfBlob,
        })
      );
      componentRef.current.innerHTML = originalContent;
    } catch (error) {
      console.error("Error generating PDF:", error);
      componentRef.current.innerHTML = originalContent;
    }
    Toastify({
      data: "success",
      msg: "Project shared via Email  successfully",
    });
  };

  const downloadPdf = async () => {
    // const componentRef = useRef(null);

    if (!componentRef.current) return;

    setPdfGenerating(true);

    // Temporarily store the current JSX

    // Generate the PDF
    const input = componentRef.current;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: [input.offsetWidth, input.offsetHeight],
    });

    try {
      setButtonsVisibility(false);
      const canvas = await html2canvas(input, { useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, "");
      pdf.addImage(imgData, "PNG", 0, 0, input.offsetWidth, input.offsetHeight);

      // Save the PDF file
      pdf.save(`phd_report_${timestamp}.pdf`);

      // Restore original content
      componentRef.current.innerHTML = originalContent;
    } catch (error) {
      console.error("Error generating PDF:", error);
      // Restore original content on error
      componentRef.current.innerHTML = originalContent;
    } finally {
      // Ensure buttons are restored
      setButtonsVisibility(true);
      setPdfGenerating(false);
    }
  };
  //   if (!componentRef.current) return;

  //   // Temporarily store the current JSX
  //   const originalContent = componentRef.current.innerHTML;

  //   // Remove the buttons from the DOM
  //   const downloadPdfButton = document.getElementById("downloadPdfButton");
  //   const sendEmailButton = document.getElementById("sendEmailButton");
  //   downloadPdfButton.remove();
  //   sendEmailButton.remove();

  //   // Generate the PDF
  //   const input = componentRef.current;
  //   const pdf = new jsPDF({
  //     orientation: "portrait",
  //     unit: "pt",
  //     format: [input.offsetWidth, input.offsetHeight],
  //   });

  //   try {
  //     const canvas = await html2canvas(input, { useCORS: true });
  //     const imgData = canvas.toDataURL("image/png");
  //     pdf.addImage(imgData, "PNG", 0, 0, input.offsetWidth, input.offsetHeight);

  //     // Dispatch the mailPdf action with name, email, and PDF File object
  //     const pdfBlob = pdf.output("blob");

  //     dispatch(
  //       mailPdf({
  //         firstName: viewPhdData[0].customer.first_name,
  //         lastName: viewPhdData[0].customer.last_name,
  //         email: viewPhdData[0].customer.email,
  //         pdfData: pdfBlob,
  //       })
  //     );
  //     componentRef.current.innerHTML = originalContent;
  //   } catch (error) {
  //     console.error("Error generating PDF:", error);
  //     componentRef.current.innerHTML = originalContent;
  //   }
  // };

  const setButtonsVisibility = (visible) => {
    const downloadPdfButton = document.getElementById("downloadPdfButton");
    const sendEmailButton = document.getElementById("sendEmailButton");
    if (downloadPdfButton)
      downloadPdfButton.style.display = visible ? "block" : "none";
    if (sendEmailButton)
      sendEmailButton.style.display = visible ? "block" : "none";
  };

  // console.log(viewPhdData[0]?.roominfo[0]?.room_id);

  return (
    <div className="center-content p-3">
      <div className="background-image"></div>
      <div
        className="popup1 cs-dialogg-container px-md-4 px-2 pb-md-4 pb-2 w-100 bg-white w-300 rounded-4"
        ref={componentRef}
      >
        <div className="d-flex justify-content-between align-items-center pb-3 border-bottom pt-4">
          <h2 className="fw-normal">PHD Report Summary</h2>

          <div className=" pe-4 me-4">
            <img
              alt="img"
              src="/images/footerImages/footer.png"
              width={"70px"}
            />
          </div>
        </div>

        {viewPhdData?.map((items, index) => {
          const dateString = items?.house?.updated_at;
          const dateObject = new Date(dateString);
          //   setprogressbar(parseInt(items?.phd_price))
          const year = dateObject.getFullYear();
          return (
            <div key={index}>
              <div className="col-inner h-100 bg-image-box2  position-relative rounded-4 mt-4">
                <div className="p-4 h-100 position-relative z-1">
                  <p className="report-detaill d-flex flex-lg-nowrap flex-wrap flex-column flex-md-row align-items-md-center justify-content-between align-items-start">
                    <span className="fw-semibold">Homeowners Name: </span>
                    <span className="w-50">
                      {items?.customer?.first_name +
                        " " +
                        items?.customer?.last_name}
                    </span>
                  </p>
                  <p className="report-detaill d-flex flex-lg-nowrap flex-wrap flex-column flex-md-row align-items-md-center justify-content-between align-items-start">
                    <span className="fw-semibold">Email Address:</span>{" "}
                    <span className="w-50">{items?.customer?.email}</span>
                  </p>
                  <p className="report-detaill d-flex flex-lg-nowrap flex-wrap flex-column flex-md-row align-items-md-center justify-content-between align-items-start mb-0">
                    <span className="fw-semibold">Property Address: </span>
                    <span className="w-50">{items?.house?.address}</span>
                  </p>
                  <div className="report-detaill d-flex flex-lg-nowrap flex-wrap flex-column flex-md-row align-items-md-center justify-content-between align-items-start mb-0">
                    <h3>Dazl Value:</h3>
                    <h3 className="w-50">${viewPhdData[0]?.phd_price}</h3>
                  </div>
                </div>
              </div>
              <div
                className=" shadow p-3 rounded-4 mt-4"
                style={{ backgroundColor: "#000" }}
              >
                <h3 className="text-white">
                  Updated House Details And Condition:-
                </h3>
                <Masonry columns={{ xs: 1, sm: 1, md: 1 }} spacing={2}>
                  {items?.roominfo.map((ele, index) => {
                    const roomId = ele?.room_id;
                    const imagesGroup = items?.images?.filter(
                      (image) => image?.room_id === roomId
                    );
                    return (
                      <div key={index} className="mb-4 col-sm-12">
                        <div className="flex-grow-1 mx-2 bg-custom-red-col bg-white shadow p-3 rounded-4">
                          <div className="d-flex  align-items-center justify-content-between">
                            <h3 className="fw-semibold font-18">
                              {index + 1}.) {ele?.room_name}
                            </h3>

                            <h5 className="text-danger mb-0 me-md-4 me-2 font-16">
                              {ele?.status}
                            </h5>
                          </div>
                          <div>
                            {
                              items.images.filter(
                                (image) => image?.room_id === roomId
                              )[0]?.description
                            }
                          </div>
                          <div className="ps-0 mb-4 mt-2">
                            <div key={index}>
                              <div className="d-flex gap-1 flex-wrap">
                                {/* Display images for the current room_id */}
                                {imagesGroup?.map((image, imageIndex) => (
                                  <div key={imageIndex}>
                                    {image?.url && (
                                      <a
                                        href={image.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <img
                                          alt="img"
                                          src={image.url}
                                          className="object-fit-cover border"
                                          width={"100px"}
                                          height={"100px"}
                                        />
                                      </a>
                                    )}{" "}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          {viewPhdData[0]?.roominfo[0]?.room_id === 7 && (
                            <div className="d-flex align-items-center">
                              <h5 className="mb-0">
                                Has the basement been finished since last
                                listing? -
                              </h5>
                              <h5 className="mb-0">
                                {ele.selectedOptionValue === "yes"
                                  ? "Yes"
                                  : "No"}
                              </h5>
                              {ele.selectedOptionValue === "yes" &&
                              ele.selectedPrice !== "other" ? (
                                <h5>
                                  {ele.selectedPrice && "$" + ele.selectedPrice}
                                </h5>
                              ) : (
                                <h5 className="mb-0 ms-1">
                                  {ele.customPrice &&
                                    "($" + ele.customPrice + ")"}
                                </h5>
                              )}
                            </div>
                          )}
                          {ele?.feature?.length !== 0 &&
                            ele?.feature[0]?.feature_name !== "" && (
                              <div
                                key={index}
                                className="p-3 mt-3 bg-white"
                                style={{
                                  border: "1px solid",
                                  borderColor: "#666",
                                  borderRadius: "10px",
                                  margin: "10px",
                                }}
                              >
                                <h3 className="text-center d-flex mb-3 mt-1">
                                  Buyer Road Blocks:
                                </h3>
                                <div className="row flex-wrap justify-space-between abvc">
                                  {/* <div className="d-flex align-items-center justify-content-between mb-3">
                                  <div className="d-flex gap-1 align-items-center">
                                    Area:
                                    <div className="fw-bolder">
                                      {e?.room_name}
                                    </div>
                                  </div>
                                  <div className="text-danger">{e?.status}</div>
                                </div> */}
                                  {ele?.feature?.map((eleInner, eleindex) => {
                                    return (
                                      <div
                                        className="col-md-4 border-0 border-end"
                                        key={eleindex}
                                      >
                                        <h5 className=" mb-2 ms-2">
                                          {eleInner.feature_name}:
                                        </h5>
                                        <div className="border d-flex align-items-center ps-2 py-3 mb-3 ">
                                          <div>{eleInner?.imageDesc}</div>
                                        </div>
                                        <div className="ps-0 mb-3">
                                          <div className="d-flex gap-1  flex-wrap">
                                            {eleInner?.images?.map(
                                              (image, imageIndex) => (
                                                <div key={imageIndex}>
                                                  <a
                                                    href={image}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                  >
                                                    <img
                                                      alt="img"
                                                      src={image}
                                                      className="object-fit-cover border"
                                                      width={"100px"}
                                                      height={"100px"}
                                                    />
                                                  </a>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </div>
                                        <div
                                          style={{
                                            display: "flex",
                                            gap: "10px",
                                            paddingBottom: "10px",
                                            marginBottom: "10px",
                                          }}
                                        >
                                          {allStatus.map((status) => (
                                            <label
                                              key={status}
                                              className="custom-radio-label"
                                            >
                                              <input
                                                type="radio"
                                                name={`status-${index}-${eleindex}-${status}`}
                                                checked={
                                                  eleInner.bid_status === status
                                                }
                                                onChange={() => {
                                                  onchangeStatus(
                                                    status,
                                                    ele.room_id,
                                                    eleInner.feature_id
                                                  );
                                                  setCurrentStatus(status);
                                                }}
                                              />
                                              <span className=" ">
                                                {status}
                                              </span>
                                            </label>
                                          ))}
                                        </div>
                                        {currentStatus !== "Pass" && (
                                          <div className="pb-3">
                                            <div className="d-flex justify-content-between mt-3 mb-2">
                                              <p className="mb-0">$200k</p>
                                              <p className="mb-0">
                                                $
                                                {progressBar
                                                  ? (
                                                      progressBar / 1000
                                                    ).toFixed(1) + "k"
                                                  : "2M"}
                                              </p>
                                              <p className="mb-0">$2M</p>
                                            </div>
                                            <BorderLinearProgress
                                              variant="determinate"
                                              value={
                                                (progressBars[
                                                  eleInner.feature_id
                                                ] /
                                                  1800) *
                                                100
                                              }
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </Masonry>
              </div>

              <div className="progress-slidee mt-4 bg-white shadow py-3 px-2 rounded-4 d-flex flex-wrap">
                <div className="mb-3 col-12">
                  <div className="border border-dark flex-grow-1 mx-2 p-2">
                    <h3>Preliminary Value/Score</h3>
                    <div>
                      <div className="d-flex justify-content-between mt-3 mb-2">
                        <p className="mb-0">$200k</p>
                        <p className="mb-0">
                          $
                          {progressBarpre
                            ? (progressBarpre / 1000).toFixed(1) + "k"
                            : "2M"}
                        </p>
                        <p className="mb-0">$2M</p>
                      </div>
                      <BorderLinearProgress
                        variant="determinate"
                        value={(progressBarpre / 1800000) * 100}
                      />
                    </div>
                  </div>
                </div>
                <div className="mb-3 col-12">
                  <div className="border border-dark flex-grow-1 mx-2 p-2">
                    <h3>phd Value/Score</h3>
                    <div>
                      <div className="d-flex justify-content-between mt-3 mb-2">
                        <p className="mb-0">$200k</p>
                        <p className="mb-0">
                          ${" "}
                          {progressBarpre
                            ? (progressBarpre / 1000).toFixed(1) + "k"
                            : "2M"}
                        </p>
                        <p className="mb-0">$2M</p>
                      </div>
                      <BorderLinearProgress
                        variant="determinate"
                        value={(progressBarpre / 1800000) * 100}
                      />
                    </div>
                  </div>
                </div>
                <div className="mb-3 col-12">
                  <div className="border border-dark flex-grow-1 mx-2 p-2">
                    <h3>DAZL Value/Score</h3>
                    <div>
                      <div className="d-flex justify-content-between mt-3 mb-2">
                        <p className="mb-0">$200k</p>
                        <p className="mb-0">
                          $
                          {progressBar
                            ? (progressBar / 1000).toFixed(1) + "k"
                            : "2M"}
                        </p>
                        <p className="mb-0">$2M</p>
                      </div>
                      <BorderLinearProgress
                        variant="determinate"
                        value={(progressBar / 1800000) * 100}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="progress-slidee mt-4 bg-white shadow py-3 px-3 rounded-4 d-flex flex-wrap">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: "bold", fontSize: 30 }}>
                    Service Pro Replies:
                  </div>
                  <div style={{ fontWeight: "bold", fontSize: 20 }}>
                    You have{" "}
                    {viewPhdData?.[0]?.projectOpportunityReplies.length} replies
                  </div>
                </div>
                {viewPhdData?.[0]?.projectOpportunityReplies.map(
                  (opportunity, index) => (
                    <div
                      key={index}
                      className="mb-3 col-12 d-flex border border-dark flex-grow-1 px-3 py-2"
                    >
                      <div className="col-5">
                        <div>
                          {opportunity?.professional?.first_name}{" "}
                          {opportunity?.professional?.last_name}
                        </div>
                        <div>
                          {opportunity?.professional?.company_street_address},{" "}
                          {opportunity?.professional?.company_city},{" "}
                          {opportunity?.professional?.state},{" "}
                          {opportunity?.professional?.zip_code}
                        </div>
                        <div>{opportunity?.professional?.email}</div>
                        <div>{opportunity?.professional?.phone_number}</div>
                        <div>
                          <a href={`/profile/${opportunity?.professional_id}`}>
                            View Profile
                          </a>
                        </div>
                      </div>
                      <div className="col-6">
                        <div>Re: Address</div>
                        <div className="mt-1 gap-4">
                          <div className="d-flex gap-1">
                            <div>
                              <input
                                type="checkbox"
                                id="checkbox"
                                checked={opportunity.is_interested === 1}
                              />
                            </div>
                            <span className="fw-bold fs-6"> YES </span>, I'm
                            interseted.
                          </div>
                          <div className="d-flex gap-1">
                            <div>
                              <input
                                type="checkbox"
                                id="checkbox"
                                checked={opportunity.is_interested !== 1}
                              />
                            </div>
                            <span className="fw-bold fs-6"> NO </span>, I'm not
                            interseted.{" "}
                          </div>
                        </div>
                        <div className="d-flex gap-1 flex-wrap">
                          <div style={{ fontWeight: "bold" }}>Message: </div>
                          <div>{opportunity.message}</div>
                        </div>
                      </div>
                      <div
                        className="col-1"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: "red",
                              padding: 4,
                              borderRadius: "50%", // Set borderRadius to 50% for a circular shape
                              width: 40, // Specify width (adjust as needed)
                              height: 40, // Specify height (adjust as needed)
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <SendIcon />
                          </div>
                          <div>Reply</div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: "lightblue",
                              padding: 4,
                              borderRadius: "50%", // Set borderRadius to 50% for a circular shape
                              width: 40, // Specify width (adjust as needed)
                              height: 40, // Specify height (adjust as needed)
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <SaveIcon />
                          </div>
                          <div>Save</div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
              <div className="d-flex justify-content-end gap-4">
                <button
                  id="downloadPdfButton"
                  type="submit"
                  className="d-flex items-center btn btn-primary mt-4 mb-2 gap-2"
                  onClick={downloadPdf}
                  disabled={pdfGenerating}
                >
                  {pdfGenerating ? "Generating PDF..." : "Download Pdf"}{" "}
                  <PictureAsPdfIcon />
                </button>
                <button
                  id="sendEmailButton"
                  type="submit"
                  className="d-flex items-center btn btn-primary mt-4 mb-2 gap-2"
                  onClick={convertToPdf}
                >
                  Send {<SendIcon />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ViewPhdAlt;
