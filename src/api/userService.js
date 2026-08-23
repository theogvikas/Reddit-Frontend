import axiosInstance from "./axiosInstance";
// Handle user login
export const loginUser = async (credentials) => {
  try {
    const response = await axiosInstance.post("/auth/login", credentials);
    return response.data;
  } catch (error) {
    return { isSuccess: false, errMsg: "Something went wrong!" };
  }
};
// Handle user registration
export const registerUser = async (userData) => {
  try {
    const response = await axiosInstance.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    return { isSuccess: false, errMsg: "Something went wrong!" };
  }
};
// Handle follow/unfollow toggle
export const followUser = async (userId) => {
  try {
    const response = await axiosInstance.post(`/auth/follow/${userId}`);
    return response.data;
  } catch (error) {
    return { isSuccess: false, errMsg: "Something went wrong!" };
  }
};