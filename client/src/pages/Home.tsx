import { useEffect } from "react";
import { usePosts } from "../hooks/usePosts";
import { useSocket } from "../hooks/useSocket";
import PostCard from "../components/PostCard";
import CreatePost from "../components/CreatePost";
import Navbar from "../components/Navbar";
import { Loader2 } from "lucide-react";
import Layout from "../components/Layout";

const Home = () => {
  const { data: posts, isLoading, refetch } = usePosts();
  const { on, off } = useSocket();

  useEffect(() => {
    const handleNewPost = () => {
      refetch();
    };

    const handlePostLike = () => {
      refetch();
    };

    on("post:new", handleNewPost);
    on("post:like", handlePostLike);

    return () => {
      off("post:new", handleNewPost);
      off("post:like", handlePostLike);
    };
  }, [on, off, refetch]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-accent-50/30 dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-800/30">
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CreatePost />

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post, index) => (
                <div
                  key={post._id}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/40 dark:to-accent-900/40 rounded-full mb-4">
                <p className="text-4xl">Notes</p>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                No posts yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Be the first to share something amazing!
              </p>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
};

export default Home;
