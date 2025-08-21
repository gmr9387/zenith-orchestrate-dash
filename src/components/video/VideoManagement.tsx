import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Search, 
  Filter,
  Eye,
  Clock,
  FileVideo,
  BarChart3,
  Settings,
  RefreshCw
} from 'lucide-react';
import { videoApi, Video, VideoAnalytics } from '@/lib/video-api';
import { VideoPlayer } from './VideoPlayer';
import { VideoUpload } from './VideoUpload';
import { VideoAnalyticsDashboard } from './VideoAnalyticsDashboard';

export const VideoManagement: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [analytics, setAnalytics] = useState<VideoAnalytics | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    loadVideos();
    loadAnalytics();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await videoApi.getVideos({ 
        search: searchTerm || undefined,
        limit: 50 
      });
      setVideos(response.data.videos);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await videoApi.getAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const handleVideoUpload = async (file: File, metadata: { title: string; description: string; quality: string }) => {
    try {
      await videoApi.uploadVideo(file, metadata);
      setShowUpload(false);
      loadVideos();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    try {
      await videoApi.deleteVideo(id);
      setVideos(videos.filter(v => v.id !== id));
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
  };

  const getStatusColor = (status: Video['status']) => {
    switch (status) {
      case 'ready': return 'bg-success';
      case 'processing': return 'bg-warning';
      case 'uploading': return 'bg-primary';
      case 'error': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || video.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Video Management</h1>
          <p className="text-muted-foreground">
            Upload, manage, and analyze your video content with HLS streaming
          </p>
        </div>
        
        <Button onClick={() => setShowUpload(true)} className="glass-card">
          <Upload className="mr-2 h-4 w-4" />
          Upload Video
        </Button>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
              <FileVideo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalVideos}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Watch Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(analytics.totalWatchTime / 3600)}h
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Watch Time</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(analytics.averageWatchTime / 60)}m
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="videos" className="space-y-4">
        <TabsList className="glass-card">
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-4">
          {/* Filters */}
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search videos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-input border border-border rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="ready">Ready</option>
                    <option value="processing">Processing</option>
                    <option value="uploading">Uploading</option>
                    <option value="error">Error</option>
                  </select>
                  
                  <Button variant="outline" size="sm" onClick={loadVideos}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredVideos.map((video) => (
                <motion.div
                  key={video.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="glass-card hover-lift">
                    <CardHeader className="pb-3">
                      <div className="aspect-video bg-muted rounded-lg mb-3 relative overflow-hidden">
                        {video.thumbnail ? (
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileVideo className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        
                        {video.status === 'ready' && (
                          <Button
                            size="sm"
                            className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-primary/80 hover:bg-primary"
                            onClick={() => {
                              setSelectedVideo(video);
                              setShowPlayer(true);
                            }}
                          >
                            <Play className="h-6 w-6" />
                          </Button>
                        )}
                        
                        <div className="absolute top-2 right-2">
                          <Badge className={getStatusColor(video.status)}>
                            {video.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardTitle className="text-lg">{video.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {video.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <span>{video.views} views</span>
                        <span>{video.duration ? `${Math.round(video.duration / 60)}m` : '—'}</span>
                        <Badge variant="outline">{video.quality}</Badge>
                      </div>
                      
                      {video.status === 'processing' && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Processing...</span>
                            <span>75%</span>
                          </div>
                          <Progress value={75} className="h-1" />
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        {video.status === 'ready' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedVideo(video);
                              setShowPlayer(true);
                            }}
                            className="flex-1"
                          >
                            <Play className="mr-2 h-3 w-3" />
                            Play
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteVideo(video.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredVideos.length === 0 && !loading && (
            <Card className="glass-card">
              <CardContent className="text-center py-16">
                <FileVideo className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No videos found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Try adjusting your search terms' : 'Upload your first video to get started'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowUpload(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Video
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          {analytics && <VideoAnalyticsDashboard analytics={analytics} />}
        </TabsContent>
      </Tabs>

      {/* Upload Modal */}
      {showUpload && (
        <VideoUpload 
          onUpload={handleVideoUpload}
          onClose={() => setShowUpload(false)}
        />
      )}

      {/* Video Player Modal */}
      {showPlayer && selectedVideo && (
        <VideoPlayer 
          video={selectedVideo}
          onClose={() => {
            setShowPlayer(false);
            setSelectedVideo(null);
          }}
        />
      )}
    </div>
  );
};