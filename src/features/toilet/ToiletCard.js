import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import sosPin from "../../assets/icon-pin-sos.svg";
import pin from "../../assets/icon-pin.svg";
import ButtonDefault from "../../common/components/buttons/ButtonDefault";
import { COLOR } from "../../common/util/constants";

const StyledToiletCard = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;

  .wrapper {
    width: 80%;
    height: fit-content;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 0.7rem;
    background-color: black;
    gap: 10px;
    padding: 0.5rem 1rem 1rem 1rem;
  }

  .header {
    width: 100%;
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .distance {
      padding: 0.3rem 0.8rem;
      margin-left: 11%;
      margin-bottom: -0.5rem;
      border-radius: 0.3rem;
      background-color: ${COLOR.GREY};
      font-size: small;
      color: black;
    }
  }

  .name {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: start;
    font-size: large;
    font-weight: 600;
    color: white;
    gap: 10px;
    margin-bottom: -0.3rem;

    .toilet-pin {
      width: 30px;
      height: 30px;
    }
  }

  .toilet-info {
    width: 100%;
    margin-left: 80px;
    font-size: small;
    color: gray;
    display: flex;
    flex-direction: column;
  }
`;

function ToiletCard({ toilet, distance, time }) {
  const navigate = useNavigate();
  const gotUserLocation = useSelector((state) => state.main.gotUserLocation);
  const nearToilets = useSelector((state) => state.toilet.nearToilets);
  const [isNear, setIsNear] = useState(false);

  const {
    _id: toiletId,
    isSOS,
    toiletName,
    roadNameAddress,
    menToiletBowlNumber,
    ladiesToiletBowlNumber,
  } = toilet;

  useEffect(() => {
    if (nearToilets) {
      for (const nearToilet of nearToilets) {
        if (nearToilet._id === toiletId) setIsNear(true);
        if (nearToilet._id !== toiletId) setIsNear(false);
      }
    }
  }, [nearToilets, toiletId]);

  function moveToiletDetail() {
    navigate(`/toilets/${toiletId}`);
  }

  return (
    <StyledToiletCard>
      <div className="wrapper">
        <div className="header">
          <div className="distance">
            {gotUserLocation && isNear && `${distance}m (?????? ${time}???)`}
            {gotUserLocation && !isNear && "???? 500m ??????..."}
            {!gotUserLocation && "???? ?????? ?????????????"}
          </div>
          <ButtonDefault moveto="right" onClick={() => moveToiletDetail()}>
            ????????????
          </ButtonDefault>
        </div>
        <div className="name">
          <div className="toilet-pin">
            {isSOS ? <img src={sosPin} alt="???" /> : <img src={pin} alt="???" />}
          </div>
          <div className="toilet-name">{toiletName}</div>
        </div>
        <div className="toilet-info">
          <div>{roadNameAddress}</div>
          <div>??????????????? ????????? ??? : {menToiletBowlNumber}</div>
          <div>??????????????? ????????? ??? : {ladiesToiletBowlNumber}</div>
        </div>
      </div>
    </StyledToiletCard>
  );
}

ToiletCard.propTypes = {
  toilet: PropTypes.shape({
    _id: PropTypes.string,
    isSOS: PropTypes.bool,
    toiletName: PropTypes.string,
    roadNameAddress: PropTypes.string,
    menToiletBowlNumber: PropTypes.number,
    ladiesToiletBowlNumber: PropTypes.number,
  }).isRequired,
  distance: PropTypes.number,
  time: PropTypes.string,
};

ToiletCard.defaultProps = {
  distance: 0,
  time: 0,
};

export default ToiletCard;
