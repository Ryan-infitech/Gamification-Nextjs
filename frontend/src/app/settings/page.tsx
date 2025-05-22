'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  User,
  Lock,
  Bell,
  Moon,
  Volume2,
  Gamepad,
  Languages,
  Eye,
  Save,
  Upload,
  RefreshCw,
  Trash2
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Separator } from '@/components/ui/Separator';
import { Slider } from '@/components/ui/Slider';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useUserSettings } from '@/hooks/useUserSettings';
import MainLayout from '@/components/layout/MainLayout';
import MetaTags from '@/components/common/MetaTags';

interface FormState {
  displayName: string;
  username: string;
  email: string;
  bio: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  theme: string;
  language: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  uiScale: number;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, updateProfile } = useAuth();
  const { 
    settings, 
    isLoading: settingsLoading, 
    updateSettings, 
    deleteAccount 
  } = useUserSettings();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Initialize form state
  const [formState, setFormState] = useState<FormState>({
    displayName: '',
    username: '',
    email: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    theme: 'system',
    language: 'id',
    notificationsEnabled: true,
    emailNotifications: true,
    soundEnabled: true,
    musicVolume: 70,
    sfxVolume: 100,
    uiScale: 1.0,
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
  });
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  // Populate form with user data when available
  useEffect(() => {
    if (user) {
      setFormState(prevState => ({
        ...prevState,
        displayName: user.display_name || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
      }));
    }
  }, [user]);
  
  // Populate form with settings data when available
  useEffect(() => {
    if (settings) {
      setFormState(prevState => ({
        ...prevState,
        theme: settings.theme || 'system',
        language: settings.language || 'id',
        notificationsEnabled: settings.notifications_enabled ?? true,
        emailNotifications: settings.email_notifications ?? true,
        soundEnabled: settings.sound_enabled ?? true,
        musicVolume: settings.music_volume ?? 70,
        sfxVolume: settings.sfx_volume ?? 100,
        uiScale: settings.ui_scale ?? 1.0,
        highContrast: settings.accessibility_options?.high_contrast ?? false,
        largeText: settings.accessibility_options?.large_text ?? false,
        reducedMotion: settings.accessibility_options?.reduced_motion ?? false,
        screenReader: settings.accessibility_options?.screen_reader ?? false,
      }));
    }
  }, [settings]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormState(prevState => ({
      ...prevState,
      [name]: checked
    }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormState(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  // Handle slider changes
  const handleSliderChange = (name: string, value: number[]) => {
    setFormState(prevState => ({
      ...prevState,
      [name]: value[0]
    }));
  };
  
  // Handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle profile save
  const handleProfileSave = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Update profile
      await updateProfile({
        displayName: formState.displayName,
        bio: formState.bio,
        avatarFile: avatarFile,
      });
      
      toast({
        title: "Profil berhasil diperbarui",
        variant: "success",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Gagal memperbarui profil",
        description: "Silakan coba lagi nanti",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle password save
  const handlePasswordSave = async () => {
    if (!user) return;
    
    // Validate new password
    if (formState.newPassword.length < 8) {
      toast({
        title: "Password terlalu pendek",
        description: "Password harus minimal 8 karakter",
        variant: "destructive",
      });
      return;
    }
    
    if (formState.newPassword !== formState.confirmPassword) {
      toast({
        title: "Password tidak cocok",
        description: "Konfirmasi password tidak sesuai dengan password baru",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call API to update password
      // This would be implemented in your auth service
      // await updatePassword(formState.currentPassword, formState.newPassword);
      
      toast({
        title: "Password berhasil diperbarui",
        variant: "success",
      });
      
      // Clear password fields
      setFormState(prevState => ({
        ...prevState,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Gagal memperbarui password",
        description: "Password saat ini mungkin salah atau terjadi kesalahan server",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle preferences save
  const handlePreferencesSave = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      await updateSettings({
        theme: formState.theme,
        language: formState.language,
        notifications_enabled: formState.notificationsEnabled,
        email_notifications: formState.emailNotifications,
        sound_enabled: formState.soundEnabled,
        music_volume: formState.musicVolume,
        sfx_volume: formState.sfxVolume,
        ui_scale: formState.uiScale,
        accessibility_options: {
          high_contrast: formState.highContrast,
          large_text: formState.largeText,
          reduced_motion: formState.reducedMotion,
          screen_reader: formState.screenReader,
        }
      });
      
      toast({
        title: "Preferensi berhasil diperbarui",
        variant: "success",
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Gagal memperbarui preferensi",
        description: "Silakan coba lagi nanti",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user) return;
    
    if (confirmDeleteText !== user.username) {
      toast({
        title: "Konfirmasi tidak sesuai",
        description: "Masukkan username Anda dengan benar untuk mengonfirmasi",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await deleteAccount();
      
      toast({
        title: "Akun berhasil dihapus",
        description: "Terima kasih telah menggunakan layanan kami",
        variant: "default",
      });
      
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Gagal menghapus akun",
        description: "Silakan coba lagi nanti",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  if (authLoading || settingsLoading) {
    // Loading state
    return (
      <MainLayout>
        <div className="container px-4 mx-auto py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-full max-w-md mb-8" />
            
            <div className="grid gap-8">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (!user) {
    // Will redirect in useEffect
    return null;
  }
  
  return (
    <MainLayout>
      <MetaTags 
        title="Pengaturan - Gamifikasi CS" 
        description="Kelola pengaturan akun dan preferensi Anda di platform Gamifikasi CS."
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-background/60 py-8">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-pixel-heading text-gradient mb-2">Pengaturan</h1>
            <p className="text-muted-foreground font-pixel-body mb-8">
              Kelola profil, akun, dan preferensi Anda
            </p>
            
            <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 flex-wrap">
                <TabsTrigger value="profile" className="font-pixel-body">
                  <User className="w-4 h-4 mr-2" />
                  Profil
                </TabsTrigger>
                <TabsTrigger value="account" className="font-pixel-body">
                  <Lock className="w-4 h-4 mr-2" />
                  Akun
                </TabsTrigger>
                <TabsTrigger value="notifications" className="font-pixel-body">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifikasi
                </TabsTrigger>
                <TabsTrigger value="preferences" className="font-pixel-body">
                  <Moon className="w-4 h-4 mr-2" />
                  Tampilan
                </TabsTrigger>
                <TabsTrigger value="audio" className="font-pixel-body">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Audio
                </TabsTrigger>
                <TabsTrigger value="game" className="font-pixel-body">
                  <Gamepad className="w-4 h-4 mr-2" />
                  Game
                </TabsTrigger>
                <TabsTrigger value="accessibility" className="font-pixel-body">
                  <Eye className="w-4 h-4 mr-2" />
                  Aksesibilitas
                </TabsTrigger>
              </TabsList>
              
              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-xl font-pixel-heading">Informasi Profil</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex flex-col items-center gap-4">
                        <Avatar className="w-32 h-32 border-2 border-border">
                          <AvatarImage src={avatarPreview || user.avatar_url || ''} alt={user.username} />
                          <AvatarFallback className="text-4xl font-pixel-heading bg-primary/10">
                            {user.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="font-pixel-body"
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Ganti
                          </Button>
                          
                          <input
                            id="avatar-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarChange}
                          />
                          
                          {avatarPreview && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="font-pixel-body text-danger"
                              onClick={() => {
                                setAvatarFile(null);
                                setAvatarPreview(null);
                              }}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reset
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div>
                          <Label htmlFor="username" className="font-pixel-body">Username</Label>
                          <Input
                            id="username"
                            name="username"
                            value={formState.username}
                            onChange={handleInputChange}
                            className="font-pixel-body"
                            disabled
                          />
                          <p className="text-xs text-muted-foreground mt-1 font-pixel-body">
                            Username tidak dapat diubah
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="displayName" className="font-pixel-body">Nama Tampilan</Label>
                          <Input
                            id="displayName"
                            name="displayName"
                            value={formState.displayName}
                            onChange={handleInputChange}
                            className="font-pixel-body"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="email" className="font-pixel-body">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            value={formState.email}
                            className="font-pixel-body"
                            disabled
                          />
                          <p className="text-xs text-muted-foreground mt-1 font-pixel-body">
                            Untuk mengubah email, silakan hubungi administrator
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="bio" className="font-pixel-body">Bio</Label>
                          <Textarea
                            id="bio"
                            name="bio"
                            value={formState.bio}
                            onChange={handleInputChange}
                            className="font-pixel-body resize-none min-h-[100px]"
                            placeholder="Ceritakan tentang dirimu..."
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleProfileSave} 
                        className="font-pixel-body"
                        isLoading={isSubmitting}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Simpan Perubahan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-2 mt-6">
                  <CardHeader>
                    <CardTitle className="text-xl font-pixel-heading">Kemajuan & Statistik</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="border border-border rounded-md p-4">
                        <div className="text-sm text-muted-foreground font-pixel-body mb-1">Level</div>
                        <div className="text-2xl font-pixel-heading">{user.level || 1}</div>
                      </div>
                      
                      <div className="border border-border rounded-md p-4">
                        <div className="text-sm text-muted-foreground font-pixel-body mb-1">XP</div>
                        <div className="text-2xl font-pixel-heading">{user.experience || 0}</div>
                      </div>
                      
                      <div className="border border-border rounded-md p-4">
                        <div className="text-sm text-muted-foreground font-pixel-body mb-1">Challenges</div>
                        <div className="text-2xl font-pixel-heading">{user.completed_challenges || 0}</div>
                      </div>
                      
                      <div className="border border-border rounded-md p-4">
                        <div className="text-sm text-muted-foreground font-pixel-body mb-1">Achievements</div>
                        <div className="text-2xl font-pixel-heading">{user.achievements || 0}</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <Button 
                        variant="outline" 
                        className="font-pixel-body"
                        asChild
                      >
                        <a href="/profile">
                          Lihat Profil Lengkap
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Account Tab */}
              <TabsContent value="account">
                <Card className="border-2 mb-6">
                  <CardHeader>
                    <CardTitle className="text-xl font-pixel-heading">Keamanan Akun</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword" className="font-pixel-body">Password Saat Ini</Label>
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          value={formState.currentPassword}
                          onChange={handleInputChange}
                          className="font-pixel-body"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="newPassword" className="font-pixel-body">Password Baru</Label>
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          value={formState.newPassword}
                          onChange={handleInputChange}
                          className="font-pixel-body"
                        />
                        <p className="text-xs text-muted-foreground mt-1 font-pixel-body">
                          Minimal 8 karakter, termasuk huruf dan angka
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="confirmPassword" className="font-pixel-body">Konfirmasi Password Baru</Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={formState.confirmPassword}
                          onChange={handleInputChange}
                          className="font-pixel-body"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handlePasswordSave} 
                        className="font-pixel-body"
                        isLoading={isSubmitting}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Perbarui Password
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-danger/20 bg-danger/5">
                  <CardHeader>
                    <CardTitle className="text-xl font-pixel-heading text-danger">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-pixel-body text-muted-foreground mb-4">
                      Tindakan berikut tidak dapat dibatalkan. Harap berhati-hati.
                    </p>
                    
                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          className="font-pixel-body"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus Akun
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="font-pixel-heading">Hapus Akun Permanen</DialogTitle>
                          <DialogDescription className="font-pixel-body">
                            Tindakan ini tidak dapat dibatalkan. Semua data Anda akan dihapus secara permanen.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="bg-danger/10 border border-danger/20 rounded-md p-4 text-sm font-pixel-body">
                            <p>Semua yang akan dihapus:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                              <li>Profil dan informasi akun</li>
                              <li>Progres pembelajaran dan kemajuan game</li>
                              <li>Achievements dan statistik</li>
                              <li>Kode dan solusi tantangan</li>
                            </ul>
                          </div>
                          
                          <div>
                            <Label htmlFor="confirmDelete" className="font-pixel-body">
                              Ketik "<span className="font-semibold">{user.username}</span>" untuk mengonfirmasi:
                            </Label>
                            <Input
                              id="confirmDelete"
                              value={confirmDeleteText}
                              onChange={(e) => setConfirmDeleteText(e.target.value)}
                              className="font-pixel-body mt-2"
                            />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsDeleteDialogOpen(false)} 
                            className="font-pixel-body"
                          >
                            Batal
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={handleDeleteAccount} 
                            className="font-pixel-body"
                            isLoading={isSubmitting}
                            disabled={confirmDeleteText !== user.username}
                          >
                            Hapus Akun Permanen
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-xl font-pixel-heading">Pengaturan Notifikasi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="notificationsEnabled" className="font-pixel-heading text-base">
                            Notifikasi In-App
                          </Label>
                          <p className="text-sm text-muted-foreground font-pixel-body">
                            Tampilkan notifikasi di dalam aplikasi
                          </p>
                        </div>
                        <Switch
                          id="notificationsEnabled"
                          checked={formState.notificationsEnabled}
                          onCheckedChange={(checked) => handleSwitchChange('notificationsEnabled', checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="emailNotifications" className="font-pixel-heading text-base">
                            Notifikasi Email
                          </Label>
                          <p className="text-sm text-muted-foreground font-pixel-body">
                            Kirim notifikasi penting melalui email
                          </p>
                        </div>
                        <Switch
                          id="emailNotifications"
                          checked={formState.emailNotifications}
                          onCheckedChange={(checked) => handleSwitchChange('emailNotifications', checked)}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-card/50 border border-border rounded-md p-4">
                      <h3 className="font-pixel-heading text-lg mb-4">Terima notifikasi untuk:</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch id="achievement-notif" defaultChecked />
                          <Label htmlFor="achievement-notif" className="font-pixel-body">
                            Achievement baru
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch id="levelup-notif" defaultChecked />
                          <Label htmlFor="levelup-notif" className="font-pixel-body">
                            Level up
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch id="challenge-notif" defaultChecked />
                          <Label htmlFor="challenge-notif" className="font-pixel-body">
                            Challenge baru
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch id="friend-notif" defaultChecked />
                          <Label htmlFor="friend-notif" className="font-pixel-body">
                            Permintaan pertemanan
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch id="system-notif" defaultChecked />
                          <Label htmlFor="system-notif" className="font-pixel-body">
                            Pengumuman sistem
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch id="message-notif" defaultChecked />
                          <Label htmlFor="message-notif" className="font-pixel-body">
                            Pesan pribadi
                          </Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handlePreferencesSave} 
                        className="font-pixel-body"
                        isLoading={isSubmitting}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Simpan Pengaturan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Preferences Tab */}
              <TabsContent value="preferences">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-xl font-pixel-heading">Tampilan & Tema</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="theme-select" className="font-pixel-heading text-base">
                          Tema
                        </Label>
                        <Select
                          value={formState.theme}
                          onValueChange={(value) => handleSelectChange('theme', value)}
                        >
                          <SelectTrigger id="theme-select" className="font-pixel-body">
                            <SelectValue placeholder="Pilih tema" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light" className="font-pixel-body">Light</SelectItem>
                            <SelectItem value="dark" className="font-pixel-body">Dark</SelectItem>
                            <SelectItem value="system" className="font-pixel-body">System Default</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="language-select" className="font-pixel-heading text-base">
                          Bahasa
                        </Label>
                        <Select
                          value={formState.language}
                          onValueChange={(value) => handleSelectChange('language', value)}
                        >
                          <SelectTrigger id="language-select" className="font-pixel-body">
                            <SelectValue placeholder="Pilih bahasa" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="id" className="font-pixel-body">Bahasa Indonesia</SelectItem>
                            <SelectItem value="en" className="font-pixel-body">English</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="ui-scale" className="font-pixel-heading text-base mb-2 block">
                          Skala UI
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-pixel-body">80%</span>
                          <Slider
                            id="ui-scale"
                            min={0.8}
                            max={1.2}
                            step={0.1}
                            value={[formState.uiScale]}
                            onValueChange={(value) => handleSliderChange('uiScale', value)}
                            className="flex-1"
                          />
                          <span className="text-sm font-pixel-body">120%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-pixel-body">
                          Ubah ukuran elemen UI secara global
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handlePreferencesSave} 
                        className="font-pixel-body"
                        isLoading={isSubmitting}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Simpan Pengaturan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Audio Tab */}
              <TabsContent value="audio">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-xl font-pixel-heading">Pengaturan Audio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="soundEnabled" className="font-pixel-heading text-base">
                            Suara
                          </Label>
                          <p className="text-sm text-muted-foreground font-pixel-body">
                            Aktifkan atau nonaktifkan semua suara
                          </p>
                        </div>
                        <Switch
                          id="soundEnabled"
                          checked={formState.soundEnabled}
                          onCheckedChange={(checked) => handleSwitchChange('soundEnabled', checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label htmlFor="music-volume" className="font-pixel-heading text-base mb-2 block">
                          Volume Musik
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-pixel-body">0%</span>
                          <Slider
                            id="music-volume"
                            min={0}
                            max={100}
                            step={10}
                            disabled={!formState.soundEnabled}
                            value={[formState.musicVolume]}
                            onValueChange={(value) => handleSliderChange('musicVolume', value)}
                            className="flex-1"
                          />
                          <span className="text-sm font-pixel-body">100%</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="sfx-volume" className="font-pixel-heading text-base mb-2 block">
                          Volume Efek Suara
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-pixel-body">0%</span>
                          <Slider
                            id="sfx-volume"
                            min={0}
                            max={100}
                            step={10}
                            disabled={!formState.soundEnabled}
                            value={[formState.sfxVolume]}
                            onValueChange={(value) => handleSliderChange('sfxVolume', value)}
                            className="flex-1"
                          />
                          <span className="text-sm font-pixel-body">100%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handlePreferencesSave} 
                        className="font-pixel-body"
                        isLoading={isSubmitting}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Simpan Pengaturan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Game Tab */}
              <TabsContent value="game">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-xl font-pixel-heading">Pengaturan Game</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="show-tutorial" className="font-pixel-heading text-base">
                            Tampilkan Tutorial
                          </Label>
                          <p className="text-sm text-muted-foreground font-pixel-body">
                            Tampilkan tutorial untuk fitur baru
                          </p>
                        </div>
                        <Switch id="show-tutorial" defaultChecked />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="auto-save" className="font-pixel-heading text-base">
                            Auto-Save
                          </Label>
                          <p className="text-sm text-muted-foreground font-pixel-body">
                            Simpan progres secara otomatis
                          </p>
                        </div>
                        <Switch id="auto-save" defaultChecked />
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label htmlFor="quality-select" className="font-pixel-heading text-base">
                          Kualitas Grafis
                        </Label>
                        <Select defaultValue="medium">
                          <SelectTrigger id="quality-select" className="font-pixel-body">
                            <SelectValue placeholder="Pilih kualitas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low" className="font-pixel-body">Rendah</SelectItem>
                            <SelectItem value="medium" className="font-pixel-body">Sedang</SelectItem>
                            <SelectItem value="high" className="font-pixel-body">Tinggi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
                      <h3 className="font-pixel-heading text-base mb-2">Kontrol Keyboard</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm font-pixel-body">
                        <div>
                          <Badge variant="outline" className="mr-2">W</Badge>
                          <span>Atas</span>
                        </div>
                        <div>
                          <Badge variant="outline" className="mr-2">S</Badge>
                          <span>Bawah</span>
                        </div>
                        <div>
                          <Badge variant="outline" className="mr-2">A</Badge>
                          <span>Kiri</span>
                        </div>
                        <div>
                          <Badge variant="outline" className="mr-2">D</Badge>
                          <span>Kanan</span>
                        </div>
                        <div>
                          <Badge variant="outline" className="mr-2">E</Badge>
                          <span>Interaksi</span>
                        </div>
                        <div>
                          <Badge variant="outline" className="mr-2">Space</Badge>
                          <span>Lompat</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button className="font-pixel-body">
                        <Save className="w-4 h-4 mr-2" />
                        Simpan Pengaturan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-2 mt-6">
                  <CardHeader>
                    <CardTitle className="text-xl font-pixel-heading">Data Game</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-pixel-body text-muted-foreground mb-4">
                      Kelola data game dan simpanan Anda
                    </p>
                    
                    <div className="flex flex-wrap gap-4">
                      <Button variant="outline" className="font-pixel-body">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reset Tutorial
                      </Button>
                      
                      <Button variant="outline" className="font-pixel-body text-danger">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Reset Progres Game
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Accessibility Tab */}
              <TabsContent value="accessibility">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-xl font-pixel-heading">Aksesibilitas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="highContrast" className="font-pixel-heading text-base">
                            Mode Kontras Tinggi
                          </Label>
                          <p className="text-sm text-muted-foreground font-pixel-body">
                            Tingkatkan kontras untuk visibilitas lebih baik
                          </p>
                        </div>
                        <Switch
                          id="highContrast"
                          checked={formState.highContrast}
                          onCheckedChange={(checked) => handleSwitchChange('highContrast', checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="largeText" className="font-pixel-heading text-base">
                            Teks Besar
                          </Label>
                          <p className="text-sm text-muted-foreground font-pixel-body">
                            Perbesar teks untuk keterbacaan yang lebih baik
                          </p>
                        </div>
                        <Switch
                          id="largeText"
                          checked={formState.largeText}
                          onCheckedChange={(checked) => handleSwitchChange('largeText', checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="reducedMotion" className="font-pixel-heading text-base">
                            Kurangi Animasi
                          </Label>
                          <p className="text-sm text-muted-foreground font-pixel-body">
                            Kurangi atau hilangkan animasi interface
                          </p>
                        </div>
                        <Switch
                          id="reducedMotion"
                          checked={formState.reducedMotion}
                          onCheckedChange={(checked) => handleSwitchChange('reducedMotion', checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="screenReader" className="font-pixel-heading text-base">
                            Dukungan Screen Reader
                          </Label>
                          <p className="text-sm text-muted-foreground font-pixel-body">
                            Optimalkan interface untuk screen reader
                          </p>
                        </div>
                        <Switch
                          id="screenReader"
                          checked={formState.screenReader}
                          onCheckedChange={(checked) => handleSwitchChange('screenReader', checked)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handlePreferencesSave}
                        className="font-pixel-body"
                        isLoading={isSubmitting}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Simpan Pengaturan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
