import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { videoPlaylistApi } from '@/lib/video-advanced-api';
import { Plus, List, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function PlaylistManager() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: false
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const data = await videoPlaylistApi.getPlaylists();
      setPlaylists(data || []);
    } catch (error: any) {
      toast({ title: 'Error loading playlists', description: error.message, variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingPlaylist) {
        await videoPlaylistApi.updatePlaylist(editingPlaylist.id, formData);
        toast({ title: 'Playlist updated successfully' });
      } else {
        await videoPlaylistApi.createPlaylist(formData);
        toast({ title: 'Playlist created successfully' });
      }
      setIsOpen(false);
      setFormData({ title: '', description: '', is_public: false });
      setEditingPlaylist(null);
      loadPlaylists();
    } catch (error: any) {
      toast({ title: 'Error saving playlist', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this playlist?')) return;
    try {
      await videoPlaylistApi.deletePlaylist(id);
      toast({ title: 'Playlist deleted' });
      loadPlaylists();
    } catch (error: any) {
      toast({ title: 'Error deleting playlist', description: error.message, variant: 'destructive' });
    }
  };

  const openEdit = (playlist: any) => {
    setEditingPlaylist(playlist);
    setFormData({
      title: playlist.title,
      description: playlist.description || '',
      is_public: playlist.is_public
    });
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Video Playlists</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingPlaylist(null);
              setFormData({ title: '', description: '', is_public: false });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Playlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlaylist ? 'Edit' : 'Create'} Playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Playlist title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Playlist description"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
                <Label>Public playlist</Label>
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingPlaylist ? 'Update' : 'Create'} Playlist
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playlists.map((playlist) => (
          <Card key={playlist.id} className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <List className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{playlist.title}</h3>
                  <p className="text-sm text-muted-foreground">{playlist.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {playlist.video_order?.length || 0} videos
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => openEdit(playlist)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(playlist.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
