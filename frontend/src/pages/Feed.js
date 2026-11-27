import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
// import { useState } from 'react';
// import { AnimatePresence } from 'framer-motion';
// import { Post } from '../components/posts/Post';
// import { FullPostModal } from '../components/posts/FullPostModal';
// import { postData } from '../components/posts/postData';


// Placeholder until the posts feed is wired up (see the commented-out code below).
function EmptyFeed() {
  const navigate = useNavigate();
  return (
    <div className="px-4 py-16 text-center sm:py-24">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
        <Compass className="h-7 w-7 text-green-700" />
      </div>
      <h2 className="text-xl font-semibold text-gray-800">Your feed is empty</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
        Join a few channels and posts from your classmates will show up here.
      </p>
      <button
        type="button"
        onClick={() => navigate("/explore")}
        className="mt-6 inline-flex items-center rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700"
      >
        Explore channels
      </button>
    </div>
  );
}

export function Feed() {
  return <EmptyFeed />;
  // const [selectedPost, setSelectedPost] = useState(null);
  // const [posts] = useState(postData); 

  // return (
  //   <div className="w-full h-full px-4 py-8">
  //     {posts.map((post) => (
  //       <Post
  //         key={post.id} 
  //         post={post} 
  //         onClick={() => setSelectedPost(post)}
  //       />
  //     ))}
  //     <AnimatePresence>
  //       {selectedPost && (
  //         <FullPostModal
  //           post={selectedPost}
  //           isOpen={!!selectedPost}
  //           onClose={() => setSelectedPost(null)}
  //         />
  //       )}
  //     </AnimatePresence>
  //   </div>
  // )
}