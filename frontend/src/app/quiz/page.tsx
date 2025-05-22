'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
  FileQuestion, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Clock, 
  Award,
  BarChart,
  CheckCircle,
  XCircle,
  ChevronRight,
  Trophy
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/Tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  ProgressBar
} from '@/components/ui/ProgressBar';

import { useAuth } from '@/hooks/useAuth';
import { useQuizzes } from '@/hooks/useQuizzes';
import MainLayout from '@/components/layout/MainLayout';
import NoResults from '@/components/ui/NoResults';
import MetaTags from '@/components/common/MetaTags';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
};

export default function QuizPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { user } = useAuth();
  
  // Extract query parameters
  const categoryParam = searchParams.get('category') || 'all';
  const difficultyParam = searchParams.get('difficulty') || 'all';
  const searchQuery = searchParams.get('q') || '';
  
  // State for filtering and display options
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentTab, setCurrentTab] = useState<string>('all');
  const [searchInput, setSearchInput] = useState(searchQuery);
  
  // Fetch quizzes with current filters
  const { 
    quizzes, 
    isLoading, 
    error,
    categories,
    fetchQuizzes
  } = useQuizzes({
    category: categoryParam !== 'all' ? categoryParam : undefined,
    difficulty: difficultyParam !== 'all' ? difficultyParam : undefined,
    search: searchQuery || undefined
  });
  
  // Handle search input
  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (searchInput) {
      params.set('q', searchInput);
    } else {
      params.delete('q');
    }
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Handle filter changes
  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Handle keyboard event for search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    router.push(pathname);
    setSearchInput('');
  };
  
  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  // Format time estimate
  const formatTimeEstimate = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };
  
  return (
    <MainLayout>
      <MetaTags 
        title="Quizzes - Gamifikasi CS" 
        description="Test your programming and Computer Science knowledge with interactive quizzes and earn rewards."
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-background/60 pt-6 pb-12">
        <div className="container px-4 mx-auto">
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-pixel-heading text-gradient mb-2">Quizzes</h1>
              <p className="text-muted-foreground font-pixel-body">
                Test your knowledge and earn XP with our interactive quizzes
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'outline'} 
                size="icon"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'outline'} 
                size="icon"
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Search and Filter section */}
          <Card className="mb-8 border-2">
            <CardContent className="pt-6 pb-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search quizzes..."
                    className="pl-9 font-pixel-body"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={categoryParam}
                    onValueChange={(value) => updateFilters('category', value)}
                  >
                    <SelectTrigger className="w-[140px] font-pixel-body">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={difficultyParam}
                    onValueChange={(value) => updateFilters('difficulty', value)}
                  >
                    <SelectTrigger className="w-[140px] font-pixel-body">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" onClick={handleSearch} className="font-pixel-body">
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={resetFilters} 
                    className="font-pixel-body text-muted-foreground"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Featured Quiz */}
          {!isLoading && quizzes.length > 0 && (
            <div className="mb-8">
              <Card className="border-2 overflow-hidden border-primary/60 bg-primary/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 p-6">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-xl font-pixel-heading flex items-center">
                        <Trophy className="h-5 w-5 mr-2 text-primary" />
                        Featured Quiz
                      </CardTitle>
                      {user && user.level && (
                        <Badge variant="secondary" className="font-pixel-body">
                          Level {user.level}+ Recommended
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-pixel-heading mb-2">{quizzes[0].title}</h3>
                    
                    <p className="font-pixel-body mb-4">
                      {quizzes[0].description || "Test your knowledge with this quiz and earn XP and coins!"}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant={getDifficultyColor(quizzes[0].difficulty)}>
                        {quizzes[0].difficulty}
                      </Badge>
                      <Badge variant="outline">
                        {quizzes[0].category}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <FileQuestion className="h-3 w-3" />
                        {quizzes[0].question_count} questions
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeEstimate(quizzes[0].time_estimate || 10)}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-primary mr-1" />
                        <span className="font-pixel-body">{quizzes[0].xp_reward || 100} XP</span>
                      </div>
                      <div className="flex items-center">
                        <Image 
                          src="/assets/ui/coin.svg" 
                          alt="Coins" 
                          width={16} 
                          height={16} 
                          className="mr-1" 
                        />
                        <span className="font-pixel-body">{quizzes[0].coin_reward || 20} Coins</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="font-pixel-body"
                      asChild
                    >
                      <Link href={`/quiz/${quizzes[0].id}`}>
                        Start Quiz
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <div className="relative hidden md:block">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/30">
                      <div className="absolute bottom-6 right-6 flex flex-col items-end">
                        <Badge variant="secondary" className="font-pixel-body mb-2">
                          {quizzes[0].attempts || 0} attempts
                        </Badge>
                        <Badge variant="secondary" className="font-pixel-body">
                          Avg. score: {quizzes[0].avg_score || 0}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
          
          {/* Quiz tabs */}
          <Tabs defaultValue="all" className="mb-8" value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all" className="font-pixel-body">All Quizzes</TabsTrigger>
              <TabsTrigger value="completed" className="font-pixel-body">Completed</TabsTrigger>
              <TabsTrigger value="inprogress" className="font-pixel-body">In Progress</TabsTrigger>
              <TabsTrigger value="new" className="font-pixel-body">New</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {isLoading ? (
                // Loading state
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-4`}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="border rounded-lg overflow-hidden">
                      <Skeleton className="h-40 w-full" />
                      <div className="p-4">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !quizzes.length ? (
                // No results
                <NoResults 
                  title="No quizzes found" 
                  description="Try adjusting your filters or search query"
                  actionLabel="Reset Filters"
                  onAction={resetFilters}
                />
              ) : (
                // Quizzes grid/list
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-4`}
                >
                  {quizzes.map((quiz) => (
                    <motion.div key={quiz.id} variants={itemVariants}>
                      <Link href={`/quiz/${quiz.id}`}>
                        <Card className={`h-full border-2 hover:border-primary/50 hover:shadow-md transition-all ${viewMode === 'list' ? 'flex flex-row' : ''}`}>
                          {/* Quiz Icon/Badge */}
                          {viewMode === 'grid' && (
                            <div className="relative aspect-[4/1] bg-primary/5 flex items-center justify-center border-b border-border">
                              <Badge variant={getDifficultyColor(quiz.difficulty)} className="absolute top-3 right-3">
                                {quiz.difficulty}
                              </Badge>
                              <div className="flex items-center">
                                <FileQuestion className="h-6 w-6 text-primary mr-2" />
                                <span className="font-pixel-heading text-sm">{quiz.question_count} Questions</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Content */}
                          <div className="flex-1">
                            <CardHeader className={viewMode === 'list' ? 'py-3 px-4' : ''}>
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-xl font-pixel-heading line-clamp-2">
                                  {quiz.title}
                                </CardTitle>
                                {viewMode === 'list' && (
                                  <Badge variant={getDifficultyColor(quiz.difficulty)}>
                                    {quiz.difficulty}
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            
                            <CardContent className={viewMode === 'list' ? 'py-0 px-4' : ''}>
                              {viewMode === 'grid' && (
                                <p className="text-muted-foreground font-pixel-body mb-4 line-clamp-2">
                                  {quiz.description || "Test your knowledge with this quiz and earn rewards!"}
                                </p>
                              )}
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                <Badge variant="outline">
                                  {quiz.category}
                                </Badge>
                                
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTimeEstimate(quiz.time_estimate || 10)}
                                </Badge>
                                
                                {viewMode === 'list' && (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <FileQuestion className="h-3 w-3" />
                                    {quiz.question_count} questions
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center">
                                        <Award className="h-4 w-4 text-primary mr-1" />
                                        <span className="font-pixel-body">{quiz.xp_reward || 100} XP</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>XP reward for completion</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center">
                                        <Image 
                                          src="/assets/ui/coin.svg" 
                                          alt="Coins" 
                                          width={16} 
                                          height={16} 
                                          className="mr-1" 
                                        />
                                        <span className="font-pixel-body">{quiz.coin_reward || 20} Coins</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Coin reward for completion</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </CardContent>
                            
                            {viewMode === 'grid' && (
                              <CardFooter className="flex justify-between pt-0">
                                <div className="text-xs text-muted-foreground font-pixel-body">
                                  {quiz.attempts || 0} attempts
                                </div>
                                
                                <div className="text-xs text-muted-foreground font-pixel-body">
                                  Avg: {quiz.avg_score || 0}%
                                </div>
                              </CardFooter>
                            )}
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>
            
            {/* Other tabs content - similar structure but different data sources */}
            <TabsContent value="completed">
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Image 
                  src="/assets/decorations/pixel-checkmark.svg" 
                  alt="Completed" 
                  width={64} 
                  height={64} 
                  className="mb-4 opacity-60"
                />
                <h3 className="font-pixel-heading text-xl mb-2">Your Completed Quizzes</h3>
                <p className="font-pixel-body text-muted-foreground max-w-md mb-4">
                  You haven't completed any quizzes yet. Complete quizzes to earn XP and rewards!
                </p>
                <Button variant="outline" onClick={() => setCurrentTab('all')} className="font-pixel-body">
                  Explore All Quizzes
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="inprogress">
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Image 
                  src="/assets/decorations/pixel-hourglass.svg" 
                  alt="In Progress" 
                  width={64} 
                  height={64} 
                  className="mb-4 opacity-60"
                />
                <h3 className="font-pixel-heading text-xl mb-2">Quizzes In Progress</h3>
                <p className="font-pixel-body text-muted-foreground max-w-md mb-4">
                  You don't have any quizzes in progress. Start a quiz to continue later!
                </p>
                <Button variant="outline" onClick={() => setCurrentTab('all')} className="font-pixel-body">
                  Explore All Quizzes
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="new">
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Image 
                  src="/assets/decorations/pixel-sparkles.svg" 
                  alt="New" 
                  width={64} 
                  height={64} 
                  className="mb-4 opacity-60"
                />
                <h3 className="font-pixel-heading text-xl mb-2">New Quizzes</h3>
                <p className="font-pixel-body text-muted-foreground max-w-md mb-4">
                  Check back soon for new quizzes to test your knowledge!
                </p>
                <Button variant="outline" onClick={() => setCurrentTab('all')} className="font-pixel-body">
                  Explore All Quizzes
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Quiz Achievements */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-pixel-heading">Your Progress</h2>
              <Button variant="outline" asChild className="font-pixel-body">
                <Link href="/achievements">View All Achievements</Link>
              </Button>
            </div>
            
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Overall Progress */}
                  <div className="space-y-4">
                    <h3 className="font-pixel-heading">Overall Progress</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-pixel-body">Quizzes Completed</span>
                        <span className="font-pixel-body">0/35</span>
                      </div>
                      <ProgressBar value={0} max={100} />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-pixel-body text-muted-foreground">
                        Total XP Earned
                      </div>
                      <div className="font-pixel-body flex items-center">
                        <Award className="h-4 w-4 text-primary mr-1" />
                        0 XP
                      </div>
                    </div>
                  </div>
                  
                  {/* Category Progress */}
                  <div className="space-y-4">
                    <h3 className="font-pixel-heading">Category Progress</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-pixel-body">Programming Basics</span>
                          <span className="font-pixel-body">0/10</span>
                        </div>
                        <ProgressBar value={0} max={100} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-pixel-body">Data Structures</span>
                          <span className="font-pixel-body">0/8</span>
                        </div>
                        <ProgressBar value={0} max={100} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-pixel-body">Algorithms</span>
                          <span className="font-pixel-body">0/12</span>
                        </div>
                        <ProgressBar value={0} max={100} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Recent Achievements */}
                  <div className="space-y-4">
                    <h3 className="font-pixel-heading">Quiz Achievements</h3>
                    <div className="space-y-2">
                      <div className="p-2 border border-border rounded-md bg-card/50 flex items-center opacity-50">
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center mr-3">
                          <Trophy className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-pixel-body">Quiz Master</p>
                          <p className="text-xs text-muted-foreground">Complete 10 quizzes</p>
                        </div>
                      </div>
                      <div className="p-2 border border-border rounded-md bg-card/50 flex items-center opacity-50">
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center mr-3">
                          <Award className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-pixel-body">Perfect Score</p>
                          <p className="text-xs text-muted-foreground">Get 100% on any quiz</p>
                        </div>
                      </div>
                      <div className="p-2 border border-border rounded-md bg-card/50 flex items-center opacity-50">
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center mr-3">
                          <CheckCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-pixel-body">Streak Keeper</p>
                          <p className="text-xs text-muted-foreground">Complete 5 quizzes in a row</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
