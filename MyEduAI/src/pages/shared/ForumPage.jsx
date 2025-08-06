import React, { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  doc,
  getDoc,
 
  updateDoc,
  serverTimestamp,
  arrayUnion,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db } from '../../firebase';
import './ForumPage.css';

const ForumPage = () => {
  const [threads, setThreads] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedThread, setSelectedThread] = useState(null);
  const [newReply, setNewReply] = useState('');
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState('');

  // Fetch current user's role (learner or volunteer)
  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (!user) return;
      setUserId(user.uid);

      const learnerSnap = await getDoc(doc(db, 'learners', user.uid));
      const volunteerSnap = await getDoc(doc(db, 'volunteers', user.uid));

      if (learnerSnap.exists()) {
        setUserRole('learner');
      } else if (volunteerSnap.exists()) {
        setUserRole('volunteer');
      } else {
        setUserRole('guest');
      }
    };

    fetchUserRole();
  }, []);

  // Realtime fetch forum threads
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'forums'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setThreads(data);
    });

    return () => unsub();
  }, []);

  // Post a new thread
  const handlePostThread = async () => {
    if (!newTitle || !newContent) return alert('Enter title and content');

    await addDoc(collection(db, 'forums'), {
      title: newTitle,
      content: newContent,
      authorId: userId,
      authorRole: userRole,
      createdAt: serverTimestamp(),
      replies: [],
    });

    setNewTitle('');
    setNewContent('');
  };

  // Post a reply to a thread
  const handlePostReply = async () => {
    if (!newReply || !selectedThread) return;

    const threadRef = doc(db, 'forums', selectedThread.id);
    await updateDoc(threadRef, {
      replies: arrayUnion({
        content: newReply,
        authorId: userId,
        authorRole: userRole,
        createdAt: new Date(),
      }),
    });

    setNewReply('');
  };

  return (
    <div className="forum-page">
      <h2>💬 Community Forum</h2>

      <div className="new-thread">
        <h3>📝 Ask a Question</h3>
        <input
          type="text"
          placeholder="Enter a question title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <textarea
          placeholder="Describe your question..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
        />
        <button onClick={handlePostThread}>Post Thread</button>
      </div>

      <div className="thread-list">
        <h3>📚 All Threads</h3>
        {threads.length === 0 ? (
          <p>No questions yet. Be the first to ask!</p>
        ) : (
          threads.map((thread) => (
            <div
              key={thread.id}
              className={`thread-card ${
                selectedThread?.id === thread.id ? 'active' : ''
              }`}
              onClick={() => setSelectedThread(thread)}
            >
              <h4>{thread.title}</h4>
              <p>{thread.content}</p>
              <div className="meta">
                👤 {thread.authorRole} · 💬 {thread.replies?.length || 0} replies
              </div>
            </div>
          ))
        )}
        {selectedThread && (
  <>
    {selectedThread.aiSummary && (
      <div className="ai-summary-box">
        <h4>🤖 AI Summary</h4>
        <p>{selectedThread.aiSummary}</p>
      </div>
    )}

    <button
      className="summarize-btn"
      onClick={async () => {
        try {
          const res = await fetch(`/api/forum/ai-summary/${selectedThread.id}`, {
            method: 'POST',
          });
          const data = await res.json();
          console.log('Summary response:', data);
          
          alert('AI Summary updated! Refresh to see it.');
        } catch (err) {
          console.error(err);
          alert('Failed to generate summary.');
        }
      }}
    >
      🧠 Summarize with AI
    </button>
  </>
)}


      </div>

      {selectedThread && (
        <div className="thread-detail">
          <h3>{selectedThread.title}</h3>
          <p>{selectedThread.content}</p>

          <h4>Replies</h4>
          {selectedThread.replies?.map((reply, index) => (
            <div key={index} className="reply-box">
              <p>{reply.content}</p>
              <small>👤 {reply.authorRole}</small>
            </div>
          ))}

          <textarea
            placeholder="Write your reply..."
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
          />
          <button onClick={handlePostReply}>Reply</button>
        </div>
      )}
    </div>
  );
};

export default ForumPage;
