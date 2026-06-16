import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, MessageCircle, MoreVertical, Archive, ArchiveRestore, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useLanguage from '@/lib/useLanguage';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import GuestView from '@/lib/GuestView';
import moment from 'moment';

export default function Messages() {
    const { t, lang } = useLanguage();
    const { me, isLoading: authLoading } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [menuOpenId, setMenuOpenId] = useState(null);
    const messagesBoxRef = useRef(null);

    useEffect(() => {
        if (!me) return;
        const load = async () => {
            const data = await api.getConversations();
            setConversations(data || []);
            setLoading(false);
        };
        load();
    }, [me]);

    // Subscribe to conversation list updates (new messages, unread changes)
    useEffect(() => {
        if (!me) return;
        const channel = supabase
            .channel('conversations-updates')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'conversations',
            }, (payload) => {
                const updated = payload.new;
                setConversations(prev =>
                    prev.map(c => c.id === updated.id ? { ...c, ...updated } : c)
                );
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'conversations',
            }, (payload) => {
                const newConv = payload.new;
                if (newConv.participant_1 === me.email || newConv.participant_2 === me.email) {
                    setConversations(prev => [newConv, ...prev]);
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [me?.email]);

    useEffect(() => {
        if (activeConv) loadMessages(activeConv.id);
    }, [activeConv?.id]);

    // Subscribe to new messages in active conversation
    useEffect(() => {
        if (!activeConv) return;
        const channel = supabase
            .channel(`messages-${activeConv.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${activeConv.id}`,
            }, (payload) => {
                const incoming = payload.new;
                // Skip own messages — already added optimistically on send
                if (incoming.sender_email === me?.email) return;
                setMessages(prev => {
                    // Deduplicate by id
                    if (prev.some(m => m.id === incoming.id)) return prev;
                    return [...prev, incoming];
                });
                // Mark as read since the conversation is open
                api.markRead(activeConv.id);
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [activeConv?.id, me?.email]);

    // Scroll only the chat panel to the latest message — never the page itself
    useEffect(() => {
        const box = messagesBoxRef.current;
        if (box) box.scrollTop = box.scrollHeight;
    }, [messages]);

    const loadMessages = async (convId) => {
        const data = await api.getMessages(convId);
        setMessages(data || []);
        if (activeConv?.unread_by === me?.email) {
            await api.markRead(convId);
        }
    };

    const sendMessage = async () => {
        if (!newMsg.trim() || sending) return;
        setSending(true);
        const msg = await api.sendMessage(activeConv.id, newMsg.trim());
        setMessages(prev => [...prev, msg]);
        setNewMsg('');
        setSending(false);
    };

    const getOtherName = conv => conv.participant_1 === me?.email ? conv.participant_2_name : conv.participant_1_name;
    const isArchived = conv => (conv.archived_by || []).includes(me?.email);
    const isMuted = conv => (conv.muted_by || []).includes(me?.email);

    const visibleConvs = conversations.filter(c => showArchived ? isArchived(c) : !isArchived(c));
    const archivedCount = conversations.filter(isArchived).length;

    const handleArchive = async (conv, e) => {
        e.stopPropagation();
        setMenuOpenId(null);
        const updated = await api.toggleArchive(conv.id);
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, ...updated } : c));
        if (activeConv?.id === conv.id) setActiveConv(null);
    };

    const handleMute = async (conv, e) => {
        e.stopPropagation();
        setMenuOpenId(null);
        const updated = await api.toggleMute(conv.id);
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, ...updated } : c));
    };

    if (authLoading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
    if (!me) return <GuestView icon={MessageCircle} titleEl="Τα Μηνύματά σου" titleEn="Your Messages" descEl="Σύνδεσου για να δεις και να στείλεις μηνύματα." descEn="Sign in to view and send messages." />;
    if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

    return (
        <div style={{ background: '#eef4fd', minHeight: '100vh' }}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <h1 className="font-display text-3xl font-bold text-foreground mb-6">{t('chat_title')}</h1>

                <div className="bg-card rounded-2xl border border-border/50 overflow-hidden" style={{ height: 'calc(100vh - 240px)', minHeight: '400px' }}>
                    <div className="flex h-full">
                        <div className={`w-full sm:w-80 border-r border-border/50 flex flex-col ${activeConv ? 'hidden sm:flex' : 'flex'}`}>
                            <div className="p-4 border-b border-border/50 flex items-center justify-between">
                                <h2 className="font-semibold text-foreground">{showArchived ? (lang === 'el' ? 'Αρχειοθετημένα' : 'Archived') : t('chat_title')}</h2>
                                {(archivedCount > 0 || showArchived) && (
                                    <button onClick={() => { setShowArchived(s => !s); setActiveConv(null); }}
                                        className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                                        {showArchived
                                            ? (lang === 'el' ? '← Εισερχόμενα' : '← Inbox')
                                            : <><Archive className="w-3.5 h-3.5" />{lang === 'el' ? `Αρχείο (${archivedCount})` : `Archived (${archivedCount})`}</>}
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {visibleConvs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                        <MessageCircle className="w-10 h-10 text-muted-foreground/30 mb-3" />
                                        <p className="text-sm text-muted-foreground">
                                            {showArchived ? (lang === 'el' ? 'Κανένα αρχειοθετημένο' : 'No archived conversations') : t('chat_no_conversations')}
                                        </p>
                                    </div>
                                ) : visibleConvs.map(conv => {
                                    const muted = isMuted(conv);
                                    const archived = isArchived(conv);
                                    return (
                                    <div key={conv.id} onClick={() => setActiveConv(conv)}
                                        className={`relative w-full text-left p-4 border-b border-border/30 hover:bg-muted/50 transition-colors cursor-pointer ${activeConv?.id === conv.id ? 'bg-primary/5' : ''}`}>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-medium text-foreground text-sm truncate flex items-center gap-1.5">
                                                {getOtherName(conv)}
                                                {muted && <BellOff className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                                            </span>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                {conv.unread_by === me?.email && !muted && <span className="w-2 h-2 rounded-full bg-primary" />}
                                                <button onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === conv.id ? null : conv.id); }}
                                                    className="p-1 -mr-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        {conv.job_title && <p className="text-xs text-primary mt-0.5 truncate">{conv.job_title}</p>}
                                        {conv.last_message && <p className="text-xs text-muted-foreground mt-1 truncate">{conv.last_message}</p>}
                                        {menuOpenId === conv.id && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={e => { e.stopPropagation(); setMenuOpenId(null); }} />
                                                <div className="absolute right-3 top-10 z-20 w-44 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden py-1">
                                                    <button onClick={e => handleMute(conv, e)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted text-left">
                                                        {muted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                                        {muted ? (lang === 'el' ? 'Κατάργηση σίγασης' : 'Unmute') : (lang === 'el' ? 'Σίγαση' : 'Mute')}
                                                    </button>
                                                    <button onClick={e => handleArchive(conv, e)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted text-left">
                                                        {archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                                                        {archived ? (lang === 'el' ? 'Επαναφορά' : 'Unarchive') : (lang === 'el' ? 'Αρχειοθέτηση' : 'Archive')}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={`flex-1 flex flex-col ${!activeConv ? 'hidden sm:flex' : 'flex'}`}>
                            {activeConv ? (
                                <>
                                    <div className="p-4 border-b border-border/50 flex items-center gap-3">
                                        <button className="sm:hidden" onClick={() => setActiveConv(null)}><ArrowLeft className="w-5 h-5 text-muted-foreground" /></button>
                                        <div>
                                            <p className="font-medium text-foreground text-sm">{getOtherName(activeConv)}</p>
                                            {activeConv.job_title && <p className="text-xs text-muted-foreground">{activeConv.job_title}</p>}
                                        </div>
                                    </div>
                                    <div ref={messagesBoxRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {messages.map(msg => {
                                            const isMine = msg.sender_email === me?.email;
                                            return (
                                                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMine ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
                                                        <p className="text-sm leading-relaxed">{msg.content}</p>
                                                        <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{moment(msg.created_at).format('HH:mm')}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="p-4 border-t border-border/50">
                                        <div className="flex gap-2">
                                            <Input className="rounded-xl" placeholder={t('chat_placeholder')} value={newMsg}
                                                onChange={e => setNewMsg(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} />
                                            <Button onClick={sendMessage} disabled={!newMsg.trim() || sending} size="icon" className="rounded-xl flex-shrink-0"><Send className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <MessageCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                                        <p className="text-muted-foreground text-sm">{t('chat_start')}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
