import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";

import submitIcon from "../../assets/icon-check-full.png";
import documentIcon from "../../assets/icon-docu-fluid.png";
import toiletPaperCheckEmpty from "../../assets/toilet-paper-check-empty.png";
import toiletPaperCheckFull from "../../assets/toilet-paper-check-full.png";
import editReview from "../../common/api/editReview";
import getReview from "../../common/api/getReview";
import { fetchS3Url, uploadImageToS3 } from "../../common/api/s3";
import saveReview from "../../common/api/saveReview";
import ButtonFull from "../../common/components/buttons/ButtonFull";
import ButtonSmall from "../../common/components/buttons/ButtonSmall";
import HeaderSub from "../../common/components/headers/HeaderSub";
import Modal from "../../common/components/modal/Modal";
import StarContainer from "../../common/components/starContainer/StarContainer";
import { COLOR } from "../../common/util/constants";

const StyledDiv = styled.div`
  position: relative;
  width: 100%;
  min-height: calc(100vh - 5rem);
  display: flex;
  flex-direction: column;
  background-color: black;

  .title {
    color: ${COLOR.LIGHT_GOLD};
  }
`;

const StyledMain = styled.main`
  overflow-y: scroll;
  overflow-x: hidden;
  height: 95%;
  padding: 0 5%;

  .test {
    width: 50%;
  }

  .image-upload-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: ${COLOR.GREY};

    p {
      text-align: center;
    }
  }

  .image-upload-button {
    width: 100%;
    height: 50px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    font-size: large;
    color: white;
    background-color: ${COLOR.HEAVY_GOLD};
    border-radius: 8px;

    .icon {
      margin-right: 0.5rem;
    }

    input {
      display: none;
    }

    label {
      display: flex;
      justify-content: center;
      box-sizing: border-box;
      padding: 10px;
      width: 100%;
      height: 100%;
      cursor: pointer;
    }
  }

  button {
    border: none;
  }

  button:last-child {
    width: 112%;
    border-top: 1px solid ${COLOR.LINE};
    margin: 0 -6%;
  }

  textarea {
    box-sizing: border-box;
    width: 100%;
    min-height: 10rem;
    resize: none;
    font-family: inherit;
    font-size: inherit;
    margin-bottom: 1rem;
    padding: 0.5rem;

    ::placeholder {
      font-size: medium;
    }
  }
`;

const UploadedImageContainer = styled.div`
  width: 100%;
  height: 13rem;
  margin-bottom: 1rem;
  background-image: url(${(props) => props.imageSrc});
  background-size: contain;
  background-repeat: no-repeat;
  display: flex;
  justify-content: center;

  img {
    max-width: 100%;
    max-height: 100%;
  }
`;

const StarInput = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  color: ${COLOR.GREY};
  margin: 0 auto;
  font-size: 1.5rem;
`;

const ToiletPaperCheckContainer = styled.div`
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  color: ${COLOR.HEAVY_GOLD};
  margin-top: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid ${COLOR.LINE};

  .check-image-container {
    width: 5%;
    height: 5%;
  }

  img {
    width: 100%;
    height: 100%;
  }
`;

function ReviewEdit() {
  const [enteredRating, setEnteredRating] = useState(1);
  const [enteredToiletPaper, setEnteredToiletPaper] = useState(false);
  const [enteredText, setEnteredText] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [existingReview, setExistingReview] = useState(null);

  const { reviewId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { toilet } = location.state;
  const uploadedImageSrc =
    uploadedImage?.constructor.name === "File"
      ? URL.createObjectURL(uploadedImage)
      : uploadedImage;

  useEffect(() => {
    const controller = new AbortController();

    if (reviewId) {
      (async () => {
        try {
          setExistingReview(reviewId);

          const response = await getReview(reviewId);
          const isImage = response.image !== "none";

          if (isImage) {
            setUploadedImage(response.image);
          }

          setEnteredRating(response.rating);
          setEnteredText(response.description);
          setEnteredToiletPaper(response.isToiletPaper);
        } catch {
          setContentAndShowModal(
            <>
              <div>????????? ???????????? ???????????????...</div>
              <ButtonSmall type="button" onClick={() => navigate(-1)}>
                ????????????
              </ButtonSmall>
            </>
          );
        }
      })();
    }

    return () => {
      controller.abort();
    };
  }, [navigate, reviewId]);

  function starClickHandler(starNumber) {
    setEnteredRating(starNumber);
  }

  function handleToiletPaperCheckClick() {
    setEnteredToiletPaper((state) => !state);
  }

  function handleTextAreaInput(event) {
    setEnteredText(event.target.value);
  }

  function handleImageUpload(event) {
    setUploadedImage(event.target.files[0]);
  }

  function handleModalCloseClick() {
    setModalContent("");
    setShowModal(false);
  }

  function setContentAndShowModal(content) {
    setModalContent(content);
    setShowModal(true);
  }

  async function handleSubmitClick() {
    if (!enteredText.trim().length || enteredText.trim().length > 300) {
      setContentAndShowModal("????????? 1??? ?????? 300??? ???????????? ?????????.");
      return;
    }

    try {
      const s3UploadUrl = await fetchS3Url();
      let imageUrl;

      if (uploadedImage) {
        const isUploadedImagePlainImageURL =
          typeof uploadedImage === "string" &&
          uploadedImage.startsWith("https");

        if (isUploadedImagePlainImageURL) {
          imageUrl = uploadedImage;
        } else {
          imageUrl = await uploadImageToS3(s3UploadUrl, uploadedImage);
        }
      } else {
        imageUrl = "none";
      }

      const payload = {
        toilet,
        rating: enteredRating,
        description: enteredText,
        image: imageUrl,
        isToiletPaper: enteredToiletPaper,
        updatedAt: new Date().toISOString(),
      };

      if (existingReview) {
        await editReview(existingReview, payload);
      } else {
        await saveReview(payload);
      }

      setContentAndShowModal(
        <>
          <div>????????? ??????!</div>
          <ButtonSmall type="button" onClick={() => navigate(-1)}>
            ????????????
          </ButtonSmall>
        </>
      );
    } catch (error) {
      setContentAndShowModal("????????? ??????... ????????? ?????? ????????? ?????????");
    }
  }

  return (
    <StyledDiv>
      {showModal && (
        <Modal onModalCloseClick={handleModalCloseClick}>{modalContent}</Modal>
      )}
      <HeaderSub />
      <StyledMain>
        <h1 className="title">
          {!existingReview && "?????? ?????????"}
          {existingReview && "?????? ?????????"}
        </h1>
        <StarInput>
          ????????? ??????
          <StarContainer
            rating={enteredRating}
            showRatingNumber={false}
            onClick={starClickHandler}
            width="50%"
          />
        </StarInput>
        <ToiletPaperCheckContainer>
          <p>????????? ????????????? ???????????? ??????????????????</p>
          <div
            className="check-image-container"
            onClick={handleToiletPaperCheckClick}
            role="button"
            onKeyDown={handleToiletPaperCheckClick}
            tabIndex={0}
          >
            <img
              src={
                enteredToiletPaper
                  ? toiletPaperCheckFull
                  : toiletPaperCheckEmpty
              }
              alt="toilet-paper-check"
            />
          </div>
        </ToiletPaperCheckContainer>
        <div className="image-upload-container">
          {uploadedImage && (
            <UploadedImageContainer>
              <img src={uploadedImageSrc} alt="uploaded" />
            </UploadedImageContainer>
          )}
          <div className="image-upload-button">
            <label htmlFor="photo-input">
              <img src={documentIcon} alt="upload-icon" />
              {((existingReview && uploadedImage) || uploadedImage) &&
                "????????? ?????? ?????????"}
              {!uploadedImage && "????????? ?????????"}
            </label>
            <input
              type="file"
              id="photo-input"
              onChange={handleImageUpload}
              accept=".png,.jpg,.jpeg"
            />
          </div>
          <p>???????????? 1?????? ????????? ??? ??? ????????????.</p>
        </div>
        <textarea
          placeholder="??? ???????????? ?????? ????????? ???????????????."
          onChange={handleTextAreaInput}
          value={enteredText}
        />
        <ButtonFull icon={submitIcon} onClick={handleSubmitClick}>
          {!existingReview && "?????? ?????????"}
          {existingReview && "?????? ????????????"}
        </ButtonFull>
      </StyledMain>
    </StyledDiv>
  );
}

export default ReviewEdit;
