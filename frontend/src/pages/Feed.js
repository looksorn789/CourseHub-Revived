import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Post } from '../components/posts/Post';
import { FullPostModal } from '../components/posts/FullPostModal';
import { postData } from '../components/posts/postData';


export function Feed() {
  const [selectedPost, setSelectedPost] = useState(null);
  const [posts] = useState(postData); 

  return (
    <div className="w-full h-full px-4 py-8">
      {posts.map((post) => (
        <Post
          key={post.id} 
          post={post} 
          onClick={() => setSelectedPost(post)}
        />
      ))}
      <AnimatePresence>
        {selectedPost && (
          <FullPostModal
            post={selectedPost}
            isOpen={!!selectedPost}
            onClose={() => setSelectedPost(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}