import axiosInstance from "./axiosInstance";

// Fetch all comments for a post
export const fetchComments = async (postId) => {
  try {
    const response = await axiosInstance.get(`/comment/${postId}`);
    return response.data;
  } catch (error) {
    return { isSuccess: false, errMsg: "Something went wrong!" };
  }
};

// Add a comment to a post
export const addComment = async (postId, text) => {
  try {
    const response = await axiosInstance.post(`/comment/${postId}`, { text });
    return response.data;
  } catch (error) {
    return { isSuccess: false, errMsg: "Something went wrong!" };
  }
};

// Delete a comment
export const deleteComment = async (commentId) => {
  try {
    const response = await axiosInstance.delete(`/comment/${commentId}`);
    return response.data;
  } catch (error) {
    return { isSuccess: false, errMsg: "Something went wrong!" };
  }
};
