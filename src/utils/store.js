import { supabase } from './supabase.js';

class GlobalStore {
  constructor() {
    this.user = null;
    this.profile = null;
    this.currency = localStorage.getItem('fearless_currency') || 'USD';
    this.listeners = [];
  }

  // Subscribe to changes
  subscribe(fn) {
    this.listeners.push(fn);
  }

  // Notify listeners
  notify() {
    this.listeners.forEach(fn => fn());
  }

  getGlobalCurrency() {
    return this.currency;
  }

  setGlobalCurrency(newCurrency) {
    this.currency = newCurrency;
    localStorage.setItem('fearless_currency', newCurrency);
    
    // Save to supabase if logged in
    if (this.user) {
      supabase.from('profiles').update({ currency: newCurrency }).eq('id', this.user.id);
    }
    this.notify();
  }

  async initializeAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    await this.handleSession(session);

    supabase.auth.onAuthStateChange(async (_event, session) => {
      await this.handleSession(session);
    });
  }

  async handleSession(session) {
    if (session && session.user) {
      this.user = session.user;
      
      // Fetch or create profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.user.id)
        .single();
        
      if (data) {
        this.profile = data;
        if (data.currency) {
           this.currency = data.currency;
           localStorage.setItem('fearless_currency', data.currency);
        }
      } else if (error && error.code === 'PGRST116') {
        // No row found, let's create it
        const name = this.user.user_metadata?.name || this.user.email.split('@')[0];
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([{ id: this.user.id, name, currency: this.currency }])
          .select()
          .single();
          
        this.profile = newProfile;
      }
    } else {
      this.user = null;
      this.profile = null;
    }
    this.notify();
  }
}

export const store = new GlobalStore();
