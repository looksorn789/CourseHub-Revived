import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ThumbsUp } from 'lucide-react';
import { reactions } from '../../constants/reactions';

export function ReactionPicker({ onReact, currentReaction, isComment = false }) {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState(null);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsHovered(false), 500);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.button
        className={`px-2 py-1 rounded-md ${
          currentReaction ? 'bg-blue-50' : 'bg-transparent'
        } transition-colors duration-300 flex items-center space-x-1`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        {currentReaction ? (
          <span className="text-lg">
            {reactions.find((r) => r.name === currentReaction)?.emoji}
          </span>
        ) : isComment ? (
          <ThumbsUp className="w-4 h-4 text-gray-600" />
        ) : (
          <Heart className="w-4 h-4 text-gray-600" />
        )}
      </motion.button>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg p-1 flex space-x-1"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => e.stopPropagation()}
          >
            {reactions.map((reaction) => (
              <motion.button
                key={reaction.name}
                className="p-1 rounded-full hover:bg-gray-100 relative group"
                whileHover={{ scale: 1.2, y: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onReact(reaction.name)}
                onMouseEnter={() => setHoveredReaction(reaction.name)}
                onMouseLeave={() => setHoveredReaction(null)}
              >
                <span className="text-xl">{reaction.emoji}</span>
                {hoveredReaction === reaction.name && (
                  <motion.span
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap"
                  >
                    {reaction.name}
                  </motion.span>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
