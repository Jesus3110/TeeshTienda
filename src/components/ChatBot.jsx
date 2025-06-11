import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from "../context/AuthContext";
import { getDatabase, ref, push, onValue, set, update, get, child } from "firebase/database";
import '../styles/chatbot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "¡Hola! 👋 Soy el asistente virtual de M&J SHOP. ¿En qué puedo ayudarte?", isBot: true }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const { usuario } = useContext(AuthContext);
  const [chatId, setChatId] = useState(null);
  const [hasAssistant, setHasAssistant] = useState(false);
  const [consecutiveUnknownResponses, setConsecutiveUnknownResponses] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;

    const db = getDatabase();
    const chatRef = ref(db, `chats/${chatId}`);

    const unsubscribe = onValue(chatRef, (snapshot) => {
      const chatData = snapshot.val();
      if (!chatData) return;

      const messagesArray = chatData.messages ? 
        Object.entries(chatData.messages).map(([msgId, msg]) => ({
          id: msgId,
          ...msg
        })) : [];
      setMessages(messagesArray);
      setHasAssistant(!!chatData.assignedTo);

      // Contar mensajes no leídos del asistente
      const unreadMessages = messagesArray.filter(msg => !msg.read && msg.isAssistant);
      setUnreadCount(unreadMessages.length);

      // Solo marcar mensajes como leídos si el chat está abierto
      if (isOpen) {
        if (unreadMessages.length > 0) {
          const updates = {};
          unreadMessages.forEach(msg => {
            if (msg.id) {
              updates[`chats/${chatId}/messages/${msg.id}/read`] = true;
            }
          });
          
          if (Object.keys(updates).length > 0) {
            update(ref(db), updates);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [chatId, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const db = getDatabase();
    let currentChatId = chatId;

    const sendMessageToChat = (chatRef, message, isBot = false, isAssistant = false) => {
      push(ref(db, `${chatRef}/messages`), {
        text: message,
        timestamp: Date.now(),
        sender: usuario?.uid || 'anonymous',
        senderName: usuario?.nombre || 'Usuario',
        isBot,
        isAssistant,
        read: false
      });
    };

    if (!currentChatId) {
      const newChatRef = push(ref(db, 'chats'));
      currentChatId = newChatRef.key;
      setChatId(currentChatId);

      await set(newChatRef, {
        userId: usuario?.uid || 'anonymous',
        userName: usuario?.nombre || 'Usuario',
        createdAt: Date.now(),
        needsAssistant: false,
        lastMessage: Date.now()
      });
    }

    // Actualizar lastMessage
    await set(ref(db, `chats/${currentChatId}/lastMessage`), Date.now());

    // Enviar mensaje del usuario
    sendMessageToChat(`chats/${currentChatId}`, inputMessage);
    setInputMessage('');

    // Si ya hay un asistente asignado, no enviar respuesta del bot
    if (hasAssistant) return;

    // --- NUEVO: Si ya se solicitó un asistente, no responder nada especial ---
    const chatRef = ref(db, `chats/${currentChatId}`);
    const chatSnap = await get(chatRef);
    if (chatSnap.exists() && chatSnap.val().needsAssistant) {
      return; // Ya se pidió un asistente, no responder más
    }
    // --- FIN NUEVO ---

    // Obtener respuesta del bot
    const botResponse = getBotResponse(inputMessage.toLowerCase());
    
    if (botResponse) {
      setConsecutiveUnknownResponses(0);
      setTimeout(() => {
        sendMessageToChat(`chats/${currentChatId}`, botResponse, true);
      }, 1000);
    } else {
      const newCount = consecutiveUnknownResponses + 1;
      setConsecutiveUnknownResponses(newCount);

      if (newCount >= 2 || inputMessage.toLowerCase().includes('asistente')) {
        setTimeout(async () => {
          // --- NUEVO: Verificar si hay asistentes en línea ---
          const usuariosRef = ref(db, 'usuarios');
          const snapshot = await get(usuariosRef);
          let hayAsistenteEnLinea = false;
          if (snapshot.exists()) {
            const usuarios = Object.values(snapshot.val());
            // Solo asistentes activos y online
            hayAsistenteEnLinea = usuarios.some(u => u.rol === 'asistente' && u.activo === true && u.online === true);
          }

          if (hayAsistenteEnLinea) {
            sendMessageToChat(
              `chats/${currentChatId}`,
              "Parece que necesitas ayuda más específica. Te conectaré con un asistente para ayudarte mejor. 👨‍💼",
              true
            );
            // Marcar el chat como necesitando asistente
            await set(ref(db, `chats/${currentChatId}/needsAssistant`), true);
            // Crear notificación para los asistentes
            const notifRef = push(ref(db, 'notifications'));
            await set(notifRef, {
              type: 'new_chat',
              chatId: currentChatId,
              userName: usuario?.nombre || 'Usuario',
              message: inputMessage,
              timestamp: Date.now(),
              read: false
            });
          } else {
            sendMessageToChat(
              `chats/${currentChatId}`,
              "Por el momento no hay asistentes en línea. Un asesor se comunicará contigo en cuanto sea posible.",
              true
            );
          }
        }, 1000);
      } else {
        setTimeout(() => {
          sendMessageToChat(
            `chats/${currentChatId}`,
            "No estoy seguro de cómo ayudarte con eso. ¿Podrías reformular tu pregunta? Si necesitas ayuda más específica, puedes escribir 'asistente' para hablar con una persona. 🤔",
            true
          );
        }, 1000);
      }
    }
  };

  const getBotResponse = (message) => {
    const responses = {
      'hola': '¡Hola! ¿En qué puedo ayudarte hoy? 😊',
      'envio': 'Los envíos se realizan en 24-48 horas hábiles. El costo depende de tu ubicación. 🚚',
      'envío': 'Los envíos se realizan en 24-48 horas hábiles. El costo depende de tu ubicación. 🚚',
      'envios': 'Los envíos se realizan en 24-48 horas hábiles. El costo depende de tu ubicación. 🚚',
      'envíos': 'Los envíos se realizan en 24-48 horas hábiles. El costo depende de tu ubicación. 🚚',
      'devolución': 'Tienes 30 días para devolver tu producto. Debe estar sin usar y en su empaque original. 📦',
      'devolucion': 'Tienes 30 días para devolver tu producto. Debe estar sin usar y en su empaque original. 📦',
      'devoluciones': 'Tienes 30 días para devolver tu producto. Debe estar sin usar y en su empaque original. 📦',
      'pago': 'Aceptamos tarjetas de crédito/débito y transferencias bancarias. 💳',
      'pagos': 'Aceptamos tarjetas de crédito/débito y transferencias bancarias. 💳',
      'descuento': 'Tenemos descuentos especiales en compras mayores a $1000. 🏷️',
      'descuentos': 'Tenemos descuentos especiales en compras mayores a $1000. 🏷️',
      'asistente': null, // Retornamos null para activar la conexión con asistente
      'ayuda': '¿En qué puedo ayudarte? Puedo informarte sobre envíos, devoluciones, pagos o descuentos. 💁‍♂️',
      'gracias': '¡De nada! ¿Hay algo más en lo que pueda ayudarte? 😊',
      'adios': '¡Hasta luego! Si necesitas más ayuda, no dudes en volver. 👋',
      'adiós': '¡Hasta luego! Si necesitas más ayuda, no dudes en volver. 👋',
    };

    const key = Object.keys(responses).find(k => 
      message.includes(k) || message === k
    );

    return responses[key];
  };

  return (
    <div className="chatbot-container">
      {!isOpen ? (
        <div className="chat-button-container">
          <button 
            className="chatbot-button"
            onClick={() => setIsOpen(true)}
          >
            💬 ¿Necesitas ayuda?
          </button>
          {unreadCount > 0 && (
            <span className="unread-bubble">{unreadCount}</span>
          )}
        </div>
      ) : (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>Asistente Virtual</h3>
            <button 
              className="close-button"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="messages-container" ref={messagesContainerRef}>
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`message ${message.isBot || message.isAssistant ? 'bot' : 'user'}`}
              >
                <div className="message-bubble">
                  {message.text}
                </div>
                {message.timestamp && (
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {message.read && !message.isBot && !message.isAssistant && <span className="read-status">✓</span>}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="input-container">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="message-input"
            />
            <button type="submit" className="send-button">
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot; 