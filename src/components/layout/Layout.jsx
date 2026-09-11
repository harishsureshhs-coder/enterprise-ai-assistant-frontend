import Header from "./Header";
import Sidebar from "./Sidebar";

function Layout({
  children,
  user,
  chatHistory,
  activeConversationId,
  onHistoryClick,
  onNewChat,
  headerSubtitle = "Executive Agent",
  sidebarCollapsible = false,
}) {
  return (
    <div className="app">
      <Header
        user={user}
        subtitle={headerSubtitle}
      />

      <main
        className="layout"
        style={{
          display: "flex",
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Sidebar
          chatHistory={chatHistory}
          activeConversationId={activeConversationId}
          onHistoryClick={onHistoryClick}
          onNewChat={onNewChat}
          collapsible={sidebarCollapsible}
        />

        <section
          className="chat-area"
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {children}
        </section>
      </main>
    </div>
  );
}

export default Layout;
