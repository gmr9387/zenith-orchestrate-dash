import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/auth';
import { 
  Play, 
  Download, 
  Share2, 
  Eye, 
  Clock, 
  FileVideo,
  Settings,
  MoreHorizontal
} from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description: string;
  status: string;
  processingProgress: number;
  processedPaths: any;
  thumbnailPaths: string[];
  metadata: any;
  views: number;
  createdAt: string;
  signedUrls?: any;
}

const VideoDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState<string>('720p');
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadVideo();
    }
  }, [id]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/videos/${id}`);
      setVideo(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load video",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getVideoUrl = () => {
    if (!video) return '';
    
    // Use signed URL if available, otherwise use direct path
    if (video.signedUrls && video.signedUrls[selectedQuality]) {
      return video.signedUrls[selectedQuality];
    }
    
    if (video.processedPaths && video.processedPaths[selectedQuality]) {
      return `/processed-videos/${video.processedPaths[selectedQuality]}`;
    }
    
    return '';
  };

  const getThumbnailUrl = () => {
    if (!video || !video.thumbnailPaths || video.thumbnailPaths.length === 0) {
      return '/placeholder-thumbnail.jpg';
    }
    
    return `/thumbnails/${video.thumbnailPaths[0]}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Video not found</h2>
        <p className="text-gray-600">The video you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{video.title}</h1>
          <p className="text-gray-600 mt-2">{video.description}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              {video.status === 'completed' ? (
                <div className="relative">
                  <video
                    className="w-full h-96 object-cover rounded-t-lg"
                    controls
                    poster={getThumbnailUrl()}
                    src={getVideoUrl()}
                  >
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Quality Selector */}
                  {video.processedPaths && Object.keys(video.processedPaths).length > 1 && (
                    <div className="absolute top-4 right-4 bg-black/70 rounded-lg p-2">
                      <select
                        value={selectedQuality}
                        onChange={(e) => setSelectedQuality(e.target.value)}
                        className="bg-transparent text-white text-sm border-none outline-none"
                      >
                        {Object.keys(video.processedPaths).map((quality) => (
                          <option key={quality} value={quality}>
                            {quality}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-96 bg-gray-100 rounded-t-lg flex items-center justify-center">
                  <div className="text-center">
                    <FileVideo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {video.status === 'processing' ? 'Processing Video...' : 'Video Not Ready'}
                    </h3>
                    {video.status === 'processing' && (
                      <div className="w-64 mx-auto">
                        <Progress value={video.processingProgress} className="mb-2" />
                        <p className="text-sm text-gray-600">{video.processingProgress}% complete</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Video Info */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Video Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Views</span>
                <span className="font-semibold">{video.views}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge variant={video.status === 'completed' ? 'default' : 'secondary'}>
                  {video.status}
                </Badge>
              </div>
              {video.metadata && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="font-semibold">
                      {Math.floor(video.metadata.duration / 60)}:{(video.metadata.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Size</span>
                    <span className="font-semibold">
                      {(video.metadata.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Created</span>
                <span className="font-semibold">
                  {new Date(video.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Available Qualities */}
          {video.processedPaths && (
            <Card>
              <CardHeader>
                <CardTitle>Available Qualities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.keys(video.processedPaths).map((quality) => (
                    <div
                      key={quality}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                        selectedQuality === quality ? 'bg-purple-100' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedQuality(quality)}
                    >
                      <span className="font-medium">{quality}</span>
                      <Badge variant="outline">MP4</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* HLS Streaming */}
          {video.processedPaths?.hls && (
            <Card>
              <CardHeader>
                <CardTitle>Adaptive Streaming</CardTitle>
                <CardDescription>HLS manifest available</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={async () => {
                    try {
                      const response = await apiClient.get(`/videos/${id}/hls`);
                      const manifestUrl = response.data.manifestUrl;
                      // Open HLS player or copy URL
                      navigator.clipboard.writeText(`${window.location.origin}${manifestUrl}`);
                      toast({
                        title: "HLS URL copied",
                        description: "Manifest URL copied to clipboard",
                      });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to get HLS manifest",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Get HLS Manifest
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;