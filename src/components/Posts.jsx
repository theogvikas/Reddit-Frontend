import { FaUser } from "react-icons/fa";
import { TbArrowBigUp, TbArrowBigDown } from "react-icons/tb";
import { FaRegComment } from "react-icons/fa";
import { PiShareFat } from "react-icons/pi";
import { useEffect, useState } from "react";
import { fetchPosts, handleVote } from "../api/postService";
import { useSelector } from "react-redux";

function getTimeElapsed(date) {
  const currentTime = new Date();
  const givenTime = new Date(date);

  const timeDifference = currentTime - givenTime;
  const minutes = Math.floor(timeDifference / (1000 * 60));

  if (minutes >= 24 * 60) {
    const days = Math.floor((minutes / 24) * 60);
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

const Posts = () => {
  const [pageNo, setpageNo] = useState(1);
  const [posts, setPosts] = useState([]);
  const [lastPage, setLastPage] = useState(100);
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state) => state);

  const getPosts = async () => {
    if (pageNo >= lastPage || loading) return;

    setLoading(true);
    const response = await fetchPosts(pageNo);
    if (response.isSuccess) {
      const newPosts = response.posts;
      setLastPage(response.totalPages);
      if (newPosts.length) {
        setPosts((currPosts) => {
          return [...currPosts, ...newPosts];
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    getPosts();
  }, [pageNo]);

  const handleVoting = async (postId, voteType) => {
    console.log(postId, voteType);
    const response = await handleVote(postId, voteType);

    if (response.isSuccess) {
      const updatedPost = response.post;
      setPosts((curr) => {
        const updatedData = curr.map((post) => {
          if (post._id === postId) {
            post.votes = updatedPost.votes;
          }
          return post;
        });

        return updatedData;
      });
    }
  };

  function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  }

  const handleScroll = () => {
    if (
      document.body.scrollHeight - 300 < window.scrollY + window.innerHeight
    ) {
      setpageNo((curr) => curr + 1);
    }
  };

  window.addEventListener("scroll", debounce(handleScroll, 500));

  return (
    <div className="w-full p-5 desktop:border-x-[1px] desktop:min-h-[100vh] flex flex-col ">
      {loading ? (
        <p className="text-xl text-center font-semibold">Loading...</p>
      ) : posts?.length ? (
        posts.map((post, i) => (
          <div
            key={i}
            className="hover:bg-[#2b2d30] my-1 py-2 px-3 border-t-[0.5px] border-[#ffffff29] rounded-xl"
          >
            <div className="flex flex-row justify-between text-sm">
              <div className="flex flex-row items-center gap-x-2">
                <FaUser /> {post.createdBy.username}
                <ul style={{ listStyleType: "disc", marginLeft: "18px" }}>
                  <li>{getTimeElapsed(post.createdAt)}</li>
                </ul>
              </div>
              <div className="flex flex-row gap-x-2">
                {post.createdBy.username !== user.username && (
                  <button className="bg-blue-700 font-semibold py-1 px-2 rounded-full">
                    Join
                  </button>
                )}
                <button className="self-start text-base py-1 px-2 hover:bg-[#ffffff29] rounded-full leading-none font-semibold">
                  ...
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-y-3 ">
              <p className="text-xl font-bold">{post.title}</p>
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
                  {checkCurrentUserVote(post.votes, user.username).voteType ===
                  "yes" ? (
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
                  {checkCurrentUserVote(post.votes, user.username).voteType ===
                  "no" ? (
                    <TbArrowBigDown fill="#fff" className="text-white" />
                  ) : (
                    <TbArrowBigDown />
                  )}
                </button>
              </div>
              <div className="flex flex-row items-center gap-x-2 bg-gray-600 rounded-full px-2 py-1">
                <FaRegComment /> 0
              </div>
              <div className="flex flex-row items-center gap-x-2 bg-gray-600 rounded-full px-2 py-1">
                <PiShareFat /> Share
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-xl font-semibold text-center">
          You've seen it all! Time to create a post of your own?
        </p>
      )}
    </div>
  );
};

export default Posts;