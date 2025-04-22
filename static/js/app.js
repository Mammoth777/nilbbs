// Page initialization after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize based on current page
  const path = window.location.pathname;
  if (path === '/' || path === '/index.html') {
    loadPosts();
    // Add keyboard event for quick posting
    const quickPostContent = document.getElementById('quick-post-content');
    if (quickPostContent) {
      quickPostContent.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          quickCreatePost(e);
        }
      });
    }
  } else if (path.startsWith('/post/')) {
    const postId = path.split('/').pop();
    loadPost(postId);
    // Add keyboard event for comments
    const commentContent = document.getElementById('comment-content');
    if (commentContent) {
      commentContent.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          const form = document.getElementById('comment-form');
          if (form) {
            const event = new Event('submit', { cancelable: true });
            form.dispatchEvent(event);
          }
        }
      });
    }
  }
  
  // Ensure nickname exists in SessionStorage
  initNickname();
});

// Initialize nickname
function initNickname() {
  // Set default value if nickname doesn't exist in SessionStorage
  if (!sessionStorage.getItem('userNickname')) {
    sessionStorage.setItem('userNickname', 'AnonymousUser');
  }
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
        const date = new Date(post.created_at).toLocaleString('en-US');
        const preview = post.content.length > 80 ? post.content.substring(0, 80) + '...' : post.content;
        
        postList.innerHTML += `
          <li class="post-item">
            <div class="post-content"><a href="/post/${post.id}">${preview}</a></div>
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
  if (!postContainer || !commentsContainer) return;
  
  try {
    const response = await fetch(`/api/posts/${postId}`);
    if (!response.ok) throw new Error('Failed to fetch post');
    const data = await response.json();
    
    const post = data.post;
    if (!post) throw new Error('Post does not exist');
    
    const date = new Date(post.created_at).toLocaleString('en-US');
    
    postContainer.innerHTML = `
      <div class="post-content">${post.content}</div>
      <div class="post-meta">${post.author} · ${date}</div>
    `;
    
    commentsContainer.innerHTML = '<h3 class="no-margin">Comments</h3>';
    
    if (post.comments && post.comments.length > 0) {
      post.comments.forEach(comment => {
        const commentDate = new Date(comment.created_at).toLocaleString('en-US');
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
  } catch (error) {
    console.error('Loading failed:', error);
    postContainer.innerHTML = '<p>Failed to load</p>';
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
    window.location.reload();
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
    window.location.href = '/';
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