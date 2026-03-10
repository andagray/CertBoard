export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          company_name: string
          email: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          trial_ends_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          company_name: string
          email: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          email?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      subcontractors: {
        Row: {
          id: string
          user_id: string
          company_name: string
          contact_name: string | null
          email: string | null
          phone: string | null
          trade: string | null
          notes: string | null
          upload_token: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          trade?: string | null
          notes?: string | null
          upload_token?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          trade?: string | null
          notes?: string | null
          upload_token?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      documents: {
        Row: {
          id: string
          subcontractor_id: string
          user_id: string
          document_type: 'COI' | 'W9' | 'License' | 'Bond' | 'Other'
          file_url: string
          file_name: string
          expiration_date: string | null
          status: 'current' | 'expiring_soon' | 'expired' | 'pending_review'
          uploaded_by: 'gc' | 'subcontractor'
          created_at: string
        }
        Insert: {
          id?: string
          subcontractor_id: string
          user_id: string
          document_type: 'COI' | 'W9' | 'License' | 'Bond' | 'Other'
          file_url: string
          file_name: string
          expiration_date?: string | null
          status?: 'current' | 'expiring_soon' | 'expired' | 'pending_review'
          uploaded_by?: 'gc' | 'subcontractor'
          created_at?: string
        }
        Update: {
          id?: string
          subcontractor_id?: string
          user_id?: string
          document_type?: 'COI' | 'W9' | 'License' | 'Bond' | 'Other'
          file_url?: string
          file_name?: string
          expiration_date?: string | null
          status?: 'current' | 'expiring_soon' | 'expired' | 'pending_review'
          uploaded_by?: 'gc' | 'subcontractor'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      alert_log: {
        Row: {
          id: string
          document_id: string
          alert_type: '60_day' | '30_day' | '7_day' | 'expired'
          sent_at: string
        }
        Insert: {
          id?: string
          document_id: string
          alert_type: '60_day' | '30_day' | '7_day' | 'expired'
          sent_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          alert_type?: '60_day' | '30_day' | '7_day' | 'expired'
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          }
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

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Subcontractor = Database['public']['Tables']['subcontractors']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type AlertLog = Database['public']['Tables']['alert_log']['Row']

export type DocumentType = 'COI' | 'W9' | 'License' | 'Bond' | 'Other'
export type DocumentStatus = 'current' | 'expiring_soon' | 'expired' | 'pending_review'
export type AlertType = '60_day' | '30_day' | '7_day' | 'expired'

export type SubcontractorWithDocs = Subcontractor & {
  documents: Document[]
}

export type ComplianceStatus = 'compliant' | 'expiring' | 'expired' | 'no_documents'

export const TRADES = [
  'Electrical',
  'Plumbing',
  'HVAC',
  'Roofing',
  'Concrete',
  'Framing',
  'Painting',
  'Drywall',
  'Landscaping',
  'Other',
] as const

export const DOCUMENT_TYPES: DocumentType[] = ['COI', 'W9', 'License', 'Bond', 'Other']
