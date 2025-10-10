import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { videoChapterApi } from '@/lib/video-advanced-api';
import { Plus, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ChapterManager({ videoId }: { videoId: string }) {
  const [chapters, setChapters] = useState<any[]>([]);
  const [newChapter, setNewChapter] = useState({
    title: '',
    start_time: 0,
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadChapters();
  }, [videoId]);

  const loadChapters = async () => {
    try {
      const data = await videoChapterApi.getChapters(videoId);
      setChapters(data || []);
    } catch (error: any) {
      toast({ title: 'Error loading chapters', description: error.message, variant: 'destructive' });
    }
  };

  const handleAdd = async () => {
    if (!newChapter.title || newChapter.start_time < 0) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    try {
      await videoChapterApi.createChapter({ ...newChapter, video_id: videoId });
      toast({ title: 'Chapter added' });
      setNewChapter({ title: '', start_time: 0, description: '' });
      loadChapters();
    } catch (error: any) {
      toast({ title: 'Error adding chapter', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await videoChapterApi.deleteChapter(id);
      toast({ title: 'Chapter deleted' });
      loadChapters();
    } catch (error: any) {
      toast({ title: 'Error deleting chapter', description: error.message, variant: 'destructive' });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Video Chapters</h3>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Chapter title"
            value={newChapter.title}
            onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Start time (seconds)"
            value={newChapter.start_time}
            onChange={(e) => setNewChapter({ ...newChapter, start_time: parseInt(e.target.value) || 0 })}
          />
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Chapter
          </Button>
        </div>
        <Textarea
          placeholder="Chapter description (optional)"
          value={newChapter.description}
          onChange={(e) => setNewChapter({ ...newChapter, description: e.target.value })}
          rows={2}
        />
      </Card>

      <div className="space-y-3">
        {chapters.map((chapter) => (
          <Card key={chapter.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{formatTime(chapter.start_time)}</span>
                  <span className="font-semibold">{chapter.title}</span>
                </div>
                {chapter.description && (
                  <p className="text-sm text-muted-foreground mt-2">{chapter.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(chapter.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
