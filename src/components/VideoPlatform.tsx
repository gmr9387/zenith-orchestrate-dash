import React, { useState, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Play, 
  Pause, 
  Upload, 
  Settings, 
  Eye, 
  Heart, 
  Share2, 
  Download,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  BarChart3,
  Users,
  Clock,
  Globe,
  Lock,
  Shield,
  DollarSign,
  Video,
  Film,
  Camera,
  Mic,
  Monitor,
  Smartphone,
  Tablet,
  Tv,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Bookmark,
  PlayCircle,
  Square,
  Maximize2,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Scissors,
  Palette,
  Zap,
  Target,
  Award,
  Star,
  Crown,
  List
} from 'lucide-react';

interface VideoAsset {
  id: string;
  title: string;
  description: string;
  duration: number;
  thumbnailUrl: string;
  videoUrl: string;
  quality: '360p' | '480p' | '720p' | '1080p' | '4K';
  format: 'MP4' | 'WebM' | 'MOV' | 'AVI';
  size: number; // in MB
  status: 'processing' | 'ready' | 'error' | 'uploading';
  uploadDate: string;
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  category: string;
  tags: string[];
  isPublic: boolean;
  isMonetized: boolean;
  revenue: number;
  analytics: {
    watchTime: number;
    engagementRate: number;
    retentionRate: number;
    deviceBreakdown: {
      desktop: number;
      mobile: number;
      tablet: number;
      tv: number;
    };
    geographicData: Array<{
      country: string;
      views: number;
      percentage: number;
    }>;
  };
}

interface VideoCollection {
  id: string;
  name: string;
  description: string;
  videos: string[];
  thumbnailUrl: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

const VideoPlatform: React.FC = () => {
  const [videos, setVideos] = useState<VideoAsset[]>([]);
  const [collections, setCollections] = useState<VideoCollection[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoAsset | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('uploadDate');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data for demonstration
  React.useEffect(() => {
    const mockVideos: VideoAsset[] = [
      {
        id: '1',
        title: 'Getting Started with React Development',
        description: 'Learn the fundamentals of React development with this comprehensive tutorial.',
        duration: 1847, // 30:47 in seconds
        thumbnailUrl: 'https://via.placeholder.com/320x180/3B82F6/FFFFFF?text=React+Tutorial',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        quality: '1080p',
        format: 'MP4',
        size: 45.2,
        status: 'ready',
        uploadDate: '2024-01-15T10:30:00Z',
        views: 15420,
        likes: 892,
        dislikes: 23,
        comments: 156,
        shares: 89,
        category: 'Technology',
        tags: ['react', 'javascript', 'frontend', 'tutorial'],
        isPublic: true,
        isMonetized: true,
        revenue: 234.50,
        analytics: {
          watchTime: 1250000,
          engagementRate: 87.5,
          retentionRate: 78.2,
          deviceBreakdown: {
            desktop: 45,
            mobile: 38,
            tablet: 12,
            tv: 5,
          },
          geographicData: [
            { country: 'United States', views: 5200, percentage: 33.7 },
            { country: 'United Kingdom', views: 2100, percentage: 13.6 },
            { country: 'Canada', views: 1800, percentage: 11.7 },
            { country: 'Germany', views: 1200, percentage: 7.8 },
          ]
        }
      },
      {
        id: '2',
        title: 'Advanced CSS Grid Layouts',
        description: 'Master CSS Grid with advanced techniques and real-world examples.',
        duration: 2145, // 35:45 in seconds
        thumbnailUrl: 'https://via.placeholder.com/320x180/10B981/FFFFFF?text=CSS+Grid',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        quality: '720p',
        format: 'MP4',
        size: 32.8,
        status: 'ready',
        uploadDate: '2024-01-12T14:20:00Z',
        views: 8920,
        likes: 456,
        dislikes: 12,
        comments: 89,
        shares: 45,
        category: 'Design',
        tags: ['css', 'grid', 'layout', 'frontend'],
        isPublic: true,
        isMonetized: false,
        revenue: 0,
        analytics: {
          watchTime: 680000,
          engagementRate: 82.1,
          retentionRate: 71.5,
          deviceBreakdown: {
            desktop: 52,
            mobile: 35,
            tablet: 10,
            tv: 3,
          },
          geographicData: [
            { country: 'United States', views: 3100, percentage: 34.8 },
            { country: 'India', views: 1800, percentage: 20.2 },
            { country: 'Brazil', views: 1200, percentage: 13.5 },
            { country: 'France', views: 800, percentage: 9.0 },
          ]
        }
      }
    ];

    setVideos(mockVideos);
  }, []);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const newVideo: VideoAsset = {
      id: `video_${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      description: '',
      duration: 0,
      thumbnailUrl: 'https://via.placeholder.com/320x180/6B7280/FFFFFF?text=Processing',
      videoUrl: URL.createObjectURL(file),
      quality: '1080p',
      format: file.name.split('.').pop()?.toUpperCase() as any || 'MP4',
      size: file.size / (1024 * 1024),
      status: 'uploading',
      uploadDate: new Date().toISOString(),
      views: 0,
      likes: 0,
      dislikes: 0,
      comments: 0,
      shares: 0,
      category: 'Technology',
      tags: [],
      isPublic: false,
      isMonetized: false,
      revenue: 0,
      analytics: {
        watchTime: 0,
        engagementRate: 0,
        retentionRate: 0,
        deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0, tv: 0 },
        geographicData: []
      }
    };

    setVideos(prev => [newVideo, ...prev]);
    setShowUploadModal(false);

    // Simulate processing
    setTimeout(() => {
      setVideos(prev => prev.map(v => 
        v.id === newVideo.id ? { ...v, status: 'ready' } : v
      ));
    }, 3000);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(event.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !filterCategory || video.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedVideos = [...filteredVideos].sort((a, b) => {
    switch (sortBy) {
      case 'uploadDate':
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      case 'views':
        return b.views - a.views;
      case 'likes':
        return b.likes - a.likes;
      case 'duration':
        return b.duration - a.duration;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Video Platform</h1>
          <p className="text-muted-foreground">
            Professional video hosting, streaming, and analytics platform
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowAnalytics(!showAnalytics)}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Video
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{videos.length}</div>
            <p className="text-xs text-muted-foreground">
              {videos.filter(v => v.status === 'ready').length} ready
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {videos.reduce((sum, v) => sum + v.views, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all videos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${videos.reduce((sum, v) => sum + v.revenue, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {videos.length > 0 
                ? Math.round(videos.reduce((sum, v) => sum + v.analytics.engagementRate, 0) / videos.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across videos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2">
          {selectedVideo ? (
            <Card>
              <CardContent className="p-0">
                {/* Video Player */}
                <div className="relative bg-black rounded-t-lg">
                  <video
                    ref={videoRef}
                    className="w-full h-auto max-h-[500px]"
                    poster={selectedVideo.thumbnailUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                  >
                    <source src={selectedVideo.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Custom Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <input
                        type="range"
                        min="0"
                        max={selectedVideo.duration}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                    
                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={togglePlayPause}
                          className="text-white hover:bg-white/20"
                        >
                          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleMute}
                          className="text-white hover:bg-white/20"
                        >
                          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </Button>
                        
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={volume}
                          onChange={handleVolumeChange}
                          className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                        />
                        
                        <span className="text-white text-sm">
                          {formatDuration(currentTime)} / {formatDuration(selectedVideo.duration)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                        >
                          <Maximize2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Video Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{selectedVideo.title}</h2>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span>{selectedVideo.views.toLocaleString()} views</span>
                        <span>•</span>
                        <span>{new Date(selectedVideo.uploadDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{selectedVideo.category}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Heart className="mr-2 h-4 w-4" />
                        {selectedVideo.likes}
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <ThumbsDown className="mr-2 h-4 w-4" />
                        {selectedVideo.dislikes}
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{selectedVideo.description}</p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedVideo.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Video Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Quality:</span>
                      <div className="font-medium">{selectedVideo.quality}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Format:</span>
                      <div className="font-medium">{selectedVideo.format}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Size:</span>
                      <div className="font-medium">{formatFileSize(selectedVideo.size)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <div className="font-medium">{formatDuration(selectedVideo.duration)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-16">
                <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Select a Video</h3>
                <p className="text-muted-foreground">
                  Choose a video from the library to start watching
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Video Library */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Video Library</CardTitle>
              <CardDescription>
                Manage and organize your video content
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Search and Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search videos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uploadDate">Date</SelectItem>
                      <SelectItem value="views">Views</SelectItem>
                      <SelectItem value="likes">Likes</SelectItem>
                      <SelectItem value="duration">Duration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Video List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {sortedVideos.map(video => (
                  <div
                    key={video.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedVideo?.id === video.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="flex gap-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-20 h-12 object-cover rounded"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                          {formatDuration(video.duration)}
                        </div>
                        {video.status === 'processing' && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-2 mb-1">
                          {video.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {video.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{video.views.toLocaleString()} views</span>
                          <span>•</span>
                          <span>{video.likes} likes</span>
                          <span>•</span>
                          <span>{new Date(video.uploadDate).toLocaleDateString()}</span>
                        </div>
                        
                        {video.isMonetized && (
                          <div className="flex items-center gap-1 mt-1">
                            <DollarSign className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">
                              ${video.revenue.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Upload Video</h2>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop your video file here, or click to browse
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p>Supported formats: MP4, WebM, MOV, AVI</p>
                <p>Maximum file size: 10 GB</p>
                <p>Maximum resolution: 4K</p>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlatform;