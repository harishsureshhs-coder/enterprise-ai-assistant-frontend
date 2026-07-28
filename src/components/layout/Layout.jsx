import Header from "./Header";
import Sidebar from "./Sidebar";

function Layout({
  children,
  user,
  chatHistory,
  activeConversationId,
  onHistoryClick,
  onNewChat,
}) {
  return (
    <div className="app">
      <Header user={user} />

      <main className="layout">
        <Sidebar
          chatHistory={chatHistory}
          activeConversationId={activeConversationId}
          onHistoryClick={onHistoryClick}
          onNewChat={onNewChat}
        />

        <section className="chat-area">
          {children}
        </section>
      </main>
    </div>
  );
}

export default Layout;