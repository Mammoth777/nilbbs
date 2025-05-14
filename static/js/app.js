// Page initialization after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize based on current page or URL hash
  initializePageByRoute();
  
  // 监听 hashchange 事件以处理路由变化
  window.addEventListener('hashchange', function() {
    // 在路由变化时，清除现有的倒计时定时器
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    
    initializePageByRoute();
  });
  
  // 确保昵称存在并显示
  initNickname();
  displayNickname();
});

// 向父窗口发送消息的统一方法
function sendMessageToParent(type, data) {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: type,
      data: data
    }, '*');
  }
}

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
    
    // 向父窗口发送切换到列表页的消息
    sendMessageToParent('nilbbs_navigation', {
      route: 'home',
      url: window.location.href
    });
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
        
        // 向父窗口发送切换到列表页的消息
        sendMessageToParent('nilbbs_navigation', {
          route: 'home',
          url: window.location.href
        });
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
    
    // 向父窗口发送切换到帖子详情页的消息
    sendMessageToParent('nilbbs_navigation', {
      route: 'post',
      postId: postId,
      url: window.location.href
    });
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
        
        // 向父窗口发送切换到帖子详情页的消息
        sendMessageToParent('nilbbs_navigation', {
          route: 'post',
          postId: postId,
          url: window.location.href
        });
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
        // 计算初始倒计时，使用服务器返回的delete_at时间
        const countdown = calculateCountdown(post.created_at, post.delete_at);
        const countdownClass = countdown.status ? `countdown-tag ${countdown.status}` : 'countdown-tag';
        
        postList.innerHTML += `
          <li class="post-item">
            <div class="post-content"><a href="#" data-post-id="${post.id}" onclick="navigateToPost(event, ${post.id})">${preview}</a></div>
            <div class="post-meta">
              <span class="post-meta-info">${post.author} · ${date}</span>
              <span class="${countdownClass}" data-created-at="${post.created_at}" data-delete-at="${post.delete_at}">${countdown.text}</span>
            </div>
          </li>
        `;
      });
      
      // 启动倒计时更新
      startCountdownTimer();
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
    // 计算倒计时，使用服务器返回的delete_at时间
    const countdown = calculateCountdown(post.created_at, post.delete_at);
    const countdownClass = countdown.status ? `countdown-tag ${countdown.status}` : 'countdown-tag';
    
    postContainer.innerHTML = `
      <div class="post-content">${post.content}</div>
      <div class="post-meta">
        <span class="post-meta-info">${post.author} · ${date}</span>
        <span class="${countdownClass}" data-created-at="${post.created_at}" data-delete-at="${post.delete_at}">${countdown.text}</span>
      </div>
    `;
    
    // 确保倒计时定时器在加载帖子详情时也启动
    startCountdownTimer();
    
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

// 计算并格式化倒计时
function calculateCountdown(createdAt, deleteAt) {
  // 获取删除时间（如果没有提供，则基于创建时间计算）
  let expiryDate;
  if (deleteAt) {
    expiryDate = new Date(deleteAt);
  } else {
    // 后备计算方式：使用创建时间 + 7天（如果服务器没返回delete_at）
    const postDate = new Date(createdAt);
    expiryDate = new Date(postDate);
    expiryDate.setDate(expiryDate.getDate() + 7);
  }
  
  // 计算距离过期的剩余时间（毫秒）
  const now = new Date();
  const timeRemaining = expiryDate - now;
  
  // 如果倒计时已结束，但帖子仍然存在(服务器还没有删除)
  // 显示负数倒计时，而不是"已过期"
  if (timeRemaining <= 0) {
    // 计算超时的时间
    const overdue = Math.abs(timeRemaining);
    const days = Math.floor(overdue / (1000 * 60 * 60 * 24));
    const hours = Math.floor((overdue % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((overdue % (1000 * 60)) / 1000);
    const milliseconds = Math.floor(overdue % 1000);
    
    // 格式化超时时间精确到秒
    let text = '-';
    // 四舍五入到最接近的秒
    const roundedSeconds = Math.round(seconds + milliseconds / 1000);
    // 格式化为整数秒
    const formattedSeconds = roundedSeconds.toString();
    
    if (days > 0) {
      text += `${days}天${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${formattedSeconds.padStart(2, '0')}`;
    } else if (hours > 0) {
      text += `${hours}:${minutes.toString().padStart(2, '0')}:${formattedSeconds.padStart(2, '0')}`;
    } else if (minutes > 0) {
      text += `${minutes}:${formattedSeconds.padStart(2, '0')}`;
    } else {
      text += `${formattedSeconds}`;
    }
    
    return {
      text: text,
      expired: true,
      timeRemaining: timeRemaining,
      status: 'urgent' // 使用紧急样式
    };
  }
  
  // 计算天、小时、分钟、秒和毫秒
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  const milliseconds = Math.floor(timeRemaining % 1000);
  
  // 根据剩余时间确定显示格式和状态
  let status = '';
  if (days === 0 && hours < 12) {
    status = 'urgent';
  } else if (days < 1) {
    status = 'expiring';
  }
  
  // 格式化显示文本精确到秒
  let text = '';
  // 四舍五入到最接近的秒
  const roundedSeconds = Math.round(seconds + milliseconds / 1000);
  // 格式化为整数秒
  const formattedSeconds = roundedSeconds.toString();
  
  if (days > 0) {
    text = `${days}天${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${formattedSeconds.padStart(2, '0')}`;
  } else if (hours > 0) {
    text = `${hours}:${minutes.toString().padStart(2, '0')}:${formattedSeconds.padStart(2, '0')}`;
  } else if (minutes > 0) {
    text = `${minutes}:${formattedSeconds.padStart(2, '0')}`;
  } else {
    text = `${formattedSeconds}`;
  }
  
  return {
    text: text,
    expired: false,
    timeRemaining: timeRemaining,
    status: status
  };
}

// 更新所有倒计时标签
function updateAllCountdowns() {
  const countdownElements = document.querySelectorAll('.countdown-tag');
  
  countdownElements.forEach(element => {
    const createdAt = element.getAttribute('data-created-at');
    const deleteAt = element.getAttribute('data-delete-at');
    if (!createdAt) return;
    
    const countdown = calculateCountdown(createdAt, deleteAt);
    
    // 更新显示文本
    element.textContent = countdown.text;
    
    // 更新样式
    element.classList.remove('expiring', 'urgent');
    if (countdown.status) {
      element.classList.add(countdown.status);
    }
  });
}

// 启动倒计时定时器
let countdownInterval = null;

function startCountdownTimer() {
  // 清除可能存在的旧定时器
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  
  // 初始更新一次
  updateAllCountdowns();
  
  // 设置定时器，每100毫秒更新一次（以保证0.1秒的精度）
  countdownInterval = setInterval(updateAllCountdowns, 100);
}