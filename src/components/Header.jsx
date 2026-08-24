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
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsRead,
} from "../api/notificationService";

function getNotifTimeElapsed(date) {
  const currentTime = new Date();
  const givenTime = new Date(date);

  const timeDifference = currentTime - givenTime;
  const minutes = Math.floor(timeDifference / (1000 * 60));

  if (minutes >= 24 * 60) {
    const days = Math.floor(minutes / (24 * 60));
    return `${days}d ago`;
  } else if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  } else if (minutes <= 0) {
    return `just now`;
  } else {
    return `${minutes}m ago`;
  }
}

function getNotifText(notification) {
  const senderName = notification.sender?.username || "Someone";
  if (notification.type === "follow") {
    return `${senderName} started following you`;
  } else if (notification.type === "vote") {
    return `${senderName} voted on your post${notification.post?.title ? `: "${notification.post.title}"` : ""}`;
  } else if (notification.type === "comment") {
    return `${senderName} commented on your post${notification.post?.title ? `: "${notification.post.title}"` : ""}`;
  }
  return "New notification";
}

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

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef();

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
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setOpenNotifications(false);
      }
    };

    if (openProfile || openNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Cleanup the event listener when the component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openProfile, openNotifications, setProfile]);

  // Poll unread notification count while logged in
  useEffect(() => {
    if (!isUserLoggedIn) return;

    const pollUnreadCount = async () => {
      const response = await fetchUnreadCount();
      if (response.isSuccess) {
        setUnreadCount(response.count);
      }
    };

    pollUnreadCount();
    const intervalId = setInterval(pollUnreadCount, 20000);

    return () => clearInterval(intervalId);
  }, [isUserLoggedIn]);

  const handleBellClick = async () => {
    const opening = !openNotifications;
    setOpenNotifications(opening);

    if (opening) {
      setNotifLoading(true);
      const response = await fetchNotifications();
      if (response.isSuccess) {
        setNotifications(response.notifications);
      }
      setNotifLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markNotificationsRead(notification._id);
      setUnreadCount((curr) => Math.max(curr - 1, 0));
      setNotifications((curr) =>
        curr.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
      );
    }

    setOpenNotifications(false);

    if (notification.type === "follow") {
      navigate(`/user/${notification.sender.username}`);
    } else if (notification.post?._id) {
      navigate(`/post/${notification.post._id}`);
    }
  };

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
            <div className="text-2xl flex flex-row items-center relative">
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
              <div className="relative">
                <button
                  onClick={handleBellClick}
                  className="hover:bg-bgSecondary p-2 rounded-full relative"
                >
                  <FaRegBell />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-[#D93900] text-white text-[10px] leading-none rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {openNotifications && (
                  <div
                    ref={notifRef}
                    className="absolute right-0 top-full mt-2 w-[320px] max-h-[400px] overflow-y-auto bg-bgSecondary rounded-md shadow-lg text-sm font-light z-[999999]"
                  >
                    <p className="p-3 font-semibold border-b border-[#ffffff29]">
                      Notifications
                    </p>
                    {notifLoading ? (
                      <p className="p-4 text-center text-textSecondary">Loading...</p>
                    ) : notifications.length ? (
                      notifications.map((notification) => (
                        <button
                          key={notification._id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full text-left p-3 border-b border-[#ffffff29] hover:bg-[#ffffff14] flex flex-col gap-y-1 ${
                            notification.read ? "" : "bg-[#ffffff0d]"
                          }`}
                        >
                          <span>{getNotifText(notification)}</span>
                          <span className="text-xs text-textSecondary">
                            {getNotifTimeElapsed(notification.createdAt)}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="p-4 text-center text-textSecondary">
                        No notifications yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
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
