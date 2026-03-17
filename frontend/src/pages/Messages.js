import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import socket, { connectSocket } from '../socket';
import Sidebar from '../Components/Sidebar';
import femaleAvatar from '../assets/female-avatar.png';
import maleAvatar from '../assets/male-avatar.png';
import '../styles/Messages.css';

const Messages = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Active');
    const location = useLocation();
    const [showOfferInput, setShowOfferInput] = useState(false);
    const [offerAmount, setOfferAmount] = useState('');
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const token = localStorage.getItem('token');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        return msgDate.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
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
        return msgDate.toLocaleDateString([], { day: 'numeric', month: 'short' });
    };

    const formatPostedDate = (product) => {
        if (!product) return 'N/A';
        if (product.createdAt) return new Date(product.createdAt).toLocaleDateString();
        
        // Use user-requested default for older products
        return "05 Mar 2026";
    };

    const getCurrentUserId = () => {
        if (!token) return null;
        try {
            return JSON.parse(atob(token.split('.')[1])).id;
        } catch (e) {
            return null;
        }
    };

    const currentUserId = getCurrentUserId();

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await axios.get('http://localhost:5001/api/chat/conversations', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setConversations(res.data);
                
                // Deep link from notification
                const params = new URLSearchParams(location.search);
                const convId = params.get('convId');
                
                if (convId) {
                    const linkedConv = res.data.find(c => c._id === convId);
                    if (linkedConv) {
                        setSelectedConv(linkedConv);
                        // If it's archived, switch to Archived tab
                        if (linkedConv.archivedBy?.includes(getCurrentUserId())) {
                            setActiveTab('Archived');
                        }
                    } else if (res.data.length > 0) {
                        setSelectedConv(res.data[0]);
                    }
                } else if (res.data.length > 0) {
                    setSelectedConv(res.data[0]);
                }
                setLoading(false);
            } catch (err) {
                console.error("Error fetching conversations:", err);
                setLoading(false);
            }
        };
        fetchConversations();
    }, [token]);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!selectedConv) return;
            try {
                const res = await axios.get(`http://localhost:5001/api/chat/messages/${selectedConv._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(res.data);
                // Mark as read
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
                if (selectedConv && newMsg.conversationId === selectedConv._id) {
                    setMessages((prev) => [...prev, newMsg]);
                    // Mark as read immediately if current conversation is active
                    try {
                        await axios.put(`http://localhost:5001/api/chat/read/${selectedConv._id}`, {}, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    } catch (err) {
                        console.error("Error marking msg as read:", err);
                    }
                }
                
                // Refresh conversations to update the "last message" snippet on the side
                const fetchConversationsList = async () => {
                   try {
                       const res = await axios.get('http://localhost:5001/api/chat/conversations', {
                           headers: { Authorization: `Bearer ${token}` }
                       });
                       setConversations(res.data);
                   } catch (err) {}
                };
                fetchConversationsList();
            };

            socket.on('receive_message', handleReceiveMessage);
            return () => {
                socket.off('receive_message', handleReceiveMessage);
            };
        }
    }, [selectedConv, token]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConv) return;

        try {
            const userId = getCurrentUserId();
            if (!userId) return;
            const receiver = selectedConv.participants.find(p => p._id?.toString() !== userId.toString());
            const res = await axios.post('http://localhost:5001/api/chat/send', {
                receiverId: receiver?._id,
                productId: selectedConv.product._id,
                content: newMessage.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const senderInfo = selectedConv.participants.find(p => p._id?.toString() === userId.toString());
            setMessages([...messages, { ...res.data, sender: { _id: userId, gender: senderInfo?.gender } }]);
            setNewMessage('');
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
            // Update local state
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
            setMessages([...messages, { ...res.data, sender: { _id: userId, gender: senderInfo?.gender } }]);
            setOfferAmount('');
            setShowOfferInput(false);
        } catch (err) {
            console.error("Error sending offer:", err);
        }
    };

    if (loading) return <div className="loading">Loading Conversations...</div>;

    if (!currentUserId) return <div className="loading">Session expired. Please login.</div>;

    return (
        <div className="messages-layout">
            <Sidebar />
            <main className="messages-main">
                <header className="messages-header">
                    <div className="header-left">
                        <div className="logo-box-mini">🛒</div>
                        <h2>Campuskart Messages</h2>
                    </div>
                    <div className="header-search">
                        <span className="search-icon">🔍</span>
                        <input type="text" placeholder="Search conversations..." />
                    </div>
                    <div className="header-actions">
                        <button className="icon-btn" title="Settings"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg></button>
                    </div>
                </header>

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
                                const otherUser = conv.participants?.find(p => p._id?.toString() !== currentUserId?.toString());
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
                                    <div className="product-summary">
                                        <div className="prod-img">
                                            <img src={(selectedConv.product?.images && selectedConv.product.images.length > 0) ? selectedConv.product.images[0] : (selectedConv.product?.image || 'https://via.placeholder.com/40')} alt="prod" />
                                        </div>
                                        <div className="prod-details">
                                            <h3>{selectedConv.product?.title || 'Product Deleted'}</h3>
                                            <p>₹{selectedConv.product?.price || 0} • Posted {formatPostedDate(selectedConv.product)}</p>
                                        </div>
                                    </div>
                                    <div className="chat-actions">
                                        <button 
                                            className="archive-btn" 
                                            onClick={handleArchive}
                                            title={selectedConv.archivedBy?.some(id => id.toString() === currentUserId.toString()) ? "Unarchive Chat" : "Archive Chat"}
                                        >
                                            {selectedConv.archivedBy?.some(id => id.toString() === currentUserId.toString()) ? "📥" : "📦"}
                                        </button>
                                        <div className="offer-action-container">
                                            {showOfferInput ? (
                                                <div className="offer-input-box">
                                                    <input 
                                                        type="number" 
                                                        placeholder="Enter ₹" 
                                                        value={offerAmount}
                                                        onChange={(e) => setOfferAmount(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <button className="confirm-offer-btn" onClick={handleSendOffer}>Send</button>
                                                    <button className="cancel-offer-btn" onClick={() => setShowOfferInput(false)}>✕</button>
                                                </div>
                                            ) : (
                                                <button className="make-offer-btn" onClick={() => setShowOfferInput(true)}>Make Offer</button>
                                            )}
                                        </div>
                                        <button className="more-btn">⋮</button>
                                    </div>
                                </header>

                                <div className="messages-list">
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
                                    <div className="trust-footer">
                                        <span>🛡️ Secure Payments Enabled</span>
                                        <span>📍 Campus Safety Tips</span>
                                    </div>
                                </footer>
                            </>
                        ) : (
                            <div className="no-conv">
                                <p>Select a conversation to start chatting</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Messages;
