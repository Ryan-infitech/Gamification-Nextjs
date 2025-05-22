import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle,
  Clock,
  FileQuestion,
  Flag,
  RotateCcw,
  Share2,
  Trophy,
  XCircle,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { slideIn } from '@/lib/utils/motion';
import { useQuiz } from '@/hooks/useQuiz';
import { MetaTags } from '@/components/meta-tags';
import { MainLayout } from '@/components/layout/main-layout';

export default function QuizPage() {
  const router = useRouter();
  const { id } = router.query;
  const {
    quiz,
    isLoading,
    error,
    startQuiz,
    submitQuiz,
    userAnswers,
    setUserAnswer,
    clearQuiz,
    quizState,
    setQuizState,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    nextQuestion,
    prevQuestion,
    isSubmitting,
    score,
    handleSelectAnswer,
    handleStartQuiz,
    handleNextQuestion,
    handlePrevQuestion,
    handleSubmitQuiz,
    handleReviewQuiz,
  } = useQuiz(id as string);

  const [showHint, setShowHint] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      // Fetch quiz details by ID
      // Handle loading and error states
    }
  }, [id]);

  // Format time in seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Get current question based on index
  const getCurrentQuestion = () => {
    return quiz?.questions[currentQuestionIndex];
  };

  // Check if a question is answered
  const isQuestionAnswered = (questionId: string) => {
    return userAnswers.some(answer => answer.questionId === questionId);
  };

  // Get answer status for review mode
  const getAnswerStatus = (questionId: string, optionId: string) => {
    if (quizState !== 'review' && quizState !== 'completed') return 'default';
    
    const question = quiz?.questions.find(q => q.id === questionId);
    const userAnswer = userAnswers.find(a => a.questionId === questionId);
    
    if (!question || !userAnswer) return 'default';
    
    if (question.correct_option === optionId) {
      return 'correct';
    } else if (userAnswer.selectedOptionId === optionId) {
      return 'incorrect';
    }
    
    return 'default';
  };
  
  // Get current question progress percentage
  const getProgressPercentage = () => {
    if (!quiz) return 0;
    return Math.round(((currentQuestionIndex + 1) / quiz.questions.length) * 100);
  };
  
  // Render based on current state
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="loading-spinner" />
          <p className="mt-4 font-pixel-body text-muted-foreground">Loading quiz...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle className="h-16 w-16 text-danger mb-4" />
          <h2 className="text-xl font-pixel-heading mb-2">Failed to load quiz</h2>
          <p className="text-muted-foreground font-pixel-body mb-6">
            There was an error loading this quiz. Please try again later.
          </p>
          <Button asChild className="font-pixel-body">
            <Link href="/quiz">Return to Quizzes</Link>
          </Button>
        </div>
      );
    }
    
    if (!quiz) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle className="h-16 w-16 text-danger mb-4" />
          <h2 className="text-xl font-pixel-heading mb-2">Quiz Not Found</h2>
          <p className="text-muted-foreground font-pixel-body mb-6">
            The quiz you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild className="font-pixel-body">
            <Link href="/quiz">Browse Quizzes</Link>
          </Button>
        </div>
      );
    }
    
    switch (quizState) {
      case 'intro':
        return renderIntroScreen();
      case 'in-progress':
        return renderQuizInProgress();
      case 'completed':
        return renderQuizCompleted();
      case 'review':
        return renderQuizReview();
      default:
        return null;
    }
  };
  
  // Render intro screen
  const renderIntroScreen = () => {
    if (!quiz) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card border-2 border-border rounded-lg overflow-hidden max-w-4xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          <div className="md:col-span-2 p-8">
            <h1 className="text-2xl font-pixel-heading mb-4">{quiz.title}</h1>
            <p className="text-muted-foreground font-pixel-body mb-6">
              {quiz.description || "Test your knowledge with this quiz and earn rewards!"}
            </p>
            
            <div className="space-y-6 mb-6">
              <div className="flex items-center">
                <FileQuestion className="h-5 w-5 text-primary mr-2" />
                <span className="font-pixel-body">{quiz.questions.length} Questions</span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-primary mr-2" />
                <span className="font-pixel-body">
                  {quiz.time_limit ? `${Math.floor(quiz.time_limit / 60)} minutes` : 'No time limit'}
                </span>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-primary mr-2" />
                  <span className="font-pixel-body">{quiz.xp_reward || 100} XP</span>
                </div>
                
                <div className="flex items-center">
                  <Image 
                    src="/assets/ui/coin.svg" 
                    alt="Coins" 
                    width={20} 
                    height={20} 
                    className="mr-2" 
                  />
                  <span className="font-pixel-body">{quiz.coin_reward || 20} Coins</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button onClick={handleStartQuiz} className="font-pixel-body" size="lg">
                Start Quiz
              </Button>
              
              <Button variant="outline" asChild className="font-pixel-body" size="lg">
                <Link href="/quiz">
                  Back to Quizzes
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="bg-primary/5 border-l border-border p-8 flex flex-col">
            <h3 className="font-pixel-heading text-lg mb-4">Quiz Details</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground font-pixel-body mb-1">Difficulty</p>
                <Badge
                  variant={
                    quiz.difficulty === 'easy' ? 'success' : 
                    quiz.difficulty === 'medium' ? 'warning' : 
                    'danger'
                  }
                >
                  {quiz.difficulty}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground font-pixel-body mb-1">Category</p>
                <Badge variant="outline">{quiz.category}</Badge>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground font-pixel-body mb-1">Passing Score</p>
                <span className="font-pixel-body">70%</span>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground font-pixel-body mb-1">Attempts</p>
                <span className="font-pixel-body">{quiz.attempts || 0} attempts</span>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground font-pixel-body mb-1">Average Score</p>
                <span className="font-pixel-body">{quiz.avg_score || 0}%</span>
              </div>
            </div>
            
            <div className="mt-auto">
              <p className="text-sm font-pixel-body mb-2">Recommended for:</p>
              <div className="flex flex-wrap gap-2">
                {quiz.recommended_for?.map((level, index) => (
                  <Badge key={index} variant="secondary" className="font-pixel-body">
                    Level {level}+
                  </Badge>
                )) || (
                  <Badge variant="secondary" className="font-pixel-body">
                    All Levels
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };
  
  // Render quiz in progress
  const renderQuizInProgress = () => {
    if (!quiz) return null;
    
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return null;
    
    return (
      <div className="max-w-4xl mx-auto">
        {/* Top Bar with progress and timer */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm"
              asChild
              className="font-pixel-body"
            >
              <Link href="/quiz">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Exit Quiz
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <FileQuestion className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="font-pixel-body text-sm">
                {currentQuestionIndex + 1}/{quiz.questions.length}
              </span>
            </div>
            
            {timeRemaining !== null && (
              <div className={`flex items-center ${timeRemaining < 60 ? 'text-danger animate-pulse' : ''}`}>
                <Clock className="h-4 w-4 mr-1" />
                <span className="font-pixel-body text-sm">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out" 
              style={{ width: `${getProgressPercentage()}%` }} 
            />
          </div>
        </div>
        
        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            variants={slideIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-card border-2 border-border rounded-lg overflow-hidden mb-6"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-pixel-heading">Question {currentQuestionIndex + 1}</h2>
                <Badge
                  variant={
                    currentQuestion.difficulty === 'easy' ? 'success' : 
                    currentQuestion.difficulty === 'medium' ? 'warning' : 
                    'danger'
                  }
                >
                  {currentQuestion.difficulty}
                </Badge>
              </div>
              
              <p className="font-pixel-body text-lg mb-6">
                {currentQuestion.question}
              </p>
              
              {/* Answer options */}
              <div className="space-y-3">
                <RadioGroup 
                  value={userAnswers.find(a => a.questionId === currentQuestion.id)?.selectedOptionId || ''}
                  onValueChange={(value) => handleSelectAnswer(currentQuestion.id, value)}
                >
                  {currentQuestion.options.map((option: QuizOption) => (
                    <div
                      key={option.id}
                      className="flex items-center border border-border bg-background/50 rounded-md p-3 hover:bg-primary/5 transition-colors cursor-pointer"
                      onClick={() => handleSelectAnswer(currentQuestion.id, option.id)}
                    >
                      <RadioGroupItem value={option.id} id={option.id} className="mr-3" />
                      <label htmlFor={option.id} className="font-pixel-body flex-grow cursor-pointer">
                        {option.text}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              {/* Show hint if requested */}
              {showHint && currentQuestion.hint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-md"
                >
                  <p className="font-pixel-body text-sm">
                    <span className="font-bold">Hint:</span> {currentQuestion.hint}
                  </p>
                </motion.div>
              )}
            </div>
            
            {/* Card footer with navigation */}
            <div className="border-t border-border bg-card p-4 flex justify-between">
              <div>
                {currentQuestionIndex > 0 && (
                  <Button 
                    onClick={handlePrevQuestion} 
                    variant="outline"
                    className="font-pixel-body"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                {!showHint && currentQuestion.hint && (
                  <Button 
                    onClick={() => setShowHint(true)}
                    variant="ghost"
                    className="font-pixel-body"
                  >
                    Show Hint
                  </Button>
                )}
                
                <Button 
                  onClick={handleNextQuestion}
                  disabled={!isQuestionAnswered(currentQuestion.id)}
                  className="font-pixel-body"
                >
                  {currentQuestionIndex < quiz.questions.length - 1 ? (
                    <>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Finish Quiz
                      <Flag className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Footer showing completion */}
        <div className="flex justify-center">
          <p className="text-sm font-pixel-body text-muted-foreground">
            {Object.keys(userAnswers).length} of {quiz.questions.length} questions answered
          </p>
        </div>
        
        {/* Confirm dialog */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent className="border-2">
            <DialogHeader>
              <DialogTitle className="font-pixel-heading">Submit Quiz?</DialogTitle>
              <DialogDescription className="font-pixel-body">
                Are you sure you want to submit your answers? You won't be able to change them after submission.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-between mt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsConfirmDialogOpen(false)}
                className="font-pixel-body"
              >
                Review Answers
              </Button>
              <Button 
                onClick={handleSubmitQuiz}
                isLoading={isSubmitting}
                className="font-pixel-body"
              >
                Submit Quiz
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };
  
  // Render quiz review
  const renderQuizReview = () => {
    if (!quiz) return null;
    
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return null;
    
    return (
      <div className="max-w-4xl mx-auto">
        {/* Top Bar with progress */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setQuizState('completed')}
              className="font-pixel-body"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Results
            </Button>
          </div>
          
          <div className="flex items-center">
            <FileQuestion className="h-4 w-4 mr-1 text-muted-foreground" />
            <span className="font-pixel-body text-sm">
              {currentQuestionIndex + 1}/{quiz.questions.length}
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out" 
              style={{ width: `${getProgressPercentage()}%` }} 
            />
          </div>
        </div>
        
        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            variants={slideIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-card border-2 border-border rounded-lg overflow-hidden mb-6"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-pixel-heading">Question {currentQuestionIndex + 1}</h2>
                <Badge
                  variant={
                    currentQuestion.difficulty === 'easy' ? 'success' : 
                    currentQuestion.difficulty === 'medium' ? 'warning' : 
                    'danger'
                  }
                >
                  {currentQuestion.difficulty}
                </Badge>
              </div>
              
              <p className="font-pixel-body text-lg mb-6">
                {currentQuestion.question}
              </p>
              
              {/* Answer options with correct/incorrect highlighting */}
              <div className="space-y-3">
                {currentQuestion.options.map((option: QuizOption) => {
                  const status = getAnswerStatus(currentQuestion.id, option.id);
                  return (
                    <div
                      key={option.id}
                      className={`flex items-center border rounded-md p-3 ${
                        status === 'correct' ? 'bg-accent/10 border-accent' : 
                        status === 'incorrect' ? 'bg-danger/10 border-danger' : 
                        'border-border bg-background/50'
                      }`}
                    >
                      <div className="mr-3">
                        {status === 'correct' ? (
                          <CheckCircle className="h-5 w-5 text-accent" />
                        ) : status === 'incorrect' ? (
                          <XCircle className="h-5 w-5 text-danger" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border border-muted-foreground" />
                        )}
                      </div>
                      <div className="font-pixel-body flex-grow">{option.text}</div>
                    </div>
                  );
                })}
              </div>
              
              {/* Show explanation */}
              {currentQuestion.explanation && (
                <div className="mt-6 p-4 bg-card border border-border rounded-md">
                  <p className="font-pixel-body text-sm">
                    <span className="font-bold">Explanation:</span> {currentQuestion.explanation}
                  </p>
                </div>
              )}
            </div>
            
            {/* Card footer with navigation */}
            <div className="border-t border-border bg-card p-4 flex justify-between">
              <div>
                {currentQuestionIndex > 0 && (
                  <Button 
                    onClick={handlePrevQuestion} 
                    variant="outline"
                    className="font-pixel-body"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                )}
              </div>
              
              <div>
                {currentQuestionIndex < quiz.questions.length - 1 ? (
                  <Button 
                    onClick={handleNextQuestion}
                    className="font-pixel-body"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setQuizState('completed')}
                    className="font-pixel-body"
                  >
                    Finish Review
                    <Flag className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };
  
  // Render quiz completed with results
  const renderQuizCompleted = () => {
    if (!quiz || score === null) return null;
    
    // Calculate summary statistics
    const totalQuestions = quiz.questions.length;
    const answeredQuestions = userAnswers.length;
    const correctAnswers = userAnswers.filter(answer => {
      const question = quiz.questions.find(q => q.id === answer.questionId);
      return question && question.correct_option === answer.selectedOptionId;
    }).length;
    
    // Determine pass/fail status
    const isPassed = score >= 70;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="border-2 mb-6">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-start">
              <CardTitle className="text-2xl font-pixel-heading">Quiz Results</CardTitle>
              <Badge 
                variant={isPassed ? 'success' : 'danger'}
                className="text-base px-3 py-1"
              >
                {isPassed ? 'PASSED' : 'FAILED'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-40 h-40 mb-4">
                {isPassed ? (
                  <>
                    <div className="absolute inset-0 bg-accent/10 rounded-full animate-pulse-glow" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Trophy className="h-20 w-20 text-accent" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-muted rounded-full" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <RotateCcw className="h-20 w-20 text-muted-foreground" />
                    </div>
                  </>
                )}
              </div>
              
              <div className="text-center">
                <h3 className="text-4xl font-pixel-heading mb-2">{score}%</h3>
                <p className="text-lg font-pixel-body text-muted-foreground">
                  Your Score
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex flex-col items-center p-4 border border-border rounded-lg">
                <div className="text-2xl font-pixel-heading mb-1">{correctAnswers}</div>
                <div className="text-sm font-pixel-body text-muted-foreground">
                  Correct Answers
                </div>
              </div>
              
              <div className="flex flex-col items-center p-4 border border-border rounded-lg">
                <div className="text-2xl font-pixel-heading mb-1">
                  {totalQuestions - correctAnswers}
                </div>
                <div className="text-sm font-pixel-body text-muted-foreground">
                  Incorrect Answers
                </div>
              </div>
              
              <div className="flex flex-col items-center p-4 border border-border rounded-lg">
                <div className="text-2xl font-pixel-heading mb-1">
                  {totalQuestions - answeredQuestions}
                </div>
                <div className="text-sm font-pixel-body text-muted-foreground">
                  Unanswered
                </div>
              </div>
            </div>
            
            {isPassed && (
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-6 mb-8">
                <h3 className="font-pixel-heading text-lg mb-4">Rewards Earned</h3>
                <div className="flex justify-around">
                  <div className="flex flex-col items-center">
                    <Award className="h-10 w-10 text-primary mb-2" />
                    <span className="text-xl font-pixel-heading">{quiz.xp_reward || 100}</span>
                    <span className="text-sm font-pixel-body text-muted-foreground">XP</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <Image 
                      src="/assets/ui/coin.svg" 
                      alt="Coins" 
                      width={40} 
                      height={40} 
                      className="mb-2" 
                    />
                    <span className="text-xl font-pixel-heading">{quiz.coin_reward || 20}</span>
                    <span className="text-sm font-pixel-body text-muted-foreground">Coins</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <Badge variant="secondary" className="h-10 flex items-center justify-center mb-2">NEW</Badge>
                    <span className="text-xl font-pixel-heading">1</span>
                    <span className="text-sm font-pixel-body text-muted-foreground">Badge</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button onClick={handleReviewQuiz} className="font-pixel-body" size="lg">
                <ListChecks className="mr-2 h-5 w-5" />
                Review Answers
              </Button>
              
              {!isPassed && (
                <Button 
                  onClick={handleStartQuiz}
                  variant="outline" 
                  className="font-pixel-body" 
                  size="lg"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Try Again
                </Button>
              )}
              
              <Button 
                asChild
                variant="outline" 
                className="font-pixel-body" 
                size="lg"
              >
                <Link href="/quiz">
                  <Home className="mr-2 h-5 w-5" />
                  Back to Quizzes
                </Link>
              </Button>
              
              <Button 
                variant="ghost" 
                className="font-pixel-body" 
                size="lg"
              >
                <Share2 className="mr-2 h-5 w-5" />
                Share Result
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {isPassed && quiz.next_recommended && (
          <Card className="border-2 border-primary/50 bg-primary/5">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="md:flex-1">
                  <h3 className="font-pixel-heading text-lg mb-2">Continue Learning</h3>
                  <p className="font-pixel-body text-muted-foreground mb-4">
                    Ready for your next challenge? Check out this recommended quiz:
                  </p>
                  <h4 className="font-pixel-heading">{quiz.next_recommended.title}</h4>
                </div>
                
                <Button 
                  asChild
                  size="lg" 
                  className="md:w-auto w-full font-pixel-body"
                >
                  <Link href={`/quiz/${quiz.next_recommended.id}`}>
                    Start Next Quiz
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    );
  };
  
  return (
    <MainLayout>
      <MetaTags 
        title={`${quiz?.title || 'Quiz'} - Gamifikasi CS`} 
        description="Test your programming knowledge with this interactive quiz." 
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-background/60 py-8">
        <div className="container px-4 mx-auto">
          {renderContent()}
        </div>
      </div>
    </MainLayout>
  );
}