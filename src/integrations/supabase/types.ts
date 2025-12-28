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
      anniversaries: {
        Row: {
          author_id: string
          created_at: string
          date: string
          id: string
          notes: string | null
          remind_before_days: number | null
          title: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          remind_before_days?: number | null
          title: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          remind_before_days?: number | null
          title?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anniversaries_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anniversaries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      books_read_list: {
        Row: {
          author_id: string
          book_author: string | null
          created_at: string
          genre: string | null
          id: string
          is_read: boolean | null
          notes: string | null
          rating: number | null
          title: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          book_author?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          is_read?: boolean | null
          notes?: string | null
          rating?: number | null
          title: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          book_author?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          is_read?: boolean | null
          notes?: string | null
          rating?: number | null
          title?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_read_list_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_read_list_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      bucket_list: {
        Row: {
          author_id: string
          category: string | null
          completed_date: string | null
          created_at: string
          description: string | null
          id: string
          is_completed: boolean | null
          priority: string | null
          title: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          category?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: string | null
          title: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          category?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: string | null
          title?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bucket_list_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bucket_list_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          author_id: string
          category_id: string | null
          created_at: string
          id: string
          month: number
          updated_at: string
          workspace_id: string
          year: number
        }
        Insert: {
          amount: number
          author_id: string
          category_id?: string | null
          created_at?: string
          id?: string
          month: number
          updated_at?: string
          workspace_id: string
          year: number
        }
        Update: {
          amount?: number
          author_id?: string
          category_id?: string | null
          created_at?: string
          id?: string
          month?: number
          updated_at?: string
          workspace_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_list: {
        Row: {
          author_id: string
          birthday: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          relationship: string | null
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          birthday?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          birthday?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_list_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_list_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_summaries: {
        Row: {
          created_at: string
          date: string
          id: string
          total_expense: number | null
          total_income: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          total_expense?: number | null
          total_income?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          total_expense?: number | null
          total_income?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_summaries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      date_ideas: {
        Row: {
          author_id: string
          category: string | null
          completed_date: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          id: string
          is_completed: boolean | null
          title: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          category?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          is_completed?: boolean | null
          title: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          category?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          is_completed?: boolean | null
          title?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "date_ideas_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "date_ideas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean | null
          author_id: string
          color: string | null
          created_at: string
          description: string | null
          end_time: string | null
          id: string
          start_time: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_type"]
          workspace_id: string
        }
        Insert: {
          all_day?: boolean | null
          author_id: string
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          start_time: string
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
          workspace_id: string
        }
        Update: {
          all_day?: boolean | null
          author_id?: string
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          start_time?: string
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          author_id: string
          category_id: string | null
          created_at: string
          date: string
          description: string | null
          expense_type: Database["public"]["Enums"]["expense_type"]
          finance_category: Database["public"]["Enums"]["finance_category"]
          id: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_type"]
          workspace_id: string
        }
        Insert: {
          amount: number
          author_id: string
          category_id?: string | null
          created_at?: string
          date: string
          description?: string | null
          expense_type?: Database["public"]["Enums"]["expense_type"]
          finance_category?: Database["public"]["Enums"]["finance_category"]
          id?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
          workspace_id: string
        }
        Update: {
          amount?: number
          author_id?: string
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          expense_type?: Database["public"]["Enums"]["expense_type"]
          finance_category?: Database["public"]["Enums"]["finance_category"]
          id?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_photos: {
        Row: {
          author_id: string
          created_at: string
          description: string | null
          id: string
          photo_url: string
          title: string | null
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          description?: string | null
          id?: string
          photo_url: string
          title?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string | null
          id?: string
          photo_url?: string
          title?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photos_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_photos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          author_id: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          progress: number | null
          status: string | null
          target_date: string | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          progress?: number | null
          status?: string | null
          target_date?: string | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          progress?: number | null
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      gratitude_journal: {
        Row: {
          author_id: string
          created_at: string
          entry_date: string
          grateful_for: string
          id: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          entry_date?: string
          grateful_for: string
          id?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          entry_date?: string
          grateful_for?: string
          id?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gratitude_journal_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gratitude_journal_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          completed_at: string
          completed_by: string
          habit_id: string
          id: string
          notes: string | null
        }
        Insert: {
          completed_at?: string
          completed_by: string
          habit_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          completed_at?: string
          completed_by?: string
          habit_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          author_id: string
          color: string | null
          created_at: string
          description: string | null
          frequency: string | null
          id: string
          name: string
          target_count: number | null
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          color?: string | null
          created_at?: string
          description?: string | null
          frequency?: string | null
          id?: string
          name: string
          target_count?: number | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          color?: string | null
          created_at?: string
          description?: string | null
          frequency?: string | null
          id?: string
          name?: string
          target_count?: number | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      health_logs: {
        Row: {
          author_id: string
          created_at: string
          exercise_minutes: number | null
          id: string
          log_date: string
          mood: string | null
          notes: string | null
          sleep_hours: number | null
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          water_intake: number | null
          weight: number | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          exercise_minutes?: number | null
          id?: string
          log_date?: string
          mood?: string | null
          notes?: string | null
          sleep_hours?: number | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          water_intake?: number | null
          weight?: number | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          exercise_minutes?: number | null
          id?: string
          log_date?: string
          mood?: string | null
          notes?: string | null
          sleep_hours?: number | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          water_intake?: number | null
          weight?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_logs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      important_dates: {
        Row: {
          author_id: string
          category: string | null
          created_at: string
          date: string
          id: string
          recurrence: string | null
          remind_days_before: number | null
          title: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          category?: string | null
          created_at?: string
          date: string
          id?: string
          recurrence?: string | null
          remind_days_before?: number | null
          title: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          category?: string | null
          created_at?: string
          date?: string
          id?: string
          recurrence?: string | null
          remind_days_before?: number | null
          title?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "important_dates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "important_dates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          author_id: string
          content: string
          created_at: string
          entry_date: string
          id: string
          is_private: boolean | null
          tags: string[] | null
          title: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          entry_date?: string
          id?: string
          is_private?: boolean | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          is_private?: boolean | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      love_letters: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          recipient_id: string | null
          title: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id?: string | null
          title: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id?: string | null
          title?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "love_letters_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "love_letters_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "love_letters_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          author_id: string
          created_at: string
          date: string
          id: string
          meal_type: string
          notes: string | null
          recipe_name: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          date: string
          id?: string
          meal_type: string
          notes?: string | null
          recipe_name: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          date?: string
          id?: string
          meal_type?: string
          notes?: string | null
          recipe_name?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          workspace_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          workspace_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_budgets: {
        Row: {
          actual_expense: number | null
          actual_income: number | null
          author_id: string
          created_at: string
          id: string
          month: number
          notes: string | null
          planned_expense: number | null
          planned_income: number | null
          updated_at: string
          workspace_id: string
          year: number
        }
        Insert: {
          actual_expense?: number | null
          actual_income?: number | null
          author_id: string
          created_at?: string
          id?: string
          month: number
          notes?: string | null
          planned_expense?: number | null
          planned_income?: number | null
          updated_at?: string
          workspace_id: string
          year: number
        }
        Update: {
          actual_expense?: number | null
          actual_income?: number | null
          author_id?: string
          created_at?: string
          id?: string
          month?: number
          notes?: string | null
          planned_expense?: number | null
          planned_income?: number | null
          updated_at?: string
          workspace_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_budgets_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_budgets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_tracker: {
        Row: {
          author_id: string
          created_at: string
          energy_level: number | null
          id: string
          log_date: string
          mood: string
          notes: string | null
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          energy_level?: number | null
          id?: string
          log_date?: string
          mood: string
          notes?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          energy_level?: number | null
          id?: string
          log_date?: string
          mood?: string
          notes?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_tracker_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mood_tracker_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      movies_watch_list: {
        Row: {
          author_id: string
          created_at: string
          genre: string | null
          id: string
          is_watched: boolean | null
          notes: string | null
          rating: number | null
          title: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
          year: number | null
        }
        Insert: {
          author_id: string
          created_at?: string
          genre?: string | null
          id?: string
          is_watched?: boolean | null
          notes?: string | null
          rating?: number | null
          title: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
          year?: number | null
        }
        Update: {
          author_id?: string
          created_at?: string
          genre?: string | null
          id?: string
          is_watched?: boolean | null
          notes?: string | null
          rating?: number | null
          title?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movies_watch_list_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movies_watch_list_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author_id: string
          content: string | null
          created_at: string
          date: string | null
          id: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_type"]
          workspace_id: string
        }
        Insert: {
          author_id: string
          content?: string | null
          created_at?: string
          date?: string | null
          id?: string
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
          workspace_id: string
        }
        Update: {
          author_id?: string
          content?: string | null
          created_at?: string
          date?: string | null
          id?: string
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      passwords_vault: {
        Row: {
          author_id: string
          created_at: string
          encrypted_password: string | null
          id: string
          notes: string | null
          service_name: string
          updated_at: string
          username: string | null
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          encrypted_password?: string | null
          id?: string
          notes?: string | null
          service_name: string
          updated_at?: string
          username?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          encrypted_password?: string | null
          id?: string
          notes?: string | null
          service_name?: string
          updated_at?: string
          username?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "passwords_vault_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passwords_vault_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          author_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          progress: number | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          progress?: number | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          progress?: number | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_notes: {
        Row: {
          author_id: string
          color: string | null
          content: string
          created_at: string
          id: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          color?: string | null
          content: string
          created_at?: string
          id?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          color?: string | null
          content?: string
          created_at?: string
          id?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_notes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          author_id: string
          category: string | null
          cook_time_minutes: number | null
          created_at: string
          id: string
          ingredients: string[] | null
          instructions: string | null
          is_favorite: boolean | null
          prep_time_minutes: number | null
          servings: number | null
          title: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          category?: string | null
          cook_time_minutes?: number | null
          created_at?: string
          id?: string
          ingredients?: string[] | null
          instructions?: string | null
          is_favorite?: boolean | null
          prep_time_minutes?: number | null
          servings?: number | null
          title: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          category?: string | null
          cook_time_minutes?: number | null
          created_at?: string
          id?: string
          ingredients?: string[] | null
          instructions?: string | null
          is_favorite?: boolean | null
          prep_time_minutes?: number | null
          servings?: number | null
          title?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_expenses: {
        Row: {
          amount: number
          author_id: string
          category_id: string | null
          created_at: string
          frequency: string
          id: string
          is_active: boolean | null
          name: string
          next_due_date: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          amount: number
          author_id: string
          category_id?: string | null
          created_at?: string
          frequency: string
          id?: string
          is_active?: boolean | null
          name: string
          next_due_date: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          amount?: number
          author_id?: string
          category_id?: string | null
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          name?: string
          next_due_date?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          author_id: string
          created_at: string
          description: string | null
          id: string
          is_completed: boolean | null
          is_recurring: boolean | null
          recurrence_pattern: string | null
          remind_at: string
          title: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          remind_at: string
          title: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          remind_at?: string
          title?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      revenues: {
        Row: {
          amount: number
          author_id: string
          created_at: string
          date: string
          description: string | null
          id: string
          is_recurring: boolean | null
          source: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_type"]
          workspace_id: string
        }
        Insert: {
          amount: number
          author_id: string
          created_at?: string
          date: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          source: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
          workspace_id: string
        }
        Update: {
          amount?: number
          author_id?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          source?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenues_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenues_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_contributions: {
        Row: {
          amount: number
          author_id: string
          created_at: string
          id: string
          note: string | null
          savings_goal_id: string
        }
        Insert: {
          amount: number
          author_id: string
          created_at?: string
          id?: string
          note?: string | null
          savings_goal_id: string
        }
        Update: {
          amount?: number
          author_id?: string
          created_at?: string
          id?: string
          note?: string | null
          savings_goal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_contributions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_contributions_savings_goal_id_fkey"
            columns: ["savings_goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          author_id: string
          color: string | null
          created_at: string
          current_amount: number | null
          id: string
          name: string
          target_amount: number
          target_date: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          color?: string | null
          created_at?: string
          current_amount?: number | null
          id?: string
          name: string
          target_amount: number
          target_date?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          color?: string | null
          created_at?: string
          current_amount?: number | null
          id?: string
          name?: string
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_goals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          author_id: string
          created_at: string
          description: string | null
          id: string
          is_recurring: boolean | null
          recurrence_pattern: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: string | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_items: {
        Row: {
          created_at: string
          id: string
          is_purchased: boolean | null
          list_id: string
          name: string
          price: number | null
          purchased_by: string | null
          quantity: number | null
          unit: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_purchased?: boolean | null
          list_id: string
          name: string
          price?: number | null
          purchased_by?: string | null
          quantity?: number | null
          unit?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_purchased?: boolean | null
          list_id?: string
          name?: string
          price?: number | null
          purchased_by?: string | null
          quantity?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_items_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          author_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_lists_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          author_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          author_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          author_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tips: {
        Row: {
          author_id: string
          category: string | null
          content: string
          created_at: string
          id: string
          is_pinned: boolean | null
          title: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          category?: string | null
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          title: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          title?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tips_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tips_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_plans: {
        Row: {
          author_id: string
          budget: number | null
          created_at: string
          destination: string
          end_date: string | null
          id: string
          notes: string | null
          start_date: string
          status: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          budget?: number | null
          created_at?: string
          destination: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date: string
          status?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          budget?: number | null
          created_at?: string
          destination?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_plans_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_plans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          default_visibility:
            | Database["public"]["Enums"]["visibility_type"]
            | null
          id: string
          notifications_enabled: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_visibility?:
            | Database["public"]["Enums"]["visibility_type"]
            | null
          id?: string
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_visibility?:
            | Database["public"]["Enums"]["visibility_type"]
            | null
          id?: string
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reflections: {
        Row: {
          author_id: string
          challenges: string | null
          created_at: string
          goals_for_next_week: string | null
          highlights: string | null
          id: string
          lessons_learned: string | null
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          week_start_date: string
          workspace_id: string
        }
        Insert: {
          author_id: string
          challenges?: string | null
          created_at?: string
          goals_for_next_week?: string | null
          highlights?: string | null
          id?: string
          lessons_learned?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          week_start_date: string
          workspace_id: string
        }
        Update: {
          author_id?: string
          challenges?: string | null
          created_at?: string
          goals_for_next_week?: string | null
          highlights?: string | null
          id?: string
          lessons_learned?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          week_start_date?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reflections_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_reflections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          author_id: string
          created_at: string
          description: string | null
          id: string
          is_purchased: boolean | null
          price: number | null
          priority: string | null
          purchased_by: string | null
          title: string
          url: string | null
          visibility: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_purchased?: boolean | null
          price?: number | null
          priority?: string | null
          purchased_by?: string | null
          title: string
          url?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_purchased?: boolean | null
          price?: number | null
          priority?: string | null
          purchased_by?: string | null
          title?: string
          url?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          status: string | null
          token: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          status?: string | null
          token?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          status?: string | null
          token?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_item: {
        Args: {
          item_author_id: string
          item_visibility: Database["public"]["Enums"]["visibility_type"]
          viewer_id: string
        }
        Returns: boolean
      }
      create_notification: {
        Args: {
          p_message: string
          p_title: string
          p_type?: string
          p_user_id: string
        }
        Returns: string
      }
      get_user_workspace_ids: { Args: { user_uuid: string }; Returns: string[] }
      is_workspace_member: {
        Args: { user_uuid: string; ws_id: string }
        Returns: boolean
      }
    }
    Enums: {
      expense_type: "fixed" | "variable" | "one_time"
      finance_category: "business" | "personal"
      visibility_type: "private" | "shared" | "business"
      workspace_role: "owner" | "partner"
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
      expense_type: ["fixed", "variable", "one_time"],
      finance_category: ["business", "personal"],
      visibility_type: ["private", "shared", "business"],
      workspace_role: ["owner", "partner"],
    },
  },
} as const
