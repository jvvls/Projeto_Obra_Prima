import React, { useEffect, useState } from 'react';
import './App.css';
import { api } from './services/api';

interface Post {
  id: number;
  title: string;
  body: string;
}

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/posts');
        setPosts(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch posts');
        console.error('API Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>API Posts Test</h1>
        
        {loading && <p>Loading posts...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        
        {!loading && !error && posts.length === 0 && (
          <p>No posts available. Make sure your backend is running on http://localhost:5000</p>
        )}
        
        {!loading && posts.length > 0 && (
          <div>
            <h2>Posts ({posts.length})</h2>
            <ul style={{ textAlign: 'left' }}>
              {posts.map((post) => (
                <li key={post.id}>
                  <strong>ID {post.id}: {post.title}</strong>
                  <p>{post.body}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
