import React, { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from "../context/AuthContext";
import { getDatabase, ref, onValue, set, push, remove, update, get, onDisconnect } from "firebase/database";
import '../styles/assistant.css';
import AssistantLayout from '../components/AssistantLayout';
import { FaTrashAlt } from 'react-icons/fa';

const Assistant = () => {
  const { usuario } = useContext(AuthContext);
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Efecto para escuchar las notificaciones
  useEffect(() => {
    if (!usuario) return;

    const db = getDatabase();
    const notificationsRef = ref(db, 'notifications');

    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const notificationsData = snapshot.val() || {};
      const notificationsArray = Object.entries(notificationsData)
        .map(([id, notification]) => ({
          id,
          ...notification
        }))
        .filter(notification => !notification.read)
        .sort((a, b) => b.timestamp - a.timestamp);

      setNotifications(notificationsArray);

      // Reproducir sonido de notificación si hay nuevas
      if (notificationsArray.length > 0 && document.readyState === 'complete') {
        const audio = new Audio('/notification-sound.mp3');
        audio.play().catch(e => {
          if (e.name !== 'NotAllowedError') {
            console.log('Error playing notification sound:', e);
          }
        });
      }
    });

    return () => unsubscribe();
  }, [usuario]);

  // Efecto para escuchar los mensajes del chat seleccionado
  useEffect(() => {
    if (!selectedChat || !usuario) return;

    const db = getDatabase();
    const chatMessagesRef = ref(db, `chats/${selectedChat.id}/messages`);

    const unsubscribe = onValue(chatMessagesRef, (snapshot) => {
      if (!snapshot.exists()) {
        setMessages([]);
        return;
      }

      const messagesData = snapshot.val();
      const messagesArray = Object.entries(messagesData).map(([id, msg]) => ({
        id,
        ...msg
      })).sort((a, b) => a.timestamp - b.timestamp);

      setMessages(messagesArray);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [selectedChat, usuario]);

  // Efecto para marcar mensajes como leídos cuando están visibles
  useEffect(() => {
    if (!selectedChat || !messagesContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const db = getDatabase();
          const unreadMessages = messages.filter(msg => !msg.read && !msg.isAssistant);
          
          if (unreadMessages.length > 0) {
            const updates = {};
            unreadMessages.forEach(msg => {
              if (msg.id) {
                updates[`chats/${selectedChat.id}/messages/${msg.id}/read`] = true;
              }
            });
            
            if (Object.keys(updates).length > 0) {
              update(ref(db), updates);
            }
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(messagesContainerRef.current);

    return () => observer.disconnect();
  }, [selectedChat, messages]);

  // Efecto para escuchar los chats activos asignados al asistente o que necesitan ayuda
  useEffect(() => {
    if (!usuario) return;

    const db = getDatabase();
    const chatsRef = ref(db, 'chats');

    const unsubscribe = onValue(chatsRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setActiveChats([]);
        return;
      }

      const chatsData = snapshot.val();
      const chatsArray = await Promise.all(
        Object.entries(chatsData)
          .filter(([_, chat]) => chat.needsAssistant || chat.assignedTo === usuario.uid)
          .map(async ([id, chat]) => {
            let clientInfo = { nombre: "Usuario" };
            if (chat.userId) {
              const userSnapshot = await get(ref(db, `usuarios/${chat.userId}`));
              if (userSnapshot.exists()) {
                clientInfo = userSnapshot.val();
              }
            }

            const messages = chat.messages || {};
            const unreadCount = Object.values(messages)
              .filter(msg => !msg.read && !msg.isAssistant)
              .length;

            return {
              id,
              ...chat,
              userName: clientInfo.nombre,
              unreadCount
            };
          })
      );

      setActiveChats(chatsArray.sort((a, b) => {
        // Primero los chats que necesitan asistencia
        if (a.needsAssistant && !b.needsAssistant) return -1;
        if (!a.needsAssistant && b.needsAssistant) return 1;
        // Luego por último mensaje
        return (b.lastMessage || 0) - (a.lastMessage || 0);
      }));
    });

    return () => unsubscribe();
  }, [usuario]);

  // Nuevo efecto: actualiza el chat seleccionado si cambia en activeChats
  useEffect(() => {
    if (!selectedChat) return;
    const updatedSelectedChat = activeChats.find(chat => chat.id === selectedChat.id);
    if (!updatedSelectedChat) return;
  
    // Comparación más estricta
    if (JSON.stringify(updatedSelectedChat) !== JSON.stringify(selectedChat)) {
      setSelectedChat(updatedSelectedChat);
    }
  }, [activeChats, selectedChat]);

  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);

    // Si el chat necesita asistente, asignarlo automáticamente
    if (chat.needsAssistant) {
      const db = getDatabase();
      await update(ref(db), {
        [`chats/${chat.id}/assignedTo`]: usuario.uid,
        [`chats/${chat.id}/needsAssistant`]: false
      });

      // Marcar las notificaciones relacionadas como leídas
      const notificationsToRemove = notifications.filter(n => n.chatId === chat.id);
      for (const notification of notificationsToRemove) {
        await remove(ref(db, `notifications/${notification.id}`));
      }
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    const db = getDatabase();
    const chatRef = ref(db, `chats/${selectedChat.id}/messages`);
    
    // Enviar mensaje
    push(chatRef, {
      text: message,
      timestamp: Date.now(),
      sender: usuario.uid,
      senderName: 'Asistente',
      isAssistant: true,
      read: false
    });

    // Actualizar lastMessage
    update(ref(db), {
      [`chats/${selectedChat.id}/lastMessage`]: Date.now()
    });

    setMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // En tu componente Assistant, modifica el efecto que maneja el estado online
// En tu componente Assistant, actualiza el efecto que maneja el estado online
useEffect(() => {
  if (!usuario || usuario.rol !== 'asistente') return;
  
  const db = getDatabase();
  const userOnlineRef = ref(db, `usuarios/${usuario.uid}/online`);

  // Marcar como online al conectarse
  set(userOnlineRef, true);

  // Configurar onDisconnect para marcar como offline al desconectarse
  onDisconnect(userOnlineRef).set(false);

  // Cleanup: al desmontar el componente
  return () => {
    // No necesitas hacer set(false) aquí porque onDisconnect se encargará
  };
}, [usuario]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteAllChats = async () => {
    if (!window.confirm('¿Estás seguro de que deseas borrar todos los chats? Esta acción no se puede deshacer.')) {
      return;
    }

    const db = getDatabase();
    const chatsRef = ref(db, 'chats');
    const notificationsRef = ref(db, 'notifications');
    
    // Delete all chats directly
    await set(chatsRef, null);
    // Delete all notifications
    await set(notificationsRef, null);
    
    // Clear the current chat selection
    setSelectedChat(null);
    setMessages([]);
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation(); // Evitar que se seleccione el chat al hacer clic en eliminar
    
    if (!window.confirm('¿Estás seguro de que deseas borrar este chat? Esta acción no se puede deshacer.')) {
      return;
    }

    const db = getDatabase();
    await update(ref(db), {
      [`chats/${chatId}`]: null
    });

    if (selectedChat?.id === chatId) {
      setSelectedChat(null);
      setMessages([]);
    }
  };

  return (
    <div className="assistant-chat-container">
      <div className="chat-list">
        <div className="chat-list-header">
          <h2>Chats Activos {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}</h2>
          <button onClick={handleDeleteAllChats} className="delete-all-chats-btn">
            <FaTrashAlt style={{ marginRight: 6 }} /> Borrar todos
          </button>
        </div>
        {activeChats.map((chat) => (
          <div
            key={chat.id}
            className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''} ${chat.needsAssistant ? 'needs-help' : ''}`}
            onClick={() => handleChatSelect(chat)}
          >
            <div className="chat-item-content">
              <div className="chat-item-header">
                <span className="chat-user">{chat.userName}</span>
                {chat.unreadCount > 0 && (
                  <span className="unread-badge">{chat.unreadCount}</span>
                )}
                {chat.needsAssistant && (
                  <span className="needs-assistance-badge">Necesita ayuda</span>
                )}
              </div>
              {chat.messages && Object.values(chat.messages).length > 0 && (
                <div className="chat-last-message">
                  {Object.values(chat.messages).slice(-1)[0].text.substring(0, 30)}...
                </div>
              )}
            </div>
            <button 
              className="delete-chat-btn"
              onClick={(e) => handleDeleteChat(chat.id, e)}
              title="Eliminar chat"
            >
              <FaTrashAlt />
            </button>
          </div>
        ))}
      </div>
  
      <div className="chat-messages">
        {selectedChat ? (
          <>
            <div className="messages-container" ref={messagesContainerRef}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${!msg.isAssistant ? 'bot' : 'assistant'}`}
                >
                  <div className="message-content">
                    <span className="message-sender">{msg.senderName}</span>
                    <p>{msg.text}</p>
                    <span className="message-time">
                      {formatTimestamp(msg.timestamp)}
                      {msg.read && msg.isAssistant && <span className="read-status">✓</span>}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="message-input"
              />
              <button type="submit" className="send-button">
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Selecciona un chat para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
};

  

export default Assistant; 