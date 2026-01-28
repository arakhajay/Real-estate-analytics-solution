"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";

function classNames(...classes: (string | undefined | null | boolean)[]) {
    return classes.filter(Boolean).join(" ");
}

interface Message {
    role: "user" | "assistant";
    content: string;
    source?: string;
}

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "👋 Hi! I'm your **ASA Assistant**. I can help you with:\n\n- 📊 Portfolio data & analytics\n- 🏠 Property & unit information\n- 👥 Tenant details & risk analysis\n- 📈 Market trends & forecasts\n\nAsk me anything!" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setLoading(true);

        try {
            const token = localStorage.getItem("token");

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token ? `Bearer ${token}` : ""
                },
                body: JSON.stringify({ message: userMsg })
            });

            const data = await res.json();

            setMessages(prev => [...prev, {
                role: "assistant",
                content: data.response || "Sorry, I couldn't process that.",
                source: data.source
            }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Error connecting to server." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={classNames(
                    "fixed bottom-6 right-6 p-4 rounded-full shadow-xl transition-all duration-300 z-50",
                    isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-indigo-600 hover:bg-indigo-700 hover:scale-110"
                )}
            >
                {isOpen ? <X className="text-white w-6 h-6" /> : <MessageCircle className="text-white w-6 h-6" />}
            </button>

            {/* Chat Window */}
            <div
                className={classNames(
                    "fixed bottom-24 right-6 w-[420px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col transition-all duration-300 transform z-50 overflow-hidden",
                    isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95 pointer-events-none"
                )}
                style={{ height: "550px" }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-full">
                        <Bot className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">ASA Assistant</h3>
                        <p className="text-indigo-200 text-xs">Powered by RAG & GenAI</p>
                    </div>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={classNames(
                                "flex w-full",
                                msg.role === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={classNames(
                                    "max-w-[85%] p-3 rounded-2xl text-sm shadow-sm",
                                    msg.role === "user"
                                        ? "bg-indigo-600 text-white rounded-tr-none"
                                        : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                                )}
                            >
                                {msg.role === "assistant" ? (
                                    <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-table:text-xs prose-th:p-1 prose-td:p-1 prose-th:bg-gray-100 prose-tr:border-b prose-strong:text-indigo-700">
                                        <ReactMarkdown
                                            components={{
                                                // Custom table styling
                                                table: ({ children }) => (
                                                    <div className="overflow-x-auto my-2">
                                                        <table className="min-w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                                                            {children}
                                                        </table>
                                                    </div>
                                                ),
                                                th: ({ children }) => (
                                                    <th className="bg-indigo-50 text-indigo-800 px-2 py-1 text-left font-medium border-b border-gray-200">
                                                        {children}
                                                    </th>
                                                ),
                                                td: ({ children }) => (
                                                    <td className="px-2 py-1 border-b border-gray-100">
                                                        {children}
                                                    </td>
                                                ),
                                                // Styled lists
                                                ul: ({ children }) => (
                                                    <ul className="list-disc pl-4 space-y-0.5 my-1">
                                                        {children}
                                                    </ul>
                                                ),
                                                ol: ({ children }) => (
                                                    <ol className="list-decimal pl-4 space-y-0.5 my-1">
                                                        {children}
                                                    </ol>
                                                ),
                                                // Headers
                                                h1: ({ children }) => <h1 className="text-base font-bold text-gray-900 mt-2 mb-1">{children}</h1>,
                                                h2: ({ children }) => <h2 className="text-sm font-bold text-gray-900 mt-2 mb-1">{children}</h2>,
                                                h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-800 mt-1 mb-0.5">{children}</h3>,
                                                // Strong
                                                strong: ({ children }) => <strong className="font-semibold text-indigo-700">{children}</strong>,
                                                // Code blocks
                                                code: ({ children }) => (
                                                    <code className="bg-gray-100 text-indigo-600 px-1 py-0.5 rounded text-xs font-mono">
                                                        {children}
                                                    </code>
                                                ),
                                                // Paragraphs with proper spacing
                                                p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <p>{msg.content}</p>
                                )}
                                {msg.source && (
                                    <p className="text-[10px] mt-2 pt-1 flex items-center gap-1 border-t border-gray-100 text-gray-400">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                        {msg.source}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything about your portfolio..."
                            className="w-full pl-4 pr-12 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm text-gray-800 placeholder:text-gray-400"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="absolute right-2 top-2 p-1.5 bg-indigo-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                        >
                            <Send className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
