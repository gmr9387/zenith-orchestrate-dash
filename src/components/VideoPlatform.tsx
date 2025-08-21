import React, { useState, useRef, useCallback, Suspense } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Skeleton } from './ui/skeleton';
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
  List,
  Folder,
  X
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

const VideoPlatformContent: React.FC = () => {
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
  const [isLoading, setIsLoading] = useState(true);
  
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
            { country: 'United Kingdom', views: 1200, percentage: 13.5 },
            { country: 'Canada', views: 900, percentage: 10.1 },
            { country: 'Australia', views: 800, percentage: 9.0 },
          ]
        }
      }
    ];

    // Simulate loading
    setTimeout(() => {
      setVideos(mockVideos);
      setIsLoading(false);
    }, 1000);
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

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleVideoSelect = (video: VideoAsset) => {
    setSelectedVideo(video);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlay = () => {
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setVolume(vol);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle file upload logic here
      console.log('File selected:', file.name);
    }
  };

  const renderVideoCard = (video: VideoAsset) => (
    <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <Button
            variant="secondary"
            size="sm"
            className="opacity-0 hover:opacity-100 transition-opacity"
            onClick={() => handleVideoSelect(video)}
          >
            <Play className="h-4 w-4 mr-1" />
            Play
          </Button>
        </div>
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {formatDuration(video.duration)}
        </div>
        <div className="absolute top-2 left-2">
          <Badge variant={video.status === 'ready' ? 'default' : 'secondary'}>
            {video.status}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-2 line-clamp-2">{video.title}</h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{video.description}</p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span>{video.views.toLocaleString()} views</span>
          <span>{video.uploadDate}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{video.category}</Badge>
          <Badge variant="outline" className="text-xs">{video.quality}</Badge>
        </div>
      </CardContent>
    </Card>
  );

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="w-full h-48" />
          <CardContent className="p-4">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-2/3 mb-3" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Video Platform</h1>
          <p className="text-muted-foreground">
            Professional video hosting and streaming platform with enterprise features
          </p>
        </div>
        
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Video
        </Button>
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
              +15 from last month
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
              +12% from last month
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
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collections.length}</div>
            <p className="text-xs text-muted-foreground">
              +3 from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="education">Education</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uploadDate">Upload Date</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Video Grid */}
      <div>
        {isLoading ? (
          renderSkeletons()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map(renderVideoCard)}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-4xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{selectedVideo.title}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedVideo(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="relative mb-4">
              <video
                ref={videoRef}
                src={selectedVideo.videoUrl}
                className="w-full rounded-lg"
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
              />
              
              {/* Custom Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={togglePlay}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  <input
                    type="range"
                    min="0"
                    max={selectedVideo.duration}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1"
                  />
                  
                  <span className="text-white text-sm">
                    {formatDuration(currentTime)} / {formatDuration(selectedVideo.duration)}
                  </span>
                  
                  <Button variant="ghost" size="sm" onClick={toggleMute}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button>
                <Heart className="mr-2 h-4 w-4" />
                Like
              </Button>
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VideoPlatform: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    }>
      <VideoPlatformContent />
    </Suspense>
  );
};

export default VideoPlatform;