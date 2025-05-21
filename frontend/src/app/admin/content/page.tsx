import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useState } from 'react';
import { BookOpen, Code, FileQuestion, MoreHorizontal, Play, Trash2, Eye, Edit, Copy } from 'lucide-react';
import DataTable from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/layouts/admin-layout';

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState('materials');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedItems, setSelectedItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, perPage: 10 });
  const [isLoading, setIsLoading] = useState(false);

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const getColumns = () => {
    // Define columns based on active tab
  };

  const getContentData = () => {
    // Fetch content data based on active tab, pagination, and filters
  };

  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl font-pixel-heading mb-4">Content Management</h1>
        
        <Card className="border-2 mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-pixel-heading">Filter & View Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-pixel-body mb-1" htmlFor="search">
                  Search
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="Search content..."
                  className="w-full p-2 border rounded-md focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-pixel-body mb-1" htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  className="w-full p-2 border rounded-md focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="">All Categories</option>
                  <option value="programming">Programming</option>
                  <option value="design">Design</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={setViewMode}
                className="border rounded-md"
              >
                <ToggleGroupItem value="grid" className="px-4 py-2">
                  <Grid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" className="px-4 py-2">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </Card>
        
        <Tabs 
          defaultValue="materials" 
          className="mb-6"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="font-pixel-body">
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Study Materials</span>
              <span className="sm:hidden">Materials</span>
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">Challenges</span>
              <span className="sm:hidden">Challenges</span>
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex items-center gap-2">
              <FileQuestion className="h-4 w-4" />
              <span className="hidden sm:inline">Quizzes</span>
              <span className="sm:hidden">Quizzes</span>
            </TabsTrigger>
          </TabsList>
          
          {activeTab === 'materials' && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-pixel-heading">Study Materials</h3>
                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-pixel-body text-muted-foreground">
                      {selectedItems.length} selected
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="font-pixel-body text-danger hover:text-danger"
                      onClick={() => {/* Handle delete operation */}}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="loading-spinner"></div>
                </div>
              ) : viewMode === 'list' ? (
                <DataTable 
                  columns={getColumns()} 
                  data={getContentData()}
                  pagination={{
                    pageCount: Math.ceil(totalItems / pagination.perPage),
                    pageIndex: pagination.page - 1,
                    onPageChange: (pageIndex) => handlePageChange(pageIndex + 1)
                  }}
                  noDataText="No study materials found"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getContentData().map((item) => (
                    <Card key={item.id} className="border-2 hover:shadow-md transition-shadow">
                      <div className="aspect-video relative bg-muted">
                        {item.type === 'video' ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="h-12 w-12 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <FileText className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-1 mb-2">
                          <Badge variant={
                            item.difficulty === 'beginner' ? 'success' : 
                            item.difficulty === 'intermediate' ? 'warning' : 
                            'danger'
                          } className="text-xs">
                            {item.difficulty}
                          </Badge>
                          <Badge variant={
                            item.status === 'published' ? 'success' : 
                            item.status === 'draft' ? 'outline' : 
                            'secondary'
                          } className="text-xs">
                            {item.status}
                          </Badge>
                        </div>
                        <h3 className="font-pixel-heading text-base mb-1 truncate" title={item.title}>
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.category}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div>
                            <span>{item.view_count} views</span>
                          </div>
                          <div>
                            {new Date(item.last_updated).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                      <div className="border-t border-border px-4 py-2 flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-danger">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              {!isLoading && getContentData().length > 0 && (
                <div className="flex justify-between items-center mt-4 text-sm font-pixel-body text-muted-foreground">
                  <div>
                    Showing {getContentData().length} of {totalItems} items
                  </div>
                  <div>
                    Page {pagination.page} of {Math.ceil(totalItems / pagination.perPage)}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'challenges' && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-pixel-heading">Coding Challenges</h3>
                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-pixel-body text-muted-foreground">
                      {selectedItems.length} selected
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="font-pixel-body text-danger hover:text-danger"
                      onClick={() => {/* Handle delete operation */}}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="loading-spinner"></div>
                </div>
              ) : viewMode === 'list' ? (
                <DataTable 
                  columns={getColumns()} 
                  data={getContentData()}
                  pagination={{
                    pageCount: Math.ceil(totalItems / pagination.perPage),
                    pageIndex: pagination.page - 1,
                    onPageChange: (pageIndex) => handlePageChange(pageIndex + 1)
                  }}
                  noDataText="No challenges found"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getContentData().map((item) => (
                    <Card key={item.id} className="border-2 hover:shadow-md transition-shadow">
                      <div className="aspect-video relative bg-muted">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Code className="h-12 w-12 text-muted-foreground" />
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-1 mb-2">
                          <Badge variant={
                            item.difficulty === 'easy' ? 'success' : 
                            item.difficulty === 'medium' ? 'warning' : 
                            'danger'
                          } className="text-xs">
                            {item.difficulty}
                          </Badge>
                          <Badge variant={
                            item.status === 'published' ? 'success' : 
                            item.status === 'draft' ? 'outline' : 
                            'secondary'
                          } className="text-xs">
                            {item.status}
                          </Badge>
                        </div>
                        <h3 className="font-pixel-heading text-base mb-1 truncate" title={item.title}>
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.category}
                        </p>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${item.completion_rate}%` }} 
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div>
                            <span>{item.attempts} attempts</span>
                          </div>
                          <div>
                            {item.completion_rate}% completion
                          </div>
                        </div>
                      </CardContent>
                      <div className="border-t border-border px-4 py-2 flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-danger">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              {!isLoading && getContentData().length > 0 && (
                <div className="flex justify-between items-center mt-4 text-sm font-pixel-body text-muted-foreground">
                  <div>
                    Showing {getContentData().length} of {totalItems} items
                  </div>
                  <div>
                    Page {pagination.page} of {Math.ceil(totalItems / pagination.perPage)}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'quizzes' && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-pixel-heading">Quizzes</h3>
                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-pixel-body text-muted-foreground">
                      {selectedItems.length} selected
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="font-pixel-body text-danger hover:text-danger"
                      onClick={() => {/* Handle delete operation */}}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="loading-spinner"></div>
                </div>
              ) : viewMode === 'list' ? (
                <DataTable 
                  columns={getColumns()} 
                  data={getContentData()}
                  pagination={{
                    pageCount: Math.ceil(totalItems / pagination.perPage),
                    pageIndex: pagination.page - 1,
                    onPageChange: (pageIndex) => handlePageChange(pageIndex + 1)
                  }}
                  noDataText="No quizzes found"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getContentData().map((item) => (
                    <Card key={item.id} className="border-2 hover:shadow-md transition-shadow">
                      <div className="aspect-video relative bg-muted">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FileQuestion className="h-12 w-12 text-muted-foreground" />
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-1 mb-2">
                          <Badge variant={
                            item.difficulty === 'easy' ? 'success' : 
                            item.difficulty === 'medium' ? 'warning' : 
                            'danger'
                          } className="text-xs">
                            {item.difficulty}
                          </Badge>
                          <Badge variant={
                            item.status === 'published' ? 'success' : 
                            item.status === 'draft' ? 'outline' : 
                            'secondary'
                          } className="text-xs">
                            {item.status}
                          </Badge>
                        </div>
                        <h3 className="font-pixel-heading text-base mb-1 truncate" title={item.title}>
                          {item.title}
                        </h3>
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <span className="mr-2">{item.question_count} questions</span>
                          <span>{item.avg_score}% avg. score</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.attempts} attempts
                        </div>
                      </CardContent>
                      <div className="border-t border-border px-4 py-2 flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-danger">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              {!isLoading && getContentData().length > 0 && (
                <div className="flex justify-between items-center mt-4 text-sm font-pixel-body text-muted-foreground">
                  <div>
                    Showing {getContentData().length} of {totalItems} items
                  </div>
                  <div>
                    Page {pagination.page} of {Math.ceil(totalItems / pagination.perPage)}
                  </div>
                </div>
              )}
            </div>
          )}
        </Tabs>
        
        {/* Content Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg font-pixel-heading">
                {activeTab === 'materials' ? 'Study Materials' : 
                 activeTab === 'challenges' ? 'Challenges' : 'Quizzes'} Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card border rounded-md p-4 text-center">
                    <div className="text-2xl font-pixel-heading">{totalItems}</div>
                    <div className="text-sm text-muted-foreground font-pixel-body">Total</div>
                  </div>
                  <div className="bg-card border rounded-md p-4 text-center">
                    <div className="text-2xl font-pixel-heading">
                      {activeTab === 'materials' ? '3.5k' : 
                       activeTab === 'challenges' ? '2.8k' : '1.9k'}
                    </div>
                    <div className="text-sm text-muted-foreground font-pixel-body">
                      {activeTab === 'materials' ? 'Views' : 
                       activeTab === 'challenges' ? 'Submissions' : 'Attempts'}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-pixel-body mb-2">Content by Status</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Published</span>
                        <span>78%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-success" style={{ width: '78%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Draft</span>
                        <span>18%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-warning" style={{ width: '18%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Archived</span>
                        <span>4%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-muted-foreground" style={{ width: '4%' }} />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-pixel-body mb-2">Content by Difficulty</h4>
                  <div className="space-y-2">
                    {activeTab === 'materials' ? (
                      <>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Beginner</span>
                            <span>42%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-success" style={{ width: '42%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Intermediate</span>
                            <span>35%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-warning" style={{ width: '35%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Advanced</span>
                            <span>23%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-danger" style={{ width: '23%' }} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Easy</span>
                            <span>45%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-success" style={{ width: '45%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Medium</span>
                            <span>40%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-warning" style={{ width: '40%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Hard</span>
                            <span>15%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-danger" style={{ width: '15%' }} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-pixel-heading">Recent Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center p-2 hover:bg-muted/50 rounded-md transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium font-pixel-body">Data Structures: Linked Lists</p>
                        <p className="text-sm text-muted-foreground">Updated content and added new diagrams</p>
                      </div>
                      <div className="text-sm text-muted-foreground">2 hours ago</div>
                    </div>
                    
                    <div className="flex items-center p-2 hover:bg-muted/50 rounded-md transition-colors">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center mr-3">
                        <Code className="h-4 w-4 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium font-pixel-body">React Hooks Challenge</p>
                        <p className="text-sm text-muted-foreground">Added 3 new test cases and fixed validation</p>
                      </div>
                      <div className="text-sm text-muted-foreground">5 hours ago</div>
                    </div>
                    
                    <div className="flex items-center p-2 hover:bg-muted/50 rounded-md transition-colors">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mr-3">
                        <FileQuestion className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium font-pixel-body">JavaScript Basics Quiz</p>
                        <p className="text-sm text-muted-foreground">Published new quiz with 20 questions</p>
                      </div>
                      <div className="text-sm text-muted-foreground">Yesterday</div>
                    </div>
                    
                    <div className="flex items-center p-2 hover:bg-muted/50 rounded-md transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium font-pixel-body">CSS Grid Tutorial</p>
                        <p className="text-sm text-muted-foreground">Updated examples and fixed typos</p>
                      </div>
                      <div className="text-sm text-muted-foreground">2 days ago</div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}