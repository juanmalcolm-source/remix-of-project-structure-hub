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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      budget_lines: {
        Row: {
          account_number: string | null
          agency_percentage: number | null
          chapter: number
          concept: string
          created_at: string
          id: string
          project_id: string
          quantity: number | null
          total: number | null
          unit_price: number | null
          units: number | null
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          agency_percentage?: number | null
          chapter: number
          concept: string
          created_at?: string
          id?: string
          project_id: string
          quantity?: number | null
          total?: number | null
          unit_price?: number | null
          units?: number | null
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          agency_percentage?: number | null
          chapter?: number
          concept?: string
          created_at?: string
          id?: string
          project_id?: string
          quantity?: number | null
          total?: number | null
          unit_price?: number | null
          units?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          agency_percentage: number | null
          casting_suggestions: Json | null
          category: string | null
          created_at: string
          daily_rate: number | null
          description: string | null
          dramatic_arc: string | null
          id: string
          name: string
          project_id: string
          relationships: Json | null
          shooting_days: number | null
          updated_at: string
        }
        Insert: {
          agency_percentage?: number | null
          casting_suggestions?: Json | null
          category?: string | null
          created_at?: string
          daily_rate?: number | null
          description?: string | null
          dramatic_arc?: string | null
          id?: string
          name: string
          project_id: string
          relationships?: Json | null
          shooting_days?: number | null
          updated_at?: string
        }
        Update: {
          agency_percentage?: number | null
          casting_suggestions?: Json | null
          category?: string | null
          created_at?: string
          daily_rate?: number | null
          description?: string | null
          dramatic_arc?: string | null
          id?: string
          name?: string
          project_id?: string
          relationships?: Json | null
          shooting_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_analysis: {
        Row: {
          act_structure: Json | null
          central_theme: string | null
          confidential_notes: string | null
          core_emotional: string | null
          created_at: string
          emotional_curve: Json | null
          estimated_budget_range: string | null
          id: string
          improvement_suggestions: Json | null
          producibility_score: number | null
          project_id: string
          strengths: Json | null
          synopsis: string | null
          turning_points: Json | null
          updated_at: string
          viability_factors_negative: Json | null
          viability_factors_positive: Json | null
          weaknesses: Json | null
        }
        Insert: {
          act_structure?: Json | null
          central_theme?: string | null
          confidential_notes?: string | null
          core_emotional?: string | null
          created_at?: string
          emotional_curve?: Json | null
          estimated_budget_range?: string | null
          id?: string
          improvement_suggestions?: Json | null
          producibility_score?: number | null
          project_id: string
          strengths?: Json | null
          synopsis?: string | null
          turning_points?: Json | null
          updated_at?: string
          viability_factors_negative?: Json | null
          viability_factors_positive?: Json | null
          weaknesses?: Json | null
        }
        Update: {
          act_structure?: Json | null
          central_theme?: string | null
          confidential_notes?: string | null
          core_emotional?: string | null
          created_at?: string
          emotional_curve?: Json | null
          estimated_budget_range?: string | null
          id?: string
          improvement_suggestions?: Json | null
          producibility_score?: number | null
          project_id?: string
          strengths?: Json | null
          synopsis?: string | null
          turning_points?: Json | null
          updated_at?: string
          viability_factors_negative?: Json | null
          viability_factors_positive?: Json | null
          weaknesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "creative_analysis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_plan: {
        Row: {
          created_at: string
          director_gender: string | null
          id: string
          investor_commission_percentage: number | null
          is_debut: boolean | null
          net_tax_incentive: number | null
          project_id: string
          public_intensity_percentage: number | null
          shooting_territory: string | null
          special_bonuses: Json | null
          tax_incentive_amount: number | null
          tax_incentive_percentage: number | null
          tax_incentive_territory: string | null
          total_budget: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          director_gender?: string | null
          id?: string
          investor_commission_percentage?: number | null
          is_debut?: boolean | null
          net_tax_incentive?: number | null
          project_id: string
          public_intensity_percentage?: number | null
          shooting_territory?: string | null
          special_bonuses?: Json | null
          tax_incentive_amount?: number | null
          tax_incentive_percentage?: number | null
          tax_incentive_territory?: string | null
          total_budget?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          director_gender?: string | null
          id?: string
          investor_commission_percentage?: number | null
          is_debut?: boolean | null
          net_tax_incentive?: number | null
          project_id?: string
          public_intensity_percentage?: number | null
          shooting_territory?: string | null
          special_bonuses?: Json | null
          tax_incentive_amount?: number | null
          tax_incentive_percentage?: number | null
          tax_incentive_territory?: string | null
          total_budget?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_plan_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_sources: {
        Row: {
          amount: number | null
          created_at: string
          expected_payment_date: string | null
          id: string
          notes: string | null
          project_id: string
          source_name: string
          source_type: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          expected_payment_date?: string | null
          id?: string
          notes?: string | null
          project_id: string
          source_name: string
          source_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          expected_payment_date?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          source_name?: string
          source_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_sources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          complexity: string | null
          created_at: string
          estimated_days: number | null
          formatted_address: string | null
          id: string
          latitude: number | null
          location_type: string | null
          longitude: number | null
          name: string
          place_id: string | null
          production_notes: string | null
          project_id: string
          special_needs: string | null
          updated_at: string
          zone: string | null
        }
        Insert: {
          address?: string | null
          complexity?: string | null
          created_at?: string
          estimated_days?: number | null
          formatted_address?: string | null
          id?: string
          latitude?: number | null
          location_type?: string | null
          longitude?: number | null
          name: string
          place_id?: string | null
          production_notes?: string | null
          project_id: string
          special_needs?: string | null
          updated_at?: string
          zone?: string | null
        }
        Update: {
          address?: string | null
          complexity?: string | null
          created_at?: string
          estimated_days?: number | null
          formatted_address?: string | null
          id?: string
          latitude?: number | null
          location_type?: string | null
          longitude?: number | null
          name?: string
          place_id?: string | null
          production_notes?: string | null
          project_id?: string
          special_needs?: string | null
          updated_at?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_board: {
        Row: {
          ai_generated_images: Json | null
          cinematographic_style: string | null
          color_palette: Json | null
          created_at: string
          director_references: Json | null
          dop_references: Json | null
          id: string
          project_id: string
          updated_at: string
          visual_references: Json | null
        }
        Insert: {
          ai_generated_images?: Json | null
          cinematographic_style?: string | null
          color_palette?: Json | null
          created_at?: string
          director_references?: Json | null
          dop_references?: Json | null
          id?: string
          project_id: string
          updated_at?: string
          visual_references?: Json | null
        }
        Update: {
          ai_generated_images?: Json | null
          cinematographic_style?: string | null
          color_palette?: Json | null
          created_at?: string
          director_references?: Json | null
          dop_references?: Json | null
          id?: string
          project_id?: string
          updated_at?: string
          visual_references?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mood_board_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      production_notes: {
        Row: {
          aesthetic_proposal: string | null
          artistic_vision: string | null
          confirmed_locations: string | null
          created_at: string
          director_intentions: string | null
          id: string
          personal_connection: string | null
          production_viability: string | null
          project_id: string
          target_audience: string | null
          team_strengths: string | null
          updated_at: string
          version: number | null
          visual_references: string | null
        }
        Insert: {
          aesthetic_proposal?: string | null
          artistic_vision?: string | null
          confirmed_locations?: string | null
          created_at?: string
          director_intentions?: string | null
          id?: string
          personal_connection?: string | null
          production_viability?: string | null
          project_id: string
          target_audience?: string | null
          team_strengths?: string | null
          updated_at?: string
          version?: number | null
          visual_references?: string | null
        }
        Update: {
          aesthetic_proposal?: string | null
          artistic_vision?: string | null
          confirmed_locations?: string | null
          created_at?: string
          director_intentions?: string | null
          id?: string
          personal_connection?: string | null
          production_viability?: string | null
          project_id?: string
          target_audience?: string | null
          team_strengths?: string | null
          updated_at?: string
          version?: number | null
          visual_references?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          company_logo_url: string | null
          company_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          id: string
          logline: string | null
          project_type: string | null
          script_file_url: string | null
          script_text: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          logline?: string | null
          project_type?: string | null
          script_file_url?: string | null
          script_text?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          logline?: string | null
          project_type?: string | null
          script_file_url?: string | null
          script_text?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sequences: {
        Row: {
          attrezzo: Json | null
          characters_in_scene: Json | null
          created_at: string
          description: string | null
          effects: Json | null
          estimated_duration_minutes: number | null
          id: string
          location_id: string | null
          page_eighths: number | null
          project_id: string
          scene_complexity: string | null
          sequence_number: number
          time_of_day: string | null
          title: string | null
          updated_at: string
          wardrobe: Json | null
        }
        Insert: {
          attrezzo?: Json | null
          characters_in_scene?: Json | null
          created_at?: string
          description?: string | null
          effects?: Json | null
          estimated_duration_minutes?: number | null
          id?: string
          location_id?: string | null
          page_eighths?: number | null
          project_id: string
          scene_complexity?: string | null
          sequence_number: number
          time_of_day?: string | null
          title?: string | null
          updated_at?: string
          wardrobe?: Json | null
        }
        Update: {
          attrezzo?: Json | null
          characters_in_scene?: Json | null
          created_at?: string
          description?: string | null
          effects?: Json | null
          estimated_duration_minutes?: number | null
          id?: string
          location_id?: string | null
          page_eighths?: number | null
          project_id?: string
          scene_complexity?: string | null
          sequence_number?: number
          time_of_day?: string | null
          title?: string | null
          updated_at?: string
          wardrobe?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sequences_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      shooting_days: {
        Row: {
          characters: Json | null
          created_at: string | null
          day_number: number
          estimated_hours: number | null
          id: string
          location_id: string | null
          location_name: string | null
          notes: string | null
          project_id: string
          sequences: Json | null
          shooting_date: string | null
          time_of_day: string | null
          total_eighths: number | null
          updated_at: string | null
        }
        Insert: {
          characters?: Json | null
          created_at?: string | null
          day_number: number
          estimated_hours?: number | null
          id?: string
          location_id?: string | null
          location_name?: string | null
          notes?: string | null
          project_id: string
          sequences?: Json | null
          shooting_date?: string | null
          time_of_day?: string | null
          total_eighths?: number | null
          updated_at?: string | null
        }
        Update: {
          characters?: Json | null
          created_at?: string | null
          day_number?: number
          estimated_hours?: number | null
          id?: string
          location_id?: string | null
          location_name?: string | null
          notes?: string | null
          project_id?: string
          sequences?: Json | null
          shooting_date?: string | null
          time_of_day?: string | null
          total_eighths?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shooting_days_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shooting_days_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
