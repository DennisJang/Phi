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
      book_pages: {
        Row: {
          book_id: string
          content: Json | null
          created_at: string | null
          edit_mode: string | null
          id: string
          template_preset: string | null
          theme_override: string | null
          updated_at: string | null
        }
        Insert: {
          book_id: string
          content?: Json | null
          created_at?: string | null
          edit_mode?: string | null
          id?: string
          template_preset?: string | null
          theme_override?: string | null
          updated_at?: string | null
        }
        Update: {
          book_id?: string
          content?: Json | null
          created_at?: string | null
          edit_mode?: string | null
          id?: string
          template_preset?: string | null
          theme_override?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_pages_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: true
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          added_location: Json | null
          added_timezone: string | null
          added_to_shelf_at: string
          added_weather: Json | null
          author: string | null
          completed_at: string | null
          cover_dominant_color: string | null
          cover_image_url: string | null
          cover_source: string | null
          cover_storage_path: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          is_featured: boolean
          is_section_start: boolean | null
          isbn: string | null
          language: string | null
          memo: string | null
          metadata: Json | null
          one_liner: string | null
          published_year: number | null
          publisher: string | null
          reading_status: string
          section_label: string | null
          shelf_id: string
          shelf_order: number | null
          source: string | null
          spine_image_url: string | null
          spine_storage_path: string | null
          started_reading_at: string | null
          title: string
          total_pages: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          added_location?: Json | null
          added_timezone?: string | null
          added_to_shelf_at?: string
          added_weather?: Json | null
          author?: string | null
          completed_at?: string | null
          cover_dominant_color?: string | null
          cover_image_url?: string | null
          cover_source?: string | null
          cover_storage_path?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_featured?: boolean
          is_section_start?: boolean | null
          isbn?: string | null
          language?: string | null
          memo?: string | null
          metadata?: Json | null
          one_liner?: string | null
          published_year?: number | null
          publisher?: string | null
          reading_status?: string
          section_label?: string | null
          shelf_id: string
          shelf_order?: number | null
          source?: string | null
          spine_image_url?: string | null
          spine_storage_path?: string | null
          started_reading_at?: string | null
          title: string
          total_pages?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          added_location?: Json | null
          added_timezone?: string | null
          added_to_shelf_at?: string
          added_weather?: Json | null
          author?: string | null
          completed_at?: string | null
          cover_dominant_color?: string | null
          cover_image_url?: string | null
          cover_source?: string | null
          cover_storage_path?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_featured?: boolean
          is_section_start?: boolean | null
          isbn?: string | null
          language?: string | null
          memo?: string | null
          metadata?: Json | null
          one_liner?: string | null
          published_year?: number | null
          publisher?: string | null
          reading_status?: string
          section_label?: string | null
          shelf_id?: string
          shelf_order?: number | null
          source?: string | null
          spine_image_url?: string | null
          spine_storage_path?: string | null
          started_reading_at?: string | null
          title?: string
          total_pages?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_shelf_id_fkey"
            columns: ["shelf_id"]
            isOneToOne: false
            referencedRelation: "shelves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_exports: {
        Row: {
          aspect_ratio: string
          created_at: string
          id: string
          shelf_id: string | null
          storage_path: string | null
          template: string
          user_id: string
        }
        Insert: {
          aspect_ratio: string
          created_at?: string
          id?: string
          shelf_id?: string | null
          storage_path?: string | null
          template: string
          user_id: string
        }
        Update: {
          aspect_ratio?: string
          created_at?: string
          id?: string
          shelf_id?: string | null
          storage_path?: string | null
          template?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_exports_shelf_id_fkey"
            columns: ["shelf_id"]
            isOneToOne: false
            referencedRelation: "shelves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_exports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_records: {
        Row: {
          created_at: string | null
          donated_at: string
          donation_amount_krw: number
          id: string
          period_end: string
          period_start: string
          receipt_url: string | null
          recipient_organization: string
          total_revenue_krw: number
        }
        Insert: {
          created_at?: string | null
          donated_at: string
          donation_amount_krw: number
          id?: string
          period_end: string
          period_start: string
          receipt_url?: string | null
          recipient_organization: string
          total_revenue_krw: number
        }
        Update: {
          created_at?: string | null
          donated_at?: string
          donation_amount_krw?: number
          id?: string
          period_end?: string
          period_start?: string
          receipt_url?: string | null
          recipient_organization?: string
          total_revenue_krw?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          active: boolean
          bonus: Json
          created_at: string
          description: string | null
          ends_at: string
          id: string
          name: string
          qualifying_action: string
          slug: string
          starts_at: string
        }
        Insert: {
          active?: boolean
          bonus: Json
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          name: string
          qualifying_action: string
          slug: string
          starts_at: string
        }
        Update: {
          active?: boolean
          bonus?: Json
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          name?: string
          qualifying_action?: string
          slug?: string
          starts_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
          notifications_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
          notifications_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
          notifications_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          book_id: string | null
          created_at: string | null
          id: string
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          book_id?: string | null
          created_at?: string | null
          id?: string
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          book_id?: string | null
          created_at?: string | null
          id?: string
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          language_preference: string | null
          quota_bonus: Json
          reading_streak_best: number
          reading_streak_current: number
          reading_streak_last_date: string | null
          referral_code: string
          shelf_visibility: string | null
          theme_preference: string | null
          tier: string
          tier_source: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          language_preference?: string | null
          quota_bonus?: Json
          reading_streak_best?: number
          reading_streak_current?: number
          reading_streak_last_date?: string | null
          referral_code: string
          shelf_visibility?: string | null
          theme_preference?: string | null
          tier?: string
          tier_source?: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          language_preference?: string | null
          quota_bonus?: Json
          reading_streak_best?: number
          reading_streak_current?: number
          reading_streak_last_date?: string | null
          referral_code?: string
          shelf_visibility?: string | null
          theme_preference?: string | null
          tier?: string
          tier_source?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      public_links: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          share_id: string
          target_id: string
          target_type: string
          user_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          share_id: string
          target_id: string
          target_type: string
          user_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          share_id?: string
          target_id?: string
          target_type?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          applied_at: string
          id: string
          referee_id: string
          referrer_id: string
          source_card_id: string | null
        }
        Insert: {
          applied_at?: string
          id?: string
          referee_id: string
          referrer_id: string
          source_card_id?: string | null
        }
        Update: {
          applied_at?: string
          id?: string
          referee_id?: string
          referrer_id?: string
          source_card_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_source_card_id_fkey"
            columns: ["source_card_id"]
            isOneToOne: false
            referencedRelation: "card_exports"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_books: {
        Row: {
          book_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_books_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shelves: {
        Row: {
          cover_config: Json | null
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          kind: string
          name: string
          shelf_order: number
          theme: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          cover_config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          kind?: string
          name: string
          shelf_order?: number
          theme?: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          cover_config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          kind?: string
          name?: string
          shelf_order?: number
          theme?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "shelves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
