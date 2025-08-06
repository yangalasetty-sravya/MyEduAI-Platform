import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust path if necessary
import { ChevronRightIcon } from '@heroicons/react/20/solid'; // Example icon for breadcrumbs

const VideoDetailPage = () => {
  const { videoId } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('transcript'); // State for tabs

  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true);
      setError(null);
      try {
        const videoDocRef = doc(db, 'public_videos', videoId);
        const videoDoc = await getDoc(videoDocRef);

        if (videoDoc.exists()) {
          setVideo({ id: videoDoc.id, ...videoDoc.data() });
        } else {
          setError("Video not found.");
        }
      } catch (err) {
        console.error("Error fetching video:", err);
        setError("Failed to load video details.");
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideo();
    }
  }, [videoId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-xl text-gray-700 animate-pulse">Loading video...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 max-w-2xl bg-red-50 border border-red-200 rounded-lg shadow-md mt-10 text-center">
        <p className="text-red-700 text-lg font-medium mb-4">Error loading video:</p>
        <p className="text-red-600">{error}</p>
        <a href="/learning-path" className="mt-4 inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300">
          Back to Learning Path
        </a>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container mx-auto p-8 max-w-2xl bg-yellow-50 border border-yellow-200 rounded-lg shadow-md mt-10 text-center">
        <p className="text-yellow-700 text-lg font-medium mb-4">Video not found.</p>
        <p className="text-yellow-600">The video you are looking for does not exist or may have been removed.</p>
        <a href="/learning-path" className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300">
          Back to Learning Path
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      {/* Breadcrumbs - Mocked for now, integrate with your actual structure */}
      <nav className="flex mb-6 text-gray-500 text-sm" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          <li className="inline-flex items-center">
            <a href="/learning-path" className="inline-flex items-center text-gray-600 hover:text-blue-600">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
              Learning Path
            </a>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              <span className="ml-1 text-gray-700 md:ml-2 font-medium line-clamp-1">{video.title || 'Untitled Video'}</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Video Player Area (2/3 width on large screens) */}
        <div className="lg:col-span-2">
          <div className="bg-black rounded-lg overflow-hidden shadow-xl aspect-video mb-6">
            {video.cloudinaryUrl ? (
              <video 
                controls 
                width="100%" 
                height="100%"
                src={video.cloudinaryUrl}
                poster={video.thumbnailUrl || ''}
                className="w-full h-full object-contain"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex items-center justify-center h-full text-white text-lg bg-gray-800">
                Video content not available.
              </div>
            )}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">{video.title || 'Untitled Video'}</h1>
          <p className="text-gray-700 text-lg mb-6">{video.notes || 'No description available for this video.'}</p>
          
          {/* Action Buttons below video */}
          <div className="flex space-x-4 mb-8">
            <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Report an issue
            </button>
            <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M18 10l-1.5-1.5L13 14"></path></svg>
              Save note
            </button>
          </div>

          {/* Tabs Section */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('transcript')}
                className={`${activeTab === 'transcript' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
              >
                Transcript
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`${activeTab === 'notes' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
              >
                Notes
              </button>
              <button
                onClick={() => setActiveTab('downloads')}
                className={`${activeTab === 'downloads' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
              >
                Downloads
              </button>
              <button
                onClick={() => setActiveTab('discuss')}
                className={`${activeTab === 'discuss' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
              >
                Discuss
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="tab-content bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            {activeTab === 'transcript' && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Transcript (Mock)</h3>
                <p className="text-gray-700">
                  This is where the video transcript would go. You'd need to fetch this from a service or store it in your database.
                  For example: "In the real world, inheritance something means acquiring possession..."
                </p>
                {/* Real transcript would be dynamic and scrollable */}
              </div>
            )}
            {activeTab === 'notes' && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Your Notes (Mock)</h3>
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                  rows="6" 
                  placeholder="Start typing your notes here..."
                ></textarea>
                <button className="mt-3 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md">Save Notes</button>
              </div>
            )}
            {activeTab === 'downloads' && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Downloads (Mock)</h3>
                <p className="text-gray-700">No downloads available for this video.</p>
                {/* You would list downloadable resources here, e.g., PDFs, code files */}
              </div>
            )}
            {activeTab === 'discuss' && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Discussion Forum (Mock)</h3>
                <p className="text-gray-700">A discussion forum or comment section would be integrated here.</p>
              </div>
            )}
          </div>

        </div>

        {/* Sidebar (1/3 width on large screens) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-100 sticky top-4"> {/* Sticky for scrolling */}
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Coach <span className="text-blue-500 text-sm">(AI Assistant)</span></h2>
            <p className="text-gray-700 mb-6">
              Let me know if you have any questions about this material. I'm here to help!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button className="flex items-center justify-center p-3 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h2m-2 3h2m-2-6h2"></path></svg>
                Practice Questions
              </button>
              <button className="flex items-center justify-center p-3 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h10M7 16h10M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z"></path></svg>
                Explain in Simple Terms
              </button>
              <button className="flex items-center justify-center p-3 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                Give a Summary
              </button>
              <button className="flex items-center justify-center p-3 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Give Real-life Examples
              </button>
            </div>
            {/* Add AI response area here when implementing functionality */}
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
                <p className="font-semibold mb-2">Coach Response:</p>
                <p>Click one of the buttons above to get an AI-powered response. (Functionality needs to be implemented)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetailPage;