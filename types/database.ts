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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          book_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          visitor_country: string | null
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          visitor_country?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          visitor_country?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      books: {
        Row: {
          author: string | null
          bookmark_count: number
          cover_dominant_color: string | null
          cover_sha1: string | null
          cover_source: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          intent_id: string | null
          isbn: string | null
          language: string | null
          published_year: number | null
          publisher: string | null
          section: string
          source: string | null
          source_id: string | null
          spine_image_url: string | null
          spine_storage_path: string | null
          title: string
          updated_at: string | null
          user_id: string
          was_cover_fallback: boolean
        }
        Insert: {
          author?: string | null
          bookmark_count?: number
          cover_dominant_color?: string | null
          cover_sha1?: string | null
          cover_source?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          intent_id?: string | null
          isbn?: string | null
          language?: string | null
          published_year?: number | null
          publisher?: string | null
          section?: string
          source?: string | null
          source_id?: string | null
          spine_image_url?: string | null
          spine_storage_path?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          was_cover_fallback?: boolean
        }
        Update: {
          author?: string | null
          bookmark_count?: number
          cover_dominant_color?: string | null
          cover_sha1?: string | null
          cover_source?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          intent_id?: string | null
          isbn?: string | null
          language?: string | null
          published_year?: number | null
          publisher?: string | null
          section?: string
          source?: string | null
          source_id?: string | null
          spine_image_url?: string | null
          spine_storage_path?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          was_cover_fallback?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "books_intent_id_fkey"
            columns: ["intent_id"]
            isOneToOne: false
            referencedRelation: "intents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      card_exports: {
        Row: {
          backdrop_country: string | null
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          image_path: string | null
          image_sha1: string | null
          intent_id: string | null
          owner_id: string
          selected_book_ids: string[]
          snapshot_data: Json
        }
        Insert: {
          backdrop_country?: string | null
          created_at?: string
          deleted_at?: string | null
          format: string
          id: string
          image_path?: string | null
          image_sha1?: string | null
          intent_id?: string | null
          owner_id: string
          selected_book_ids: string[]
          snapshot_data: Json
        }
        Update: {
          backdrop_country?: string | null
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          image_path?: string | null
          image_sha1?: string | null
          intent_id?: string | null
          owner_id?: string
          selected_book_ids?: string[]
          snapshot_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "card_exports_intent_id_fkey"
            columns: ["intent_id"]
            isOneToOne: false
            referencedRelation: "intents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_exports_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      country_capitals: {
        Row: {
          capital_name_en: string
          country_name_en: string
          created_at: string
          iso_alpha2: string
          latitude: number
          longitude: number
          source: string
          source_updated_at: string | null
        }
        Insert: {
          capital_name_en: string
          country_name_en: string
          created_at?: string
          iso_alpha2: string
          latitude: number
          longitude: number
          source?: string
          source_updated_at?: string | null
        }
        Update: {
          capital_name_en?: string
          country_name_en?: string
          created_at?: string
          iso_alpha2?: string
          latitude?: number
          longitude?: number
          source?: string
          source_updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          actor_country: string | null
          actor_id: string | null
          created_at: string
          id: number
          idempotency_key: string | null
          intent_id: string | null
          kind: string
          params: Json | null
          result: Json | null
          target_id: string | null
          target_kind: string | null
          trigger_source: string | null
        }
        Insert: {
          actor_country?: string | null
          actor_id?: string | null
          created_at?: string
          id?: number
          idempotency_key?: string | null
          intent_id?: string | null
          kind: string
          params?: Json | null
          result?: Json | null
          target_id?: string | null
          target_kind?: string | null
          trigger_source?: string | null
        }
        Update: {
          actor_country?: string | null
          actor_id?: string | null
          created_at?: string
          id?: number
          idempotency_key?: string | null
          intent_id?: string | null
          kind?: string
          params?: Json | null
          result?: Json | null
          target_id?: string | null
          target_kind?: string | null
          trigger_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_intent_id_fkey"
            columns: ["intent_id"]
            isOneToOne: false
            referencedRelation: "intents"
            referencedColumns: ["id"]
          },
        ]
      }
      intents: {
        Row: {
          actor_id: string
          completed_at: string | null
          error: Json | null
          id: string
          idempotency_key: string
          kind: string
          next_retry_at: string | null
          params: Json
          progress: Json
          result: Json | null
          retry_count: number
          started_at: string
          state: string
          trigger_source: string | null
          updated_at: string
        }
        Insert: {
          actor_id: string
          completed_at?: string | null
          error?: Json | null
          id?: string
          idempotency_key: string
          kind: string
          next_retry_at?: string | null
          params: Json
          progress?: Json
          result?: Json | null
          retry_count?: number
          started_at?: string
          state?: string
          trigger_source?: string | null
          updated_at?: string
        }
        Update: {
          actor_id?: string
          completed_at?: string | null
          error?: Json | null
          id?: string
          idempotency_key?: string
          kind?: string
          next_retry_at?: string | null
          params?: Json
          progress?: Json
          result?: Json | null
          retry_count?: number
          started_at?: string
          state?: string
          trigger_source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string | null
          display_name: string | null
          entry_pattern_type: string
          handle: string | null
          handle_changed_at: string | null
          language_preference: string | null
          launch_grace_until: string | null
          orphan_marked_at: string | null
          referral_code: string
          theme_preference: string | null
          tier: string
          tier_expires_at: string | null
          tier_source: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          entry_pattern_type?: string
          handle?: string | null
          handle_changed_at?: string | null
          language_preference?: string | null
          launch_grace_until?: string | null
          orphan_marked_at?: string | null
          referral_code: string
          theme_preference?: string | null
          tier?: string
          tier_expires_at?: string | null
          tier_source?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          entry_pattern_type?: string
          handle?: string | null
          handle_changed_at?: string | null
          language_preference?: string | null
          launch_grace_until?: string | null
          orphan_marked_at?: string | null
          referral_code?: string
          theme_preference?: string | null
          tier?: string
          tier_expires_at?: string | null
          tier_source?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shelf_affinities: {
        Row: {
          created_at: string
          id: string
          owner_user_id: string
          updated_at: string
          visitor_country: string | null
          visitor_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_user_id: string
          updated_at?: string
          visitor_country?: string | null
          visitor_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_user_id?: string
          updated_at?: string
          visitor_country?: string | null
          visitor_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shelf_affinities_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "shelf_affinities_visitor_user_id_fkey"
            columns: ["visitor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tier_limits: {
        Row: {
          limit_value: number
          resource: string
          tier: string
          updated_at: string
        }
        Insert: {
          limit_value: number
          resource: string
          tier: string
          updated_at?: string
        }
        Update: {
          limit_value?: number
          resource?: string
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_card_image_sha1s: {
        Row: {
          image_sha1: string | null
        }
        Relationships: []
      }
      events_for_owner: {
        Row: {
          actor_country: string | null
          actor_display_name: string | null
          actor_handle: string | null
          created_at: string | null
          id: number | null
          kind: string | null
          result: Json | null
          target_id: string | null
          target_kind: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      gc_anonymous_users: { Args: never; Returns: Json }
      gc_deleted_books: { Args: never; Returns: Json }
      gc_orphan_book_covers: { Args: never; Returns: Json }
      gc_orphan_card_images: { Args: never; Returns: Json }
      gc_run_all: { Args: never; Returns: Json }
      gc_zombie_intents: { Args: never; Returns: Json }
      get_shelf_signal: { Args: { target_user_id: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
