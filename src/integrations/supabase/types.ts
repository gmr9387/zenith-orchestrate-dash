export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          completed_at: string | null
          contact_id: string | null
          created_at: string
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          title?: string
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      api_endpoints: {
        Row: {
          created_at: string
          description: string | null
          headers: Json | null
          id: string
          is_active: boolean | null
          method: Database["public"]["Enums"]["endpoint_method"]
          name: string
          path: string
          rate_limit: number | null
          target_url: string
          timeout_ms: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          method: Database["public"]["Enums"]["endpoint_method"]
          name: string
          path: string
          rate_limit?: number | null
          target_url: string
          timeout_ms?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          method?: Database["public"]["Enums"]["endpoint_method"]
          name?: string
          path?: string
          rate_limit?: number | null
          target_url?: string
          timeout_ms?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          last_used_at: string | null
          name: string
          permissions: Json
          prefix: string
          rate_limit: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          last_used_at?: string | null
          name: string
          permissions?: Json
          prefix: string
          rate_limit?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json
          prefix?: string
          rate_limit?: number | null
          user_id?: string
        }
        Relationships: []
      }
      api_requests: {
        Row: {
          api_key_id: string | null
          created_at: string
          endpoint_id: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          method: string
          path: string
          request_size: number | null
          response_size: number | null
          response_time_ms: number
          status_code: number
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          endpoint_id?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method: string
          path: string
          request_size?: number | null
          response_size?: number | null
          response_time_ms: number
          status_code: number
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          endpoint_id?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method?: string
          path?: string
          request_size?: number | null
          response_size?: number | null
          response_time_ms?: number
          status_code?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_requests_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_requests_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "api_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      app_projects: {
        Row: {
          components: Json
          config: Json
          created_at: string
          description: string | null
          id: string
          is_published: boolean | null
          name: string
          published_url: string | null
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          components?: Json
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          name: string
          published_url?: string | null
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          components?: Json
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          name?: string
          published_url?: string | null
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          custom_fields: Json | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          tags: string[] | null
          type: Database["public"]["Enums"]["contact_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["contact_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["contact_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_crm_fields: {
        Row: {
          created_at: string | null
          entity_type: string
          field_name: string
          field_options: Json | null
          field_type: string
          id: string
          is_required: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_type: string
          field_name: string
          field_options?: Json | null
          field_type: string
          id?: string
          is_required?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_type?: string
          field_name?: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_required?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          actual_close_date: string | null
          amount: number | null
          contact_id: string | null
          created_at: string
          custom_fields: Json | null
          description: string | null
          expected_close_date: string | null
          id: string
          probability: number | null
          stage: Database["public"]["Enums"]["deal_stage"]
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_close_date?: string | null
          amount?: number | null
          contact_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          probability?: number | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_close_date?: string | null
          amount?: number | null
          contact_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          probability?: number | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          content: string
          created_at: string | null
          id: string
          name: string
          recipients: Json
          scheduled_at: string | null
          sent_at: string | null
          stats: Json | null
          status: string
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          name: string
          recipients: Json
          scheduled_at?: string | null
          sent_at?: string | null
          stats?: Json | null
          status?: string
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          name?: string
          recipients?: Json
          scheduled_at?: string | null
          sent_at?: string | null
          stats?: Json | null
          status?: string
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lead_scores: {
        Row: {
          contact_id: string
          created_at: string | null
          factors: Json | null
          id: string
          last_calculated_at: string | null
          score: number
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          factors?: Json | null
          id?: string
          last_calculated_at?: string | null
          score?: number
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          factors?: Json | null
          id?: string
          last_calculated_at?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_scores_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          created_at: string | null
          description: string | null
          ended_at: string | null
          id: string
          scheduled_at: string | null
          started_at: string | null
          status: string
          stream_key: string | null
          title: string
          user_id: string
          viewer_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          stream_key?: string | null
          title: string
          user_id: string
          viewer_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          stream_key?: string | null
          title?: string
          user_id?: string
          viewer_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          job_title: string | null
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id: string
          job_title?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sales_forecasts: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          data: Json | null
          id: string
          period: string
          period_end: string
          period_start: string
          predicted_revenue: number | null
          user_id: string
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          data?: Json | null
          id?: string
          period: string
          period_end: string
          period_start: string
          predicted_revenue?: number | null
          user_id: string
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          data?: Json | null
          id?: string
          period?: string
          period_end?: string
          period_start?: string
          predicted_revenue?: number | null
          user_id?: string
        }
        Relationships: []
      }
      tutorial_analytics: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          session_id: string | null
          step_index: number | null
          tutorial_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          step_index?: number | null
          tutorial_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          step_index?: number | null
          tutorial_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_analytics_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutorials"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_branding: {
        Row: {
          created_at: string | null
          custom_css: string | null
          font_family: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_css?: string | null
          font_family?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_css?: string | null
          font_family?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tutorial_collaborators: {
        Row: {
          created_at: string | null
          id: string
          role: string
          tutorial_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          tutorial_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          tutorial_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_collaborators_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutorials"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_quizzes: {
        Row: {
          created_at: string | null
          id: string
          passing_score: number | null
          questions: Json
          step_index: number
          tutorial_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          passing_score?: number | null
          questions: Json
          step_index: number
          tutorial_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          passing_score?: number | null
          questions?: Json
          step_index?: number
          tutorial_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_quizzes_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutorials"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_templates: {
        Row: {
          category: string
          content: Json
          created_at: string | null
          description: string | null
          downloads: number | null
          id: string
          is_public: boolean | null
          rating: number | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          content?: Json
          created_at?: string | null
          description?: string | null
          downloads?: number | null
          id?: string
          is_public?: boolean | null
          rating?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          content?: Json
          created_at?: string | null
          description?: string | null
          downloads?: number | null
          id?: string
          is_public?: boolean | null
          rating?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tutorial_versions: {
        Row: {
          changes_description: string | null
          content: Json
          created_at: string | null
          created_by: string
          id: string
          tutorial_id: string
          version_number: number
        }
        Insert: {
          changes_description?: string | null
          content: Json
          created_at?: string | null
          created_by: string
          id?: string
          tutorial_id: string
          version_number: number
        }
        Update: {
          changes_description?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string
          id?: string
          tutorial_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_versions_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutorials"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorials: {
        Row: {
          content: Json | null
          created_at: string
          description: string | null
          id: string
          likes: number | null
          published_at: string | null
          status: Database["public"]["Enums"]["tutorial_status"]
          steps: Json | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          views: number | null
        }
        Insert: {
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          likes?: number | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["tutorial_status"]
          steps?: Json | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          views?: number | null
        }
        Update: {
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          likes?: number | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["tutorial_status"]
          steps?: Json | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          views?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_captions: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          is_auto_generated: boolean | null
          language: string
          video_id: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          is_auto_generated?: boolean | null
          language?: string
          video_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          is_auto_generated?: boolean | null
          language?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_captions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_chapters: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: number | null
          id: string
          start_time: number
          thumbnail_url: string | null
          title: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time?: number | null
          id?: string
          start_time: number
          thumbnail_url?: string | null
          title: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: number | null
          id?: string
          start_time?: number
          thumbnail_url?: string | null
          title?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_chapters_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_interactive_elements: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          position: Json | null
          timestamp: number
          type: string
          video_id: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          position?: Json | null
          timestamp: number
          type: string
          video_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          position?: Json | null
          timestamp?: number
          type?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_interactive_elements_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_playlists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
          video_order: string[] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          video_order?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          video_order?: string[] | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string
          description: string | null
          duration: number | null
          file_size: number
          filename: string
          hls_url: string | null
          id: string
          original_filename: string
          quality: Database["public"]["Enums"]["video_quality"]
          status: Database["public"]["Enums"]["video_status"]
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          views: number | null
          watch_time: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: number | null
          file_size: number
          filename: string
          hls_url?: string | null
          id?: string
          original_filename: string
          quality?: Database["public"]["Enums"]["video_quality"]
          status?: Database["public"]["Enums"]["video_status"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          views?: number | null
          watch_time?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: number | null
          file_size?: number
          filename?: string
          hls_url?: string | null
          id?: string
          original_filename?: string
          quality?: Database["public"]["Enums"]["video_quality"]
          status?: Database["public"]["Enums"]["video_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          views?: number | null
          watch_time?: number | null
        }
        Relationships: []
      }
      workflow_connections: {
        Row: {
          condition: Json | null
          created_at: string | null
          id: string
          source_node_id: string
          target_node_id: string
          workflow_id: string
        }
        Insert: {
          condition?: Json | null
          created_at?: string | null
          id?: string
          source_node_id: string
          target_node_id: string
          workflow_id: string
        }
        Update: {
          condition?: Json | null
          created_at?: string | null
          id?: string
          source_node_id?: string
          target_node_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_connections_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "workflow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_connections_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "workflow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_connections_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          result_data: Json | null
          started_at: string
          status: Database["public"]["Enums"]["workflow_status"]
          trigger_data: Json | null
          user_id: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          result_data?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["workflow_status"]
          trigger_data?: Json | null
          user_id: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          result_data?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["workflow_status"]
          trigger_data?: Json | null
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_nodes: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          position: Json
          type: string
          workflow_id: string
        }
        Insert: {
          config: Json
          created_at?: string | null
          id?: string
          position: Json
          type: string
          workflow_id: string
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          position?: Json
          type?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_nodes_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_schedules: {
        Row: {
          created_at: string | null
          cron_expression: string
          id: string
          is_active: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          timezone: string | null
          workflow_id: string
        }
        Insert: {
          created_at?: string | null
          cron_expression: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          timezone?: string | null
          workflow_id: string
        }
        Update: {
          created_at?: string | null
          cron_expression?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          timezone?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_schedules_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          category: string | null
          config: Json
          created_at: string | null
          description: string | null
          downloads: number | null
          id: string
          is_public: boolean | null
          rating: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          config: Json
          created_at?: string | null
          description?: string | null
          downloads?: number | null
          id?: string
          is_public?: boolean | null
          rating?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          config?: Json
          created_at?: string | null
          description?: string | null
          downloads?: number | null
          id?: string
          is_public?: boolean | null
          rating?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      workflow_webhooks: {
        Row: {
          created_at: string | null
          headers: Json | null
          id: string
          is_active: boolean | null
          method: string
          secret: string | null
          url: string
          workflow_id: string
        }
        Insert: {
          created_at?: string | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          method?: string
          secret?: string | null
          url: string
          workflow_id: string
        }
        Update: {
          created_at?: string | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          method?: string
          secret?: string | null
          url?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_webhooks_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          last_run_at: string | null
          name: string
          next_run_at: string | null
          status: Database["public"]["Enums"]["workflow_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          config: Json
          created_at?: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          status?: Database["public"]["Enums"]["workflow_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          status?: Database["public"]["Enums"]["workflow_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      activity_type: "call" | "email" | "meeting" | "note" | "task"
      app_role: "admin" | "moderator" | "user"
      contact_type: "individual" | "company"
      deal_stage:
        | "lead"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
      endpoint_method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
      tutorial_status: "draft" | "published" | "archived"
      video_quality: "sd" | "hd" | "4k"
      video_status: "uploading" | "processing" | "ready" | "error"
      workflow_status: "idle" | "running" | "completed" | "failed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: ["call", "email", "meeting", "note", "task"],
      app_role: ["admin", "moderator", "user"],
      contact_type: ["individual", "company"],
      deal_stage: [
        "lead",
        "qualified",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      endpoint_method: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      tutorial_status: ["draft", "published", "archived"],
      video_quality: ["sd", "hd", "4k"],
      video_status: ["uploading", "processing", "ready", "error"],
      workflow_status: ["idle", "running", "completed", "failed", "cancelled"],
    },
  },
} as const
