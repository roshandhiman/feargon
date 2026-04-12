import { supabase } from './supabase.js';

class GlobalStore {
  constructor() {
    this.user = null;
    this.profile = null;
    this.currency = localStorage.getItem('fearless_currency') || 'USD';
    
    // Multi-chat management
    const savedConversations = localStorage.getItem('fearless_conversations');
    const oldHistory = localStorage.getItem('fearless_chat_history');

    if (savedConversations) {
      this.conversations = JSON.parse(savedConversations);
      this.activeChatId = localStorage.getItem('fearless_active_chat_id');
    } else if (oldHistory) {
      // Migrate old history to new structure
      const messages = JSON.parse(oldHistory);
      const initialChat = {
        id: 'chat-' + Date.now(),
        title: 'Initial Conversation',
        messages: messages
      };
      this.conversations = [initialChat];
      this.activeChatId = initialChat.id;
      this.persistConversations();
      localStorage.removeItem('fearless_chat_history');
    } else {
      this.conversations = [];
      this.activeChatId = null;
    }

    this.listeners = [];
  }

  persistConversations() {
    localStorage.setItem('fearless_conversations', JSON.stringify(this.conversations));
    localStorage.setItem('fearless_active_chat_id', this.activeChatId);
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

  // Chat History Management
  getConversations() {
    return this.conversations;
  }

  getActiveChatId() {
    return this.activeChatId;
  }

  setActiveChat(id) {
    this.activeChatId = id;
    this.persistConversations();
    this.notify();
  }

  createNewChat() {
    const newChat = {
      id: 'chat-' + Date.now(),
      title: 'New Chat',
      messages: []
    };
    this.conversations.unshift(newChat);
    this.activeChatId = newChat.id;
    this.persistConversations();
    this.notify();
    return newChat;
  }

  getChatHistory() {
    const chat = this.conversations.find(c => c.id === this.activeChatId);
    return chat ? chat.messages : [];
  }

  saveChatMessage(role, text) {
    if (!this.activeChatId) {
      this.createNewChat();
    }
    
    const chat = this.conversations.find(c => c.id === this.activeChatId);
    if (chat) {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      chat.messages.push({ role, text, time });
      
      // Update title if it's the first user message
      if (role === 'user' && chat.title === 'New Chat') {
        chat.title = text.length > 30 ? text.substring(0, 30) + '...' : text;
      }
      
      this.persistConversations();
      this.notify();
    }
  }

  clearChatHistory() {
    if (this.activeChatId) {
      const chat = this.conversations.find(c => c.id === this.activeChatId);
      if (chat) {
        chat.messages = [];
        this.persistConversations();
        this.notify();
      }
    }
  }

  deleteChat(id) {
    this.conversations = this.conversations.filter(c => c.id !== id);
    if (this.activeChatId === id) {
      this.activeChatId = this.conversations.length > 0 ? this.conversations[0].id : null;
    }
    this.persistConversations();
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
