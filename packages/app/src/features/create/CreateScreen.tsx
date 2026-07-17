"use client";

import { useEffect, useState } from "react";
import { View } from "react-native";
import { trpc } from "@reelparty/api";
import { code5 } from "@reelparty/shared";
import { Button, ButtonText, Heading, Muted, Screen, Text } from "@reelparty/ui";
import { useUserId } from "../../hooks/useUserId";
import { useAppNavigation } from "../../navigation/useAppNavigation";
import { useApp, useToast } from "../../provider";
import { BackBar } from "../../components/BackBar";
import { Input } from "../../components/Input";
import { KeyboardFloatingFooter } from "../../components/KeyboardFloatingFooter";

export function CreateScreen() {
  const me = useUserId();
  const nav = useAppNavigation();
  const toast = useToast();
  const { session } = useApp();
  const utils = trpc.useUtils();
  const createMut = trpc.party.create.useMutation();
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

  const create = async () => {
    if (!me || busy) return;
    setBusy(true);
    try {
      let code = code5();
      for (let i = 0; i < 5; i++) {
        const existing = await utils.party.get.fetch({ code });
        if (!existing) break;
        code = code5();
      }
      await createMut.mutateAsync({
        code,
        hostId: me,
        hostName: name.trim() || "Host",
      });
      void session.saveDisplayName(name);
      nav.goParty(code);
    } catch {
      toast("Couldn't create the party");
      setBusy(false);
    }
  };

  return (
    <Screen>
      <BackBar onBack={nav.back} />
      <View className="mt-8 items-center">
        <Text style={{ fontSize: 56 }}>👑</Text>
        <Heading className="mt-2" style={{ fontSize: 26, color: "#58cc02" }}>
          You&apos;re the host!
        </Heading>
        <Muted>What should we call you?</Muted>
      </View>
      <Input
        className="mt-6"
        placeholder="Your name"
        maxLength={16}
        value={name}
        onChangeText={setName}
        autoFocus
        returnKeyType="go"
        onSubmitEditing={create}
      />
      <KeyboardFloatingFooter>
        <Button
          tone="green"
          full
          disabled={!name.trim() || busy}
          onPress={create}
        >
          <ButtonText>LET&apos;S GO 🚀</ButtonText>
        </Button>
      </KeyboardFloatingFooter>
    </Screen>
  );
}
