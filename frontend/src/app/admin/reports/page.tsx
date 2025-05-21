'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Activity
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
  
  if (authLoading) {
    return <Loading />;
  }
  
  if (!user || user.role !== 'admin') {
    return null; // Will redirect in useEffect
  }
  
  return (
    <AdminLayout>
      <MetaTags 
        title="Laporan Admin - Gamifikasi CS" 
        description="Dasbor laporan dan analitik untuk admin platform Gamifikasi CS."
      />
      
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-pixel-heading text-gradient mb-2">Laporan & Analitik</h1>
            <p className="text-muted-foreground font-pixel-body">
              Pantau metrik penting dan analisis data platform
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <Select
              value={timeFrame}
              onValueChange={handleTimeFrameChange}
            >
              <SelectTrigger className="w-[140px] font-pixel-body">
                <SelectValue placeholder="Rentang Waktu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d" className="font-pixel-body">7 Hari</SelectItem>
                <SelectItem value="30d" className="font-pixel-body">30 Hari</SelectItem>
                <SelectItem value="90d" className="font-pixel-body">90 Hari</SelectItem>
                <SelectItem value="6m" className="font-pixel-body">6 Bulan</SelectItem>
                <SelectItem value="1y" className="font-pixel-body">1 Tahun</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="hidden md:block">
              <DateRangePicker />
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefreshData}
              className="h-10 w-10"
              title="Refresh data"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="font-pixel-body"
                  isLoading={isExporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="font-pixel-body">
                <DropdownMenuItem onClick={() => handleExportReport()}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export sebagai PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportReport()}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export sebagai Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportReport()}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export sebagai CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Gagal memuat data laporan. Silakan coba lagi nanti atau hubungi tim support.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="mr-4 rounded-full p-2 bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium font-pixel-body text-muted-foreground">
                    Total Pengguna
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <h3 className="text-2xl font-pixel-heading">12,543</h3>
                  )}
                  <p className="text-xs text-accent">
                    ↑ 12.5% dari bulan lalu
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="mr-4 rounded-full p-2 bg-secondary/10">
                  <BarChart2 className="h-8 w-8 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium font-pixel-body text-muted-foreground">
                    Penyelesaian Challenge
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <h3 className="text-2xl font-pixel-heading">3,892</h3>
                  )}
                  <p className="text-xs text-accent">
                    ↑ 8.2% dari bulan lalu
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="mr-4 rounded-full p-2 bg-accent/10">
                  <TrendingUp className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium font-pixel-body text-muted-foreground">
                    Retensi Pengguna
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <h3 className="text-2xl font-pixel-heading">68.3%</h3>
                  )}
                  <p className="text-xs text-accent">
                    ↑ 3.7% dari bulan lalu
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="mr-4 rounded-full p-2 bg-warning/10">
                  <Clock className="h-8 w-8 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium font-pixel-body text-muted-foreground">
                    Waktu Rata-rata
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <h3 className="text-2xl font-pixel-heading">32 menit</h3>
                  )}
                  <p className="text-xs text-accent">
                    ↑ 5.1% dari bulan lalu
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Tabs for Different Reports */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="users" className="font-pixel-body">
              <Users className="w-4 h-4 mr-2" />
              Pengguna
            </TabsTrigger>
            <TabsTrigger value="content" className="font-pixel-body">
              <BookOpen className="w-4 h-4 mr-2" />
              Konten
            </TabsTrigger>
            <TabsTrigger value="challenges" className="font-pixel-body">
              <Code className="w-4 h-4 mr-2" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="font-pixel-body">
              <FileQuestion className="w-4 h-4 mr-2" />
              Quiz
            </TabsTrigger>
            <TabsTrigger value="performance" className="font-pixel-body">
              <Activity className="w-4 h-4 mr-2" />
              Performa
            </TabsTrigger>
          </TabsList>
          
          {/* User Reports Tab */}
          <TabsContent value="users">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-pixel-heading">Aktivitas Pengguna</CardTitle>
                  <CardDescription className="font-pixel-body">
                    Pengguna aktif, login, dan registrasi baru
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={userData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#55555540" />
                        <XAxis dataKey="date" stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            backgroundColor: 'var(--card)', 
                            border: '2px solid var(--border)' 
                          }} 
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="Pengguna Aktif"
                          stroke="#4B7BEC"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Login Baru"
                          stroke="#2ECC71"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Registrasi"
                          stroke="#FF6B6B"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-pixel-heading">Retensi Pengguna</CardTitle>
                  <CardDescription className="font-pixel-body">
                    Persentase pengguna yang kembali setiap minggu
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={retentionData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#55555540" />
                        <XAxis dataKey="name" stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            backgroundColor: 'var(--card)', 
                            border: '2px solid var(--border)' 
                          }} 
                        />
                        <Bar dataKey="retention" fill="#4B7BEC">
                          {retentionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-pixel-heading">Demografi Pengguna</CardTitle>
                  <CardDescription className="font-pixel-body">
                    Distribusi pengguna berdasarkan peran dan level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-pixel-heading text-sm mb-4 text-center">Peran Pengguna</h4>
                      {isLoading ? (
                        <Skeleton className="h-[250px] w-full" />
                      ) : (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Student', value: 8500 },
                                { name: 'Teacher', value: 1200 },
                                { name: 'Admin', value: 30 },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {[
                                { name: 'Student', value: 8500 },
                                { name: 'Teacher', value: 1200 },
                                { name: 'Admin', value: 30 },
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '8px', 
                                backgroundColor: 'var(--card)', 
                                border: '2px solid var(--border)' 
                              }} 
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-pixel-heading text-sm mb-4 text-center">Level Pengguna</h4>
                      {isLoading ? (
                        <Skeleton className="h-[250px] w-full" />
                      ) : (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Level 1-5', value: 3200 },
                                { name: 'Level 6-10', value: 2500 },
                                { name: 'Level 11-15', value: 1800 },
                                { name: 'Level 16-20', value: 1100 },
                                { name: 'Level 21+', value: 650 },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {[
                                { name: 'Level 1-5', value: 3200 },
                                { name: 'Level 6-10', value: 2500 },
                                { name: 'Level 11-15', value: 1800 },
                                { name: 'Level 16-20', value: 1100 },
                                { name: 'Level 21+', value: 650 },
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '8px', 
                                backgroundColor: 'var(--card)', 
                                border: '2px solid var(--border)' 
                              }} 
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Content Reports Tab */}
          <TabsContent value="content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-pixel-heading">Penggunaan Konten</CardTitle>
                  <CardDescription className="font-pixel-body">
                    Distribusi akses berbagai jenis konten
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={contentData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {contentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            backgroundColor: 'var(--card)', 
                            border: '2px solid var(--border)' 
                          }}
                          formatter={(value) => [`${value} views`, 'Jumlah Akses']}
                        />
                        <Legend layout="vertical" verticalAlign="middle" align="right" />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-pixel-heading">Tingkat Penyelesaian</CardTitle>
                  <CardDescription className="font-pixel-body">
                    Persentase penyelesaian materi belajar per kategori
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={completionData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                        barSize={20}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#55555540" />
                        <XAxis dataKey="name" stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            backgroundColor: 'var(--card)', 
                            border: '2px solid var(--border)' 
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="complete" stackId="a" fill="#2ECC71" name="Selesai" />
                        <Bar dataKey="incomplete" stackId="a" fill="#FF6B6B" name="Belum Selesai" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg font-pixel-heading">Konten Terpopuler</CardTitle>
                <CardDescription className="font-pixel-body">
                  Materi belajar dengan jumlah akses tertinggi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { title: 'Pengenalan Algoritma dan Struktur Data', views: 2840, category: 'Algoritma Dasar', type: 'article' },
                      { title: 'Konsep Object-Oriented Programming', views: 2150, category: 'Object-Oriented', type: 'video' },
                      { title: 'Dasar-dasar HTML, CSS, dan JavaScript', views: 1980, category: 'Web Development', type: 'interactive' },
                      { title: 'SQL dan Relational Database Management', views: 1650, category: 'Database', type: 'article' },
                      { title: 'Data Structures: Array dan Linked List', views: 1540, category: 'Struktur Data', type: 'interactive' },
                    ].map((content, index) => (
                      <div 
                        key={index}
                        className="flex justify-between items-center p-3 border border-border rounded-md hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-md">
                            {content.type === 'article' ? (
                              <BookOpen className="h-5 w-5 text-primary" />
                            ) : content.type === 'video' ? (
                              <Play className="h-5 w-5 text-primary" />
                            ) : (
                              <Zap className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-pixel-body font-medium">{content.title}</h4>
                            <p className="text-sm text-muted-foreground font-pixel-body">{content.category}</p>
                          </div>
                        </div>
                        <div className="flex gap-4 items-center">
                          <div className="text-right">
                            <span className="text-lg font-pixel-heading">{content.views.toLocaleString()}</span>
                            <p className="text-xs text-muted-foreground font-pixel-body">views</p>
                          </div>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Challenges Reports Tab */}
          <TabsContent value="challenges">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-pixel-heading">
                    Achievement Diraih
                  </CardTitle>
                  <CardDescription className="font-pixel-body">
                    Achievement yang paling banyak diraih pengguna
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={achieveData}
                        layout="vertical"
                        margin={{
                          top: 5,
                          right: 30,
                          left: 120,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#55555540" horizontal={false} />
                        <XAxis type="number" stroke="#666" fontSize={12} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          stroke="#666" 
                          fontSize={12} 
                          width={120}
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            backgroundColor: 'var(--card)', 
                            border: '2px solid var(--border)' 
                          }} 
                        />
                        <Bar dataKey="count" fill="#4B7BEC">
                          {achieveData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-pixel-heading">
                    Tingkat Kesulitan Challenge
                  </CardTitle>
                  <CardDescription className="font-pixel-body">
                    Perbandingan jumlah challenge berdasarkan tingkat kesulitan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Mudah', value: 110 },
                            { name: 'Sedang', value: 85 },
                            { name: 'Sulit', value: 45 },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell fill="#2ECC71" />
                          <Cell fill="#FFA502" />
                          <Cell fill="#FF6B6B" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            backgroundColor: 'var(--card)', 
                            border: '2px solid var(--border)' 
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg font-pixel-heading">
                  Challenge Paling Sulit
                </CardTitle>
                <CardDescription className="font-pixel-body">
                  Challenge dengan tingkat penyelesaian terendah
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { title: 'Implementasi Red-Black Tree', completion: 12, difficulty: 'Sulit', category: 'Struktur Data' },
                      { title: 'Dynamic Programming: Knapsack Problem', completion: 18, difficulty: 'Sulit', category: 'Algoritma' },
                      { title: 'Concurrency & Thread Management', completion: 23, difficulty: 'Sulit', category: 'Pemrograman Sistem' },
                      { title: 'Implementasi Neural Network', completion: 25, difficulty: 'Sulit', category: 'Machine Learning' },
                      { title: 'Circular Buffer Implementation', completion: 28, difficulty: 'Sedang', category: 'Struktur Data' },
                    ].map((challenge, index) => (
                      <div 
                        key={index}
                        className="flex justify-between items-center p-3 border border-border rounded-md hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-md">
                            <Code className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-pixel-body font-medium">{challenge.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={
                                challenge.difficulty === 'Mudah' ? 'success' : 
                                challenge.difficulty === 'Sedang' ? 'warning' : 
                                'danger'
                              }>
                                {challenge.difficulty}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-pixel-body">{challenge.category}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-lg font-pixel-heading">{challenge.completion}%</span>
                            <p className="text-xs text-muted-foreground font-pixel-body">completion rate</p>
                          </div>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Quizzes Reports Tab */}
          <TabsContent value="quizzes">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-pixel-heading">
                    Performa Quiz
                  </CardTitle>
                  <CardDescription className="font-pixel-body">
                    Skor rata-rata quiz per kategori
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          { name: 'Algoritma Dasar', score: 78 },
                          { name: 'Struktur Data', score: 65 },
                          { name: 'Object-Oriented', score: 82 },
                          { name: 'Web Development', score: 74 },
                          { name: 'Database', score: 68 },
                        ]}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#55555540" />
                        <XAxis dataKey="name" stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            backgroundColor: 'var(--card)', 
                            border: '2px solid var(--border)' 
                          }} 
                          formatter={(value) => [`${value}%`, 'Skor Rata-rata']}
                        />
                        <Bar dataKey="score" fill="#4B7BEC">
                          {[
                            { name: 'Algoritma Dasar', score: 78 },
                            { name: 'Struktur Data', score: 65 },
                            { name: 'Object-Oriented', score: 82 },
                            { name: 'Web Development', score: 74 },
                            { name: 'Database', score: 68 },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-pixel-heading">
                    Distribusi Nilai Quiz
                  </CardTitle>
                  <CardDescription className="font-pixel-body">
                    Distribusi skor quiz seluruh pengguna
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          { range: '0-20', count: 120 },
                          { range: '21-40', count: 250 },
                          { range: '41-60', count: 850 },
                          { range: '61-80', count: 1250 },
                          { range: '81-100', count: 650 },
                        ]}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#55555540" />
                        <XAxis dataKey="range" stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            backgroundColor: 'var(--card)', 
                            border: '2px solid var(--border)' 
                          }} 
                        />
                        <Bar dataKey="count" fill="#4B7BEC">
                          <Cell fill="#FF6B6B" />
                          <Cell fill="#FFA502" />
                          <Cell fill="#FFA502" />
                          <Cell fill="#2ECC71" />
                          <Cell fill="#2ECC71" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg font-pixel-heading">
                  Pertanyaan Paling Sulit
                </CardTitle>
                <CardDescription className="font-pixel-body">
                  Pertanyaan quiz dengan tingkat kesalahan tertinggi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { question: 'Bagaimana complexitas algoritma Quick Sort worst case?', category: 'Algoritma', errorRate: 78 },
                      { question: 'Apa perbedaan utama antara abstract class dan interface?', category: 'Object-Oriented', errorRate: 72 },
                      { question: 'Jelaskan konsep ACID dalam database transaction', category: 'Database', errorRate: 68 },
                      { question: 'Bagaimana cara mengimplementasikan Hash Table?', category: 'Struktur Data', errorRate: 65 },
                      { question: 'Apa perbedaan antara process dan thread?', category: 'Pemrograman Sistem', errorRate: 62 },
                    ].map((question, index) => (
                      <div 
                        key={index}
                        className="flex justify-between items-center p-3 border border-border rounded-md hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-md">
                            <FileQuestion className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-pixel-body font-medium">{question.question}</h4>
                            <p className="text-xs text-muted-foreground font-pixel-body">{question.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-lg font-pixel-heading">{question.errorRate}%</span>
                            <p className="text-xs text-muted-foreground font-pixel-body">error rate</p>
                          </div>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Performance Reports Tab */}
          <TabsContent value="performance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-pixel-heading">
                    Performa Server
                  </CardTitle>
                  <CardDescription className="font-pixel-body">
                    Response time dan error rate server
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={perfData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#55555540" />
                        <XAxis dataKey="date" stroke="#666" fontSize={12} />
                        <YAxis 
                          yAxisId="left" 
                          stroke="#4B7BEC" 
                          fontSize={12} 
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right" 
                          stroke="#FF6B6B" 
                          fontSize={12} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            backgroundColor: 'var(--card)', 
                            border: '2px solid var(--border)' 
                          }} 
                        />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="Response Time (ms)"
                          stroke="#4B7BEC"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="Error Rate (%)"
                          stroke="#FF6B6B"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-pixel-heading">
                    Statistik Error
                  </CardTitle>
                  <CardDescription className="font-pixel-body">
                    Jumlah error berdasarkan kategori
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          { type: 'Authentication', count: 45 },
                          { type: 'API Timeout', count: 32 },
                          { type: 'Database', count: 28 },
                          { type: 'Socket', count: 15 },
                          { type: 'File Upload', count: 12 },
                          { type: 'Code Execution', count: 10 },
                        ]}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#55555540" />
                        <XAxis dataKey="type" stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            backgroundColor: 'var(--card)', 
                            border: '2px solid var(--border)' 
                          }} 
                        />
                        <Bar dataKey="count" fill="#FF6B6B" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg font-pixel-heading">
                  Error Log Terbaru
                </CardTitle>
                <CardDescription className="font-pixel-body">
                  Log error yang terakhir terjadi di sistem
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { message: 'Database connection timeout', type: 'Error', time: '10 menit yang lalu', count: 3 },
                      { message: 'Authentication token expired', type: 'Warning', time: '25 menit yang lalu', count: 12 },
                      { message: 'File upload failed: size limit exceeded', type: 'Error', time: '45 menit yang lalu', count: 2 },
                      { message: 'Socket connection lost', type: 'Error', time: '1 jam yang lalu', count: 5 },
                      { message: 'Rate limit exceeded for API', type: 'Warning', time: '2 jam yang lalu', count: 8 },
                    ].map((error, index) => (
                      <div 
                        key={index}
                        className="flex justify-between items-center p-3 border border-border rounded-md hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-md ${
                            error.type === 'Error' ? 'bg-danger/10' : 'bg-warning/10'
                          }`}>
                            <AlertTriangle className={`h-5 w-5 ${
                              error.type === 'Error' ? 'text-danger' : 'text-warning'
                            }`} />
                          </div>
                          <div>
                            <h4 className="font-pixel-body font-medium">{error.message}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={error.type === 'Error' ? 'danger' : 'warning'}>
                                {error.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-pixel-body">{error.time}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-lg font-pixel-heading">{error.count}x</span>
                            <p className="text-xs text-muted-foreground font-pixel-body">occurrences</p>
                          </div>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mb-6">
          <Button 
            variant="outline" 
            className="font-pixel-body"
            asChild
          >
            <a href="/admin/reports/detailed">
              View Detailed Reports
              <ChevronRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
