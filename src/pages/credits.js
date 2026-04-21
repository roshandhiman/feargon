/* ====================================
   Credits Hub Page 
   ==================================== */

import { createSidebar, createMobileMenuBtn } from '../components/sidebar.js';
import { icons, renderUserProfile } from '../utils/helpers.js';
import { supabase } from '../utils/supabase.js';
import { store } from '../utils/store.js';
import { showToast } from '../components/toast.js';

export function renderCredits(container) {
  container.innerHTML = '';

  const layout = document.createElement('div');
  layout.className = 'dashboard-layout';

  const sidebar = createSidebar();
  layout.appendChild(sidebar);

  const main = document.createElement('div');
  main.className = 'main-content';

  main.innerHTML = `
    <div class="top-navbar">
      <div style="display:flex;align-items:center;gap:var(--space-3);">
        <div id="mobile-menu-slot"></div>
        <h1 class="top-navbar-title">Credits Hub</h1>
      </div>
      <div class="top-navbar-actions">
        <button class="notification-btn">
          ${icons.bell}
        </button>
        ${renderUserProfile()}
      </div>
    </div>

    <div class="dashboard-content">
      <div class="credits-hero glass-strong animate-fade-in" style="padding: var(--space-8); border-radius: var(--radius-xl); text-align: center; margin-bottom: var(--space-8); border: 1px solid var(--accent-cyan-subtle);">
        <div style="font-size: 48px; margin-bottom: var(--space-2);">${icons.target}</div>
        <h2 style="font-size: var(--text-sm); text-transform: uppercase; letter-spacing: 2px; color: var(--text-tertiary);">Your Balance</h2>
        <h1 id="hub-credits-display" style="font-size: 64px; font-weight: 800; color: var(--accent-cyan); margin: 8px 0;">0 PTS</h1>
        <p style="color: var(--text-secondary);">Earn more by inviting your friends to the fear-free movement.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-6);">
        <!-- Referral Card -->
        <div class="glass" style="padding: var(--space-6); border-radius: var(--radius-lg);">
          <h3 style="margin-bottom: var(--space-4); display: flex; align-items: center; gap: 12px;">
            ${icons.plus}
            Earn Credits
          </h3>
          <p style="color: var(--text-secondary); margin-bottom: var(--space-6); line-height: 1.6;">
            Invite a friend using your unique referral code. When they sign up, you get <strong>50 points</strong> and they get <strong>100 points</strong>.
          </p>
          <a href="#/profile" class="btn btn-primary" style="width: 100%; justify-content: center;">Get My Referral Code</a>
        </div>

        <!-- Shop Card -->
        <div class="glass" style="padding: var(--space-6); border-radius: var(--radius-lg);">
          <h3 style="margin-bottom: var(--space-4); display: flex; align-items: center; gap: 12px;">
            ${icons.advisor}
            Spend Hub
          </h3>
          <div id="hub-shop-items" style="display: grid; gap: 12px;">
            <!-- Shop Items Dynamic -->
          </div>
        </div>
      </div>
    </div>
  `;

  layout.appendChild(main);
  container.appendChild(layout);

  const mobileSlot = main.querySelector('#mobile-menu-slot');
  if (mobileSlot) mobileSlot.appendChild(createMobileMenuBtn());

  const user = store.user;
  let currentCredits = 0;

  const shopItems = [
    { id: 'mentor', name: 'Invest Expert Mentor Session', price: 1000, icon: 'advisor', desc: '1-on-1 session with a senior mentor.' },
    { id: 'analysis', name: 'Premium Market Analysis', price: 500, icon: 'chart', desc: 'Detailed PDF reports for 30 stocks.' },
    { id: 'full-access', name: 'Lifetime Full Access', price: 5000, icon: 'autoInvest', desc: 'Unlock all automode features forever.' },
  ];

  const fetchCredits = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
    if (data) {
      currentCredits = data.credits || 0;
      main.querySelector('#hub-credits-display').textContent = `${currentCredits} PTS`;
      renderShop();
    }
  };

  const renderShop = () => {
    const shopList = main.querySelector('#hub-shop-items');
    const unlocked = JSON.parse(localStorage.getItem('unlocked_features') || '[]');

    shopList.innerHTML = shopItems.map(item => `
      <div class="glass-strong" style="padding: 16px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
        <div style="flex: 1;">
          <h4 style="font-size: 14px; margin-bottom: 4px;">${item.name}</h4>
          <p style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 0;">${item.desc}</p>
          <p style="font-size: 13px; font-weight: 700; color: var(--accent-cyan); margin-top: 4px;">${item.price} PTS</p>
        </div>
        <button class="shop-buy-btn btn btn-secondary btn-sm" 
                data-id="${item.id}" 
                data-price="${item.price}"
                ${unlocked.includes(item.id) ? 'disabled' : ''}>
          ${unlocked.includes(item.id) ? 'Unlocked' : 'Redeem'}
        </button>
      </div>
    `).join('');

    shopList.querySelectorAll('.shop-buy-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const price = parseInt(btn.dataset.price);

        if (currentCredits < price) {
          showToast('Not enough credits!', { type: 'error' });
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Processing...';

        try {
          const newBalance = currentCredits - price;
          const { error } = await supabase.from('profiles').update({ credits: newBalance }).eq('id', user.id);
          
          if (error) throw error;

          const currentUnlocked = JSON.parse(localStorage.getItem('unlocked_features') || '[]');
          currentUnlocked.push(id);
          localStorage.setItem('unlocked_features', JSON.stringify(currentUnlocked));

          showToast(`Unlocked: ${id}!`, { type: 'success' });
          fetchCredits();
        } catch (err) {
          console.error(err);
          showToast('Failed to redeem credits.', { type: 'error' });
          btn.disabled = false;
          btn.textContent = 'Redeem';
        }
      });
    });
  };

  fetchCredits();
}
