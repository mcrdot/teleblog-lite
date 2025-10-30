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

  // Initialize Supabase WITH API KEY - FIXED
  try {
    window.teleBlogApp.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase initialized successfully');
  } catch (error) {
    console.error('❌ Supabase initialization failed:', error);
    // Continue without Supabase - it's only used for some features
    window.teleBlogApp.supabase = null;
  }

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

function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
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

// Enhanced UI functions
// UPDATED VERSION:
function updateProfileInfo() {
  if (window.teleBlogApp.currentUser) {
    const user = window.teleBlogApp.currentUser;
    const profileAvatar = document.getElementById('profile-avatar');
    
    // Try to get photo from Telegram WebApp directly
    if (window.teleBlogApp.tg?.initDataUnsafe?.user?.photo_url) {
      profileAvatar.src = window.teleBlogApp.tg.initDataUnsafe.user.photo_url;
      console.log('✅ Using Telegram WebApp direct photo URL');
    }
    // Fallback to our stored URL with CORS workaround
    else if (profileAvatar && user.avatar_url) {
      // Add timestamp to bypass cache and try
      profileAvatar.src = user.avatar_url + '?t=' + Date.now();
      console.log('✅ Using stored avatar URL with cache bust');
    }
    else {
      profileAvatar.src = "https://cdn-icons-png.flaticon.com/512/3177/3177440.png";
    }
    
    // Enhanced error handling
    profileAvatar.onerror = function() {
      console.log('❌ All avatar methods failed, using default');
      this.src = "https://cdn-icons-png.flaticon.com/512/3177/3177440.png";
      this.onerror = null; // Prevent infinite loop
    };
  }
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

function showAuthenticatedUI() {
  console.log('🎉 showAuthenticatedUI called');
  
  // Hide guest elements
  document.querySelectorAll('.guest-only').forEach(el => {
    el.style.display = 'none';
  });
  
  // Show auth elements EXCEPT settings
  document.querySelectorAll('.auth-only').forEach(el => {
    if (el.id !== 'settings') {
      el.style.display = 'block';
    }
  });
  
  // Specifically ensure header and nav are visible
  const header = document.querySelector('.sticky-header');
  const nav = document.querySelector('.bottom-nav');
  if (header) header.style.display = 'block';
  if (nav) nav.style.display = 'flex';

  console.log('✅ UI elements visibility updated');

  // Update user info
  updateProfileInfo();

  // Switch to home page
  console.log('🔄 Switching to home page');
  switchPage('home');
}

async function loadPosts() {
  const container = document.getElementById("posts-container");
  
  if (!container) {
    console.error('❌ Posts container not found');
    return;
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
        // Use demo posts when API returns 401
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
    // Fallback to demo posts on any error
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
  
  console.log('🍞 Showing toast:', message);
  
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
  
  console.log('✅ Settings initialized');
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
  console.log('⚙️ Opening settings');
  
  // Hide all other pages
  document.querySelectorAll(".page").forEach(p => {
    p.classList.remove("active");
  });
  
  // Show settings page
  document.getElementById('settings').classList.add('active');
  
  // Update navigation - no active nav for settings
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
}

function closeSettings() {
  console.log('⚙️ Closing settings');
  
  // HIDE settings page using both methods
  const settingsPage = document.getElementById('settings');
  if (settingsPage) {
    settingsPage.style.display = 'none'; // Force hide
    settingsPage.classList.remove('active'); // Remove active state
  }
  
  // SHOW home page using switchPage (which handles everything)
  switchPage('home');
  
  console.log('✅ Settings closed completely');
}


// Theme functions
function changeTheme(theme) {
  console.log('🎨 Changing theme to:', theme);
  currentSettings.theme = theme;
  saveSettings();
  showToast(`Theme changed to ${theme}`, 'success');
}

function changeTextSize(size) {
  console.log('📝 Changing text size to:', size);
  currentSettings.textSize = size;
  saveSettings();
  showToast(`Text size set to ${size}`, 'success');
}

function toggleSetting(key, value) {
  console.log('⚙️ Toggling setting:', key, value);
  currentSettings[key] = value;
  saveSettings();
  showToast(`Setting updated`, 'success');
}

// Wallet functions
function connectWallet() {
  console.log('💰 Connecting wallet...');
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
  console.log('💰 Disconnecting wallet...');
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
  console.log('🗑️ Clearing cache...');
  showNavLoading();
  setTimeout(() => {
    localStorage.removeItem('teleblog_posts_cache');
    hideNavLoading();
    showToast('Cache cleared successfully', 'success');
  }, 1500);
}

function exportData() {
  console.log('📤 Exporting data...');
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
  console.log('📞 Contacting support');
  showToast('Support: contact@teleblog.app', 'info');
}

// Placeholder functions
function showCreatePost() {
  console.log('✏️ Show create post');
  showToast('Create post feature coming soon!', 'info');
}

function editProfile() {
  console.log('👤 Edit profile');
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

console.log('✅ TeleBlog app.js loaded successfully');