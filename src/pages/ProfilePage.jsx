import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { TbArrowBigUp, TbArrowBigDown } from "react-icons/tb";
import { FaRegComment } from "react-icons/fa";
import { PiShareFat } from "react-icons/pi";
import { FaWhatsapp, FaXTwitter, FaFacebook, FaLink } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { handleVote } from "../api/postService";
import { fetchComments, addComment, deleteComment } from "../api/commentService";
import { fetchUserProfile, followUser } from "../api/userService";
import Modal from "../components/Modal";
import RightSidebar from "../components/RightSidebar";

function getTimeElapsed(date) {
  const currentTime = new Date();
  const givenTime = new Date(date);

  const timeDifference = currentTime - givenTime;
  const minutes = Math.floor(timeDifference / (1000 * 60));

  if (minutes >= 24 * 60) {
    const days = Math.floor(minutes / (24 * 60));
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  } else if (minutes === 0) {
    return `Just now`;
  } else {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  }
}

const countVotes = (votes, voteType) => {
  const count = votes.filter((vote) => vote.voteType === voteType).length;

  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  } else if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}k`;
  } else {
    return count.toString();
  }
};

function checkCurrentUserVote(votes, currentUser) {
  const vote = votes.find((vote) => vote.user.username === currentUser);
  if (vote) return vote;

  return false;
}

function getConditionalVoteCount(votes, currentUser) {
  const userVote = votes.find((vote) => vote.user.username === currentUser);

  if (userVote && userVote.voteType === "no") {
    return { voteCount: countVotes(votes, "no"), voteType: "no" };
  } else {
    const voteData = { voteCount: countVotes(votes, "yes") };
    if (userVote) {
      voteData.voteType = "yes";
    }
    return voteData;
  }
}

const shareTargets = [
  {
    key: "whatsapp",
    Icon: FaWhatsapp,
    getUrl: (link) => "https://wa.me/?text=" + encodeURIComponent(link),
  },
  {
    key: "twitter",
    Icon: FaXTwitter,
    getUrl: (link) => "https://twitter.com/intent/tweet?url=" + encodeURIComponent(link),
  },
  {
    key: "facebook",
    Icon: FaFacebook,
    getUrl: (link) => "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(link),
  },
];

const ProfilePage = () => {
  const { username } = useParams();
  const { user } = useSelector((state) => state);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [sharePostId, setSharePostId] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const [commentPostId, setCommentPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentCounts, setCommentCounts] = useState({});

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const response = await fetchUserProfile(username);
      if (response.isSuccess) {
        setProfile(response.profile);
        setPosts(response.posts);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    loadProfile();
  }, [username]);

  const handleJoin = async () => {
    if (!profile?._id) return;
    const response = await followUser(profile._id);
    if (response.isSuccess) {
      setProfile((curr) => ({
        ...curr,
        isFollowing: response.isFollowing,
        followersCount: response.isFollowing
          ? curr.followersCount + 1
          : Math.max(curr.followersCount - 1, 0),
      }));
    }
  };

  const handleVoting = async (postId, voteType) => {
    const response = await handleVote(postId, voteType);
    if (response.isSuccess) {
      const updatedPost = response.post;
      setPosts((curr) =>
        curr.map((post) => (post._id === postId ? { ...post, votes: updatedPost.votes } : post))
      );
    }
  };

  const getShareLink = (postId) => window.location.origin + "/post/" + postId;

  const openShareModal = (postId) => {
    setSharePostId(postId);
    setLinkCopied(false);
  };

  const closeShareModal = () => {
    setSharePostId(null);
    setLinkCopied(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareLink(sharePostId));
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  const handleShareClick = (target) => {
    if (!sharePostId) return;
    const url = target.getUrl(getShareLink(sharePostId));
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openCommentModal = async (postId) => {
    setCommentPostId(postId);
    setCommentText("");
    setCommentsLoading(true);
    const response = await fetchComments(postId);
    if (response.isSuccess) {
      setComments(response.comments);
      setCommentCounts((curr) => ({ ...curr, [postId]: response.comments.length }));
    } else {
      setComments([]);
    }
    setCommentsLoading(false);
  };

  const closeCommentModal = () => {
    setCommentPostId(null);
    setComments([]);
    setCommentText("");
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !commentPostId) return;

    setCommentSubmitting(true);
    const response = await addComment(commentPostId, commentText.trim());
    setCommentSubmitting(false);

    if (response.isSuccess) {
      setComments((curr) => [response.comment, ...curr]);
      setCommentCounts((curr) => ({
        ...curr,
        [commentPostId]: (curr[commentPostId] || 0) + 1,
      }));
      setCommentText("");
    }
  };

  const handleDeleteComment = async (commentId) => {
    const response = await deleteComment(commentId);
    if (response.isSuccess) {
      setComments((curr) => curr.filter((c) => c._id !== commentId));
      setCommentCounts((curr) => ({
        ...curr,
        [commentPostId]: Math.max((curr[commentPostId] || 1) - 1, 0),
      }));
    }
  };

  const getDisplayedCommentCount = (post) => {
    if (commentCounts[post._id] !== undefined) {
      return commentCounts[post._id];
    }
    return post.commentCount ?? 0;
  };

  if (loading) {
    return (
      <div className="w-full p-5 flex flex-col">
        <p className="text-xl text-center font-semibold">Loading...</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="w-full p-5 flex flex-col items-center gap-y-4">
        <p className="text-xl text-center font-semibold">User not found.</p>
        <Link to="/" className="text-btnPrimary underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const isOwnProfile = user.username === profile.username;

  return (
    <div className="flex flex-row w-full">
      <div className="w-full p-5 desktop:border-x-[1px] desktop:min-h-[100vh] flex flex-col">
        <Link to="/" className="text-sm text-textSecondary mb-3 underline">
          Back to Home
        </Link>

        <div className="flex flex-row justify-between items-center py-3 border-b border-[#ffffff29] mb-4">
          <div className="flex flex-row items-center gap-x-3">
            <div className="bg-gray-600 rounded-full p-3">
              <FaUser className="text-2xl" />
            </div>
            <div>
              <p className="text-xl font-bold">{profile.username}</p>
              <p className="text-sm text-textSecondary">
                {profile.followersCount} followers Â· {profile.followingCount} following
              </p>
            </div>
          </div>
          {!isOwnProfile && (
            <button
              onClick={handleJoin}
              className="bg-blue-700 font-semibold py-1 px-3 rounded-full"
            >
              {profile.isFollowing ? "Joined" : "Join"}
            </button>
          )}
        </div>

        {posts.length ? (
          posts.map((post) => (
            <div
              key={post._id}
              className="hover:bg-[#2b2d30] my-1 py-2 px-3 border-t-[0.5px] border-[#ffffff29] rounded-xl"
            >
              <div className="flex flex-row justify-between text-sm">
                <div className="flex flex-row items-center gap-x-2">
                  <FaUser /> {post.createdBy.username}
                  <ul style={{ listStyleType: "disc", marginLeft: "18px" }}>
                    <li>{getTimeElapsed(post.createdAt)}</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-y-3 mt-2">
                <Link to={`/post/${post._id}`} className="text-xl font-bold hover:underline">
                  {post.title}
                </Link>
                <p className="text-base">{post.description}</p>
                {post.imageUrl && (
                  <div
                    className="rounded-md overflow-hidden flex flex-row justify-center max-h-[450px]"
                    style={{ borderRadius: "12px" }}
                  >
                    <img
                      src={post.imageUrl}
                      className="object-contain max-h-full max-w-full"
                      alt=""
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-row mt-3 text-lg gap-x-4">
                <div
                  className={`flex flex-row flex-nowrap items-center gap-x-2 bg-gray-600 rounded-full ${
                    checkCurrentUserVote(post.votes, user.username).voteType === "yes" && "bg-[#fd523c]"
                  } ${
                    checkCurrentUserVote(post.votes, user.username).voteType === "no" && "bg-[#5f3cfd]"
                  }`}
                >
                  <button
                    onClick={() => handleVoting(post._id, "yes")}
                    className="p-2 hover:bg-gray-800 rounded-full hover:text-red-500"
                  >
                    {checkCurrentUserVote(post.votes, user.username).voteType === "yes" ? (
                      <TbArrowBigUp fill="#fff" className="text-white" />
                    ) : (
                      <TbArrowBigUp />
                    )}
                  </button>{" "}
                  {getConditionalVoteCount(post.votes, user.username).voteCount}{" "}
                  <button
                    onClick={() => handleVoting(post._id, "no")}
                    className="p-2 hover:bg-gray-800 rounded-full hover:text-[#5f3cfd]"
                  >
                    {checkCurrentUserVote(post.votes, user.username).voteType === "no" ? (
                      <TbArrowBigDown fill="#fff" className="text-white" />
                    ) : (
                      <TbArrowBigDown />
                    )}
                  </button>
                </div>
                <button
                  onClick={() => openCommentModal(post._id)}
                  className="flex flex-row items-center gap-x-2 bg-gray-600 rounded-full px-2 py-1"
                >
                  <FaRegComment /> {getDisplayedCommentCount(post)}
                </button>
                <button
                  onClick={() => openShareModal(post._id)}
                  className="flex flex-row items-center gap-x-2 bg-gray-600 rounded-full px-2 py-1"
                >
                  <PiShareFat /> Share
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-lg text-center text-textSecondary mt-8">
            {isOwnProfile ? "You haven't posted anything yet." : "No posts yet."}
          </p>
        )}
      </div>

      <div className="desktop:flex hidden w-[30%]">
        <RightSidebar />
      </div>

      <Modal
        show={sharePostId !== null}
        onHide={closeShareModal}
        customClass="w-[90%] max-w-md fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
        submitBtn={null}
      >
        <div className="flex flex-col gap-y-4">
          <p className="text-lg font-semibold">Share this post</p>
          <div className="flex flex-row gap-x-2">
            <input
              readOnly
              value={sharePostId ? getShareLink(sharePostId) : ""}
              className="flex-1 bg-transparent border-[1px] border-textSecondary p-2 rounded-lg text-sm truncate"
            />
            <button
              onClick={handleCopyLink}
              className="bg-btnPrimary hover:bg-btnSecondary p-2 rounded-lg flex items-center gap-x-1 text-sm whitespace-nowrap"
            >
              <FaLink /> {linkCopied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="flex flex-row justify-center gap-x-4 text-2xl mt-2">
            {shareTargets.map((target) => {
              const Icon = target.Icon;
              return (
                <button
                  key={target.key}
                  onClick={() => handleShareClick(target)}
                  className="p-3 bg-gray-700 rounded-full hover:bg-gray-600"
                >
                  <Icon />
                </button>
              );
            })}
          </div>
        </div>
      </Modal>

      <Modal
        show={commentPostId !== null}
        onHide={closeCommentModal}
        customClass="w-[90%] max-w-md fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-h-[80vh]"
        submitBtn={null}
      >
        <div className="flex flex-col gap-y-4">
          <p className="text-lg font-semibold">Comments</p>

          <div className="flex flex-row gap-x-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent border-[1px] border-textSecondary p-2 rounded-lg text-sm"
            />
            <button
              disabled={commentSubmitting || !commentText.trim()}
              onClick={handleAddComment}
              className="bg-btnPrimary hover:bg-btnSecondary disabled:bg-bgSecondary p-2 rounded-lg text-sm whitespace-nowrap"
            >
              {commentSubmitting ? "Posting..." : "Post"}
            </button>
          </div>

          <div className="flex flex-col gap-y-3 overflow-y-auto max-h-[50vh]">
            {commentsLoading ? (
              <p className="text-sm text-center text-textSecondary">Loading...</p>
            ) : comments.length ? (
              comments.map((comment) => (
                <div
                  key={comment._id}
                  className="flex flex-row justify-between items-start gap-x-2 border-b border-[#ffffff29] pb-2"
                >
                  <div>
                    <p className="text-sm font-semibold">{comment.user?.username}</p>
                    <p className="text-sm">{comment.text}</p>
                  </div>
                  {comment.user?.username === user.username && (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="text-xs text-red-500 whitespace-nowrap"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-center text-textSecondary">
                No comments yet. Be the first!
              </p>
            )}
          </div>

          <button
            onClick={closeCommentModal}
            className="self-center mt-2 py-2 px-4 rounded-full bg-bgSecondary hover:bg-[#ffffff29] text-sm"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
