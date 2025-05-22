'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { QuizSubmission, QuizQuestion } from '@/types/quiz';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import Image from 'next/image';
import Link from 'next/link';

interface QuizResultProps {
  /**
   * Quiz submission with answers and score
   */
  submission: QuizSubmission;
  
  /**
   * Quiz questions
   */
  questions: QuizQuestion[];
  
  /**
   * Quiz title
   */
  quizTitle: string;
  
  /**
   * XP earned from this quiz
   */
  xpEarned?: number;
  
  /**
   * Callback to retry the quiz
   */
  onRetry?: () => void;
  
  /**
   * Callback to review answers
   */
  onReviewAnswers?: () => void;
  
  /**
   * Is this a new best score
   */
  isNewBest?: boolean;
  
  /**
   * Additional CSS class
   */
  className?: string;
}

/**
 * Component to display quiz results with score, feedback, and rewards
 */
const QuizResult: React.FC<QuizResultProps> = ({
  submission,
  questions,
  quizTitle,
  xpEarned,
  onRetry,
  onReviewAnswers,
  isNewBest = false,
  className,
}) => {
  // Calculate results
  const correctAnswers = submission.answers.filter(answer => {
    const question = questions.find(q => q.id === answer.questionId);
    return question && answer.selectedOptionId === question.correctOptionId;
  }).length;
  
  const totalQuestions = questions.length;
  const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
  const isPassing = scorePercentage >= 70; // 70% is passing
  
  // Get feedback based on score
  const getFeedback = () => {
    if (scorePercentage === 100) {
      return "Perfect! You've mastered this topic!";
    } else if (scorePercentage >= 90) {
      return "Excellent work! You're very knowledgeable in this area.";
    } else if (scorePercentage >= 70) {
      return "Good job! You have a solid understanding of the material.";
    } else if (scorePercentage >= 50) {
      return "Not bad, but you might want to review the material again.";
    } else {
      return "Keep practicing! This topic needs more review.";
    }
  };
  
  // Launch confetti if passing score
  React.useEffect(() => {
    if (isPassing && isNewBest) {
      const launchConfetti = () => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      };
      
      launchConfetti();
      
      // Fire a second burst for more effect
      setTimeout(launchConfetti, 500);
    }
  }, [isPassing, isNewBest]);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "quiz-result p-6 rounded-lg border-2 border-pixel",
        isPassing ? "bg-accent/10 border-accent" : "bg-dark-800/90 border-primary",
        className
      )}
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-pixel mb-2">Quiz Results</h2>
        <p className="text-gray-400">{quizTitle}</p>
      </div>
      
      {/* Score display */}
      <div className="score-display flex items-center justify-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 10 }}
          className={cn(
            "score-circle w-36 h-36 rounded-full flex items-center justify-center border-4",
            isPassing ? "border-accent" : "border-primary"
          )}
        >
          <div className="text-center">
            <span className="block text-3xl font-pixel">
              {scorePercentage}%
            </span>
            <span className="text-sm opacity-80">
              {correctAnswers}/{totalQuestions}
            </span>
          </div>
        </motion.div>
      </div>
      
      {/* Feedback message */}
      <div className="feedback-message text-center mb-6">
        <h3 className={cn(
          "text-xl font-medium mb-2",
          isPassing ? "text-accent" : "text-primary"
        )}>
          {isPassing ? "Congratulations!" : "Keep Learning!"}
        </h3>
        <p>{getFeedback()}</p>
      </div>
      
      {/* Rewards section */}
      {isPassing && xpEarned && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rewards-section bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6"
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center mr-6">
              <Image
                src="/assets/ui/icons/xp.png"
                alt="XP"
                width={24}
                height={24}
                className="mr-2"
              />
              <span className="font-pixel text-primary">+{xpEarned} XP</span>
            </div>
            
            {isNewBest && (
              <div className="flex items-center">
                <Image
                  src="/assets/ui/icons/trophy.png"
                  alt="Trophy"
                  width={24}
                  height={24}
                  className="mr-2"
                />
                <span className="font-pixel text-warning">New Best Score!</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Question breakdown */}
      <div className="questions-breakdown mb-6">
        <h4 className="font-medium mb-3">Question Breakdown:</h4>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {questions.map((question, index) => {
            const answer = submission.answers.find(a => a.questionId === question.id);
            const isCorrect = answer?.selectedOptionId === question.correctOptionId;
            
            return (
              <div
                key={question.id}
                className={cn(
                  "question-result w-full aspect-square rounded-md flex items-center justify-center text-xs font-medium",
                  isCorrect 
                    ? "bg-accent/20 text-accent border border-accent/30" 
                    : "bg-danger/20 text-danger border border-danger/30"
                )}
                title={`Question ${index + 1}${isCorrect ? ': Correct' : ': Incorrect'}`}
              >
                {index + 1}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="action-buttons flex flex-col sm:flex-row items-center justify-center gap-4">
        {onReviewAnswers && (
          <button
            onClick={onReviewAnswers}
            className="px-6 py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-lg font-pixel text-sm transition-colors w-full sm:w-auto"
          >
            Review Answers
          </button>
        )}
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 bg-primary hover:bg-primary/80 text-white rounded-lg font-pixel text-sm transition-colors w-full sm:w-auto"
          >
            Try Again
          </button>
        )}
        
        <Link
          href="/quiz"
          className="px-6 py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-lg font-pixel text-sm transition-colors text-center w-full sm:w-auto"
        >
          More Quizzes
        </Link>
      </div>
    </motion.div>
  );
};

export default QuizResult;
