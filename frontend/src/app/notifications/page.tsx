'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Bell,
  Check,
  CheckAll,
  Clock,
  Trash2,
  Filter,
  Trophy,
  MessageCircle,
  AlertTriangle,
  Info,
  RefreshCcw,
  ChevronRight,
  X
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Separator } from '@/components/ui/Separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import MainLayout from '@/components/layout/MainLayout';
import MetaTags from '@/components/common/MetaTags';
import { formatDistanceToNow } from 'date-fns';

// Types
type NotificationType =
  | 'achievement_unlock'
  | 'level_up'
  | 'challenge_complete'
  | 'challenge_invitation'
  | 'friend_request'
  | 'system'
  | 'welcome'
  | 'quiz_complete'
  | 'message'
  | 'admin';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  action_url?: string;
  created_at: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
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

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    notifications, 
    isLoading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    deleteAllRead,
    fetchNotifications
  } = useNotifications();
  
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState<string>('all');
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/login');
    }
  }, [user, isLoading, router]);
  
  // Function to get notifications based on current filter and tab
  const getFilteredNotifications = () => {
    if (!notifications) return [];
    
    let filtered = [...notifications];
    
    // Apply tab filter
    if (currentTab === 'unread') {
      filtered = filtered.filter(notif => !notif.read);
    } else if (currentTab === 'read') {
      filtered = filtered.filter(notif => notif.read);
    }
    
    // Apply type filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(notif => notif.type === currentFilter);
    }
    
    return filtered;
  };
  
  // Function to handle marking a notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      toast({
        title: "Notifikasi dibaca",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Gagal memperbarui notifikasi",
        description: "Silakan coba lagi nanti",
        variant: "destructive",
      });
    }
  };
  
  // Function to handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast({
        title: "Semua notifikasi dibaca",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Gagal memperbarui notifikasi",
        description: "Silakan coba lagi nanti",
        variant: "destructive",
      });
    }
  };
  
  // Function to delete a notification
  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id);
      toast({
        title: "Notifikasi dihapus",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Gagal menghapus notifikasi",
        description: "Silakan coba lagi nanti",
        variant: "destructive",
      });
    }
  };
  
  // Function to delete all read notifications
  const handleDeleteAllRead = async () => {
    try {
      await deleteAllRead();
      toast({
        title: "Notifikasi yang sudah dibaca dihapus",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Gagal menghapus notifikasi",
        description: "Silakan coba lagi nanti",
        variant: "destructive",
      });
    }
  };
  
  // Function to refresh notifications
  const handleRefresh = () => {
    fetchNotifications();
    toast({
      title: "Memperbarui notifikasi...",
      variant: "default",
    });
  };
  
  // Function to get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'achievement_unlock':
        return <Trophy className="h-5 w-5 text-primary" />;
      case 'level_up':
        return <Trophy className="h-5 w-5 text-primary" />;
      case 'challenge_complete':
        return <Check className="h-5 w-5 text-success" />;
      case 'challenge_invitation':
        return <Bell className="h-5 w-5 text-warning" />;
      case 'friend_request':
        return <MessageCircle className="h-5 w-5 text-secondary" />;
      case 'quiz_complete':
        return <CheckAll className="h-5 w-5 text-success" />;
      case 'message':
        return <MessageCircle className="h-5 w-5 text-secondary" />;
      case 'admin':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'system':
      case 'welcome':
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  // Function to navigate to notification target if it has an action URL
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read first
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    // Navigate if there's an action URL
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };
  
  // Calculate notification stats
  const stats = {
    total: notifications?.length || 0,
    unread: notifications?.filter(n => !n.read).length || 0,
    read: notifications?.filter(n => n.read).length || 0,
    totalByType: notifications?.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {}
  };
  
  // Get filtered notifications
  const filteredNotifications = getFilteredNotifications();
  
  return (
    <MainLayout>
      <MetaTags 
        title="Notifikasi - Gamifikasi CS" 
        description="Pantau notifikasi dan pembaruan terbaru untuk akun Gamifikasi CS Anda."
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-background/60 py-8">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-pixel-heading text-gradient mb-2">Notifikasi</h1>
              <p className="text-muted-foreground font-pixel-body">
                Pantau pemberitahuan dan pembaruan terbaru untuk akun Anda
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="font-pixel-body"
                onClick={handleRefresh}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="font-pixel-body">
                    <Filter className="h-4 w-4 mr-2" />
                    Tindakan
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Kelola Notifikasi</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleMarkAllAsRead} className="font-pixel-body cursor-pointer">
                    <CheckAll className="h-4 w-4 mr-2" />
                    Tandai Semua Dibaca
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeleteAllRead} className="font-pixel-body cursor-pointer">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus yang Sudah Dibaca
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-pixel-heading">Ringkasan</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Notification stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col items-center justify-center bg-card border border-border rounded-lg p-3">
                        <span className="text-xl font-pixel-heading">{stats.total}</span>
                        <span className="text-xs font-pixel-body text-muted-foreground">Total</span>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-card border border-border rounded-lg p-3">
                        <span className="text-xl font-pixel-heading text-primary">{stats.unread}</span>
                        <span className="text-xs font-pixel-body text-muted-foreground">Belum Dibaca</span>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-card border border-border rounded-lg p-3">
                        <span className="text-xl font-pixel-heading text-muted-foreground">{stats.read}</span>
                        <span className="text-xs font-pixel-body text-muted-foreground">Dibaca</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Filter by type */}
                    <div>
                      <p className="text-sm font-pixel-heading mb-2">Filter Berdasarkan Tipe</p>
                      <Select
                        value={currentFilter}
                        onValueChange={setCurrentFilter}
                      >
                        <SelectTrigger className="w-full font-pixel-body">
                          <SelectValue placeholder="Pilih tipe notifikasi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="font-pixel-body">Semua Tipe</SelectItem>
                          <SelectItem value="achievement_unlock" className="font-pixel-body">Achievement</SelectItem>
                          <SelectItem value="level_up" className="font-pixel-body">Level Up</SelectItem>
                          <SelectItem value="challenge_complete" className="font-pixel-body">Challenge Selesai</SelectItem>
                          <SelectItem value="challenge_invitation" className="font-pixel-body">Undangan Challenge</SelectItem>
                          <SelectItem value="quiz_complete" className="font-pixel-body">Quiz Selesai</SelectItem>
                          <SelectItem value="message" className="font-pixel-body">Pesan</SelectItem>
                          <SelectItem value="system" className="font-pixel-body">Sistem</SelectItem>
                          <SelectItem value="admin" className="font-pixel-body">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Separator />
                    
                    {/* Common activity links */}
                    <div>
                      <p className="text-sm font-pixel-heading mb-2">Aktivitas Umum</p>
                      <ul className="space-y-1">
                        <li>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start font-pixel-body text-muted-foreground"
                            asChild
                          >
                            <a href="/achievements">
                              <Trophy className="h-4 w-4 mr-2" />
                              Achievements
                              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/50" />
                            </a>
                          </Button>
                        </li>
                        <li>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start font-pixel-body text-muted-foreground"
                            asChild
                          >
                            <a href="/challenges">
                              <Check className="h-4 w-4 mr-2" />
                              Challenges
                              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/50" />
                            </a>
                          </Button>
                        </li>
                        <li>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start font-pixel-body text-muted-foreground"
                            asChild
                          >
                            <a href="/settings/notifications">
                              <Bell className="h-4 w-4 mr-2" />
                              Pengaturan Notifikasi
                              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/50" />
                            </a>
                          </Button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Notifications List */}
            <div className="lg:col-span-2">
              <Card className="border-2">
                <CardHeader className="pb-0">
                  <Tabs 
                    defaultValue="all" 
                    value={currentTab} 
                    onValueChange={setCurrentTab} 
                    className="w-full"
                  >
                    <TabsList className="w-full grid grid-cols-3 mb-2">
                      <TabsTrigger value="all" className="font-pixel-body">
                        Semua
                      </TabsTrigger>
                      <TabsTrigger value="unread" className="font-pixel-body">
                        Belum Dibaca
                        <Badge variant="secondary" className="ml-2">
                          {stats.unread}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="read" className="font-pixel-body">
                        Dibaca
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                
                <CardContent className="pt-4">
                  {isLoading ? (
                    // Loading state
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    // Empty state
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="font-pixel-heading text-lg mb-2">Tidak ada notifikasi</h3>
                      <p className="text-muted-foreground font-pixel-body mb-6">
                        {currentTab === 'unread' 
                          ? 'Anda sudah membaca semua notifikasi!' 
                          : currentFilter !== 'all' 
                            ? `Tidak ada notifikasi dengan tipe ${currentFilter}` 
                            : 'Notifikasi Anda akan muncul di sini'}
                      </p>
                      {currentTab !== 'all' || currentFilter !== 'all' ? (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setCurrentTab('all');
                            setCurrentFilter('all');
                          }}
                          className="font-pixel-body"
                        >
                          Tampilkan Semua Notifikasi
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          onClick={handleRefresh}
                          className="font-pixel-body"
                        >
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      )}
                    </div>
                  ) : (
                    // Notifications list
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-2"
                    >
                      {filteredNotifications.map((notification) => (
                        <motion.div 
                          key={notification.id} 
                          variants={itemVariants}
                          className={`p-3 rounded-lg border ${
                            notification.read 
                              ? 'bg-card/60 border-border' 
                              : 'bg-primary/5 border-primary/20'
                          } relative hover:bg-card/80 transition-colors cursor-pointer`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                              notification.read ? 'bg-muted' : 'bg-primary/10'
                            }`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h3 className={`font-pixel-heading text-sm ${!notification.read && 'text-primary'}`}>
                                  {notification.title}
                                </h3>
                                <div className="flex items-center gap-2 ml-2">
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs font-pixel-body whitespace-nowrap"
                                  >
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                  </Badge>
                                </div>
                              </div>
                              
                              <p className="text-sm font-pixel-body text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="absolute top-2 right-2 flex gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                title="Tandai Dibaca"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification.id);
                              }}
                              title="Hapus"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                  
                  {/* Show count of filtered notifications */}
                  {!isLoading && filteredNotifications.length > 0 && (
                    <div className="text-center mt-6 text-sm font-pixel-body text-muted-foreground">
                      Menampilkan {filteredNotifications.length} dari {notifications?.length || 0} notifikasi
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
