import React, { useEffect, useRef, useState } from "react";
import "../styles/header.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/img/reddit-logo.svg";
import { CiSearch } from "react-icons/ci";
import { BiQrScan } from "react-icons/bi";
import { IoMdHome } from "react-icons/io";
import { BsArrowUpRightCircle } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import AuthModal from "./AuthModal";
import { logoutUser, toggleLoginModal } from "../shared/actions";
import { FaUserCircle } from "react-icons/fa";
import { MdAdsClick } from "react-icons/md";
import { AiOutlineMessage } from "react-icons/ai";
import { FaRegBell } from "react-icons/fa6";
import { IoLogOutOutline } from "react-icons/io5";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const { showLoginModal, isUserLoggedIn, user } = useSelector(
    (state) => state
  );
  const dispatch = useDispatch();
  const [openProfile, setProfile] = useState(false);
  const modalRef = useRef();

  // Function to toggle the menu
  const handleToggleMenu = (path) => {
    setIsOpen(!isOpen);
    if (path) {
      navigate(path);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setProfile(false);
      }
    };

    if (openProfile) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Cleanup the event listener when the component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openProfile, setProfile]);

  // Toggle login modal
  const handleLoginModal = () => {
    dispatch(toggleLoginModal());
  };

  // Function to logout user
  const logout = () => {
    dispatch(logoutUser());
    setProfile(false);
  };

  // Navigate to own profile page and close the dropdown
  const goToOwnProfile = () => {
    navigate(`/user/${user.username}`);
    setProfile(false);
  };

  return (
    <div className="navbar flex flex-col ">
      <AuthModal
        show={showLoginModal}
        onHide={() => handleLoginModal()}
        customClass="desktop:w-[40%] w-full mx-auto h-full"
      />
      <div className="flex flex-row w-full justify-between border-b-[1px] pb-3 ">
        <div className="flex flex-row gap-x-4 items-center pl-4">
          <div className="desktop:hidden flex gap-x-6 items-center">
            <div
              className={`hamburger ${
                isOpen ? "open" : ""
              } flex desktop:hidden`}
              onClick={() => handleToggleMenu()}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <Link
            to="/"
            className={`flex flex-row items-center gap-x-1 logo ${
              isOpen ? "z-auto" : "z-[99999]"
            }`}
          >
            <img src={logo} alt="logo" />
            <p className="font-semibold hidden desktop:flex text-3xl leading-tight">
              reddit
            </p>
          </Link>
        </div>
        <div className="desktop:flex hidden flex-row relative items-center w-[35%]">
          <CiSearch className="absolute left-3 text-xl" />
          <input
            type="text"
            placeholder="Search Reddit"
            className="w-full p-2 pl-9 rounded-full bg-gray-700"
          />
        </div>

        <div
          className={`flex flex-row gap-x-3 leading-tight items-center font-light text-lg pr-4 ${
            showLoginModal ? "" : "z-[999999]"
          }`}
        >
          {!isUserLoggedIn && (
            <>
              <button className="font-semibold p-2 text-sm desktop:flex hidden flex-row items-center gap-x-1 bg-gray-700 hover:bg-gray-500 px-3 rounded-full">
                <BiQrScan />
                Get app
              </button>
              <button
                onClick={() => handleLoginModal()}
                className="font-semibold p-2 text-sm flex flex-row items-center gap-x-1 bg-[#D93900] hover:bg-[#bd4114] px-3 rounded-full"
              >
                Log In
              </button>
            </>
          )}
          <CiSearch className="text-2xl desktop:hidden flex" />
          <button
            className={`${
              isUserLoggedIn ? "hidden" : ""
            } self-start text-xl leading-tight font-semibold`}
          >
            ...
          </button>
          {isUserLoggedIn && (
            <div className="text-2xl flex flex-row items-center ">
              <button className="hover:bg-bgSecondary p-2 desktop:flex hidden rounded-full">
                <MdAdsClick />
              </button>
              <button className="hover:bg-bgSecondary p-2 desktop:flex hidden rounded-full">
                <AiOutlineMessage />
              </button>
              <button
                onClick={() => navigate("/create-post")}
                className="hover:bg-bgSecondary items-center flex gap-x-1 py-1 px-3 rounded-full"
              >
                +{" "}
                <span className="desktop:inline hidden text-lg font-medium">
                  Create
                </span>
              </button>
              <button className="hover:bg-bgSecondary p-2 rounded-full">
                <FaRegBell />
              </button>
              <button
                onClick={() => setProfile((curr) => !curr)}
                className="hover:bg-bgSecondary p-1 text-[28px] rounded-full"
              >
                <FaUserCircle />
              </button>
            </div>
          )}
        </div>

        <div
          className={`menu-overlay ${
            isOpen ? "open" : ""
          } px-6 flex flex-col text-xl py-5`}
        >
          {sidebars.map((sidebar) => (
            <button
              key={sidebar.path}
              className="flex flex-row gap-x-2 items-center p-3 rounded-md hover:bg-gray-800"
              style={
                pathname === sidebar.path ? { backgroundColor: "#4b5563" } : {}
              }
              onClick={() => handleToggleMenu(sidebar.path)}
            >
              {sidebar.btn}
            </button>
          ))}
        </div>
        <div className={`user-overlay ${openProfile ? "open" : ""} w-full `}>
          <div
            ref={modalRef}
            className="flex flex-col desktop:w-[20%] w-full max-h-[50%] bg-bgSecondary gap-y-4 p-4 rounded-md"
          >
            <button
              onClick={goToOwnProfile}
              className="flex flex-row gap-x-2 hover:text-white items-center"
            >
              <div className="text-4xl">
                <FaUserCircle />
              </div>{" "}
              <div className="flex flex-col text-left">
                <p>View Profile</p>
                <p className="text-sm">{user.username}</p>
              </div>
            </button>
            <button
              onClick={() => logout()}
              className="flex flex-row gap-x-2 hover:text-white items-center"
            >
              <div className="text-3xl ">
                <IoLogOutOutline />
              </div>{" "}
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const sidebars = [
  {
    btn: (
      <>
        <span className="text-2xl">
          <IoMdHome />
        </span>{" "}
        Home
      </>
    ),
    path: "/",
  },
  {
    btn: (
      <>
        <span className="text-2xl">
          <BsArrowUpRightCircle />
        </span>{" "}
        Popular
      </>
    ),
    path: "/popular",
  },
];

export default Header;
