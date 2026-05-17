import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  MoreVertical, 
  Phone, 
  Video, 
  Search,
  Users,
  User,
  Smile
} from 'lucide-react';
import { cn } from '../../utils/utils';

const dummyMessages = [
  { id: 1, sender: 'Dr. Sharma', role: 'mentor', text: 'Hi team, please ensure the SRS is updated by tomorrow.', time: '10:00 AM', isMe: false },
  { id: 2, sender: 'Piyush Mishra', role: 'student', text: 'Yes sir, John is working on the diagrams.', time: '10:05 AM', isMe: true },
  { id: 3, sender: 'John Doe', role: 'student', text: 'I will push the diagrams in an hour.', time: '10:15 AM', isMe: false },
  { id: 4, sender: 'Dr. Sharma', role: 'mentor', text: 'Great. Let me know if you need any help with the use cases.', time: '10:20 AM', isMe: false },
];

const ProjectChat = () => {
  const [messages, setMessages] = useState(dummyMessages);
  const [newMessage, setNewMessage] = useState('');
  const [activeChannel, setActiveChannel] = useState('team'); // 'team' or 'mentor'
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'Piyush Mishra',
      role: 'student',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');

    // Simulate reply dummy
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: activeChannel === 'mentor' ? 'Dr. Sharma' : 'John Doe',
        role: activeChannel === 'mentor' ? 'mentor' : 'student',
        text: 'Received, looking into it now!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: false
      }]);
    }, 2000);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      
      {/* Left Sidebar - Channels */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/50 hidden md:flex shrink-0">
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full pl-9 pr-3 py-2 bg-slate-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-2">Channels</div>
          
          <button 
            onClick={() => setActiveChannel('team')}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
              activeChannel === 'team' ? "bg-white shadow-sm border border-slate-200" : "hover:bg-slate-100/50 border border-transparent"
            )}
          >
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-semibold text-slate-900 text-sm truncate">Team Alpha</span>
                <span className="text-[10px] font-medium text-slate-500">10:20 AM</span>
              </div>
              <p className="text-xs text-slate-500 truncate">John: I will push the diagrams...</p>
            </div>
          </button>

          <button 
            onClick={() => setActiveChannel('mentor')}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
              activeChannel === 'mentor' ? "bg-white shadow-sm border border-slate-200" : "hover:bg-slate-100/50 border border-transparent"
            )}
          >
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-semibold text-slate-900 text-sm truncate">Dr. Sharma (Mentor)</span>
                <span className="text-[10px] font-medium text-slate-500">Yesterday</span>
              </div>
              <p className="text-xs text-slate-500 truncate">Great work on the presentation.</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm",
              activeChannel === 'team' ? "bg-blue-600" : "bg-emerald-600"
            )}>
              {activeChannel === 'team' ? <Users size={20} /> : 'S'}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">{activeChannel === 'team' ? 'Team Alpha' : 'Dr. Sharma'}</h2>
              <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"><Phone size={18} /></button>
            <button className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"><Video size={18} /></button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"><MoreVertical size={18} /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 space-y-6 custom-scrollbar">
          <div className="text-center">
            <span className="px-3 py-1 bg-slate-200/50 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-wider">Today</span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex w-full", msg.isMe ? "justify-end" : "justify-start")}>
              <div className={cn("flex flex-col max-w-[75%] sm:max-w-[60%]", msg.isMe ? "items-end" : "items-start")}>
                {!msg.isMe && (
                  <span className="text-[10px] font-bold text-slate-500 ml-1 mb-1">{msg.sender}</span>
                )}
                <div className={cn(
                  "px-4 py-2.5 rounded-2xl shadow-sm text-sm",
                  msg.isMe 
                    ? "bg-blue-600 text-white rounded-br-sm" 
                    : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm"
                )}>
                  {msg.text}
                </div>
                <span className="text-[10px] font-medium text-slate-400 mt-1 mx-1">{msg.time}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex w-full justify-start animate-in fade-in duration-200">
              <div className="flex flex-col items-start">
                 <span className="text-[10px] font-bold text-slate-500 ml-1 mb-1">{activeChannel === 'mentor' ? 'Dr. Sharma' : 'John Doe'}</span>
                 <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1">
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                 </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
            <button type="button" className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
              <Paperclip size={20} />
            </button>
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-1 outline-none text-slate-700"
            />
            <button type="button" className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors hidden sm:block">
              <Smile size={20} />
            </button>
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] font-medium text-slate-400 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Socket.io Ready
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectChat;
