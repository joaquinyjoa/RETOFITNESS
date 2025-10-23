import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabaseUrl = 'https://tylyzyivlvibfyvetchr.supabase.co';
  private supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bHl6eWl2bHZpYmZ5dmV0Y2hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODQzODIsImV4cCI6MjA3Njc2MDM4Mn0.Q0jRpYSJlunENflglEtVtKURBVn_W6KrVEaXZvnCY3o';
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }
  
}
