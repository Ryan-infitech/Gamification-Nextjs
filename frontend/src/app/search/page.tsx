'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Calendar,
  Download,
  FileText,
  Filter,
  RefreshCcw,
  Users,
  BarChart2,
  TrendingUp,
  Clock,
  Award,
  Zap,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  Code,
  FileQuestion,
  ChevronRight,
  Activity,
  Search,
  CheckCircle,
  EyeOff,
  RefreshCw,
  Grid,
  List,
  ChevronDown,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useReports } from '@/hooks/useReports';
import AdminLayout from '@/components/admin/AdminLayout';
import MetaTags from '@/components/common/MetaTags';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import Loading from '@/components/ui/Loading';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/Sheet';

// Chart colors
const COLORS = ['#4B7BEC', '#45AAF2', '#2ECC71', '#FFA502', '#FF6B6B', '#A55EEA', '#FF7F50'];

// Mock data generator functions
const generateUserActivityData = (days = 30) => {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateString = date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    data.push({
      date: dateString,
      'Pengguna Aktif': Math.floor(Math.random() * 200) + 100,
      'Login Baru': Math.floor(Math.random() * 50) + 10,
      'Registrasi': Math.floor(Math.random() * 30) + 5,
    });
  }
  return data;
};

const generateContentUsageData = () => {
  return [
    { name: 'Materi Belajar', value: 4300 },
    { name: 'Challenges', value: 3200 },
    { name: 'Quiz', value: 2800 },
    { name: 'Game', value: 2000 },
    { name: 'Forum Diskusi', value: 1500 },
  ];
};

const generateCompletionRateData = () => {
  return [
    { name: 'Algoritma Dasar', complete: 75, incomplete: 25, total: 120 },
    { name: 'Struktur Data', complete: 62, incomplete: 38, total: 95 },
    { name: 'Object-Oriented', complete: 88, incomplete: 12, total: 110 },
    { name: 'Web Development', complete: 45, incomplete: 55, total: 80 },
    { name: 'Database', complete: 55, incomplete: 45, total: 70 },
  ];
};

const generateAchievementData = () => {
  return [
    { name: 'Pemula Coding', count: 450 },
    { name: 'Algoritma Master', count: 210 },
    { name: 'Bug Hunter', count: 180 },
    { name: 'Struktur Data Pro', count: 145 },
    { name: 'Code Reviewer', count: 95 },
    { name: 'Quiz Champion', count: 280 },
    { name: 'Learning Streak', count: 320 },
  ];
};

const generatePerformanceData = (days = 7) => {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateString = date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    data.push({
      date: dateString,
      'Response Time (ms)': Math.floor(Math.random() * 200) + 100,
      'Error Rate (%)': Math.floor(Math.random() * 2) + 0.1,
    });
  }
  return data;
};

const generateUserRetentionData = () => {
  return [
    { name: 'Minggu 1', retention: 100 },
    { name: 'Minggu 2', retention: 82 },
    { name: 'Minggu 3', retention: 73 },
    { name: 'Minggu 4', retention: 67 },
    { name: 'Minggu 5', retention: 62 },
    { name: 'Minggu 6', retention: 58 },
    { name: 'Minggu 7', retention: 55 },
    { name: 'Minggu 8', retention: 53 },
  ];
};

export default function AdminReportsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('users');
  const [timeFrame, setTimeFrame] = useState('30d');
  const [isExporting, setIsExporting] = useState(false);
  
  // Report data states
  const {
    userActivityData,
    contentUsageData,
    completionRateData,
    performanceData,
    achievementData,
    userRetentionData,
    isLoading,
    error,
    fetchReports,
  } = useReports();
  
  // Use mock data if the hook doesn't provide real data yet
  const userData = userActivityData || generateUserActivityData();
  const contentData = contentUsageData || generateContentUsageData();
  const completionData = completionRateData || generateCompletionRateData();
  const perfData = performanceData || generatePerformanceData();
  const achieveData = achievementData || generateAchievementData();
  const retentionData = userRetentionData || generateUserRetentionData();
  
  // Protect admin route
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  // Change time frame and refresh data
  const handleTimeFrameChange = (value: string) => {
    setTimeFrame(value);
    fetchReports({ timeFrame: value });
  };
  
  // Handle export report
  const handleExportReport = () => {
    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      toast({
        title: "Laporan berhasil diekspor",
        description: "File laporan telah diunduh ke perangkat Anda.",
        variant: "success",
      });
    }, 1500);
  };
  
  // Handle refresh report data
  const handleRefreshData = () => {
    fetchReports({ timeFrame });
    toast({
      title: "Memperbarui data...",
      variant: "default",
    });
  };
  
  // Extract query parameters
  const initialQuery = searchParams.get('q') || '';
  const currentContentType = (searchParams.get('type') as ContentType) || 'all';
  const currentCategory = searchParams.get('category') || '';
  const currentDifficulty = searchParams.get('difficulty') || '';
  const currentSort = searchParams.get('sort') || 'relevance';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  // State hooks
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [filterCount, setFilterCount] = useState(0);
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Custom hooks
  const { toast } = useToast();
  const { 
    results, 
    isLoading, 
    error, 
    totalCount, 
    categories,
    performSearch 
  } = useSearch();
  
  // Calculate applied filters count
  useEffect(() => {
    let count = 0;
    if (currentCategory) count++;
    if (currentDifficulty) count++;
    if (currentContentType !== 'all') count++;
    if (showCompletedOnly) count++;
    setFilterCount(count);
  }, [currentCategory, currentDifficulty, currentContentType, showCompletedOnly]);
  
  // Update search when URL params change
  useEffect(() => {
    if (initialQuery) {
      performSearch({
        query: initialQuery,
        contentType: currentContentType,
        category: currentCategory,
        difficulty: currentDifficulty,
        sort: currentSort,
        page: currentPage,
        completedOnly: showCompletedOnly
      });
    }
  }, [
    initialQuery, 
    currentContentType, 
    currentCategory, 
    currentDifficulty, 
    currentSort, 
    currentPage, 
    showCompletedOnly, 
    performSearch
  ]);
  
  // Save search query to history
  useEffect(() => {
    if (initialQuery && !searchHistory.includes(initialQuery)) {
      setSearchHistory(prev => [initialQuery, ...prev.slice(0, 4)]);
    }
  }, [initialQuery, searchHistory]);
  
  // Handle search submission
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearching(true);
    
    // Build the query string
    const params = new URLSearchParams();
    params.set('q', searchQuery);
    if (currentContentType !== 'all') params.set('type', currentContentType);
    if (currentCategory) params.set('category', currentCategory);
    if (currentDifficulty) params.set('difficulty', currentDifficulty);
    if (currentSort !== 'relevance') params.set('sort', currentSort);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    // Navigate with the updated query
    router.push(`${pathname}?${params.toString()}`);
    
    setIsSearching(false);
  };
  
  // Handle type filter change
  const handleTypeChange = (type: ContentType) => {
    const params = new URLSearchParams(searchParams);
    
    if (type === 'all') {
      params.delete('type');
    } else {
      params.set('type', type);
    }
    
    // Reset category and difficulty as they may not apply to the new content type
    params.delete('category');
    params.delete('difficulty');
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Handle category filter change
  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (!category) {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Handle difficulty filter change
  const handleDifficultyChange = (difficulty: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (!difficulty) {
      params.delete('difficulty');
    } else {
      params.set('difficulty', difficulty);
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Handle sort change
  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (sort === 'relevance') {
      params.delete('sort');
    } else {
      params.set('sort', sort);
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Handle completed filter change
  const handleCompletedOnlyChange = (checked: boolean) => {
    setShowCompletedOnly(checked);
  };
  
  // Reset all filters
  const resetFilters = () => {
    const params = new URLSearchParams();
    params.set('q', searchQuery);
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Get current filter options based on content type
  const getCurrentFilterOptions = () => {
    if (currentContentType === 'all') {
      return {
        categories: [...new Set([
          ...filterOptions.study.categories,
          ...filterOptions.challenge.categories,
          ...filterOptions.quiz.categories,
          ...filterOptions.game.categories
        ])],
        difficulties: [...new Set([
          ...filterOptions.study.difficulties,
          ...filterOptions.challenge.difficulties
        ])]
      };
    }
    
    return filterOptions[currentContentType] || { categories: [], difficulties: [] };
  };
  
  // Get type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'study':
        return 'primary';
      case 'challenge':
        return 'secondary';
      case 'quiz':
        return 'accent';
      case 'game':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
      case 'easy':
        return 'success';
      case 'intermediate':
      case 'medium':
        return 'warning';
      case 'advanced':
      case 'hard':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  return (
    <MainLayout>
      <MetaTags 
        title={initialQuery ? `Search results for "${initialQuery}" - Gamifikasi CS` : "Search - Gamifikasi CS"}
        description="Search for study materials, challenges, quizzes, and games across the platform."
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-background/60 pt-6 pb-12">
        <div className="container px-4 mx-auto">
          {/* Search Header */}
          <div className="mb-8">
            <div className="text-center max-w-2xl mx-auto mb-6">
              <h1 className="text-3xl font-pixel-heading text-gradient mb-2">
                {initialQuery ? 'Search Results' : 'Search Content'}
              </h1>
              <p className="text-muted-foreground font-pixel-body">
                {initialQuery
                  ? `Showing results for "${initialQuery}"`
                  : "Search for study materials, challenges, quizzes, and games"}
              </p>
            </div>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-6">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for anything..."
                    className="pl-9 font-pixel-body"
                  />
                </div>
                <Button 
                  type="submit" 
                  isLoading={isSearching}
                  className="font-pixel-body"
                >
                  Search
                </Button>
              </div>
              
              {/* Search History */}
              {searchHistory.length > 0 && !initialQuery && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground font-pixel-body mt-1">Recent:</span>
                  {searchHistory.map((query, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="font-pixel-body text-xs h-7"
                      onClick={() => {
                        setSearchQuery(query);
                        const params = new URLSearchParams();
                        params.set('q', query);
                        router.push(`${pathname}?${params.toString()}`);
                      }}
                    >
                      {query}
                    </Button>
                  ))}
                </div>
              )}
            </form>
            
            {initialQuery && (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 max-w-6xl mx-auto">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Content Type Tabs */}
                  <Tabs 
                    value={currentContentType} 
                    className="w-auto"
                    onValueChange={(value) => handleTypeChange(value as ContentType)}
                  >
                    <TabsList className="bg-muted/50">
                      <TabsTrigger value="all" className="font-pixel-body">All</TabsTrigger>
                      <TabsTrigger value="study" className="font-pixel-body">Study</TabsTrigger>
                      <TabsTrigger value="challenge" className="font-pixel-body">Challenges</TabsTrigger>
                      <TabsTrigger value="quiz" className="font-pixel-body">Quizzes</TabsTrigger>
                      <TabsTrigger value="game" className="font-pixel-body">Games</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  {/* Mobile Filter Button */}
                  <div className="md:hidden">
                    <Sheet open={isFilterMenuOpen} onOpenChange={setIsFilterMenuOpen}>
                      <SheetTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="font-pixel-body"
                        >
                          <Filter className="h-4 w-4 mr-2" />
                          Filters
                          {filterCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {filterCount}
                            </Badge>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-[300px]">
                        <SheetHeader>
                          <SheetTitle className="font-pixel-heading">Filters</SheetTitle>
                        </SheetHeader>
                        <div className="py-4 space-y-6">
                          {/* Mobile Category Filter */}
                          <div className="space-y-2">
                            <h3 className="font-pixel-heading text-sm mb-4 text-center">Category</h3>
                            <Select
                              value={currentCategory}
                              onValueChange={handleCategoryChange}
                            >
                              <SelectTrigger className="font-pixel-body">
                                <SelectValue placeholder="All Categories" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="" className="font-pixel-body">All Categories</SelectItem>
                                {getCurrentFilterOptions().categories.map((category) => (
                                  <SelectItem key={category} value={category} className="font-pixel-body">
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Mobile Difficulty Filter */}
                          <div className="space-y-2">
                            <h3 className="font-pixel-heading text-sm mb-4 text-center">Difficulty</h3>
                            <Select
                              value={currentDifficulty}
                              onValueChange={handleDifficultyChange}
                            >
                              <SelectTrigger className="font-pixel-body">
                                <SelectValue placeholder="All Difficulties" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="" className="font-pixel-body">All Difficulties</SelectItem>
                                {getCurrentFilterOptions().difficulties.map((difficulty) => (
                                  <SelectItem key={difficulty} value={difficulty} className="font-pixel-body">
                                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Completed Filter */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="completed-mobile" className="font-pixel-body">
                                Show completed only
                              </Label>
                              <Switch
                                id="completed-mobile"
                                checked={showCompletedOnly}
                                onCheckedChange={handleCompletedOnlyChange}
                              />
                            </div>
                          </div>
                        </div>
                        <SheetFooter>
                          <Button 
                            variant="outline" 
                            onClick={resetFilters}
                            className="font-pixel-body"
                          >
                            Reset Filters
                          </Button>
                        </SheetFooter>
                      </SheetContent>
                    </Sheet>
                  </div>
                  
                  {/* Desktop Filters */}
                  <div className="hidden md:flex items-center gap-2">
                    {/* Category Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="font-pixel-body"
                        >
                          Category
                          {currentCategory && <ChevronDown className="ml-2 h-4 w-4" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[200px]">
                        <DropdownMenuLabel className="font-pixel-heading">Category</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className={`font-pixel-body ${!currentCategory ? 'bg-muted/50' : ''}`}
                          onClick={() => handleCategoryChange('')}
                        >
                          All Categories
                        </DropdownMenuItem>
                        {getCurrentFilterOptions().categories.map((category) => (
                          <DropdownMenuItem 
                            key={category} 
                            className={`font-pixel-body ${currentCategory === category ? 'bg-muted/50' : ''}`}
                            onClick={() => handleCategoryChange(category)}
                          >
                            {category}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Difficulty Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="font-pixel-body"
                        >
                          Difficulty
                          {currentDifficulty && <ChevronDown className="ml-2 h-4 w-4" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[200px]">
                        <DropdownMenuLabel className="font-pixel-heading">Difficulty</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className={`font-pixel-body ${!currentDifficulty ? 'bg-muted/50' : ''}`}
                          onClick={() => handleDifficultyChange('')}
                        >
                          All Difficulties
                        </DropdownMenuItem>
                        {getCurrentFilterOptions().difficulties.map((difficulty) => (
                          <DropdownMenuItem 
                            key={difficulty} 
                            className={`font-pixel-body ${currentDifficulty === difficulty ? 'bg-muted/50' : ''}`}
                            onClick={() => handleDifficultyChange(difficulty)}
                          >
                            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Completed Switch */}
                    <div className="flex items-center gap-2 pl-2">
                      <Switch
                        id="completed-desktop"
                        checked={showCompletedOnly}
                        onCheckedChange={handleCompletedOnlyChange}
                      />
                      <Label htmlFor="completed-desktop" className="font-pixel-body text-sm">
                        Completed
                      </Label>
                    </div>
                    
                    {/* Reset Button */}
                    {filterCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={resetFilters}
                        className="font-pixel-body text-muted-foreground"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* View & Sort */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                  {/* View Mode Toggle */}
                  <div className="hidden md:flex">
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
                  
                  {/* Sort Dropdown */}
                  <Select
                    value={currentSort}
                    onValueChange={handleSortChange}
                  >
                    <SelectTrigger className="w-[160px] font-pixel-body ml-auto md:ml-0">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="font-pixel-body">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          
          {/* Main Content */}
          <div className="max-w-6xl mx-auto">
            {!initialQuery ? (
              // Empty initial state
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 bg-muted/50 p-4 rounded-full">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-pixel-heading mb-2">Start Searching</h2>
                <p className="text-muted-foreground font-pixel-body max-w-md mx-auto mb-8">
                  Enter a keyword to search for study materials, challenges, quizzes, and games
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-3xl">
                  {['Study', 'Challenges', 'Quizzes', 'Games'].map((type, i) => (
                    <Button 
                      key={i} 
                      variant="outline" 
                      className="font-pixel-body text-md justify-center h-20 w-full"
                      onClick={() => {
                        handleTypeChange(type.toLowerCase() as ContentType);
                        const params = new URLSearchParams();
                        params.set('q', '*');
                        params.set('type', type.toLowerCase());
                        router.push(`${pathname}?${params.toString()}`);
                      }}
                    >
                      {i === 0 && <BookOpen className="mr-2 h-5 w-5" />}
                      {i === 1 && <Code className="mr-2 h-5 w-5" />}
                      {i === 2 && <FileQuestion className="mr-2 h-5 w-5" />}
                      {i === 3 && <Gamepad className="mr-2 h-5 w-5" />}
                      {type}
                    </Button>
                  ))}
                </div>
                <div className="mt-12 p-4 border border-border rounded-md bg-card/50 max-w-md">
                  <h3 className="font-pixel-heading text-sm mb-2">Search Tips</h3>
                  <ul className="text-sm text-muted-foreground font-pixel-body text-left">
                    <li className="flex items-start gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                      Use keywords like "algorithm", "javascript", "beginner"
                    </li>
                    <li className="flex items-start gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                      Try specific topics: "linked list", "sorting", "functions"
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                      Filter results by type, category, and difficulty
                    </li>
                  </ul>
                </div>
              </div>
            ) : isLoading ? (
              // Loading state
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <Card key={i} className="border">
                    <div className="p-4">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <div className="flex gap-2 mb-4">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : error ? (
              // Error state
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-danger mx-auto mb-4" />
                <h2 className="text-xl font-pixel-heading mb-2">Error</h2>
                <p className="text-muted-foreground font-pixel-body mb-6">
                  Something went wrong while searching. Please try again.
                </p>
                <Button onClick={handleSearch} className="font-pixel-body">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Search
                </Button>
              </div>
            ) : results.length === 0 ? (
              // Empty results
              <div className="text-center py-12">
                <EyeOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-pixel-heading mb-2">No Results Found</h2>
                <p className="text-muted-foreground font-pixel-body mb-6">
                  We couldn't find any matches for "{initialQuery}". Try different keywords or filters.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" onClick={resetFilters} className="font-pixel-body">
                    Reset Filters
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery('');
                      router.push(pathname);
                    }}
                    className="font-pixel-body"
                  >
                    New Search
                  </Button>
                </div>
              </div>
            ) : (
              // Results display
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Results count */}
                <p className="text-sm text-muted-foreground font-pixel-body mb-4">
                  Found {totalCount} results for "{initialQuery}"
                </p>
                
                {/* Results grid */}
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4 mb-8`}>
                  {results.map((result, index) => (
                    <motion.div
                      key={result.id}
                      variants={itemVariants}
                      className="h-full"
                    >
                      <Link href={result.url} className="h-full">
                        <Card className={`border-2 hover:border-primary/50 hover:shadow-md transition-all h-full ${
                          viewMode === 'list' ? 'flex flex-row' : ''
                        }`}>
                          {/* Icon or thumbnail */}
                          {viewMode === 'grid' && (
                            <div className="aspect-[4/1] border-b border-border flex items-center justify-center relative bg-primary/5">
                              {/* Content type badge */}
                              <Badge
                                variant={getTypeBadgeColor(result.type) as any}
                                className="absolute top-2 right-2"
                              >
                                {result.type}
                              </Badge>
                              
                              {/* Content type icon */}
                              <div className="flex items-center">
                                {result.type === 'study' && (
                                  <BookOpen className="h-6 w-6 text-primary mr-2" />
                                )}
                                {result.type === 'challenge' && (
                                  <Code className="h-6 w-6 text-secondary mr-2" />
                                )}
                                {result.type === 'quiz' && (
                                  <FileQuestion className="h-6 w-6 text-accent mr-2" />
                                )}
                                {result.type === 'game' && (
                                  <Gamepad className="h-6 w-6 text-warning mr-2" />
                                )}
                                <span className="font-pixel-body">
                                  {result.category}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* List view icon */}
                          {viewMode === 'list' && (
                            <div className="w-16 border-r border-border flex items-center justify-center p-4">
                              {result.type === 'study' && (
                                <BookOpen className="h-6 w-6 text-primary" />
                              )}
                              {result.type === 'challenge' && (
                                <Code className="h-6 w-6 text-secondary" />
                              )}
                              {result.type === 'quiz' && (
                                <FileQuestion className="h-6 w-6 text-accent" />
                              )}
                              {result.type === 'game' && (
                                <Gamepad className="h-6 w-6 text-warning" />
                              )}
                            </div>
                          )}
                          
                          {/* Content */}
                          <div className="flex-1 p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-pixel-heading text-base line-clamp-1">
                                {result.title}
                              </h3>
                              
                              {viewMode === 'list' && (
                                <Badge
                                  variant={getTypeBadgeColor(result.type) as any}
                                  className="ml-2"
                                >
                                  {result.type}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground font-pixel-body mb-3 line-clamp-2">
                              {result.description}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 mb-2">
                              {/* Difficulty badge */}
                              <Badge variant={getDifficultyColor(result.difficulty) as any}>
                                {result.difficulty}
                              </Badge>
                              
                              {/* Category badge in list view */}
                              {viewMode === 'list' && (
                                <Badge variant="outline">
                                  {result.category}
                                </Badge>
                              )}
                              
                              {/* Completed badge */}
                              {result.completed && (
                                <Badge variant="success" className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Completed
                                </Badge>
                              )}
                            </div>
                            
                            {/* Stats */}
                            <div className="flex justify-between text-xs text-muted-foreground font-pixel-body">
                              <span>
                                {result.type === 'study' && `${result.view_count || 0} views`}
                                {result.type === 'challenge' && `${result.attempts || 0} attempts`}
                                {result.type === 'quiz' && `${result.question_count || 0} questions`}
                                {result.type === 'game' && `${result.players || 0} players`}
                              </span>
                              {result.date && (
                                <span>
                                  {new Date(result.date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
                
                {/* Pagination */}
                {totalCount > 0 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="font-pixel-body"
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: Math.min(5, Math.ceil(totalCount / 12)) }, (_, i) => {
                      const pageNumber = i + 1;
                      return (
                        <Button 
                          key={i}
                          variant={currentPage === pageNumber ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => handlePageChange(pageNumber)}
                          className="font-pixel-body w-9"
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                    
                    {Math.ceil(totalCount / 12) > 5 && (
                      <span className="text-muted-foreground">...</span>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={currentPage >= Math.ceil(totalCount / 12)}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="font-pixel-body"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}