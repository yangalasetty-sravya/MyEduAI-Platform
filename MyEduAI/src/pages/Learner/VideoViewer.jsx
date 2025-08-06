import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './VideoViewer.css';

const VideoViewer = () => {
  const { id } = useParams();
  const [videoData, setVideoData] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [activeTab, setActiveTab] = useState('transcript');
  const [loading, setLoading] = useState(true);
  const [transcriptLoading, setTranscriptLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch video data from Firestore
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const videoRef = doc(db, 'public_videos', id);
        const videoSnap = await getDoc(videoRef);

        if (videoSnap.exists()) {
          setVideoData(videoSnap.data());
        } else {
          setError('❌ Video not found.');
        }
      } catch (err) {
        console.error('🔥 Error fetching video:', err);
        setError('⚠️ Failed to load video.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  // Fetch transcript from backend
  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        setTranscriptLoading(true);
        const response = await fetch(`/api/ai/transcript/${id}`);
        const data = await response.json();

        if (response.ok && data.transcript) {
          setTranscript(data.transcript);
        } else {
          setTranscript('⚠️ AI transcript not available.');
        }
      } catch (err) {
        console.error('🧠 Error fetching transcript:', err);
        setTranscript('⚠️ Failed to generate transcript.');
      } finally {
        setTranscriptLoading(false);
      }
    };

    fetchTranscript();
  }, [id]);

  if (loading) return <p className="video-loading">🎬 Loading video...</p>;
  if (error) return <p className="video-error">{error}</p>;

  return (
    <div className="video-page-container">
      <h1 className="video-title">{videoData.title}</h1>

      <video
        controls
        className="main-video"
        src={videoData.cloudinaryUrl}
        poster={videoData.thumbnailUrl || ''}
      >
        Your browser does not support the video tag.
      </video>

      {/* Tabs */}
      <div className="video-tabs">
        {['transcript', 'notes', 'downloads'].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'transcript' && (
          <div className="tab-section">
            {transcriptLoading ? '🤖 Generating transcript using AI...' : transcript}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="tab-section">
            {videoData.notes || '📝 No notes provided by the volunteer.'}
          </div>
        )}

        {activeTab === 'downloads' && (
          <div className="tab-section">
            {videoData.resources && videoData.resources.length > 0 ? (
              videoData.resources.map((res, idx) => (
                <div key={idx} className="download-item">
                  <a href={res.url} download target="_blank" rel="noopener noreferrer">
                    📥 {res.name}
                  </a>
                </div>
              ))
            ) : (
              <p>📂 No downloadable resources available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoViewer;
