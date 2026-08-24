import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { checkAuthStatus } from "./shared/actions";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import CreatePost from "./pages/NewPost";
import ProtectedRoute from "./components/protectedRoute";
import PostDetailPage from "./pages/PostDetailPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <div className="flex flex-col max-w-full">
        <Header />
        <div className="flex flex-row w-full justify-between">
          <div className="desktop:flex hidden w-[30%]">
            <Sidebar />
          </div>
          <div className="z-[999] w-full">
            <Routes>
              <Route path="/*" element={<Home />} />
              <Route
                path="/create-post"
                element={<ProtectedRoute element={CreatePost} />}
              />
              <Route path="/post/:postId" element={<PostDetailPage />} />
              <Route path="/user/:username" element={<ProfilePage />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
