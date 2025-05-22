'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuiz } from '@/hooks/useQuiz';
import { cn } from '@/lib/utils';
import { Quiz } from '@/types/quiz';
import { Spinner } from '@/components/ui/spinner';

interface QuizListProps {
  /**
   * Filter by category
   */
  category?: string;
  
  /**
   * Max number of quizzes to show
   */
  limit?: number;
  
  /**
   * Show completed quizzes
   */
  showCompleted?: boolean;
  
  /**
   * Additional CSS class
   */
  className?: string;
}

/**
 * Component to display a list of available quizzes
 */
const QuizList: React.FC<QuizListProps> = ({
  category,
  limit,
  showCompleted = true,
  className,
}) => {
  const router = useRouter();
  const { quizzes, isLoading, error } = useQuiz({ category, limit });
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  
  // Handle quiz selection
  const handleQuizClick = (quiz: Quiz) => {
    if (expandedQuizId === quiz.id) {
      // If already expanded, navigate to the quiz
      router.push(`/quiz/${quiz.id}`);
    } else {
      // Otherwise expand it
      setExpandedQuizId(quiz.id);
    }
  };
  
  // Filter quizzes based on completion status if needed
  const filteredQuizzes = showCompleted 
    ? quizzes 
    : quizzes.filter(quiz => !quiz.isCompleted);
  
  // Animation variants for quiz cards
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
        ease: "easeOut"
      }
    })
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-6 bg-danger/10 border-2 border-danger/30 rounded-lg">
        <h3 className="text-danger font-bold">Error Loading Quizzes</h3>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }
  
  if (filteredQuizzes.length === 0) {
    return (
      <div className="text-center p-6 bg-dark-700/10 border-2 border-dark-600/30 rounded-lg">
        <h3 className="font-pixel text-lg">No Quizzes Available</h3>
        <p className="text-sm mt-2">
          {category 
            ? `No quizzes found in the "${category}" category.` 
            : 'No quizzes are currently available.'}
        </p>
      </div>
    );
  }
  
  return (
    <div className={cn("quiz-list-container space-y-4", className)}>
      {filteredQuizzes.map((quiz, index) => (
        <motion.div
          key={quiz.id}
          custom={index}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "quiz-card border-2 rounded-lg overflow-hidden cursor-pointer transform transition-all duration-200",
            expandedQuizId === quiz.id 
              ? "border-primary bg-primary/10" 
              : "border-pixel bg-dark-800/60 hover:bg-dark-700/80",
            quiz.isCompleted && "border-accent/50"
          )}
          onClick={() => handleQuizClick(quiz)}
        >
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-pixel text-lg">{quiz.title}</h3>
                <div className="flex items-center mt-2 space-x-2 text-sm text-gray-400">
                  <span className="px-2 py-1 bg-dark-600 rounded text-xs">{quiz.category}</span>
                  <span>•</span>
                  <span>{quiz.questionCount} questions</span>
                  <span>•</span>
                  <span>{quiz.estimatedMinutes} min</span>
                </div>
              </div>
              <div className="flex items-center">
                {quiz.isCompleted && (
                  <div className="flex items-center bg-accent/20 text-accent px-2 py-1 rounded text-xs">
                    <svg 
                      className="w-3 h-3 mr-1" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                    Completed
                  </div>
                )}
                {quiz.xpReward && (
                  <div className="ml-2 bg-primary/20 text-primary px-2 py-1 rounded text-xs">
                    {quiz.xpReward} XP
                  </div>
                )}
              </div>
            </div>
            
            {/* Expanded content */}
            {expandedQuizId === quiz.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <p className="text-sm text-gray-300 mb-4">{quiz.description}</p>
                
                <div className="bg-dark-700/80 p-3 rounded mb-4">
                  <h4 className="text-sm font-medium mb-2">Topics:</h4>
                  <div className="flex flex-wrap gap-2">
                    {quiz.topics.map(topic => (
                      <span 
                        key={topic} 
                        className="px-2 py-1 bg-dark-600 text-xs rounded-full text-gray-300"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="bg-dark-700/80 p-3 rounded flex-1">
                    <h4 className="text-sm font-medium mb-1">Difficulty:</h4>
                    <div className="flex items-center">
                      <div 
                        className={cn(
                          "h-2 rounded-full flex-1",
                          quiz.difficulty === 'easy' ? "bg-accent" : "bg-dark-600",
                          quiz.difficulty === 'medium' ? "bg-warning" : "",
                          quiz.difficulty === 'hard' ? "bg-danger" : ""
                        )}
                      />
                      <div 
                        className={cn(
                          "h-2 rounded-full flex-1 ml-1",
                          quiz.difficulty === 'medium' ? "bg-warning" : "bg-dark-600",
                          quiz.difficulty === 'hard' ? "bg-danger" : ""
                        )}
                      />
                      <div 
                        className={cn(
                          "h-2 rounded-full flex-1 ml-1",
                          quiz.difficulty === 'hard' ? "bg-danger" : "bg-dark-600"
                        )}
                      />
                    </div>
                  </div>
                  
                  {quiz.bestScore !== undefined && (
                    <div className="bg-dark-700/80 p-3 rounded flex-1">
                      <h4 className="text-sm font-medium mb-1">Your Best Score:</h4>
                      <div className="flex items-center">
                        <div 
                          className="h-2 bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${quiz.bestScore}%` }}
                        />
                        <span className="ml-2 text-xs">{quiz.bestScore}%</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-center mt-4">
                  <button 
                    className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg font-pixel text-sm transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/quiz/${quiz.id}`);
                    }}
                  >
                    {quiz.isCompleted ? 'Try Again' : 'Start Quiz'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default QuizList;
