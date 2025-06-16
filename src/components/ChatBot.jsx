import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from "../context/AuthContext";
import { getDatabase, ref, push, onValue, set, update, get } from "firebase/database";
import '../styles/chatbot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const { usuario } = useContext(AuthContext);
  const [chatId, setChatId] = useState(null);
  const [hasAssistant, setHasAssistant] = useState(false);
  const [consecutiveUnknownResponses, setConsecutiveUnknownResponses] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hayAsistenteEnLinea, setHayAsistenteEnLinea] = useState(false);
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
        Object.entries(chatData.messages).map(([msgId, msg]) => ({ id: msgId, ...msg })) : [];
      setMessages(messagesArray);
      setHasAssistant(!!chatData.assignedTo);

      const unreadMessages = messagesArray.filter(msg => !msg.read && msg.isAssistant);
      setUnreadCount(unreadMessages.length);

      if (isOpen && unreadMessages.length > 0) {
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
    });

    return () => unsubscribe();
  }, [chatId, isOpen]);

  useEffect(() => {
    const db = getDatabase();
    const usuariosRef = ref(db, 'usuarios');
    const unsubscribe = onValue(usuariosRef, (snapshot) => {
      const usuarios = Object.values(snapshot.val() || {});
      const asistentesEnLinea = usuarios.filter(u => u.rol === 'asistente' && u.activo === true && u.online === true);
      setHayAsistenteEnLinea(asistentesEnLinea.length > 0);
    });
    return () => unsubscribe();
  }, []);

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

    const sendMessageToChat = (chatRefPath, message, isBot = false, isAssistant = false) => {
      push(ref(db, `${chatRefPath}/messages`), {
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

    await set(ref(db, `chats/${currentChatId}/lastMessage`), Date.now());
    sendMessageToChat(`chats/${currentChatId}`, inputMessage);
    setInputMessage('');

    if (hasAssistant) return;

    const chatRef = ref(db, `chats/${currentChatId}`);
    const chatSnap = await get(chatRef);
    if (chatSnap.exists() && chatSnap.val().needsAssistant) return;

    const lowerInput = inputMessage.trim().toLowerCase();
    const botResponse = getBotResponse(lowerInput);
    const solicitaAsistente = lowerInput === "5" || lowerInput.includes("asistente");

    if (botResponse) {
      setConsecutiveUnknownResponses(0);
      setTimeout(() => {
        sendMessageToChat(`chats/${currentChatId}`, botResponse, true);
      }, 1000);
    } else if (solicitaAsistente || consecutiveUnknownResponses + 1 >= 2) {
      setTimeout(async () => {
        if (hayAsistenteEnLinea) {
          sendMessageToChat(`chats/${currentChatId}`, "Parece que necesitas ayuda más específica. Te conectaré con un asistente para ayudarte mejor. 👨‍💼", true);
          await set(ref(db, `chats/${currentChatId}/needsAssistant`), true);
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
          sendMessageToChat(`chats/${currentChatId}`, "Por el momento no hay asistentes en línea. Un asesor se comunicará contigo en cuanto sea posible.", true);
        }
      }, 1000);
    } else {
      setConsecutiveUnknownResponses(prev => prev + 1);
      setTimeout(() => {
        sendMessageToChat(`chats/${currentChatId}`, "No estoy seguro de cómo ayudarte con eso. Puedes escribir 'menu' para ver las opciones o 'asistente' si necesitas hablar con alguien. 🤔", true);
      }, 1000);
    }
  };

  const menuOpciones = {
    "1": "📦 *Información de envíos:* Realizamos envíos en 24-48h hábiles. El costo depende de tu ubicación.",
    "2": "🔁 *Devoluciones:* Tienes 30 días para devolver tu producto. Debe estar sin usar y con su empaque original.",
    "3": "💳 *Pagos:* Aceptamos tarjetas de crédito/débito y transferencias bancarias.",
    "4": "🏷️ *Descuentos:* Ofrecemos promociones en compras mayores a $1000 MXN.",
    "5": null
  };

  const getBotResponse = (message) => {
    if (["menu", "menú", "opciones"].includes(message)) {
      return mostrarMenuOpciones();
    }
    if (["1", "2", "3", "4", "5"].includes(message)) {
      return menuOpciones[message];
    }
    const respuestasRapidas = {
      "hola": "¡Hola! Escribe el número de una opción del menú o escribe 'menu' para volver a verlo.",
      "gracias": "¡De nada! Si necesitas más ayuda, escribe 'menu' o el número de una opción.",
      "adios": "¡Hasta luego! 👋",
      "adiós": "¡Hasta luego! 👋"
    };
    return respuestasRapidas[message] || null;
  };

  const mostrarMenuOpciones = () => (
    "¿En qué puedo ayudarte? Escribe el número de la opción que deseas:\n" +
    "1️⃣ Información de envíos\n" +
    "2️⃣ Políticas de devolución\n" +
    "3️⃣ Métodos de pago\n" +
    "4️⃣ Descuentos y promociones\n" +
    "5️⃣ Hablar con un asistente"
  );

  useEffect(() => {
    if (messages.length === 0) {
      const bienvenida = "¡Hola! 👋 Soy el asistente virtual de M&J SHOP. ¿En qué puedo ayudarte?";
      const menu = mostrarMenuOpciones();
      setMessages([
        { text: bienvenida, isBot: true },
        { text: menu, isBot: true }
      ]);
    }
  }, []);

  return (
    <div className="chatbot-container">
      {!isOpen ? (
        <div className="chat-button-container">
          <button className="chatbot-button" onClick={() => setIsOpen(true)}>
            💬 ¿Necesitas ayuda?
          </button>
          {unreadCount > 0 && <span className="unread-bubble">{unreadCount}</span>}
        </div>
      ) : (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>Asistente Virtual</h3>
            <button className="close-button" onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className="messages-container" ref={messagesContainerRef}>
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.isBot || message.isAssistant ? 'bot' : 'user'}`}>
                <div className="message-bubble">{message.text}</div>
                {message.timestamp && (
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString('es-MX', {
                      hour: '2-digit', minute: '2-digit'
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
            <button type="submit" className="send-button">Enviar</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
