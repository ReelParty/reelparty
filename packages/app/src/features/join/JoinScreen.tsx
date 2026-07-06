"use client";

import { useState } from "react";
import { View } from "react-native";
import { trpc } from "@reelparty/api";
import { Button, ButtonText, Heading, Muted, Screen, Text } from "@reelparty/ui";
import { useAppNavigation } from "../../navigation/useAppNavigation";
import { BackBar } from "../../components/BackBar";
import { CodeInput } from "../../components/Input";
import { KeyboardFloatingFooter } from "../../components/KeyboardFloatingFooter";

export function JoinScreen() {
  const nav = useAppNavigation();
  const utils = trpc.useUtils();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const cont = async () => {
    setErr("");
    if (code.length !== 5) {
      setErr("Enter the 5-digit code");
      return;
    }
    setBusy(true);
    try {
      const party = await utils.party.get.fetch({ code });
      if (!party) {
        setErr("No party found with that code 🤔");
        return;
      }
      nav.goJoinName(code);
    } catch {
      setErr("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <BackBar onBack={nav.back} />
      <View className="mt-8 items-center">
        <Text style={{ fontSize: 56 }}>🎟️</Text>
        <Heading className="mt-2" style={{ fontSize: 26, color: "#1cb0f6" }}>
          Join the party
        </Heading>
        <Muted>Enter the 5-digit code</Muted>
      </View>
      <CodeInput
        className="mt-6"
        placeholder="—————"
        value={code}
        onChangeText={(t) => {
          setCode(t.replace(/\D/g, ""));
          setErr("");
        }}
        autoFocus
        returnKeyType="go"
        onSubmitEditing={cont}
      />
      {err ? (
        <Text className="mt-3 text-center font-bold" style={{ color: "#ff4b4b" }}>
          {err}
        </Text>
      ) : null}
      <KeyboardFloatingFooter>
        <Button
          tone="blue"
          full
          disabled={code.length !== 5 || busy}
          onPress={cont}
        >
          <ButtonText>CONTINUE</ButtonText>
        </Button>
      </KeyboardFloatingFooter>
    </Screen>
  );
}
