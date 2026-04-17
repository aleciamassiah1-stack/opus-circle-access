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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      candidate_job_titles: {
        Row: {
          id: string
          job_title_id: string
          profile_id: string
        }
        Insert: {
          id?: string
          job_title_id: string
          profile_id: string
        }
        Update: {
          id?: string
          job_title_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_job_titles_job_title_id_fkey"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_titles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_specialty_tags: {
        Row: {
          id: string
          profile_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          profile_id: string
          tag_id: string
        }
        Update: {
          id?: string
          profile_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_specialty_tags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_specialty_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "specialty_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          candidate_user_id: string
          created_at: string
          employer_user_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          candidate_user_id: string
          created_at?: string
          employer_user_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          candidate_user_id?: string
          created_at?: string
          employer_user_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          candidate_profile_id: string
          created_at: string
          employer_user_id: string
          id: string
        }
        Insert: {
          candidate_profile_id: string
          created_at?: string
          employer_user_id: string
          id?: string
        }
        Update: {
          candidate_profile_id?: string
          created_at?: string
          employer_user_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_candidate_profile_id_fkey"
            columns: ["candidate_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_requests: {
        Row: {
          candidate_user_id: string
          created_at: string
          employer_user_id: string
          id: string
          note: string | null
          status: string
          updated_at: string
        }
        Insert: {
          candidate_user_id: string
          created_at?: string
          employer_user_id: string
          id?: string
          note?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          candidate_user_id?: string
          created_at?: string
          employer_user_id?: string
          id?: string
          note?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_titles: {
        Row: {
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          id: string
          read_at: string | null
          sender_id: string
          sent_at: string
        }
        Insert: {
          body: string
          conversation_id: string
          id?: string
          read_at?: string | null
          sender_id: string
          sent_at?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          availability_status: string | null
          avatar_url: string | null
          bio: string | null
          company_description: string | null
          company_industry: string | null
          company_logo_url: string | null
          company_name: string | null
          company_size: string | null
          company_website: string | null
          created_at: string
          deactivated_at: string | null
          deactivated_by: string | null
          email: string | null
          first_name: string | null
          headline: string | null
          id: string
          last_name: string | null
          location: string | null
          phone: string | null
          profile_completion: number | null
          resume_summary: string | null
          resume_url: string | null
          scheduled_purge_at: string | null
          subscription_active: boolean
          title: string | null
          updated_at: string
          user_id: string
          verified: boolean
          visibility_status: string | null
          work_authorization: string | null
          years_experience: number | null
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          availability_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_description?: string | null
          company_industry?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_size?: string | null
          company_website?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          email?: string | null
          first_name?: string | null
          headline?: string | null
          id?: string
          last_name?: string | null
          location?: string | null
          phone?: string | null
          profile_completion?: number | null
          resume_summary?: string | null
          resume_url?: string | null
          scheduled_purge_at?: string | null
          subscription_active?: boolean
          title?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean
          visibility_status?: string | null
          work_authorization?: string | null
          years_experience?: number | null
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          availability_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_description?: string | null
          company_industry?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_size?: string | null
          company_website?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          email?: string | null
          first_name?: string | null
          headline?: string | null
          id?: string
          last_name?: string | null
          location?: string | null
          phone?: string | null
          profile_completion?: number | null
          resume_summary?: string | null
          resume_url?: string | null
          scheduled_purge_at?: string | null
          subscription_active?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean
          visibility_status?: string | null
          work_authorization?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      resume_access_requests: {
        Row: {
          candidate_profile_id: string
          candidate_user_id: string
          created_at: string
          employer_user_id: string
          id: string
          message: string | null
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          candidate_profile_id: string
          candidate_user_id: string
          created_at?: string
          employer_user_id: string
          id?: string
          message?: string | null
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          candidate_profile_id?: string
          candidate_user_id?: string
          created_at?: string
          employer_user_id?: string
          id?: string
          message?: string | null
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      specialty_tags: {
        Row: {
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_user_id_by_email: { Args: { _email: string }; Returns: string }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_admin_action: {
        Args: { _action: string; _details?: Json; _target_user_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "candidate" | "employer" | "admin"
      approval_status: "pending" | "approved" | "rejected"
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
      app_role: ["candidate", "employer", "admin"],
      approval_status: ["pending", "approved", "rejected"],
    },
  },
} as const
