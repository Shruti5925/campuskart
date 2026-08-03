import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useModal } from '../context/ModalContext';
import { formatNumericDate } from '../utils/dateUtils';
import socket, { connectSocket } from '../socket';
import Sidebar from '../Components/Sidebar';
import Footer from '../Components/Footer';
import femaleAvatar from '../assets/female-avatar.png';
import maleAvatar from '../assets/male-avatar.png';
import ReportModal from '../Components/ReportModal';
import '../styles/Messages.css';

const Messages = ({ hideSidebar = false, isAdmin = false, propTargetUserId = null }) => {
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(isAdmin ? 'Open' : 'Active');
    const location = useLocation();
    // eslint-disable-next-line no-unused-vars
    const [showOfferInput, setShowOfferInput] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [offerAmount, setOfferAmount] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [userData, setUserData] = useState(null);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [userStats, setUserStats] = useState({ rating: '0.0', sold: 0, active: 0 });
    const { showModal } = useModal();
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportTarget, setReportTarget] = useState({ id: null, type: 'user', name: '' });
    const messagesListRef = useRef(null);
    const messagesEndRef = useRef(null);
    // eslint-disable-next-line no-unused-vars
    const socketRef = useRef(null);
    const token = sessionStorage.getItem('token');

    const scrollToBottom = () => {
        if (messagesListRef.current) {
            messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
        }
    };

    const formatDateLabel = (dateStr) => {
        const msgDate = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const isSameDay = (a, b) =>
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();

        if (isSameDay(msgDate, today)) return 'Today';
        if (isSameDay(msgDate, yesterday)) return 'Yesterday';
        return msgDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatConvTime = (dateStr) => {
        const msgDate = new Date(dateStr);
        const today = new Date();
        const isSameDay = (a, b) =>
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();

        if (isSameDay(msgDate, today)) {
            return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return msgDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    // eslint-disable-next-line no-unused-vars
    const formatPostedDate = (product) => {
        if (!product) return 'N/A';
        if (product.createdAt) return formatNumericDate(product.createdAt);
        return "05/03/2026";
    };

    const getCurrentUserId = () => {
        if (!token) return null;
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const decoded = JSON.parse(jsonPayload);
            return (decoded.id || decoded._id)?.toString();
        } catch (e) {
            return null;
        }
    };

    const currentUserId = getCurrentUserId();

    useEffect(() => {
        const fetchUserData = async () => {
            if (!token) return;
            try {
                const res = await axios.get('http://localhost:5001/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(res.data);
            } catch (err) {
                console.error("Error fetching user data for header:", err);
            }
        };
        fetchUserData();
    }, [token]);

    useEffect(() => {
        const handleClickOutside = (event) => {
          if (showProfileDropdown && !event.target.closest('.profile-wrapper')) {
            setShowProfileDropdown(false);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileDropdown]);

    const getProfileIcon = (user) => {
        const u = user || userData;
        if (u?.profilePhoto) return `http://localhost:5001${u.profilePhoto}`;
        if (!u || !u.gender) return maleAvatar;
        if (u.gender === "Female") return femaleAvatar;
        return maleAvatar;
    };

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        window.location.href = '/login';
    };

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const params = new URLSearchParams(location.search);
                const convId = params.get('convId');
                const targetUserIdParam = params.get('userId');
                const targetProductId = params.get('productId');
                const effectiveTargetUserId = propTargetUserId || targetUserIdParam;

                const res = await axios.get('http://localhost:5001/api/chat/conversations', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setConversations(res.data);
                
                if (targetUserIdParam && targetProductId) {
                    // Try exact product match first, then fallback to user match (unified thread model)
                    const exactConv = res.data.find(c => 
                        c.product?._id?.toString() === targetProductId?.toString() && 
                        c.participants?.some(p => (p._id?._id || p._id || p).toString() === targetUserIdParam.toString())
                    );
                    
                    const userOnlyMatch = !exactConv ? res.data.find(c => 
                        c.participants?.some(p => (p._id?._id || p._id || p).toString() === targetUserIdParam.toString())
                    ) : null;

                    const existingConv = exactConv || userOnlyMatch;
                    
                    if (existingConv) {
                        setSelectedConv(existingConv);
                    } else {
                        try {
                            const [userRes, prodRes] = await Promise.all([
                                axios.get(`http://localhost:5001/api/auth/users/${targetUserIdParam}`, { headers: { Authorization: `Bearer ${token}` } }),
                                axios.get(`http://localhost:5001/api/products/${targetProductId}`, { headers: { Authorization: `Bearer ${token}` } })
                            ]);
                            
                            const tempConv = {
                                _id: 'new_user_chat',
                                participants: [
                                    { _id: currentUserId },
                                    { ...userRes.data.user }
                                ],
                                product: prodRes.data,
                                isNew: true
                            };
                            setSelectedConv(tempConv);
                        } catch (err) {
                            console.error("Error preparing new chat:", err);
                        }
                    }
                } else if (effectiveTargetUserId) {
                    const existing = res.data.find(c => 
                        c.participants?.some(p => (p._id?._id || p._id || p).toString() === effectiveTargetUserId.toString())
                    );
                    
                    if (existing) {
                        setSelectedConv(existing);
                    } else {
                        try {
                            const [userRes] = await Promise.all([
                                axios.get(`http://localhost:5001/api/auth/users/${effectiveTargetUserId}`, { headers: { Authorization: `Bearer ${token}` } }),
                            ]);
                            
                            const tempConv = {
                                _id: 'new_chat_' + Date.now(),
                                participants: [
                                    { _id: currentUserId },
                                    { ...userRes.data.user }
                                ],
                                product: null,
                                isNew: true
                            };
                            setSelectedConv(tempConv);
                        } catch (err) {
                            console.error("Error setting up new user chat:", err);
                        }
                    }
                } else if (convId) {
                    const linkedConv = res.data.find(c => c._id?.toString() === convId?.toString());
                    if (linkedConv) {
                        setSelectedConv(linkedConv);
                        if (linkedConv.archivedBy?.includes(currentUserId)) {
                            setActiveTab(isAdmin ? 'Waiting' : 'Archived');
                        }
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error("Error fetching conversations:", err);
                if (err.response?.status === 401) {
                    setConversations([]);
                    // Optionally trigger a logout or show a specific message
                }
                setLoading(false);
            }
        };
        fetchConversations();
    }, [token, location.search, propTargetUserId, isAdmin, currentUserId]);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!selectedConv) return;
            try {
                const res = await axios.get(`http://localhost:5001/api/chat/messages/${selectedConv._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(res.data);
                await axios.put(`http://localhost:5001/api/chat/read/${selectedConv._id}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (err) {
                console.error("Error fetching messages:", err);
            }
        };
        fetchMessages();
    }, [selectedConv, token]);

    useEffect(() => {
        const currentUserId = getCurrentUserId();
        if (currentUserId) {
            connectSocket(currentUserId);

            const handleReceiveMessage = async (newMsg) => {
                const incomingConvId = (newMsg.conversationId?.id || newMsg.conversationId?._id || newMsg.conversationId)?.toString();
                const currentConvId = selectedConv?._id?.toString();

                if (currentConvId && incomingConvId === currentConvId) {
                    setMessages((prev) => [...prev, newMsg]);
                    try {
                        await axios.put(`http://localhost:5001/api/chat/read/${selectedConv._id}`, {}, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    } catch (err) {
                        console.error("Error marking msg as read:", err);
                    }
                }
                
                const fetchConversationsList = async () => {
                   try {
                       const res = await axios.get('http://localhost:5001/api/chat/conversations', {
                           headers: { Authorization: `Bearer ${token}` }
                       });
                       setConversations(res.data);
                       // Update selectedConv if it exists to ensure full data is present
                       if (selectedConv) {
                           const updatedSelected = res.data.find(c => c._id?.toString() === selectedConv._id?.toString());
                           if (updatedSelected) setSelectedConv(updatedSelected);
                       }
                   } catch (err) {}
                };
                fetchConversationsList();
            };

            socket.on('receive_message', handleReceiveMessage);
            return () => {
                socket.off('receive_message', handleReceiveMessage);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedConv, token]);

    // Fetch user marketplace stats when otherUser changes (for admin)
    useEffect(() => {
        const fetchUserStats = async () => {
            const currentUid = currentUserId || getCurrentUserId();
            const otherU = selectedConv?.participants?.find(p => {
                const pid = (p?._id?.id || p?._id?._id || p?._id || p)?.toString();
                return pid && pid !== currentUid?.toString();
            });
            const uid = (otherU?._id?._id || otherU?._id || otherU)?.toString();
            
            if (!uid || !isAdmin) return;
            
            try {
                const res = await axios.get(`http://localhost:5001/api/products/admin/user-stats/${uid}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserStats({
                    rating: res.data.averageRating,
                    sold: res.data.soldCount,
                    active: res.data.activeCount
                });
            } catch (err) {
                console.error("Error fetching user stats:", err);
                setUserStats({ rating: '0.0', sold: 0, active: 0 });
            }
        };
        fetchUserStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedConv, isAdmin, token, currentUserId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConv) return;

        try {
            const userId = getCurrentUserId();
            if (!userId) return;
            const receiver = selectedConv.participants.find(p => {
                const pid = (p?._id?._id || p?._id || p)?.toString();
                return pid !== userId.toString();
            });
            
            const payload = {
                content: newMessage.trim(),
                productId: selectedConv.product?._id || selectedConv.product
            };

            const isNewChat = selectedConv.isNew || selectedConv._id?.toString().startsWith('new_');

            if (isAdmin && !isNewChat) {
                payload.conversationId = selectedConv._id;
                if (receiver) payload.receiverId = (receiver._id?._id || receiver._id || receiver);
            } else {
                payload.receiverId = receiver?._id?._id || receiver?._id || receiver;
            }

            const res = await axios.post(`http://localhost:5001/api/chat/send`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const senderInfo = selectedConv.participants.find(p => (p?._id?._id || p?._id || p)?.toString() === userId.toString());
            const newMessageObj = { ...res.data, sender: { _id: userId, gender: senderInfo?.gender } };
            setMessages([...messages, newMessageObj]);
            setNewMessage('');

            if (selectedConv.isNew) {
                const updatedConv = { 
                    ...selectedConv, 
                    _id: res.data.conversationId, 
                    isNew: false 
                };
                setSelectedConv(updatedConv);
                setConversations(prev => [updatedConv, ...prev]);
            }
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    const handleArchive = async () => {
        if (!selectedConv) return;
        try {
            const res = await axios.post(`http://localhost:5001/api/chat/archive/${selectedConv._id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const updatedArchivedBy = res.data.archived 
                ? [...(selectedConv.archivedBy || []), currentUserId] 
                : (selectedConv.archivedBy || []).filter(id => id.toString() !== currentUserId.toString());

            const updatedSelectedConv = { ...selectedConv, archivedBy: updatedArchivedBy };
            const updatedConversations = conversations.map(c => 
                c._id === selectedConv._id ? updatedSelectedConv : c
            );
            setConversations(updatedConversations);
            setSelectedConv(updatedSelectedConv);
        } catch (err) {
            console.error("Error archiving conversation:", err);
        }
    };

    // eslint-disable-next-line no-unused-vars
    const handleSendOffer = async () => {
        if (!offerAmount || isNaN(offerAmount)) return;
        const offerMessage = `🤝 I'd like to make an offer of ₹${offerAmount}`;
        try {
            const userId = getCurrentUserId();
            const receiver = selectedConv.participants.find(p => p._id?.toString() !== userId.toString());
            const res = await axios.post('http://localhost:5001/api/chat/send', {
                receiverId: receiver?._id,
                productId: selectedConv.product._id,
                content: offerMessage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const senderInfo = selectedConv.participants.find(p => p._id?.toString() === userId.toString());
            const newMessageObj = { ...res.data, sender: { _id: userId, gender: senderInfo?.gender } };
            setMessages([...messages, newMessageObj]);
            setOfferAmount('');
            setShowOfferInput(false);

            if (selectedConv.isNew) {
                const updatedConv = { 
                    ...selectedConv, 
                    _id: res.data.conversationId, 
                    isNew: false 
                };
                setSelectedConv(updatedConv);
                setConversations(prev => [updatedConv, ...prev]);
            }
        } catch (err) {
            console.error("Error sending offer:", err);
        }
    };

    if (loading) return <div className="loading">Loading Conversations...</div>;
    if (!currentUserId) return <div className="loading">Session expired. Please login.</div>;

    const renderAdminContent = () => {
        const filteredDocs = conversations.filter(c => {
            const searchStr = searchQuery ? searchQuery.trim().toLowerCase() : '';
            const otherUser = c.participants?.find(p => (p._id?._id || p._id || p)?.toString() !== currentUserId?.toString());
            const fullName = `${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`.toLowerCase();
            const prodTitle = (c.product?.title || '').toLowerCase();

            return !searchStr || fullName.includes(searchStr) || prodTitle.includes(searchStr);
        });

        const openConversations = filteredDocs.filter(c => c.status !== 'resolved');
        const resolvedConversations = filteredDocs.filter(c => c.status === 'resolved');
        
        const activeConversations = activeTab === 'Open' ? openConversations : resolvedConversations;
        
        const displayedConv = selectedConv;
        // Exceptionally robust "otherUser" identification
        const currentUid = currentUserId || getCurrentUserId();
        const otherUser = displayedConv?.participants?.find(p => {
            const pid = (p?._id?.id || p?._id?._id || p?._id || p)?.toString();
            return pid && pid !== currentUid?.toString();
        });
        
        return (
            <div className="admin-messages-container">
                {/* Pane 1: Conversations */}
                <aside className="admin-conv-pane">
                    <div className="pane-header">
                        <h3>Conversations</h3>
                        <div className="admin-tabs">
                            <button className={`admin-tab ${activeTab === 'Open' ? 'active' : ''}`} onClick={() => setActiveTab('Open')}>
                                Open ({openConversations.length})
                            </button>
                            <button className={`admin-tab ${activeTab === 'Resolved' ? 'active' : ''}`} onClick={() => setActiveTab('Resolved')}>
                                Resolved ({resolvedConversations.length})
                            </button>
                        </div>
                    </div>
                    <div className="admin-conv-list">
                        {activeConversations.length === 0 ? (
                            <div className="no-conv-list">No {activeTab.toLowerCase()} conversations</div>
                        ) : (
                            activeConversations.map(conv => {
                                const u = conv.participants?.find(p => (p._id?._id || p._id || p)?.toString() !== currentUserId?.toString());
                                const isSelected = displayedConv?._id === conv._id;
                                return (
                                    <div key={conv._id} className={`admin-conv-item ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedConv(conv)}>
                                        <div className="admin-avatar">
                                            <img src={u?.gender === 'Female' ? femaleAvatar : maleAvatar} alt="av" />
                                            {conv.status !== 'resolved' && <span className="online-dot"></span>}
                                        </div>
                                        <div className="admin-conv-info">
                                            <div className="info-top">
                                                <h4>{u?.firstName} {u?.lastName}</h4>
                                                <span className="time">{formatConvTime(conv.updatedAt)}</span>
                                            </div>
                                            <p className="last-msg">{conv.lastMessage || `Support Chat with Admin`}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </aside>

                {/* Pane 2: Chat Window */}
                <section className="admin-chat-pane">
                    {displayedConv ? (
                        <>
                            <header className="admin-chat-header">
                                <div className="chat-user-meta">
                                    <div className="header-avatar">
                                        <img src={getProfileIcon(otherUser)} alt="av" />
                                    </div>
                                    <div>
                                        <h4>{otherUser?.firstName} {otherUser?.lastName}</h4>
                                        <span className={`status-text ${selectedConv.status === 'resolved' ? 'resolved' : 'active'}`}>
                                            {selectedConv.status === 'resolved' ? '✅ TICKET RESOLVED' : 'ACTIVE NOW'}
                                        </span>
                                    </div>
                                </div>
                                <div className="header-actions-admin">
                                    {selectedConv.status !== 'resolved' && (
                                        <button 
                                            className="admin-action-btn resolve"
                                            onClick={() => {
                                                showModal({
                                                    title: 'Resolve Ticket',
                                                    message: 'Mark this ticket as resolved? This will notify the user.',
                                                    type: 'confirm',
                                                    onConfirm: async () => {
                                                        try {
                                                            const res = await axios.post(`http://localhost:5001/api/chat/resolve/${selectedConv._id}`, {}, {
                                                                headers: { Authorization: `Bearer ${token}` }
                                                            });
                                                            // Update local state
                                                            setConversations(prev => prev.map(c => c._id === selectedConv._id ? res.data.conversation : c));
                                                            setSelectedConv(res.data.conversation);
                                                            showModal({ title: 'Success', message: 'Ticket marked as resolved. User has been notified.', type: 'alert' });
                                                        } catch (err) {
                                                            console.error("Error resolving ticket:", err);
                                                            showModal({ title: 'Error', message: `Failed to resolve ticket: ${err.response?.data?.message || err.message}`, type: 'alert' });
                                                        }
                                                    }
                                                });
                                            }}
                                        >
                                            Resolve Ticket
                                        </button>
                                    )}
                                    <button className="admin-close-btn" onClick={() => setSelectedConv(null)} title="Close Conversation">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            </header>

                            <div className="admin-messages-list" ref={messagesListRef}>
                                <div className="date-indicator">TODAY, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase()}</div>
                                {messages.length === 0 ? (
                                    <div className="empty-chat-prompt">
                                        <div className="prompt-icon">💌</div>
                                        <p>No conversation history yet. Send a message to start chatting with {otherUser?.firstName}!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, i) => {
                                        const isOwn = (msg.sender?._id || msg.sender)?.toString() === currentUserId?.toString();
                                        return (
                                            <div key={i} className={`admin-msg-wrapper ${isOwn ? 'own' : 'received'}`}>
                                                {!isOwn && (
                                                    <div className="msg-avatar">
                                                        <img src={otherUser?.gender === 'Female' ? femaleAvatar : maleAvatar} alt="av" />
                                                    </div>
                                                )}
                                                <div className="admin-msg-bubble">
                                                    <p>{msg.content}</p>
                                                    <span className="msg-time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                {isOwn && (
                                                    <div className="msg-avatar">
                                                        <div className="admin-avatar-mini">💼</div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <footer className="admin-chat-footer">
                                <form className="admin-input-bar" onSubmit={handleSend}>
                                    <button type="button" className="extra-btn">+</button>
                                    <input 
                                        type="text" 
                                        placeholder="Type your message..." 
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <button type="button" className="extra-btn">😊</button>
                                    <button type="submit" className="admin-send-btn">
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" /></svg>
                                    </button>
                                </form>
                            </footer>
                        </>
                    ) : (
                        <div className="no-admin-conv">
                            <div className="placeholder-icon">💬</div>
                            <p>No conversations present</p>
                        </div>
                    )}
                </section>

                {/* Pane 3: User Details */}
                <aside className="admin-info-pane">
                    {displayedConv ? (
                        <div className="modern-profile-card">
                            <div className="profile-banner"></div>
                            <div className="profile-header-content">
                                <div className="profile-avatar-wrapper">
                                    <img src={getProfileIcon(otherUser)} alt="hero" className="profile-avatar-large" />
                                    {otherUser?.isVerified && <span className="verified-check" title="Verified User">✔</span>}
                                </div>
                                <div className="profile-main-meta">
                                    <h2>{otherUser?.firstName} {otherUser?.middleName ? otherUser?.middleName + ' ' : ''}{otherUser?.lastName}</h2>
                                    <div className="profile-badges">
                                        <div className={`role-pill ${otherUser?.role?.toLowerCase() || 'student'}`}>
                                            {otherUser?.role?.toLowerCase() === 'student' ? '🎓' : 
                                             otherUser?.role?.toLowerCase() === 'staff' ? '💼' : 
                                             otherUser?.role?.toLowerCase() === 'admin' ? '🛡️' : '👤'} 
                                            {(otherUser?.role || 'STUDENT').toUpperCase()}
                                        </div>
                                        <div className={`status-pill-mini ${otherUser?.isSuspended ? 'danger' : otherUser?.isVerified ? 'success' : 'warning'}`}>
                                            {otherUser?.isSuspended ? '🚫 SUSPENDED' : otherUser?.isVerified ? '✅ VERIFIED' : '⏳ PENDING'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="profile-details-scroll">
                                <div className="info-group">
                                    <h5 className="group-label">ACCOUNT INFORMATION</h5>
                                    <div className="details-grid-modern single-column">
                                        <div className="detail-box">
                                            <label>Department</label>
                                            <p>{otherUser?.department || 'N/A'}</p>
                                        </div>
                                        <div className="detail-box">
                                            <label>Gender</label>
                                            <p>{otherUser?.gender || 'N/A'}</p>
                                        </div>
                                        <div className="detail-box">
                                            <label>College ID</label>
                                            <p>{otherUser?.collegeId || 'N/A'}</p>
                                        </div>
                                        <div className="detail-box">
                                            <label>Mobile Number</label>
                                            <p>{otherUser?.mobileNumber || 'N/A'}</p>
                                        </div>

                                        <div className="detail-box">
                                            <label>Joined On</label>
                                            <p>{otherUser?.createdAt ? formatNumericDate(otherUser.createdAt) : 'N/A'}</p>
                                        </div>
                                        <div className="detail-box full-width">
                                            <label>Email Address</label>
                                            <p>{otherUser?.email || 'N/A'}</p>
                                        </div>
                                        <div className="detail-box full-width">
                                            <label>Campus Address / Hostel</label>
                                            <p>{otherUser?.address || 'No address provided'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="info-group">
                                    <h5 className="group-label">MARKETPLACE ACTIVITY</h5>
                                    <div className="activity-stats">
                                        <div className="stat-pill">
                                            <span className="val">⭐ {userStats.rating || '0.0'}</span>
                                            <span className="lab">Rating</span>
                                        </div>
                                        <div className="stat-pill">
                                            <span className="val">{userStats.sold || 0}</span>
                                            <span className="lab">Sold</span>
                                        </div>
                                        <div className="stat-pill">
                                            <span className="val">{userStats.active || 0}</span>
                                            <span className="lab">Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="no-info">
                            <div className="placeholder-icon">👤</div>
                            <p>No user selected. Click a conversation to view profile details.</p>
                        </div>
                    )}
                </aside>
            </div>
        );
    };

    const renderMainContent = () => {
        if (isAdmin) return renderAdminContent();

        const searchedConversations = searchQuery ? conversations.filter(c => {
            const searchStr = searchQuery.trim().toLowerCase();
            const otherUser = c.participants?.find(p => (p._id?._id || p._id || p)?.toString() !== currentUserId?.toString());
            const fullName = `${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`.toLowerCase();
            const prodTitle = (c.product?.title || '').toLowerCase();
            return fullName.includes(searchStr) || prodTitle.includes(searchStr);
        }) : [];

        return (
            <main className="messages-main">
                {!hideSidebar && (
                    <header className="messages-header">
                        <div className="header-left">
                            <div className="logo-box-mini">🛒</div>
                            <h2>Campuskart Messages</h2>
                        </div>
                        <div className="header-search" style={{ position: 'relative' }}>
                            <span className="search-icon">🔍</span>
                            <input 
                                type="text" 
                                placeholder="Search conversations..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <div className="search-dropdown">
                                    {searchedConversations.length > 0 ? (
                                        searchedConversations.map(conv => {
                                            const otherUser = conv.participants?.find(p => (p._id?._id || p._id || p)?.toString() !== currentUserId?.toString());
                                            const isArchived = conv.archivedBy?.some(id => id.toString() === currentUserId.toString());
                                            return (
                                                <div 
                                                    key={conv._id} 
                                                    className="search-dropdown-item"
                                                    onClick={() => {
                                                        setSelectedConv(conv);
                                                        setActiveTab(isArchived ? 'Archived' : 'Active');
                                                        setSearchQuery('');
                                                    }}
                                                >
                                                    <div className="sd-avatar">
                                                        <img src={otherUser?.gender === 'Female' ? femaleAvatar : maleAvatar} alt="avatar" />
                                                    </div>
                                                    <div className="sd-info">
                                                        <h4>{otherUser?.firstName} {otherUser?.lastName}</h4>
                                                        <p><strong>Item:</strong> {conv.product?.title || 'Deleted Product'}</p>
                                                    </div>
                                                    <span className="sd-badge">{isArchived ? 'Archived' : 'Active'}</span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="sd-no-results">No requested conversations found</div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Link to="/cart" className="pill-icon-btn cart-icon-btn" title="Cart">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                            </Link>
                            <Link to="/wishlist" className="pill-icon-btn wishlist-icon-btn" title="Wishlist">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            </Link>
                            
                            <div className="profile-wrapper">
                                <div
                                    className="profile-img-container"
                                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                >
                                    <img
                                        src={getProfileIcon()}
                                        alt="Profile"
                                        className="profile-img-pill"
                                    />
                                </div>

                                {showProfileDropdown && (
                                    <div className="profile-dropdown">
                                        <div className="dropdown-header">
                                            <p className="dropdown-name">{userData?.firstName} {userData?.lastName}</p>
                                            <p className="dropdown-email">{userData?.email}</p>
                                        </div>
                                        <div className="dropdown-body">
                                            <Link to="/dashboard" className="dropdown-item" onClick={() => setShowProfileDropdown(false)}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                                Dashboard
                                            </Link>
                                            <Link to="/profile" className="dropdown-item" onClick={() => setShowProfileDropdown(false)}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                My Profile
                                            </Link>
                                            <button onClick={handleLogout} className="dropdown-item logout-item">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>
                )}

                <div className="messages-content">
                    <aside className="conv-sidebar">
                        <div className="tabs">
                            <button className={`tab ${activeTab === 'Active' ? 'active' : ''}`} onClick={() => setActiveTab('Active')}>Active</button>
                            <button className={`tab ${activeTab === 'Archived' ? 'active' : ''}`} onClick={() => setActiveTab('Archived')}>Archived</button>
                        </div>
                        <div className="conv-list">
                            {conversations?.filter(conv => {
                                const isArchived = conv.archivedBy?.some(id => id.toString() === currentUserId.toString());
                                return activeTab === 'Active' ? !isArchived : isArchived;
                            }).map(conv => {
                                const otherUser = conv.participants?.find(p => (p._id?._id || p._id || p)?.toString() !== currentUserId?.toString());
                                return (
                                    <div
                                        key={conv._id}
                                        className={`conv-item ${selectedConv?._id === conv._id ? 'selected' : ''}`}
                                        onClick={() => setSelectedConv(conv)}
                                    >
                                        <div className="avatar">
                                            <img src={otherUser?.gender === 'Female' ? femaleAvatar : maleAvatar} alt="avatar" />
                                        </div>
                                        <div className="conv-info">
                                            <div className="conv-top">
                                                <h4>{otherUser?.firstName} {otherUser?.lastName}</h4>
                                                <span className="time">{formatConvTime(conv.updatedAt)}</span>
                                            </div>
                                            <p className="product-name">{conv.product?.title}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </aside>

                    <section className="chat-window">
                        {selectedConv ? (
                            <>
                                <header className="chat-header">
                                    {(() => {
                                        const otherParticipant = selectedConv.participants?.find(p => (p._id?._id || p._id || p)?.toString() !== currentUserId?.toString());
                                        return (
                                            <div className="chat-header-user">
                                                <div className="header-avatar">
                                                    <img src={getProfileIcon(otherParticipant)} alt="user" />
                                                </div>
                                                <div className="header-user-details">
                                                    <h3>{otherParticipant?.firstName} {otherParticipant?.lastName}</h3>
                                                    <span className="user-status-online">Active Now</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    <div className="chat-actions">
                                        <button 
                                            className="archive-btn" 
                                            onClick={handleArchive}
                                            title={selectedConv.archivedBy?.some(id => id.toString() === currentUserId.toString()) ? "Unarchive Chat" : "Archive Chat"}
                                        >
                                            {selectedConv.archivedBy?.some(id => id.toString() === currentUserId.toString()) ? "📥" : "📦"}
                                        </button>
                                        <button 
                                            className="report-user-btn" 
                                            onClick={() => {
                                                const otherParticipant = selectedConv.participants?.find(p => (p._id?._id || p._id || p)?.toString() !== currentUserId?.toString());
                                                setReportTarget({ 
                                                    id: (otherParticipant._id?._id || otherParticipant._id || otherParticipant), 
                                                    type: 'user', 
                                                    name: `${otherParticipant.firstName} ${otherParticipant.lastName}` 
                                                });
                                                setIsReportModalOpen(true);
                                            }}
                                            title="Report User"
                                        >
                                            🚩
                                        </button>
                                        <button className="close-conv-btn" onClick={() => setSelectedConv(null)} title="Close Conversation">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </div>
                                </header>

                                <div className="messages-list" ref={messagesListRef}>
                                    {(() => {
                                        let lastDateLabel = null;
                                        return messages?.map((msg, i) => {
                                            if (!msg) return null;

                                            const senderId = (msg.sender?._id || msg.sender)?.toString();
                                            const isOwn = senderId === currentUserId?.toString();

                                            const senderObj = (typeof msg.sender === 'object' && msg.sender !== null && msg.sender.gender)
                                                ? msg.sender
                                                : selectedConv.participants?.find(p => p._id?.toString() === senderId);

                                            const gender = senderObj?.gender;
                                            const dateLabel = formatDateLabel(msg.createdAt);
                                            const showDivider = dateLabel !== lastDateLabel;
                                            if (showDivider) lastDateLabel = dateLabel;

                                            return (
                                                <React.Fragment key={i}>
                                                    {showDivider && (
                                                        <div className="date-divider"><span>{dateLabel.toUpperCase()}</span></div>
                                                    )}
                                                    <div className={`message-bubble-wrapper ${isOwn ? 'own' : 'received'}`}>
                                                        {!isOwn && (
                                                            <div className="avatar-mini">
                                                                <img src={gender === 'Female' ? femaleAvatar : maleAvatar} alt="av" />
                                                            </div>
                                                        )}
                                                        <div className="bubble">
                                                            <p>{msg.content}</p>
                                                            <span className="time-stamp">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            );
                                        });
                                    })()}
                                    <div ref={messagesEndRef} />
                                </div>

                                <footer className="chat-footer">
                                    <form className="input-area" onSubmit={handleSend}>
                                        <button type="button" className="attachment-btn">📎</button>
                                        <button type="button" className="location-btn">📍</button>
                                        <input
                                            type="text"
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                        />
                                        <button type="submit" className="send-btn">
                                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" /></svg>
                                        </button>
                                    </form>
                                    {selectedConv.product?.title !== 'Support & Help' && (
                                        <div className="trust-footer">
                                            <span>🛡️ Secure Payments Enabled</span>
                                            <span>📍 Campus Safety Tips</span>
                                        </div>
                                    )}
                                </footer>
                            </>
                        ) : (
                            <div className="no-conv">
                                <p>Open any conversation from the active or archive chats.</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        );
    };

    if (hideSidebar) return (
        <>
            {renderMainContent()}
            <ReportModal 
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                targetId={reportTarget.id}
                targetType={reportTarget.type}
                targetName={reportTarget.name}
            />
        </>
    );

    return (
        <div className="dashboard-page-container">
            <div className="dashboard-layout">
                <Sidebar />
                {renderMainContent()}
            </div>
            <Footer />
            <ReportModal 
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                targetId={reportTarget.id}
                targetType={reportTarget.type}
                targetName={reportTarget.name}
            />
        </div>
    );
};

export default Messages;
