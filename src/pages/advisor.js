/* ====================================
   AI Advisor Chat Page
   ==================================== */

import { getBotResponse } from "../utils/gemini.js";
import { createSidebar, createMobileMenuBtn } from '../components/sidebar.js';
import { icons } from '../utils/helpers.js';
import { store } from '../utils/store.js';

const suggestions = [
  'How should I start investing?',
  'Explain portfolio diversification',
  'What is my risk level?',
  'Best strategy for long-term growth',
];

const aiResponses = [
  "That's a great question! Based on general investment principles, I'd recommend starting with a diversified portfolio that matches your risk tolerance. Consider a mix of index funds for broad market exposure, and allocate a portion to bonds for stability. The key is to start early and stay consistent with regular contributions.",
  "Diversification is one of the most powerful risk management strategies. By spreading your investments across different asset classes (stocks, bonds, real estate, commodities), sectors, and geographies, you reduce the impact of any single investment performing poorly. A well-diversified portfolio typically experiences lower volatility while maintaining solid long-term returns.",
  "Risk assessment involves evaluating several factors: your investment timeline, financial goals, current savings, income stability, and emotional comfort with market fluctuations. I'd recommend running a simulation with different scenarios to understand how various risk levels affect your potential outcomes. This data-driven approach helps remove emotion from the decision.",
  "For long-term growth, a balanced approach with regular rebalancing tends to outperform market timing. Key strategies include: dollar-cost averaging (investing fixed amounts regularly), maintaining a diversified portfolio aligned with your risk tolerance, keeping fees low with index funds, and avoiding emotional decisions during market volatility. The power of compound growth rewards patience.",
  "Understanding market cycles is crucial for informed investing. Markets historically go through expansion and contraction phases. During expansions, growth stocks tend to outperform, while defensive stocks and bonds provide stability during contractions. Having a strategy that accounts for both phases helps maintain confidence regardless of market conditions.",
];

export function renderAdvisor(container) {
  container.innerHTML = '';

  const layout = document.createElement('div');
  layout.className = 'dashboard-layout';

  const sidebar = createSidebar();
  layout.appendChild(sidebar);

  const main = document.createElement('div');
  main.className = 'main-content';
  main.style.display = 'flex';
  main.style.flexDirection = 'column';
  main.style.height = '100vh';
  main.style.overflow = 'hidden';

  main.innerHTML = `
    <div class="top-navbar">
      <div style="display:flex;align-items:center;gap:var(--space-3);">
        <div id="mobile-menu-slot"></div>
        <h1 class="top-navbar-title">AI Advisor</h1>
      </div>
      <div class="top-navbar-actions">
        <button class="notification-btn">
          ${icons.bell}
        </button>
        <div class="user-profile">
          <div class="user-avatar">R</div>
        </div>
      </div>
    </div>

    <div class="advisor-inner-layout">
      <!-- Internal Sidebar for Chat History -->
      <div class="chat-history-sidebar">
        <div class="chat-history-sidebar-header">
           <button class="new-chat-action-btn" id="new-chat">
             ${icons.sparkles}
             <span>New Chat</span>
           </button>
        </div>
        <div class="chat-history-list" id="chat-history-list">
          <!-- Rendered dynamically -->
        </div>
      </div>

      <!-- Main Chat Area -->
      <div class="chat-main-area">
        <div class="chat-header">
          <div class="chat-avatar">
            ${icons.brain}
          </div>
          <div class="chat-header-info">
            <h3>Investment AI</h3>
            <div class="chat-status">
              <span class="chat-status-dot"></span>
              Online
            </div>
          </div>
        </div>

        <div class="chat-messages" id="chat-messages">
          <!-- Welcome state or history -->
        </div>

        <div class="chat-input-area">
          <div class="chat-input-wrapper">
            <input type="text" class="chat-input" id="chat-input" placeholder="Ask about investments, risk, or strategy..." autocomplete="off" />
            <button class="chat-send-btn" id="chat-send">
              ${icons.send}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  layout.appendChild(main);
  container.appendChild(layout);

  // Mobile menu
  const mobileSlot = main.querySelector('#mobile-menu-slot');
  mobileSlot.appendChild(createMobileMenuBtn());

  // Chat state
  let messageCount = 0;
  const messagesContainer = main.querySelector('#chat-messages');
  const chatInput = main.querySelector('#chat-input');
  const sendBtn = main.querySelector('#chat-send');
  const welcome = main.querySelector('#chat-welcome');

  function addMessage(text, isUser = false, time = null) {
    // Remove welcome on first message
    if (welcome && welcome.parentNode) {
      welcome.remove();
    }

    const now = new Date();
    const displayTime = time || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const msg = document.createElement('div');
    msg.className = `chat-message ${isUser ? 'user' : 'ai'}`;
    msg.innerHTML = `
      <div class="chat-msg-avatar">${isUser ? 'U' : '✦'}</div>
      <div>
        <div class="chat-bubble">${text}</div>
        <div class="chat-time">${displayTime}</div>
      </div>
    `;

    messagesContainer.appendChild(msg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    messageCount++;
  }

  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.id = 'typing-indicator';
    typing.innerHTML = `
      <div class="chat-msg-avatar" style="background:var(--gradient-secondary);">✦</div>
      <div class="typing-dots">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    messagesContainer.appendChild(typing);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function removeTyping() {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
  }

  async function sendMessage(text) {
    if (!text.trim()) return;

    addMessage(text, true);
    store.saveChatMessage('user', text);
    chatInput.value = '';

    // Show typing
    showTyping();

    try {
      const reply = await getBotResponse(text);
      removeTyping();
      addMessage(reply);
      store.saveChatMessage('ai', reply);
    } catch (error) {
      removeTyping();
      addMessage("AI is busy right now, please try again in a moment.");
    }
  }

  // Restore history
  const history = store.getChatHistory();
  if (history.length > 0) {
    history.forEach(msg => {
      addMessage(msg.text, msg.role === 'user', msg.time);
    });
  } else {
    // Show welcome state if no message in current active chat
    messagesContainer.innerHTML = `
      <div class="chat-welcome" id="chat-welcome">
        <div class="chat-welcome-icon">
          ${icons.sparkles}
        </div>
        <h2>Investment AI Advisor</h2>
        <p>Ask me anything about investing, portfolio strategy, risk management, or market analysis.</p>
        <div class="chat-suggestions" id="chat-suggestions">
          ${suggestions.map(s => `<button class="chat-suggestion" data-suggestion="${s}">${s}</button>`).join('')}
        </div>
      </div>
    `;
  }

  // Render Sidebar List
  function renderSidebar() {
    const listContainer = main.querySelector('#chat-history-list');
    const conversations = store.getConversations();
    const activeId = store.getActiveChatId();

    listContainer.innerHTML = conversations.map(c => `
      <div class="chat-history-item ${c.id === activeId ? 'active' : ''}" data-id="${c.id}">
        <div class="chat-history-item-icon">${icons.advisor}</div>
        <div class="chat-history-item-title">${c.title}</div>
        <button class="chat-history-item-delete" data-id="${c.id}">${icons.x}</button>
      </div>
    `).join('');

    // Selection logic
    listContainer.querySelectorAll('.chat-history-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.chat-history-item-delete')) return;
        store.setActiveChat(item.dataset.id);
        renderAdvisor(container); // Re-render everything for simplicity
      });
    });

    // Delete logic
    listContainer.querySelectorAll('.chat-history-item-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this conversation?')) {
          store.deleteChat(btn.dataset.id);
          renderAdvisor(container);
        }
      });
    });
  }

  renderSidebar();

  // New Chat Logic
  const newChatBtn = main.querySelector('#new-chat');
  newChatBtn.addEventListener('click', () => {
    store.createNewChat();
    renderAdvisor(container);
  });

  // Clear current chat history (Removed from UI, logic accessible via sidebar)

  // Send on button click
  sendBtn.addEventListener('click', () => sendMessage(chatInput.value));

  // Send on Enter
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatInput.value);
    }
  });

  // Suggestion chips
  const suggestionBtns = main.querySelectorAll('.chat-suggestion');
  suggestionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sendMessage(btn.dataset.suggestion);
    });
  });
}
