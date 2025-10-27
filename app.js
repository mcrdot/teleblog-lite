// app.js - TeleBlog Production Version - FIXED UI ISSUES

const API_BASE = "https://teleblog-indexjs.macrotiser-pk.workers.dev";
const SUPABASE_URL = "https://hudrcdftoqcwxskhuahg.supabase.co";

window.teleBlogApp = {
  currentUser: null,
  jwtToken: null,
  supabase: null,
  tg: null
};

// Settings and Loading Functions
let currentSettings = {};

document.addEventListener("DOMContentLoaded", async () => {
  console.log('🚀 TeleBlog App Starting...');
  
  const loading = document.getElementById("loading-overlay");
  const loginBtn = document.getElementById("telegram-login-btn");
  const devLoginBtn = document.getElementById("dev-login-btn");

  // Initialize settings first
  initializeSettings();

  // Initialize Supabase
  window.teleBlogApp.supabase = window.supabase.createClient(SUPABASE_URL, "");

  // Check for existing session first
  const savedToken = localStorage.getItem("teleblog_token");
  const savedUser = localStorage.getItem("teleblog_user");

  if (savedToken && savedUser) {
    console.log('✅ Found existing session');
    window.teleBlogApp.jwtToken = savedToken;
    window.teleBlogApp.currentUser = JSON.parse(savedUser);
    showAuthenticatedUI();
    loading.classList.remove("active");
    return;
  }

  // Initialize Telegram WebApp
  window.teleBlogApp.tg = window.Telegram?.WebApp;
  
  if (window.teleBlogApp.tg) {
    console.log('📱 Telegram WebApp detected');
    
    try {
      window.teleBlogApp.tg.ready();
      window.teleBlogApp.tg.expand();
      
      console.log('Telegram WebApp initialized:', {
        platform: window.teleBlogApp.tg.platform,
        version: window.teleBlogApp.tg.version,
        initData: window.teleBlogApp.tg.initData ? 'available' : 'missing',
        initDataUnsafe: window.teleBlogApp.tg.initDataUnsafe ? 'available' : 'missing'
      });

      // Try to authenticate with Telegram data
      await attemptTelegramAuth();
      
    } catch (error) {
      console.error('❌ Telegram init error:', error);
      showManualLogin();
    }
  } else {
    console.log('🌐 Not in Telegram environment');
    showManualLogin();
  }

  // Setup event listeners
  document.addEventListener('click', function(e) {
    // Handle Telegram login button
    if (e.target.id === 'telegram-login-btn' || e.target.closest('#telegram-login-btn')) {
      e.preventDefault();
      if (window.teleBlogApp.tg?.initData) {
        authenticateWithTelegram(window.teleBlogApp.tg.initData);
      } else {
        showToast("Telegram authentication not available in current environment", "error");
      }
    }
    
    // Handle Dev login button
    if (e.target.id === 'dev-login-btn' || e.target.closest('#dev-login-btn')) {
      e.preventDefault();
      useDevelopmentLogin();
    }
  });

  // Emergency timeout - remove loader after 8 seconds
  setTimeout(() => {
    if (loading && loading.classList.contains("active")) {
      console.log('🕒 Loader timeout - showing manual options');
      loading.classList.remove("active");
      showManualLogin();
    }
  }, 8000);
});

// DEVELOPMENT LOGIN - FIXED UI CONTROL
function useDevelopmentLogin() {
  console.log('🔧 Using development login');
  
  // Show loading immediately
  const loading = document.getElementById("loading-overlay");
  if (loading) loading.classList.add("active");
  
  // Simple dev user data
  const devUser = {
    id: "dev_001",
    username: "teleblog_developer", 
    display_name: "TeleBlog Developer",
    role: "reader",
    telegram_id: "dev_001"
  };
  
  // Set app state
  window.teleBlogApp.currentUser = devUser;
  window.teleBlogApp.jwtToken = "dev_jwt_token_teleblog_2024";
  
  // Save to localStorage
  localStorage.setItem("teleblog_user", JSON.stringify(devUser));
  localStorage.setItem("teleblog_token", "dev_jwt_token_teleblog_2024");
  
  console.log('✅ Development login data saved');
  
  // Show authenticated UI after a short delay to ensure everything is ready
  setTimeout(() => {
    if (loading) loading.classList.remove("active");
    showAuthenticatedUI();
    showToast("Development login successful! 🚀", "success");
  }, 1000);
}

async function attemptTelegramAuth() {
  const loading = document.getElementById("loading-overlay");
  const tg = window.teleBlogApp.tg;

  console.log('🔐 Attempting Telegram authentication...');

  // Method 1: Use initData if available
  if (tg.initData) {
    console.log('✅ Using initData for authentication');
    await authenticateWithTelegram(tg.initData);
    return;
  }

  // Method 2: Use initDataUnsafe as fallback
  if (tg.initDataUnsafe?.user) {
    console.log('⚠️ Using initDataUnsafe as fallback');
    const userData = tg.initDataUnsafe.user;
    const reconstructedData = reconstructInitData(userData);
    await authenticateWithTelegram(reconstructedData);
    return;
  }

  // Method 3: Try after a short delay (Telegram might be still initializing)
  setTimeout(() => {
    if (tg.initData) {
      console.log('✅ Found initData after delay');
      authenticateWithTelegram(tg.initData);
    } else {
      console.log('❌ No Telegram data available after delay');
      showManualLogin();
    }
  }, 2000);
}

function reconstructInitData(userData) {
  const data = {
    user: JSON.stringify(userData),
    auth_date: Math.floor(Date.now() / 1000),
    hash: 'reconstructed_from_unsafe'
  };
  
  return Object.keys(data)
    .map(key => `${key}=${encodeURIComponent(data[key])}`)
    .join('&');
}

async function authenticateWithTelegram(initData) {
  const loading = document.getElementById("loading-overlay");
  
  if (loading) loading.classList.add("active");
  const loginBtn = document.getElementById("telegram-login-btn");
  if (loginBtn) loginBtn.style.display = "none";

  try {
    console.log('📡 Sending auth request to server...');
    
    const response = await fetch(`${API_BASE}/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        initData,
        source: "telegram_webapp"
      }),
    });

    console.log('📨 Auth response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Auth successful:', data);

    if (data.user && data.token) {
      window.teleBlogApp.currentUser = data.user;
      window.teleBlogApp.jwtToken = data.token;
      
      localStorage.setItem("teleblog_token", data.token);
      localStorage.setItem("teleblog_user", JSON.stringify(data.user));

      showAuthenticatedUI();
      showToast(`Welcome ${data.user.display_name}!`, "success");
    } else {
      throw new Error("Invalid response: missing user or token");
    }

  } catch (error) {
    console.error("❌ Authentication failed:", error);
    showToast(`Authentication failed: ${error.message}`, "error");
    showManualLogin();
  } finally {
    if (loading) loading.classList.remove("active");
  }
}

function showManualLogin() {
  console.log('👤 Showing manual login options');
  
  const loading = document.getElementById("loading-overlay");
  const loginBtn = document.getElementById("telegram-login-btn");
  const devLoginBtn = document.getElementById("dev-login-btn");
  
  if (loading) loading.classList.remove("active");
  if (loginBtn) loginBtn.style.display = "flex";
  if (devLoginBtn) devLoginBtn.style.display = "flex";
}

// Enhanced UI functions - FIXED
function updateProfileInfo() {
  if (window.teleBlogApp.currentUser) {
    const user = window.teleBlogApp.currentUser;
    const profileName = document.getElementById('profile-name');
    const profileUsername = document.getElementById('profile-username');
    
    if (profileName) profileName.textContent = user.display_name || 'User';
    if (profileUsername) profileUsername.textContent = user.username ? `@${user.username}` : '@user';
  }
}

function logout() {
  // Clear all app data
  localStorage.removeItem("teleblog_token");
  localStorage.removeItem("teleblog_user");
  localStorage.removeItem("teleblog_settings");
  
  // Clear app state
  window.teleBlogApp.currentUser = null;
  window.teleBlogApp.jwtToken = null;
  currentSettings = {};
  
  // Show auth screen using class manipulation
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  const authPage = document.getElementById('auth');
  if (authPage) {
    authPage.classList.add('active');
  }
  
  // Force UI refresh
  setTimeout(() => {
    document.querySelectorAll('.auth-only').forEach(el => {
      el.style.display = 'none';
    });
    
    document.querySelectorAll('.guest-only').forEach(el => {
      el.style.display = 'block';
    });
  }, 100);
  
  showToast('Logged out successfully', 'info');
}

// Page navigation
function switchPage(id) {
  console.log('🔄 Switching to page:', id);
  
  // Hide all pages
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  
  // Show selected page
  const targetPage = document.getElementById(id);
  if (targetPage) {
    targetPage.classList.add("active");
  }
  
  // Update navigation
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
  const navButton = document.getElementById("nav-" + id);
  if (navButton) {
    navButton.classList.add("active");
  }
  
  // Load data for the active page
  switch(id) {
    case 'home':
      loadPosts();
      break;
    case 'profile':
      updateProfileInfo();
      break;
    case 'explore':
      showToast('Explore section coming soon!', 'info');
      break;
    case 'create':
      showToast('Ready to create amazing content!', 'info');
      break;
    case 'settings':
      // Settings page doesn't need additional loading
      break;
  }
}

// FIXED: Enhanced showAuthenticatedUI function
function showAuthenticatedUI() {
  console.log('🎉 Showing authenticated UI');
  
  // Hide all pages first
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Use inline styles to override CSS !important rules
  document.querySelectorAll('.guest-only').forEach(el => {
    el.style.display = 'none';
  });
  
  document.querySelectorAll('.auth-only').forEach(el => {
    el.style.display = 'block';
  });
  
  // Specifically ensure header and nav are visible
  const header = document.querySelector('.sticky-header');
  const nav = document.querySelector('.bottom-nav');
  if (header) header.style.display = 'block';
  if (nav) nav.style.display = 'flex';

  // Update user info
  updateProfileInfo();

  // Switch to home page
  switchPageWithLoading('home');
}

async function loadPosts() {
  const container = document.getElementById("posts-container");
  
  if (!container) {
    console.error('Posts container not found');
    return;
  }

  container.innerHTML = `
    <div style="text-align: center; padding: 40px; color: var(--text-secondary-color);">
      <div class="loader" style="margin: 0 auto 16px auto;"></div>
      Loading posts...
    </div>
  `;

  try {
    const response = await fetch(`${API_BASE}/posts`, {
      headers: {
        "Authorization": `Bearer ${window.teleBlogApp.jwtToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('📝 Loaded posts:', data.posts?.length || 0);
    
    if (data.posts && data.posts.length > 0) {
      renderPosts(data.posts);
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📰</div>
          <h3>No posts yet</h3>
          <p>Be the first to publish something amazing!</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Failed to load posts:", error);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <h3>Failed to load posts</h3>
        <p>Please check your connection and try again</p>
        <button class="btn" onclick="loadPosts()" style="margin-top: 12px;">Retry</button>
      </div>
    `;
  }
}

function renderPosts(posts) {
  const container = document.getElementById("posts-container");
  if (!container) return;
  
  container.innerHTML = posts.map(post => `
    <div class="post-card">
      <div class="post-header">
        <div class="post-meta">
          <span class="post-author">${escapeHtml(post.author || 'Unknown Author')}</span>
          <span class="post-date">${formatDate(post.date)}</span>
        </div>
      </div>
      <h3 class="post-title">${escapeHtml(post.title)}</h3>
      <p class="post-excerpt">${escapeHtml(post.excerpt || post.content?.substring(0, 120) + '...' || 'No content available')}</p>
      <div class="post-footer">
        <div class="post-stats">
          <span>❤️ ${post.like_count || 0}</span>
          <span>👁️ ${post.view_count || 0}</span>
        </div>
        <span class="read-time">${post.read_time || '1 min read'}</span>
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return 'Unknown date';
  }
}

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;
  
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 5000);
}

// Settings Functions
function initializeSettings() {
  const savedSettings = localStorage.getItem('teleblog_settings');
  if (savedSettings) {
    currentSettings = JSON.parse(savedSettings);
    applySettings();
  } else {
    currentSettings = {
      theme: 'telegram-native',
      textSize: 'medium',
      autoLoadImages: true,
      pushNotifications: true,
      emailDigest: false,
      walletConnected: false
    };
    saveSettings();
  }
  
  const buildDateElement = document.getElementById('build-date');
  if (buildDateElement) {
    buildDateElement.textContent = new Date().toLocaleDateString();
  }
}

function saveSettings() {
  localStorage.setItem('teleblog_settings', JSON.stringify(currentSettings));
  applySettings();
}

function applySettings() {
  document.documentElement.setAttribute('data-theme', currentSettings.theme);
  document.documentElement.setAttribute('data-text-size', currentSettings.textSize);
  
  const themeSelector = document.getElementById('theme-selector');
  const textSizeSelector = document.getElementById('text-size');
  const autoLoadImages = document.getElementById('auto-load-images');
  const pushNotifications = document.getElementById('push-notifications');
  const emailDigest = document.getElementById('email-digest');
  
  if (themeSelector) themeSelector.value = currentSettings.theme;
  if (textSizeSelector) textSizeSelector.value = currentSettings.textSize;
  if (autoLoadImages) autoLoadImages.checked = currentSettings.autoLoadImages;
  if (pushNotifications) pushNotifications.checked = currentSettings.pushNotifications;
  if (emailDigest) emailDigest.checked = currentSettings.emailDigest;
  
  updateWalletStatus();
}

// Settings modal functions
function openSettings() {
  switchPageWithLoading('settings');
}

function closeSettings() {
  switchPageWithLoading('home');
}

// Theme functions
function changeTheme(theme) {
  currentSettings.theme = theme;
  saveSettings();
  showToast(`Theme changed to ${theme}`, 'success');
}

function changeTextSize(size) {
  currentSettings.textSize = size;
  saveSettings();
  showToast(`Text size set to ${size}`, 'success');
}

function toggleSetting(key, value) {
  currentSettings[key] = value;
  saveSettings();
  showToast(`Setting updated`, 'success');
}

// Wallet functions
function connectWallet() {
  showNavLoading();
  setTimeout(() => {
    currentSettings.walletConnected = true;
    saveSettings();
    hideNavLoading();
    showToast('TON Wallet connected successfully!', 'success');
  }, 2000);
}

function updateWalletStatus() {
  const walletStatus = document.getElementById('wallet-status');
  const walletBtn = document.getElementById('wallet-btn');
  
  if (walletStatus && walletBtn) {
    if (currentSettings.walletConnected) {
      walletStatus.textContent = 'Connected';
      walletBtn.textContent = 'Disconnect';
      walletBtn.onclick = disconnectWallet;
    } else {
      walletStatus.textContent = 'Not connected';
      walletBtn.textContent = 'Connect';
      walletBtn.onclick = connectWallet;
    }
  }
}

function disconnectWallet() {
  showNavLoading();
  setTimeout(() => {
    currentSettings.walletConnected = false;
    saveSettings();
    hideNavLoading();
    showToast('TON Wallet disconnected', 'info');
  }, 1500);
}

// Data functions
function clearCache() {
  showNavLoading();
  setTimeout(() => {
    localStorage.removeItem('teleblog_posts_cache');
    hideNavLoading();
    showToast('Cache cleared successfully', 'success');
  }, 1500);
}

function exportData() {
  showNavLoading();
  setTimeout(() => {
    const exportData = {
      user: window.teleBlogApp.currentUser,
      settings: currentSettings,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `teleblog-export-${new Date().getTime()}.json`;
    link.click();
    
    hideNavLoading();
    showToast('Data exported successfully', 'success');
  }, 2000);
}

function contactSupport() {
  showToast('Support: contact@teleblog.app', 'info');
}

// Navigation loading functions
function showNavLoading() {
  const navLoading = document.getElementById('nav-loading');
  if (navLoading) {
    navLoading.classList.add('active');
  }
}

function hideNavLoading() {
  const navLoading = document.getElementById('nav-loading');
  if (navLoading) {
    navLoading.classList.remove('active');
  }
}

function switchPageWithLoading(pageId) {
  showNavLoading();
  setTimeout(() => {
    switchPage(pageId);
    hideNavLoading();
  }, 1500);
}

function loadPostsWithLoading() {
  showNavLoading();
  setTimeout(() => {
    loadPosts();
    hideNavLoading();
  }, 1500);
}

// Placeholder functions
function showCreatePost() {
  showToast('Create post feature coming soon!', 'info');
}

function editProfile() {
  showToast('Profile editing coming soon!', 'info');
}

// Make functions globally available for onclick handlers
window.useDevelopmentLogin = useDevelopmentLogin;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.switchPageWithLoading = switchPageWithLoading;
window.loadPostsWithLoading = loadPostsWithLoading;
window.showCreatePost = showCreatePost;
window.editProfile = editProfile;
window.logout = logout;
window.connectWallet = connectWallet;
window.disconnectWallet = disconnectWallet;
window.clearCache = clearCache;
window.exportData = exportData;
window.contactSupport = contactSupport;
window.changeTheme = changeTheme;
window.changeTextSize = changeTextSize;
window.toggleSetting = toggleSetting;