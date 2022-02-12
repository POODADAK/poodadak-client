/* eslint-disable new-cap */
import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Route, useNavigate } from "react-router-dom";
import styled from "styled-components";

import pinSosToilet from "../../assets/icon-pin-sos.svg";
import pinToilet from "../../assets/icon-pin.svg";
import pinCurrent from "../../assets/pin-current-small.gif";
import ButtonFull from "../../common/components/buttons/ButtonFull";
import ButtonSmall from "../../common/components/buttons/ButtonSmall";
import HeaderMain from "../../common/components/headers/HeaderMain";
import Sidebar from "../../common/components/Sidebar";
import ErrorPage from "../error/ErrorPage";
import ToiletCard from "../toilet/ToiletCard";
import { updateNearToilets } from "../toilet/toiletSlice";
import { updateUserLocation, removeUserLocation } from "./mainSlice";
import Start from "./Start";

const StyledMain = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 568px;
  .map-container {
    position: absolute;
    z-index: 0;
    top: 20;
    left: 0;
    width: 100%;
    height: 100%;
    min-height: 568px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .full-button {
    display: flex;
  }
  .card {
    position: absolute;
    z-index: 1;
    bottom: 0;
    width: 100%;
    margin-bottom: 4px;
    .close {
      display: flex;
      justify-content: center;
      margin-top: 4px;
    }
  }
  .start,
  .sidebar {
    position: absolute;
    z-index: 2;
    top: 20;
    right: 0;
    width: 100%;
    background-color: #0000004b;
    display: flex;
    justify-content: end;
  }
`;

const { Tmapv2 } = window;
const ANI_TYPE = Tmapv2.MarkerOptions.ANIMATE_BOUNCE_ONCE;
const BASE_URL = process.env.REACT_APP_AXIOS_BASE_URL;

function Main() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const defaultLocation = [126.97796919, 37.566535];

  const [map, setMap] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [currentMarker, setCurrentMarker] = useState(null);
  const [toiletMarkers, setToiletMarkers] = useState([]);
  const [selectedToilet, setSelectedToilet] = useState(null);
  const [selectedToiletDistance, setSelectedToiletDistance] = useState(null);
  const [selectedToiletTime, setSelectedToiletTime] = useState(null);
  const [drawPathInfos, setDrawPathInfos] = useState([]);
  const [drawPathResults, setDrawPathResults] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [pathMarkers, setPathMarkers] = useState([]);
  const [polyline, setPolyline] = useState(null);
  const [onSideBar, setOnSideBar] = useState(false);
  const [err, setErr] = useState(null);

  const gotUserLocation = useSelector((state) => state.main.gotUserLocation);
  const currentLocation = useSelector((state) => state.main.userLocation);
  const nearToilets = useSelector((state) => state.toilet.nearToilets);

  const adjMap = map;
  const adjCurrentMarker = currentMarker;
  const adjToiletMarkers = toiletMarkers;
  const adjDrawPathInfos = drawPathInfos;
  const adjDrawPathResults = drawPathResults;
  const adjPathMarkers = pathMarkers;
  const adjPolyline = polyline;

  const forceSetMapCenter = useCallback(
    async (center) => {
      const newLocation = new Tmapv2.LatLng(center[1], center[0]);
      await adjMap.setCenter(newLocation);
    },
    [adjMap]
  );

  async function getToilets(center) {
    const sendQueryUrl = `${BASE_URL}/toilets?lat=${center[0]}&lng=${center[1]}`;
    const response = await axios.get(sendQueryUrl);
    const newToilets = response.data.toiletList;

    return newToilets;
  }

  async function getPathToToiletInfo(start, end) {
    const sendQueryUrl = `https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json&callback=result&appKey=l7xx66e7421614a24fb5b811213de86ca032`;
    const data = JSON.stringify({
      startName: "현재위치",
      startX: start[0],
      startY: start[1],
      endName: "화장실",
      endX: end[0],
      endY: end[1],
      reqCoordType: "WGS84GEO",
      resCoordType: "EPSG3857",
    });
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const response = await axios.post(sendQueryUrl, data, config);
    const resultData = response.data;
    setSelectedToiletDistance(resultData.features[0].properties.totalDistance);
    setSelectedToiletTime(
      (resultData.features[0].properties.totalTime / 60).toFixed(0)
    );

    return resultData;
  }

  function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lng = position.coords.longitude;
          const lat = position.coords.latitude;
          dispatch(updateUserLocation([lng, lat]));
          forceSetMapCenter([lng, lat]);
        },
        (error) => {
          const newErr = {
            title: "에러가 발생했습니다.",
            description: "메인으로 이동해주세요.",
            errorMsg: error.message,
          };
          setErr(newErr);
        },
        {
          enableHighAccuracy: false,
          maximumAge: 0,
          timeout: Infinity,
        }
      );
    } else {
      dispatch(removeUserLocation());
      const newErr = {
        title: "GPS를 지원하지 않습니다",
        description: "위치정보 제공에 동의해주셔야 앱을 사용하실 수 있습니다.",
      };
      setErr(newErr);
    }
  }

  function toggleSidebar() {
    setOnSideBar((current) => !current);
  }

  // 초기 랜더링 시 티맵을 불러옵니다.
  useEffect(() => {
    const location = gotUserLocation ? currentLocation : defaultLocation;
    setMap(
      new Tmapv2.Map("TMapApp", {
        center: new Tmapv2.LatLng(location[1], location[0]),
        width: "100%",
        height: "100%",
        zoom: 17,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 최초로 현재 내 위치 마커를 찍고 지도를 내 위치로 이동합니다.
  useEffect(() => {
    setCurrentMarker(
      new Tmapv2.Marker({
        position: new Tmapv2.LatLng(defaultLocation[1], defaultLocation[0]),
        icon: pinCurrent,
        map: adjMap,
      })
    );
    forceSetMapCenter(defaultLocation[1], defaultLocation[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjMap, forceSetMapCenter]);

  // 내 현재 위치가 바뀔 때마다 마커 위치를 변경합니다.
  useEffect(() => {
    async function checkCurrentMarker(location) {
      const newLocation = new Tmapv2.LatLng(location[1], location[0]);
      await adjCurrentMarker.setPosition(newLocation);
    }
    checkCurrentMarker(currentLocation);
  }, [currentMarker, currentLocation, adjCurrentMarker]);

  // 내 현재 위치가 바뀔 때마다 주변 화장실 정보를 redux에 구성합니다. (내 주변 화장실 리스트용)
  useEffect(() => {
    async function getNearToilets() {
      const newNearToilets = [];
      const tInfos = [];

      if (currentLocation) {
        const lat = currentLocation[1];
        const lng = currentLocation[0];
        const newToilets = await getToilets([lat, lng]);
        if (newToilets) {
          // eslint-disable-next-line no-restricted-syntax
          for (const toilet of newToilets) {
            const tlat = toilet.location.coordinates[0];
            const tlng = toilet.location.coordinates[1];
            const data = getPathToToiletInfo(currentLocation, [tlat, tlng]);
            tInfos.push(data);
          }

          const newPathToToiletInfos = await Promise.all(tInfos);
          for (let i = 0; i < newToilets.length; i += 1) {
            const newToilet = newToilets[i];
            newToilet.tDistance =
              newPathToToiletInfos[i].features[0].properties.totalDistance;
            newToilet.tTime = (
              newPathToToiletInfos[i].features[0].properties.totalTime / 60
            ).toFixed(0);
            newNearToilets.push(newToilet);
          }

          dispatch(updateNearToilets(newNearToilets));
        }
      }
    }

    getNearToilets();
  }, [currentLocation, dispatch]);

  // 2초마다 맵의 center를 체크하고 값이 변경됐을 경우 주변 화장실을 다시 가져와 핀을 찍습니다.
  useEffect(() => {
    async function drawToiletMarkers(toiletsArray, anitype) {
      // eslint-disable-next-line no-restricted-syntax
      for (const item of adjToiletMarkers) {
        item.setMap(null);
      }
      setToiletMarkers([]);
      if (toiletsArray) {
        // eslint-disable-next-line no-restricted-syntax
        for (const toilet of toiletsArray) {
          const lat = toilet.location.coordinates[1];
          const lng = toilet.location.coordinates[0];
          const marker = new Tmapv2.Marker({
            position: new Tmapv2.LatLng(lat, lng),
            icon: toilet.isSOS ? pinSosToilet : pinToilet,
            animation: anitype,
            animationLength: 300,
            map: adjMap,
          });
          marker.addListener("click", () => {
            setSelectedToilet(toilet);
          });
          if (!adjToiletMarkers.includes(marker)) {
            setToiletMarkers(
              (current) => !current.includes(marker) && [...current, marker]
            );
          }
        }
      }
    }

    const checkMapCenter = setInterval(async () => {
      if (gotUserLocation) {
        const currentCenter = adjMap.getCenter();
        const lat = currentCenter.lat();
        const lng = currentCenter.lng();
        const newMapCenter = [lat, lng];

        if (JSON.stringify(mapCenter) !== JSON.stringify(newMapCenter)) {
          setMapCenter(newMapCenter);
          const newToilets = await getToilets(newMapCenter);
          drawToiletMarkers(newToilets, ANI_TYPE);
        }
      }
    }, 2000);

    return () => {
      clearInterval(checkMapCenter);
    };
  }, [adjMap, adjToiletMarkers, gotUserLocation, mapCenter]);

  // 화장실을 선택할 경우 해당 카드가 노출되고, 현재 위치부터 화장실까지 경로를 그려 안내해 줍니다.
  useEffect(() => {
    async function drawLine(arrPoint) {
      setPolyline(
        new Tmapv2.Polyline({
          path: await arrPoint,
          strokeColor: "#DD0000",
          strokeWeight: 6,
          map: adjMap,
        })
      );
      setDrawPathResults((current) => [...current, adjPolyline]);
    }

    async function makeDrawInfo() {
      if (adjDrawPathResults.length > 0) {
        // eslint-disable-next-line no-restricted-syntax
        for (const result of adjDrawPathResults) {
          if (result) result.setMap(null);
        }
        setDrawPathResults([]);
      }
      if (adjPathMarkers.length > 0) {
        // eslint-disable-next-line no-restricted-syntax
        for (const marker of adjPathMarkers) {
          if (marker) marker.setMap(null);
        }
        setPathMarkers([]);
      }
      setDrawPathInfos([]);

      const lat = selectedToilet.location.coordinates[0];
      const lng = selectedToilet.location.coordinates[1];
      const result = await getPathToToiletInfo(currentLocation, [lat, lng]);
      const data = result.features;

      for (let i = 0; i < data.length; i += 1) {
        const { geometry } = data[i];

        if (geometry.type === "LineString") {
          for (let j = 0; j < geometry.coordinates.length; j += 1) {
            setDrawPathInfos((current) => [
              ...current,
              new Tmapv2.LatLng(
                // eslint-disable-next-line no-underscore-dangle
                new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
                  new Tmapv2.Point(
                    geometry.coordinates[j][0],
                    geometry.coordinates[j][1]
                  )
                )._lat,
                // eslint-disable-next-line no-underscore-dangle
                new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
                  new Tmapv2.Point(
                    geometry.coordinates[j][0],
                    geometry.coordinates[j][1]
                  )
                )._lng
              ),
            ]);
          }
        } else {
          const markerImg = "http://topopen.tmap.co.kr/imgs/point.png";
          // eslint-disable-next-line new-cap
          const convertPoint = new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
            new Tmapv2.Point(geometry.coordinates[0], geometry.coordinates[1])
          );
          const pathInfoObj = {
            markerImg,
            // eslint-disable-next-line no-underscore-dangle
            lat: convertPoint._lat,
            // eslint-disable-next-line no-underscore-dangle
            lng: convertPoint._lng,
            pointType: "P",
          };
          setPathMarkers((current) => [
            ...current,
            new Tmapv2.Marker({
              position: new Tmapv2.LatLng(pathInfoObj.lat, pathInfoObj.lng),
              icon: pathInfoObj.markerImg,
              iconSize: new Tmapv2.Size(8, 8),
              map: adjMap,
            }),
          ]);
        }
      }
      drawLine(adjDrawPathInfos);
    }

    if (selectedToilet) {
      makeDrawInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedToilet, adjPolyline]);

  // 선택한 화장실이 있으면 매 5초마다 사용자의 위치를 추적합니다.
  useEffect(() => {
    const getLocationForTracking = setInterval(() => {
      if (selectedToilet) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lng = position.coords.longitude;
              const lat = position.coords.latitude;
              dispatch(updateUserLocation([lng, lat]));
            },
            (error) => {
              const newErr = {
                title: "에러가 발생했습니다.",
                description: "메인으로 이동해주세요.",
                errorMsg: error.message,
              };
              setErr(newErr);
            },
            {
              enableHighAccuracy: false,
              maximumAge: 0,
              timeout: Infinity,
            }
          );
        } else {
          dispatch(removeUserLocation());
          const newErr = {
            title: "GPS를 지원하지 않습니다",
            description:
              "위치정보 제공에 동의해주셔야 앱을 사용하실 수 있습니다.",
          };
          setErr(newErr);
        }
      }
    }, 5000);

    return () => {
      clearInterval(getLocationForTracking);
    };
  }, [dispatch, selectedToilet]);

  return (
    <StyledMain>
      <HeaderMain onClick={toggleSidebar} />
      <div className="map-container">
        <div id="TMapApp" />
        <div className="full-button">
          <ButtonFull onClick={() => getLocation()}>내 위치로 이동</ButtonFull>
          <ButtonFull
            onClick={() => navigate("/toilets", { state: nearToilets })}
          >
            내 주변 화장실 리스트
          </ButtonFull>
        </div>
      </div>

      {selectedToilet && (
        <div className="card">
          <ToiletCard
            toilet={selectedToilet}
            distance={selectedToiletDistance}
            time={selectedToiletTime}
          />
          <div className="close">
            <ButtonSmall onClick={() => setSelectedToilet(null)}>
              카드 닫기
            </ButtonSmall>
          </div>
        </div>
      )}

      {!gotUserLocation && (
        <div className="start">
          <Start onClick={getLocation} />
        </div>
      )}

      {onSideBar && gotUserLocation && (
        <div className="sidebar">
          <Sidebar onClick={toggleSidebar} />
        </div>
      )}

      {err && <Route path="/error" element={<ErrorPage error={err} />} />}
    </StyledMain>
  );
}

export default Main;
