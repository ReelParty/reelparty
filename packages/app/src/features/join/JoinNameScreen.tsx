"use client";

import { useEffect, useState } from "react";
import { View } from "react-native";
import { trpc } from "@reelparty/api";
import { Button, ButtonText, Heading, Muted, Screen, Subtle, Text } from "@reelparty/ui";
import { useUserId } from "../../hooks/useUserId";
import { useAppNavigation } from "../../navigation/useAppNavigation";
import { useApp, useToast } from "../../provider";
import { BackBar } from "../../components/BackBar";
import { Input } from "../../components/Input";
import { KeyboardFloatingFooter } from "../../components/KeyboardFloatingFooter";

export function JoinNameScreen({ code }: { code: string }) {
  const me = useUserId();
  const nav = useAppNavigation();
  const toast = useToast();
  const { session } = useApp();
  const joinMut = trpc.party.join.useMutation();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  // Prefill the name used last time (don't overwrite anything already typed).
  useEffect(() => {
    let active = true;
    void session.loadDisplayName().then((saved) => {
      if (active && saved) setName((prev) => prev || saved);
    });
    return () => {
      active = false;
    };
  }, [session]);

  const join = async () => {
    if (!me || busy) return;
    setBusy(true);
    try {
      await joinMut.mutateAsync({ code, id: me, name: name.trim() || "Guest" });
      void session.saveDisplayName(name);
      nav.goParty(code);
    } catch {
      toast("Couldn't join the party");
      setBusy(false);
    }
  };

  return (
    <Screen>
      <BackBar onBack={nav.back} />
      <View className="mt-8 items-center">
        <Text style={{ fontSize: 56 }}>🙋</Text>
        <Heading className="mt-2" style={{ fontSize: 26, color: "#1cb0f6" }}>
          Almost in!
        </Heading>
        <Muted>What&apos;s your name?</Muted>
        {code ? <Subtle className="mt-1.5 text-xs">Party code {code}</Subtle> : null}
      </View>
      <Input
        className="mt-6"
        placeholder="Your name"
        maxLength={16}
        value={name}
        onChangeText={setName}
        autoFocus
        returnKeyType="go"
        onSubmitEditing={join}
      />
      <KeyboardFloatingFooter>
        <Button tone="green" full disabled={!name.trim() || busy} onPress={join}>
          <ButtonText>JOIN PARTY 🎉</ButtonText>
        </Button>
      </KeyboardFloatingFooter>
    </Screen>
  );
}
