'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { 
  LineChart, 
  BarChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import {
  Users,
  BookOpen,
  Code,
  Award,
  Activity,
  Server,
  MessageCircle,
  AlertTriangle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import useAdminStats from '@/hooks/useAdminStats';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';

// Sample activity data
const recentActivity = [
  { id: 1, user: 'andiputra', action: 'completed challenge', target: 'Array Sorting', time: '2 minutes ago' },
  { id: 2, user: 'mayawati', action: 'joined', target: '', time: '15 minutes ago' },
  { id: 3, user: 'budisetyo', action: 'submitted feedback', target: 'Adding more challenges', time: '30 minutes ago' },
  { id: 4, user: 'dianpertiwi', action: 'reached level', target: '10', time: '1 hour ago' },
  { id: 5, user: 'fadlirahman', action: 'reported error', target: 'Quiz #4 Question 2', time: '2 hours ago' },
];

// System status mock data
const systemStatus = [
  { name: 'API Server', status: 'operational', uptime: '99.98%', latency: '45ms' },
  { name: 'Database', status: 'operational', uptime: '99.95%', latency: '38ms' },
  { name: 'Storage', status: 'operational', uptime: '100%', latency: '62ms' },
  { name: 'Socket Server', status: 'operational', uptime: '99.92%', latency: '28ms' }
];

// Recent issues mock data
const recentIssues = [
  { id: 1, type: 'error', message: 'Socket connection timeout', count: 12, lastOccurred: '10 minutes ago' },
  { id: 2, type: 'warning', message: 'High database query time', count: 5, lastOccurred: '25 minutes ago' },
  { id: 3, type: 'error', message: 'Failed challenge submission', count: 3, lastOccurred: '1 hour ago' },
];

const activityColumns = [
  { accessorKey: 'user', header: 'User' },
  { accessorKey: 'action', header: 'Action' },
  { accessorKey: 'target', header: 'Target' },
  { accessorKey: 'time', header: 'Time' },
];

const systemStatusColumns = [
  { accessorKey: 'name', header: 'Service' },
  { 
    accessorKey: 'status', 
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status');
      return (
        <span className={`px-2 py-1 rounded-full text-xs ${
          status === 'operational' ? 'bg-accent/20 text-accent' : 
          status === 'degraded' ? 'bg-warning/20 text-warning' : 
          'bg-danger/20 text-danger'
        }`}>
          {status}
        </span>
      );
    }
  },
  { accessorKey: 'uptime', header: 'Uptime' },
  { accessorKey: 'latency', header: 'Latency' },
];

const issuesColumns = [
  { 
    accessorKey: 'type', 
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type');
      return (
        <span className={`flex items-center ${
          type === 'error' ? 'text-danger' : 
          type === 'warning' ? 'text-warning' : 
          'text-primary'
        }`}>
          {type === 'error' ? <AlertTriangle className="w-4 h-4 mr-1" /> : 
           type === 'warning' ? <AlertTriangle className="w-4 h-4 mr-1" /> : 
           <Activity className="w-4 h-4 mr-1" />}
          {type}
        </span>
      );
    }
  },
  { accessorKey: 'message', header: 'Message' },
  { accessorKey: 'count', header: 'Occurrences' },
  { accessorKey: 'lastOccurred', header: 'Last Occurred' },
];

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { stats, isLoading, error } = useAdminStats();
  const [timeRange, setTimeRange] = useState('7d');

  // Protect admin route
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return <Loading />;
  }

  if (!user || user.role !== 'admin') {
    return null; // Will redirect in useEffect
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-pixel-heading text-gradient">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Tabs defaultValue={timeRange} onValueChange={setTimeRange} className="w-[300px]">
              <TabsList className="font-pixel-body">
                <TabsTrigger value="24h">24h</TabsTrigger>
                <TabsTrigger value="7d">7d</TabsTrigger>
                <TabsTrigger value="30d">30d</TabsTrigger>
                <TabsTrigger value="90d">90d</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" className="font-pixel-body">
              <Clock className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load dashboard data. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-2">
            <CardContent className="p-6 flex items-center">
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  <div className="mr-4 rounded-full p-2 bg-primary/10">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium font-pixel-body text-muted-foreground">
                      Active Users
                    </p>
                    <h3 className="text-2xl font-pixel-heading">{stats?.activeUsers || 0}</h3>
                    <p className="text-xs text-accent">
                      ↑ {stats?.userGrowth || 0}% from last {timeRange}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6 flex items-center">
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  <div className="mr-4 rounded-full p-2 bg-secondary/10">
                    <BookOpen className="h-8 w-8 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium font-pixel-body text-muted-foreground">
                      Study Sessions
                    </p>
                    <h3 className="text-2xl font-pixel-heading">{stats?.studySessions || 0}</h3>
                    <p className="text-xs text-accent">
                      ↑ {stats?.sessionGrowth || 0}% from last {timeRange}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6 flex items-center">
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  <div className="mr-4 rounded-full p-2 bg-accent/10">
                    <Code className="h-8 w-8 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium font-pixel-body text-muted-foreground">
                      Challenges Completed
                    </p>
                    <h3 className="text-2xl font-pixel-heading">{stats?.challengesCompleted || 0}</h3>
                    <p className="text-xs text-accent">
                      ↑ {stats?.challengeGrowth || 0}% from last {timeRange}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6 flex items-center">
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  <div className="mr-4 rounded-full p-2 bg-danger/10">
                    <Award className="h-8 w-8 text-danger" />
                  </div>
                  <div>
                    <p className="text-sm font-medium font-pixel-body text-muted-foreground">
                      Achievements Earned
                    </p>
                    <h3 className="text-2xl font-pixel-heading">{stats?.achievementsEarned || 0}</h3>
                    <p className="text-xs text-accent">
                      ↑ {stats?.achievementGrowth || 0}% from last {timeRange}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg font-pixel-heading">User Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={stats?.userActivityData || []}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
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
                      dataKey="logins" 
                      stroke="#4B7BEC" 
                      activeDot={{ r: 8 }} 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="registrations" 
                      stroke="#2ECC71" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg font-pixel-heading">Content Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={stats?.contentEngagementData || []}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#55555540" />
                    <XAxis dataKey="category" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        backgroundColor: 'var(--card)', 
                        border: '2px solid var(--border)' 
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="views" fill="#4B7BEC" />
                    <Bar dataKey="completions" fill="#2ECC71" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity and System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-pixel-heading">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" className="font-pixel-body">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={activityColumns} 
                data={recentActivity}
                noDataText="No recent activity"
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg font-pixel-heading">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  columns={systemStatusColumns} 
                  data={systemStatus}
                  noDataText="No system status information available"
                />
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg font-pixel-heading">Recent Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  columns={issuesColumns} 
                  data={recentIssues}
                  noDataText="No recent issues reported"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Access */}
        <Card className="border-2 mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-pixel-heading">Quick Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center font-pixel-body">
                <Users className="h-6 w-6 mb-2" />
                User Management
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center font-pixel-body">
                <BookOpen className="h-6 w-6 mb-2" />
                Content Management
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center font-pixel-body">
                <Code className="h-6 w-6 mb-2" />
                Challenges
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center font-pixel-body">
                <Activity className="h-6 w-6 mb-2" />
                Reports
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center font-pixel-body">
                <Server className="h-6 w-6 mb-2" />
                System Settings
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center font-pixel-body">
                <MessageCircle className="h-6 w-6 mb-2" />
                Feedback
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center font-pixel-body">
                <AlertTriangle className="h-6 w-6 mb-2" />
                Error Logs
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center font-pixel-body">
                <Clock className="h-6 w-6 mb-2" />
                Scheduled Tasks
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
