/**
 * Types generes depuis le schema Supabase (projet drop-no).
 * NE PAS editer a la main. Regenerer apres chaque migration :
 *   npx supabase gen types typescript --project-id ygzyzvjxregoqbzmcmyq > lib/supabase/types.ts
 * (ou via le MCP Supabase generate_typescript_types).
 */
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
      bid_audit_log: {
        Row: {
          action: string
          amount_cents_at_time: number | null
          amount_hash: string
          bid_id: string
          drop_id: string
          id: number
          occurred_at: string
          previous_hash: string | null
          user_id: string
        }
        Insert: {
          action: string
          amount_cents_at_time?: number | null
          amount_hash: string
          bid_id: string
          drop_id: string
          id?: number
          occurred_at?: string
          previous_hash?: string | null
          user_id: string
        }
        Update: {
          action?: string
          amount_cents_at_time?: number | null
          amount_hash?: string
          bid_id?: string
          drop_id?: string
          id?: number
          occurred_at?: string
          previous_hash?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bids: {
        Row: {
          amount_cents: number
          amount_hash: string | null
          bid_locked: boolean
          drop_id: string
          id: string
          status: string
          stripe_auth_status: string
          stripe_payment_intent_id: string | null
          submitted_at: string
          updated_at: string
          user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          amount_cents: number
          amount_hash?: string | null
          bid_locked?: boolean
          drop_id: string
          id?: string
          status?: string
          stripe_auth_status?: string
          stripe_payment_intent_id?: string | null
          submitted_at?: string
          updated_at?: string
          user_id: string
          withdrawn_at?: string | null
        }
        Update: {
          amount_cents?: number
          amount_hash?: string | null
          bid_locked?: boolean
          drop_id?: string
          id?: string
          status?: string
          stripe_auth_status?: string
          stripe_payment_intent_id?: string | null
          submitted_at?: string
          updated_at?: string
          user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_admins: {
        Row: {
          brand_id: string
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          role?: string
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_admins_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          contract_signed_at: string | null
          country_code: string | null
          created_at: string
          description: string | null
          id: string
          kbis_verified: boolean
          logo_url: string | null
          name: string
          slug: string
          status: string
          stripe_account_id: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          contract_signed_at?: string | null
          country_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kbis_verified?: boolean
          logo_url?: string | null
          name: string
          slug: string
          status?: string
          stripe_account_id?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          contract_signed_at?: string | null
          country_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kbis_verified?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          status?: string
          stripe_account_id?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          carrier: string
          created_at: string
          delivered_at: string | null
          direction: string
          id: string
          insured_value_cents: number | null
          notes: string | null
          shipped_at: string | null
          status: string
          tracking_number: string | null
          transaction_id: string
        }
        Insert: {
          carrier: string
          created_at?: string
          delivered_at?: string | null
          direction?: string
          id?: string
          insured_value_cents?: number | null
          notes?: string | null
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
          transaction_id: string
        }
        Update: {
          carrier?: string
          created_at?: string
          delivered_at?: string | null
          direction?: string
          id?: string
          insured_value_cents?: number | null
          notes?: string | null
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      drop_alerts: {
        Row: {
          confirm_token: string
          confirmed_at: string | null
          created_at: string
          drop_id: string
          email: string
          id: string
          locale: string
          lock_sent_at: string | null
          notify_lock: boolean
          notify_open: boolean
          open_sent_at: string | null
          status: string
        }
        Insert: {
          confirm_token: string
          confirmed_at?: string | null
          created_at?: string
          drop_id: string
          email: string
          id?: string
          locale?: string
          lock_sent_at?: string | null
          notify_lock?: boolean
          notify_open?: boolean
          open_sent_at?: string | null
          status?: string
        }
        Update: {
          confirm_token?: string
          confirmed_at?: string | null
          created_at?: string
          drop_id?: string
          email?: string
          id?: string
          locale?: string
          lock_sent_at?: string | null
          notify_lock?: boolean
          notify_open?: boolean
          open_sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "drop_alerts_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drop_alerts_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops_public"
            referencedColumns: ["id"]
          },
        ]
      }
      drop_close_runs: {
        Row: {
          close_status: string | null
          created_at: string
          drop_id: string
          id: number
          ok: boolean
          report: Json
          triggered_by: string
        }
        Insert: {
          close_status?: string | null
          created_at?: string
          drop_id: string
          id?: number
          ok?: boolean
          report?: Json
          triggered_by?: string
        }
        Update: {
          close_status?: string | null
          created_at?: string
          drop_id?: string
          id?: number
          ok?: boolean
          report?: Json
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "drop_close_runs_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drop_close_runs_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops_public"
            referencedColumns: ["id"]
          },
        ]
      }
      drop_follows: {
        Row: {
          drop_id: string
          followed_at: string
          user_id: string
        }
        Insert: {
          drop_id: string
          followed_at?: string
          user_id: string
        }
        Update: {
          drop_id?: string
          followed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drop_follows_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drop_follows_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drop_follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drop_notifications: {
        Row: {
          drop_id: string
          kind: string
          sent_at: string
        }
        Insert: {
          drop_id: string
          kind: string
          sent_at?: string
        }
        Update: {
          drop_id?: string
          kind?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drop_notifications_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drop_notifications_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops_public"
            referencedColumns: ["id"]
          },
        ]
      }
      drop_payouts: {
        Row: {
          created_at: string
          drop_id: string
          fee_cents: number
          gross_cents: number
          id: string
          net_cents: number
          note: string | null
          paid_at: string
          paid_by: string | null
          payment_reference: string | null
          units: number
        }
        Insert: {
          created_at?: string
          drop_id: string
          fee_cents: number
          gross_cents: number
          id?: string
          net_cents: number
          note?: string | null
          paid_at?: string
          paid_by?: string | null
          payment_reference?: string | null
          units: number
        }
        Update: {
          created_at?: string
          drop_id?: string
          fee_cents?: number
          gross_cents?: number
          id?: string
          net_cents?: number
          note?: string | null
          paid_at?: string
          paid_by?: string | null
          payment_reference?: string | null
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "drop_payouts_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: true
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drop_payouts_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: true
            referencedRelation: "drops_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drop_payouts_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drops: {
        Row: {
          bid_count: number
          bid_lock_at: string | null
          bid_window_opens_at: string
          brand_id: string
          clearing_price_cents: number | null
          created_at: string
          description: string | null
          drop_number: number
          exemplaires: number
          floor_price_cents: number
          format: string
          hero_image_url: string | null
          id: string
          images_urls: Json | null
          piece_reference: string | null
          result_notified_at: string | null
          reveal_at: string
          revealed_at: string | null
          specs: Json | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          bid_count?: number
          bid_lock_at?: string | null
          bid_window_opens_at: string
          brand_id: string
          clearing_price_cents?: number | null
          created_at?: string
          description?: string | null
          drop_number: number
          exemplaires: number
          floor_price_cents: number
          format?: string
          hero_image_url?: string | null
          id?: string
          images_urls?: Json | null
          piece_reference?: string | null
          result_notified_at?: string | null
          reveal_at: string
          revealed_at?: string | null
          specs?: Json | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          bid_count?: number
          bid_lock_at?: string | null
          bid_window_opens_at?: string
          brand_id?: string
          clearing_price_cents?: number | null
          created_at?: string
          description?: string | null
          drop_number?: number
          exemplaires?: number
          floor_price_cents?: number
          format?: string
          hero_image_url?: string | null
          id?: string
          images_urls?: Json | null
          piece_reference?: string | null
          result_notified_at?: string | null
          reveal_at?: string
          revealed_at?: string | null
          specs?: Json | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drops_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          kyc_status: string
          kyc_stripe_session_id: string | null
          kyc_verified_at: string | null
          locale: string
          newsletter_subscribed: boolean
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          kyc_status?: string
          kyc_stripe_session_id?: string | null
          kyc_verified_at?: string | null
          locale?: string
          newsletter_subscribed?: boolean
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          kyc_status?: string
          kyc_stripe_session_id?: string | null
          kyc_verified_at?: string | null
          locale?: string
          newsletter_subscribed?: boolean
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      refund_runs: {
        Row: {
          amount_cents: number | null
          created_at: string
          id: number
          ok: boolean
          report: Json
          stripe_refund_id: string | null
          transaction_id: string
          triggered_by: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          id?: number
          ok?: boolean
          report?: Json
          stripe_refund_id?: string | null
          transaction_id: string
          triggered_by?: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          id?: number
          ok?: boolean
          report?: Json
          stripe_refund_id?: string | null
          transaction_id?: string
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_runs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      serial_offers: {
        Row: {
          bid_id: string
          created_at: string
          drop_id: string
          expires_at: string
          id: string
          resolved_at: string | null
          serial_no: number
          status: string
          stripe_payment_intent_id: string | null
          supplement_cents: number
          transaction_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bid_id: string
          created_at?: string
          drop_id: string
          expires_at: string
          id?: string
          resolved_at?: string | null
          serial_no?: number
          status?: string
          stripe_payment_intent_id?: string | null
          supplement_cents: number
          transaction_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bid_id?: string
          created_at?: string
          drop_id?: string
          expires_at?: string
          id?: string
          resolved_at?: string | null
          serial_no?: number
          status?: string
          stripe_payment_intent_id?: string | null
          supplement_cents?: number
          transaction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "serial_offers_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: true
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_offers_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: true
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_offers_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: true
            referencedRelation: "drops_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_offers_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_offers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          author_id: string | null
          author_kind: string
          body: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          author_kind: string
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          author_kind?: string
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          id: string
          last_activity_at: string
          priority: string
          related_transaction_id: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          last_activity_at?: string
          priority?: string
          related_transaction_id?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          last_activity_at?: string
          priority?: string
          related_transaction_id?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_related_transaction_id_fkey"
            columns: ["related_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_paid_cents: number
          bid_id: string
          brand_payout_cents: number
          captured_at: string | null
          created_at: string
          drop_id: string
          id: string
          platform_fee_cents: number
          serial_no: number | null
          status: string
          stripe_charge_id: string | null
          user_id: string
          withdrawal_window_ends_at: string | null
        }
        Insert: {
          amount_paid_cents: number
          bid_id: string
          brand_payout_cents: number
          captured_at?: string | null
          created_at?: string
          drop_id: string
          id?: string
          platform_fee_cents: number
          serial_no?: number | null
          status?: string
          stripe_charge_id?: string | null
          user_id: string
          withdrawal_window_ends_at?: string | null
        }
        Update: {
          amount_paid_cents?: number
          bid_id?: string
          brand_payout_cents?: number
          captured_at?: string | null
          created_at?: string
          drop_id?: string
          id?: string
          platform_fee_cents?: number
          serial_no?: number | null
          status?: string
          stripe_charge_id?: string | null
          user_id?: string
          withdrawal_window_ends_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          refunded_at: string | null
          rejection_reason: string | null
          requested_at: string
          status: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          refunded_at?: string | null
          rejection_reason?: string | null
          requested_at?: string
          status?: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          refunded_at?: string | null
          rejection_reason?: string | null
          requested_at?: string
          status?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      drops_public: {
        Row: {
          bid_count: number | null
          bid_lock_at: string | null
          bid_window_opens_at: string | null
          brand_id: string | null
          clearing_price_cents: number | null
          description: string | null
          drop_number: number | null
          exemplaires: number | null
          floor_price_cents: number | null
          format: string | null
          hero_image_url: string | null
          id: string | null
          images_urls: Json | null
          piece_reference: string | null
          reveal_at: string | null
          revealed_at: string | null
          specs: Json | null
          status: string | null
          title: string | null
        }
        Insert: {
          bid_count?: number | null
          bid_lock_at?: string | null
          bid_window_opens_at?: string | null
          brand_id?: string | null
          clearing_price_cents?: never
          description?: string | null
          drop_number?: number | null
          exemplaires?: number | null
          floor_price_cents?: number | null
          format?: string | null
          hero_image_url?: string | null
          id?: string | null
          images_urls?: Json | null
          piece_reference?: string | null
          reveal_at?: string | null
          revealed_at?: string | null
          specs?: Json | null
          status?: string | null
          title?: string | null
        }
        Update: {
          bid_count?: number | null
          bid_lock_at?: string | null
          bid_window_opens_at?: string | null
          brand_id?: string | null
          clearing_price_cents?: never
          description?: string | null
          drop_number?: number | null
          exemplaires?: number | null
          floor_price_cents?: number | null
          format?: string | null
          hero_image_url?: string | null
          id?: string | null
          images_urls?: Json | null
          piece_reference?: string | null
          reveal_at?: string | null
          revealed_at?: string | null
          specs?: Json | null
          status?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drops_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_serial_offer: {
        Args: { p_offer_id: string; p_payment_intent_id: string }
        Returns: Json
      }
      admin_expire_serial_offer: { Args: { p_offer_id: string }; Returns: Json }
      close_drop: { Args: { p_drop_id: string }; Returns: Json }
      create_serial_offer: { Args: { p_drop_id: string }; Returns: Json }
      decline_serial_offer: { Args: { p_offer_id: string }; Returns: Json }
      dispatch_reminders: { Args: never; Returns: Json }
      dispatch_ripe_drops: { Args: never; Returns: Json }
      drop_notification_recipients: {
        Args: { p_drop_id: string }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      drop_result_recipients: {
        Args: { p_drop_id: string }
        Returns: {
          email: string
          status: string
          user_id: string
        }[]
      }
      get_client_overview: {
        Args: never
        Returns: {
          bids_count: number
          created_at: string
          display_name: string
          email: string
          id: string
          kyc_status: string
          newsletter_subscribed: boolean
          orders_count: number
          total_spent_cents: number
        }[]
      }
      expire_serial_offers: { Args: never; Returns: Json }
      get_bid_audit: {
        Args: {
          p_drop?: string
          p_action?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: number
          occurred_at: string
          action: string
          drop_id: string
          drop_number: number
          drop_title: string
          drop_status: string
          user_email: string
          amount_cents: number
          bid_id: string
        }[]
      }
      get_cron_health: { Args: never; Returns: Json }
      get_maison_drop_metrics: {
        Args: { p_brand?: string }
        Returns: {
          bid_count: number
          bid_lock_at: string
          bid_window_opens_at: string
          bidders: number
          brand_id: string
          clearing_price_cents: number
          drop_id: string
          drop_number: number
          exemplaires: number
          floor_price_cents: number
          gross_cents: number
          payout_cents: number
          qualified_bids: number
          reveal_at: string
          status: string
          title: string
          units_sold: number
          watchers: number
        }[]
      }
      is_platform_admin: { Args: { uid?: string }; Returns: boolean }
      is_platform_owner: { Args: { uid?: string }; Returns: boolean }
      my_bid_for_drop: {
        Args: { p_drop_id: string }
        Returns: {
          amount_cents: number
          amount_hash: string | null
          bid_locked: boolean
          drop_id: string
          id: string
          status: string
          stripe_auth_status: string
          stripe_payment_intent_id: string | null
          submitted_at: string
          updated_at: string
          user_id: string
          withdrawn_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "bids"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      open_ripe_drops: { Args: never; Returns: Json }
      reminders_due: {
        Args: never
        Returns: {
          drop_id: string
          drop_number: number
          kind: string
          title: string
        }[]
      }
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
