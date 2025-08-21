import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Upload, Video as VideoIcon, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { hasBackend, apiGet, apiPost } from '@/lib/api';

interface VideoAsset {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  status: 'ready' | 'uploading' | 'processing' | 'error';
  uploadDate: string;
  views: number;
}

const VideoPlatform: React.FC = () => {
  const [videos, setVideos] = useState<VideoAsset[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selected, setSelected] = useState<VideoAsset | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        if (hasBackend()) {
          const resp = await apiGet(`/videos`);
          const data = (resp as any).data as any[];
          if (Array.isArray(data)) {
            setVideos(
              data.map((v) => ({
                id: v.id,
                title: v.title,
                thumbnailUrl: v.thumbnailUrl || 'https://via.placeholder.com/320x180/6B7280/FFFFFF?text=Video',
                videoUrl: v.url || '',
                status: v.status || 'ready',
                uploadDate: new Date(v.createdAt).toISOString(),
                views: v.views || 0,
              }))
            );
            return;
          }
        }
      } catch (e) { if (e) {} }
      // Seed with one demo video if backend not available
      setVideos([
        {
          id: 'demo',
          title: 'Demo Video',
          thumbnailUrl: 'https://via.placeholder.com/320x180/3B82F6/FFFFFF?text=Demo+Video',
          videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          status: 'ready',
          uploadDate: new Date().toISOString(),
          views: 0,
        },
      ]);
    })();
  }, []);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const temp: VideoAsset = {
      id: `video_${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      thumbnailUrl: 'https://via.placeholder.com/320x180/6B7280/FFFFFF?text=Processing',
      videoUrl: URL.createObjectURL(file),
      status: 'uploading',
      uploadDate: new Date().toISOString(),
      views: 0,
    };
    setVideos((prev) => [temp, ...prev]);
    setShowUploadModal(false);
    try {
      if (hasBackend()) {
        await apiPost(`/videos`, { title: temp.title, url: temp.videoUrl, thumbnailUrl: temp.thumbnailUrl });
      }
    } catch (e) { if (e) {} }
    setTimeout(() => {
      setVideos((prev) => prev.map((v) => (v.id === temp.id ? { ...v, status: 'ready' } : v)));
    }, 1200);
  };

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (isPlaying) el.pause();
    else el.play();
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Video Platform</h1>
          <p className="text-muted-foreground">Professional video hosting and streaming with analytics-ready design</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="mr-2 h-4 w-4" /> Upload Video
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Player</CardTitle>
              <CardDescription>{selected ? selected.title : 'Select a video from the library'}</CardDescription>
            </CardHeader>
            <CardContent>
              {selected ? (
                <div className="space-y-3">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-auto max-h-[500px]"
                      poster={selected.thumbnailUrl}
                      onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                      onPause={() => setIsPlaying(false)}
                      onPlay={() => setIsPlaying(true)}
                    >
                      <source src={selected.videoUrl} type="video/mp4" />
                    </video>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="text-white" onClick={togglePlay}>
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-white" onClick={toggleMute}>
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </Button>
                      <div className="text-white text-xs ml-auto">{Math.floor(currentTime)}s</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{selected.status}</Badge>
                      <span>{new Date(selected.uploadDate).toLocaleString()}</span>
                    </div>
                    <div>{selected.views.toLocaleString()} views</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <VideoIcon className="h-16 w-16 mx-auto mb-4" />
                  Select a video from the library
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Library</CardTitle>
              <CardDescription>Manage and select your videos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {videos.map((v) => (
                <div key={v.id} className={`p-3 border rounded-lg cursor-pointer ${selected?.id === v.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onClick={() => setSelected(v)}>
                  <div className="flex gap-3">
                    <img src={v.thumbnailUrl} alt={v.title} className="w-20 h-12 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{v.title}</div>
                      <div className="text-xs text-muted-foreground">{new Date(v.uploadDate).toLocaleDateString()} • {v.views.toLocaleString()} views</div>
                    </div>
                    <Badge variant="secondary" className="text-xs self-start">{v.status}</Badge>
                  </div>
                </div>
              ))}
              {videos.length === 0 && <div className="text-sm text-muted-foreground">No videos yet. Upload one to get started.</div>}
            </CardContent>
          </Card>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Upload Video</h2>
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">Drag-and-drop or choose a file</p>
              <Button variant="outline" onClick={handleUploadClick}>Choose File</Button>
              <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
            </div>
            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlatform;