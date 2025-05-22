"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, MessageCircle, Mail, Users } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { api } from '@/utils/api';
import { formatDate } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function FeedbackPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [feedbackData, setFeedbackData] = useState({
    title: '',
    description: '',
    type: 'bug',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...filesArray]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Submit feedback API call
      await api.feedback.submit.create({
        data: {
          title: feedbackData.title,
          description: feedbackData.description,
          type: feedbackData.type,
          attachments: attachments.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size,
          })),
        },
      });
      
      toast({
        title: 'Feedback Terkirim',
        description: 'Terima kasih atas feedback Anda!',
        variant: 'success',
      });
      
      // Reset form
      setFeedbackData({ title: '', description: '', type: 'bug' });
      setAttachments([]);
      setActiveTab('history');
    } catch (error) {
      toast({
        title: 'Terjadi Kesalahan',
        description: 'Gagal mengirim feedback, silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchFeedbackHistory = async () => {
      setIsLoading(true);
      try {
        const history = await api.feedback.history.getAll();
        setFeedbackHistory(history);
      } catch (error) {
        toast({
          title: 'Terjadi Kesalahan',
          description: 'Gagal memuat riwayat feedback.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedbackHistory();
  }, [toast]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <Bug className="h-4 w-4 text-primary" />;
      case 'feature':
        return <Star className="h-4 w-4 text-primary" />;
      case 'general':
        return <Info className="h-4 w-4 text-primary" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'in_progress':
        return 'blue';
      case 'resolved':
        return 'green';
      case 'closed':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <MainLayout>
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-pixel-heading mb-8 text-center">
            Kirim &amp; Lihat Riwayat Feedback
          </h1>
          
          <div className="mb-6">
            <Tabs defaultValue="submit" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="submit" className="font-pixel-body">
                  Kirim Feedback
                </TabsTrigger>
                <TabsTrigger value="history" className="font-pixel-body">
                  Riwayat Feedback
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="submit">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-xl font-pixel-heading">Kirim Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={submitFeedback}>
                      <div className="grid gap-4">
                        <div>
                          <Label className="font-pixel-body">Judul</Label>
                          <input
                            type="text"
                            value={feedbackData.title}
                            onChange={(e) => setFeedbackData({ ...feedbackData, title: e.target.value })}
                            className="mt-2 p-3 border border-border rounded-md w-full font-pixel-body"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label className="font-pixel-body">Deskripsi</Label>
                          <textarea
                            value={feedbackData.description}
                            onChange={(e) => setFeedbackData({ ...feedbackData, description: e.target.value })}
                            className="mt-2 p-3 border border-border rounded-md w-full font-pixel-body resize-none"
                            rows={4}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label className="font-pixel-body">Tipe Feedback</Label>
                          <select
                            value={feedbackData.type}
                            onChange={(e) => setFeedbackData({ ...feedbackData, type: e.target.value })}
                            className="mt-2 p-3 border border-border rounded-md w-full font-pixel-body"
                            required
                          >
                            <option value="bug">Laporan Bug</option>
                            <option value="feature">Usulan Fitur</option>
                            <option value="general">Feedback Umum</option>
                          </select>
                        </div>
                        
                        <div>
                          <Label className="font-pixel-body">Lampirkan File (opsional)</Label>
                          <div className="mt-2">
                            <div
                              className="border-2 border-dashed border-border rounded-md p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => document.getElementById('file-upload')?.click()}
                            >
                              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm font-pixel-body text-muted-foreground">
                                Klik untuk upload screenshot, log, atau file lainnya
                              </p>
                              <p className="text-xs font-pixel-body text-muted-foreground mt-1">
                                Maks 5MB per file (PNG, JPG, PDF, TXT)
                              </p>
                              <input
                                id="file-upload"
                                type="file"
                                multiple
                                accept=".png,.jpg,.jpeg,.pdf,.txt"
                                className="hidden"
                                onChange={handleFileUpload}
                              />
                            </div>
                            
                            {/* Attachment previews */}
                            {attachments.length > 0 && (
                              <div className="mt-3 space-y-2">
                                <p className="text-sm font-pixel-body">
                                  Lampiran ({attachments.length}):
                                </p>
                                
                                <div className="space-y-2">
                                  {attachments.map((file, index) => (
                                    <div 
                                      key={index} 
                                      className="flex items-center justify-between bg-muted p-2 rounded-md"
                                    >
                                      <div className="flex items-center">
                                        <div className="h-8 w-8 bg-background/50 rounded-md flex items-center justify-center mr-2">
                                          {file.type.includes('image') ? (
                                            <Image
                                              src={URL.createObjectURL(file)}
                                              alt="Preview"
                                              width={32}
                                              height={32}
                                              className="object-cover rounded-md"
                                            />
                                          ) : (
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                          )}
                                        </div>
                                        <div className="overflow-hidden">
                                          <p className="text-sm font-pixel-body truncate" title={file.name}>
                                            {file.name}
                                          </p>
                                          <p className="text-xs text-muted-foreground font-pixel-body">
                                            {(file.size / 1024).toFixed(1)} KB
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeAttachment(index)}
                                        className="h-7 w-7 text-muted-foreground hover:text-danger"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="border border-border bg-card/50 rounded-md p-4 text-sm">
                          <p className="font-pixel-body text-muted-foreground">
                            <span className="text-primary">Catatan:</span> Feedback Anda sangat berarti untuk pengembangan platform.
                            Kami akan meninjau dan merespons feedback Anda secepat mungkin.
                          </p>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            className="font-pixel-body"
                            isLoading={isSubmitting}
                          >
                            Kirim Feedback
                          </Button>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="history">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-xl font-pixel-heading">Riwayat Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex flex-col gap-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="animate-pulse flex p-4 border border-border rounded-md">
                            <div className="h-10 w-10 bg-muted rounded-full mr-3"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-muted rounded w-1/2 mb-1"></div>
                              <div className="h-3 bg-muted rounded w-1/4"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : feedbackHistory?.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MessageCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <h3 className="font-pixel-heading text-lg mb-2">Belum Ada Feedback</h3>
                        <p className="text-muted-foreground font-pixel-body mb-6 max-w-md">
                          Anda belum mengirimkan feedback. Kirim feedback untuk membantu kami meningkatkan platform.
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab('submit')}
                          className="font-pixel-body"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Kirim Feedback Baru
                        </Button>
                      </div>
                    ) : (
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                      >
                        {feedbackHistory?.map((feedback) => (
                          <motion.div
                            key={feedback.id}
                            variants={itemVariants}
                            className="border border-border bg-card/50 rounded-md overflow-hidden"
                          >
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                                    {getTypeIcon(feedback.type)}
                                  </div>
                                  <h3 className="font-pixel-heading">{feedback.title}</h3>
                                </div>
                                <Badge variant={getStatusColor(feedback.status)}>
                                  {feedback.status === 'pending' ? 'Pending' : 
                                   feedback.status === 'in_progress' ? 'Diproses' : 
                                   feedback.status === 'resolved' ? 'Selesai' : 
                                   'Ditutup'}
                                </Badge>
                              </div>
                              
                              <p className="text-sm font-pixel-body mb-3 line-clamp-2">
                                {feedback.description}
                              </p>
                              
                              <div className="flex flex-wrap items-center justify-between text-xs">
                                <div className="flex items-center text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>{formatDate(feedback.created_at)}</span>
                                </div>
                                
                                {feedback.response && (
                                  <Badge variant="outline" className="text-xs font-pixel-body">
                                    Telah direspons
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {feedback.response && (
                              <div className="border-t border-border bg-card/80 p-4">
                                <div className="flex items-start gap-2">
                                  <div className="h-6 w-6 rounded-full bg-secondary/10 flex items-center justify-center mt-0.5">
                                    <MessageCircle className="h-3 w-3 text-secondary" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium font-pixel-body mb-1">
                                      Respons dari Tim ({formatDate(feedback.response.created_at)})
                                    </p>
                                    <p className="text-sm font-pixel-body">
                                      {feedback.response.message}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                    
                    {feedbackHistory && feedbackHistory.length > 0 && (
                      <div className="flex justify-center mt-6">
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab('submit')}
                          className="font-pixel-body"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Kirim Feedback Baru
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Support contact info */}
      <div className="bg-primary/5 border-t border-primary/10 mt-12 py-12">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-pixel-heading mb-4">Butuh Bantuan Langsung?</h2>
            <p className="font-pixel-body text-muted-foreground mb-6">
              Jika Anda membutuhkan bantuan segera atau memiliki pertanyaan yang mendesak, 
              jangan ragu untuk menghubungi tim dukungan kami.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:support@gamifikasi-cs.com" 
                className="flex items-center justify-center gap-2 bg-card border border-border hover:border-primary p-3 rounded-md transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-pixel-heading text-sm">Email Support</p>
                  <p className="text-sm text-muted-foreground font-pixel-body">support@gamifikasi-cs.com</p>
                </div>
              </a>
              
              <a 
                href="#" 
                className="flex items-center justify-center gap-2 bg-card border border-border hover:border-primary p-3 rounded-md transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-pixel-heading text-sm">Live Chat</p>
                  <p className="text-sm text-muted-foreground font-pixel-body">Jam 9:00-17:00 WIB</p>
                </div>
              </a>
              
              <a 
                href="/discord" 
                className="flex items-center justify-center gap-2 bg-card border border-border hover:border-primary p-3 rounded-md transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-pixel-heading text-sm">Discord Community</p>
                  <p className="text-sm text-muted-foreground font-pixel-body">Gabung discord kami</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
