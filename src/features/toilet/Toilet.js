import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";

import docuIcon from "../../assets/icon-docu-fluid.png";
import helpIcon from "../../assets/icon-help-fluid.png";
import squaredSOS from "../../assets/icon-squaredsos.svg";
import waitIcon from "../../assets/icon-wait-fluid.png";
import getLiveChatByToilet from "../../common/api/getLiveChatByToilet";
import getToiletById from "../../common/api/getToiletById";
import ButtonDefault from "../../common/components/buttons/ButtonDefault";
import ButtonFluid from "../../common/components/buttons/ButtonFluid";
import ButtonSmall from "../../common/components/buttons/ButtonSmall";
import HeaderSub from "../../common/components/headers/HeaderSub";
import ListDefault from "../../common/components/lists/ListDefault";
import Modal from "../../common/components/modal/Modal";
import ReviewCard from "../../common/components/reviewCard/ReviewCard";
import StarContainer from "../../common/components/starContainer/StarContainer";
import Title from "../../common/components/Title";
import { COLOR } from "../../common/util/constants";
import mockLoadingToiletData from "../../common/util/mocks/mockLoadingToiletData";
import {
  chatStatusOptions,
  createdChatroom,
  errorChecked,
  socketStatusOptions,
  userEnteredChatroom,
} from "../chat/chatSlice";
import { visitedToiletComponent } from "../login/loginSlice";

const StyledToilet = styled.div`
  width: 100%;
  min-height: calc(100vh - 5rem);
  display: flex;
  flex-direction: column;
  background-color: black;
  color: white;

  .title-container {
    padding: 0rem 1rem;
    display: flex;

    .button-container {
      margin-top: 0.5rem;
      display: flex;
    }
  }

  .so-near,
  .so-far {
    padding: 0rem 2.3rem;
    font-size: small;
    color: gray;
    margin-top: -0.8rem;
  }

  .rank-container {
    font-size: large;
    font-weight: 400;
    padding: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
  }

  .toilet-info-container {
    padding: 1rem;
  }

  .toilet-paper-container {
    width: 100%;
    display: flex;
    align-items: center;
  }

  .last-toilet-pater-provide-time {
    width: 100%;
    font-size: small;
    color: gray;
    margin-right: 1rem;
  }

  .review-container {
    padding: 1rem;
  }

  .review-card-container {
    padding: 0.4rem;
  }

  .fluid-button-container {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 4px 0;
    white-space: pre;
  }
`;

function Toilet() {
  const { toiletId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const gotUserLocation = useSelector((state) => state.main.gotUserLocation);
  const nearToilets = useSelector((state) => state.toilet.nearToilets);
  const isLoggedIn = useSelector((state) => state.login.isLoggedIn);
  const chatStatus = useSelector((state) => state.chat.chatStatus);
  const socketStatus = useSelector((state) => state.chat.socketStatus);
  const chatError = useSelector((state) => state.chat.error);
  const chatroomId = useSelector((state) => state.chat.chatroomId);
  const chatroomToiletId = useSelector((state) => state.chat.nameSpace);

  const [reviewList, setReviewList] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [showRescueButton, setShowRescueButton] = useState(false);
  const [toilet, setToilet] = useState(mockLoadingToiletData);
  const [isNear, setIsNear] = useState(false);

  const isChatroomDisconnected = chatStatus === chatStatusOptions.disconnected;
  const isChatroomConnected = chatStatus === chatStatusOptions.connected;
  const isChatroomError = chatStatus === chatStatusOptions.error;
  const isSocketConnected = socketStatus === socketStatusOptions.connected;
  const isMyChatroomInOtherToilet = chatroomToiletId !== toiletId;

  const lastToiletPaperCheckDate =
    dayjs(toilet.latestToiletPaperInfo.lastDate).format("YYYY/MM/DD") ===
    "Invalid Date"
      ? "??? ??? ??????"
      : dayjs(toilet.latestToiletPaperInfo.lastDate).format("YYYY/MM/DD");

  useEffect(() => {
    async function getReviews() {
      try {
        const toiletData = await getToiletById(toiletId);

        setReviewList(toiletData.reviewList);
        setToilet(toiletData);
      } catch (error) {
        setContentAndShowModal(
          <>
            <p>????????? ???????????? ???????????????!</p>
            <p>{`${error.response.data.status} :  ${error.response.data.errMessage}`}</p>
          </>
        );
      }
    }

    getReviews();

    if (nearToilets) {
      for (const nearToilet of nearToilets) {
        if (nearToilet._id === toiletId) setIsNear(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function getAvgRating() {
      if (!reviewList.length) {
        return 0;
      }

      let totalRating = 0;
      reviewList.forEach((review) => {
        totalRating += review.rating;
      });
      return (totalRating / reviewList.length).toFixed(1);
    }
    setAvgRating(getAvgRating());
  }, [reviewList]);

  useEffect(() => {
    async function checkLiveChatAndSetRescueButton() {
      if (isLoggedIn) {
        const { liveChatroomList, myChatroom } = await getLiveChatByToilet(
          toiletId
        );

        if (myChatroom) {
          dispatch(userEnteredChatroom(myChatroom));
        }

        if (liveChatroomList.length && !myChatroom && isChatroomDisconnected) {
          for (let i = 0; i < liveChatroomList.length; i++) {
            if (!liveChatroomList[i].participant) {
              setShowRescueButton(true);
              break;
            }
          }
        }
      }
    }
    checkLiveChatAndSetRescueButton();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  useEffect(() => {
    if (isChatroomError) {
      setContentAndShowModal(
        <>
          <p>????????? ????????? ?????? ????????????!</p>
          <p>{`${chatError.status} :  ${chatError.message}`}</p>
        </>
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatroomError]);

  useEffect(() => {
    dispatch(visitedToiletComponent(toiletId));
  });

  async function onClickSOSButton() {
    if (!isLoggedIn) {
      setContentAndShowModal(
        <>
          <div>???????????? ???????????????!</div>
          <ButtonSmall type="button" onClick={() => navigate("/")}>
            ??????????????????
          </ButtonSmall>
        </>
      );

      return;
    }

    if (isChatroomConnected) {
      setContentAndShowModal(
        <>
          <div>?????? ???????????? ??????????????? ????????????!</div>
          <ButtonSmall type="button" onClick={() => navigate("/")}>
            ??????????????????
          </ButtonSmall>
        </>
      );
    }

    if (!isNear) {
      setContentAndShowModal(
        <>
          <div>
            ?????? ????????? ?????? ???????????????? ???????????? ?????? ??? ??????... ????????? ?????????
            ????????????.
          </div>
          <ButtonSmall
            type="button"
            onClick={() => {
              setShowModal(false);
              dispatch(createdChatroom(toiletId));
            }}
          >
            SOS ?????????
          </ButtonSmall>
        </>
      );

      return;
    }

    dispatch(createdChatroom(toiletId));
  }

  function handleWaitingSaviorClick() {
    navigate(`/chatroomList/${chatroomId}`);
  }

  function handleRescueClick() {
    navigate("/chatroomList", {
      state: { toiletId, toiletName: toilet.toiletName },
    });
  }

  function onClickCreatReview() {
    navigate("/editReview", { state: { toilet } });
  }

  function handleModalCloseClick() {
    setModalContent("");
    setShowModal(false);
    dispatch(errorChecked());
  }

  function setContentAndShowModal(content) {
    setModalContent(content);
    setShowModal(true);
  }

  return (
    <StyledToilet>
      {showModal && (
        <Modal onModalCloseClick={handleModalCloseClick}>{modalContent}</Modal>
      )}
      <HeaderSub isGoBackButtonMain={true} />
      <div className="title-container">
        <Title title={toilet.toiletName} description={toilet.roadNameAddress} />
        <div className="button-container">
          {isChatroomDisconnected && (
            <ButtonDefault onClick={onClickSOSButton} icon={squaredSOS} />
          )}
        </div>
      </div>
      {gotUserLocation && isNear && (
        <div className="so-near">
          ???? 500m ????????? ????????? ??????! ?????? ????????????!
        </div>
      )}
      {gotUserLocation && !isNear && (
        <div className="so-far">
          ???? ?????? 500m ??????! ?????? ?????????... ????????????... ?????????
        </div>
      )}
      {!gotUserLocation && (
        <div className="so-far">
          ???? ???????????? ????????? ?????? ?????? ????????? ??? ??? ?????????.
        </div>
      )}
      <div className="fluid-button-container">
        {isChatroomDisconnected && showRescueButton && (
          <ButtonFluid
            type="button"
            icon={helpIcon}
            color={COLOR.SALMON_PINK}
            onClick={handleRescueClick}
          >
            SOS ???????????? ????????????
          </ButtonFluid>
        )}
      </div>
      <div className="fluid-button-container">
        {isChatroomConnected &&
          !isSocketConnected &&
          !isMyChatroomInOtherToilet && (
            <ButtonFluid
              type="button"
              icon={waitIcon}
              color={COLOR.CYAN}
              onClick={handleWaitingSaviorClick}
            >
              ????????? ?????? ????????????
            </ButtonFluid>
          )}
      </div>
      <div className="fluid-button-container">
        {isChatroomConnected &&
          !isSocketConnected &&
          isMyChatroomInOtherToilet && (
            <ButtonFluid
              type="button"
              icon={waitIcon}
              color={COLOR.CARROT}
              onClick={handleWaitingSaviorClick}
            >
              {"?????? ?????? ??????????????? \n ???????????? ??????????????? ????????????!"}
            </ButtonFluid>
          )}
      </div>
      <div className="rank-container">
        <div>????????? ?????? ( {avgRating} ) </div>
        <div>
          <StarContainer
            className="star"
            rating={avgRating}
            showRatingNumber={false}
          />
        </div>
      </div>
      <div className="toilet-info-container">
        <ListDefault label="????????????" secondary={toilet.openTime} />
        <div className="toilet-paper-container">
          <ListDefault
            label="????????????"
            secondary={toilet.latestToiletPaperInfo?.hasToiletPaper ? "O" : "X"}
          />
          <div className="last-toilet-pater-provide-time">
            ????????? ?????? : {lastToiletPaperCheckDate}
          </div>
        </div>
        <ListDefault
          label="????????????"
          secondary={toilet.inUnisexToilet ? "O" : "X"}
        />
        <ListDefault
          label="?????????"
          secondary={`??? : ${toilet.menToiletBowlNumber}  /  ??? : ${toilet.ladiesToiletBowlNumber}`}
        />
        <ListDefault
          label="????????? ?????????"
          secondary={`??? : ${toilet.menHandicapToiletBowlNumber}  /  ??? : ${toilet.ladiesHandicapToiletBowlNumber}`}
        />
        <ListDefault
          label="????????? ?????????"
          secondary={`?????? : ${toilet.menChildrenToiletBowlNumber}  /  ?????? : ${toilet.ladiesChildrenToiletBowlNumber}`}
        />
      </div>
      <div className="review-container">
        <Title
          title="??????"
          description={`??? ${reviewList.length}?????? ????????? ????????????.`}
        />
        <div className="fluid-button-container">
          <ButtonFluid
            type="button"
            icon={docuIcon}
            color={COLOR.HEAVY_GOLD}
            onClick={onClickCreatReview}
          >
            ?????? ?????????
          </ButtonFluid>
        </div>
        <div className="review-card-container">
          {reviewList.map((review) => (
            <ReviewCard
              userId={review.writer._id}
              username={review.writer.username}
              level={review.writer.level}
              updatedAt={review.updatedAt}
              image={review.image}
              description={review.description}
              rating={review.rating}
              isMyReview={false}
              reviewId={review._id}
              toilet={review.toilet}
              key={review._id}
            />
          ))}
        </div>
      </div>
    </StyledToilet>
  );
}

export default Toilet;
