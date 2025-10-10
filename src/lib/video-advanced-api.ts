import { supabase } from "@/integrations/supabase/client";

// Video Chapters
export interface VideoChapter {
  id: string;
  video_id: string;
  title: string;
  start_time: number;
  end_time?: number;
  description?: string;
  thumbnail_url?: string;
  created_at: string;
}

export const videoChapterApi = {
  getChapters: async (videoId: string) => {
    const { data, error } = await supabase
      .from('video_chapters')
      .select('*')
      .eq('video_id', videoId)
      .order('start_time');
    if (error) throw error;
    return data;
  },

  createChapter: async (chapter: Omit<VideoChapter, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('video_chapters')
      .insert(chapter)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateChapter: async (id: string, updates: Partial<VideoChapter>) => {
    const { data, error } = await supabase
      .from('video_chapters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteChapter: async (id: string) => {
    const { error } = await supabase
      .from('video_chapters')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Video Playlists
export interface VideoPlaylist {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  is_public: boolean;
  video_order: string[];
  created_at: string;
  updated_at: string;
}

export const videoPlaylistApi = {
  getPlaylists: async () => {
    const { data, error } = await supabase
      .from('video_playlists')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  getPublicPlaylists: async () => {
    const { data, error } = await supabase
      .from('video_playlists')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  createPlaylist: async (playlist: Partial<VideoPlaylist>) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('video_playlists')
      .insert({ ...playlist, user_id: user?.id, video_order: playlist.video_order || [] })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updatePlaylist: async (id: string, updates: Partial<VideoPlaylist>) => {
    const { data, error } = await supabase
      .from('video_playlists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deletePlaylist: async (id: string) => {
    const { error } = await supabase
      .from('video_playlists')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Video Captions
export const videoCaptionApi = {
  getCaptions: async (videoId: string) => {
    const { data, error } = await supabase
      .from('video_captions')
      .select('*')
      .eq('video_id', videoId);
    if (error) throw error;
    return data;
  },

  createCaption: async (videoId: string, language: string, content: any) => {
    const { data, error } = await supabase
      .from('video_captions')
      .insert({ video_id: videoId, language, content })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  generateCaptions: async (videoId: string) => {
    // Call edge function to generate captions using AI
    const { data, error } = await supabase.functions.invoke('generate-captions', {
      body: { videoId }
    });
    if (error) throw error;
    return data;
  }
};

// Live Streams
export interface LiveStream {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'scheduled' | 'live' | 'ended';
  stream_key?: string;
  viewer_count: number;
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
}

export const liveStreamApi = {
  getStreams: async () => {
    const { data, error } = await supabase
      .from('live_streams')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  createStream: async (stream: Partial<LiveStream>) => {
    const { data: { user } } = await supabase.auth.getUser();
    const streamKey = crypto.randomUUID();
    const { data, error } = await supabase
      .from('live_streams')
      .insert({
        ...stream,
        user_id: user?.id,
        stream_key: streamKey,
        status: 'scheduled'
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  startStream: async (id: string) => {
    const { data, error } = await supabase
      .from('live_streams')
      .update({ status: 'live', started_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  endStream: async (id: string) => {
    const { data, error } = await supabase
      .from('live_streams')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Video Interactive Elements
export const videoInteractiveApi = {
  getElements: async (videoId: string) => {
    const { data, error } = await supabase
      .from('video_interactive_elements')
      .select('*')
      .eq('video_id', videoId)
      .order('timestamp');
    if (error) throw error;
    return data;
  },

  createElement: async (element: any) => {
    const { data, error } = await supabase
      .from('video_interactive_elements')
      .insert(element)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateElement: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('video_interactive_elements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteElement: async (id: string) => {
    const { error } = await supabase
      .from('video_interactive_elements')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
