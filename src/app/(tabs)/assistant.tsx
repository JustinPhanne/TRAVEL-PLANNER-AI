import { useAuth } from "@clerk/expo";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sentry } from "@/lib/sentry";

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

function TypingDot({ delay }: { delay: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 300 }),
          withTiming(0, { duration: 300 }),
        ),
        -1,
      ),
    );
  }, [delay, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View className="h-2 w-2 rounded-full bg-gray-400" style={style} />;
}

function TypingIndicator() {
  return (
    <View className="flex-row items-center gap-1.5 py-0.5">
      <TypingDot delay={0} />
      <TypingDot delay={150} />
      <TypingDot delay={300} />
    </View>
  );
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  text: "Hi! I'm your travel companion. Ask me where to go, when to visit, what to pack, or anything else about planning your next trip.",
};

const ERROR_REPLY =
  "Sorry, I couldn't get an answer just now. Please try again in a moment.";

export default function AssistantScreen() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/assistant/messages", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);

        const { messages: stored } = (await res.json()) as {
          messages: Message[];
        };
        if (!cancelled && stored.length > 0) {
          setMessages([WELCOME_MESSAGE, ...stored]);
        }
      } catch (err) {
        Sentry.logger.error(
          Sentry.logger.fmt`Failed to load assistant history: ${err}`,
        );
      }
    })();

    return () => {
      cancelled = true;
    };
    // Load history once on mount only — refiring this while a reply is
    // streaming would overwrite the in-progress conversation with what's
    // currently persisted in the DB, wiping out the streaming placeholder.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSend = input.trim().length > 0 && !isStreaming;

  const appendToMessage = (id: string, chunk: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, text: m.text + chunk } : m)),
    );
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const history = messages;
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      text,
    };
    const replyId = `${Date.now()}-assistant`;

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: replyId, role: "assistant", text: "" },
    ]);
    setInput("");
    setIsStreaming(true);
    setStreamingId(replyId);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

    try {
      const token = await getToken();
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          history: history.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        appendToMessage(replyId, decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      Sentry.logger.error(Sentry.logger.fmt`Assistant chat request failed: ${err}`);
      const text =
        err instanceof Error && err.message ? err.message : ERROR_REPLY;
      setMessages((prev) =>
        prev.map((m) => (m.id === replyId ? { ...m, text } : m)),
      );
    } finally {
      setIsStreaming(false);
      setStreamingId(null);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  };

  const clearConversation = async () => {
    setIsClearing(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/assistant/messages", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      setMessages([WELCOME_MESSAGE]);
    } catch (err) {
      Sentry.logger.error(
        Sentry.logger.fmt`Failed to clear assistant history: ${err}`,
      );
      Alert.alert("Couldn't clear chat", "Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeletePress = () => {
    Alert.alert(
      "Clear conversation?",
      "This will permanently delete your chat history with the assistant.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: clearConversation },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <SafeAreaView edges={["top"]} className="bg-white">
        <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
          <View className="flex-row items-center gap-3">
            <View>
              <LinearGradient
                colors={["#5C90F6", "#2F5FE0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons
                  name="robot-happy"
                  size={26}
                  color="#ffffff"
                />
              </LinearGradient>
              <Ionicons
                name="sparkles"
                size={12}
                color="#BFD4FF"
                style={{ position: "absolute", top: -3, right: -3 }}
              />
            </View>

            <View>
              <Text className="text-[20px] font-extrabold text-[#12141F]">
                Assistant
              </Text>
              <Text className="text-[14px] text-gray-500">
                Your AI travel companion
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleDeletePress}
            disabled={isClearing}
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
          >
            <Ionicons name="trash-outline" size={18} color="#12141F" />
          </Pressable>
        </View>
      </SafeAreaView>

      <View className="h-[1px] bg-gray-100" />

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="gap-3 px-6 py-4"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.map((message) => (
          <View
            key={message.id}
            className={message.role === "user" ? "items-end" : "items-start"}
          >
            <View
              className={
                message.role === "user"
                  ? "max-w-[88%] rounded-[22px] rounded-br-[6px] bg-[#3B7CF0] px-4 py-3"
                  : "max-w-[88%] rounded-[22px] rounded-bl-[6px] bg-gray-100 px-4 py-3"
              }
            >
              {message.id === streamingId && message.text.length === 0 ? (
                <TypingIndicator />
              ) : (
                <Text
                  className={
                    message.role === "user"
                      ? "text-[15px] leading-[21px] text-white"
                      : "text-[15px] leading-[21px] text-[#12141F]"
                  }
                >
                  {message.text}
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <SafeAreaView edges={["bottom"]} className="bg-white px-6 pt-2">
        <View className="flex-row items-center gap-3 pb-3">
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            placeholder="Ask me anything about travel..."
            placeholderTextColor="#9CA3AF"
            className="h-12 flex-1 rounded-full bg-gray-100 px-5 text-[15px] text-[#12141F]"
          />
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            className={
              canSend
                ? "h-12 w-12 items-center justify-center rounded-full bg-[#3B7CF0] active:opacity-80"
                : "h-12 w-12 items-center justify-center rounded-full bg-gray-100"
            }
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={canSend ? "#ffffff" : "#9CA3AF"}
            />
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
