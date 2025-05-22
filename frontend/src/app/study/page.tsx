'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
  BookOpen, 
  PlayCircle, 
  Code, 
  List, 
  Grid, 
  Zap, 
  Filter, 
  Search,
  Star,
  Clock,
  BookMarked,
  ChevronRight
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/DropdownMenu';
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
import { useAuth } from '@/hooks/useAuth';
import { useStudyMaterials } from '@/hooks/useStudyMaterials';
import { useLearningPath } from '@/hooks/useLearningPath';
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

export default function StudyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { user } = useAuth();
  
  // Extract query parameters
  const categoryParam = searchParams.get('category') || 'all';
  const difficultyParam = searchParams.get('difficulty') || 'all';
  const typeParam = searchParams.get('type') || 'all';
  const searchQuery = searchParams.get('q') || '';
  
  // State for filtering and display options
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentTab, setCurrentTab] = useState<string>('all');
  const [searchInput, setSearchInput] = useState(searchQuery);
  
  // Fetching study materials with current filters
  const { 
    materials, 
    isLoading, 
    error,
    categories,
    fetchMaterials
  } = useStudyMaterials({
    category: categoryParam !== 'all' ? categoryParam : undefined,
    difficulty: difficultyParam !== 'all' ? difficultyParam : undefined,
    type: typeParam !== 'all' ? typeParam : undefined,
    search: searchQuery || undefined
  });
  
  // Learning path data
  const { learningPaths, recommendedPath, isLoading: pathsLoading } = useLearningPath(user?.id);
  
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
  
  // Get content type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <BookOpen className="w-5 h-5" />;
      case 'video':
        return <PlayCircle className="w-5 h-5" />;
      case 'interactive':
        return <Zap className="w-5 h-5" />;
      case 'code_example':
        return <Code className="w-5 h-5" />;
      default:
        return <BookMarked className="w-5 h-5" />;
    }
  };
  
  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  // Format duration from minutes
  const formatDuration = (minutes: number) => {
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
        title="Study Materials - Gamifikasi CS" 
        description="Explore programming and Computer Science study materials with interactive tutorials, articles, and videos."
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-background/60 pt-6 pb-12">
        <div className="container px-4 mx-auto">
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-pixel-heading text-gradient mb-2">Study Materials</h1>
              <p className="text-muted-foreground font-pixel-body">
                Explore and learn programming concepts with our curated materials
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
                    placeholder="Search study materials..."
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
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={typeParam}
                    onValueChange={(value) => updateFilters('type', value)}
                  >
                    <SelectTrigger className="w-[140px] font-pixel-body">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="article">Articles</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                      <SelectItem value="interactive">Interactive</SelectItem>
                      <SelectItem value="code_example">Code Examples</SelectItem>
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
          
          {/* Learning path recommendation */}
          {recommendedPath && !isLoading && (
            <div className="mb-8">
              <Card className="border-2 overflow-hidden border-primary/60 bg-primary/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 p-6">
                    <CardTitle className="text-xl font-pixel-heading mb-4 flex items-center">
                      <BookMarked className="h-5 w-5 mr-2 text-primary" />
                      Recommended Learning Path
                    </CardTitle>
                    <p className="font-pixel-body mb-4">
                      {recommendedPath.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant={getDifficultyColor(recommendedPath.difficulty)}>
                        {recommendedPath.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        {recommendedPath.category}
                      </Badge>
                      <Badge variant="outline">
                        {recommendedPath.estimated_hours} hours
                      </Badge>
                    </div>
                    <Button className="font-pixel-body">
                      Start Learning Path
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="relative hidden md:block">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/30">
                      <div className="absolute bottom-6 right-6">
                        <Badge variant="secondary" className="font-pixel-body">
                          {recommendedPath.steps.length} lessons
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
          
          {/* Material tabs */}
          <Tabs defaultValue="all" className="mb-8" value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all" className="font-pixel-body">All Materials</TabsTrigger>
              <TabsTrigger value="featured" className="font-pixel-body">Featured</TabsTrigger>
              <TabsTrigger value="saved" className="font-pixel-body">Saved</TabsTrigger>
              <TabsTrigger value="recent" className="font-pixel-body">Recently Viewed</TabsTrigger>
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
              ) : !materials.length ? (
                // No results
                <NoResults 
                  title="No study materials found" 
                  description="Try adjusting your filters or search query"
                  actionLabel="Reset Filters"
                  onAction={resetFilters}
                />
              ) : (
                // Materials grid/list
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-4`}
                >
                  {materials.map((material) => (
                    <motion.div key={material.id} variants={itemVariants}>
                      <Link href={`/study/materials/${material.id}`}>
                        <Card className={`h-full border-2 hover:border-primary/50 hover:shadow-md transition-all ${viewMode === 'list' ? 'flex flex-row' : ''}`}>
                          {/* Thumbnail */}
                          <div className={`relative ${viewMode === 'grid' ? 'aspect-video' : 'w-1/4'} bg-primary/5`}>
                            <div className="absolute inset-0 flex items-center justify-center">
                              {getTypeIcon(material.type)}
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1">
                            <CardHeader className={viewMode === 'list' ? 'py-3 px-4' : ''}>
                              <CardTitle className="text-xl font-pixel-heading line-clamp-2">
                                {material.title}
                              </CardTitle>
                            </CardHeader>
                            
                            <CardContent className={viewMode === 'list' ? 'py-0 px-4' : ''}>
                              {viewMode === 'grid' && (
                                <p className="text-muted-foreground font-pixel-body mb-4 line-clamp-2">
                                  {material.description || "Learn about this topic with our curated study material."}
                                </p>
                              )}
                              
                              <div className="flex flex-wrap gap-2">
                                <Badge variant={getDifficultyColor(material.difficulty)}>
                                  {material.difficulty}
                                </Badge>
                                
                                <Badge variant="outline">
                                  {material.category}
                                </Badge>
                                
                                {material.duration && (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(material.duration)}
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                            
                            {viewMode === 'grid' && (
                              <CardFooter className="flex justify-between pt-0">
                                <div className="text-xs text-muted-foreground font-pixel-body">
                                  {material.view_count || 0} views
                                </div>
                                
                                {material.rating && (
                                  <div className="flex items-center">
                                    <Star className="h-3 w-3 text-warning mr-1 fill-warning" />
                                    <span className="text-xs font-pixel-body">{material.rating.toFixed(1)}</span>
                                  </div>
                                )}
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
            
            {/* Other tabs content - similar structure as "all" tab but with different data sources */}
            <TabsContent value="featured">
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Image 
                  src="/assets/decorations/pixel-star.svg" 
                  alt="Featured" 
                  width={64} 
                  height={64} 
                  className="mb-4 opacity-60"
                />
                <h3 className="font-pixel-heading text-xl mb-2">Featured Materials</h3>
                <p className="font-pixel-body text-muted-foreground max-w-md mb-4">
                  Stay tuned for featured and editor-picked study materials!
                </p>
                <Button variant="outline" onClick={() => setCurrentTab('all')} className="font-pixel-body">
                  Explore All Materials
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="saved">
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Image 
                  src="/assets/decorations/pixel-heart.svg" 
                  alt="Saved" 
                  width={64} 
                  height={64} 
                  className="mb-4 opacity-60"
                />
                <h3 className="font-pixel-heading text-xl mb-2">Your Saved Materials</h3>
                <p className="font-pixel-body text-muted-foreground max-w-md mb-4">
                  You haven't saved any materials yet. Save materials to access them quickly later!
                </p>
                <Button variant="outline" onClick={() => setCurrentTab('all')} className="font-pixel-body">
                  Explore All Materials
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="recent">
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Image 
                  src="/assets/decorations/pixel-clock.svg" 
                  alt="Recent" 
                  width={64} 
                  height={64} 
                  className="mb-4 opacity-60"
                />
                <h3 className="font-pixel-heading text-xl mb-2">Recently Viewed</h3>
                <p className="font-pixel-body text-muted-foreground max-w-md mb-4">
                  Your recently viewed materials will appear here for quick access.
                </p>
                <Button variant="outline" onClick={() => setCurrentTab('all')} className="font-pixel-body">
                  Explore All Materials
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Learning Paths section */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-pixel-heading">Learning Paths</h2>
              <Button variant="outline" asChild className="font-pixel-body">
                <Link href="/study/paths">View All Paths</Link>
              </Button>
            </div>
            
            {pathsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-44" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {learningPaths.slice(0, 3).map((path) => (
                  <Card key={path.id} className="border-2 hover:border-primary/50 hover:shadow-md transition-all h-full">
                    <CardHeader>
                      <CardTitle className="text-lg font-pixel-heading line-clamp-1">
                        {path.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground font-pixel-body mb-4 line-clamp-2">
                        {path.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={getDifficultyColor(path.difficulty)}>
                          {path.difficulty}
                        </Badge>
                        <Badge variant="outline">
                          {path.category}
                        </Badge>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full font-pixel-body">
                        Start Path
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
