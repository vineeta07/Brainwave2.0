import { OnDemandChatBot } from "ondemand-react-chat-bot";

const ChatBot = () => {
  const contextVariables = [
    { key: "name", value: "Your name" },
    { key: "email", value: "example@gmail.com" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 60, // moved upwards
        right: 60, // moved left
        zIndex: 1000,
      }}
    >
      <OnDemandChatBot
        apiKey="pGdYFEt0VkaxknRL2H6F2ljfs7SsMRMw"
        botId="696c96f5592f8d406b8a2322"
        contextVariables={contextVariables}
      />
    </div>
  );
};

export default ChatBot;
