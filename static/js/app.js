// Page initialization after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize based on current page or URL hash
  initializePageByRoute();
  
  // 监听 hashchange 事件以处理路由变化
  window.addEventListener('hashchange', function() {
    initializePageByRoute();
  });
  
  // 确保昵称存在并显示
  initNickname();
  displayNickname();
});

// 初始化页面基于当前路由
function initializePageByRoute() {
  // 首先检查 hash 路由
  const hash = window.location.hash;
  
  if (hash.startsWith('#/post/')) {
    const postId = hash.split('/').pop();
    loadPostView(postId);
  } else {
    // 如果没有 hash 或不匹配已知格式，检查当前路径
    const path = window.location.pathname;
    
    if (path.startsWith('/post/')) {
      const postId = path.split('/').pop();
      // 将常规路由转换为 hash 路由
      window.location.hash = `/post/${postId}`;
      return; // 会触发 hashchange 事件，不需要继续执行
    }
    
    // 默认加载主页
    loadHomeView();
  }
}

// 加载主页视图
function loadHomeView() {
  // 确保显示正确的视图
  document.title = 'NilBBS - Minimalist Anonymous Forum';
  
  // 检查是否需要获取页面模板
  if (document.getElementById('post-list')) {
    // 已经在主页了，只需刷新数据
    loadPosts();
    setupQuickPostEvents();
  } else {
    // 需要获取主页模板
    fetch('/')
      .then(response => response.text())
      .then(html => {
        // 提取 body 内容
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        document.body.innerHTML = doc.body.innerHTML;
        
        // 加载数据并设置事件
        loadPosts();
        setupQuickPostEvents();
        
        // 重新初始化昵称显示
        initNickname();
        displayNickname();
      });
  }
}

// 加载帖子详情视图
function loadPostView(postId) {
  document.title = 'Detail - NilBBS';
  
  // 检查是否需要获取页面模板
  if (document.getElementById('post-container') && document.getElementById('comments-container')) {
    // 已经在帖子详情页了，只需刷新数据
    loadPost(postId);
    setupCommentEvents(postId);
  } else {
    // 需要获取帖子详情页模板
    fetch(`/post/${postId}`)
      .then(response => response.text())
      .then(html => {
        // 提取 body 内容
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        document.body.innerHTML = doc.body.innerHTML;
        
        // 加载数据并设置事件
        loadPost(postId);
        setupCommentEvents(postId);
        
        // 重新初始化昵称显示
        initNickname();
        displayNickname();
      });
  }
}

// 帖子导航函数
function navigateToPost(event, postId) {
  event.preventDefault();
  window.location.hash = `/post/${postId}`;
}

// 设置快速发帖事件
function setupQuickPostEvents() {
  const quickPostContent = document.getElementById('quick-post-content');
  if (quickPostContent) {
    quickPostContent.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        quickCreatePost(e);
      }
    });
  }
}

// 设置评论事件
function setupCommentEvents(postId) {
  const commentContent = document.getElementById('comment-content');
  if (commentContent) {
    commentContent.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const form = document.getElementById('comment-form');
        if (form) {
          addComment(new Event('submit', { cancelable: true }), postId);
        }
      }
    });
  }
}

function formatDate(dateString) {
  const d = new Date(dateString);
  const str = d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  console.log('Formatted date:', str);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Initialize nickname
function initNickname() {
  if (!sessionStorage.getItem('userNickname')) {
    fetch('/api/random-go-nickname')
      .then(res => {
        if (!res.ok) throw new Error('Failed to get nickname');
        return res.text();
      })
      .then(nickname => {
        sessionStorage.setItem('userNickname', nickname.trim() || 'AnonymousUser');
        displayNickname();
      })
      .catch(() => {
        sessionStorage.setItem('userNickname', 'AnonymousUser');
        displayNickname();
      });
  }
}

// Display current nickname
function displayNickname() {
  const nicknameDisplay = document.getElementById('user-nickname-display');
  if (!nicknameDisplay) return;
  nicknameDisplay.innerHTML = ''; // 清空

  const nicknameText = document.createElement('span');
  nicknameText.className = 'nickname-text';
  nicknameText.textContent = getCurrentNickname();
  nicknameText.onclick = () => editNickname();

  const randomIcon = document.createElement('span');
  randomIcon.className = 'random-icon';
  randomIcon.textContent = '🎲';
  randomIcon.onclick = () => randomizeNickname();

  nicknameDisplay.appendChild(nicknameText);
  nicknameDisplay.appendChild(randomIcon);
}

// Switch to nickname edit mode
function editNickname() {
  const nicknameContainer = document.getElementById('nickname-container');
  const currentNickname = getCurrentNickname();

  if (!nicknameContainer) return;

  // Create input field
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentNickname;
  input.className = 'nickname-input improved-style'; 
  input.maxLength = 20; // Optional: limit nickname length

  // Handle input confirmation (Enter or Blur)
  const saveNickname = () => {
    const newNickname = input.value.trim();
    if (newNickname && newNickname !== currentNickname) {
      sessionStorage.setItem('userNickname', newNickname);
    }
    // Restore display regardless of change
    nicknameContainer.innerHTML = ''; // Clear input
    const span = document.createElement('span');
    span.id = 'user-nickname-display';
    span.className = 'user-nickname';
    nicknameContainer.appendChild(span);
    displayNickname(); // Re-display (potentially updated) nickname and re-attach listener
  };

  input.addEventListener('blur', saveNickname);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      saveNickname();
    }
  });

  // Replace span with input
  nicknameContainer.innerHTML = ''; // Clear existing span
  nicknameContainer.appendChild(input);
  input.focus(); // Focus the input field
}

// Get current nickname
function getCurrentNickname() {
  return sessionStorage.getItem('userNickname') || 'AnonymousUser';
}

// Load post list
async function loadPosts() {
  const postList = document.getElementById('post-list');
  if (!postList) return;
  
  try {
    const response = await fetch('/api/posts');
    if (!response.ok) throw new Error('Failed to fetch posts');
    const data = await response.json();
    
    postList.innerHTML = '';
    
    if (data.posts && data.posts.length > 0) {
      data.posts.forEach(post => {
        const date = formatDate(post.created_at);
        const preview = post.content.length > 80 ? post.content.substring(0, 80) + '...' : post.content;
        
        postList.innerHTML += `
          <li class="post-item">
            <div class="post-content"><a href="#" data-post-id="${post.id}" onclick="navigateToPost(event, ${post.id})">${preview}</a></div>
            <div class="post-meta">${post.author} · ${date}</div>
          </li>
        `;
      });
    } else {
      postList.innerHTML = '<li class="post-item">No posts yet</li>';
    }
  } catch (error) {
    console.error('Loading failed:', error);
    postList.innerHTML = '<li class="post-item">Failed to load</li>';
  }
}

// Load single post and its comments
async function loadPost(postId) {
  const postContainer = document.getElementById('post-container');
  const commentsContainer = document.getElementById('comments-container');
  const commentForm = document.querySelector('.comment-form');
  if (!postContainer || !commentsContainer) return;
  
  try {
    const response = await fetch(`/api/posts/${postId}`);
    if (!response.ok) throw new Error('Failed to fetch post');
    const data = await response.json();
    
    const post = data.post;
    if (!post) throw new Error('Post does not exist');
    
    const date = formatDate(post.created_at);
    
    postContainer.innerHTML = `
      <div class="post-content">${post.content}</div>
      <div class="post-meta">${post.author} · ${date}</div>
    `;
    
    commentsContainer.innerHTML = '<h3 class="no-margin">Comments</h3>';
    
    if (post.comments && post.comments.length > 0) {
      post.comments.forEach(comment => {
        const commentDate = formatDate(comment.created_at);
        commentsContainer.innerHTML += `
          <div class="comment">
            <div class="comment-content">${comment.content}</div>
            <div class="comment-meta">${comment.author} · ${commentDate}</div>
          </div>
        `;
      });
    } else {
      commentsContainer.innerHTML += '';
    }
    
    // 帖子存在时显示评论表单
    if (commentForm) {
      commentForm.style.display = 'block';
    }
  } catch (error) {
    console.error('Loading failed:', error);
    // 当帖子不存在时，显示友好的错误信息
    postContainer.innerHTML = `
      <div class="error-message" style="text-align:center; padding: 20px;">
        <p>帖子不存在或已被删除</p>
        <p><a href="#" onclick="window.location.hash = ''; return false;">返回主页</a></p>
      </div>
    `;
    commentsContainer.innerHTML = ''; // 清空评论区
    
    // 隐藏评论表单
    if (commentForm) {
      commentForm.style.display = 'none';
    }
  }
}

// Add comment
async function addComment(event, postId) {
  event.preventDefault();
  
  const content = document.getElementById('comment-content').value.trim();
  if (!content) {
    alert('Comment cannot be empty');
    return;
  }

  // Use global nickname
  const author = getCurrentNickname();
  
  try {
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ content, author })
    });
    
    if (!response.ok) throw new Error('Failed to add comment');
    
    // 清空输入框
    document.getElementById('comment-content').value = '';
    
    // 重新加载帖子及评论，不刷新页面
    loadPost(postId);
  } catch (error) {
    alert('Failed to add comment');
  }
}

// Create new post
async function createPost(event) {
  event.preventDefault();
  
  const content = document.getElementById('post-content').value.trim();
  if (!content) {
    showError('Content cannot be empty');
    return;
  }

  // Use global nickname
  const author = getCurrentNickname();
  
  try {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ content, author })
    });
    
    if (!response.ok) throw new Error('Failed to create post');
    
    // 使用 hash 路由导航到主页
    window.location.hash = '';
  } catch (error) {
    showError('Failed to create post');
  }
}

// Quick create post (for the quick post form on homepage)
async function quickCreatePost(event) {
  event.preventDefault();
  
  const content = document.getElementById('quick-post-content').value.trim();
  if (!content) {
    showError('Content cannot be empty');
    return;
  }

  // Use global nickname
  const author = getCurrentNickname();
  
  try {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ content, author })
    });
    
    if (!response.ok) throw new Error('Failed to create post');
    
    // Clear input after successful post
    document.getElementById('quick-post-content').value = '';
    
    // Reload post list instead of refreshing the whole page
    loadPosts();
    
    // Hide error message (if any)
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  } catch (error) {
    showError('Failed to create post');
  }
}

// Show error message
function showError(message) {
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

// Randomize nickname
function randomizeNickname() {
  fetch('/api/random-go-nickname')
    .then(res => {
      if (!res.ok) throw new Error('Failed to get nickname');
      return res.text();
    })
    .then(nickname => {
      sessionStorage.setItem('userNickname', nickname.trim() || 'AnonymousUser');
      displayNickname();
    })
    .catch(() => {});
}