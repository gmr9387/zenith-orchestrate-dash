import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { hasBackend, apiGet, apiPost } from '@/lib/api';

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

  // Load from backend if available; otherwise seed with mock data
  useEffect(() => {
    (async () => {
      try {
        if (hasBackend()) {
          const resp = await apiGet(`/videos`);
          const data = (resp as any).data as any[];
          if (Array.isArray(data)) {
            setVideos(data.map((v: any) => ({
              id: v.id,
              title: v.title,
              description: '',
              duration: 0,
              thumbnailUrl: v.thumbnailUrl || 'https://via.placeholder.com/320x180/6B7280/FFFFFF?text=Video',
              videoUrl: v.url || '',
              quality: '1080p',
              format: 'MP4',
              size: 0,
              status: 'ready',
              uploadDate: new Date(v.createdAt).toISOString(),
              views: v.views || 0,
              likes: 0,
              dislikes: 0,
              comments: 0,
              shares: 0,
              category: 'Technology',
              tags: [],
              isPublic: true,
              isMonetized: false,
              revenue: 0,
              analytics: { watchTime: 0, engagementRate: 0, retentionRate: 0, deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0, tv: 0 }, geographicData: [] }
            })));
            return;
          }
        }
      } catch {}
      const mockVideos: VideoAsset[] = [
        {
          id: '1',
          title: 'Getting Started with React Development',
          description: 'Learn the fundamentals of React development with this comprehensive tutorial.',
          duration: 1847,
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
          analytics: { watchTime: 1250000, engagementRate: 87.5, retentionRate: 78.2, deviceBreakdown: { desktop: 45, mobile: 38, tablet: 12, tv: 5 }, geographicData: [] }
        },
      ];
      setVideos(mockVideos);
    })();
  }, []);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB >= 1024) return `${(sizeInMB / 1024).toFixed(1)} GB`;
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      analytics: { watchTime: 0, engagementRate: 0, retentionRate: 0, deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0, tv: 0 }, geographicData: [] }
    };
    setVideos(prev => [newVideo, ...prev]);
    setShowUploadModal(false);
    try {
      if (hasBackend()) {
        await apiPost(`/videos`, { title: newVideo.title, url: newVideo.videoUrl, thumbnailUrl: newVideo.thumbnailUrl });
      }
    } catch {}
    setTimeout(() => {
      setVideos(prev => prev.map(v => v.id === newVideo.id ? { ...v, status: 'ready' } : v));
    }, 1200);
  };

  // ... rest of file remains unchanged ...
