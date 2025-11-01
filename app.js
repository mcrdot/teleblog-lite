// app.js - TeleBlog Production Version - SUPABASE FIXED
console.log('🚀 TeleBlog App Loading...');

const API_BASE = "https://teleblog-indexjs.macrotiser-pk.workers.dev";
const SUPABASE_URL = "https://hudrcdftoqcwxskhuahg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZHJjZGZ0b3Fjd3hza2h1YWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwOTMwNjcsImV4cCI6MjA3MTY2OTA2N30.YqGQBcFC2oVJILZyvVP7OgPlOOkuqO6eF1QaABb7MCo";

window.teleBlogApp = {
  currentUser: null,
  jwtToken: null,
  supabase: null,
  tg: null
};

// Settings and Loading Functions
let currentSettings = {};

// SIMPLE LOADER OVERRIDES - DO NOTHING
window.showNavLoading = function() { 
  console.log('🔄 Nav loading (disabled)'); 
};
window.hideNavLoading = function() { 
  console.log('🔄 Nav loading hidden (disabled)'); 
};
window.switchPageWithLoading = function(pageId) { 
  console.log('🔄 Switching to page:', pageId);
  switchPage(pageId); 
};
window.loadPostsWithLoading = function() { 
  console.log('🔄 Loading posts directly');
  loadPosts(); 
};

// ----- supa6ase false -----
let supabaseInitialized = false;

// ----------------------------------------

// Page Navigation System
function navigateTo(page) {
  console.log('🧭 Navigating to:', page);
  showNavLoading();
  
  setTimeout(() => {
    window.location.href = page;
  }, 300);
}

// UNIFIED openSettings FUNCTION - Single implementation
function openSettings() {
  console.log('⚙️ Opening settings');
  navigateTo('settings.html');
}

// Update showAuthenticatedUI to redirect to home
function showAuthenticatedUI() {
  console.log('🎉 showAuthenticatedUI called');
  
  const currentPage = window.location.pathname.split('/').pop();
  
  if (currentPage === 'index.html' || currentPage === '' || currentPage === 'teleblog-lite/') {
    // We're on login page, redirect to home
    console.log('🔄 Redirecting to home page...');
    navigateTo('home.html');
    return;
  }
  
  // If we're already on an app page, just update UI
  document.querySelectorAll('.guest-only').forEach(el => {
    el.style.display = 'none';
  });
  
  document.querySelectorAll('.auth-only').forEach(el => {
    if (el.id !== 'settings') {
      el.style.display = 'block';
    }
  });

  const header = document.querySelector('.sticky-header');
  const nav = document.querySelector('.bottom-nav');
  if (header) header.style.display = 'block';
  if (nav) nav.style.display = 'flex';

  console.log('✅ UI elements visibility updated');
}

// Updated DOMContentLoaded with page initialization
document.addEventListener("DOMContentLoaded", async () => {
  const currentPage = window.location.pathname.split('/').pop();
  console.log('📍 Current page:', currentPage);
  
  // Initialize settings first
  initializeSettings();
  
  // Initialize Supabase ONLY if supabase CDN is available
  if (!supabaseInitialized && window.supabase && window.supabase.createClient) {
    try {
      window.teleBlogApp.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      supabaseInitialized = true;
      console.log('✅ Supabase initialized successfully');
    } catch (error) {
      console.error('❌ Supabase initialization failed:', error);
      window.teleBlogApp.supabase = null;
    }
  }

  // Check authentication
  const validToken = localStorage.getItem("teleblog_token");
  const validUser = localStorage.getItem("teleblog_user");

  if (validToken && validUser) {
    console.log('✅ Found valid existing session');
    window.teleBlogApp.jwtToken = validToken;
    window.teleBlogApp.currentUser = JSON.parse(validUser);
    
    if (currentPage === 'index.html' || currentPage === '' || currentPage === 'teleblog-lite/') {
      // Redirect authenticated users from login page to home
      showAuthenticatedUI();
    } else {
      // Initialize the specific page AND show authenticated UI
      showAuthenticatedUI(); // This ensures header/nav are visible
      initializePage(currentPage);
    }
  } else {
    console.log('❌ No valid session found');
    if (currentPage !== 'index.html' && currentPage !== '' && currentPage !== 'teleblog-lite/') {
      // Redirect unauthenticated users to login
      console.log('🔒 Redirecting to login...');
      window.location.href = 'index.html';
    } else {
      // Show login page
      initializeTelegramAuth();
    }
  }
});

// Enhanced initializePage function
function initializePage(pageName) {
  console.log('🚀 Initializing page:', pageName);
  
  // Small delay to ensure DOM is fully ready
  setTimeout(() => {
    switch(pageName) {
      case 'home.html':
        initializeHomePage();
        break;
      case 'profile.html':
        initializeProfilePage();
        break;
      case 'explore.html':
        initializeExplorePage();
        break;
      case 'create.html':
        initializeCreatePage();
        break;
      case 'settings.html':
        initializeSettingsPage();
        break;
      default:
        console.log('⚠️ Unknown page, trying to detect...');
        // Fallback: try to detect page by ID
        detectAndInitializePage();
    }
  }, 100);
}

// Fallback page detection
function detectAndInitializePage() {
  const pages = ['home', 'profile', 'explore', 'create', 'settings'];
  for (let page of pages) {
    const element = document.getElementById(page);
    if (element && element.classList.contains('active')) {
      console.log(`🎯 Detected active page: ${page}`);
      initializePage(`${page}.html`);
      return;
    }
  }
  console.log('❌ Could not detect active page');
}

function initializeCreatePage() {
  console.log('✏️ Initializing create page');
  // Add create page initialization here
}

function initializeSettingsPage() {
  console.log('⚙️ Initializing settings page');
  // Settings are already initialized by initializeSettings()
}

// Updated DOMContentLoaded Section:
document.addEventListener("DOMContentLoaded", async () => {
  console.log('✅ DOM Content Loaded');
  
  // Load saved avatar when app starts
  loadSavedAvatar();

  // ===== TEMPORARY FIX: Check token validity =====
  const savedToken = localStorage.getItem("teleblog_token");
  const savedUser = localStorage.getItem("teleblog_user");
  
  // If token exists but is NOT our dev token, clear it (it's invalid)
  if (savedToken && savedToken !== "dev_jwt_token_teleblog_2024") {
    console.log('🔄 Clearing invalid token and forcing fresh login');
    localStorage.removeItem("teleblog_token");
    localStorage.removeItem("teleblog_user");
    // Don't return here - let the app continue to show login screen
  }
  // ===== END TEMPORARY FIX =====
  
  // Initialize settings first
  initializeSettings();
  console.log('✅ Settings initialized');

  // Check for existing session first (AFTER our token check above)
  const validToken = localStorage.getItem("teleblog_token"); // Check again after potential clear
  const validUser = localStorage.getItem("teleblog_user");

  if (validToken && validUser) {
    console.log('✅ Found valid existing session');
    window.teleBlogApp.jwtToken = validToken;
    window.teleBlogApp.currentUser = JSON.parse(validUser);
    showAuthenticatedUI();
    return;
  }

  console.log('❌ No valid session found - showing login');

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
        initData: window.teleBlogApp.tg.initData ? 'available' : 'missing'
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
      console.log('🔐 Telegram login button clicked');
      if (window.teleBlogApp.tg?.initData) {
        authenticateWithTelegram(window.teleBlogApp.tg.initData);
      } else {
        showToast("Telegram authentication not available in current environment", "error");
      }
    }
    
    // Handle Dev login button
    if (e.target.id === 'dev-login-btn' || e.target.closest('#dev-login-btn')) {
      e.preventDefault();
      console.log('🚀 Quick Test Login button clicked');
      useDevelopmentLogin();
    }
  });
});

// DEVELOPMENT LOGIN - FIXED AND WORKING
function useDevelopmentLogin() {
  console.log('🎯 useDevelopmentLogin TRIGGERED');
  
  showToast("Login process starting...", "info");
  
  // Simple dev user data
  const devUser = {
    id: "dev_001",
    username: "teleblog_developer", 
    display_name: "TeleBlog Developer",
    role: "reader",
    telegram_id: "dev_001"
  };
  
  console.log('👤 Dev user created:', devUser);
  
  // Set app state
  window.teleBlogApp.currentUser = devUser;
  window.teleBlogApp.jwtToken = "dev_jwt_token_teleblog_2024";
  
  console.log('💾 Saving to localStorage...');
  
  // Save to localStorage
  localStorage.setItem("teleblog_user", JSON.stringify(devUser));
  localStorage.setItem("teleblog_token", "dev_jwt_token_teleblog_2024");
  
  console.log('✅ localStorage saved');
  console.log('🔄 Calling showAuthenticatedUI...');
  
  // IMMEDIATELY show authenticated UI
  showAuthenticatedUI();
  showToast("Development login successful! 🚀", "success");
  
  console.log('✅ Login process completed');
}

async function attemptTelegramAuth() {
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

  // Method 3: Try after a short delay
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
  console.log('📡 Starting Telegram authentication...');
  
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
      
      // 🎯 STEP 3: PRE-CACHE THE AVATAR IMMEDIATELY AFTER LOGIN
      if (data.user.id && data.user.avatar_url) {
        console.log('💾 Pre-caching avatar after login...');
        cacheUserAvatar(data.user.id, data.user.avatar_url);
      }
      
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
  }
}

function showManualLogin() {
  console.log('👤 Showing manual login options');
  
  const loginBtn = document.getElementById("telegram-login-btn");
  const devLoginBtn = document.getElementById("dev-login-btn");
  
  if (loginBtn) loginBtn.style.display = "flex";
  if (devLoginBtn) devLoginBtn.style.display = "flex";
  
  console.log('✅ Login buttons shown');
}

// Save profile to Supabase backend
async function saveProfileToBackend(profileData) {
  try {
    const response = await fetch(`${API_BASE}/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.teleBlogApp.jwtToken}`
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      throw new Error('Failed to save profile to server');
    }

    return await response.json();
  } catch (error) {
    console.error('Backend profile save error:', error);
    throw error;
  }
}

// Upload avatar to Supabase Storage
async function uploadAvatarToSupabase(base64Image) {
  try {
    // Convert base64 to blob
    const response = await fetch(base64Image);
    const blob = await response.blob();
    
    // Create filename
    const fileName = `avatars/${window.teleBlogApp.currentUser.id}_${Date.now()}.jpg`;
    
    // Upload to Supabase
    const { data, error } = await window.teleBlogApp.supabase.storage
      .from('user-assets')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = window.teleBlogApp.supabase.storage
      .from('user-assets')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw error;
  }
}

// PROFILE EDIT
// Profile Edit Functions
// Enhanced editProfile function
function editProfile() {
  console.log('👤 Opening profile editor');
  
  // Close any existing modal first
  closeProfileEditor();
  
  // Create edit form modal
  const modalHTML = `
    <div class="modal-overlay" id="profile-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Edit Profile</h3>
          <button class="modal-close" onclick="closeProfileEditor()">×</button>
        </div>
        
        <div class="profile-edit-form">
          <div class="form-group">
            <label>Profile Picture</label>
            <div class="avatar-upload-section">
              <div class="avatar-preview">
                <img id="modal-avatar" src="${document.getElementById('profile-avatar')?.src || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'}" alt="Current Avatar" />
                <button type="button" class="btn btn-outline btn-small" onclick="document.getElementById('modal-avatar-upload').click()">
                  Change Photo
                </button>
                <input type="file" id="modal-avatar-upload" accept="image/*" style="display: none;" />
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="edit-display-name">Display Name</label>
            <input type="text" id="edit-display-name" class="form-input" 
                   value="${window.teleBlogApp.currentUser?.display_name || ''}" 
                   placeholder="Enter your display name" />
          </div>
          
          <div class="form-group">
            <label for="edit-username">Username</label>
            <input type="text" id="edit-username" class="form-input" 
                   value="${window.teleBlogApp.currentUser?.username || ''}" 
                   placeholder="Enter username (without @)" />
          </div>
          
          <div class="form-group">
            <label for="edit-bio">Bio</label>
            <textarea id="edit-bio" class="form-input" rows="3" placeholder="Tell everyone about yourself...">${window.teleBlogApp.currentUser?.bio || ''}</textarea>
          </div>
          
          <div class="form-actions">
            <button class="btn btn-primary" onclick="saveProfile()">Save Changes</button>
            <button class="btn btn-secondary" onclick="closeProfileEditor()">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Setup modal image upload
  setupModalImageUpload();
}

// Setup modal-specific image upload
function setupModalImageUpload() {
  const uploadInput = document.getElementById('modal-avatar-upload');
  if (uploadInput) {
    uploadInput.addEventListener('change', handleModalImageUpload);
  }
}

async function handleModalImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    // Validate and process image
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size should be less than 2MB', 'error');
      return;
    }
    
    const base64 = await convertToBase64(file);
    
    // Update modal preview
    const modalAvatar = document.getElementById('modal-avatar');
    if (modalAvatar) {
      modalAvatar.src = base64;
    }
    
    // Update main profile avatar preview
    const profileAvatar = document.getElementById('profile-avatar');
    if (profileAvatar) {
      profileAvatar.src = base64;
    }
    
    // Save to localStorage immediately
    localStorage.setItem('user_avatar', base64);
    
    showToast('Profile picture updated!', 'success');
    
  } catch (error) {
    console.error('Modal image upload error:', error);
    showToast('Failed to upload image', 'error');
  }
}

// Add image compression for better performance
function compressImage(base64, maxWidth = 200, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    
    img.onerror = function() {
      resolve(base64); // Fallback to original
    };
  });
}

// Enhanced convertToBase64 with compression
async function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        // Compress image before saving
        const compressedBase64 = await compressImage(reader.result);
        resolve(compressedBase64);
      } catch (error) {
        resolve(reader.result); // Fallback to original
      }
    };
    reader.onerror = error => reject(error);
  });
}

async function saveProfile() {
  const displayName = document.getElementById('edit-display-name')?.value.trim();
  const username = document.getElementById('edit-username')?.value.trim();
  const bio = document.getElementById('edit-bio')?.value.trim();
  
  if (!displayName) {
    showToast('Display name is required', 'error');
    return;
  }
  
  try {
    showToast('Saving profile...', 'info');
    
    // Get current avatar (could be base64 or URL)
    let avatarUrl = document.getElementById('profile-avatar')?.src;
    
    // If avatar is base64 (new upload), save to Supabase
    if (avatarUrl && avatarUrl.startsWith('data:image')) {
      showToast('Uploading profile picture...', 'info');
      avatarUrl = await uploadAvatarToSupabase(avatarUrl);
    }
    
    // Prepare profile data
    const profileData = {
      display_name: displayName,
      username: username,
      bio: bio,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    };
    
    // Update app state
    window.teleBlogApp.currentUser = {
      ...window.teleBlogApp.currentUser,
      ...profileData
    };
    
    // Save to localStorage (immediate UI update)
    localStorage.setItem('teleblog_user', JSON.stringify(window.teleBlogApp.currentUser));
    
    // Save to Supabase backend
    await saveProfileToBackend(profileData);
    
    // Update UI
    updateProfileInfo();
    
    // Close modal
    closeProfileEditor();
    
    showToast('Profile updated successfully! 🎉', 'success');
    
  } catch (error) {
    console.error('Profile save error:', error);
    showToast('Failed to save profile. Using local storage only.', 'warning');
    
    // Fallback: still update local state even if backend fails
    const displayName = document.getElementById('edit-display-name')?.value.trim();
    const username = document.getElementById('edit-username')?.value.trim();
    
    if (displayName) {
      window.teleBlogApp.currentUser.display_name = displayName;
      window.teleBlogApp.currentUser.username = username;
      localStorage.setItem('teleblog_user', JSON.stringify(window.teleBlogApp.currentUser));
      updateProfileInfo();
      closeProfileEditor();
    }
  }
}

function closeProfileEditor() {
  const modal = document.getElementById('profile-modal');
  if (modal) {
    modal.remove();
  }
}

// Load saved avatar on app start
function loadSavedAvatar() {
  const savedAvatar = localStorage.getItem('user_avatar');
  if (savedAvatar) {
    const profileAvatar = document.getElementById('profile-avatar');
    if (profileAvatar) {
      profileAvatar.src = savedAvatar;
    }
  }
}

// ==================== 
// PROFILE PHOTO CACHING SYSTEM
// ====================

// Generate unique cache key for each user
function getAvatarCacheKey(userId) {
  return `teleblog_avatar_${userId}`;
}

// Save avatar to localStorage with timestamp
function cacheUserAvatar(userId, avatarUrl) {
  try {
    const cacheData = {
      url: avatarUrl,
      timestamp: Date.now(),
      userId: userId
    };
    localStorage.setItem(getAvatarCacheKey(userId), JSON.stringify(cacheData));
    console.log('💾 Avatar cached for user:', userId);
    return true;
  } catch (error) {
    console.error('❌ Avatar caching failed:', error);
    return false;
  }
}

// Get cached avatar (check if expired)
function getCachedAvatar(userId, maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
  try {
    const cached = localStorage.getItem(getAvatarCacheKey(userId));
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    const isExpired = Date.now() - cacheData.timestamp > maxAge;
    
    if (isExpired) {
      console.log('🕐 Cached avatar expired for user:', userId);
      return null;
    }
    
    console.log('⚡ Loading avatar from cache for user:', userId);
    return cacheData.url;
  } catch (error) {
    console.error('❌ Avatar cache read failed:', error);
    return null;
  }
}

// Clear specific user's avatar cache
function clearAvatarCache(userId) {
  localStorage.removeItem(getAvatarCacheKey(userId));
  console.log('🗑️ Cleared avatar cache for user:', userId);
}

// ----------------------------------
// Enhanced UI functions
// UPDATED VERSION:
function updateProfileInfo() {
  if (window.teleBlogApp.currentUser) {
    const user = window.teleBlogApp.currentUser;
    const profileName = document.getElementById('profile-name');
    const profileUsername = document.getElementById('profile-username');
    const profileAvatar = document.getElementById('profile-avatar');
    
    if (profileName) profileName.textContent = user.display_name || 'User';
    if (profileUsername) {
      profileUsername.textContent = user.username ? `${user.username}` : '@user';
    }
    
    // ========== INSTANT AVATAR LOADING SYSTEM ==========
    if (profileAvatar && user.id) {
      // STEP 1: Try to load from cache INSTANTLY
      const cachedAvatar = getCachedAvatar(user.id);
      
      if (cachedAvatar) {
        // ⚡ INSTANT LOAD: Set cached avatar immediately
        profileAvatar.src = cachedAvatar;
        console.log('⚡ Avatar loaded instantly from cache');
        
        // Add success handler for cached image
        profileAvatar.onload = function() {
          console.log('✅ Cached avatar displayed successfully');
        };
        
        profileAvatar.onerror = function() {
          console.log('❌ Cached avatar failed, fetching fresh...');
          // If cached image fails, fetch fresh and update cache
          loadFreshAvatar(user, profileAvatar);
        };
        
      } else {
        // STEP 2: No cache exists, load fresh
        console.log('🔄 No cached avatar found, loading fresh...');
        loadFreshAvatar(user, profileAvatar);
      }
    }
    // ========== END INSTANT AVATAR SYSTEM ==========
    
    console.log('✅ Profile info updated:', user.display_name);
  }
}

// New function to handle fresh avatar loading
function loadFreshAvatar(user, profileAvatar) {
  if (!user.avatar_url) {
    profileAvatar.src = "https://cdn-icons-png.flaticon.com/512/3177/3177440.png";
    return;
  }
  
  // Use proxy URL for fresh loading
  const telegramPath = user.avatar_url.replace('https://', '');
  const proxyUrl = `${API_BASE}/proxy/avatar/${encodeURIComponent(telegramPath)}`;
  
  console.log('🔄 Loading fresh avatar:', proxyUrl);
  profileAvatar.src = proxyUrl;
  
  // Handle successful fresh load
  profileAvatar.onload = function() {
    console.log('✅ Fresh avatar loaded successfully');
    
    // 🎯 CRITICAL: Cache the successful avatar URL
    if (user.id && user.avatar_url) {
      cacheUserAvatar(user.id, user.avatar_url); // Cache the original URL, not proxy
      console.log('💾 Fresh avatar cached for future instant loading');
    }
  };
  
  // Handle fresh load failure
  profileAvatar.onerror = function() {
    console.log('❌ Fresh avatar failed, using fallback');
    this.src = "https://cdn-icons-png.flaticon.com/512/3177/3177440.png";
  };
}

function logout() {
  console.log('🚪 Logging out...');
  
  // Clear all app data
  localStorage.removeItem("teleblog_token");
  localStorage.removeItem("teleblog_user");
  localStorage.removeItem("teleblog_settings");
  
  // Clear app state
  window.teleBlogApp.currentUser = null;
  window.teleBlogApp.jwtToken = null;
  currentSettings = {};
  
  // Show auth screen
  document.querySelectorAll('.auth-only').forEach(el => {
    el.style.display = 'none';
  });
  
  document.querySelectorAll('.guest-only').forEach(el => {
    el.style.display = 'block';
  });
  
  const authPage = document.getElementById('auth');
  if (authPage) authPage.classList.add('active');
  
  showToast('Logged out successfully', 'info');
  console.log('✅ Logout completed');
}

// Page navigation
function switchPage(id) {
  console.log('🔄 Switching to page:', id);
  
  // Hide all pages
  document.querySelectorAll(".page").forEach(p => {
    p.classList.remove("active");
  });
  
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
  }
  
  console.log('✅ Page switched to:', id);
}

// Replace the loadPosts function in app.js:
async function loadPosts() {
  // Check if we're on the home page and posts container exists
  const container = document.getElementById("posts-container");
  
  if (!container) {
    console.log('⚠️ Not on home page or posts container not found');
    return; // Silently return if not on home page
  }

  console.log('📝 Loading posts...');

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

    console.log('📨 Posts response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        console.log('⚠️ API returned 401 - Using demo posts instead');
        showDemoPosts();
        return;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('📝 Loaded posts:', data.posts?.length || 0);
    
    if (data.posts && data.posts.length > 0) {
      renderPosts(data.posts);
    } else {
      showEmptyState();
    }
  } catch (error) {
    console.error("❌ Failed to load posts:", error);
    showDemoPosts();
  }
}

// Add these new helper functions:
function showDemoPosts() {
  const container = document.getElementById("posts-container");
  if (!container) return;
  
  console.log('🎭 Showing demo posts');
  
  const demoPosts = [
    {
      id: "1",
      title: "Welcome to TeleBlog!",
      content: "This is your personal blogging space inside Telegram. Start writing your thoughts, share your knowledge, and connect with readers worldwide.",
      excerpt: "Welcome to your personal blogging space inside Telegram...",
      author: "TeleBlog Team",
      author_id: "system",
      date: new Date().toISOString(),
      view_count: 42,
      like_count: 15,
      read_time: "1 min read",
      tags: ["welcome", "introduction"]
    },
    {
      id: "2", 
      title: "How to Create Your First Post",
      content: "Creating posts in TeleBlog is simple and intuitive. Just navigate to the Create section and start writing. You can format your text, add images, and publish instantly.",
      excerpt: "Learn how to create your first blog post in TeleBlog...",
      author: "TeleBlog Team",
      author_id: "system",
      date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      view_count: 28,
      like_count: 8,
      read_time: "2 min read",
      tags: ["tutorial", "getting-started"]
    },
    {
      id: "3",
      title: "Why Blogging on Telegram?",
      content: "Telegram offers instant distribution, built-in audience, and seamless mobile experience. Combine this with powerful blogging features and you have the perfect platform for content creators.",
      excerpt: "Discover the benefits of blogging on the Telegram platform...",
      author: "TeleBlog Team", 
      author_id: "system",
      date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      view_count: 56,
      like_count: 23,
      read_time: "3 min read",
      tags: ["benefits", "telegram"]
    }
  ];
  
  renderPosts(demoPosts);
  showToast("Showing demo content - API authentication required for real posts", "info");
}

function showEmptyState() {
  const container = document.getElementById("posts-container");
  if (!container) return;
  
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">📰</div>
      <h3>No posts yet</h3>
      <p>Be the first to publish something amazing!</p>
      <button class="btn btn-primary" onclick="showCreatePost()" style="margin-top: 16px;">
        Create Your First Post
      </button>
    </div>
  `;
}

function renderPosts(posts) {
  const container = document.getElementById("posts-container");
  if (!container) return;
  
  console.log('🎨 Rendering posts:', posts.length);
  
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

// Add these utility functions:
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  
  return date.toLocaleDateString();
}

function showCreatePost() {
  console.log('📝 Opening post creator');
  switchPage('create');
}

// Toast notification system
function showToast(message, type = "info") {
  console.log(`🍞 Toast [${type}]: ${message}`);
  
  // Remove existing toasts
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => toast.remove());
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-message">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  document.body.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 5000);
}

// Settings functions
function initializeSettings() {
  console.log('⚙️ Initializing settings system');
  
  // Load saved settings or use defaults
  const savedSettings = localStorage.getItem('teleblog_settings');
  
  if (savedSettings) {
    currentSettings = JSON.parse(savedSettings);
    console.log('📖 Loaded saved settings:', currentSettings);
  } else {
    // Default settings
    currentSettings = {
      theme: 'auto',
      notifications: true,
      language: 'english',
      autoSave: true,
      fontSize: 'medium'
    };
    console.log('📝 Using default settings');
  }
  
  // Apply settings immediately
  applySettings();
}

function initializeSettingsPage() {
  console.log('⚙️ Initializing settings page UI');
  
  // Set current values in form
  if (document.getElementById('theme-selector')) {
    document.getElementById('changeTheme').value = currentSettings.theme;
  }
  
  if (document.getElementById('notifications-toggle')) {
    document.getElementById('notifications-toggle').checked = currentSettings.notifications;
  }
  
  if (document.getElementById('language-select')) {
    document.getElementById('language-select').value = currentSettings.language;
  }
  
  if (document.getElementById('auto-save-toggle')) {
    document.getElementById('auto-save-toggle').checked = currentSettings.autoSave;
  }
  
  if (document.getElementById('font-size-select')) {
    document.getElementById('font-size-select').value = currentSettings.fontSize;
  }
  
  // Add event listeners
  document.querySelectorAll('#settings-form input, #settings-form select').forEach(element => {
    element.addEventListener('change', saveSettings);
  });
  
  console.log('✅ Settings page initialized');
}

function saveSettings() {
  console.log('💾 Saving settings...');
  
  // Get values from form
  currentSettings = {
    theme: document.getElementById('theme-selector')?.value || 'auto',
    notifications: document.getElementById('notifications-toggle')?.checked || true,
    language: document.getElementById('language-select')?.value || 'english',
    autoSave: document.getElementById('auto-save-toggle')?.checked || true,
    fontSize: document.getElementById('font-size-select')?.value || 'medium'
  };
  
  // Save to localStorage
  localStorage.setItem('teleblog_settings', JSON.stringify(currentSettings));
  
  // Apply settings
  applySettings();
  
  showToast('Settings saved successfully!', 'success');
  console.log('✅ Settings saved:', currentSettings);
}

function applySettings() {
  console.log('🎨 Applying settings...');
  
  // Apply theme
  if (currentSettings.theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (currentSettings.theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    // Auto theme - follow system preference
    document.documentElement.removeAttribute('data-theme');
  }
  
  // Apply font size
  document.documentElement.style.fontSize = getFontSizeValue(currentSettings.fontSize);
  
  console.log('✅ Settings applied');
}

function getFontSizeValue(size) {
  const sizes = {
    'small': '14px',
    'medium': '16px',
    'large': '18px',
    'xlarge': '20px'
  };
  return sizes[size] || '16px';
}

// Initialize Telegram auth
function initializeTelegramAuth() {
  console.log('🤖 Initializing Telegram authentication');
  
  // Check if we're in Telegram environment
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    window.teleBlogApp.tg = tg;
    
    tg.ready();
    tg.expand();
    
    console.log('✅ Telegram WebApp initialized:', {
      platform: tg.platform,
      version: tg.version
    });
    
    // Try to authenticate with Telegram
    attemptTelegramAuth();
  } else {
    console.log('🌐 Not in Telegram environment - showing manual login');
    showManualLogin();
  }
}

// Initialize page-specific functions
function initializeHomePage() {
  console.log('🏠 Initializing home page');
  loadPosts();
}

function initializeProfilePage() {
  console.log('👤 Initializing profile page');
  updateProfileInfo();
}

function initializeExplorePage() {
  console.log('🔍 Initializing explore page');
  // Add explore page initialization here
}

// Add this new function to handle avatar loading
function loadUserAvatar(userId, avatarUrl, targetElement) {
  if (!targetElement) return;
  
  // Try cached version first
  const cachedAvatar = getCachedAvatar(userId);
  if (cachedAvatar) {
    targetElement.src = cachedAvatar;
    return;
  }
  
  // Load fresh and cache
  if (avatarUrl) {
    const telegramPath = avatarUrl.replace('https://', '');
    const proxyUrl = `${API_BASE}/proxy/avatar/${encodeURIComponent(telegramPath)}`;
    
    targetElement.src = proxyUrl;
    targetElement.onload = () => {
      cacheUserAvatar(userId, avatarUrl);
    };
  }
}

console.log('✅ TeleBlog App Script Loaded Successfully!');